import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

// Interface untuk response
interface DashboardData {
  events: {
    dashboard: any[];
    member: any[];
    public: any[];
  };
  stats: {
    userStats: any;
    monthlyData: any[];
    ranking: any[];
  } | null;
  meta: {
    lastUpdated: string;
    cacheHit: boolean;
  };
}

// Cache configuration
const CACHE_TTL = {
  dashboard: 10, // 10 detik
  member: 10,    // 10 detik
  public: 10,    // 10 detik
  stats: 10,     // 10 detik
};

// Helper function untuk generate cache key
function getCacheKey(type: string, userId?: string, page = 1, limit = 10): string {
  return `dashboard_${type}_${userId || 'public'}_page_${page}_limit_${limit}`;
}

// Optimized query untuk events dengan single database call
async function getEventsData(userId?: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const now = new Date();

  // Untuk sementara gunakan fallback yang lebih reliable sampai query CTE diperbaiki
  return await getEventsDataFallback(userId, page, limit);
}

// Fallback method jika CTE tidak bekerja
async function getEventsDataFallback(userId?: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [dashboard, member, publicEvents] = await Promise.all([
    // Dashboard events (all published events)
    prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        personnel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                instruments: true
              }
            }
          }
        }
      },
      skip,
      take: limit
    }),

    // Member events (future events)
    prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        date: { gte: new Date() }
      },
      orderBy: { date: 'asc' },
      include: {
        personnel: {
          where: userId ? { userId } : undefined,
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      take: limit
    }),

    // Public events
    prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        date: { gte: new Date() }
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        description: true
      },
      take: limit
    })
  ]);

  return {
    dashboard,
    member,
    public: publicEvents
  };
}

// Optimized query untuk statistics dengan single database call
async function getStatsData(userId?: string) {
  if (!userId) return null;

  const cacheKey = getCacheKey('stats', userId);

  try {
    // Single query dengan CTE untuk semua statistics
    const query = `
      WITH user_stats AS (
        SELECT
          COUNT(CASE WHEN ep.status = 'APPROVED' THEN 1 END) as approved_count,
          COUNT(CASE WHEN ep.status = 'PENDING' THEN 1 END) as pending_count,
          COUNT(CASE WHEN ep.status = 'REJECTED' THEN 1 END) as rejected_count
        FROM "EventPersonnel" ep
        WHERE ep."userId" = $1
      ),
      monthly_stats AS (
        SELECT
          TO_CHAR(e.date, 'YYYY-MM') as month,
          COUNT(*) as event_count,
          COUNT(CASE WHEN ep.status = 'APPROVED' THEN 1 END) as participation_count
        FROM "Event" e
        LEFT JOIN "EventPersonnel" ep ON e.id = ep."eventId" AND ep."userId" = $1
        WHERE e.status = 'PUBLISHED'
          AND e.date >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(e.date, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 6
      ),
      ranking AS (
        SELECT
          u.id,
          u.name,
          u.instruments,
          COUNT(CASE WHEN ep.status = 'APPROVED' THEN 1 END) as participation_count
        FROM "User" u
        LEFT JOIN "EventPersonnel" ep ON u.id = ep."userId"
        WHERE u."organizationLvl" IN ('TALENT', 'SPECTA')
          AND ep.status = 'APPROVED'
        GROUP BY u.id, u.name, u.instruments
        ORDER BY participation_count DESC, u.name ASC
        LIMIT 10
      )

      SELECT
        (SELECT json_agg(us.*) FROM user_stats us) as user_stats,
        (SELECT json_agg(ms.*) FROM monthly_stats ms) as monthly_data,
        (SELECT json_agg(r.*) FROM ranking r) as ranking
    `;

    const result = await prisma.$queryRawUnsafe(query, userId) as any[];

    if (result && result.length > 0) {
      const stats = result[0];
      return {
        userStats: stats.user_stats?.[0] || {
          approved_count: 0,
          pending_count: 0,
          rejected_count: 0
        },
        monthlyData: stats.monthly_data || [],
        ranking: stats.ranking || []
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching stats data:', error);
    // Return fallback data
    return {
      userStats: { approved_count: 0, pending_count: 0, rejected_count: 0 },
      monthlyData: [],
      ranking: []
    };
  }
}

// Main GET handler
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeStats = searchParams.get('includeStats') === 'true';
    const noCache = searchParams.get('noCache') === 'true'; // Tambah parameter noCache

    const userId = session?.user?.id;

    // Skip cache completely jika noCache=true
    if (noCache) {
      console.log('Bypassing cache - fetching fresh data');

      // Fetch fresh data tanpa cache
      const eventsData = await getEventsData(userId, page, limit);
      const statsData = includeStats && userId ? await getStatsData(userId) : null;

      const response: DashboardData = {
        events: eventsData,
        stats: statsData,
        meta: {
          lastUpdated: new Date().toISOString(),
          cacheHit: false
        }
      };

      // Set no-cache headers
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Cache-Hit': 'false',
          'X-Last-Updated': response.meta.lastUpdated
        }
      });
    }

    // Cache keys untuk berbagai jenis data
    const cacheKeys = {
      events: getCacheKey('events', userId, page, limit),
      stats: userId && includeStats ? getCacheKey('stats', userId) : null
    };

    let eventsData, statsData;
    let cacheHit = { events: false, stats: false };

    // Try to get events from cache
    eventsData = await cache.get(cacheKeys.events);
    if (eventsData) {
      cacheHit.events = true;
    }

    // Fetch events if not in cache
    if (!eventsData) {
      eventsData = await getEventsData(userId, page, limit);
      await cache.set(cacheKeys.events, eventsData, CACHE_TTL.dashboard);
    }

    // Fetch stats if requested
    if (includeStats && userId && cacheKeys.stats) {
      statsData = await cache.get(cacheKeys.stats);
      if (statsData) {
        cacheHit.stats = true;
      }

      if (!statsData) {
        statsData = await getStatsData(userId);
        if (statsData) {
          await cache.set(cacheKeys.stats, statsData, CACHE_TTL.stats);
        }
      }
    }

    const response: DashboardData = {
      events: eventsData,
      stats: statsData,
      meta: {
        lastUpdated: new Date().toISOString(),
        cacheHit: cacheHit.events || cacheHit.stats
      }
    };

    // Add cache headers untuk browser
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=10',
        'X-Cache-Hit': String(cacheHit.events || cacheHit.stats),
        'X-Last-Updated': response.meta.lastUpdated
      }
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);

    // Return error response dengan fallback data
    return NextResponse.json({
      events: { dashboard: [], member: [], public: [] },
      stats: null,
      meta: {
        lastUpdated: new Date().toISOString(),
        cacheHit: false
      },
      error: 'Failed to load dashboard data'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// Cache invalidation endpoint
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const userId = session?.user?.id;
    const pattern = searchParams.get('pattern') || '*';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear cache based on pattern
    const keys = await cache.keys(pattern);
    const deletedCount = await cache.deleteMultiple(keys);

    return NextResponse.json({
      message: 'Cache cleared successfully',
      deletedCount,
      pattern
    });

  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({
      error: 'Failed to clear cache'
    }, { status: 500 });
  }
}