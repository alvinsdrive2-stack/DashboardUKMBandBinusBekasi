// Prisma generated types will be used, but these are the specific interfaces we'll work with

export type NotificationType =
  | 'EVENT_REMINDER'
  | 'PERSONNEL_ASSIGNED'
  | 'EVENT_STATUS_CHANGED'
  | 'SONG_ADDED'
  | 'DEADLINE_REMINDER'
  | 'SLOT_AVAILABLE';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  eventId?: string | null;
  actionUrl?: string | null;
  event?: {
    id: string;
    title: string;
    date: Date;
    location: string;
  } | null;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: NotificationType;
  eventId?: string;
  actionUrl?: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
}

export interface NotificationSettings {
  eventReminder: boolean;
  personnelAssigned: boolean;
  eventStatusChanged: boolean;
  songAdded: boolean;
  browserNotification: boolean;
  pushNotification: boolean;
  emailNotification: boolean;
}

export interface BulkNotificationOperation {
  action: 'markAllAsRead' | 'markMultipleAsRead' | 'deleteMultiple';
  notificationIds?: string[];
}