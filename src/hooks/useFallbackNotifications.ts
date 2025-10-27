'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface FallbackNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  eventId?: string;
  actionUrl?: string;
}

interface UseFallbackNotificationsReturn {
  notifications: FallbackNotification[];
  unreadCount: number;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearNotifications: () => void;
}

export const useFallbackNotifications = (): UseFallbackNotificationsReturn => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<FallbackNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/notifications?limit=10');
      if (!response.ok) return;

      const data = await response.json();
      const newNotifications = data.notifications || [];

      // Check if there are new notifications
      const hasNewNotifications = newNotifications.length > 0 &&
        (notifications.length === 0 ||
         newNotifications[0]?.id !== notifications[0]?.id);

      if (hasNewNotifications) {
        setNotifications(newNotifications);

        // Show browser notification for new notifications
        const unreadNotifs = newNotifications.filter((n: FallbackNotification) => !n.isRead);
        if (unreadNotifs.length > 0) {
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('UKM Band Bekasi', {
              body: unreadNotifs[0].message,
              icon: '/icons/favicon.png',
              badge: '/icons/favicon.png',
              tag: unreadNotifs[0].id,
            });
          }
        }
      }

      setIsConnected(true);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setIsConnected(false);
    }
  }, [session?.user?.id, notifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Set up polling
  useEffect(() => {
    if (!session?.user?.id) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Set up polling every 30 seconds
    pollingRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [session?.user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    clearNotifications,
  };
};