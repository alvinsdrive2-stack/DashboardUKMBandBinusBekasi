import {
  Notification,
  CreateNotificationDto,
  NotificationListResponse,
  BulkNotificationOperation
} from '@/types/notification';

const API_BASE =
  typeof window === 'undefined'
    ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`
    : '/api/notifications';

class NotificationService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unreadOnly: 'true' })
    });

    return this.request<NotificationListResponse>(
      `${API_BASE}?${params}`
    );
  }

  async createNotification(
    data: CreateNotificationDto
  ): Promise<{ notification: Notification }> {
    return this.request<{ notification: Notification }>(API_BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBulkNotification(
    data: {
      userIds: string[];
      title: string;
      message: string;
      type: string;
      eventId?: string;
      actionUrl?: string;
    }
  ): Promise<{ success: boolean; notificationsCreated: number }> {
    return this.request<{ success: boolean; notificationsCreated: number }>(
      `${API_BASE}/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async markAsRead(notificationId: string): Promise<{ notification: Notification }> {
    return this.request<{ notification: Notification }>(
      `${API_BASE}/${notificationId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ isRead: true }),
      }
    );
  }

  async markAsUnread(notificationId: string): Promise<{ notification: Notification }> {
    return this.request<{ notification: Notification }>(
      `${API_BASE}/${notificationId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ isRead: false }),
      }
    );
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `${API_BASE}/${notificationId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return this.request<{ unreadCount: number }>(`${API_BASE}/unread-count`);
  }

  async markAllAsRead(): Promise<{ success: boolean; modifiedCount: number }> {
    return this.request<{ success: boolean; modifiedCount: number }>(
      `${API_BASE}/bulk`,
      {
        method: 'PUT',
        body: JSON.stringify({ action: 'markAllAsRead' }),
      }
    );
  }

  async markMultipleAsRead(
    notificationIds: string[]
  ): Promise<{ success: boolean; modifiedCount: number }> {
    return this.request<{ success: boolean; modifiedCount: number }>(
      `${API_BASE}/bulk`,
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'markMultipleAsRead',
          notificationIds
        }),
      }
    );
  }

  async deleteMultiple(
    notificationIds: string[]
  ): Promise<{ success: boolean; modifiedCount: number }> {
    return this.request<{ success: boolean; modifiedCount: number }>(
      `${API_BASE}/bulk`,
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'deleteMultiple',
          notificationIds
        }),
      }
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;