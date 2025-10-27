import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitNotificationToMultipleUsers } from '@/utils/notificationEmitter';

// This endpoint should be called by a cron job service
export async function POST(request: NextRequest) {
  try {
    // Security: Only allow authorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    console.log(`🔔 Running reminder check at ${now.toISOString()}`);

    // Get all published events that need reminders
    const eventsNeedingReminders = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        date: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      include: {
        personnel: {
          where: {
            status: 'APPROVED',
            userId: { not: null }
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    console.log(`📅 Found ${eventsNeedingReminders.length} events to check for reminders`);

    const notificationsCreated = [];

    // Also check for recent activities that need notifications
    await checkRecentActivities();

    for (const event of eventsNeedingReminders) {
      const eventDate = new Date(event.date);
      const timeUntilEvent = eventDate.getTime() - now.getTime();
      const daysUntilEvent = timeUntilEvent / (1000 * 60 * 60 * 24);
      const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60);

      console.log(`⏰ Event "${event.title}" is in ${daysUntilEvent.toFixed(1)} days (${hoursUntilEvent.toFixed(1)} hours)`);

      const userIds = event.personnel.map(p => p.userId!).filter(Boolean);

      if (userIds.length === 0) continue;

      // 3 Days Practice Reminder - every 3 days for regular practice
      const daysSinceLastPractice = await getDaysSinceLastPractice(userIds);
      if (daysSinceLastPractice >= 3) {
        await sendPracticeReminder(userIds, event);
        notificationsCreated.push(`Practice reminder (3 days) for ${event.title}`);
      }

      // 1 Day Before Event Reminder
      if (Math.abs(daysUntilEvent - 1) < 0.1) { // Within 2.4 hours of 1 day
        await sendOneDayReminder(event, userIds);
        notificationsCreated.push(`1-day reminder for ${event.title}`);
      }

      // 2 Hours Before Event - Gather at Location
      if (Math.abs(hoursUntilEvent - 2) < 0.5) { // Within 30 minutes of 2 hours
        await sendTwoHourReminder(event, userIds);
        notificationsCreated.push(`2-hour reminder for ${event.title}`);
      }
    }

    return NextResponse.json({
      success: true,
      notificationsCreated,
      eventsProcessed: eventsNeedingReminders.length,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error scheduling reminders:', error);
    return NextResponse.json(
      { error: 'Failed to schedule reminders' },
      { status: 500 }
    );
  }
}

async function getDaysSinceLastPractice(userIds: string[]): Promise<number> {
  try {
    // Get the most recent event for these users
    const lastEvent = await prisma.event.findFirst({
      where: {
        date: {
          lt: new Date()
        },
        personnel: {
          some: {
            userId: { in: userIds },
            status: 'APPROVED'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    if (!lastEvent) return 999; // No previous events, definitely need practice

    const daysSince = Math.floor(
      (new Date().getTime() - lastEvent.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSince;
  } catch (error) {
    console.error('Error calculating days since last practice:', error);
    return 999;
  }
}

async function sendPracticeReminder(userIds: string[], event: any) {
  try {
    const title = '🎸 Waktunya Latihan!';
    const message = `Sudah 3 hari sejak latihan terakhir. Yuk latihan untuk persiapan event berikutnya!`;

    const notificationData = {
      title,
      message,
      type: 'PRACTICE_REMINDER',
      eventId: event.id,
      actionUrl: `/dashboard/member/schedule`,
      priority: 'medium',
      timestamp: new Date().toISOString(),
      reminderType: 'PRACTICE_THREE_DAYS'
    };

    // Create database notifications
    const notificationPromises = userIds.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: 'PRACTICE_REMINDER',
          eventId: event.id,
          actionUrl: '/dashboard/member/schedule',
          isRead: false
        }
      })
    );

    await Promise.all(notificationPromises);

    // Send real-time notifications
    emitNotificationToMultipleUsers(userIds, {
      id: `practice-reminder-${Date.now()}`,
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Sent practice reminder to ${userIds.length} users`);

  } catch (error) {
    console.error('❌ Error sending practice reminder:', error);
  }
}

async function sendOneDayReminder(event: any, userIds: string[]) {
  try {
    const eventDate = new Date(event.date);
    const title = '🗓️ Event Besok!';
    const message = `Event "${event.title}" akan dimulai besok pada ${formatEventDate(event.date)}. Jangan lupa siapkan peralatanmu!`;

    const notificationData = {
      title,
      message,
      type: 'EVENT_REMINDER',
      eventId: event.id,
      actionUrl: `/dashboard/member/schedule?modal=open&eventId=${event.id}`,
      priority: 'high',
      timestamp: new Date().toISOString(),
      reminderType: 'ONE_DAY_BEFORE'
    };

    // Create database notifications
    const notificationPromises = userIds.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: 'EVENT_REMINDER',
          eventId: event.id,
          actionUrl: `/dashboard/member/schedule?modal=open&eventId=${event.id}`,
          isRead: false
        }
      })
    );

    await Promise.all(notificationPromises);

    // Send real-time notifications
    emitNotificationToMultipleUsers(userIds, {
      id: `reminder-1day-${event.id}-${Date.now()}`,
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Sent 1-day reminder for "${event.title}" to ${userIds.length} users`);

  } catch (error) {
    console.error(`❌ Error sending 1-day reminder for event ${event.id}:`, error);
  }
}

async function sendTwoHourReminder(event: any, userIds: string[]) {
  try {
    const title = '🏃‍♂️ Segera Berkumpul!';
    const message = `Event "${event.title}" akan dimulai 2 jam lagi! Segera berkumpul di ${event.location}`;

    const notificationData = {
      title,
      message,
      type: 'EVENT_REMINDER',
      eventId: event.id,
      actionUrl: `/dashboard/member/schedule?modal=open&eventId=${event.id}`,
      priority: 'high',
      timestamp: new Date().toISOString(),
      reminderType: 'TWO_HOURS_BEFORE',
      location: event.location
    };

    // Create database notifications
    const notificationPromises = userIds.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: 'EVENT_REMINDER',
          eventId: event.id,
          actionUrl: `/dashboard/member/schedule?modal=open&eventId=${event.id}`,
          isRead: false
        }
      })
    );

    await Promise.all(notificationPromises);

    // Send real-time notifications
    emitNotificationToMultipleUsers(userIds, {
      id: `reminder-2hour-${event.id}-${Date.now()}`,
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Sent 2-hour reminder for "${event.title}" to ${userIds.length} users`);

  } catch (error) {
    console.error(`❌ Error sending 2-hour reminder for event ${event.id}:`, error);
  }
}

function formatEventDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return new Date(date).toLocaleDateString('id-ID', options);
}

async function checkRecentActivities() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check for newly published events (in the last hour)
    const newEvents = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        createdAt: {
          gte: oneHourAgo
        }
      },
      include: {
        personnel: {
          where: {
            status: 'APPROVED',
            userId: { not: null }
          },
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    for (const event of newEvents) {
      await sendNewEventNotification(event);
    }

    // Check for recent song additions (in the last hour)
    const recentSongs = await prisma.eventSong.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo
        }
      },
      include: {
        event: {
          include: {
            personnel: {
              where: {
                status: 'APPROVED',
                userId: { not: null }
              },
              include: {
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        song: true
      }
    });

    for (const eventSong of recentSongs) {
      await sendNewSongNotification(eventSong);
    }

    // Check for recent user registrations (in the last hour)
    const recentRegistrations = await prisma.eventPersonnel.findMany({
      where: {
        status: 'APPROVED',
        userId: { not: null },
        createdAt: {
          gte: oneHourAgo
        }
      },
      include: {
        user: {
          select: { id: true, name: true }
        },
        event: {
          include: {
            personnel: {
              where: {
                status: 'APPROVED',
                userId: { not: eventSong.userId }
              },
              include: {
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });

    for (const registration of recentRegistrations) {
      await sendUserJoinedNotification(registration);
    }

  } catch (error) {
    console.error('❌ Error checking recent activities:', error);
  }
}

async function sendNewEventNotification(event: any) {
  try {
    // Get all members who should be notified
    const allMembers = await prisma.user.findMany({
      where: {
        organizationLvl: {
          in: ['TALENT', 'SPECTA']
        }
      },
      select: { id: true, name: true }
    });

    const userIds = allMembers.map(member => member.id);

    if (userIds.length === 0) return;

    const title = '🎉 Event Baru Tersedia!';
    const message = `Event "${event.title}" telah dipublish. Segera daftar untuk ikut serta!`;

    const notificationData = {
      title,
      message,
      type: 'EVENT_PUBLISHED',
      eventId: event.id,
      actionUrl: '/dashboard/member/available-events',
      priority: 'high',
      timestamp: new Date().toISOString()
    };

    // Create database notifications
    const notificationPromises = userIds.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: 'EVENT_PUBLISHED',
          eventId: event.id,
          actionUrl: '/dashboard/member/available-events',
          isRead: false
        }
      })
    );

    await Promise.all(notificationPromises);

    // Send real-time notifications
    emitNotificationToMultipleUsers(userIds, {
      id: `new-event-${event.id}-${Date.now()}`,
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Sent new event notification for "${event.title}" to ${userIds.length} users`);

  } catch (error) {
    console.error(`❌ Error sending new event notification:`, error);
  }
}

async function sendNewSongNotification(eventSong: any) {
  try {
    const { event, song } = eventSong;
    const userIds = event.personnel
      .filter(p => p.user && p.user.id !== eventSong.userId) // Exclude the user who added the song
      .map(p => p.user.id);

    if (userIds.length === 0) return;

    const title = '🎵 Lagu Baru Ditambahkan!';
    const message = `Lagu "${song.title}" telah ditambahkan ke event "${event.title}"`;

    const notificationData = {
      title,
      message,
      type: 'SONG_ADDED',
      eventId: event.id,
      actionUrl: `/dashboard/songs?eventId=${event.id}`,
      priority: 'medium',
      timestamp: new Date().toISOString(),
      songTitle: song.title,
      eventTitle: event.title
    };

    // Create database notifications
    const notificationPromises = userIds.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: 'SONG_ADDED',
          eventId: event.id,
          actionUrl: `/dashboard/songs?eventId=${event.id}`,
          isRead: false
        }
      })
    );

    await Promise.all(notificationPromises);

    // Send real-time notifications
    emitNotificationToMultipleUsers(userIds, {
      id: `new-song-${event.id}-${Date.now()}`,
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Sent new song notification for "${song.title}" to ${userIds.length} users`);

  } catch (error) {
    console.error(`❌ Error sending new song notification:`, error);
  }
}

async function sendUserJoinedNotification(registration: any) {
  try {
    const { user, event } = registration;

    // Get existing event members (excluding the new user)
    const existingMembers = event.personnel
      .filter(p => p.user && p.user.id !== user.id)
      .map(p => p.user.id);

    if (existingMembers.length === 0) return;

    const title = '👋 Anggota Baru Bergabung!';
    const message = `${user.name} telah bergabung dengan event "${event.title}" sebagai ${registration.role}`;

    const notificationData = {
      title,
      message,
      type: 'USER_JOINED_EVENT',
      eventId: event.id,
      actionUrl: `/dashboard/member/schedule?modal=open&eventId=${event.id}`,
      priority: 'medium',
      timestamp: new Date().toISOString(),
      userName: user.name,
      userRole: registration.role
    };

    // Create database notifications
    const notificationPromises = existingMembers.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: 'PERSONNEL_ASSIGNED', // Use existing enum
          eventId: event.id,
          actionUrl: `/dashboard/member/schedule?modal=open&eventId=${event.id}`,
          isRead: false
        }
      })
    );

    await Promise.all(notificationPromises);

    // Send real-time notifications
    emitNotificationToMultipleUsers(existingMembers, {
      id: `user-joined-${event.id}-${Date.now()}`,
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Sent user joined notification for ${user.name} to ${existingMembers.length} users`);

  } catch (error) {
    console.error(`❌ Error sending user joined notification:`, error);
  }
}

// GET endpoint for manual testing (requires admin session)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser || !['COMMISSIONER', 'PENGURUS'].includes(currentUser.organizationLvl)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Manually trigger reminder scheduling
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/schedule-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error manually scheduling reminders:', error);
    return NextResponse.json(
      { error: 'Failed to manually schedule reminders' },
      { status: 500 }
    );
  }
}