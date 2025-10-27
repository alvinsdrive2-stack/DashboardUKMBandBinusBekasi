# UKM Band Dashboard - Notification System Usage Guide

## Overview
This guide covers how to use the complete notification system that has been implemented in the UKM Band Dashboard. The system includes real-time notifications, automatic triggers, and comprehensive management features.

## 🚀 Quick Start

### 1. Access the System
- Login to your account at `http://localhost:3000`
- Look for the 🔔 **notification bell** in the top-right header
- Click the bell to see your notifications

### 2. Quick Test
For immediate testing, go to the admin test page:
- Navigate to `http://localhost:3000/admin/notifications-test`
- Click **"Create Test Notification for Me"**
- Check the notification bell - it should update with your new notification!

## 📱 User Features

### Notification Bell & Dropdown
- **Bell Icon**: Shows unread notification count with a red badge
- **Dropdown**: Lists all notifications with read/unread status
- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Actions**: Mark as read, delete, mark all as read

### Notification Types
1. **Event Reminder** - Upcoming event notifications
2. **Personnel Assigned** - When you're assigned to an event
3. **Event Status Changed** - Event status updates
4. **Song Added** - New songs added to events
5. **Deadline Reminder** - Important deadline notifications
6. **Slot Available** - Open slots in events

### Visual Indicators
- 🔴 **Red background** = Unread notifications
- ⚪ **White background** = Read notifications
- 🕐 **Time stamps** = "2 hours ago", "1 day ago", etc.

## 🔧 Admin Features

### Test Page: `/admin/notifications-test`
Complete testing interface for administrators:

#### Quick Actions
- **Create Test Notification for Me**: Instant test for current user
- **Trigger Event Reminders**: Check upcoming events and send reminders

#### Manual Notification Creation
Create custom notifications with these fields:
- **User ID**: Target user (required)
- **Title**: Notification title (required)
- **Message**: Detailed message (required)
- **Type**: Notification type dropdown
- **Event ID**: Optional link to specific event
- **Action URL**: Optional custom action URL

#### Session Information
View current user details for easy User ID copying.

## 🛠️ API Usage

### Core Endpoints

#### Get Notifications
```typescript
GET /api/notifications?page=1&limit=20&unreadOnly=false
```
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `unreadOnly`: Filter only unread notifications (default: false)

#### Create Notification
```typescript
POST /api/notifications/create
Content-Type: application/json

{
  "userId": "user-id-here",
  "title": "Notification Title",
  "message": "Notification message",
  "type": "EVENT_REMINDER",
  "eventId": "optional-event-id",
  "actionUrl": "/events/event-id"
}
```

#### Mark as Read/Unread
```typescript
PUT /api/notifications/[id]
Content-Type: application/json

{
  "isRead": true  // or false
}
```

#### Delete Notification
```typescript
DELETE /api/notifications/[id]
```

#### Get Unread Count
```typescript
GET /api/notifications/unread-count
// Returns: { "unreadCount": 5 }
```

#### Bulk Operations
```typescript
PUT /api/notifications/bulk
Content-Type: application/json

// Mark all as read
{
  "action": "markAllAsRead"
}

// Mark multiple as read
{
  "action": "markMultipleAsRead",
  "notificationIds": ["id1", "id2", "id3"]
}

// Delete multiple
{
  "action": "deleteMultiple",
  "notificationIds": ["id1", "id2", "id3"]
}
```

### Service Layer Usage

```typescript
import notificationService from '@/services/notificationService';

// Get notifications
const notifications = await notificationService.getNotifications(1, 20);

// Create notification
await notificationService.createNotification({
  title: 'New Event',
  message: 'Event "Weekly Practice" has been created',
  type: 'EVENT_REMINDER',
  eventId: 'event-123'
});

// Mark as read
await notificationService.markAsRead('notification-id');

// Delete notification
await notificationService.deleteNotification('notification-id');

// Get unread count
const { unreadCount } = await notificationService.getUnreadCount();

// Mark all as read
await notificationService.markAllAsRead();
```

## 🤖 Automatic Triggers

### Event-Based Notifications
The system automatically sends notifications when:

#### 1. Event Created
- **Target**: Admin users (COMMISSIONER, PENGURUS)
- **Trigger**: New event created
- **Message**: "Event 'Event Title' telah dibuat oleh [Creator Name]"

#### 2. Event Status Changed
- **Target**: All assigned personnel
- **Trigger**: Event status changes (DRAFT → PUBLISHED, etc.)
- **Message**: "Event 'Event Title' status berubah dari [Old Status] ke [New Status]"

#### 3. Personnel Applied
- **Target**: Admin users
- **Trigger**: User applies for event personnel
- **Message**: "[User Name] mendaftar sebagai [Role] untuk event 'Event Title'"

#### 4. Song Added
- **Target**: All assigned personnel
- **Trigger**: New song added to event
- **Message**: "Lagu 'Song Title' ditambahkan ke event 'Event Title'"

#### 5. Personnel Status Changed
- **Target**: Specific user
- **Trigger**: Personnel status changes (PENDING → APPROVED)
- **Message**: "Kamu disetujui sebagai [Role] untuk event 'Event Title'"

### Scheduled Reminders

#### Event Reminders (Automatic)
The system checks for upcoming events and sends reminders:

**24 Hours Before:**
- **Target**: Approved event personnel
- **Message**: "Event 'Event Title' akan dimulai besok jam [Time]"

**1 Hour Before:**
- **Target**: Approved event personnel
- **Message**: "Event 'Event Title' akan dimulai 1 jam lagi di [Location]"

#### Manual Trigger
```typescript
GET /api/notifications/schedule-reminders
// Admin-only endpoint for manual reminder scheduling
```

## 🔐 Security & Permissions

### User Access Control
- **Users** can only access their own notifications
- **Admins** (COMMISSIONER, PENGURUS) can create notifications for others
- **Authentication** required for all API endpoints

### Notification Settings
Users can control which notifications they receive:
- `eventReminder`: Event reminder notifications
- `personnelAssigned`: Personnel assignment notifications
- `eventStatusChanged`: Event status change notifications
- `songAdded`: Song addition notifications
- `browserNotification`: Browser push notifications
- `pushNotification`: Mobile push notifications
- `emailNotification`: Email notifications

## 🧪 Testing & Development

### Test Page Features
The admin test page (`/admin/notifications-test`) provides:

1. **Quick Test**: Create notification for current user instantly
2. **Manual Creation**: Full control over notification parameters
3. **Reminder Trigger**: Test scheduled reminder system
4. **Session Info**: View current user details

### Common Test Scenarios

#### Scenario 1: Basic Notification
1. Go to test page
2. Click "Create Test Notification for Me"
3. Verify notification appears in bell dropdown
4. Verify unread count updates
5. Mark as read and verify changes

#### Scenario 2: Event Reminder
1. Create an upcoming event (within 24 hours)
2. Add yourself as approved personnel
3. Click "Trigger Event Reminders"
4. Verify reminder notification appears

#### Scenario 3: Admin Notification
1. Copy your User ID from session info
2. Fill out manual notification form
3. Create notification
4. Verify it appears in your notifications

#### Scenario 4: Bulk Operations
1. Create multiple test notifications
2. Use "Mark all as read" button
3. Verify all notifications are marked as read

## 🔧 Cron Job Setup

For production deployment, set up a cron job to automatically trigger reminders:

```bash
# Run every hour
0 * * * * curl -X POST https://your-domain.com/api/notifications/schedule-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Environment Variables
```env
CRON_SECRET=your-secure-cron-secret-key
```

## 📊 Monitoring & Analytics

### Database Queries for Monitoring

#### Notification Statistics
```sql
-- Total notifications per type
SELECT type, COUNT(*) as count
FROM "Notification"
GROUP BY type;

-- Notifications per user
SELECT u.name, COUNT(*) as notification_count
FROM "Notification" n
JOIN "User" u ON n.userId = u.id
GROUP BY u.id, u.name
ORDER BY notification_count DESC;

-- Read vs Unread statistics
SELECT isRead, COUNT(*) as count
FROM "Notification"
GROUP BY isRead;
```

#### Performance Monitoring
```sql
-- Recent notification creation
SELECT title, type, createdAt
FROM "Notification"
ORDER BY createdAt DESC
LIMIT 10;

-- User notification preferences
SELECT u.name, ns.eventReminder, ns.personnelAssigned, ns.eventStatusChanged
FROM "NotificationSetting" ns
JOIN "User" u ON ns.userId = u.id;
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Notifications Not Appearing
- Check if user is logged in
- Verify User ID is correct
- Check browser console for errors
- Ensure notification settings are enabled

#### 2. Admin Access Denied
- Verify user has COMMISSIONER or PENGURUS organization level
- Check session authentication
- Ensure proper API key/secret

#### 3. Reminders Not Working
- Check if CRON_SECRET is set
- Verify events have future dates
- Ensure personnel are approved status
- Check notification settings for reminder types

#### 4. Real-time Updates Not Working
- Refresh the page to update notification count
- Check network connection
- Verify API endpoints are responding

### Debug Mode
Enable debug logging by checking browser console and server logs for detailed error messages.

## 📱 Mobile Considerations

### Responsive Design
- Notification bell works on all screen sizes
- Dropdown optimized for mobile viewing
- Touch-friendly buttons and interactions

### PWA Integration (Coming Soon)
- Service worker for background notifications
- Push notification support
- Offline notification caching

## 🔄 Future Enhancements

### Planned Features
1. **Email Notifications**: SMTP integration for email alerts
2. **WebSocket Real-time**: Instant notification updates
3. **Notification Templates**: Customizable message templates
4. **Notification History**: Advanced filtering and search
5. **Analytics Dashboard**: Notification engagement metrics
6. **SMS Notifications**: Text message integration

### Integration Points
- **Calendar Integration**: Add events to user calendars
- **Team Chat**: Integrate with team messaging
- **Task Management**: Link notifications to task systems
- **File Sharing**: Attach files to notifications

## 📞 Support

For issues or questions about the notification system:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Test with the admin test page
4. Check server logs for detailed errors
5. Contact development team for technical issues

---

**Last Updated**: October 26, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅