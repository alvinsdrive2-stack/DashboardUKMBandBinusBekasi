import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get all songs from all published events for manager
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authorization check - only commissioners and managers can access
    if (!session?.user?.organizationLvl ||
        (session.user.organizationLvl !== 'COMMISSIONER' &&
         session.user.organizationLvl !== 'PENGURUS')) {
      return NextResponse.json(
        { error: 'Unauthorized - Manager access required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Build where clause
    const whereClause: any = {
      event: {
        status: 'PUBLISHED'
      }
    };

    if (eventId) {
      whereClause.eventId = eventId;
    }

    // Optimized query with better joins
    const songs = await prisma.$queryRaw`
      SELECT
        es.id,
        es.title,
        es.artist,
        es."key",
        es.duration,
        es.notes,
        es.order,
        es."eventId",
        es."createdAt",
        es."updatedAt",
        e.title as "eventTitle",
        e.date as "eventDate",
        e.location as "eventLocation",
        e.status as "eventStatus"
      FROM "EventSong" es
      INNER JOIN "Event" e ON e.id = es."eventId"
      WHERE e.status = 'PUBLISHED'
        ${eventId ? `AND es."eventId" = ${eventId}` : ''}
      ORDER BY e.date DESC, es."order" ASC
      LIMIT 100
    `;

    // Format the response
    const formattedSongs = (songs as any[]).map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      key: song.key,
      duration: song.duration,
      notes: song.notes,
      order: parseInt(song.order),
      eventId: song.eventId,
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
      event: {
        id: song.eventId,
        title: song.eventTitle,
        date: song.eventDate,
        location: song.eventLocation,
        status: song.eventStatus
      }
    }));

    return NextResponse.json(formattedSongs);

  } catch (error) {
    console.error('Error fetching manager songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
}