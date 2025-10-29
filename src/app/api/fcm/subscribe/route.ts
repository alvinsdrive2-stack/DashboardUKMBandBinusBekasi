import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fcmToken, deviceInfo } = body;

    if (!userId || !fcmToken) {
      return NextResponse.json(
        { error: 'userId and fcmToken are required' },
        { status: 400 }
      );
    }

    console.log(`📱 FCM Subscribe Request:`);
    console.log(`- User ID: ${userId}`);
    console.log(`- FCM Token: ${fcmToken.substring(0, 50)}...`);
    console.log(`- Device Info:`, deviceInfo);

    // Check if token already exists for this user
    const existingSubscription = await prisma.fCMSubscription.findFirst({
      where: {
        userId,
        token: fcmToken
      }
    });

    if (existingSubscription) {
      console.log(`🔄 Updating existing subscription: ${existingSubscription.id}`);
      // Update existing subscription
      await prisma.fCMSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          deviceInfo: deviceInfo || {},
          isActive: true,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'FCM subscription updated successfully',
        subscriptionId: existingSubscription.id,
        action: 'updated'
      });
    } else {
      // Check if token exists for another user (handle shared device case)
      const tokenOwnedByOtherUser = await prisma.fCMSubscription.findFirst({
        where: {
          token: fcmToken,
          userId: { not: userId }
        }
      });

      if (tokenOwnedByOtherUser) {
        console.log(`⚠️ Token already owned by another user: ${tokenOwnedByOtherUser.userId}`);
        console.log(`🔄 Deactivating old subscription and creating new one`);

        // Deactivate the old subscription
        await prisma.fCMSubscription.update({
          where: { id: tokenOwnedByOtherUser.id },
          data: { isActive: false }
        });
      }

      console.log(`➕ Creating new subscription for user: ${userId}`);
      // Create new subscription
      const newSubscription = await prisma.fCMSubscription.create({
        data: {
          userId,
          token: fcmToken,
          deviceInfo: deviceInfo || {},
          isActive: true
        }
      });

      console.log(`✅ New subscription created: ${newSubscription.id}`);

      return NextResponse.json({
        success: true,
        message: 'FCM subscription created successfully',
        subscriptionId: newSubscription.id,
        action: 'created',
        previousDeactivated: tokenOwnedByOtherUser?.id || null
      });
    }

  } catch (error) {
    console.error('❌ Error saving FCM subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save FCM subscription' },
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

    // Get all active FCM subscriptions for user
    const subscriptions = await prisma.fCMSubscription.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    return NextResponse.json({
      userId,
      subscriptionCount: subscriptions.length,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        token: sub.token.substring(0, 20) + '...', // Only return partial token for security
        deviceInfo: sub.deviceInfo,
        createdAt: sub.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching FCM subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FCM subscriptions' },
      { status: 500 }
    );
  }
}