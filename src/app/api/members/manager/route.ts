import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get all members with their participation stats for manager monitoring
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
    const level = searchParams.get('level');
    const active = searchParams.get('active');

    // Debug: Start with a simple query first
    console.log('Debug: Fetching members with params:', { level, active });

    // Optimized single query to get all member data with participation stats
    const optimizedQuery = `
      WITH member_participations AS (
        SELECT
          u.id,
          u.name,
          u.email,
          u.instruments,
          u."organizationLvl",
          COUNT(ep.id) as "totalParticipations",
          COUNT(CASE WHEN ep.status = 'APPROVED' THEN 1 END) as "approvedParticipations",
          COUNT(CASE WHEN ep.status = 'PENDING' THEN 1 END) as "pendingParticipations",
          COUNT(CASE WHEN ep.status = 'REJECTED' THEN 1 END) as "rejectedParticipations",
          COUNT(CASE WHEN ep.status = 'APPROVED' AND e.date > NOW() THEN 1 END) as "upcomingEvents"
        FROM "User" u
        LEFT JOIN "EventPersonnel" ep ON u.id = ep."userId"
        LEFT JOIN "Event" e ON ep."eventId" = e.id
        WHERE u."organizationLvl" IN ('TALENT', 'SPECTA', 'PENGURUS', 'COMMISSIONER')
        GROUP BY u.id, u.name, u.email, u.instruments, u."organizationLvl"
      )
      SELECT
        mp.*,
        COALESCE(json_agg(
          json_build_object(
            'id', ep.id,
            'role', ep.role,
            'status', ep.status,
            'event', json_build_object(
              'id', e.id,
              'title', e.title,
              'date', e.date,
              'location', e.location,
              'status', e.status
            )
          )
        ) FILTER (WHERE ep.id IS NOT NULL), '[]') as participations
      FROM member_participations mp
      LEFT JOIN "EventPersonnel" ep ON mp.id = ep."userId"
      LEFT JOIN "Event" e ON ep."eventId" = e.id
      GROUP BY mp.id, mp.name, mp.email, mp.instruments, mp."organizationLvl",
               mp."totalParticipations", mp."approvedParticipations",
               mp."pendingParticipations", mp."rejectedParticipations", mp."upcomingEvents"
      ORDER BY mp.name ASC
    `;

    console.log('Debug: Executing optimized query');
    const membersWithParticipations = await prisma.$queryRawUnsafe(optimizedQuery);
    console.log('Debug: Optimized query result count:', (membersWithParticipations as any[]).length);

    // Format the results
    const formattedMembers = (membersWithParticipations as any[]).map((member: any) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      instruments: member.instruments || [],
      organizationLvl: member.organizationLvl,
      stats: {
        totalParticipations: parseInt(member.totalParticipations) || 0,
        approvedParticipations: parseInt(member.approvedParticipations) || 0,
        pendingParticipations: parseInt(member.pendingParticipations) || 0,
        rejectedParticipations: parseInt(member.rejectedParticipations) || 0,
        upcomingEvents: parseInt(member.upcomingEvents) || 0
      },
      participations: (member.participations || []).map((p: any) => ({
        ...p,
        event: {
          ...p.event,
          date: new Date(p.event.date).toISOString()
        }
      }))
    }));

    return NextResponse.json(formattedMembers);

  } catch (error) {
    console.error('Error fetching manager members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}