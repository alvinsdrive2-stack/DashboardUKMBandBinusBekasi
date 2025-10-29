'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Spinner, Text, Image } from '@chakra-ui/react';
import Footer from '@/components/Footer';
import { notificationDebugger } from '@/lib/notificationDebugger';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Initialize notification debugger
    if (typeof window !== 'undefined') {
      notificationDebugger.trackNotifications();
      console.log('🕵️ Notification Debugger initialized - tracking all notifications');
    }
  }, []);
useEffect(() => {
  if (!isClient) return;

  // 🔔 Service Worker registration handled by firebase.ts to prevent duplicates
  // Firebase service worker will be registered automatically when needed

  // 🔥 Ambil FCM token dari browser (dynamic import) - hanya jika user sudah login
  if (status === 'authenticated' && session?.user?.id) {
    import("@/firebase/client").then(({ requestForToken }) => {
      requestForToken()
        .then(async (token) => {
          if (token) {
            console.log("🔥 FCM Token obtained:", token);

            // Simpan FCM token ke server
            try {
              const response = await fetch('/api/fcm/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: session.user.id,
                  fcmToken: token,
                  deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    timestamp: new Date().toISOString()
                  }
                })
              });

              if (response.ok) {
                console.log("✅ FCM token saved to server");
              } else {
                console.error("❌ Failed to save FCM token:", await response.text());
              }
            } catch (error) {
              console.error("❌ Error saving FCM token:", error);
            }
          } else {
            console.log("⚠️ No FCM token obtained (permission denied or not supported)");
          }
        })
        .catch((err) => console.error("❌ Error getting FCM token:", err));
    }).catch((err) => console.error("❌ Error importing Firebase client:", err));
  }
}, [isClient, status, session?.user?.id]);
  useEffect(() => {
    if (!isClient || status === 'loading') return;

    if (status === 'authenticated') {
      // If logged in, redirect to appropriate dashboard
      if (session?.user?.organizationLvl === 'COMMISSIONER' || session?.user?.organizationLvl === 'PENGURUS') {
        router.replace('/dashboard/manager');
      } else {
        router.replace('/dashboard/member');
      }
    } else {
      // If not logged in, redirect to signin
      router.replace('/auth/signin');
    }
  }, [status, session, router, isClient]);

  // Only render loading state on client side
  if (!isClient) {
    return null;
  }

  // Theme colors yang sama dengan dashboard member
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const accentColor = '#dc2626';

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      justifyContent="center"
      alignItems="center"
      bg={bgMain}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap="6"
        flex="1"
        justifyContent="center"
      >
        {/* Logo/Favicon */}
        <Image
          src="/icons/favicon.png"
          alt="UKM Band Bekasi"
          boxSize="80px"
          objectFit="contain"
        />

        {/* Loading content */}
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap="4"
        >
          <Spinner size="xl" color={accentColor} />
          <Text fontSize="lg" color={textPrimary} fontWeight="500">
            Loading...
          </Text>
          <Text fontSize="sm" color={textSecondary}>
            Redirecting to your dashboard
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
