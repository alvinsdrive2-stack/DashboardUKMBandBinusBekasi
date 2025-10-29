import { adminMessaging } from '@/firebase/admin';
import { prisma } from '@/lib/prisma';
import { emitNotificationToMultipleUsers } from '@/utils/notificationEmitter';

interface NotificationData {
  type: 'EVENT_CREATED' | 'MEMBER_JOINED_EVENT' | 'SONG_ADDED';
  title: string;
  message: string;
  targetUserIds: string[];
  eventId?: string;
  songId?: string;
  actionUrl?: string;
}

export class AutoNotificationService {
  private static async sendFCMNotification(data: NotificationData): Promise<void> {
    try {
      // Get all active FCM tokens for target users
      const subscriptions = await prisma.fCMSubscription.findMany({
        where: {
          userId: {
            in: data.targetUserIds
          },
          isActive: true
        }
      });

      if (subscriptions.length === 0) {
        console.log(`No FCM subscriptions found for notification type: ${data.type}`);
        return;
      }

      // Group tokens by user to avoid duplicates
      const userTokens = new Map<string, string[]>();
      subscriptions.forEach(sub => {
        if (!userTokens.has(sub.userId)) {
          userTokens.set(sub.userId, []);
        }
        userTokens.get(sub.userId)!.push(sub.token);
      });

      // Production URL for PWA direct access
      const productionBaseUrl = 'https://ukmbandbinusbekasi.vercel.app';
      const fullActionUrl = data.actionUrl && data.actionUrl.startsWith('http')
        ? data.actionUrl
        : data.actionUrl
          ? `${productionBaseUrl}${data.actionUrl}`
          : `${productionBaseUrl}/dashboard/member`;

      // Prepare FCM message
      const message = {
        notification: {
          title: data.title,
          body: data.message,
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png',
          tag: `${data.type}-${Date.now()}`,
          clickAction: fullActionUrl
        },
        data: {
          type: data.type,
          eventId: data.eventId,
          songId: data.songId,
          actionUrl: fullActionUrl,
          timestamp: new Date().toISOString()
        },
        webpush: {
          fcmOptions: {
            link: fullActionUrl
          }
        }
      };

      // Send to each user's tokens
      let totalSuccess = 0;
      let totalFailed = 0;

      for (const [userId, tokens] of userTokens.entries()) {
        try {
          const response = await adminMessaging.sendEachForMulticast({
            ...message,
            tokens: tokens
          });

          totalSuccess += response.successCount;
          totalFailed += response.failureCount;

          // Remove invalid tokens
          response.responses.forEach((resp, index) => {
            if (!resp.success) {
              const subscription = subscriptions.find(sub => sub.token === tokens[index]);
              if (subscription && (
                resp.error?.code === 'messaging/registration-token-not-registered' ||
                resp.error?.code === 'messaging/invalid-registration-token'
              )) {
                prisma.fCMSubscription.update({
                  where: { id: subscription.id },
                  data: { isActive: false }
                }).catch(console.error);
              }
            }
          });

        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
          totalFailed += tokens.length;
        }
      }

      console.log(`📤 Auto-notification sent: ${data.type} | Success: ${totalSuccess} | Failed: ${totalFailed}`);

    } catch (error) {
      console.error('Error sending auto-notification:', error);
    }
  }

  // 1. Notifikasi untuk Event Baru - UKM Band Integration
  static async notifyNewEvent(eventId: string): Promise<void> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) return;

      console.log(`🎵 AutoNotificationService: Notifying new event: ${event.title}`);

      // Use NEW UKM Band notification service
      const { ukmBandNotificationService } = await import('./ukmBandNotificationService');

      // Send to ALL members (including inactive) for event creation
      await ukmBandNotificationService.notifyEventCreation({
        userIds: [], // Empty array, service will get all members
        eventId: eventId,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        sendToAllMembers: true // Send to ALL members
      });

      console.log(`✅ UKM Band notifications sent for new event: ${event.title}`);

    } catch (error) {
      console.error('Error notifying new event:', error);
    }
  }

  // 2. Notifikasi untuk Member Baru Join Event - UKM Band Integration
  static async notifyMemberJoinedEvent(eventId: string, newMemberName: string, memberRole?: string): Promise<void> {
    try {
      console.log(`👥 AutoNotificationService: Notifying member join event: ${newMemberName} as ${memberRole || 'Member'}`);

      // Use NEW UKM Band notification service for targeted notifications
      const { ukmBandNotificationService } = await import('./ukmBandNotificationService');

      // Send to existing event members only (targeted notification)
      await ukmBandNotificationService.notifyMemberJoinEvent({
        eventId: eventId,
        newMemberName: newMemberName,
        memberRole: memberRole || 'Member',
        existingMemberIds: undefined, // Let service auto-detect existing members
        newMemberId: undefined
      });

      console.log(`✅ Targeted member join event notifications sent for: ${newMemberName}`);

    } catch (error) {
      console.error('Error notifying member joined event:', error);
    }
  }

  // 3. Notifikasi untuk Lagu Baru Ditambahkan - UKM Band Integration
  static async notifySongAdded(songId: string, songTitle: string, eventId?: string): Promise<void> {
    try {
      console.log(`🎶 AutoNotificationService: Notifying song added: ${songTitle}`);

      // Use NEW UKM Band notification service
      const { ukmBandNotificationService } = await import('./ukmBandNotificationService');

      if (eventId) {
        // If event-specific, get event members only
        const eventMembers = await prisma.eventPersonnel.findMany({
          where: {
            eventId,
            status: 'APPROVED'
          },
          include: {
            user: {
              select: { id: true }
            }
          }
        });

        const targetUserIds = eventMembers.map(em => em.userId);

        if (targetUserIds.length === 0) return;

        await ukmBandNotificationService.notifySongAddition({
          userIds: targetUserIds,
          songTitle,
          artist: 'Unknown Artist', // Will be overridden if needed
          addedBy: 'Music Director',
          difficulty: 'Medium'
        });

        console.log(`✅ Song addition notifications sent to ${targetUserIds.length} event members`);

      } else {
        // If not event-specific, send to TEAM members only
        await ukmBandNotificationService.notifySongAddition({
          userIds: [], // Empty array, service will get team members
          songTitle,
          artist: 'Unknown Artist', // Will be overridden if needed
          addedBy: 'Music Director',
          difficulty: 'Medium'
        });

        console.log(`✅ Song addition notifications sent to TEAM members only`);
      }

    } catch (error) {
      console.error('Error notifying song added:', error);
    }
  }

  // Helper function untuk simpan notifikasi ke database
  private static async saveNotifications(userIds: string[], notificationData: {
    title: string;
    message: string;
    type: string;
    eventId?: string;
    songId?: string;
    actionUrl?: string;
  }): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type as any,
        userId,
        eventId: notificationData.eventId,
        actionUrl: notificationData.actionUrl,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await prisma.notification.createMany({
        data: notifications,
        skipDuplicates: true
      });

    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }
}

export default AutoNotificationService;