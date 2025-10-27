import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// FCM API V1 Configuration
const FCM_V1_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FCM_V1_SERVICE_ACCOUNT_EMAIL = process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL;
const FCM_V1_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Function to get OAuth 2.0 access token
async function getAccessToken(): Promise<string> {
  if (!FCM_V1_SERVICE_ACCOUNT_EMAIL || !FCM_V1_PRIVATE_KEY) {
    throw new Error('Firebase service account credentials not configured');
  }

  try {
    const jwt = require('jsonwebtoken');

    const jwtPayload = {
      iss: FCM_V1_SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      iat: Math.floor(Date.now() / 1000)
    };

    const signedJwt = jwt.sign(jwtPayload, FCM_V1_PRIVATE_KEY, { algorithm: 'RS256' });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signedJwt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
    }

    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Function to send message via FCM API V1
async function sendFCMV1Message(target: string, message: any, accessToken: string) {
  const url = `https://fcm.googleapis.com/v1/projects/${FCM_V1_PROJECT_ID}/messages:send`;

  const payload = {
    message: {
      target: target.startsWith('http') ? { token: target } : { topic: target },
      notification: {
        title: message.title,
        body: message.body,
        icon: message.icon || '/icons/favicon.png',
        image: message.image || null,
      },
      webpush: {
        fcm_options: {
          link: message.actionUrl || '/dashboard/member'
        },
        notification: {
          title: message.title,
          body: message.body,
          icon: message.icon || '/icons/favicon.png',
          badge: message.badge || '/icons/favicon.png',
          tag: message.tag || `notification-${Date.now()}`,
          data: message.data || {},
          requireInteraction: message.requireInteraction || false,
          silent: message.silent || false,
          actions: message.actions || [],
          timestamp: Date.now()
        }
      },
      data: {
        type: message.data?.type || 'NOTIFICATION',
        userId: message.data?.userId,
        eventId: message.data?.eventId,
        notificationId: message.data?.notificationId,
        actionUrl: message.actionUrl || '/dashboard/member',
        timestamp: new Date().toISOString(),
        ...message.data
      },
      android: message.android || {},
      apns: message.apns || {}
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`FCM API V1 Error: ${result.error?.message || 'Unknown error'}`);
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, body: message, icon, badge, tag, data, actionUrl, topic } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title and message are required' },
        { status: 400 }
      );
    }

    // Get access token
    const accessToken = await getAccessToken();

    let targets: string[] = [];
    let successCount = 0;
    let failureCount = 0;
    const results: any[] = [];

    if (topic) {
      // Send to topic
      try {
        const result = await sendFCMV1Message(topic, {
          title,
          body: message,
          icon,
          badge,
          tag,
          data,
          actionUrl
        }, accessToken);

        successCount += result.successCount || 1;
        results.push({
          target: topic,
          type: 'topic',
          status: 'success',
          messageId: result.name
        });
      } catch (error) {
        failureCount += 1;
        results.push({
          target: topic,
          type: 'topic',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else if (userId) {
      // Get FCM subscriptions for user
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

      // Send to each subscription
      for (const subscription of subscriptions) {
        try {
          const result = await sendFCMV1Message(subscription.token, {
            title,
            body: message,
            icon,
            badge,
            tag,
            data: {
              ...data,
              userId
            },
            actionUrl
          }, accessToken);

          successCount++;
          results.push({
            token: subscription.token.substring(0, 20) + '...',
            status: 'success',
            messageId: result.name
          });
        } catch (error) {
          failureCount++;
          results.push({
            token: subscription.token.substring(0, 20) + '...',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          // Remove invalid subscription
          if (error instanceof Error && error.message.includes('UNREGISTERED')) {
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
      message: `FCM V1 notification sent to ${successCount} target(s)`,
      sent: successCount,
      failed: failureCount,
      total: results.length,
      results
    });

  } catch (error) {
    console.error('Error sending FCM V1 notification:', error);
    return NextResponse.json(
      { error: 'Failed to send FCM V1 notification' },
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
      fcmV1Enabled: subscriptionCount > 0,
      apiVersion: 'v1'
    });
  } catch (error) {
    console.error('Error checking FCM V1 subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to check FCM V1 subscriptions' },
      { status: 500 }
    );
  }
}