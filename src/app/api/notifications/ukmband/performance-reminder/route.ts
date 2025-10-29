import { NextRequest, NextResponse } from 'next/server';
import { ukmBandNotificationService } from '@/services/ukmBandNotificationService';

export async function POST(request: NextRequest) {
  try {
    const {
      userIds,
      performanceTitle,
      performanceDate,
      performanceLocation,
      reminderType = 'H1', // 'H1' or '2_HOURS'
      sendToAll = false // If true, send to all active users
    } = await request.json();

    if (!performanceTitle || !performanceDate || !performanceLocation) {
      return NextResponse.json(
        { error: 'performanceTitle, performanceDate, and performanceLocation are required' },
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

    let results;
    let message;

    if (reminderType === 'H1') {
      console.log(`🎤 Creating H-1 performance reminders for: ${performanceTitle}`);
      results = await ukmBandNotificationService.notifyPerformanceReminderH1({
        userIds: targetUserIds,
        performanceTitle,
        performanceDate: new Date(performanceDate),
        performanceLocation
      });
      message = `H-1 performance reminders sent to ${targetUserIds.length} users`;
    } else if (reminderType === '2_HOURS') {
      console.log(`⏰ Creating 2-hour performance reminders for: ${performanceTitle}`);
      results = await ukmBandNotificationService.notifyPerformanceReminder2Hours({
        userIds: targetUserIds,
        performanceTitle,
        performanceLocation,
        performanceTime: new Date(performanceDate)
      });
      message = `2-hour performance reminders sent to ${targetUserIds.length} users`;
    } else {
      return NextResponse.json(
        { error: 'Invalid reminderType. Must be "H1" or "2_HOURS"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      performanceTitle,
      performanceDate,
      performanceLocation,
      reminderType,
      targetUsers: targetUserIds.length,
      results: results.map((result, index) => ({
        userId: targetUserIds[index],
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null
      }))
    });

  } catch (error) {
    console.error('❌ Error in performance reminder notification API:', error);
    return NextResponse.json(
      { error: 'Failed to send performance reminder notifications' },
      { status: 500 }
    );
  }
}