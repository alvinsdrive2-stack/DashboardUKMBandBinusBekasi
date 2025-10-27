import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get personnel for an event
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

    // Get all personnel for this event with user details
    const personnel = await prisma.eventPersonnel.findMany({
      where: {
        eventId: eventId,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            instruments: true,
            major: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({
      personnel: personnel,
      total: personnel.length
    });

  } catch (error) {
    console.error('Error fetching event personnel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personnel' },
      { status: 500 }
    );
  }
}