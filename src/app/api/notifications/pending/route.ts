import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || !token.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`🔄 [PENDING-API] Checking pending notifications for user: ${token.userId}`);

    // Get unread notifications from database
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId: token.userId as string,
        isRead: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        actionUrl: true,
        eventId: true,
        createdAt: true
      }
    });

    console.log(`📨 [PENDING-API] Found ${unreadNotifications.length} pending notifications`);

    // Format for service worker
    const formattedNotifications = unreadNotifications.map(notif => ({
      id: notif.id,
      title: notif.title,
      body: notif.message,
      actionUrl: notif.actionUrl || '/dashboard/member',
      tag: `${notif.type}-${notif.id}`,
      data: {
        type: notif.type,
        eventId: notif.eventId,
        source: 'background-sync',
        timestamp: notif.createdAt.toISOString()
      }
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      count: formattedNotifications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [PENDING-API] Error checking pending notifications:', error);
    return NextResponse.json(
      {
        error: 'Failed to check pending notifications',
        notifications: [],
        count: 0
      },
      { status: 500 }
    );
  }
}