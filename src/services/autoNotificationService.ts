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

      // Prepare FCM message
      const message = {
        notification: {
          title: data.title,
          body: data.message,
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png',
          tag: `${data.type}-${Date.now()}`,
          clickAction: data.actionUrl || '/dashboard/member'
        },
        data: {
          type: data.type,
          eventId: data.eventId,
          songId: data.songId,
          actionUrl: data.actionUrl || '/dashboard/member',
          timestamp: new Date().toISOString()
        },
        webpush: {
          fcmOptions: {
            link: data.actionUrl || '/dashboard/member'
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

  // 1. Notifikasi untuk Event Baru
  static async notifyNewEvent(eventId: string): Promise<void> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          submittedBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!event) return;

      // Get all active users untuk notifikasi event baru
      const users = await prisma.user.findMany({
        where: {
          organizationLvl: {
            in: ['TALENT', 'SPECTA']
          },
          isActive: true
        },
        select: { id: true }
      });

      const targetUserIds = users.map(u => u.id);

      const eventDate = new Date(event.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await this.sendFCMNotification({
        type: 'EVENT_CREATED',
        title: '🎵 Event Baru Ditambahkan!',
        message: `${event.title} telah ditambahkan pada ${eventDate}. Daftar sekarang!`,
        targetUserIds,
        eventId: event.id,
        actionUrl: `/events/member?eventId=${event.id}`
      });

      // Simpan notifikasi ke database
      await this.saveNotifications(targetUserIds, {
        title: '🎵 Event Baru Ditambahkan!',
        message: `${event.title} telah ditambahkan pada ${eventDate}. Daftar sekarang!`,
        type: 'EVENT_NEW',
        eventId: event.id,
        actionUrl: `/events/member?eventId=${event.id}`
      });

    } catch (error) {
      console.error('Error notifying new event:', error);
    }
  }

  // 2. Notifikasi untuk Member Baru Join Event
  static async notifyMemberJoinedEvent(eventId: string, newMemberName: string): Promise<void> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) return;

      // Get existing approved members
      const existingMembers = await prisma.eventPersonnel.findMany({
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

      const targetUserIds = existingMembers.map(em => em.userId);

      if (targetUserIds.length === 0) return;

      await this.sendFCMNotification({
        type: 'MEMBER_JOINED_EVENT',
        title: '👋 Member Baru Bergabung!',
        message: `${newMemberName} telah bergabung dengan event ${event.title}`,
        targetUserIds,
        eventId: event.id,
        actionUrl: `/events/member?eventId=${event.id}`
      });

      // Simpan notifikasi ke database
      await this.saveNotifications(targetUserIds, {
        title: '👋 Member Baru Bergabung!',
        message: `${newMemberName} telah bergabung dengan event ${event.title}`,
        type: 'EVENT_MEMBER_JOINED',
        eventId: event.id,
        actionUrl: `/events/member?eventId=${event.id}`
      });

    } catch (error) {
      console.error('Error notifying member joined event:', error);
    }
  }

  // 3. Notifikasi untuk Lagu Baru Ditambahkan
  static async notifySongAdded(songId: string, songTitle: string, eventId?: string): Promise<void> {
    try {
      let targetUserIds: string[] = [];
      let actionUrl = '/songs';
      let eventName = '';

      if (eventId) {
        // Notifikasi ke member event saja
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

        targetUserIds = eventMembers.map(em => em.userId);

        const event = await prisma.event.findUnique({
          where: { id: eventId }
        });

        if (event) {
          eventName = ` di event ${event.title}`;
          actionUrl = `/events/member?eventId=${eventId}#songs`;
        }
      } else {
        // Notifikasi ke semua users
        const users = await prisma.user.findMany({
          where: {
            organizationLvl: {
              in: ['TALENT', 'SPECTA']
            },
            isActive: true
          },
          select: { id: true }
        });

        targetUserIds = users.map(u => u.id);
        actionUrl = '/songs';
      }

      if (targetUserIds.length === 0) return;

      await this.sendFCMNotification({
        type: 'SONG_ADDED',
        title: '🎶 Lagu Baru Ditambahkan!',
        message: `"${songTitle}" telah ditambahkan${eventName}`,
        targetUserIds,
        songId,
        eventId,
        actionUrl
      });

      // Simpan notifikasi ke database
      await this.saveNotifications(targetUserIds, {
        title: '🎶 Lagu Baru Ditambahkan!',
        message: `"${songTitle}" telah ditambahkan${eventName}`,
        type: 'SONG_NEW',
        songId,
        eventId,
        actionUrl
      });

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