import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, body: message, icon, badge, tag, data, actionUrl } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'userId, title, and message are required' },
        { status: 400 }
      );
    }

    // Get all active FCM subscriptions for the user
    const subscriptions = await prisma.fCMSubscription.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No FCM subscriptions found for user',
        sent: 0
      });
    }

    // Prepare FCM message
    const fcmMessage = {
      notification: {
        title,
        body: message,
        icon: icon || '/icons/favicon.png',
        badge: badge || '/icons/favicon.png',
        tag: tag || `notification-${Date.now()}`,
        click_action: actionUrl || '/dashboard/member'
      },
      data: {
        type: data?.type || 'NOTIFICATION',
        userId,
        eventId: data?.eventId,
        notificationId: data?.notificationId,
        actionUrl: actionUrl || '/dashboard/member',
        timestamp: new Date().toISOString(),
        ...data
      },
      webpush: {
        fcm_options: {
          link: actionUrl || '/dashboard/member'
        }
      }
    };

    // Send to FCM (using environment variable for server key)
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({
        success: false,
        message: 'FCM server key not configured',
        sent: 0
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Send to each subscription
    for (const subscription of subscriptions) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${serverKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...fcmMessage,
            to: subscription.token
          })
        });

        const result = await response.json();

        if (response.ok && result.success === 1) {
          successCount++;
          results.push({
            token: subscription.token.substring(0, 20) + '...',
            status: 'success',
            messageId: results.message_id
          });
        } else {
          failureCount++;
          results.push({
            token: subscription.token.substring(0, 20) + '...',
            status: 'failed',
            error: result.results?.[0]?.error || result.error || 'Unknown error'
          });

          // Remove invalid subscription
          if (result.results?.[0]?.error === 'NotRegistered' || result.results?.[0]?.error === 'InvalidRegistration') {
            await prisma.fCMSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false }
            });
          }
        }

      } catch (error) {
        failureCount++;
        results.push({
          token: subscription.token.substring(0, 20) + '...',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: successCount > 0,
      message: `FCM notification sent to ${successCount} device(s)`,
      sent: successCount,
      failed: failureCount,
      total: subscriptions.length,
      results
    });

  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return NextResponse.json(
      { error: 'Failed to send FCM notification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get subscription count for user
    const subscriptionCount = await prisma.fCMSubscription.count({
      where: {
        userId,
        isActive: true
      }
    });

    return NextResponse.json({
      userId,
      subscriptionCount,
      fcmEnabled: subscriptionCount > 0
    });
  } catch (error) {
    console.error('Error checking FCM subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to check FCM subscriptions' },
      { status: 500 }
    );
  }
}