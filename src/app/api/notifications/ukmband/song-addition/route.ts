import { NextRequest, NextResponse } from 'next/server';
import { ukmBandNotificationService } from '@/services/ukmBandNotificationService';

export async function POST(request: NextRequest) {
  try {
    const {
      userIds,
      songTitle,
      artist,
      addedBy,
      difficulty = 'Medium',
      sendToAll = false // If true, send to all active users
    } = await request.json();

    if (!songTitle || !artist || !addedBy) {
      return NextResponse.json(
        { error: 'songTitle, artist, and addedBy are required' },
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

    console.log(`🎶 Creating song addition notifications for: ${songTitle}`);

    const results = await ukmBandNotificationService.notifySongAddition({
      userIds: targetUserIds,
      songTitle,
      artist,
      addedBy,
      difficulty
    });

    return NextResponse.json({
      success: true,
      message: `Song addition notifications sent to ${targetUserIds.length} users`,
      songTitle,
      artist,
      addedBy,
      difficulty,
      targetUsers: targetUserIds.length,
      results: results.map((result, index) => ({
        userId: targetUserIds[index],
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null
      }))
    });

  } catch (error) {
    console.error('❌ Error in song addition notification API:', error);
    return NextResponse.json(
      { error: 'Failed to send song addition notifications' },
      { status: 500 }
    );
  }
}