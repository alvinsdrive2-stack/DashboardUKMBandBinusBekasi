import { NextRequest, NextResponse } from 'next/server';
import { ukmBandNotificationService } from '@/services/ukmBandNotificationService';

export async function POST(request: NextRequest) {
  try {
    const {
      userIds,
      newMemberName,
      role,
      teamName = 'UKM Band',
      sendToAll = false // If true, send to all active users
    } = await request.json();

    if (!newMemberName || !role) {
      return NextResponse.json(
        { error: 'newMemberName and role are required' },
        { status: 400 }
      );
    }

    let targetUserIds = userIds || [];

    // If sendToAll is true, get all active users
    if (sendToAll) {
      targetUserIds = await ukmBandNotificationService.getAllActiveUsers();
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: 'No target users specified' },
        { status: 400 }
      );
    }

    console.log(`👥 Creating team member join notifications for: ${newMemberName}`);

    const results = await ukmBandNotificationService.notifyTeamMemberJoin({
      userIds: targetUserIds,
      newMemberName,
      role,
      teamName
    });

    return NextResponse.json({
      success: true,
      message: `Team member join notifications sent to ${targetUserIds.length} users`,
      newMemberName,
      role,
      teamName,
      targetUsers: targetUserIds.length,
      results: results.map((result, index) => ({
        userId: targetUserIds[index],
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null
      }))
    });

  } catch (error) {
    console.error('❌ Error in team member notification API:', error);
    return NextResponse.json(
      { error: 'Failed to send team member notifications' },
      { status: 500 }
    );
  }
}