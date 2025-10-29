 import admin from 'firebase-admin';

import { prisma } from '@/lib/prisma';

import * as fs from 'fs';

import * as path from 'path';



// Function to initialize Firebase Admin with error handling

function initializeFirebaseAdmin() {

  if (admin.apps.length > 0) {

    return admin; // Already initialized

  }



  try {

    console.log('🔍 Firebase Admin Service Account File Check:');



    let serviceAccount;

    let method = 'Unknown';



    try {

      // Try multiple possible paths for the service account file

      const possiblePaths = [

        path.join(process.cwd(), 'src', 'firebase', 'serviceAccount.json'),

        path.join(__dirname, '..', '..', 'firebase', 'serviceAccount.json'),

        'C:/Project/gitgitgut/UKM BAND/ukm-band-bekasi-dashboard/src/firebase/serviceAccount.json'

      ];



      let serviceAccountPath = null;

      for (const testPath of possiblePaths) {

        console.log(`🔍 Checking path: ${testPath}`);

        if (fs.existsSync(testPath)) {

          serviceAccountPath = testPath;

          break;

        }

      }



      if (serviceAccountPath) {

        console.log(`✅ Found service account file at: ${serviceAccountPath}`);

        const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');

        const rawServiceAccount = JSON.parse(serviceAccountContent);



        // Map Firebase service account field names to expected format

        serviceAccount = {

          projectId: rawServiceAccount.project_id,

          clientEmail: rawServiceAccount.client_email,

          privateKey: rawServiceAccount.private_key,

          type: rawServiceAccount.type,

          projectIdRaw: rawServiceAccount.project_id,

          clientEmailRaw: rawServiceAccount.client_email,

          privateKeyRaw: rawServiceAccount.private_key

        };



        method = 'JSON File';

        console.log('✅ Service account file loaded successfully');

        console.log(`📋 Project ID: ${serviceAccount.projectId}`);

        console.log(`📧 Client Email: ${serviceAccount.clientEmail}`);

        console.log(`🔑 Private Key length: ${serviceAccount.privateKey ? serviceAccount.privateKey.length : 0}`);

      } else {

        throw new Error('Service account file not found in any of the expected paths');

      }

    } catch (fileError) {

      console.error('❌ Failed to read service account file:', fileError);



      // Fallback to environment variables if file not found

      console.log('🔄 Falling back to environment variables...');

      console.log('  - Project ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');

      console.log('  - Service Account Email:', process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL ? '✅' : '❌');

      console.log('  - Private Key:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');



      serviceAccount = {

        projectId: process.env.FIREBASE_PROJECT_ID,

        clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL,

        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

      };

      method = 'Environment Variables';

    }



    // Check if we have valid service account credentials

    if (serviceAccount?.projectId && serviceAccount?.clientEmail && serviceAccount?.privateKey) {

      admin.initializeApp({

        credential: admin.credential.cert(serviceAccount),

        projectId: serviceAccount.projectId

      });

      console.log('✅ Firebase Admin initialized successfully');

      console.log(`📋 Project: ${serviceAccount.projectId}`);

      console.log(`📧 Service Account: ${serviceAccount.clientEmail}`);

      console.log(`🔑 Method: ${method}`);

      return admin;

    } else {

      console.log('❌ Firebase Admin credentials not complete');

      console.log('🔍 Missing credentials:', {

        projectId: !!serviceAccount?.projectId,

        clientEmail: !!serviceAccount?.clientEmail,

        privateKey: !!serviceAccount?.privateKey

      });

      return admin;

    }

  } catch (error) {

    console.error('❌ Failed to initialize Firebase Admin:', error);

    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');

    return admin;

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

    // Initialize Firebase Admin

    const adminApp = initializeFirebaseAdmin();

    // Production URL for PWA direct access
    const productionBaseUrl = 'https://ukmbandbinusbekasi.vercel.app';
    const fullActionUrl = notification.actionUrl && notification.actionUrl.startsWith('http')
      ? notification.actionUrl
      : notification.actionUrl
        ? `${productionBaseUrl}${notification.actionUrl}`
        : `${productionBaseUrl}/dashboard/member`;



    if (adminApp.apps.length === 0) {

      return {

        success: false,

        message: 'Firebase Admin not initialized',

        sent: 0,

        failed: 0,

        total: 0,

        error: 'Firebase Admin initialization failed'

      };

    }

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



    // Prepare message for Firebase Admin SDK

    // Using EXACTLY the same working format as DEBUG API's token test

    const message = {

      notification: {

        title: notification.title,

        body: notification.body

      },

      data: {

        type: notification.data?.type || 'TEST_NOTIFICATION',

        test: 'false', // Different from debug

        timestamp: new Date().toISOString(),

        isDebugMessage: 'false', // Different from debug

        // CRITICAL: Service worker reads from payload.data!

        title: notification.title,

        body: notification.body,

        icon: notification.icon || '/icons/favicon.png',

        badge: notification.badge || '/icons/favicon.png',

        // Additional data

        userId: userId.toString(),

        // Production URL for PWA direct access
        actionUrl: fullActionUrl,

        eventId: notification.data?.eventId || '',

        tag: notification.tag || `notification-${Date.now()}`,

        // Convert any additional data to strings

        ...Object.fromEntries(

          Object.entries(notification.data || {}).map(([key, value]) => [

            key,

            typeof value === 'string' ? value : String(value)

          ])

        )

      },

      // Production URL for PWA direct access
      webpush: {

        fcm_options: {

          link: fullActionUrl

        },

        notification: {

          title: notification.title,

          body: notification.body,

          icon: notification.icon || '/icons/favicon.png',

          badge: notification.badge || '/icons/favicon.png',

          tag: notification.tag || `notification-${Date.now()}`,

          // Add click action for direct PWA access
          requireInteraction: false,

          silent: false

        }

      }

    };



    console.log('📋 Final FCM Message Structure:');

    console.log('  - Notification Fields:', Object.keys(message.notification));

    console.log('  - Title:', message.notification.title);

    console.log('  - Body:', message.notification.body);

    console.log('  - Data Keys:', Object.keys(message.data));

    console.log('  - Data Values (types):', Object.entries(message.data).map(([k, v]) => `${k}: ${typeof v}`));

    console.log('  - Webpush:', message.webpush ? 'Present' : 'Missing');



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

        const errorCode = (error as any)?.code || 'UNKNOWN';

        const errorInfo = (error as any)?.errorInfo || {};



        console.error(`❌ FCM send failed for ${subscription.token.substring(0, 20)}...:`);

        console.error(`   Error Code: ${errorCode}`);

        console.error(`   Error Message: ${errorMessage}`);

        console.error(`   Error Info:`, errorInfo);

        console.error(`   Subscription ID: ${subscription.id}`);



        results.push({

          token: subscription.token.substring(0, 20) + '...',

          status: 'failed',

          error: errorMessage,

          code: errorCode,

          fullError: errorInfo

        });



        // Remove invalid subscription for specific error codes

        const deactivationReasons = [

          'NotRegistered', 'InvalidRegistration', 'unregistered',

          'UNREGISTERED', 'INVALID_ARGUMENT', 'registration-token-not-registered'

        ];



        if (deactivationReasons.some(reason =>

          errorMessage.includes(reason) || errorCode.includes(reason) ||

          JSON.stringify(errorInfo).includes(reason)

        )) {

          await prisma.fCMSubscription.update({

            where: { id: subscription.id },

            data: { isActive: false }

          });

          console.log(`🗑️ Deactivated invalid subscription ${subscription.id}: ${subscription.token.substring(0, 20)}...`);

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

    console.log('🔍 Checking FCM Setup...');



    // Check service account file first

    let serviceAccountStatus = {

      hasServiceAccountFile: false,

      projectId: false,

      clientEmail: false,

      privateKey: false

    };



    let method = 'Environment Variables';

    let serviceAccount = null;



    try {

      // Try the same path resolution as in initializeFirebaseAdmin

      const possiblePaths = [

        path.join(process.cwd(), 'src', 'firebase', 'serviceAccount.json'),

        path.join(__dirname, '..', '..', 'firebase', 'serviceAccount.json'),

        'C:/Project/gitgitgut/UKM BAND/ukm-band-bekasi-dashboard/src/firebase/serviceAccount.json'

      ];



      let serviceAccountPath = null;

      for (const testPath of possiblePaths) {

        if (fs.existsSync(testPath)) {

          serviceAccountPath = testPath;

          break;

        }

      }



      if (serviceAccountPath) {

        const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');

        const rawServiceAccount = JSON.parse(serviceAccountContent);



        // Map Firebase service account field names to expected format

        serviceAccount = {

          projectId: rawServiceAccount.project_id,

          clientEmail: rawServiceAccount.client_email,

          privateKey: rawServiceAccount.private_key,

          type: rawServiceAccount.type,

          project_id: rawServiceAccount.project_id,

          client_email: rawServiceAccount.client_email,

          private_key: rawServiceAccount.private_key

        };



        serviceAccountStatus = {

          hasServiceAccountFile: true,

          projectId: !!serviceAccount.projectId,

          clientEmail: !!serviceAccount.clientEmail,

          privateKey: !!serviceAccount.privateKey

        };

        method = 'JSON File';

        console.log('✅ Service account file found and valid');

        console.log(`📋 Project ID: ${serviceAccount.projectId}`);

        console.log(`📧 Client Email: ${serviceAccount.clientEmail}`);

      } else {

        throw new Error('Service account file not found');

      }

    } catch (fileError) {

      console.log('❌ Service account file not found or invalid:', fileError.message);

      serviceAccountStatus = {

        hasServiceAccountFile: false,

        projectId: !!process.env.FIREBASE_PROJECT_ID,

        clientEmail: !!process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL,

        privateKey: !!process.env.FIREBASE_PRIVATE_KEY

      };

      method = 'Environment Variables';

    }



    // Initialize Firebase Admin if needed

    const adminApp = initializeFirebaseAdmin();



    if (adminApp.apps.length === 0) {

      return {

        initialized: false,

        error: 'Firebase Admin not initialized',

        method,

        serviceAccountStatus,

        envStatus: {

          projectId: !!process.env.FIREBASE_PROJECT_ID,

          serviceAccountEmail: !!process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL,

          privateKey: !!process.env.FIREBASE_PRIVATE_KEY

        }

      };

    }



    // Get project info from service account or environment

    let projectId = null;

    let serviceAccountEmail = null;



    if (serviceAccountStatus.hasServiceAccountFile && serviceAccount) {

      // Use mapped fields from service account file

      projectId = serviceAccount.projectId || serviceAccount.project_id;

      serviceAccountEmail = serviceAccount.clientEmail || serviceAccount.client_email;

    } else {

      projectId = process.env.FIREBASE_PROJECT_ID;

      serviceAccountEmail = process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL;

    }



    if (!projectId) {

      return {

        initialized: true,

        projectId: null,

        error: 'Project ID not configured',

        method,

        serviceAccountStatus

      };

    }



    return {

      initialized: true,

      projectId,

      serviceAccountEmail,

      method,

      serviceAccountStatus

    };

  } catch (error) {

    return {

      initialized: false,

      error: error instanceof Error ? error.message : 'Unknown error'

    };

  }

}



export default admin;