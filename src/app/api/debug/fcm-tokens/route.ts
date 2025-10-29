import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log(`🔍 Debug FCM Tokens - User: ${userId}`);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get ALL subscriptions (active and inactive) for debugging
    const allSubscriptions = await prisma.fCMSubscription.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get only active subscriptions
    const activeSubscriptions = await prisma.fCMSubscription.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total subscriptions: ${allSubscriptions.length}`);
    console.log(`✅ Active subscriptions: ${activeSubscriptions.length}`);

    return NextResponse.json({
      userId,
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      allSubscriptions: allSubscriptions.map(sub => ({
        id: sub.id,
        token: sub.token.substring(0, 30) + '...',
        isActive: sub.isActive,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        deviceInfo: sub.deviceInfo
      })),
      activeSubscriptions: activeSubscriptions.map(sub => ({
        id: sub.id,
        token: sub.token.substring(0, 30) + '...',
        createdAt: sub.createdAt,
        deviceInfo: sub.deviceInfo
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug FCM tokens error:', error);
    return NextResponse.json(
      { error: 'Failed to debug FCM tokens' },
      { status: 500 }
    );
  }
}