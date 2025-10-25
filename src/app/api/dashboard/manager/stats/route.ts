import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isManager } from '@/utils/roles';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log('Manager Stats API - Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      organizationLvl: session?.user?.organizationLvl,
      isManager: session?.user?.organizationLvl ? isManager(session.user.organizationLvl) : false
    });

    if (!session?.user?.organizationLvl || !isManager(session.user.organizationLvl)) {
      console.log('Manager Stats API - Unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized - Manager access required' },
        { status: 401 }
      );
    }

    const now = new Date();

    console.log('Manager Stats API - Fetching data...');

    // Ambil semua events untuk stats global
    const allEvents = await prisma.event.findMany({
      include: {
        personnel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    console.log('Manager Stats API - Events fetched:', allEvents.length);

    // Ambil semua users untuk member stats
    const totalMembers = await prisma.user.count();

  
    // Hitung stats event yang konsisten
    const totalEvents = allEvents.length;
    const upcomingEvents = allEvents.filter(e => new Date(e.date) > now).length;
    const finishedEvents = allEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate <= now || e.status === 'FINISHED';
    }).length;

    // Hitung member aktif (unique users yang pernah ikut event)
    const activeMembers = new Set();
    allEvents.forEach(event => {
      event.personnel?.forEach(p => {
        if (p.user) {
          activeMembers.add(p.user.id);
        }
      });
    });

    const stats = {
      totalEvents,
      totalMembers,
      upcomingEvents,
      finishedEvents,
      activeMembers: activeMembers.size,
    };

    console.log('Manager Stats API - Final stats:', stats);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching manager stats:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}