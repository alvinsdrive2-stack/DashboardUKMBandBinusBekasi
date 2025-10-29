import { PrismaClient } from '@/generated/prisma';
import { sendFCMNotification } from '@/lib/fcmAdmin';

const prisma = new PrismaClient();

export class UKMBandNotificationService {
  // 1. Event Creation Notification - Send to ALL members (not just active)
  async notifyEventCreation({
    userIds,
    eventId,
    eventTitle,
    eventDate,
    eventLocation,
    sendToAllMembers = true // Default to all members for events
  }: {
    userIds: string[];
    eventId: string;
    eventTitle: string;
    eventDate: Date;
    eventLocation: string;
    sendToAllMembers?: boolean;
  }) {
    try {
      console.log(`🎵 Notifying event creation: ${eventTitle}`);

      const title = '🎵 Acara Baru UKM Band!';
      const body = `${eventTitle} - ${new Date(eventDate).toLocaleDateString('id-ID')} di ${eventLocation}`;

      const actionUrl = `/events/${eventId}`;

      let targetUserIds = userIds;

      // If sendToAllMembers is true, get ALL members (not just active ones)
      if (sendToAllMembers) {
        targetUserIds = await this.getAllMembers();
        console.log(`📋 Event Creation: Sending to ALL ${targetUserIds.length} members (including inactive)`);
      }

      // Send to all target users
      const results = await Promise.allSettled(
        targetUserIds.map(userId =>
          this.sendNotification(userId, {
            title,
            body,
            type: 'EVENT_CREATION',
            eventId,
            actionUrl
          })
        )
      );

      console.log(`✅ Event creation notifications sent to ${targetUserIds.length} users`);
      return results;
    } catch (error) {
      console.error('❌ Error sending event creation notifications:', error);
      throw error;
    }
  }

  // 2. 3-Day Practice Reminder - Team Members Only
  async notifyPracticeReminder3Days({
    userIds,
    practiceDate,
    practiceType = 'Latihan Rutin'
  }: {
    userIds: string[];
    practiceDate: Date;
    practiceType?: string;
  }) {
    try {
      console.log(`🎸 Sending 3-day practice reminders for ${practiceDate}`);

      const title = '🎸 Reminder Latihan UKM Band';
      const body = `${practiceType} dalam 3 hari - ${new Date(practiceDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })}`;

      const actionUrl = '/schedule/practice';

      // Target: Team members only (if userIds not provided, get all team members)
      let targetUserIds = userIds;
      if (targetUserIds.length === 0) {
        targetUserIds = await this.getTeamMembers(); // Only team members
        console.log(`📋 Practice Reminder: Sending to TEAM ONLY - ${targetUserIds.length} team members`);
      }

      const results = await Promise.allSettled(
        targetUserIds.map(userId =>
          this.sendNotification(userId, {
            title,
            body,
            type: 'PRACTICE_REMINDER_3_DAYS',
            data: { practiceDate: practiceDate.toISOString(), practiceType },
            actionUrl
          })
        )
      );

      console.log(`✅ 3-day practice reminders sent to ${targetUserIds.length} team members`);
      return results;
    } catch (error) {
      console.error('❌ Error sending 3-day practice reminders:', error);
      throw error;
    }
  }

  // 3. H-1 Performance Reminder - Team Members Only
  async notifyPerformanceReminderH1({
    userIds,
    performanceTitle,
    performanceDate,
    performanceLocation
  }: {
    userIds: string[];
    performanceTitle: string;
    performanceDate: Date;
    performanceLocation: string;
  }) {
    try {
      console.log(`🎤 Sending H-1 performance reminders for: ${performanceTitle}`);

      const title = '🎤 Besok Manggung!';
      const body = `${performanceTitle} besok jam ${new Date(performanceDate).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })} di ${performanceLocation}`;

      const actionUrl = `/performances/${performanceTitle}`;

      // Target: Team members only (if userIds not provided, get all team members)
      let targetUserIds = userIds;
      if (targetUserIds.length === 0) {
        targetUserIds = await this.getTeamMembers(); // Only team members
        console.log(`📋 H-1 Performance Reminder: Sending to TEAM ONLY - ${targetUserIds.length} team members`);
      }

      const results = await Promise.allSettled(
        targetUserIds.map(userId =>
          this.sendNotification(userId, {
            title,
            body,
            type: 'PERFORMANCE_REMINDER_H1',
            data: {
              performanceDate: performanceDate.toISOString(),
              performanceLocation,
              performanceTitle
            },
            actionUrl
          })
        )
      );

      console.log(`✅ H-1 performance reminders sent to ${targetUserIds.length} team members`);
      return results;
    } catch (error) {
      console.error('❌ Error sending H-1 performance reminders:', error);
      throw error;
    }
  }

  // 4. 2-Hour Performance Reminder - Team Members Only
  async notifyPerformanceReminder2Hours({
    userIds,
    performanceTitle,
    performanceLocation,
    performanceTime
  }: {
    userIds: string[];
    performanceTitle: string;
    performanceLocation: string;
    performanceTime: Date;
  }) {
    try {
      console.log(`⏰ Sending 2-hour performance reminders for: ${performanceTitle}`);

      const title = '⏰ 2 Jam Lagi Manggung!';
      const body = `Persiapkan diri untuk ${performanceTitle} di ${performanceLocation}`;

      const actionUrl = `/performances/${performanceTitle}`;

      // Target: Team members only (if userIds not provided, get all team members)
      let targetUserIds = userIds;
      if (targetUserIds.length === 0) {
        targetUserIds = await this.getTeamMembers(); // Only team members
        console.log(`📋 2-Hour Performance Reminder: Sending to TEAM ONLY - ${targetUserIds.length} team members`);
      }

      const results = await Promise.allSettled(
        targetUserIds.map(userId =>
          this.sendNotification(userId, {
            title,
            body,
            type: 'PERFORMANCE_REMINDER_2_HOURS',
            data: {
              performanceTime: performanceTime.toISOString(),
              performanceLocation,
              performanceTitle
            },
            actionUrl
          })
        )
      );

      console.log(`✅ 2-hour performance reminders sent to ${targetUserIds.length} team members`);
      return results;
    } catch (error) {
      console.error('❌ Error sending 2-hour performance reminders:', error);
      throw error;
    }
  }

  // 5. Team Member Join Notification
  async notifyTeamMemberJoin({
    userIds,
    newMemberName,
    role,
    teamName = 'UKM Band'
  }: {
    userIds: string[];
    newMemberName: string;
    role: string;
    teamName?: string;
  }) {
    try {
      console.log(`👥 Notifying team member join: ${newMemberName} as ${role}`);

      const title = '👥 Anggota Baru UKM Band!';
      const body = `${newMemberName} bergabung sebagai ${role}`;

      const actionUrl = '/team/members';

      // Use ALL members with active FCM subscriptions (not just active users)
      let targetUserIds = userIds;
      if (targetUserIds.length === 0) {
        targetUserIds = await this.getAllMembers();
        console.log(`📋 Team Member Join: Sending to ALL ${targetUserIds.length} FCM subscribers`);
      }

      const results = await Promise.allSettled(
        targetUserIds.map(userId =>
          this.sendNotification(userId, {
            title,
            body,
            type: 'TEAM_MEMBER_JOIN',
            data: { newMemberName, role, teamName },
            actionUrl
          })
        )
      );

      console.log(`✅ Team member join notifications sent to ${targetUserIds.length} users`);
      return results;
    } catch (error) {
      console.error('❌ Error sending team member join notifications:', error);
      throw error;
    }
  }

  // 6. Song Addition Notification - Team Members Only
  async notifySongAddition({
    userIds,
    songTitle,
    artist,
    addedBy,
    difficulty = 'Medium'
  }: {
    userIds: string[];
    songTitle: string;
    artist: string;
    addedBy: string;
    difficulty?: string;
  }) {
    try {
      console.log(`🎶 Notifying song addition: ${songTitle} by ${artist}`);

      const title = '🎶 Lagu Baru Ditambahkan!';
      const body = `${songTitle} - ${artist} (${difficulty}) ditambahkan oleh ${addedBy}`;

      const actionUrl = '/repertoire/songs';

      // Target: Team members only (if userIds not provided, get all team members)
      let targetUserIds = userIds;
      if (targetUserIds.length === 0) {
        targetUserIds = await this.getTeamMembers(); // Only team members
        console.log(`📋 Song Addition: Sending to TEAM ONLY - ${targetUserIds.length} team members`);
      }

      const results = await Promise.allSettled(
        targetUserIds.map(userId =>
          this.sendNotification(userId, {
            title,
            body,
            type: 'SONG_ADDITION',
            data: { songTitle, artist, addedBy, difficulty },
            actionUrl
          })
        )
      );

      console.log(`✅ Song addition notifications sent to ${targetUserIds.length} team members`);
      return results;
    } catch (error) {
      console.error('❌ Error sending song addition notifications:', error);
      throw error;
    }
  }

  // Core notification sender
  private async sendNotification(
    userId: string,
    {
      title,
      body,
      type,
      eventId,
      data,
      actionUrl
    }: {
      title: string;
      body: string;
      type: string;
      eventId?: string;
      data?: any;
      actionUrl: string;
    }
  ) {
    try {
      // Production URL for PWA direct access
      const productionBaseUrl = 'https://ukmbandbinusbekasi.vercel.app';
      const fullActionUrl = actionUrl.startsWith('http')
        ? actionUrl
        : `${productionBaseUrl}${actionUrl}`;

      const notificationPayload = {
        title,
        body,
        icon: '/icons/favicon.png',
        badge: '/icons/favicon.png',
        tag: `ukmband-${type}-${Date.now()}`,
        data: {
          type,
          userId,
          eventId: eventId || '',
          actionUrl: fullActionUrl,
          timestamp: new Date().toISOString(),
          source: 'ukmband-system',
          ...data
        },
        actionUrl: fullActionUrl,
        clickAction: fullActionUrl,
        link: fullActionUrl
      };

      // 1. Send FCM notification
      const fcmResult = await sendFCMNotification(userId, notificationPayload);

      // 2. Insert into database for header notifications
      try {
        await prisma.notification.create({
          data: {
            title,
            message: body,
            type: type as any,
            userId,
            eventId: eventId || null,
            actionUrl: fullActionUrl,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`💾 Database notification created for user ${userId}: ${title}`);
      } catch (dbError) {
        console.error(`❌ Failed to create database notification for user ${userId}:`, dbError);
        // Don't throw error, FCM was successful
      }

      return fcmResult;
    } catch (error) {
      console.error(`❌ Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  // Get ALL users for notifications (including inactive) - FIXED VERSION
  async getAllMembers(): Promise<string[]> {
    try {
      console.log(`🔍 DEBUG: Getting ALL members with FCM subscriptions (FIXED VERSION)...`);

      // First, check total users
      const totalUsers = await prisma.user.count();
      console.log(`📊 Total users in database: ${totalUsers}`);

      // Check all FCM subscriptions
      const allSubscriptions = await prisma.fCMSubscription.count({
        where: { isActive: true }
      });
      console.log(`📊 Total active FCM subscriptions: ${allSubscriptions}`);

      // FIX: Get users with active FCM subscriptions using RAW SQL to avoid Prisma relationship issues
      const usersWithFcm = await prisma.$queryRaw`
        SELECT DISTINCT u.id, u.name, u.email, u."organizationLvl"
        FROM "User" u
        INNER JOIN "FCMSubscription" fcm ON u.id = fcm."userId"
        WHERE fcm."isActive" = true
      `;

      console.log(`📊 DEBUG: Raw SQL query found ${usersWithFcm.length} users with active FCM subscriptions:`);
      (usersWithFcm as any[]).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email})`);
        console.log(`     - User ID: ${user.id}`);
        console.log(`     - Organization Level: ${user.organizationLvl}`);
      });

      if (usersWithFcm.length === 0) {
        console.log(`❌ NO USERS FOUND WITH ACTIVE FCM SUBSCRIPTIONS!`);
        console.log(`💡 SOLUTION: Users need to subscribe to FCM first`);
        console.log(`   - Go to /test-fcm-notifications`);
        console.log(`   - Click "🔔 Subscribe to FCM"`);
        console.log(`   - Make sure browser notification permission is "Allowed"`);
        return [];
      }

      // Get detailed FCM subscription info for each user
      const usersWithDetails = await Promise.all(
        (usersWithFcm as any[]).map(async (user) => {
          const fcmSubs = await prisma.fCMSubscription.findMany({
            where: {
              userId: user.id,
              isActive: true
            },
            select: {
              id: true,
              isActive: true,
              createdAt: true,
              deviceInfo: true
            },
            orderBy: { createdAt: 'desc' }
          });

          return {
            ...user,
            fcmSubscriptions: fcmSubs
          };
        })
      );

      console.log(`📊 Final result: ${usersWithDetails.length} users with detailed FCM info`);

      return usersWithDetails.map(user => user.id);
    } catch (error) {
      console.error('❌ Error getting all members:', error);
      return [];
    }
  }

  // Get team members only for notifications
  async getTeamMembers(): Promise<string[]> {
    try {
      console.log(`🔍 DEBUG: Getting TEAM members with FCM subscriptions...`);

      // Get only team members (TALENT and SPECTA levels) with active FCM subscriptions
      const teamMembersWithFcm = await prisma.$queryRaw`
        SELECT DISTINCT u.id, u.name, u.email, u."organizationLvl"
        FROM "User" u
        INNER JOIN "FCMSubscription" fcm ON u.id = fcm."userId"
        WHERE fcm."isActive" = true
        AND u."organizationLvl" IN ('TALENT', 'SPECTA')
      `;

      console.log(`📊 Found ${teamMembersWithFcm.length} TEAM members with FCM subscriptions:`);
      (teamMembersWithFcm as any[]).forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.name} (${member.organizationLvl}) - ${member.email}`);
      });

      if (teamMembersWithFcm.length === 0) {
        console.log(`❌ NO TEAM MEMBERS FOUND WITH ACTIVE FCM SUBSCRIPTIONS!`);
        return [];
      }

      return (teamMembersWithFcm as any[]).map(member => member.id);
    } catch (error) {
      console.error('❌ Error getting team members:', error);
      return [];
    }
  }

  // Get all active users for notifications - FIXED VERSION
  async getAllActiveUsers(): Promise<string[]> {
    try {
      console.log(`🔍 DEBUG: Getting active users with FCM subscriptions (FIXED VERSION)...`);

      // FIX: Use RAW SQL to avoid Prisma relationship issues
      const usersWithFcm = await prisma.$queryRaw`
        SELECT DISTINCT u.id, u.name, u.email, u."organizationLvl"
        FROM "User" u
        INNER JOIN "FCMSubscription" fcm ON u.id = fcm."userId"
        WHERE fcm."isActive" = true
      `;

      console.log(`📊 Found ${usersWithFcm.length} active users with FCM subscriptions for reminders`);

      return (usersWithFcm as any[]).map(user => user.id);
    } catch (error) {
      console.error('❌ Error getting active users:', error);
      return [];
    }
  }

  // Get users by role for targeted notifications (using organizationLvl instead of role)
  async getUsersByRole(role: string): Promise<string[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          organizationLvl: role, // Use organizationLvl instead of role
          fCMSubscriptions: {
            some: {
              isActive: true
            }
          }
        },
        select: {
          id: true,
          name: true,
          organizationLvl: true
        }
      });

      console.log(`📊 Found ${users.length} users with organization level ${role}`);

      return users.map(user => user.id);
    } catch (error) {
      console.error('❌ Error getting users by role:', error);
      return [];
    }
  }

  // 7. Member Join Event Notification (Targeted to existing event members)
  async notifyMemberJoinEvent({
    eventId,
    newMemberName,
    memberRole,
    existingMemberIds,
    newMemberId
  }: {
    eventId: string;
    newMemberName: string;
    memberRole: string;
    existingMemberIds?: string[];
    newMemberId?: string;
  }) {
    try {
      console.log(`👥 Notifying member join event: ${newMemberName} as ${memberRole}`);

      // Get event details
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          title: true,
          date: true,
          location: true
        }
      });

      if (!event) {
        console.error(`❌ Event not found: ${eventId}`);
        return [];
      }

      // If existingMemberIds not provided, get all existing members for this event
      let targetUserIds = existingMemberIds || [];
      if (!targetUserIds.length) {
        const existingMembers = await prisma.eventPersonnel.findMany({
          where: {
            eventId: eventId,
            userId: { not: null },
            status: 'APPROVED'
          },
          select: {
            userId: true
          }
        });

        targetUserIds = existingMembers.map(member => member.userId);
        console.log(`📋 Found ${targetUserIds.length} existing members for event ${event.title}`);
      }

      const eventDate = new Date(event.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const title = `👥 ${memberRole} Bergabung!`;
      const body = `${newMemberName} telah bergabung sebagai ${memberRole} di "${event.title}" - ${eventDate}`;

      const actionUrl = `/events/member?eventId=${eventId}`;

      const results = await Promise.allSettled(
        targetUserIds.map(userId =>
          this.sendNotification(userId, {
            title,
            body,
            type: 'MEMBER_JOIN_EVENT',
            data: {
              eventId,
              newMemberName,
              memberRole,
              eventTitle: event.title,
              eventDate: eventDate,
              eventLocation: event.location,
              newMemberId
            },
            actionUrl
          })
        )
      );

      console.log(`✅ Member join event notifications sent to ${targetUserIds.length} existing members`);
      return results;
    } catch (error) {
      console.error('❌ Error sending member join event notifications:', error);
      throw error;
    }
  }
}

export const ukmBandNotificationService = new UKMBandNotificationService();