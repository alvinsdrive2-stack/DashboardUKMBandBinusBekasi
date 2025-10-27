import { NextRequest, NextResponse } from 'next/server';
import { sendFCMNotification, checkFCMSetup } from '@/lib/fcmAdmin';

export async function POST(request: NextRequest) {
  try {
    // Check FCM setup first
    const setup = await checkFCMSetup();
    if (!setup.initialized) {
      return NextResponse.json({
        success: false,
        message: 'Firebase Admin not initialized',
        error: setup.error,
        sent: 0
      });
    }

    const body = await request.json();
    const { userId, title, body: message, icon, badge, tag, image, data, actionUrl } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'userId, title, and message are required' },
        { status: 400 }
      );
    }

    console.log(`📤 FCM Admin: Sending notification to user ${userId}`);
    console.log(`📋 FCM Admin: Title: ${title}`);
    console.log(`📋 FCM Admin: Setup:`, setup);

    // Send using Firebase Admin SDK
    const result = await sendFCMNotification(userId, {
      title,
      body: message,
      icon,
      badge,
      tag,
      image,
      data,
      actionUrl
    });

    console.log(`📊 FCM Admin result:`, result);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      sent: result.sent,
      failed: result.failed,
      total: result.total,
      results: result.results,
      setup
    });

  } catch (error) {
    console.error('❌ FCM Admin send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send FCM notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const setup = await checkFCMSetup();

    return NextResponse.json({
      setup,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ FCM Admin check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check FCM setup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}