import { Server as NetServer } from 'http';
import { NextRequest, NextResponse } from 'next/server';
import { Server as ServerIO } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Global io instance to be used across the application
let globalIO: ServerIO | null = null;

export const getGlobalIO = () => globalIO;

const SocketHandler = (request: NextRequest) => {
  // For Socket.IO to work in Next.js App Router, we need to access the underlying HTTP server
  // This is a workaround approach for Next.js 15 with Socket.IO

  // Check if Socket.IO is already initialized
  if (globalIO) {
    console.log('Socket is already running');
    return new NextResponse('Socket.IO server is already running', { status: 200 });
  }

  try {
    // Get the WebSocket upgrade from the request
    const url = new URL(request.url);
    const isUpgrade = request.headers.get('upgrade') === 'websocket';

    if (!isUpgrade) {
      return new NextResponse('Socket.IO endpoint', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }

    // Create Socket.IO server for App Router
    // In production, you'd need to properly integrate with the Next.js server
    const io = new ServerIO({
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      },
      transports: ['websocket', 'polling']
    });

    globalIO = io;

    io.on('connection', (socket) => {
      // Get auth data from client
      const userId = socket.handshake.auth?.userId;
      const userName = socket.handshake.auth?.userName;

      if (!userId) {
        console.log('Connection rejected: No user ID provided');
        socket.disconnect();
        return;
      }

      socket.userId = userId;
      socket.userName = userName || 'Unknown User';

      console.log(`User connected: ${socket.userName} (${socket.userId})`);

      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Handle joining event rooms
      socket.on('join-event', (eventId: string) => {
        socket.join(`event:${eventId}`);
        console.log(`User ${socket.userName} joined event ${eventId}`);
      });

      // Handle leaving event rooms
      socket.on('leave-event', (eventId: string) => {
        socket.leave(`event:${eventId}`);
        console.log(`User ${socket.userName} left event ${eventId}`);
      });

      // Handle mark as read real-time
      socket.on('mark-read', async (notificationId: string) => {
        try {
          // Broadcast to all clients of this user
          io.to(`user:${socket.userId}`).emit('notification-read', {
            notificationId,
            userId: socket.userId
          });
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userName} (${socket.userId})`);
      });
    });

    console.log('Socket.IO server initialized');

    return new NextResponse('Socket.IO server initialized', { status: 200 });

  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    return new NextResponse('Socket.IO initialization failed', { status: 500 });
  }
};

export default SocketHandler;