import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isMember } from '@/utils/roles';

// Get songs for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;

    // Verify user is registered for this event
    const registration = await prisma.eventPersonnel.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id,
        status: 'APPROVED'
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 403 }
      );
    }

    // Get songs for this event, ordered by their order field
    const songs = await prisma.eventSong.findMany({
      where: { eventId: eventId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      songs: songs,
      total: songs.length
    });

  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}

// Add a new song to an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;
    const { title, artist, key, duration, notes, order } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Song title is required' },
        { status: 400 }
      );
    }

    // Verify user is registered for this event
    const registration = await prisma.eventPersonnel.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id,
        status: 'APPROVED'
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 403 }
      );
    }

    // If order is not specified, put it at the end
    let songOrder = order;
    if (!songOrder) {
      const lastSong = await prisma.eventSong.findFirst({
        where: { eventId: eventId },
        orderBy: { order: 'desc' }
      });
      songOrder = lastSong ? lastSong.order + 1 : 1;
    }

    // Create the song
    const song = await prisma.eventSong.create({
      data: {
        title: title.trim(),
        artist: artist?.trim() || '',
        key: key?.trim() || '',
        duration: duration?.trim() || '',
        notes: notes?.trim() || '',
        order: songOrder,
        eventId: eventId
      }
    });

    return NextResponse.json({
      message: 'Song added successfully',
      song: song
    });

  } catch (error) {
    console.error('Error adding song:', error);
    return NextResponse.json(
      { error: 'Failed to add song' },
      { status: 500 }
    );
  }
}