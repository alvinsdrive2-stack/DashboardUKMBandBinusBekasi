import { PrismaClient } from '@/generated/prisma';
import { NotificationType } from '@/types/notification';

const prisma = new PrismaClient();

export class NotificationTriggerService {
  // Create notification for user
  async createNotification({
    userId,
    title,
    message,
    type,
    eventId,
    actionUrl
  }: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    eventId?: string;
    actionUrl?: string;
  }) {
    try {
      // Check if user has notification settings enabled for this type
      const userSettings = await prisma.notificationSetting.findUnique({
        where: { userId }
      });

      // If no settings exist, create default ones
      if (!userSettings) {
        await prisma.notificationSetting.create({
          data: { userId }
        });
      }

      // Check if this notification type is enabled
      const isNotificationEnabled = await this.isNotificationEnabled(userId, type);
      if (!isNotificationEnabled) {
        return null;
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          eventId: eventId || null,
          actionUrl: actionUrl || null
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Send real-time WebSocket notification
      console.log('🔍 [NotificationTriggerService] About to send real-time notification');
      await this.sendRealTimeNotification(notification);

      // Send push notification if enabled
      console.log('🔍 [NotificationTriggerService] About to send push notification');
      console.log('🔍 [NotificationTriggerService] Notification data:', {
        title: notification.title,
        type: notification.type,
        debug: notification.data?.debug
      });

      console.log('✅ [NotificationTriggerService] FIXED - Single trigger only');
      console.log('   1. Real-time notification via WebSocket');
      console.log('   2. Push notification via FCM API');

      await this.sendPushNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notifications for multiple users
  async createBulkNotifications({
    userIds,
    title,
    message,
    type,
    eventId,
    actionUrl
  }: {
    userIds: string[];
    title: string;
    message: string;
    type: NotificationType;
    eventId?: string;
    actionUrl?: string;
  }) {
    try {
      // Filter users who have this notification type enabled
      const enabledUsers = await this.getUsersWithNotificationEnabled(userIds, type);

      if (enabledUsers.length === 0) {
        return [];
      }

      const notifications = await prisma.notification.createMany({
        data: enabledUsers.map(userId => ({
          userId,
          title,
          message,
          type,
          eventId: eventId || null,
          actionUrl: actionUrl || null
        }))
      });

      // TODO: Send real-time WebSocket notifications
      // TODO: Send push notifications if enabled

      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Trigger when event is created
  async onEventCreated(event: any, createdBy: string) {
    const admins = await this.getAdminUsers();

    if (admins.length > 0) {
      await this.createBulkNotifications({
        userIds: admins,
        title: 'Event Baru Dibuat',
        message: `Event "${event.title}" telah dibuat oleh ${createdBy}`,
        type: 'EVENT_STATUS_CHANGED',
        eventId: event.id,
        actionUrl: `/events/${event.id}`
      });
    }
  }

  // Trigger when event status changes
  async onEventStatusChanged(event: any, oldStatus: string, newStatus: string) {
    // Get all personnel assigned to this event
    const personnel = await prisma.eventPersonnel.findMany({
      where: { eventId: event.id, userId: { not: null } },
      include: { user: { select: { name: true } } }
    });

    if (personnel.length > 0) {
      const userIds = personnel.map(p => p.userId!).filter(Boolean);

      await this.createBulkNotifications({
        userIds,
        title: 'Status Event Berubah',
        message: `Event "${event.title}" status berubah dari ${oldStatus} ke ${newStatus}`,
        type: 'EVENT_STATUS_CHANGED',
        eventId: event.id,
        actionUrl: `/events/${event.id}`
      });
    }
  }

  // Trigger when user applies for personnel
  async onPersonnelApplied(personnel: any, userName: string) {
    // Get admins and event organizer
    const admins = await this.getAdminUsers();
    const event = await prisma.event.findUnique({
      where: { id: personnel.eventId },
      select: { title: true }
    });

    if (admins.length > 0 && event) {
      await this.createBulkNotifications({
        userIds: admins,
        title: 'Pendaftaran Personel Baru',
        message: `${userName} mendaftar sebagai ${personnel.role} untuk event "${event.title}"`,
        type: 'PERSONNEL_ASSIGNED',
        eventId: personnel.eventId,
        actionUrl: `/events/${personnel.eventId}`
      });
    }
  }

  // Trigger when song is added to event
  async onSongAdded(song: any, eventTitle: string) {
    // Get all personnel assigned to this event
    const personnel = await prisma.eventPersonnel.findMany({
      where: { eventId: song.eventId, userId: { not: null } },
      include: { user: { select: { name: true } } }
    });

    if (personnel.length > 0) {
      const userIds = personnel.map(p => p.userId!).filter(Boolean);

      await this.createBulkNotifications({
        userIds,
        title: 'Lagu Ditambahkan',
        message: `Lagu "${song.title}" ditambahkan ke event "${eventTitle}"`,
        type: 'SONG_ADDED',
        eventId: song.eventId,
        actionUrl: `/events/${song.eventId}`
      });
    }
  }

  // Create event reminders (24 hours and 1 hour before)
  async createEventReminders(event: any) {
    const personnel = await prisma.eventPersonnel.findMany({
      where: {
        eventId: event.id,
        userId: { not: null },
        status: 'APPROVED'
      },
      include: { user: { select: { name: true } } }
    });

    if (personnel.length > 0) {
      const userIds = personnel.map(p => p.userId!).filter(Boolean);
      const eventDate = new Date(event.date);
      const now = new Date();

      // 24 hours reminder
      const twentyFourHoursBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      if (twentyFourHoursBefore > now) {
        await this.createBulkNotifications({
          userIds,
          title: 'Reminder Event',
          message: `Event "${event.title}" akan dimulai besok jam ${eventDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
          type: 'EVENT_REMINDER',
          eventId: event.id,
          actionUrl: `/events/${event.id}`
        });
      }

      // 1 hour reminder
      const oneHourBefore = new Date(eventDate.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > now) {
        await this.createBulkNotifications({
          userIds,
          title: 'Event Dimulai 1 Jam Lagi',
          message: `Event "${event.title}" akan dimulai 1 jam lagi di ${event.location}`,
          type: 'EVENT_REMINDER',
          eventId: event.id,
          actionUrl: `/events/${event.id}`
        });
      }
    }
  }

  // Check if user has notification type enabled
  private async isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const settings = await prisma.notificationSetting.findUnique({
      where: { userId }
    });

    if (!settings) {
      return true; // Default to enabled if no settings exist
    }

    switch (type) {
      case 'EVENT_REMINDER':
        return settings.eventReminder;
      case 'PERSONNEL_ASSIGNED':
        return settings.personnelAssigned;
      case 'EVENT_STATUS_CHANGED':
        return settings.eventStatusChanged;
      case 'SONG_ADDED':
        return settings.songAdded;
      default:
        return true;
    }
  }

  // Get users who have notification type enabled
  private async getUsersWithNotificationEnabled(userIds: string[], type: NotificationType): Promise<string[]> {
    const settings = await prisma.notificationSetting.findMany({
      where: { userId: { in: userIds } }
    });

    const enabledUsers: string[] = [];

    for (const userId of userIds) {
      const userSetting = settings.find(s => s.userId === userId);

      if (!userSetting) {
        enabledUsers.push(userId); // Default to enabled
        continue;
      }

      let isEnabled = true;
      switch (type) {
        case 'EVENT_REMINDER':
          isEnabled = userSetting.eventReminder;
          break;
        case 'PERSONNEL_ASSIGNED':
          isEnabled = userSetting.personnelAssigned;
          break;
        case 'EVENT_STATUS_CHANGED':
          isEnabled = userSetting.eventStatusChanged;
          break;
        case 'SONG_ADDED':
          isEnabled = userSetting.songAdded;
          break;
      }

      if (isEnabled) {
        enabledUsers.push(userId);
      }
    }

    return enabledUsers;
  }

  // Get admin users (COMMISSIONER, PENGURUS)
  private async getAdminUsers(): Promise<string[]> {
    const admins = await prisma.user.findMany({
      where: {
        organizationLvl: {
          in: ['COMMISSIONER', 'PENGURUS']
        }
      },
      select: { id: true }
    });

    return admins.map(admin => admin.id);
  }

  // Send real-time notification via WebSocket - DISABLED
  // Using only FCM notifications to prevent duplicates
  private async sendRealTimeNotification(notification: any) {
    try {
      // 🔥 DISABLED - Prevent duplicate notifications via WebSocket
      // FCM notifications are sufficient for real-time delivery
      console.log('🚫 sendRealTimeNotification DISABLED - using FCM only');
      console.log('🚫 Would have sent WebSocket notification:', notification.title);

      // Original code disabled to prevent duplicate notifications:
      // - FCM Service Worker handles notification delivery
      // - No need for WebSocket + client-side notification duplication

      /*
      await fetch(`${baseUrl}/api/notifications/emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-key'}`
        },
        body: JSON.stringify({
          notification,
          targetUserId: notification.userId,
          eventId: notification.eventId
        })
      });
      */

    } catch (error) {
      console.error('Error in disabled sendRealTimeNotification:', error);
    }
  }

  // Send push notification
  private async sendPushNotification(notification: any) {
    try {
      // Check if user has push notifications enabled
      const userSettings = await this.isPushNotificationEnabled(notification.userId);
      if (!userSettings) {
        console.log('Push notifications not enabled for user:', notification.userId);
        return;
      }

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

      await fetch(`${baseUrl}/api/notifications/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-key'}`
        },
        body: JSON.stringify({
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          notification,
          eventId: notification.eventId,
          actionUrl: notification.actionUrl
        })
      });

      console.log('Push notification sent for user:', notification.userId);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Check if user has push notifications enabled
  private async isPushNotificationEnabled(userId: string): Promise<boolean> {
    const settings = await prisma.notificationSetting.findUnique({
      where: { userId }
    });

    return settings?.pushNotification ?? true; // Default to enabled
  }
}

export const notificationTriggerService = new NotificationTriggerService();