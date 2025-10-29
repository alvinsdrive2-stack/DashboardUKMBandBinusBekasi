import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (action === 'cleanup-all') {
      // Deactivate all FCM subscriptions for user
      const result = await prisma.fCMSubscription.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: `Deactivated ${result.count} FCM subscriptions for user ${userId}`,
        deactivated: result.count
      });
    }

    if (action === 'cleanup-invalid') {
      // Get all FCM subscriptions for user
      const subscriptions = await prisma.fCMSubscription.findMany({
        where: { userId }
      });

      const tokensToDeactivate: string[] = [];

      // Check each token format (basic validation)
      subscriptions.forEach(sub => {
        if (!sub.token || sub.token.length < 100) {
          tokensToDeactivate.push(sub.id);
        }
      });

      // Deactivate invalid tokens
      if (tokensToDeactivate.length > 0) {
        await prisma.fCMSubscription.updateMany({
          where: { id: { in: tokensToDeactivate } },
          data: { isActive: false }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Deactivated ${tokensToDeactivate.length} invalid FCM tokens`,
        deactivated: tokensToDeactivate.length
      });
    }

    if (action === 'reactivate-all') {
      // Reactivate all FCM subscriptions for user
      const result = await prisma.fCMSubscription.updateMany({
        where: { userId },
        data: { isActive: true }
      });

      return NextResponse.json({
        success: true,
        message: `Reactivated ${result.count} FCM subscriptions for user ${userId}`,
        reactivated: result.count
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error cleaning up FCM tokens:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup FCM tokens' },
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
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get all FCM subscriptions for user
    const subscriptions = await prisma.fCMSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        token: true,
        createdAt: true,
        isActive: true,
        deviceInfo: true
      }
    });

    // Analyze tokens
    const analysis = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.isActive).length,
      inactive: subscriptions.filter(s => !s.isActive).length,
      tokensWithIssues: subscriptions.filter(s => !s.token || s.token.length < 100).length
    };

    return NextResponse.json({
      success: true,
      userId,
      subscriptions,
      analysis
    });

  } catch (error) {
    console.error('Error getting FCM subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get FCM subscriptions' },
      { status: 500 }
    );
  }
}