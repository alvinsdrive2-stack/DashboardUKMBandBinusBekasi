import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isManager } from '@/utils/roles';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationLvl || !isManager(session.user.organizationLvl)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause = status ? { status: status as any } : {};

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        slotConfigurable: true,
        slotConfiguration: true,
        personnel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationLvl || !isManager(session.user.organizationLvl)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      date,
      location
    } = body;

    // Validate required fields
    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Title, date, dan location wajib diisi' },
        { status: 400 }
      );
    }

    // Create event with PUBLISHED status (directly available for members)
    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        status: 'PUBLISHED',
        isSubmittedByPublic: false,
      },
    });

    // Create 6 default personnel slots for published events
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
        eventId: event.id,
        role: slot.role,
        status: slot.status as any, // Type assertion for Prisma
        userId: null, // All slots start empty
      }))
    });

    return NextResponse.json({
      message: 'Acara berhasil dibuat',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}