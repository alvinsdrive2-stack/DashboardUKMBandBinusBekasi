import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Reorder songs in an event
export async function PUT(
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
    const { songs } = await request.json();

    if (!songs || !Array.isArray(songs)) {
      return NextResponse.json(
        { error: 'Songs array is required' },
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

    // Update song orders in a transaction
    await prisma.$transaction(
      songs.map(({ id, order }: { id: string; order: number }) =>
        prisma.eventSong.update({
          where: { id: id },
          data: { order: order }
        })
      )
    );

    return NextResponse.json({
      message: 'Songs reordered successfully'
    });

  } catch (error) {
    console.error('Error reordering songs:', error);
    return NextResponse.json(
      { error: 'Failed to reorder songs' },
      { status: 500 }
    );
  }
}