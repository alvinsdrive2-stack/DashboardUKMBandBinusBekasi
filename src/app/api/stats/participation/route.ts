import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simple in-memory cache for stats (5 minutes)
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is eligible for stats
    if (session.user.organizationLvl === 'COMMISSIONER' || session.user.organizationLvl === 'PENGURUS') {
      const managerData = {
        user: {
          participations: 0,
          rank: 0,
          isTopPerformer: false
        },
        statistics: {
          totalMembers: 0,
          averageParticipations: 0,
          totalParticipations: 0,
          maxParticipations: 0
        },
        monthlyData: []
      };
      return NextResponse.json(managerData);
    }

    // Check cache first
    const cacheKey = `stats_${session.user.id}`;
    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Optimized: Use separate queries to avoid expensive groupBy operations
    // Get user participation count first (most important for UX)
    const userStats = await prisma.eventPersonnel.count({
      where: {
        userId: session.user.id,
        user: {
          organizationLvl: {
            in: ['TALENT', 'SPECTA']
          }
        }
      }
    });

    // Get total members count (lightweight query)
    const totalMembers = await prisma.user.count({
      where: {
        organizationLvl: {
          in: ['TALENT', 'SPECTA']
        }
      }
    });

    // Highly optimized query with proper index usage
    const usersWithCounts = await prisma.$queryRaw<Array<{
      id: string;
      participation_count: number;
    }>>`
      -- Optimized query using our new indexes
      WITH eligible_users AS (
        SELECT id FROM "User"
        WHERE "organizationLvl" IN ('TALENT', 'SPECTA')
      )
      SELECT
        u.id,
        COALESCE(COUNT(ep.id), 0) as participation_count
      FROM eligible_users u
      LEFT JOIN "EventPersonnel" ep ON u.id = ep."userId"
        AND ep.status = 'APPROVED'
        AND EXISTS (
          SELECT 1 FROM "Event" e
          WHERE e.id = ep."eventId"
          AND e.status = 'PUBLISHED'
        )
      GROUP BY u.id
      ORDER BY participation_count DESC NULLS LAST
      LIMIT 100
    `;

    // Calculate statistics from optimized user data
    const memberCount = usersWithCounts.length;
    const totalParticipations = usersWithCounts.reduce((sum, user) => sum + Number(user.participation_count), 0);
    const averageParticipations = memberCount > 0 ? Math.round((totalParticipations / memberCount) * 10) / 10 : 0;
    const maxParticipations = memberCount > 0 ? Math.max(...usersWithCounts.map(u => Number(u.participation_count))) : 0;

    // Calculate user rank - already sorted from query
    const userParticipations = userStats;
    const userRank = usersWithCounts.findIndex(user => user.id === session.user.id) + 1;
    const isTopPerformer = userRank <= 3;

    // Optimized monthly data using Prisma queries instead of raw SQL
    const monthlyData = [];
    const currentMonth = new Date();

    // Generate data for the last 3 months
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
      const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i + 1, 1);

      try {
        // Use Prisma's date filtering which handles timestamp comparisons properly
        const [monthTotal, monthUser] = await Promise.all([
          prisma.eventPersonnel.count({
            where: {
              event: {
                date: {
                  gte: monthDate,
                  lt: nextMonthDate
                },
                status: 'PUBLISHED'
              },
              status: 'APPROVED'
            }
          }),
          prisma.eventPersonnel.count({
            where: {
              userId: session.user.id,
              event: {
                date: {
                  gte: monthDate,
                  lt: nextMonthDate
                },
                status: 'PUBLISHED'
              },
              status: 'APPROVED'
            }
          })
        ]);

        monthlyData.push({
          month: monthDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          totalParticipations: monthTotal,
          uniqueParticipants: Math.min(monthTotal, totalMembers),
          userParticipations: monthUser
        });
      } catch (monthlyError) {
        // Add fallback data for this month
        monthlyData.push({
          month: monthDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          totalParticipations: 0,
          uniqueParticipants: 0,
          userParticipations: 0
        });
      }
    }

    const result = {
      user: {
        participations: userParticipations,
        rank: userRank,
        isTopPerformer
      },
      statistics: {
        totalMembers: memberCount,
        averageParticipations,
        totalParticipations,
        maxParticipations
      },
      monthlyData
    };

    // Cache the result
    statsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {

    // Return fallback data instead of error to avoid breaking the dashboard
    const fallbackData = {
      user: {
        participations: 0,
        rank: 0,
        isTopPerformer: false
      },
      statistics: {
        totalMembers: 0,
        averageParticipations: 0,
        totalParticipations: 0,
        maxParticipations: 0
      },
      monthlyData: []
    };

    return NextResponse.json(fallbackData);
  }
}