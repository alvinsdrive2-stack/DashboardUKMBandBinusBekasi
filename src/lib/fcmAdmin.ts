import admin from 'firebase-admin';
import { prisma } from '@/lib/prisma';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Initialize Firebase Admin with service account
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId
      });
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.log('❌ Firebase Admin credentials not complete');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
}

export async function sendFCMNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    image?: string;
    data?: any;
    actionUrl?: string;
  }
) {
  try {
    // Get all active FCM subscriptions for the user
    const subscriptions = await prisma.fCMSubscription.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    if (subscriptions.length === 0) {
      return {
        success: true,
        message: 'No FCM subscriptions found for user',
        sent: 0,
        failed: 0,
        total: 0
      };
    }

    console.log(`📤 Sending FCM notification to ${subscriptions.length} device(s)`);

    // Prepare message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/favicon.png',
        badge: notification.badge || '/icons/favicon.png',
        tag: notification.tag || `notification-${Date.now()}`,
        imageUrl: notification.image || undefined
      },
      data: {
        type: notification.data?.type || 'NOTIFICATION',
        userId,
        eventId: notification.data?.eventId,
        notificationId: notification.data?.notificationId,
        actionUrl: notification.actionUrl || '/dashboard/member',
        timestamp: new Date().toISOString(),
        click_action: notification.actionUrl || '/dashboard/member',
        ...notification.data
      },
      webpush: {
        fcm_options: {
          link: notification.actionUrl || '/dashboard/member'
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icons/favicon.png',
          badge: notification.badge || '/icons/favicon.png',
          tag: notification.tag || `notification-${Date.now()}`,
          data: notification.data || {},
          requireInteraction: false,
          silent: false,
          actions: [],
          timestamp: Date.now()
        }
      }
    };

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Send to each subscription
    for (const subscription of subscriptions) {
      try {
        const fcmMessage = {
          token: subscription.token,
          ...message
        };

        const response = await admin.messaging().send(fcmMessage);
        successCount++;

        results.push({
          token: subscription.token.substring(0, 20) + '...',
          status: 'success',
          messageId: response
        });

        console.log(`✅ FCM sent successfully to ${subscription.token.substring(0, 20)}...`);

      } catch (error) {
        failureCount++;

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ FCM send failed for ${subscription.token.substring(0, 20)}...:`, errorMessage);

        results.push({
          token: subscription.token.substring(0, 20) + '...',
          status: 'failed',
          error: errorMessage
        });

        // Remove invalid subscription
        if (errorMessage.includes('NotRegistered') || errorMessage.includes('InvalidRegistration') || errorMessage.includes('unregistered')) {
          await prisma.fCMSubscription.update({
            where: { id: subscription.id },
            data: { isActive: false }
          });
          console.log(`🗑️ Deactivated invalid subscription: ${subscription.token.substring(0, 20)}...`);
        }
      }
    }

    return {
      success: successCount > 0,
      message: `FCM notification sent to ${successCount} of ${subscriptions.length} device(s)`,
      sent: successCount,
      failed: failureCount,
      total: subscriptions.length,
      results
    };

  } catch (error) {
    console.error('❌ Error in sendFCMNotification:', error);
    return {
      success: false,
      message: 'Failed to send FCM notification',
      sent: 0,
      failed: 0,
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkFCMSetup() {
  try {
    if (!admin.apps.length) {
      return {
        initialized: false,
        error: 'Firebase Admin not initialized'
      };
    }

    // Test project access
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      return {
        initialized: true,
        projectId: null,
        error: 'FIREBASE_PROJECT_ID not configured'
      };
    }

    return {
      initialized: true,
      projectId,
      serviceAccountEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
    };
  } catch (error) {
    return {
      initialized: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default admin;