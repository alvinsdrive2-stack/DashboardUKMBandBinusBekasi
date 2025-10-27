import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// Configure VAPID only if keys are available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'ukm-band@example.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription object is required' },
        { status: 400 }
      );
    }

    // Validate subscription format
    if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription format' },
        { status: 400 }
      );
    }

    // Store subscription in database
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: session.user.id,
        endpoint: subscription.endpoint
      }
    });

    let savedSubscription;
    if (existingSubscription) {
      // Update existing subscription
      savedSubscription = await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: request.headers.get('user-agent')
        }
      });
    } else {
      // Create new subscription
      savedSubscription = await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: request.headers.get('user-agent')
        }
      });
    }

    // Test the subscription by sending a test notification (only if VAPID is configured)
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: 'Notifications Enabled',
          message: 'You will now receive push notifications from UKM Band Dashboard',
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png',
          tag: 'subscription-test',
          data: {
            type: 'SUBSCRIPTION_SUCCESS',
            url: '/dashboard/member'
          }
        }));
      } catch (error) {
        console.error('Failed to send test notification:', error);
        // Don't fail the subscription if test notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully',
      subscription: savedSubscription
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Delete subscription from database
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: endpoint
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete push subscription' },
      { status: 500 }
    );
  }
}