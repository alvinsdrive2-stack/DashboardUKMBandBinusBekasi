import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendFCMNotification } from '@/lib/fcmAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, type, eventId, actionUrl } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'userId, title, and message are required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing FCM Admin notification to user: ${userId}`);
    console.log(`📋 Parameters:`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Title: ${title}`);
    console.log(`  - Message: ${message}`);
    console.log(`  - Type: ${type || 'TEST_NOTIFICATION'}`);

    // Check FCM Admin setup first
    const fcmSetup = await import('@/lib/fcmAdmin').then(m => m.checkFCMSetup());
    console.log(`🔥 FCM Admin Setup:`);
    console.log(`  - Initialized: ${fcmSetup.initialized}`);
    console.log(`  - Project ID: ${fcmSetup.projectId}`);

    if (!fcmSetup.initialized) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin not initialized',
        debug: { fcmSetup }
      }, { status: 500 });
    }

    // Send FCM notification using Admin SDK
    console.log(`📤 Sending FCM notification via direct admin.messaging().send() (like DEBUG API)...`);

    // Get user's FCM subscription token
    const subscription = await prisma.fCMSubscription.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'No active FCM subscription found',
        debug: { userId }
      }, { status: 400 });
    }

    console.log(`📱 Using subscription token: ${subscription.token.substring(0, 50)}...`);

    // UKM Band Notification System (NO TOKEN TEST)
    console.log(`🎵 UKM Band Notification System - Direct Send`);

    // Generate unique tag for UKM Band notifications
    const uniqueTag = `ukmband-${type || 'TEST'}-${Date.now()}`;

    console.log(`🎵 Sending UKM Band notification with tag: ${uniqueTag}`);

    // Send directly to single subscription
    const firebaseAdmin = await import('@/lib/fcmAdmin').then(m => m.default);

    const finalMessage = {
      token: subscription.token,
      notification: {
        title: title,
        body: message
      },
      data: {
        type: type || 'TEST_NOTIFICATION',
        test: 'false',
        timestamp: new Date().toISOString(),
        title: title,
        body: message,
        icon: '/icons/favicon.png',
        badge: '/icons/favicon.png',
        userId: userId.toString(),
        actionUrl: actionUrl || '/dashboard/member',
        eventId: eventId || '',
        tag: uniqueTag,
        source: 'ukmband-system'
      },
      webpush: {
        fcm_options: {
          link: actionUrl || '/dashboard/member'
        },
        notification: {
          title: title,
          body: message,
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png',
          tag: uniqueTag
        }
      }
    };

    const fcmResult = await firebaseAdmin.messaging().send(finalMessage);
    console.log(`✅ UKM Band notification sent successfully! Message ID: ${fcmResult}`);

    const result = {
      success: true,
      sent: 1,
      failed: 0,
      total: 1,
      results: [{
        token: subscription.token.substring(0, 20) + '...',
        status: 'success',
        messageId: fcmResult
      }]
    };

    console.log(`✅ FCM Notification sent successfully!`);

    const formattedResult = {
      success: result.success,
      sent: result.sent,
      failed: result.failed,
      total: result.total,
      results: result.results
    };

    console.log(`📊 FCM Send Result:`);
    console.log(`  - Success: ${result.success}`);
    console.log(`  - Sent: ${result.sent}`);
    console.log(`  - Failed: ${result.failed}`);
    console.log(`  - Total: ${result.total}`);

    if (result.error) {
      console.error(`  ❌ Error: ${result.error}`);
    }

    return NextResponse.json({
      success: true,
      message: 'FCM Admin test notification sent',
      result: formattedResult,
      userId,
      debug: {
        fcmSetup,
        sendResult: result
      }
    });

  } catch (error) {
    console.error('❌ FCM Admin test notification failed:', error);
    return NextResponse.json(
      { error: 'Failed to send FCM Admin test notification' },
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
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching FCM subscriptions for user: ${userId}`);

    // Get user's FCM subscriptions
    const subscriptions = await prisma.fCMSubscription.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        id: true,
        token: true,
        createdAt: true,
        isActive: true,
        deviceInfo: true
      }
    });

    console.log(`📊 Found ${subscriptions.length} active FCM subscriptions:`);
    subscriptions.forEach((sub, index) => {
      console.log(`  ${index + 1}. ID: ${sub.id}, Token: ${sub.token.substring(0, 30)}..., Created: ${sub.createdAt}`);
      if (sub.deviceInfo && sub.deviceInfo.source) {
        console.log(`     Source: ${sub.deviceInfo.source}`);
      }
    });

    // Check FCM Admin setup
    const fcmSetup = await import('@/lib/fcmAdmin').then(m => m.checkFCMSetup());

    return NextResponse.json({
      success: true,
      userId,
      subscriptions,
      totalDevices: subscriptions.length,
      fcmSetup,
      system: 'FCM Admin'
    });

  } catch (error) {
    console.error('❌ Failed to get user FCM subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get user FCM subscriptions' },
      { status: 500 }
    );
  }
}