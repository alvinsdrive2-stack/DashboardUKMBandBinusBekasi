// Real-time notification emitter using global socket instance
// This handles the case where we can't access the pages/ directory from src/utils

let ioInstance: any = null;

export const setSocketIOInstance = (io: any) => {
  ioInstance = io;
  console.log('📡 Socket.IO instance set for notification emitter');
};

export const emitNotificationToUser = (userId: string, notification: any) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('new-notification', notification);
    console.log(`📨 Emitted "${notification.title}" to user ${userId}`);
  } else {
    console.warn('⚠️ Socket.IO not available for real-time notification');
  }
};

export const emitNotificationToMultipleUsers = (userIds: string[], notification: any) => {
  if (ioInstance) {
    userIds.forEach(userId => {
      ioInstance.to(`user:${userId}`).emit('new-notification', notification);
    });
    console.log(`📨 Emitted "${notification.title}" to ${userIds.length} users`);
  } else {
    console.warn('⚠️ Socket.IO not available for real-time notifications');
  }
};