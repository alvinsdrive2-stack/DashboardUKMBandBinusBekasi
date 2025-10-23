import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// Asumsikan path ini benar
import { authOptions } from '@/lib/auth'; 
import { prisma } from '@/lib/prisma';
import { isMember } from '@/utils/roles';
import { cache } from '@/lib/cache';

// Map role instruments to standard instrument names for flexible matching
const roleToInstrumentMap: { [key: string]: string[] } = {
  'Vocal': ['vocal', 'vocals', 'singer', 'vocalist', 'nyanyi', 'menyanyi', 'vokal', 'vokalis'],
  'Vokal': ['vocal', 'vocals', 'singer', 'vocalist', 'nyanyi', 'menyanyi', 'vokal', 'vokalis'],
  'Guitar 1': ['guitar', 'gitar', 'guitarist', 'electric guitar', 'acoustic guitar', 'gitaris'],
  'Guitar 2': ['guitar', 'gitar', 'guitarist', 'electric guitar', 'acoustic guitar', 'gitaris'],
  'Gitar 1': ['guitar', 'gitar', 'guitarist', 'electric guitar', 'acoustic guitar', 'gitaris'],
  'Gitar 2': ['guitar', 'gitar', 'guitarist', 'electric guitar', 'acoustic guitar', 'gitaris'],
  'Keyboard': ['keyboard', 'piano', 'keys', 'synthesizer', 'pianist', 'pianis'],
  'Bass': ['bass', 'bass guitar', 'bassist', 'bas'],
  'Drum': ['drum', 'drums', 'drummer', 'percussion', 'drumer'],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    // 1. Authorization Check
    if (!session?.user?.organizationLvl || !isMember(session.user.organizationLvl)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only members can register for events' },
        { status: 401 }
      );
    }

    // 2. Body and URL Parameter Extraction
    const { personnelId, slotId } = await request.json();

    if (!personnelId) {
      return NextResponse.json(
        { error: 'Personnel ID is required' },
        { status: 400 }
      );
    }

    // Await params to get the id (Next.js 15 change)
    const { id: eventId } = await params; 
    const userId = session.user.id;

    // 3. Transaction for Data Integrity and Lookups
    const result = await prisma.$transaction(async (tx) => {
      // Get event, user, and personnel in parallel (within transaction)
      const [event, user, personnel] = await Promise.all([
        tx.event.findUnique({
          where: { id: eventId },
          select: { id: true, status: true }
        }),
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, instruments: true, name: true }
        }),
        tx.eventPersonnel.findUnique({
          where: { id: personnelId },
          select: { id: true, eventId: true, userId: true, role: true }
        })
      ]);

      // Validations
      if (!event || event.status !== 'PUBLISHED') {
        throw new Error('Event not found or not available for registration');
      }

      if (!user) {
        throw new Error('User not found');
      }

      if (!personnel || personnel.eventId !== eventId) {
        throw new Error('Personnel slot not found');
      }

      if (personnel.userId !== null) {
        throw new Error('This slot is already taken');
      }

      // Validasi tambahan untuk slot selection
      if (slotId) {
        // Cek apakah slot tersedia dan aktif
        const slot = await tx.eventSlot.findUnique({
          where: {
            id: slotId,
            eventId: eventId,
            isActive: true
          }
        });

        if (!slot) {
          throw new Error('Selected slot not available or inactive');
        }

        // Cek apakah slot sudah diisi oleh user lain
        const slotTaken = await tx.eventPersonnel.findFirst({
          where: {
            slotId: slotId,
            status: { in: ['APPROVED', 'PENDING'] }
          }
        });

        if (slotTaken && slotTaken.userId !== userId) {
          throw new Error('This slot is already taken by another member');
        }
      }

      // Check if user is already registered in a different slot for this event
      const existingRegistration = await tx.eventPersonnel.findFirst({
        where: {
          eventId: eventId,
          userId: userId
        },
        select: { id: true }
      });

      if (existingRegistration) {
        throw new Error('You are already registered for this event');
      }

      return { event, user, personnel };
    });

    const { user, personnel } = result;

    // 4. Instrument Matching Check (Flexible Logic)
    const roleInstruments = roleToInstrumentMap[personnel.role] || [];
    const userInstruments = user.instruments.map(i => i.toLowerCase().trim());

    const roleMatches = roleInstruments.length === 0 || roleInstruments.some(roleInstrument => {
      return userInstruments.some(userInstrument => {
        // 1. Exact match
        if (userInstrument === roleInstrument) return true;
        // 2. Partial matches (e.g., "gitaris" includes "gitar")
        if (userInstrument.includes(roleInstrument) || roleInstrument.includes(userInstrument)) return true;
        // 3. Special handling for common variations (e.g., 'guitar' vs 'gitar')
        if ((userInstrument.includes('guitar') && roleInstrument.includes('gitar')) ||
            (userInstrument.includes('gitar') && roleInstrument.includes('guitar'))) return true;
        if ((userInstrument.includes('vocal') && roleInstrument.includes('vokal')) ||
            (userInstrument.includes('vokal') && roleInstrument.includes('vocal'))) return true;
        if ((userInstrument.includes('bass') && roleInstrument.includes('bas')) ||
            (userInstrument.includes('bas') && roleInstrument.includes('bass'))) return true;
        return false;
      });
    });

    // Handle failure of instrument check
    if (roleInstruments.length > 0 && !roleMatches) {
      return NextResponse.json(
        {
          error: `Anda tidak bisa mendaftar untuk role "${personnel.role}". Role ini membutuhkan skill: ${roleInstruments.join(', ')} sedangkan skill Anda: ${user.instruments.join(', ')}`
        },
        { status: 400 }
      );
    }
    
    // 5. Register User (Update Personnel Slot)
    const updatedPersonnel = await prisma.eventPersonnel.update({
      where: { id: personnelId },
      data: {
        userId: userId,
        slotId: slotId || null, // Update slotId jika dipilih
        status: 'APPROVED' // Auto approve
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          }
        }
      }
    });

    // 6. Cache Invalidation (Clear cache on success)
    await cache.invalidatePattern([
      `events:*`,
      `dashboard:*`,
      `stats:${userId}`
    ]);

    // 7. Success Response
    const processingTime = Date.now() - startTime;
    console.log(`Registration completed in ${processingTime}ms for user ${userId}, event ${eventId}`);

    return NextResponse.json({
      message: 'Anda berhasil mendaftar untuk acara ini!',
      personnel: updatedPersonnel,
      processingTime
    });

  } catch (error: any) {

    // 8. Error Response
    // Custom logic to return specific user-friendly errors
    const errorMessage = error.message.includes('Anda tidak bisa mendaftar') ||
                        error.message.includes('sudah terdaftar') ||
                        error.message.includes('already taken') ||
                        error.message.includes('not found')
      ? error.message
      : 'Terjadi kesalahan server. Silakan coba lagi.';

    return NextResponse.json(
      { error: errorMessage },
      { status: error.message.includes('Unauthorized') ? 401 : 400 }
    );
  }
}