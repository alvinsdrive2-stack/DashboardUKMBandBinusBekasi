import { NextRequest, NextResponse } from 'next/server';
import { getGlobalIO } from '@/lib/socketServer';

// This endpoint emits real-time WebSocket notifications

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-key';

    if (!authHeader || authHeader !== `Bearer ${internalKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification, targetUserId, eventId } = body;

    console.log('Emitting real-time notification:', {
      notification,
      targetUserId,
      eventId,
      timestamp: new Date().toISOString()
    });

    // Get the global Socket.IO instance
    const io = getGlobalIO();

    if (!io) {
      console.warn('Socket.IO server not available, notification will be queued via polling');
      return NextResponse.json({
        success: true,
        message: 'Notification queued (Socket.IO not available)',
        fallback: 'polling'
      });
    }

    // Emit to specific user
    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('new-notification', notification);
      console.log(`Notification emitted to user: ${targetUserId}`);
    }

    // Emit to event room if eventId provided
    if (eventId) {
      io.to(`event:${eventId}`).emit('event-notification', {
        notification,
        eventId
      });
      console.log(`Notification emitted to event room: ${eventId}`);
    }

    // Update unread count for target user
    if (targetUserId && !notification.isRead) {
      io.to(`user:${targetUserId}`).emit('unread-count-update', 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Real-time notification emitted successfully',
      data: {
        notification,
        targetUserId,
        eventId,
        emitted: true
      }
    });
  } catch (error) {
    console.error('Error emitting real-time notification:', error);
    return NextResponse.json(
      { error: 'Failed to emit real-time notification' },
      { status: 500 }
    );
  }
}