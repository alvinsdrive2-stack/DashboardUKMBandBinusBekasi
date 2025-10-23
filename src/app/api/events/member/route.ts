import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isMember } from '@/utils/roles';

// Simple cache for events (2 minutes)
const eventsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10; // 2 minutes

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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 items
    const skip = (page - 1) * limit;

    // Check cache first (only cache first page)
    const cacheKey = `events_member_page_${page}_limit_${limit}`;
    if (page === 1) {
      const cached = eventsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('📅 Serving events from cache');
        return NextResponse.json(cached.data);
      }
    }

    console.log(`🔄 Fetching upcoming events page ${page}, limit ${limit}`);

    // Optimized query with pagination and proper indexing
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: {
          status: 'PUBLISHED',
          date: {
            gte: new Date() // Only future events
          }
        },
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          description: true,
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
        orderBy: {
          date: 'asc' // Show upcoming events first (closest date)
        },
        skip,
        take: limit
      }),
      prisma.event.count({
        where: {
          status: 'PUBLISHED',
          date: {
            gte: new Date() // Only future events
          }
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
      }
    };

    // Cache only first page
    if (page === 1) {
      eventsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      console.log('✅ Events cached');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}