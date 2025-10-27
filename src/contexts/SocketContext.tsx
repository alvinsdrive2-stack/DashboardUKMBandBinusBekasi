'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useBrowserNotification } from '@/hooks/useBrowserNotification';
import { Notification } from '@/generated/prisma';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  onNewNotification: (callback: (notification: Notification) => void) => void;
  onNotificationRead: (callback: (data: { notificationId: string; userId: string }) => void) => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  onNewNotification: () => {},
  onNotificationRead: () => {},
  clearNotifications: () => {}
});

export const useSocketContext = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const { showNotification } = useBrowserNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);

      // Update unread count if notification is unread
      if (!notification.isRead) {
        setUnreadCount(prev => prev + 1);
      }

      // Show browser notification if supported
      showNotification(notification.title, {
        body: notification.message
      });
    };

    // Listen for notification read events
    const handleNotificationRead = (data: { notificationId: string; userId: string }) => {
      console.log('Notification read:', data);
      setNotifications(prev =>
        prev.map(n =>
          n.id === data.notificationId ? { ...n, isRead: true } : n
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Register event listeners
    socket.on('new-notification', handleNewNotification);
    socket.on('notification-read', handleNotificationRead);

    // Remove unread-count-update listener as it's not implemented on server

    return () => {
      socket.off('new-notification', handleNewNotification);
      socket.off('notification-read', handleNotificationRead);
    };
  }, [socket]);

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const onNewNotification = (callback: (notification: Notification) => void) => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      callback(notification);
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  };

  const onNotificationRead = (callback: (data: { notificationId: string; userId: string }) => void) => {
    if (!socket) return;

    const handleNotificationRead = (data: { notificationId: string; userId: string }) => {
      callback(data);
    };

    socket.on('notification-read', handleNotificationRead);

    return () => {
      socket.off('notification-read', handleNotificationRead);
    };
  };

  
  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    onNewNotification,
    onNotificationRead,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}