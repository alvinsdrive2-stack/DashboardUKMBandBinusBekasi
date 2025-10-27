'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Code } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function TestMinimal() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  useEffect(() => {
    if (session) {
      addLog(`✅ Logged in: ${session.user.name}`);
      addLog(`🌐 Protocol: ${window.location.protocol}`);
      addLog(`🔒 Secure: ${window.isSecureContext}`);
      addLog(`🔍 User Agent: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}`);
    }
  }, [session]);

  const testMinimalVAPID = async () => {
    try {
      addLog('🚀 Starting MINIMAL VAPID test...');

      // Step 1: Permission
      addLog('📋 Requesting permission...');
      const permission = await Notification.requestPermission();
      addLog(`📋 Permission: ${permission}`);
      if (permission !== 'granted') {
        throw new Error('Permission denied');
      }

      // Step 2: Clear existing
      addLog('🧹 Clearing existing SWs...');
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
        addLog(`🗑️ Unregistered: ${reg.scope}`);
      }

      // Step 3: Register minimal SW
      addLog('📋 Registering minimal SW...');
      const registration = await navigator.serviceWorker.register('/sw-minimal.js');
      addLog(`✅ SW registered: ${registration.scope}`);

      // Step 4: Wait for ready
      addLog('⏳ Waiting for SW ready...');
      await navigator.serviceWorker.ready;
      addLog('✅ SW ready!');

      // Step 5: Clear subscription
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
        addLog('🗑️ Cleared existing subscription');
      }

      // Step 6: Use fresh VAPID key (Production 2025)
      const VAPID_KEY = 'BJ6NDq5YKRpCVy9j05QOl2v3ZVm2XQVJOYdlK1hCN2zadOEU5TQhgNvjF18VOGHO5mlEodxhlROY5oZv5pCq110';
      addLog(`🔑 Using VAPID key: ${VAPID_KEY.substring(0, 20)}...`);

      // Step 7: Subscribe
      addLog('📡 Subscribing to push...');
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
      });

      addLog('🎉 SUCCESS! VAPID subscription created!');
      setSubscription(pushSubscription);

      // Step 8: Show details
      const subData = pushSubscription.toJSON();
      addLog(`📋 Endpoint: ${subData.endpoint.substring(0, 50)}...`);
      addLog(`📋 Keys: p256dh=${subData.keys?.p256dh?.substring(0, 20)}...`);

    } catch (error) {
      addLog(`❌ ERROR: ${error.message}`);
      addLog(`🔍 Type: ${error.name}`);
      addLog(`🔍 Stack: ${error.stack?.substring(0, 100)}...`);
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🧪 Minimal VAPID Test</Heading>
          <Text color="gray.600">Ultra-simple VAPID subscription test</Text>
        </Box>

        {!session ? (
          <Box p={4} borderWidth={1} borderRadius="md">
            <Text>Please login first</Text>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            <Button onClick={testMinimalVAPID} colorScheme="blue" size="lg">
              🧪 Test Minimal VAPID
            </Button>

            {subscription && (
              <Box p={4} borderWidth={1} borderRadius="md" bg="green.50">
                <Heading size="md" mb={2}>✅ VAPID Subscription Active!</Heading>
                <Code fontSize="xs" p={2} borderRadius="md" overflowX="auto" maxH="200px">
                  {JSON.stringify(subscription.toJSON(), null, 2)}
                </Code>
              </Box>
            )}

            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📋 Logs</Heading>
              <Box
                bg="gray.900"
                color="green.400"
                p={3}
                borderRadius="md"
                fontFamily="monospace"
                fontSize="xs"
                height="300px"
                overflowY="auto"
              >
                {logs.length === 0 ? (
                  <Text color="gray.500">Click test button...</Text>
                ) : (
                  logs.map((log, index) => (
                    <Text key={index} mb={1}>{log}</Text>
                  ))
                )}
              </Box>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}