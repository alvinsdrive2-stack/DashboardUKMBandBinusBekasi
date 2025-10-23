import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isMember } from '@/utils/roles';

// Simple cache for dashboard events (3 minutes)
const eventsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationLvl || !isMember(session.user.organizationLvl)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200); // Max 200 items for dashboard
    const skip = (page - 1) * limit;

    // Check cache first (only cache first page)
    const cacheKey = `events_dashboard_page_${page}_limit_${limit}`;
    if (page === 1) {
      const cached = eventsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('📊 Serving dashboard events from cache');
        return NextResponse.json(cached.data);
      }
    }

    console.log(`🔄 Fetching ALL published events for dashboard page ${page}, limit ${limit}`);

    // Query ALL published events (no date filter for dashboard)
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: {
          status: 'PUBLISHED'
          // No date filter - show ALL published events for dashboard
        },
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          description: true,
          status: true,
          createdAt: true,
          personnel: {
            select: {
              id: true,
              userId: true,
              role: true,
              status: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { date: 'desc' }, // Show recent events first (can be changed to 'asc' for upcoming first)
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.event.count({
        where: {
          status: 'PUBLISHED'
          // No date filter
        }
      })
    ]);

    const result = {
      events,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      meta: {
        type: 'dashboard_all_events',
        showFutureEventsOnly: false,
        includePastEvents: true
      }
    };

    // Cache only first page
    if (page === 1) {
      eventsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      console.log('✅ Dashboard events cached');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dashboard events:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}