import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMessaging } from '@/firebase/admin';

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

    // Send to FCM using Firebase Admin SDK
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Prepare tokens for multicast messaging
    const tokens = subscriptions.map(sub => sub.token);

    try {
      // Send multicast message using Firebase Admin SDK
      const message = {
        notification: {
          title,
          body: message,
          icon: icon || '/icons/favicon.png',
          badge: badge || '/icons/favicon.png',
          tag: tag || `notification-${Date.now()}`,
          clickAction: actionUrl || '/dashboard/member'
        },
        data: {
          type: data?.type || 'NOTIFICATION',
          userId,
          eventId: data?.eventId?.toString(),
          notificationId: data?.notificationId?.toString(),
          actionUrl: actionUrl || '/dashboard/member',
          timestamp: new Date().toISOString(),
          ...data
        },
        webpush: {
          fcmOptions: {
            link: actionUrl || '/dashboard/member'
          }
        },
        tokens: tokens
      };

      const response = await adminMessaging.sendEachForMulticast(message);

      // Process results
      for (let i = 0; i < response.responses.length; i++) {
        const resp = response.responses[i];
        const token = tokens[i];
        const subscription = subscriptions[i];

        if (resp.success) {
          successCount++;
          results.push({
            token: token.substring(0, 20) + '...',
            status: 'success',
            messageId: resp.messageId
          });
        } else {
          failureCount++;
          results.push({
            token: token.substring(0, 20) + '...',
            status: 'failed',
            error: resp.error?.message || 'Unknown error'
          });

          // Remove invalid subscription
          if (resp.error?.code === 'messaging/registration-token-not-registered' ||
              resp.error?.code === 'messaging/invalid-registration-token') {
            await prisma.fCMSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false }
            });
          }
        }
      }

    } catch (error) {
      console.error('Error sending multicast FCM message:', error);

      // Fallback to individual messages if multicast fails
      for (const subscription of subscriptions) {
        try {
          const message = {
            ...fcmMessage,
            token: subscription.token
          };

          const response = await adminMessaging.send(message);
          successCount++;
          results.push({
            token: subscription.token.substring(0, 20) + '...',
            status: 'success',
            messageId: response
          });
        } catch (error) {
          failureCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({
            token: subscription.token.substring(0, 20) + '...',
            status: 'failed',
            error: errorMessage
          });

          // Remove invalid subscription
          if (errorMessage.includes('registration-token-not-registered') ||
              errorMessage.includes('invalid-registration-token')) {
            await prisma.fCMSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false }
            });
          }
        }
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