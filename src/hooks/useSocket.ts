'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinEvent: (eventId: string) => void;
  leaveEvent: (eventId: string) => void;
  markAsRead: (notificationId: string) => void;
  emitNotification: (data: any) => void;
}

export const useSocket = (): UseSocketReturn => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const connectionAttemptsRef = useRef(0);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectSocket = useCallback((userId: string, userName?: string) => {
    if (typeof window === 'undefined') return;

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);

    connectionAttemptsRef.current += 1;
    console.log(`🔌 Socket connection attempt ${connectionAttemptsRef.current} for user:`, userName || 'Unknown', userId);

    // If already connected to same user, don't reconnect
    if (socketRef.current?.connected && currentUserIdRef.current === userId) {
      console.log('⚡ Socket already connected to user:', userId);
      return;
    }

    // Disconnect existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');

    const socketInstance = io(baseUrl, {
      path: '/api/socket/io',
      transports: ['polling'], // only polling untuk stabilitas maksimal
      auth: { userId, userName },
      timeout: 30000, // shorter timeout untuk faster fallback
      reconnection: false, // disable auto-reconnect untuk manual control
      forceNew: true,
      autoConnect: true,
      rememberUpgrade: false,

      // Production-specific settings
      upgrade: false,
      forceJSONP: false,
    });

    socketRef.current = socketInstance;
    currentUserIdRef.current = userId;
    setSocket(socketInstance);

    // Set fallback timeout - if connection doesn't succeed in 10 seconds, switch to fallback
    fallbackTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ Socket connection timeout, switching to fallback mode');
      setUseFallback(true);
      setIsConnected(false);

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }, 10000);

    socketInstance.on('connect', () => {
      console.log('✅ Connected to socket server with ID:', socketInstance.id);
      setIsConnected(true);
      setUseFallback(false);
      connectionAttemptsRef.current = 0;

      // Clear fallback timeout on successful connection
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket server. Reason:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connect error:', {
        message: error.message,
        type: error.type,
        attempt: connectionAttemptsRef.current
      });
      setIsConnected(false);

      // If this is a server error and we've tried multiple times, switch to fallback
      if (error.message === 'server error' && connectionAttemptsRef.current >= 3) {
        console.log('⚠️ Persistent server errors, switching to fallback mode');
        setUseFallback(true);
      }
    });

    socketInstance.on('error', (error) => {
      console.error('❌ Socket error:', {
        message: error.message,
        type: error.type
      });
      setIsConnected(false);
    });
  }, []);

  const disconnectSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (socketRef.current) {
      console.log('🔌 Disconnecting socket for user:', currentUserIdRef.current);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    currentUserIdRef.current = null;
    setSocket(null);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    const userName = session?.user?.name;

    if (!userId) {
      disconnectSocket();
      return;
    }

    // Add longer delay for production to avoid server overload
    const delay = process.env.NODE_ENV === 'production' ? 2000 : 100;

    reconnectTimeoutRef.current = setTimeout(() => {
      connectSocket(userId, userName);
    }, delay);

    return () => disconnectSocket();
  }, [session?.user?.id, session?.user?.name, connectSocket, disconnectSocket]);

  const joinEvent = (eventId: string) => socketRef.current?.emit('join-event', eventId);
  const leaveEvent = (eventId: string) => socketRef.current?.emit('leave-event', eventId);
  const markAsRead = (notificationId: string) => socketRef.current?.emit('mark-read', notificationId);
  const emitNotification = (data: any) => socketRef.current?.emit('new-notification', data);

  return {
    socket,
    isConnected,
    joinEvent,
    leaveEvent,
    markAsRead,
    emitNotification,
    useFallback // expose fallback mode status
  };
};
