import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AutoNotificationService from '@/services/autoNotificationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Fetch songs from EventSong table where eventId matches
    const songs = await prisma.eventSong.findMany({
      where: {
        eventId: eventId
      },
      orderBy: {
        order: 'asc' // Sort by song order in setlist
      }
    });

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching event songs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, artist, key, duration, notes, order } = body;

    if (!title || !artist) {
      return NextResponse.json(
        { error: 'Title and artist are required' },
        { status: 400 }
      );
    }

    // Get current max order for this event
    const maxOrder = await prisma.eventSong.findFirst({
      where: { eventId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const nextOrder = order || (maxOrder ? maxOrder.order + 1 : 1);

    // Create new song
    const newSong = await prisma.eventSong.create({
      data: {
        title,
        artist,
        key: key || 'C',
        duration: duration || null,
        notes: notes || null,
        order: nextOrder,
        eventId
      }
    });

    // Send FCM notifications to event members
    try {
      await AutoNotificationService.notifySongAdded(newSong.id, title, eventId);
      console.log(`FCM notifications sent for new song: ${title}`);
    } catch (notificationError) {
      console.error('Failed to send FCM notifications for new song:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      message: 'Song added successfully',
      song: newSong
    });

  } catch (error) {
    console.error('Error adding event song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}