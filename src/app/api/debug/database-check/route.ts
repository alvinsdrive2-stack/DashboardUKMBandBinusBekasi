import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔍 DEBUG: Checking database for user ${session.user.id} (${session.user.name})`);

    const results = {
      user: null,
      fcmSubscriptions: [],
      allUsers: [],
      allFcmSubscriptions: [],
      notifications: []
    };

    // 1. Get current user
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          organizationLvl: true,
          createdAt: true
        }
      });
      results.user = user;
      console.log(`👤 Current User:`, user);
    } catch (error) {
      console.error('❌ Error getting user:', error);
    }

    // 2. Get user's FCM subscriptions
    try {
      const fcmSubscriptions = await prisma.fCMSubscription.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          token: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          deviceInfo: true
        },
        orderBy: { createdAt: 'desc' }
      });
      results.fcmSubscriptions = fcmSubscriptions;
      console.log(`📱 User FCM Subscriptions:`, fcmSubscriptions.length);
      fcmSubscriptions.forEach((sub, i) => {
        console.log(`  ${i+1}. Active: ${sub.isActive}, Token: ${sub.token?.substring(0, 50)}...`);
      });
    } catch (error) {
      console.error('❌ Error getting FCM subscriptions:', error);
    }

    // 3. Get ALL users (limit 10 for performance)
    try {
      const allUsers = await prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          organizationLvl: true,
          createdAt: true,
          fCMSubscriptions: {
            select: {
              id: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      results.allUsers = allUsers;
      console.log(`👥 All Users (first 10): ${allUsers.length}`);
      allUsers.forEach((user, i) => {
        console.log(`  ${i+1}. ${user.name} - FCM: ${user.fCMSubscriptions.length} subs`);
      });
    } catch (error) {
      console.error('❌ Error getting all users:', error);
    }

    // 4. Get ALL FCM subscriptions (limit 10)
    try {
      const allFcmSubscriptions = await prisma.fCMSubscription.findMany({
        take: 10,
        select: {
          id: true,
          userId: true,
          token: true,
          isActive: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      results.allFcmSubscriptions = allFcmSubscriptions;
      console.log(`📱 All FCM Subscriptions (first 10): ${allFcmSubscriptions.length}`);
      allFcmSubscriptions.forEach((sub, i) => {
        console.log(`  ${i+1}. ${sub.user.name} - Active: ${sub.isActive}`);
      });
    } catch (error) {
      console.error('❌ Error getting all FCM subscriptions:', error);
    }

    // 5. Get user's notifications
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
          eventId: true,
          actionUrl: true
        }
      });
      results.notifications = notifications;
      console.log(`📬 User Notifications: ${notifications.length}`);
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      results,
      summary: {
        userExists: !!results.user,
        userFcmSubscriptions: results.fcmSubscriptions.length,
        activeUserFcmSubscriptions: results.fcmSubscriptions.filter(s => s.isActive).length,
        totalUsers: results.allUsers.length,
        totalFcmSubscriptions: results.allFcmSubscriptions.length,
        totalActiveFcmSubscriptions: results.allFcmSubscriptions.filter(s => s.isActive).length,
        userNotifications: results.notifications.length
      }
    });

  } catch (error) {
    console.error('❌ Error in database check API:', error);
    return NextResponse.json(
      { error: 'Failed to check database' },
      { status: 500 }
    );
  }
}