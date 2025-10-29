import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🕵️ Fetching notification debug logs...');

    // Return info about debugging system
    return NextResponse.json({
      message: 'Notification Debugger Active',
      instructions: [
        '1. Open browser console (F12) to see notification logs',
        '2. Send FCM test notification',
        '3. Check console for detailed notification tracking',
        '4. Look for [SOURCE] tags to identify who creates notifications'
      ],
      expectedLogs: [
        '🕵️ [filename.tsx] CREATED: Notification created',
        '📨 [SERVICE WORKER] Creating notification from FCM',
        '📱 [useFCM.ts] Foreground message received',
        '📱 [lib/firebase.ts] FCM Foreground message received'
      ],
      troubleshooting: {
        ifMultipleNotifications: [
          'Check for multiple [CREATED] logs',
          'Look for disabled sources that still create notifications',
          'Verify service worker vs client-side handling'
        ],
        ifNoNotifications: [
          'Check browser notification permissions',
          'Verify service worker registration',
          'Check Firebase Admin SDK initialization'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching notification logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification logs' },
      { status: 500 }
    );
  }
}