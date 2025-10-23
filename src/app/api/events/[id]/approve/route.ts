import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isManager } from '@/utils/roles';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationLvl || !isManager(session.user.organizationLvl)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be approve or reject' },
        { status: 400 }
      );
    }

    const { id: eventId } = await params;

    // Get the event first
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    let updatedEvent;

    if (action === 'approve') {
      // Update event status to DRAFT
      updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { status: 'DRAFT' }
      });

      // Create 6 default personnel slots
      const defaultRoles = [
        { role: 'Vocal', status: 'PENDING' },
        { role: 'Guitar 1', status: 'PENDING' },
        { role: 'Guitar 2', status: 'PENDING' },
        { role: 'Keyboard', status: 'PENDING' },
        { role: 'Bass', status: 'PENDING' },
        { role: 'Drum', status: 'PENDING' }
      ];

      await prisma.eventPersonnel.createMany({
        data: defaultRoles.map(slot => ({
          eventId: eventId,
          role: slot.role,
          status: slot.status as any,
          userId: null, // All slots start empty
        }))
      });
    } else {
      // Reject the event
      updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { status: 'REJECTED' }
      });
    }

    return NextResponse.json({
      message: `Event ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}