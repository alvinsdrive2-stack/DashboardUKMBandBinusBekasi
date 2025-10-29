import { NextRequest, NextResponse } from 'next/server';
import { ukmBandNotificationService } from '@/services/ukmBandNotificationService';

export async function POST(request: NextRequest) {
  try {
    const {
      userIds,
      practiceDate,
      practiceType = 'Latihan Rutin',
      sendToAll = false // If true, send to all active users
    } = await request.json();

    if (!practiceDate) {
      return NextResponse.json(
        { error: 'practiceDate is required' },
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

    console.log(`🎸 Creating 3-day practice reminders for: ${practiceDate}`);

    const results = await ukmBandNotificationService.notifyPracticeReminder3Days({
      userIds: targetUserIds,
      practiceDate: new Date(practiceDate),
      practiceType
    });

    return NextResponse.json({
      success: true,
      message: `3-day practice reminders sent to ${targetUserIds.length} users`,
      practiceDate,
      practiceType,
      targetUsers: targetUserIds.length,
      results: results.map((result, index) => ({
        userId: targetUserIds[index],
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null
      }))
    });

  } catch (error) {
    console.error('❌ Error in practice reminder notification API:', error);
    return NextResponse.json(
      { error: 'Failed to send practice reminder notifications' },
      { status: 500 }
    );
  }
}