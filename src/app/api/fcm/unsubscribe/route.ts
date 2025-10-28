import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, fcmToken } = await request.json();

    if (!userId || !fcmToken) {
      return NextResponse.json(
        { error: 'userId and fcmToken are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual unsubscribe logic in your database
    // For now, just log the unsubscribe request
    console.log(`🔕 FCM Unsubscribe Request:`);
    console.log(`- User ID: ${userId}`);
    console.log(`- FCM Token: ${fcmToken.substring(0, 30)}...`);
    console.log(`- Timestamp: ${new Date().toISOString()}`);

    // Example database operation (uncomment and adapt for your database):
    // await prisma.fcmToken.deleteMany({
    //   where: {
    //     userId: userId,
    //     token: fcmToken
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from FCM notifications',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FCM unsubscribe error:', error);

    return NextResponse.json(
      {
        error: 'Failed to unsubscribe from FCM notifications',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}