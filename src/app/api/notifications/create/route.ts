import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationTriggerService } from '@/services/notificationTriggerService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, message, type, eventId, actionUrl } = body;

    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'userId, title, message, and type are required' },
        { status: 400 }
      );
    }

    // Verify current user is admin or creating notification for themselves
    const currentUser = await prisma?.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = currentUser.organizationLvl === 'COMMISSIONER' ||
                   currentUser.organizationLvl === 'PENGURUS';

    if (!isAdmin && userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Can only create notifications for yourself' },
        { status: 403 }
      );
    }

    const notification = await notificationTriggerService.createNotification({
      userId,
      title,
      message,
      type,
      eventId,
      actionUrl
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}