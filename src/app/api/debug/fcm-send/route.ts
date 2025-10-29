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

    console.log(`🧪 DEBUG: FCM Send Test Starting...`);
    console.log(`📋 Parameters:`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Title: ${title}`);
    console.log(`  - Message: ${message}`);
    console.log(`  - Type: ${type || 'TEST_NOTIFICATION'}`);
    console.log(`  - Event ID: ${eventId || 'N/A'}`);
    console.log(`  - Action URL: ${actionUrl || '/dashboard/member'}`);

    // Step 1: Check FCM Admin Setup
    console.log(`\n🔥 STEP 1: Checking Firebase Admin Setup...`);
    const fcmSetup = await import('@/lib/fcmAdmin').then(m => m.checkFCMSetup());
    console.log(`  - Initialized: ${fcmSetup.initialized}`);
    console.log(`  - Project ID: ${fcmSetup.projectId}`);
    console.log(`  - Method: ${fcmSetup.method}`);
    console.log(`  - Service Account Email: ${fcmSetup.serviceAccountEmail}`);

    if (!fcmSetup.initialized) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin not initialized',
        debug: {
          step: 'FCM_SETUP',
          fcmSetup,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

    // Step 2: Get User Subscriptions
    console.log(`\n📱 STEP 2: Getting User Subscriptions...`);
    const subscriptions = await prisma.fCMSubscription.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        id: true,
        token: true,
        createdAt: true,
        deviceInfo: true
      }
    });

    console.log(`  - Total active subscriptions: ${subscriptions.length}`);

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active FCM subscriptions found',
        debug: {
          step: 'NO_SUBSCRIPTIONS',
          userId,
          fcmSetup,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // Log each subscription details
    subscriptions.forEach((sub, index) => {
      console.log(`  Subscription ${index + 1}:`);
      console.log(`    - ID: ${sub.id}`);
      console.log(`    - Token: ${sub.token.substring(0, 50)}...`);
      console.log(`    - Created: ${sub.createdAt}`);
      console.log(`    - Source: ${sub.deviceInfo?.source || 'Unknown'}`);
      console.log(`    - Platform: ${sub.deviceInfo?.platform || 'Unknown'}`);
    });

    // Step 3: Test Token Validity
    console.log(`\n🔍 STEP 3: Testing Token Validity...`);
    const testToken = subscriptions[0].token;
    console.log(`  - Testing token: ${testToken.substring(0, 50)}...`);

    // Import Firebase Admin for direct token testing
    const admin = await import('@/lib/fcmAdmin').then(m => m.default);

    try {
      // Test with minimal message - Firebase Admin SDK format
      const testMessage = {
        token: testToken,
        notification: {
          title: '🧪 Token Validity Test',
          body: 'This is a test to check if your FCM token is valid'
        },
        data: {
          type: 'TOKEN_VALIDITY_TEST',
          test: 'true',
          timestamp: new Date().toISOString(),
          isDebugTest: 'true',
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png'
        },
        webpush: {
          fcm_options: {
            link: '/dashboard/member'
          },
          notification: {
            title: '🧪 Token Validity Test',
            body: 'This is a test to check if your FCM token is valid',
            icon: '/icons/favicon.png',
            badge: '/icons/favicon.png',
            tag: 'token-test-' + Date.now()
          }
        }
      };

      console.log(`  - Sending test message...`);
      const testResult = await admin.messaging().send(testMessage);
      console.log(`  ✅ Token is valid! Message ID: ${testResult}`);

    } catch (tokenError: any) {
      console.error(`  ❌ Token validation failed:`);
      console.error(`    - Error Code: ${tokenError.code}`);
      console.error(`    - Error Message: ${tokenError.message}`);
      console.error(`    - Error Info:`, tokenError.errorInfo);

      return NextResponse.json({
        success: false,
        error: 'FCM Token validation failed',
        debug: {
          step: 'TOKEN_VALIDATION',
          tokenError: {
            code: tokenError.code,
            message: tokenError.message,
            errorInfo: tokenError.errorInfo
          },
          tokenTested: testToken.substring(0, 50) + '...',
          subscriptionId: subscriptions[0].id,
          fcmSetup,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // Step 4: Send Full Notification
    console.log(`\n📤 STEP 4: Sending Full Notification...`);
    console.log(`  - 🔍 CHECKING: Is there any auto-trigger happening after this?`);

    const notificationPayload = {
      title,
      body: message,
      icon: '/icons/favicon.png',
      badge: '/icons/favicon.png',
      tag: `debug-${Date.now()}`,
      data: {
        type: type || 'TEST_NOTIFICATION',
        userId: userId,
        eventId: eventId || '',
        actionUrl: actionUrl || '/dashboard/member',
        debug: 'true',
        timestamp: new Date().toISOString(),
        isDebugMessage: 'true',
        preventAutoTrigger: 'true' // Flag to prevent auto-trigger
      },
      actionUrl: actionUrl || '/dashboard/member'
    };

    console.log(`  - Notification payload:`, JSON.stringify(notificationPayload, null, 2));
    console.log(`  - ⚠️  WATCH for any notificationTriggerService calls after FCM send!`);

    const result = await sendFCMNotification(userId, notificationPayload);

    console.log(`\n📊 STEP 5: Results...`);
    console.log(`  - Success: ${result.success}`);
    console.log(`  - Sent: ${result.sent}`);
    console.log(`  - Failed: ${result.failed}`);
    console.log(`  - Total: ${result.total}`);

    if (result.results && result.results.length > 0) {
      console.log(`\n📋 Detailed Results:`);
      result.results.forEach((res: any, index: number) => {
        console.log(`  Device ${index + 1}:`);
        console.log(`    - Token: ${res.token}`);
        console.log(`    - Status: ${res.status}`);
        if (res.error) {
          console.log(`    - Error: ${res.error}`);
          console.log(`    - Code: ${res.code || 'N/A'}`);
          console.log(`    - Full Error:`, res.fullError || 'N/A');
        } else {
          console.log(`    - Message ID: ${res.messageId || 'N/A'}`);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Debug FCM send completed',
      result: result || {
        success: false,
        sent: 0,
        failed: subscriptions.length,
        total: subscriptions.length,
        message: 'No result returned from sendFCMNotification',
        results: []
      },
      debug: {
        step: 'COMPLETED',
        fcmSetup,
        subscriptionsFound: subscriptions.length,
        tokenValidation: 'PASSED',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: FCM Send Test Failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Debug FCM send test failed',
      debug: {
        step: 'UNEXPECTED_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}