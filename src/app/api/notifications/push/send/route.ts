import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// Configure VAPID only if keys are available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'ukm-band@example.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-key';

    if (!authHeader || authHeader !== `Bearer ${internalKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if VAPID is configured
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({
        success: true,
        message: 'Push notifications disabled - VAPID keys not configured',
        sent: 0
      });
    }

    const body = await request.json();
    const { userId, title, message, notification, eventId, actionUrl } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'userId, title, and message are required' },
        { status: 400 }
      );
    }

    // Get all active subscriptions for the user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found for user',
        sent: 0
      });
    }

    const pushPayload = JSON.stringify({
      title,
      message,
      icon: '/icons/favicon.png',
      badge: '/icons/favicon.png',
      tag: notification?.id || `notification-${Date.now()}`,
      timestamp: new Date().toISOString(),
      requireInteraction: false,
      silent: false,
      data: {
        type: notification?.type || 'NOTIFICATION',
        userId,
        eventId,
        actionUrl: actionUrl || (notification?.actionUrl),
        notificationId: notification?.id
      }
    });

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Send push notification to all user subscriptions
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(pushSubscription, pushPayload);
        successCount++;
        results.push({
          endpoint: subscription.endpoint,
          status: 'success'
        });
      } catch (error) {
        console.error(`Failed to send push notification to ${subscription.endpoint}:`, error);
        failureCount++;

        // Remove invalid subscription
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id }
          });
          results.push({
            endpoint: subscription.endpoint,
            status: 'removed',
            error: 'Subscription expired or invalid'
          });
        } else {
          results.push({
            endpoint: subscription.endpoint,
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      message: `Push notification sent to ${successCount} device(s)`,
      sent: successCount,
      failed: failureCount,
      total: subscriptions.length,
      results
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-key';

    if (!authHeader || authHeader !== `Bearer ${internalKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get subscription count for user
    const subscriptionCount = await prisma.pushSubscription.count({
      where: { userId }
    });

    return NextResponse.json({
      userId,
      subscriptionCount,
      pushEnabled: subscriptionCount > 0
    });
  } catch (error) {
    console.error('Error checking push subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to check push subscriptions' },
      { status: 500 }
    );
  }
}