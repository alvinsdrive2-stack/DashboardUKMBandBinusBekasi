# UKM Band Dashboard - PWA Push Notification System

## Overview
PWA (Progressive Web App) push notification system untuk memberikan notifikasi di perangkat mobile (Android/iOS) bahkan saat aplikasi tertutup.

## PWA Requirements

### 1. Service Worker
- Background processing untuk notifikasi
- Cache management untuk offline functionality
- Push event handling

### 2. Web App Manifest
- PWA configuration untuk installability
- Icons, splash screens, theme colors
- Start URL dan display mode

### 3. Push API Integration
- Subscribe user ke push service
- Handle push subscription
- Send push notifications dari backend

## Implementation Steps

### Step 1: Web App Manifest

#### Buat file `public/manifest.json`
```json
{
  "name": "UKM Band Bekasi Dashboard",
  "short_name": "UKM Band",
  "description": "Dashboard manajemen event UKM Band Bekasi",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Step 2: Service Worker

#### Buat file `public/sw.js`
```javascript
const CACHE_NAME = 'ukm-band-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from UKM Band',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('UKM Band Dashboard', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
```

### Step 3: Push Service Integration

#### Frontend Push Subscription
```tsx
// hooks/usePushNotification.ts
export const usePushNotification = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Subscribe to push service
        const pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        setSubscription(pushSubscription);

        // Send subscription to backend
        await saveSubscriptionToBackend(pushSubscription);
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
      await removeSubscriptionFromBackend();
    }
  };

  return {
    subscription,
    permission,
    subscribeToPush,
    unsubscribeFromPush,
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window
  };
};
```

### Step 4: Backend Push Service

#### VAPID Keys Setup
```bash
# Generate VAPID keys
npm install web-push -g
web-push generate-vapid-keys
```

#### Environment Variables
```env
# .env.local
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=your-email@example.com
```

#### Push Service Backend
```typescript
// services/PushService.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export class PushService {
  async sendPushNotification(
    subscription: PushSubscription,
    payload: {
      title: string;
      body: string;
      icon?: string;
      data?: any;
    }
  ) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async sendNotificationToUser(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ) {
    // Get user's push subscriptions from database
    const subscriptions = await this.getUserSubscriptions(userId);

    const promises = subscriptions.map(subscription =>
      this.sendPushNotification(subscription, {
        title: notification.title,
        body: notification.body,
        icon: '/icons/icon-192x192.png',
        data: notification.data
      })
    );

    await Promise.allSettled(promises);
  }

  private async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    // Fetch from database
    // Implementation depends on your database schema
    return [];
  }
}
```

### Step 5: Database Schema for Push Subscriptions

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  userAgent String?

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### Step 6: API Endpoints for Push

```typescript
// app/api/push/subscribe/route.ts
export async function POST(request: Request) {
  const { subscription } = await request.json();
  const userId = await getCurrentUserId(); // Your auth logic

  await prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: request.headers.get('user-agent')
    }
  });

  return Response.json({ success: true });
}

// app/api/push/unsubscribe/route.ts
export async function POST(request: Request) {
  const { endpoint } = await request.json();
  const userId = await getCurrentUserId();

  await prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint
    }
  });

  return Response.json({ success: true });
}
```

## PWA Installation Prompt

### Installation Component
```tsx
// components/PWAInstallPrompt.tsx
export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  if (!showInstallButton) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
    >
      Install UKM Band App
    </button>
  );
};
```

## Notification Integration

### Triggers for Push Notifications
```typescript
// services/NotificationTriggerService.ts
export class NotificationTriggerService {
  constructor(private pushService: PushService) {}

  async triggerEventReminder(event: Event) {
    const personnel = await this.getEventPersonnel(event.id);

    for (const person of personnel) {
      await this.pushService.sendNotificationToUser(person.userId, {
        title: 'Event Reminder',
        body: `Event "${event.title}" akan dimulai besok!`,
        data: {
          type: 'EVENT_REMINDER',
          eventId: event.id,
          url: `/events/${event.id}`
        }
      });
    }
  }

  async triggerPersonnelAssignment(personnel: EventPersonnel) {
    await this.pushService.sendNotificationToUser(personnel.userId, {
      title: 'Assignment Confirmation',
      body: `Kamu mendaftar sebagai ${personnel.role} untuk event`,
      data: {
        type: 'PERSONNEL_ASSIGNED',
        eventId: personnel.eventId,
        url: `/events/${personnel.eventId}`
      }
    });
  }
}
```

## Testing PWA Notifications

### Local Testing
```bash
# Start development server
npm run dev

# Test with Chrome DevTools
# 1. Open Chrome DevTools
# 2. Go to Application tab
# 3. Check Service Workers and Manifest
# 4. Test Push notifications in Network tab
```

### Production Testing
```bash
# Deploy to Vercel/Netlify
# Test on actual mobile device
# Verify PWA installation works
# Test push notifications in background
```

## File Structure
```
public/
├── manifest.json
├── sw.js
└── icons/
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png

src/
├── components/
│   ├── PWAInstallPrompt.tsx
│   └── PushNotificationToggle.tsx
├── hooks/
│   └── usePushNotification.ts
├── services/
│   ├── PushService.ts
│   └── NotificationTriggerService.ts
└── app/api/push/
    ├── subscribe/route.ts
    └── unsubscribe/route.ts
```

## Security Considerations

1. **VAPID Authentication** - Secure push service authentication
2. **Subscription Validation** - Verify subscription ownership
3. **Rate Limiting** - Prevent spam notifications
4. **Permission Management** - Respect user notification preferences

## Browser Compatibility

- ✅ Chrome (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (Limited support)
- ❌ iOS Safari (No push notifications)
- ✅ Edge (Chromium-based)