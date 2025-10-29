import { NextRequest, NextResponse } from 'next/server';
import { ukmBandNotificationService } from '@/services/ukmBandNotificationService';
import { notificationTriggerService } from '@/services/notificationTriggerService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      userIds,
      eventId,
      eventTitle,
      eventDate,
      eventLocation,
      sendToAllMembers = true, // Default to ALL members for event creation
      createDatabaseNotifications = true // Create database notifications
    } = await request.json();

    if (!eventTitle || !eventDate || !eventLocation) {
      return NextResponse.json(
        { error: 'eventTitle, eventDate, and eventLocation are required' },
        { status: 400 }
      );
    }

    console.log(`🎵 Creating UKM Band event creation notifications for: ${eventTitle}`);
    console.log(`📋 Send to ALL members: ${sendToAllMembers}`);
    console.log(`📋 Create database notifications: ${createDatabaseNotifications}`);

    let targetUserIds = userIds || [];

    // If sendToAllMembers is true, get ALL members (including inactive)
    if (sendToAllMembers) {
      targetUserIds = await ukmBandNotificationService.getAllMembers();
      console.log(`📊 Targeting ALL ${targetUserIds.length} members for event creation`);
    }

    // Send FCM notifications
    const fcmResults = await ukmBandNotificationService.notifyEventCreation({
      userIds: targetUserIds,
      eventId: eventId || '',
      eventTitle,
      eventDate: new Date(eventDate),
      eventLocation,
      sendToAllMembers
    });

    // Create database notifications if requested
    let dbResults = [];
    if (createDatabaseNotifications) {
      console.log(`💾 Creating database notifications for: ${eventTitle}`);

      for (const userId of targetUserIds) {
        try {
          const notification = await notificationTriggerService.createNotification({
            userId,
            title: `🎵 ${eventTitle}`,
            message: `Acara baru UKM Band! ${eventTitle} - ${new Date(eventDate).toLocaleDateString('id-ID')} di ${eventLocation}`,
            type: 'EVENT_CREATION',
            eventId: eventId || '',
            actionUrl: `/events/${eventId || ''}`
          });

          dbResults.push({
            userId,
            success: true,
            notificationId: notification.id
          });

        } catch (dbError) {
          console.error(`❌ Failed to create database notification for user ${userId}:`, dbError);
          dbResults.push({
            userId,
            success: false,
            error: dbError instanceof Error ? dbError.message : 'Unknown error'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Event creation notifications sent to ${targetUserIds.length} users`,
      eventTitle,
      eventDate,
      eventLocation,
      sendToAllMembers,
      targetUsers: targetUserIds.length,
      fcmResults: fcmResults.map((result, index) => ({
        userId: targetUserIds[index],
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null
      })),
      databaseNotifications: dbResults
    });

  } catch (error) {
    console.error('❌ Error in UKM Band event creation notification API:', error);
    return NextResponse.json(
      { error: 'Failed to send event creation notifications' },
      { status: 500 }
    );
  }
}