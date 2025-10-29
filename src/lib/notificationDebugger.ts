// Notification Debugger - Track all notification sources
class NotificationDebugger {
  private static instance: NotificationDebugger;
  private logs: Array<{
    timestamp: string;
    source: string;
    type: 'CREATED' | 'CLOSED' | 'CLICKED';
    details: any;
  }> = [];

  static getInstance(): NotificationDebugger {
    if (!NotificationDebugger.instance) {
      NotificationDebugger.instance = new NotificationDebugger();
    }
    return NotificationDebugger.instance;
  }

  log(source: string, type: 'CREATED' | 'CLOSED' | 'CLICKED', details: any = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      source,
      type,
      details
    };

    this.logs.push(logEntry);

    // Console log with formatting
    const emoji = type === 'CREATED' ? '🔔' : type === 'CLOSED' ? '🗑️' : '🖱️';
    console.log(`${emoji} [${source}] ${type}:`, details);

    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Override Notification API to track all notifications
  trackNotifications() {
    if (typeof window !== 'undefined') {
      const originalNotification = (window as any).Notification;

      (window as any).Notification = class extends originalNotification {
        constructor(title: string, options?: NotificationOptions) {
          super(title, options);

          // Get stack trace to find who created this
          const stack = new Error().stack || '';
          const lines = stack.split('\n');

          // Find the source from stack trace
          let source = 'Unknown';
          let fullStack = '';
          for (const line of lines) {
            if (line.includes('.tsx:') || line.includes('.ts:') || line.includes('.js:')) {
              const match = line.match(/([^\/]+\.(tsx|ts|js):\d+:\d+)/);
              if (match) {
                source = match[1];
                fullStack = line.trim();
                break;
              }
            }
          }

          const notificationDetails = {
            title,
            icon: options?.icon,
            badge: options?.badge,
            tag: options?.tag,
            body: options?.body,
            timestamp: new Date().toISOString(),
            stackTrace: fullStack
          };

          console.log('🔔 [NOTIFICATION DEBUGGER] NEW NOTIFICATION CREATED:');
          console.log('   Title:', title);
          console.log('   Icon:', options?.icon || 'Default');
          console.log('   Source:', source);
          console.log('   Stack:', fullStack);
          console.log('   Full options:', options);
          console.log('   ------------------------------------------------');

          NotificationDebugger.getInstance().log(source, 'CREATED', notificationDetails);

          // Track when notification is closed
          if (options?.requireInteraction !== true) {
            setTimeout(() => {
              console.log('🗑️ [NOTIFICATION DEBUGGER] Auto-closing notification:', title);
              NotificationDebugger.getInstance().log(source, 'CLOSED', {
                title,
                reason: 'auto-close'
              });
            }, 10000); // Log after 10 seconds
          }
        }

        close() {
          console.log('🗑️ [NOTIFICATION DEBUGGER] Notification.close() called for:', this.title);
          NotificationDebugger.getInstance().log('Notification.close()', 'CLOSED', {
            title: this.title
          });
          super.close();
        }

        onclick = (event: Event) => {
          console.log('🖱️ [NOTIFICATION DEBUGGER] Notification clicked:', this.title);
          NotificationDebugger.getInstance().log('Notification.onclick', 'CLICKED', {
            title: this.title
          });
          if ((this as any)._originalOnclick) {
            (this as any)._originalOnclick(event);
          }
        };
      };

      // Also track service worker notifications
      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        const originalShowNotification = ServiceWorkerRegistration.prototype.showNotification;

        ServiceWorkerRegistration.prototype.showNotification = function(title: string, options?: NotificationOptions) {
          console.log('🔔 [NOTIFICATION DEBUGGER] SERVICE WORKER NOTIFICATION:');
          console.log('   Title:', title);
          console.log('   Icon:', options?.icon || 'Default (Service Worker)');
          console.log('   From:', 'Service Worker');
          console.log('   Options:', options);
          console.log('   ------------------------------------------------');

          NotificationDebugger.getInstance().log('ServiceWorker', 'CREATED', {
            title,
            icon: options?.icon || 'ServiceWorker Default',
            badge: options?.badge,
            tag: options?.tag,
            body: options?.body,
            source: 'service-worker',
            timestamp: new Date().toISOString()
          });

          return originalShowNotification.call(this, title, options);
        };
      }
    }
  }
}

export const notificationDebugger = NotificationDebugger.getInstance();