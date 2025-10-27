'use client';

import { useState, useEffect } from 'react';
import { Box, VStack, Text, Heading, Code, Alert, AlertIcon, Button, Divider } from '@chakra-ui/react';

export default function DebugPush() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    collectDebugInfo();
  }, []);

  const collectDebugInfo = async () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      pushManagerSupport: 'PushManager' in window,
      notificationSupport: 'Notification' in window,
      notificationPermission: Notification.permission,
      isSecureContext: window.isSecureContext,
      location: window.location.href,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
    };

    // Check service worker
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        info.serviceWorkerRegistrations = registrations.length;
        info.serviceWorkers = registrations.map(reg => ({
          scope: reg.scope,
          state: reg.active?.state,
          installing: reg.installing?.state,
          waiting: reg.waiting?.state
        }));
      } catch (error) {
        info.serviceWorkerError = error.message;
      }
    }

    // Check push manager
    if ('PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        info.hasExistingSubscription = !!subscription;
        if (subscription) {
          info.subscriptionKeys = Object.keys(subscription.toJSON() || {});
        }
      } catch (error) {
        info.pushManagerError = error.message;
      }
    }

    setDebugInfo(info);

    // Add logs
    addLog(`🌐 Browser: ${info.userAgent}`);
    addLog(`🔒 Secure Context: ${info.isSecureContext}`);
    addLog(`📱 Protocol: ${info.protocol}`);
    addLog(`👮 Service Worker Support: ${info.serviceWorkerSupport}`);
    addLog(`📡 Push Manager Support: ${info.pushManagerSupport}`);
    addLog(`🔔 Notification Support: ${info.notificationSupport}`);
    addLog(`📋 Notification Permission: ${info.notificationPermission}`);

    if (info.serviceWorkerRegistrations !== undefined) {
      addLog(`📋 Service Worker Registrations: ${info.serviceWorkerRegistrations}`);
    }

    if (info.serviceWorkerError) {
      addLog(`❌ Service Worker Error: ${info.serviceWorkerError}`);
    }

    if (info.pushManagerError) {
      addLog(`❌ Push Manager Error: ${info.pushManagerError}`);
    }
  };

  const testEnvironment = async () => {
    addLog('🔍 Testing environment...');

    // Test 1: Basic notification
    try {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        addLog(`📋 Permission result: ${permission}`);
      }

      const notification = new Notification('Test', { body: 'Environment test!' });
      addLog('✅ Basic notification works');
      setTimeout(() => notification.close(), 2000);
    } catch (error) {
      addLog(`❌ Basic notification failed: ${error.message}`);
    }

    // Test 2: Service worker registration
    try {
      const registration = await navigator.serviceWorker.register('/sw-simple.js', { scope: '/' });
      addLog(`✅ Service worker registered: ${registration.scope}`);
    } catch (error) {
      addLog(`❌ Service worker registration failed: ${error.message}`);
    }

    // Test 3: Push manager subscription (without VAPID)
    try {
      const registration = await navigator.serviceWorker.ready;
      addLog('✅ Service worker ready');

      // Test without VAPID first
      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true
        });
        addLog('✅ Push subscription without VAPID works');
        await subscription.unsubscribe();
      } catch (error) {
        addLog(`❌ Push subscription without VAPID failed: ${error.message}`);
      }

      // Test with VAPID
      try {
        const VAPID_PUBLIC_KEY = 'BHrOcPd8j5aRb0I61s9C4nSOs-JxrdAf-Acgi9ZfyX6wvPUfvp0TPEtSFQ_5Ed2MFK2cjTpPfM8A0XVJqK3Rs4E';
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        addLog('✅ Push subscription with VAPID works');
        await subscription.unsubscribe();
      } catch (error) {
        addLog(`❌ Push subscription with VAPID failed: ${error.message}`);
        addLog(`🔍 Error details: ${JSON.stringify(error, null, 2)}`);
      }

    } catch (error) {
      addLog(`❌ Push manager test failed: ${error.message}`);
    }

    addLog('🔍 Environment test completed');
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  return (
    <Box p={6} maxW="1000px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔍 Push Notification Debug</Heading>
          <Text color="gray.600">Check your browser environment for push notification support</Text>
        </Box>

        {/* Environment Info */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={3}>Environment Information</Heading>
          <Code fontSize="xs" p={3} borderRadius="md" overflowX="auto" maxW="100%">
            {JSON.stringify(debugInfo, null, 2)}
          </Code>
        </Box>

        {/* Warnings */}
        {debugInfo.protocol !== 'https:' && debugInfo.hostname !== 'localhost' && (
          <Alert status="warning">
            <AlertIcon />
            <Text>Push notifications require HTTPS or localhost. Current protocol: {debugInfo.protocol}</Text>
          </Alert>
        )}

        {!debugInfo.isSecureContext && (
          <Alert status="warning">
            <AlertIcon />
            <Text>Not in secure context. Push notifications may not work.</Text>
          </Alert>
        )}

        {!debugInfo.serviceWorkerSupport && (
          <Alert status="error">
            <AlertIcon />
            <Text>Service Worker not supported in this browser.</Text>
          </Alert>
        )}

        {!debugInfo.pushManagerSupport && (
          <Alert status="error">
            <AlertIcon />
            <Text>Push Manager not supported in this browser.</Text>
          </Alert>
        )}

        {/* Test Button */}
        <Button onClick={testEnvironment} colorScheme="blue" size="lg">
          🔍 Test Environment
        </Button>

        {/* Logs */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={3}>Debug Logs</Heading>
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
              <Text color="gray.500">No logs yet...</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} mb={1}>{log}</Text>
              ))
            )}
          </Box>
        </Box>

        {/* Recommendations */}
        <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
          <Heading size="md" mb={3}>💡 Recommendations</Heading>
          <VStack spacing={2} align="start">
            <Text>• Use Chrome or Edge for best push notification support</Text>
            <Text>• Ensure you're on HTTPS or localhost</Text>
            <Text>• Clear browser cache if issues persist</Text>
            <Text>• Check browser settings for notification permissions</Text>
            <Text>• Try incognito mode to rule out extension conflicts</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}