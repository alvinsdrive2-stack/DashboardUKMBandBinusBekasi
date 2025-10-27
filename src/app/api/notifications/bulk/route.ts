import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isManager } from '@/utils/roles';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationLvl || !isManager(session.user.organizationLvl)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, title, message, type, eventId, actionUrl } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Title, message, and type are required' },
        { status: 400 }
      );
    }

    // Create notifications for all users
    const notifications = await Promise.all(
      userIds.map((userId: string) =>
        prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: type as any,
            eventId: eventId || null,
            actionUrl: actionUrl || null,
            isRead: false,
          },
        })
      )
    );

    // Emit real-time notifications via WebSocket
    try {
      // Import socket server function from Pages Router
      const { emitNotificationToUsers } = await import('../../../../../pages/api/socket/io');

      // Create notification data for WebSocket
      const notificationData = {
        title,
        message,
        type,
        eventId,
        actionUrl,
        createdAt: new Date().toISOString(),
      };

      // Emit to specific users
      await emitNotificationToUsers(userIds, notificationData);

      console.log(`Bulk notifications sent via WebSocket to ${userIds.length} users`);
    } catch (socketError) {
      console.error('Failed to emit bulk notifications via WebSocket:', socketError);
      // Don't fail the request if WebSocket fails
    }

    return NextResponse.json({
      success: true,
      notificationsCreated: notifications.length,
      notifications: notifications
    });

  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'markAllAsRead':
        result = await prisma.notification.updateMany({
          where: {
            userId: session.user.id,
            isRead: false
          },
          data: {
            isRead: true,
            updatedAt: new Date()
          }
        });
        break;

      case 'markMultipleAsRead':
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { error: 'Notification IDs array is required' },
            { status: 400 }
          );
        }

        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id
          },
          data: {
            isRead: true,
            updatedAt: new Date()
          }
        });
        break;

      case 'deleteMultiple':
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { error: 'Notification IDs array is required' },
            { status: 400 }
          );
        }

        result = await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, modifiedCount: result.count });
  } catch (error) {
    console.error('Error in bulk notification operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}