import { NextRequest, NextResponse } from 'next/server';
import { ukmBandNotificationService } from '@/services/ukmBandNotificationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      eventId,
      newMemberName,
      memberRole,
      existingMemberIds,
      newMemberId,
      sendToExistingMembersOnly = true // Default to only existing members
    } = await request.json();

    if (!eventId || !newMemberName || !memberRole) {
      return NextResponse.json(
        { error: 'eventId, newMemberName, and memberRole are required' },
        { status: 400 }
      );
    }

    console.log(`👥 Creating member join event notifications:`);
    console.log(`   - Event ID: ${eventId}`);
    console.log(`   - New Member: ${newMemberName}`);
    console.log(`   - Role: ${memberRole}`);
    console.log(`   - Target Existing Members Only: ${sendToExistingMembersOnly}`);

    // Send notifications to existing members only
    const results = await ukmBandNotificationService.notifyMemberJoinEvent({
      eventId,
      newMemberName,
      memberRole,
      existingMemberIds: sendToExistingMembersOnly ? undefined : existingMemberIds,
      newMemberId
    });

    return NextResponse.json({
      success: true,
      message: `Member join event notifications sent to existing members`,
      eventId,
      newMemberName,
      memberRole,
      sendToExistingMembersOnly,
      targetUsers: results.length,
      results: results.map((result, index) => ({
        userId: existingMemberIds?.[index] || 'auto-detected',
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null
      }))
    });

  } catch (error) {
    console.error('❌ Error in member join event notification API:', error);
    return NextResponse.json(
      { error: 'Failed to send member join event notifications' },
      { status: 500 }
    );
  }
}