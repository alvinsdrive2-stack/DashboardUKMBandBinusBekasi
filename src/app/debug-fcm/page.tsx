'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, Code, Badge, HStack, Divider } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function DebugFCM() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 30)]);
  };

  const debugStep1 = () => {
    addLog('🔍 === STEP 1: Environment Check ===');
    addLog(`🌐 Protocol: ${window.location.protocol}`);
    addLog(`🔒 Secure Context: ${window.isSecureContext}`);
    addLog(`🔍 User Agent: ${navigator.userAgent}`);
    addLog(`📱 Platform: ${navigator.platform}`);
    addLog(`🔧 Service Worker: ${'serviceWorker' in navigator ? '✅ Supported' : '❌ Not Supported'}`);
    addLog(`📢 Notification: ${'Notification' in window ? '✅ Supported' : '❌ Not Supported'}`);
    addLog(`🔑 Push Manager: ${'PushManager' in navigator ? '✅ Supported' : '❌ Not Supported'}`);
  };

  const debugStep2 = async () => {
    addLog('🔍 === STEP 2: Permission Check ===');

    try {
      const permission = Notification.permission;
      addLog(`📋 Current Permission: ${permission}`);

      if (permission === 'default') {
        addLog('📋 Requesting permission...');
        const result = await Notification.requestPermission();
        addLog(`📋 Permission Result: ${result}`);
      } else if (permission === 'denied') {
        addLog('❌ Permission denied! Cannot continue');
      } else {
        addLog('✅ Permission granted!');
      }
    } catch (error) {
      addLog(`❌ Permission error: ${error.message}`);
    }
  };

  const debugStep3 = async () => {
    addLog('🔍 === STEP 3: Service Worker Check ===');

    try {
      addLog('🔧 Getting all service workers...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      addLog(`📊 Found ${registrations.length} service worker(s)`);

      for (const reg of registrations) {
        addLog(`📋 SW: ${reg.scope} - Active: ${reg.active ? '✅' : '❌'}`);
      }

      addLog('🔧 Registering FCM service worker...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-v1-sw.js');
      addLog(`✅ SW Registered: ${registration.scope}`);

      addLog('⏳ Waiting for SW to be ready...');
      await navigator.serviceWorker.ready;
      addLog('✅ SW is ready!');

    } catch (error) {
      addLog(`❌ Service Worker error: ${error.message}`);
    }
  };

  const debugStep4 = async () => {
    addLog('🔍 === STEP 4: Firebase Config Check ===');

    try {
      // Check Firebase config
      const firebaseConfig = {
        apiKey: "AIzaSyDnTT7bVg8ETNal9Jme1vFcEKDPuKaC7Lo",
        authDomain: "ukm-band-dashboard.firebaseapp.com",
        projectId: "ukm-band-dashboard",
        storageBucket: "ukm-band-dashboard.firebasestorage.app",
        messagingSenderId: "317047973293",
        appId: "1:317047973293:web:64c6ae39f9d9d16b3f2d24",
        measurementId: "G-EKGK8JCEQJ"
      };

      addLog(`📋 Project ID: ${firebaseConfig.projectId}`);
      addLog(`📋 Sender ID: ${firebaseConfig.messagingSenderId}`);
      addLog(`📋 App ID: ${firebaseConfig.appId}`);
      addLog(`✅ Firebase config loaded!`);

      // Check VAPID key
      const vapidKey = "BKAvI-YTsaAm6v6bmwp3CXgndd7ooY-fhhyyhw3LVyoaiDMMToJvSz2xn_n4jw163ko-wKFWKtWcys_kDY-rpDw";
      addLog(`📋 VAPID Key: ${vapidKey.substring(0, 20)}... (length: ${vapidKey.length})`);

    } catch (error) {
      addLog(`❌ Config check error: ${error.message}`);
    }
  };

  const debugStep5 = async () => {
    addLog('🔍 === STEP 5: Firebase SDK Load ===');

    try {
      addLog('📦 Loading Firebase SDK...');

      // Check if Firebase SDK loads
      if (typeof firebase !== 'undefined') {
        addLog('✅ Firebase SDK available in global scope');
      } else {
        addLog('📦 Firebase SDK not in global scope, importing...');
      }

      // Try dynamic import
      const { initializeApp } = await import('firebase/app');
      const { getMessaging } = await import('firebase/messaging');

      addLog('✅ Firebase app SDK imported!');
      addLog('✅ Firebase messaging SDK imported!');

      // Initialize Firebase
      const app = initializeApp({
        apiKey: "AIzaSyDnTT7bVg8ETNal9Jme1vFcEKDPuKaC7Lo",
        authDomain: "ukm-band-dashboard.firebaseapp.com",
        projectId: "ukm-band-dashboard",
        storageBucket: "ukm-band-dashboard.firebasestorage.app",
        messagingSenderId: "317047973293",
        appId: "1:317047973293:web:64c6ae39f9d9d16b3f2d24",
        measurementId: "G-EKGK8JCEQJ"
      });

      addLog('✅ Firebase app initialized!');

      const messaging = getMessaging(app);
      addLog('✅ Firebase messaging initialized!');

    } catch (error) {
      addLog(`❌ Firebase SDK error: ${error.message}`);
      addLog(`🔍 Error details: ${error.stack}`);
    }
  };

  const debugStep6 = async () => {
    addLog('🔍 === STEP 6: FCM Token Generation ===');

    try {
      addLog('📦 Loading Firebase SDKs...');

      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken } = await import('firebase/messaging');

      const app = initializeApp({
        apiKey: "AIzaSyDnTT7bVg8ETNal9Jme1vFcEKDPuKaC7Lo",
        authDomain: "ukm-band-dashboard.firebaseapp.com",
        projectId: "ukm-band-dashboard",
        storageBucket: "ukm-band-dashboard.firebasestorage.app",
        messagingSenderId: "317047973293",
        appId: "1:317047973293:web:64c6ae39f9d9d16b3f2d24",
        measurementId: "G-EKGK8JCEQJ"
      });

      const messaging = getMessaging(app);

      addLog('🔧 Registering service worker...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-v1-sw.js');
      await navigator.serviceWorker.ready;

      addLog('🔑 Getting FCM token...');
      const vapidKey = "BKAvI-YTsaAm6v6bmwp3CXgndd7ooY-fhhyyhw3LVyoaiDMMToJvSz2xn_n4jw163ko-wKFWKtWcys_kDY-rpDw";

      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        addLog('🎉 SUCCESS! FCM Token obtained!');
        addLog(`📋 Token: ${token.substring(0, 50)}...`);
        addLog(`📊 Token length: ${token.length}`);
      } else {
        addLog('❌ Token is null or empty');
      }

    } catch (error) {
      addLog(`❌ FCM Token error: ${error.message}`);
      addLog(`🔍 Error type: ${error.name}`);
      addLog(`🔍 Error stack: ${error.stack}`);

      // Specific error handling
      if (error.message.includes('messaging/')) {
        addLog('🔍 Possible cause: Firebase SDK loading issue');
      } else if (error.message.includes('vapidKey')) {
        addLog('🔍 Possible cause: Invalid VAPID key format');
      } else if (error.message.includes('serviceWorker')) {
        addLog('🔍 Possible cause: Service worker registration issue');
      }
    }
  };

  const runFullDebug = async () => {
    addLog('🚀 === STARTING FULL FCM DEBUG ===');

    debugStep1();
    await new Promise(resolve => setTimeout(resolve, 500));

    debugStep2();
    await new Promise(resolve => setTimeout(resolve, 500));

    debugStep3();
    await new Promise(resolve => setTimeout(resolve, 1000));

    debugStep4();
    await new Promise(resolve => setTimeout(resolve, 500));

    debugStep5();
    await new Promise(resolve => setTimeout(resolve, 500));

    debugStep6();

    addLog('🏁 === DEBUG COMPLETE ===');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!mounted) {
    return (
      <Box p={6} maxW="1000px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Heading size="2xl">🔍 FCM Debug</Heading>
          <Text color="gray.600">Loading...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="1000px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔍 FCM Debug Tool</Heading>
          <Text color="gray.600">Step-by-step debugging for FCM token generation</Text>
        </Box>

        {!session ? (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please login first</Text>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Quick Debug */}
            <VStack spacing={3}>
              <Button
                onClick={runFullDebug}
                colorScheme="blue"
                size="lg"
                w="full"
              >
                🔍 Run Full Debug
              </Button>

              <Button
                onClick={clearLogs}
                colorScheme="gray"
                size="sm"
                w="full"
              >
                🗑️ Clear Logs
              </Button>
            </VStack>

            <Divider />

            {/* Individual Steps */}
            <Box>
              <Heading size="md" mb={3}>🔧 Individual Steps</Heading>
              <VStack spacing={2}>
                <Button onClick={debugStep1} colorScheme="green" size="sm">
                  Step 1: Environment Check
                </Button>
                <Button onClick={debugStep2} colorScheme="green" size="sm">
                  Step 2: Permission Check
                </Button>
                <Button onClick={debugStep3} colorScheme="green" size="sm">
                  Step 3: Service Worker Check
                </Button>
                <Button onClick={debugStep4} colorScheme="green" size="sm">
                  Step 4: Firebase Config Check
                </Button>
                <Button onClick={debugStep5} colorScheme="green" size="sm">
                  Step 5: Firebase SDK Load
                </Button>
                <Button onClick={debugStep6} colorScheme="green" size="sm">
                  Step 6: FCM Token Generation
                </Button>
              </VStack>
            </Box>

            {/* Logs */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📋 Debug Logs</Heading>
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
                  <Text color="gray.500">Click "Run Full Debug" to start...</Text>
                ) : (
                  logs.map((log, index) => (
                    <Text key={index} mb={1}>{log}</Text>
                  ))
                )}
              </Box>
            </Box>

            {/* Info */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
              <Heading size="md" mb={3}>💡 Common Issues:</Heading>
              <VStack spacing={2} align="start">
                <Text>• <strong>Permission denied</strong>: Enable notifications in browser settings</Text>
                <Text>• <strong>Service Worker error</strong>: Clear browser cache and reload</Text>
                <Text>• <strong>Firebase SDK error</strong>: Check internet connection</Text>
                <Text>• <strong>VAPID key error</strong>: Invalid key format</Text>
                <Text>• <strong>HTTPS required</strong>: Use HTTPS in production</Text>
              </VStack>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}