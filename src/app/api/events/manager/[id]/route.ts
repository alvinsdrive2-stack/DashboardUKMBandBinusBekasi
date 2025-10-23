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

    // Authorization check - only commissioners can delete
    if (!session?.user?.organizationLvl ||
        session.user.organizationLvl !== 'COMMISSIONER') {
      return NextResponse.json(
        { error: 'Unauthorized - Only commissioners can delete events' },
        { status: 401 }
      );
    }

    const { id } = await params;

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

    // Check if event has approved registrations
    const approvedRegistrations = await prisma.eventPersonnel.count({
      where: {
        eventId: id,
        status: 'APPROVED'
      }
    });

    if (approvedRegistrations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with approved registrations' },
        { status: 400 }
      );
    }

    // Delete event (cascade delete will handle personnel and songs)
    await prisma.event.delete({
      where: { id: id }
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
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}