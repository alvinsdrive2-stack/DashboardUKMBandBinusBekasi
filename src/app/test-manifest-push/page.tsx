'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, Code } from '@chakra-ui/react';

export default function TestManifestPush() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 30));
  };

  const testWithManifest = async () => {
    addLog('🚀 Starting test with manifest...');

    try {
      // Step 1: Check manifest
      const manifestResponse = await fetch('/manifest.json');
      const manifestData = await manifestResponse.json();
      addLog(`✅ Manifest loaded: ${manifestData.name}`);
      addLog(`📋 Manifest gcm_sender_id: ${manifestData.gcm_sender_id}`);

      // Step 2: Register service worker with manifest support
      addLog('🔄 Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw-simple.js', {
        scope: '/'
      });
      addLog(`✅ Service worker registered: ${registration.scope}`);

      // Step 3: Force install PWA (simulate)
      if ('serviceWorker' in navigator) {
        // Check if PWA install prompt is available
        window.addEventListener('beforeinstallprompt', (e) => {
          addLog('📱 PWA install prompt available');
        });
      }

      // Step 4: Test push subscription with different approach
      await navigator.serviceWorker.ready;
      addLog('✅ Service worker ready');

      // Clear existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
        addLog('🗑️ Cleared existing subscription');
      }

      // Step 5: Try different subscription methods
      const VAPID_PUBLIC_KEY = 'BHrOcPd8j5aRb0I61s9C4nSOs-JxrdAf-Acgi9ZfyX6wvPUfvp0TPEtSFQ_5Ed2MFK2cjTpPfM8A0XVJqK3Rs4E';

      // Method 1: Direct subscription
      try {
        addLog('📡 Method 1: Direct subscription...');
        const subscription1 = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        addLog('✅ Method 1 SUCCESS!');
        await subscription1.unsubscribe();
      } catch (error1) {
        addLog(`❌ Method 1 failed: ${error1.message}`);

        // Method 2: Try with different options
        try {
          addLog('📡 Method 2: Alternative subscription...');
          const subscription2 = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            // Additional options
          });
          addLog('✅ Method 2 SUCCESS!');
          await subscription2.unsubscribe();
        } catch (error2) {
          addLog(`❌ Method 2 failed: ${error2.message}`);

          // Method 3: Try without VAPID first
          try {
            addLog('📡 Method 3: No VAPID subscription...');
            const subscription3 = await registration.pushManager.subscribe({
              userVisibleOnly: true
            });
            addLog('✅ Method 3 SUCCESS (no VAPID)!');
            await subscription3.unsubscribe();
            addLog('⚠️ Browser supports push but VAPID keys might be the issue');
          } catch (error3) {
            addLog(`❌ Method 3 failed: ${error3.message}`);
            addLog('🚨 All subscription methods failed - browser issue');
          }
        }
      }

      // Step 6: Test basic push
      addLog('📤 Testing basic push notification...');
      if (Notification.permission === 'granted') {
        const notification = new Notification('Test Complete', {
          body: 'Push notification setup test completed!',
          icon: '/icons/favicon.png',
          tag: 'test-complete'
        });
        setTimeout(() => notification.close(), 3000);
        addLog('✅ Basic notification sent');
      }

    } catch (error) {
      addLog(`❌ Overall test failed: ${error.message}`);
    }

    addLog('🏁 Test completed');
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

  const checkPushSupport = () => {
    const support = {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      isSecureContext: window.isSecureContext,
      permission: Notification.permission
    };

    addLog('🔍 Checking push support...');
    Object.entries(support).forEach(([key, value]) => {
      addLog(`  ${key}: ${value}`);
    });

    const allSupported = Object.values(support).every(v => v === true || v === 'granted');
    addLog(allSupported ? '✅ Full push support detected' : '⚠️ Limited push support');
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🎯 Manifest Push Test</Heading>
          <Text color="gray.600">Test push notifications with PWA manifest support</Text>
        </Box>

        <VStack spacing={4} align="stretch">
          <Button onClick={checkPushSupport} colorScheme="blue" size="lg">
            🔍 Check Push Support
          </Button>

          <Button onClick={testWithManifest} colorScheme="green" size="lg">
            🚀 Start Complete Test
          </Button>
        </VStack>

        {/* Debug Info */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={3}>Test Logs</Heading>
          <Box
            bg="gray.900"
            color="green.400"
            p={3}
            borderRadius="md"
            fontFamily="monospace"
            fontSize="xs"
            height="400px"
            overflowY="auto"
          >
            {logs.length === 0 ? (
              <Text color="gray.500">Click buttons above to start testing...</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} mb={1}>{log}</Text>
              ))
            )}
          </Box>
        </Box>

        {/* Troubleshooting */}
        <Box p={4} borderWidth={1} borderRadius="md" bg="yellow.50">
          <Heading size="md" mb={3}>🔧 Troubleshooting Tips</Heading>
          <VStack spacing={2} align="start">
            <Text>• If Method 1/2 fails but Method 3 works → VAPID key issue</Text>
            <Text>• If all methods fail → Browser/Environment issue</Text>
            <Text>• Try Chrome in incognito mode</Text>
            <Text>• Clear browser cache and restart</Text>
            <Text>• Check browser security settings</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}