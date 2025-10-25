import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Update event (manager only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Authorization check - only commissioners and managers can update
    if (!session?.user?.organizationLvl ||
        (session.user.organizationLvl !== 'COMMISSIONER' &&
         session.user.organizationLvl !== 'PENGURUS')) {
      return NextResponse.json(
        { error: 'Unauthorized - Manager access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { title, description, date, location, status } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Event date is required' },
        { status: 400 }
      );
    }

    if (!location || !location.trim()) {
      return NextResponse.json(
        { error: 'Event location is required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: id }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        location: location.trim(),
        status: status || existingEvent.status
      },
      include: {
        personnel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Invalidate cache
    try {
      const { cache } = await import('@/lib/cache');
      await cache.invalidatePattern([
        'events:*',
        'dashboard:*'
      ]);
    } catch (error) {
      // Cache invalidation failed, but continue
      console.warn('Cache invalidation failed:', error);
    }

    return NextResponse.json({
      message: 'Event updated successfully',
      event: {
        ...updatedEvent,
        date: updatedEvent.date.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// Delete event (manager only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Authorization check - only commissioners and managers can delete
    if (!session?.user?.organizationLvl ||
        (session.user.organizationLvl !== 'COMMISSIONER' &&
         session.user.organizationLvl !== 'PENGURUS')) {
      return NextResponse.json(
        { error: 'Unauthorized - Manager access required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: id },
      include: {
        personnel: true,
        _count: {
          select: {
            personnel: {
              where: {
                status: 'APPROVED'
              }
            }
          }
        }
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Allow deletion regardless of registrations, but log the warning
    if (existingEvent._count.personnel > 0) {
      console.warn(`Event ${id} has ${existingEvent._count.personnel} approved registrations but will be deleted anyway`);
    }

    // Start a transaction to ensure data consistency
    const deletionResults = await prisma.$transaction(async (tx) => {
      console.log(`Starting deletion process for event: ${id}`);

      // Step 1: Delete all EventPersonnel records (performers) for this event
      console.log(`Step 1: Deleting EventPersonnel for event: ${id}`);
      const deletedPersonnel = await tx.eventPersonnel.deleteMany({
        where: {
          eventId: id
        }
      });
      console.log(`Deleted ${deletedPersonnel.count} EventPersonnel records`);

      // Step 2: Delete all EventSong records for this event
      console.log(`Step 2: Deleting EventSong for event: ${id}`);
      const deletedSongs = await tx.eventSong.deleteMany({
        where: {
          eventId: id
        }
      });
      console.log(`Deleted ${deletedSongs.count} EventSong records`);

      // Step 3: Delete all EventSlot records for this event (if they exist)
      console.log(`Step 3: Deleting EventSlots for event: ${id}`);
      const deletedSlots = await tx.eventSlot.deleteMany({
        where: {
          eventId: id
        }
      });
      console.log(`Deleted ${deletedSlots.count} EventSlot records`);

      // Step 4: Delete the event itself
      console.log(`Step 4: Deleting Event: ${id}`);
      await tx.event.delete({
        where: { id: id }
      });

      console.log(`Successfully completed deletion of event: ${id}`);
      console.log(`Summary: ${deletedPersonnel.count} personnel, ${deletedSongs.count} songs, ${deletedSlots.count} slots deleted`);

      return {
        deletedPersonnel: deletedPersonnel.count,
        deletedSongs: deletedSongs.count,
        deletedSlots: deletedSlots.count
      };
    });

    // Invalidate cache
    try {
      const { cache } = await import('@/lib/cache');
      await cache.invalidatePattern([
        'events:*',
        'dashboard:*'
      ]);
    } catch (error) {
      // Cache invalidation failed, but continue
      console.warn('Cache invalidation failed:', error);
    }

    return NextResponse.json({
      message: 'Event deleted successfully',
      deletedPersonnel: deletionResults.deletedPersonnel,
      deletedSongs: deletionResults.deletedSongs,
      deletedSlots: deletionResults.deletedSlots
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}