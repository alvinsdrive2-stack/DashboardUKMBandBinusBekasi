'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Alert,
  AlertIcon,
  Heading,
  Container,
  Card,
  CardBody,
  Stack
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function TestFCMNotifications() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any>(null);
  const [fcmSetup, setFcmSetup] = useState<any>(null);
  const [testData, setTestData] = useState({
    title: '🧪 FCM Admin Test',
    message: 'This is a test FCM Admin notification',
    type: 'TEST_NOTIFICATION'
  });
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Log on component mount
  useEffect(() => {
    console.log("🔧 [TestFCMNotifications] Component mounted");
    console.log("🔧 [TestFCMNotifications] Checking notification hooks...");

    // Check if notification hooks are available
    if (typeof window !== 'undefined') {
      console.log("🔧 [TestFCMNotifications] Window detected");

      // Test if we can create a notification
      if ('Notification' in window) {
        console.log("🔧 [TestFCMNotifications] Notification API available");
        console.log("🔧 [TestFCMNotifications] Permission:", Notification.permission);
      } else {
        console.log("❌ [TestFCMNotifications] Notification API NOT available");
      }

      // Check service worker
      if ('serviceWorker' in navigator) {
        console.log("🔧 [TestFCMNotifications] ServiceWorker API available");
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log("🔧 [TestFCMNotifications] ServiceWorkers registered:", registrations.length);
          registrations.forEach((reg, index) => {
            console.log(`  ${index + 1}. Scope: ${reg.scope}, Active: ${reg.active !== null}`);
          });
        });
      } else {
        console.log("❌ [TestFCMNotifications] ServiceWorker API NOT available");
      }
    }
  }, []);

  // Get user's subscriptions
  useEffect(() => {
    if (session?.user?.id) {
      getUserSubscriptions();
    }
  }, [session?.user?.id]); // More specific dependency

  // Auto-refresh every 5 seconds for better sync
  useEffect(() => {
    if (session?.user?.id) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing FCM subscriptions...');
        getUserSubscriptions();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const getUserSubscriptions = async () => {
    try {
      console.log('🔍 Getting subscriptions for user:', session?.user?.id);
      const response = await fetch(`/api/notifications/test-fcm?userId=${session?.user?.id}`);
      const data = await response.json();

      console.log('📊 Subscriptions response:', data);

      if (data.success) {
        setSubscriptions(data);
        setFcmSetup(data.fcmSetup);
        console.log('✅ Subscriptions loaded:', data.totalDevices, 'devices');
      } else {
        console.error('❌ Failed to get subscriptions:', data);
        setError(data.error || 'Failed to get user subscriptions');
      }
    } catch (error) {
      console.error('❌ Error fetching subscriptions:', error);
      setError('Error fetching subscriptions');
    }
  };

  // Send test FCM notification
  const sendTestFCM = async () => {
    if (!session?.user?.id) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/notifications/test-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          ...testData
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to send test notification');
      }
    } catch (error) {
      setError('Error sending test notification');
    } finally {
      setLoading(false);
    }
  };

  // Send debug FCM notification with detailed logging
  const sendDebugFCM = async () => {
    if (!session?.user?.id) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Starting DEBUG FCM Send Test...');

      const response = await fetch('/api/debug/fcm-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          title: testData.title,
          message: testData.message,
          type: testData.type,
          actionUrl: '/dashboard/member'
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          ...data,
          type: 'debug-success',
          debug: data.debug
        });
      } else {
        setError(data.error || 'Debug FCM test failed');
        setResult({
          ...data,
          type: 'debug-error',
          debug: data.debug
        });
      }
    } catch (error) {
      setError('Error running debug FCM test');
      console.error('Debug FCM test error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup invalid FCM tokens
  const cleanupFCMTokens = async () => {
    if (!session?.user?.id) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/cleanup-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          action: 'cleanup-invalid'
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          message: data.message,
          deactivated: data.deactivated,
          type: 'cleanup'
        });
        await getUserSubscriptions(); // Refresh list
      } else {
        setError(data.error || 'Failed to cleanup tokens');
      }
    } catch (error) {
      setError('Error cleaning up tokens');
    } finally {
      setLoading(false);
    }
  };

  // Refresh FCM token (get new token)
  const refreshFCMToken = async () => {
    if (!session?.user?.id) {
      setError('Please login first');
      return;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      console.log('🔄 Refreshing FCM token...');

      // Deactivate existing tokens first
      const cleanupResponse = await fetch('/api/notifications/cleanup-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          action: 'cleanup-all'
        })
      });

      if (cleanupResponse.ok) {
        console.log('🗑️ Cleared existing tokens');
      }

      // Get new FCM token
      const { requestForToken } = await import('@/firebase/client');
      const token = await requestForToken();

      if (!token) {
        throw new Error('Failed to get new FCM token - permission may be denied');
      }

      console.log('✅ New FCM Token obtained:', token.substring(0, 50) + '...');

      // Save new FCM token to server
      const response = await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          fcmToken: token,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString(),
            source: 'test-fcm-notifications-page-refresh'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save new FCM token to server');
      }

      const data = await response.json();
      console.log('✅ New FCM subscription successful:', data);

      setResult({
        message: 'Successfully refreshed FCM token and subscription!',
        token: token.substring(0, 50) + '...',
        subscriptionId: data.subscriptionId,
        type: 'token-refresh'
      });

      // Refresh subscriptions list
      await getUserSubscriptions();

    } catch (error) {
      console.error('❌ FCM token refresh failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh FCM token');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Deactivate all FCM tokens
  const deactivateAllTokens = async () => {
    if (!session?.user?.id) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/cleanup-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          action: 'cleanup-all'
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          message: data.message,
          deactivated: data.deactivated,
          type: 'deactivate-all'
        });
        await getUserSubscriptions(); // Refresh list
      } else {
        setError(data.error || 'Failed to deactivate tokens');
      }
    } catch (error) {
      setError('Error deactivating tokens');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup all service workers
  const cleanupServiceWorkers = async () => {
    console.log('🧹 Cleaning up all service workers...');

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📋 Found ${registrations.length} service worker registrations`);

      for (const reg of registrations) {
        console.log(`🗑️ Unregistering: ${reg.scope} (${reg.active?.scriptURL || 'No script'})`);
        await reg.unregister();
      }

      console.log('✅ All service workers unregistered');
      console.log('🔄 Refresh the page to re-register Firebase service worker only');

      setResult({
        message: 'All service workers cleaned up! Please refresh the page.',
        cleaned: registrations.length,
        type: 'cleanup',
        timestamp: new Date().toISOString()
      });
    } else {
      setError('Service Worker API not available');
    }
  };

  // Debug notification system
  const debugNotifications = async () => {
    console.log('🕵️ Starting notification system debug...');

    // Get detailed service worker info
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('📋 Service Worker Analysis:');
      console.log('   Total registrations:', registrations.length);

      registrations.forEach((reg, index) => {
        console.log(`   ${index + 1}. Active: ${reg.active !== null}`);
        console.log(`      Scope: ${reg.scope}`);
        console.log(`      Script: ${reg.active?.scriptURL || 'N/A'}`);
        console.log(`      State: ${reg.active?.state || 'N/A'}`);
        console.log('');
      });

      // Count firebase service workers
      const firebaseSWs = registrations.filter(reg =>
        reg.active?.scriptURL?.includes('firebase-messaging-sw.js')
      );
      console.log(`🔥 Firebase Service Workers found: ${firebaseSWs.length}`);

      if (firebaseSWs.length > 1) {
        console.log('🚨 DUPLICATE SERVICE WORKERS DETECTED!');
        console.log('   This explains why you get 2 notifications!');
        console.log('   Each service worker receives the same FCM message');
        console.log('   And each creates its own notification');
      }
    }

    console.log('📋 Expected notification flow:');
    console.log('   1. FCM sent from server');
    console.log('   2. [SERVICE WORKER] Receives FCM message');
    console.log('   3. [SERVICE WORKER] Creates notification');
    console.log('   4. [useFCM.ts] Receives foreground message (logging only)');
    console.log('   5. [lib/firebase.ts] Receives message (disabled)');
    console.log('');
    console.log('🔍 Watch for these logs:');
    console.log('   📨 [SERVICE WORKER] Received background message');
    console.log('   🕵️ [SERVICE WORKER] Creating notification from FCM');
    console.log('   🔔 [SERVICE WORKER] Showing notification with:');
    console.log('   ✅ [SERVICE WORKER] Notification created successfully');
    console.log('   📱 [useFCM.ts] Foreground message received');
    console.log('   📱 [lib/firebase.ts] FCM Foreground message received');
    console.log('');
    console.log('🚨 DUPLICATE NOTIFICATION INDICATORS:');
    console.log('   🔔 Multiple notifications appearing');
    console.log('   🔔 One with icon, one without icon');
    console.log('   🔔 Different notification titles');
    console.log('   🔥 Multiple [SERVICE WORKER] notifications created');
    console.log('');
    console.log('💡 SOLUTION: Fix service worker registration to have only 1 active');

    setResult({
      message: 'Service Worker analysis complete! Check console above.',
      analysis: {
        totalRegistrations: registrations?.length || 0,
        firebaseWorkers: firebaseSWs.length,
        hasDuplicates: firebaseSWs.length > 1,
        rootCause: firebaseSWs.length > 1 ? 'Multiple service workers receiving same FCM message' : 'Single service worker'
      },
      instructions: [
        '1. Keep browser console (F12) open',
        '2. Click "🧪 DEBUG: Detailed FCM Test" below',
        '3. Watch console for SERVICE WORKER logs',
        '4. If multiple notifications appear, service worker cleanup is needed'
      ],
      type: 'debug-info',
      timestamp: new Date().toISOString()
    });
  };

  // Manual FCM subscription
  const subscribeToFCM = async () => {
    if (!session?.user?.id) {
      setError('Please login first');
      return;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      console.log('🔥 Requesting FCM token...');

      // Request FCM token
      const { requestForToken } = await import('@/firebase/client');
      const token = await requestForToken();

      if (!token) {
        throw new Error('Failed to get FCM token - permission may be denied');
      }

      console.log('✅ FCM Token obtained:', token.substring(0, 50) + '...');

      // Save FCM token to server
      const response = await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          fcmToken: token,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString(),
            source: 'test-fcm-notifications-page'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save FCM token to server');
      }

      const data = await response.json();
      console.log('✅ FCM subscription successful:', data);

      setResult({
        message: 'Successfully subscribed to FCM notifications!',
        token: token.substring(0, 50) + '...',
        subscriptionId: data.subscriptionId,
        type: 'subscription'
      });

      // Refresh subscriptions list
      await getUserSubscriptions();

    } catch (error) {
      console.error('❌ FCM subscription failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to subscribe to FCM notifications');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Helper function to safely access nested properties
const safeGet = (obj: any, path: string, defaultValue: any = null) => {
  return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
};

return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading>📱 FCM Admin Notification Test</Heading>
          <Text color="gray.600" mt={2}>
            Test server-side FCM notifications using Firebase Admin SDK
          </Text>
        </Box>

        {/* User Info */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="bold">User Status:</Text>
                <Badge colorScheme={session ? 'green' : 'red'}>
                  {session ? 'Logged In' : 'Not Logged In'}
                </Badge>
              </HStack>

              {session && (
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    User ID: {session.user.id}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    User Name: {session.user.name}
                  </Text>
                </Box>
              )}

              <HStack spacing={3}>
                <Button
                  colorScheme="blue"
                  onClick={getUserSubscriptions}
                  isDisabled={!session}
                >
                  🔄 Refresh Subscriptions
                </Button>

                <Button
                  colorScheme="cyan"
                  onClick={debugNotifications}
                  isDisabled={!session}
                  variant="outline"
                >
                  🕵️ Debug Notifications
                </Button>

                <Button
                  colorScheme="green"
                  onClick={subscribeToFCM}
                  isLoading={isSubscribing}
                  isDisabled={!session}
                >
                  🔔 Subscribe to FCM
                </Button>

                <Button
                  colorScheme="purple"
                  onClick={refreshFCMToken}
                  isLoading={isSubscribing}
                  isDisabled={!session}
                >
                  🔄 Refresh Token
                </Button>

                <Button
                  colorScheme="orange"
                  onClick={cleanupFCMTokens}
                  isDisabled={!session}
                >
                  🗑️ Cleanup Invalid Tokens
                </Button>

                <Button
                  colorScheme="red"
                  onClick={deactivateAllTokens}
                  isDisabled={!session}
                >
                  ❌ Deactivate All
                </Button>

                <Button
                  colorScheme="yellow"
                  onClick={cleanupServiceWorkers}
                  isDisabled={!session}
                  variant="outline"
                >
                  🧹 Cleanup SWs
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* FCM Setup Status */}
        {fcmSetup && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">🔥 FCM Admin Setup</Heading>

                <HStack justify="space-between">
                  <Text fontWeight="bold">Initialized:</Text>
                  <Badge colorScheme={fcmSetup.initialized ? 'green' : 'red'}>
                    {fcmSetup.initialized ? '✅ Yes' : '❌ No'}
                  </Badge>
                </HStack>

                {fcmSetup.projectId && (
                  <Text fontSize="sm" color="gray.600">
                    Project: {fcmSetup.projectId}
                  </Text>
                )}

                {fcmSetup.serviceAccountEmail && (
                  <Text fontSize="sm" color="gray.600">
                    Service Account: {fcmSetup.serviceAccountEmail}
                  </Text>
                )}

                {fcmSetup.error && (
                  <Alert status="error">
                    <AlertIcon />
                    Error: {fcmSetup.error}
                  </Alert>
                )}

                {!fcmSetup.initialized && (
                  <Alert status="warning">
                    <AlertIcon />
                    Firebase Admin not initialized. Check service account setup.
                  </Alert>
                )}

                {fcmSetup.serviceAccountStatus && (
                  <VStack spacing={2} align="stretch" p={3} bg="gray.50" borderRadius="md">
                    <Text fontWeight="bold" fontSize="sm">Service Account Status:</Text>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Method:</Text>
                      <Badge colorScheme={fcmSetup.method === 'JSON File' ? 'green' : 'yellow'}>
                        {fcmSetup.method}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Service Account File:</Text>
                      <Badge colorScheme={fcmSetup.serviceAccountStatus.hasServiceAccountFile ? 'green' : 'red'}>
                        {fcmSetup.serviceAccountStatus.hasServiceAccountFile ? '✅ Found' : '❌ Not Found'}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Project ID:</Text>
                      <Badge colorScheme={fcmSetup.serviceAccountStatus.projectId ? 'green' : 'red'}>
                        {fcmSetup.serviceAccountStatus.projectId ? '✅ Valid' : '❌ Missing'}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Client Email:</Text>
                      <Badge colorScheme={fcmSetup.serviceAccountStatus.clientEmail ? 'green' : 'red'}>
                        {fcmSetup.serviceAccountStatus.clientEmail ? '✅ Valid' : '❌ Missing'}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Private Key:</Text>
                      <Badge colorScheme={fcmSetup.serviceAccountStatus.privateKey ? 'green' : 'red'}>
                        {fcmSetup.serviceAccountStatus.privateKey ? '✅ Valid' : '❌ Missing'}
                      </Badge>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Subscriptions Info */}
        {subscriptions && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Active FCM Devices:</Text>
                  <Badge colorScheme="green">
                    {safeGet(subscriptions, 'totalDevices', 0)} devices
                  </Badge>
                </HStack>

                <VStack spacing={2} align="stretch">
                  {(safeGet(subscriptions, 'subscriptions', [])).map((sub: any, index: number) => (
                    <Box key={sub.id || index} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                      <Text fontSize="sm" fontWeight="bold">Device {index + 1}</Text>
                      <Text fontSize="xs" color="gray.600">
                        Token: {sub.token ? sub.token.substring(0, 20) + '...' : 'No token'}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Created: {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'Unknown'}
                      </Text>
                      <Badge colorScheme={sub.isActive ? 'green' : 'red'} size="sm">
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Test Form */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">FCM Admin Test</Heading>

              <Input
                value={testData.title}
                onChange={(e) => setTestData({...testData, title: e.target.value})}
                placeholder="Notification title"
              />

              <Textarea
                value={testData.message}
                onChange={(e) => setTestData({...testData, message: e.target.value})}
                placeholder="Notification message"
                rows={3}
              />

              <Input
                value={testData.type}
                onChange={(e) => setTestData({...testData, type: e.target.value})}
                placeholder="Notification type"
              />

              <VStack spacing={2}>
                <Button
                  colorScheme="green"
                  onClick={sendTestFCM}
                  isLoading={loading}
                  isDisabled={!session || safeGet(subscriptions, 'totalDevices', 0) === 0}
                >
                  🚀 Send FCM Admin Test
                </Button>

                <Button
                  colorScheme="purple"
                  onClick={sendDebugFCM}
                  isLoading={loading}
                  isDisabled={!session || safeGet(subscriptions, 'totalDevices', 0) === 0}
                  variant="outline"
                >
                  🧪 DEBUG: Detailed FCM Test
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Result */}
        {result && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {result.type === 'cleanup' ? (
                  <>
                    <Heading size="md" color="orange.600">🗑️ FCM Tokens Cleaned Up!</Heading>
                    <Box p={4} bg="orange.50" border="1px" borderColor="orange.200" borderRadius="md">
                      <Text><strong>{result.message}</strong></Text>
                    </Box>
                    <Alert status="info">
                      <AlertIcon />
                      Now refresh the page to get new FCM tokens, then test notifications again.
                    </Alert>
                  </>
                ) : result.type === 'deactivate-all' ? (
                  <>
                    <Heading size="md" color="red.600">❌ All FCM Tokens Deactivated!</Heading>
                    <Box p={4} bg="red.50" border="1px" borderColor="red.200" borderRadius="md">
                      <Text><strong>{result.message}</strong></Text>
                    </Box>
                    <Alert status="warning">
                      <AlertIcon />
                      Refresh the page to get new FCM tokens, then test notifications again.
                    </Alert>
                  </>
                ) : result.type === 'token-refresh' ? (
                  <>
                    <Heading size="md" color="purple.600">🔄 FCM Token Refreshed!</Heading>

                    <Box p={4} bg="purple.50" border="1px" borderColor="purple.200" borderRadius="md">
                      <VStack spacing={2} align="stretch">
                        <Text><strong>Status:</strong> {result.message}</Text>
                        <Text><strong>New Token:</strong> {result.token}</Text>
                        <Text><strong>Subscription ID:</strong> {result.subscriptionId}</Text>
                      </VStack>
                    </Box>

                    <Alert status="success">
                      <AlertIcon />
                      Old tokens cleared and new FCM token generated successfully! You can now test sending notifications.
                    </Alert>
                  </>
                ) : result.type === 'subscription' ? (
                  <>
                    <Heading size="md" color="green.600">🔔 FCM Subscription Successful!</Heading>

                    <Box p={4} bg="green.50" border="1px" borderColor="green.200" borderRadius="md">
                      <VStack spacing={2} align="stretch">
                        <Text><strong>Status:</strong> {result.message}</Text>
                        <Text><strong>Token:</strong> {result.token}</Text>
                        <Text><strong>Subscription ID:</strong> {result.subscriptionId}</Text>
                      </VStack>
                    </Box>

                    <Alert status="success">
                      <AlertIcon />
                      Your device is now subscribed to FCM notifications! You can test sending notifications.
                    </Alert>
                  </>
                ) : (
                  <>
                    <Heading size="md" color="green.600">✅ FCM Admin Notification Sent!</Heading>

                    <Box p={4} bg="green.50" border="1px" borderColor="green.200" borderRadius="md">
                      <VStack spacing={2} align="stretch">
                        <Text><strong>Success:</strong> {result.result?.sent || 0} devices</Text>
                        <Text><strong>Failed:</strong> {result.result?.failed || 0} devices</Text>
                        <Text><strong>Total Devices:</strong> {result.result?.total || 0}</Text>
                      </VStack>
                    </Box>

                    <Alert status="info">
                      <AlertIcon />
                      Check your device notification center. If you don't see the notification, make sure:
                      <br />• FCM is properly configured
                      <br />• Device has active FCM token
                      <br />• Firebase service worker is registered
                    </Alert>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Cleanup Results */}
        {result && result.type === 'cleanup' && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="yellow.600">🧹 Service Workers Cleaned Up</Heading>

                <Box p={4} bg="yellow.50" border="1px" borderColor="yellow.200" borderRadius="md">
                  <VStack spacing={2} align="stretch">
                    <Text><strong>Status:</strong> {result.message}</Text>
                    <Text><strong>Cleaned:</strong> {result.cleaned} service workers</Text>
                    <Text><strong>Timestamp:</strong> {result.timestamp}</Text>
                  </VStack>
                </Box>

                <Alert status="warning">
                  <AlertIcon />
                  <Text fontWeight="bold">Next Steps:</Text>
                  <VStack spacing={1} align="start" mt={2}>
                    <Text fontSize="sm">1. Refresh the page (F5)</Text>
                    <Text fontSize="sm">2. Check Application → Service Workers tab</Text>
                    <Text fontSize="sm">3. Should only show 1 Firebase service worker</Text>
                    <Text fontSize="sm">4. Test FCM notifications again</Text>
                  </VStack>
                </Alert>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Debug Info Results */}
        {result && result.type === 'debug-info' && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="cyan.600">🕵️ Notification Debugger Active</Heading>

                <Box p={4} bg="cyan.50" border="1px" borderColor="cyan.200" borderRadius="md">
                  <VStack spacing={2} align="stretch">
                    <Text><strong>Status:</strong> {result.message}</Text>
                    <Text><strong>Timestamp:</strong> {result.timestamp}</Text>
                  </VStack>
                </Box>

                {result.instructions && (
                  <Alert status="info">
                    <AlertIcon />
                    <Text fontWeight="bold">Next Steps:</Text>
                    <VStack spacing={1} align="start" mt={2}>
                      {result.instructions.map((instruction: string, index: number) => (
                        <Text key={index} fontSize="sm">{instruction}</Text>
                      ))}
                    </VStack>
                  </Alert>
                )}

                {result.analysis && (
                  <Alert status={result.analysis.hasDuplicates ? "error" : "success"}>
                    <AlertIcon />
                    <Text fontWeight="bold">Service Worker Analysis:</Text>
                    <VStack spacing={1} align="start" mt={2}>
                      <Text fontSize="sm">
                        Total Registrations: {result.analysis.totalRegistrations}
                      </Text>
                      <Text fontSize="sm">
                        Firebase Workers: {result.analysis.firebaseWorkers}
                      </Text>
                      <Text fontSize="sm">
                        Status: {result.analysis.hasDuplicates ? '❌ DUPLICATES DETECTED' : '✅ SINGLE WORKER'}
                      </Text>
                      <Text fontSize="sm">
                        Root Cause: {result.analysis.rootCause}
                      </Text>
                    </VStack>
                  </Alert>
                )}

                <Alert status="warning">
                  <AlertIcon />
                  <Text fontWeight="bold">🔍 What to Look For:</Text>
                  <VStack spacing={1} align="start" mt={2}>
                    <Text fontSize="sm">📨 [SERVICE WORKER] Received background message</Text>
                    <Text fontSize="sm">🕵️ [SERVICE WORKER] Creating notification from FCM</Text>
                    <Text fontSize="sm">🔔 [SERVICE WORKER] Showing notification with:</Text>
                    <Text fontSize="sm">✅ [SERVICE WORKER] Notification created successfully</Text>
                    <Text fontSize="sm">📱 [useFCM.ts] Foreground message received</Text>
                    <Text fontSize="sm">📱 [lib/firebase.ts] FCM Foreground message received</Text>
                  </VStack>
                </Alert>

                <Alert status="error">
                  <AlertIcon />
                  <Text fontWeight="bold">🚨 Duplicate Notification Indicators:</Text>
                  <VStack spacing={1} align="start" mt={2}>
                    <Text fontSize="sm">🔔 Multiple notifications appearing</Text>
                    <Text fontSize="sm">🔔 One with icon, one without icon</Text>
                    <Text fontSize="sm">🔔 Different notification titles</Text>
                    <Text fontSize="sm">🔔 [filename.tsx] CREATED logs in console</Text>
                  </VStack>
                </Alert>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Debug Results */}
        {result && (result.type === 'debug-success' || result.type === 'debug-error') && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color={result.type === 'debug-success' ? 'green.600' : 'red.600'}>
                  🧪 Debug FCM Test Results
                </Heading>

                {/* Debug Info */}
                {result.debug && (
                  <Box p={4} bg="gray.50" border="1px" borderColor="gray.200" borderRadius="md">
                    <VStack spacing={3} align="stretch">
                      <Text fontWeight="bold">🔍 Debug Information:</Text>

                      <Box>
                        <Text fontSize="sm" fontWeight="semibold">Step Status:</Text>
                        <Text fontSize="sm" color="gray.600">{result.debug.step}</Text>
                      </Box>

                      <Box>
                        <Text fontSize="sm" fontWeight="semibold">Timestamp:</Text>
                        <Text fontSize="sm" color="gray.600">{result.debug.timestamp}</Text>
                      </Box>

                      {result.debug.fcmSetup && (
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold">Firebase Admin Setup:</Text>
                          <VStack spacing={1} align="start" pl={4}>
                            <Text fontSize="sm">• Initialized: {result.debug.fcmSetup.initialized ? '✅ Yes' : '❌ No'}</Text>
                            <Text fontSize="sm">• Project ID: {result.debug.fcmSetup.projectId || '❌ Missing'}</Text>
                            <Text fontSize="sm">• Method: {result.debug.fcmSetup.method || '❌ Unknown'}</Text>
                            <Text fontSize="sm">• Service Account: {result.debug.fcmSetup.serviceAccountEmail || '❌ Missing'}</Text>
                          </VStack>
                        </Box>
                      )}

                      {result.debug.tokenError && (
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold" color="red.600">Token Validation Error:</Text>
                          <VStack spacing={1} align="start" pl={4}>
                            <Text fontSize="sm">• Error Code: {result.debug.tokenError.code}</Text>
                            <Text fontSize="sm">• Error Message: {result.debug.tokenError.message}</Text>
                            {result.debug.tokenError.errorInfo && (
                              <Text fontSize="sm">• Details: {JSON.stringify(result.debug.tokenError.errorInfo)}</Text>
                            )}
                          </VStack>
                        </Box>
                      )}

                      {result.debug.subscriptionsFound !== undefined && (
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold">Subscriptions Found:</Text>
                          <Text fontSize="sm" color="gray.600">{result.debug.subscriptionsFound} active device(s)</Text>
                        </Box>
                      )}

                      {result.debug.tokenValidation && (
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold">Token Validation:</Text>
                          <Text fontSize="sm" color={result.debug.tokenValidation === 'PASSED' ? 'green.600' : 'red.600'}>
                            {result.debug.tokenValidation === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Test Results */}
                {result.result && (
                  <Box p={4} bg={result.type === 'debug-success' ? 'green.50' : 'red.50'}
                       border="1px" borderColor={result.type === 'debug-success' ? 'green.200' : 'red.200'}
                       borderRadius="md">
                    <VStack spacing={2} align="stretch">
                      <Text><strong>Success:</strong> {result.result?.sent || 0} devices</Text>
                      <Text><strong>Failed:</strong> {result.result?.failed || 0} devices</Text>
                      <Text><strong>Total Devices:</strong> {result.result?.total || 0}</Text>

                      {result.result?.results && result.result.results.length > 0 && (
                        <Box>
                          <Text fontWeight="semibold" mt={2}>Device Details:</Text>
                          {result.result.results.map((device: any, index: number) => (
                            <Box key={index} pl={4} mt={1}>
                              <Text fontSize="sm">
                                • Device {index + 1}: {device.status || 'Unknown'}
                              </Text>
                              {device.error && (
                                <Text fontSize="sm" color="red.600" pl={4}>
                                  Error: {device.error}
                                </Text>
                              )}
                              {device.code && (
                                <Text fontSize="sm" color="red.600" pl={4}>
                                  Code: {device.code}
                                </Text>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Troubleshooting Guide */}
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">🛠️ Troubleshooting Steps:</Text>
                    <VStack spacing={1} align="start" mt={2}>
                      <Text fontSize="sm">1. Check browser console (F12) for detailed error logs</Text>
                      <Text fontSize="sm">2. Verify Firebase Admin setup is initialized</Text>
                      <Text fontSize="sm">3. Ensure FCM token is valid (check token validation)</Text>
                      <Text fontSize="sm">4. Try refreshing FCM token with "🔄 Refresh Token" button</Text>
                      <Text fontSize="sm">5. Check notification permissions in browser settings</Text>
                    </VStack>
                  </Box>
                </Alert>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
      </VStack>
    </Container>
  );
}