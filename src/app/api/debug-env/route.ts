import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envStatus = {
      // Firebase Environment Variables
      firebase_project_id: {
        value: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT_SET',
        length: process.env.FIREBASE_PROJECT_ID?.length || 0
      },
      firebase_service_account_email: {
        value: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT_SET',
        length: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL?.length || 0
      },
      firebase_private_key: {
        value: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT_SET',
        length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        starts_with: process.env.FIREBASE_PRIVATE_KEY?.startsWith('-----BEGIN') || false
      },

      // Public Firebase Variables
      next_public_firebase_api_key: {
        value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length || 0
      },
      next_public_firebase_project_id: {
        value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.length || 0
      },

      // VAPID Variables
      next_public_fcm_vapid_key: {
        value: process.env.NEXT_PUBLIC_FCM_VAPID_KEY ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_FCM_VAPID_KEY?.length || 0
      },

      // General
      nextauth_url: process.env.NEXTAUTH_URL,
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Environment variables debug info',
      data: envStatus
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}