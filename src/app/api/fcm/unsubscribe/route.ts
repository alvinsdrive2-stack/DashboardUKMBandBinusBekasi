import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, fcmToken } = await request.json();

    if (!userId || !fcmToken) {
      return NextResponse.json(
        { error: 'userId and fcmToken are required' },
        { status: 400 }
      );
    }

    console.log(`📱 Unsubscribing user ${userId} from FCM notifications`);

    // Find and deactivate the subscription
    const subscription = await prisma.fCMSubscription.findFirst({
      where: {
        userId,
        token: fcmToken,
        isActive: true
      }
    });

    if (subscription) {
      await prisma.fCMSubscription.update({
        where: { id: subscription.id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      console.log('✅ FCM subscription deactivated');
      return NextResponse.json({
        success: true,
        message: 'FCM subscription deactivated successfully'
      });
    } else {
      console.log('⚠️ No active FCM subscription found');
      return NextResponse.json({
        success: true,
        message: 'No active subscription found'
      });
    }

  } catch (error) {
    console.error('❌ FCM unsubscription failed:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from FCM notifications' },
      { status: 500 }
    );
  }
}