import { notificationTriggerService } from '@/services/notificationTriggerService';

// This middleware can be used in API routes to automatically trigger notifications
export class NotificationMiddleware {
  static async onEventCreated(event: any, createdBy: string) {
    try {
      await notificationTriggerService.onEventCreated(event, createdBy);
    } catch (error) {
      console.error('Failed to trigger event created notification:', error);
    }
  }

  static async onEventStatusChanged(event: any, oldStatus: string, newStatus: string) {
    try {
      await notificationTriggerService.onEventStatusChanged(event, oldStatus, newStatus);
    } catch (error) {
      console.error('Failed to trigger event status changed notification:', error);
    }
  }

  static async onPersonnelApplied(personnel: any, userName: string) {
    try {
      await notificationTriggerService.onPersonnelApplied(personnel, userName);
    } catch (error) {
      console.error('Failed to trigger personnel applied notification:', error);
    }
  }

  static async onSongAdded(song: any, eventTitle: string) {
    try {
      await notificationTriggerService.onSongAdded(song, eventTitle);
    } catch (error) {
      console.error('Failed to trigger song added notification:', error);
    }
  }

  static async onPersonnelStatusChanged(personnel: any, oldStatus: string, newStatus: string) {
    try {
      if (newStatus === 'APPROVED' && oldStatus === 'PENDING') {
        // Notify user they've been approved
        if (personnel.userId) {
          const event = await prisma?.event.findUnique({
            where: { id: personnel.eventId },
            select: { title: true, date: true, location: true }
          });

          if (event) {
            await notificationTriggerService.createNotification({
              userId: personnel.userId,
              title: 'Pendaftaran Disetujui',
              message: `Kamu disetujui sebagai ${personnel.role} untuk event "${event.title}"`,
              type: 'PERSONNEL_ASSIGNED',
              eventId: personnel.eventId,
              actionUrl: `/events/${personnel.eventId}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to trigger personnel status changed notification:', error);
    }
  }
}

// Import prisma for the middleware
import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();