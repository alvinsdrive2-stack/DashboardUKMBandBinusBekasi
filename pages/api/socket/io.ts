import { NextApiRequest, NextApiResponse } from 'next';
import { Server as IOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { setSocketIOInstance } from '@/utils/notificationEmitter';

export const config = {
  api: { bodyParser: false },
};

let io: IOServer | undefined;

export default function handler(req: NextApiRequest, res: NextApiResponse & { socket: any }) {
  if (!res.socket.server.io) {
    console.log('🚀 Initializing Socket.IO server...');
    const httpServer: NetServer = res.socket.server as any;

    // Determine allowed origins based on environment
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          process.env.NEXTAUTH_URL,
          'https://ukmbandbinusbekasi.vercel.app',
          // Add any custom domains here
        ].filter(Boolean) // Remove undefined/null values
      : ['http://localhost:3000', 'http://192.168.1.7:3000', 'http://127.0.0.1:3000'];

    console.log('🌐 Socket.IO allowed origins:', allowedOrigins);

    io = new IOServer(httpServer, {
      path: '/api/socket/io',
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['polling'], // polling only untuk Vercel compatibility
      allowEIO3: true,
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      maxHttpBufferSize: 1e6, // 1 MB
      connectTimeout: 45000, // 45 seconds

      // Vercel-specific optimizations
      upgrade: false, // Disable WebSocket upgrades for Vercel
      rememberUpgrade: false,

      // Additional stability settings for production
      forceNew: true,
      forceJSONP: false,
      transports: ['polling'],
    });

    io.on('connection', (socket) => {
      const userId = socket.handshake.auth?.userId;
      const userName = socket.handshake.auth?.userName || 'Unknown';

      if (!userId) {
        console.log('❌ No user ID, disconnecting');
        socket.disconnect();
        return;
      }

      console.log(`✅ ${userName} (${userId}) connected`);

      socket.join(`user:${userId}`);

      // Set up error handling for this socket
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${userName}:`, error);
      });

      socket.on('join-event', (eventId: string) => {
        socket.join(`event:${eventId}`);
        console.log(`${userName} joined event ${eventId}`);
      });

      socket.on('leave-event', (eventId: string) => {
        socket.leave(`event:${eventId}`);
        console.log(`${userName} left event ${eventId}`);
      });

      socket.on('mark-read', (notificationId: string) => {
        io?.to(`user:${userId}`).emit('notification-read', { notificationId, userId });
      });

      socket.on('new-notification', (data) => {
        io?.emit('new-notification', data);
      });
    });

    res.socket.server.io = io;

    // Set the instance for notification emitter
    setSocketIOInstance(io);

  } else {
    console.log('⚡ Socket.IO already running');
    // Also set the instance if already running
    setSocketIOInstance(res.socket.server.io);
  }

  res.end();
}
