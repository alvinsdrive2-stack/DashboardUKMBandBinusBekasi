import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isMember } from '@/utils/roles';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationLvl || !isMember(session.user.organizationLvl)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Fetching event detail with all personnel for event ID: ${eventId}`);

    // Fetch event with ALL personnel (not just user's personnel)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        personnel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nim: true,
                major: true,
                instruments: true
              }
            }
          },
          orderBy: {
            role: 'asc'
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Event detail fetched successfully with ${event.personnel?.length || 0} personnel`);

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event detail:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}