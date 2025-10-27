import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isManager } from '@/utils/roles';
import { emitNotificationToMultipleUsers } from '@/utils/notificationEmitter';

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
        personnel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nim: true,
                major: true,
                phoneNumber: true,
                organizationLvl: true,
                instruments: true,
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
    console.log('Request body:', JSON.stringify(body, null, 2));

    const {
      title,
      description,
      date,
      location,
      slotConfigurable,
      slotConfiguration
    } = body;

    console.log('Destructured variables:', {
      title,
      description,
      date,
      location,
      slotConfigurable,
      slotConfiguration
    });

    // Validate required fields
    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Title, date, dan location wajib diisi' },
        { status: 400 }
      );
    }

    // Create event with PUBLISHED status (directly available for members)
    // Ensure proper date handling - date should already be in ISO format from frontend
    const eventDate = new Date(date);
    console.log('Creating event with date:', {
      input: date,
      parsed: eventDate.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: eventDate,
        location,
        status: 'PUBLISHED',
        isSubmittedByPublic: false,
      },
    });

    // Create personnel slots based on configuration
    let personnelSlots = [];

    if (slotConfigurable && slotConfiguration && slotConfiguration.length > 0) {
      // Use custom slot configuration
      for (const slot of slotConfiguration) {
        for (let i = 1; i <= slot.count; i++) {
          const slotName = slot.count > 1 ? `${slot.name} ${i}` : slot.name;
          personnelSlots.push({
            eventId: event.id,
            role: slotName,
            status: 'PENDING',
            userId: null, // All slots start empty
          });
        }
      }
    } else {
      // Use default slot configuration
      const defaultRoles = [
        { role: 'Vocal', status: 'PENDING' },
        { role: 'Guitar 1', status: 'PENDING' },
        { role: 'Guitar 2', status: 'PENDING' },
        { role: 'Keyboard', status: 'PENDING' },
        { role: 'Bass', status: 'PENDING' },
        { role: 'Drum', status: 'PENDING' }
      ];

      personnelSlots = defaultRoles.map((slot: any) => ({
        eventId: event.id,
        role: slot.role,
        status: slot.status,
        userId: null, // All slots start empty
      }));
    }

    await prisma.eventPersonnel.createMany({
      data: personnelSlots
    });

    // Send notifications to all members about new event
    try {
      // Get all members (non-manager users)
      const members = await prisma.user.findMany({
        where: {
          organizationLvl: {
            in: ['TALENT', 'SPECTA']
          }
        },
        select: {
          id: true
        }
      });

      // Create notifications for all members
      const notificationData = {
        title: 'Acara Baru Tersedia!',
        message: `Acara baru "${title}" telah dibuat. Segera daftar untuk ikut serta!`,
        type: 'EVENT_STATUS_CHANGED',
        eventId: event.id,
        actionUrl: '/dashboard/member/available-events'
      };

      // Create notifications directly using Prisma
      await prisma.notification.createMany({
        data: members.map(member => ({
          userId: member.id,
          ...notificationData,
          isRead: false
        }))
      });

      // Send real-time notifications
      emitNotificationToMultipleUsers(
        members.map(m => m.id),
        {
          id: `temp-${Date.now()}`, // Temporary ID
          ...notificationData,
          isRead: false,
          createdAt: new Date().toISOString()
        }
      );

      console.log(`Notifications sent to ${members.length} members for new event: ${title}`);
    } catch (notificationError) {
      console.error('Failed to send notifications for new event:', notificationError);
      // Don't fail the request if notifications fail
    }

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