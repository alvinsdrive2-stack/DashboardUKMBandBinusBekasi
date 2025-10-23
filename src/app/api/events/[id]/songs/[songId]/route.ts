import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Update a song
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: eventId, songId } = await params;
    const { title, artist, key, duration, notes } = await request.json();

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

    // Verify song exists and belongs to this event
    const existingSong = await prisma.eventSong.findFirst({
      where: {
        id: songId,
        eventId: eventId
      }
    });

    if (!existingSong) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Update the song
    const updatedSong = await prisma.eventSong.update({
      where: { id: songId },
      data: {
        title: title.trim(),
        artist: artist?.trim() || '',
        key: key?.trim() || '',
        duration: duration?.trim() || '',
        notes: notes?.trim() || ''
      }
    });

    return NextResponse.json({
      message: 'Song updated successfully',
      song: updatedSong
    });

  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Failed to update song' },
      { status: 500 }
    );
  }
}

// Delete a song
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: eventId, songId } = await params;

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

    // Verify song exists and belongs to this event
    const existingSong = await prisma.eventSong.findFirst({
      where: {
        id: songId,
        eventId: eventId
      }
    });

    if (!existingSong) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Delete the song
    await prisma.eventSong.delete({
      where: { id: songId }
    });

    // Reorder remaining songs
    const remainingSongs = await prisma.eventSong.findMany({
      where: { eventId: eventId },
      orderBy: { order: 'asc' }
    });

    // Update order for remaining songs
    await prisma.$transaction(
      remainingSongs.map((song, index) =>
        prisma.eventSong.update({
          where: { id: song.id },
          data: { order: index + 1 }
        })
      )
    );

    return NextResponse.json({
      message: 'Song deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}