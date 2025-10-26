# UKM Band Dashboard - Sistem Notifikasi

## Overview
Sistem notifikasi lengkap untuk UKM Band Dashboard dengan in-app notification dan PWA push notification.

## Jenis Notifikasi

### 🎵 Event-Related
- "Event [Nama Event] akan dimulai besok jam 19:00"
- "Kamu mendaftarkan diri sebagai [Gitaris] di event [Nama Event]"
- "Event [Nama Event] status berubah menjadi Published"
- "Lagu [Judul Lagu] ditambahkan ke event [Nama Event]"

### 👥 Personnel-Related
- "Kamu mendaftarkan diri sebagai [Drummer] untuk slot [Nama Slot]"
- "Personnel lain approved untuk event [Nama Event]"
- "Slot kamu di event [Nama Event] kosong, segera cari pengganti"

### ⏰ Reminder
- "Jangan lupa latihan untuk event [Nama Event] besok!"
- "Deadline konfirmasi kehadiran: 2 jam lagi"

## Database Schema

### Model Notification
```prisma
model Notification {
  id          String           @id @default(cuid())
  title       String
  message     String
  type        NotificationType
  userId      String
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  eventId     String?
  actionUrl   String?          // URL untuk redirect saat klik notif

  user        User             @relation(fields: [userId], references: [id])
  event       Event?           @relation(fields: [eventId], references: [id])

  @@index([userId, isRead])
  @@index([createdAt])
}
```

### Model NotificationSetting
```prisma
model NotificationSetting {
  id                    String   @id @default(cuid())
  userId                String   @unique
  eventReminder         Boolean  @default(true)
  personnelAssigned     Boolean  @default(true)
  eventStatusChanged    Boolean  @default(true)
  songAdded             Boolean  @default(true)
  browserNotification   Boolean  @default(true)
  pushNotification      Boolean  @default(true)
  emailNotification     Boolean  @default(false)

  user                  User     @relation(fields: [userId], references: [id])
}
```

### Enum NotificationType
```prisma
enum NotificationType {
  EVENT_REMINDER
  PERSONNEL_ASSIGNED
  EVENT_STATUS_CHANGED
  SONG_ADDED
  DEADLINE_REMINDER
  SLOT_AVAILABLE
}
```

## In-App Notification System

### 1. UI Components
- **Bell Icon** di header dashboard
- **Notification Badge** (angka unread count)
- **Dropdown Panel** list notifikasi
- **Mark as Read/Unread** functionality
- **Delete Notification** option

### 2. API Endpoints
- `GET /api/notifications` - get user notifications
- `POST /api/notifications` - create new notification
- `PUT /api/notifications/:id/read` - mark as read
- `DELETE /api/notifications/:id` - delete notification
- `GET /api/notifications/unread-count` - get unread count

### 3. Real-time Updates
- WebSocket connection untuk real-time notification
- Push ke client saat ada notifikasi baru

## Notification Triggers

### Event Creation/Update
- Saat event dibuat → notif ke admin
- Saat event diupdate → notif ke personnel terkait
- Saat event akan dimulai (24 jam, 1 jam sebelum)

### Personnel Assignment
- Saat user mendaftar sebagai personnel
- Saat personnel approved/rejected
- Saat ada perubahan slot

### Song Management
- Saat lagu ditambahkan/diupdate di event
- Saat ada perubahan order lagu

## Frontend Implementation

### Notification Bell Component
```tsx
// components/NotificationBell.tsx
interface NotificationBellProps {
  unreadCount: number;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### Notification Provider
```tsx
// contexts/NotificationContext.tsx
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}
```

### WebSocket Integration
```tsx
// hooks/useWebSocket.ts
const useWebSocket = () => {
  // Connect ke WebSocket server
  // Listen untuk new notification events
  // Update notification state real-time
};
```

## Backend Implementation

### Notification Service
```typescript
// services/NotificationService.ts
class NotificationService {
  async createNotification(data: CreateNotificationDto);
  async getUserNotifications(userId: string, pagination: PaginationDto);
  async markAsRead(notificationId: string, userId: string);
  async deleteNotification(notificationId: string, userId: string);
  async getUnreadCount(userId: string);
}
```

### Event Listeners
```typescript
// listeners/EventListeners.ts
// Listen untuk Prisma events atau manual triggers
onEventCreated(event);
onPersonnelAssigned(personnel);
onEventStatusChanged(event, oldStatus, newStatus);
```

### WebSocket Server
```typescript
// server/websocket.ts
// Push notification ke connected clients
io.to(userId).emit('new_notification', notification);
```

## Implementation Steps

1. **Database Setup**
   - Add Notification & NotificationSetting models
   - Run migration

2. **Backend API**
   - Create notification endpoints
   - Implement notification service
   - Set up WebSocket server

3. **Frontend UI**
   - Create notification bell component
   - Build notification dropdown
   - Implement notification context

4. **Integration**
   - Connect frontend to API
   - Set up WebSocket client
   - Add notification triggers

5. **Settings**
   - Create notification settings page
   - Implement user preferences

## File Structure
```
src/
├── components/
│   ├── NotificationBell.tsx
│   ├── NotificationDropdown.tsx
│   └── NotificationItem.tsx
├── contexts/
│   └── NotificationContext.tsx
├── hooks/
│   └── useWebSocket.ts
├── app/api/
│   └── notifications/
│       ├── route.ts
│       └── [id]/
├── services/
│   └── NotificationService.ts
└── types/
    └── notification.ts
```