'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { usePushNotification } from '@/hooks/usePushNotification';
import { Box, Button, VStack, HStack, Text, Heading, Divider, Alert, AlertIcon, useToast, Input, Badge, Code } from '@chakra-ui/react';

export default function TestPushNotifications() {
  const { data: session, status } = useSession();
  const toast = useToast();
  const [logs, setLogs] = useState<string[]>([]);
  const [testUserId, setTestUserId] = useState('');
  const [testTitle, setTestTitle] = useState('🔔 Test Push Notification');
  const [testMessage, setTestMessage] = useState('Ini adalah notifikasi push test dari UKM Band Dashboard!');

  const {
    isSupported,
    isSubscribed,
    subscription,
    permission,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    testPushNotification,
    requestPermission,
    showLocalNotification
  } = usePushNotification();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addLog(`🔔 Push notifications supported: ${isSupported}`);
    addLog(`📱 Permission: ${permission}`);
    addLog(`✅ Subscribed: ${isSubscribed}`);

    if (session?.user?.id) {
      setTestUserId(session.user.id);
      addLog(`👤 User ID: ${session.user.id}`);
    }
  }, [isSupported, isSubscribed, permission, session]);

  useEffect(() => {
    if (error) {
      addLog(`❌ Error: ${error}`);
      toast({
        title: "Push Notification Error",
        description: error,
        status: "error",
        duration: 5000,
      });
    }
  }, [error]);

  useEffect(() => {
    if (status === 'authenticated') {
      addLog(`✅ Logged in as ${session.user.name}`);
    } else if (status === 'unauthenticated') {
      addLog('❌ Not authenticated');
    }
  }, [status, session]);

  const handleSubscribe = async () => {
    addLog('📡 Subscribing to push notifications...');
    const success = await subscribe();
    if (success) {
      addLog('✅ Successfully subscribed to push notifications');
      toast({
        title: "Success!",
        description: "Push notifications enabled successfully",
        status: "success",
        duration: 3000,
      });
    } else {
      addLog('❌ Failed to subscribe to push notifications');
    }
  };

  const handleUnsubscribe = async () => {
    addLog('🚫 Unsubscribing from push notifications...');
    const success = await unsubscribe();
    if (success) {
      addLog('✅ Successfully unsubscribed from push notifications');
      toast({
        title: "Success!",
        description: "Push notifications disabled",
        status: "info",
        duration: 3000,
      });
    } else {
      addLog('❌ Failed to unsubscribe from push notifications');
    }
  };

  const handleRequestPermission = async () => {
    addLog('🔔 Requesting notification permission...');
    const granted = await requestPermission();
    if (granted) {
      addLog('✅ Permission granted');
      toast({
        title: "Permission Granted",
        description: "You can now receive push notifications",
        status: "success",
        duration: 3000,
      });
    } else {
      addLog('❌ Permission denied');
      toast({
        title: "Permission Denied",
        description: "You need to allow notifications to receive push notifications",
        status: "warning",
        duration: 5000,
      });
    }
  };

  const handleTestPush = async () => {
    addLog('📤 Testing push notification...');
    await testPushNotification();
  };

  const handleTestLocal = () => {
    addLog('📱 Testing local notification...');
    showLocalNotification('Local Test Notification', {
      body: 'This is a local notification test',
      icon: '/icons/favicon.png',
      tag: 'local-test'
    });
  };

  const sendTestNotification = async () => {
    if (!testUserId) {
      addLog('❌ User ID is required');
      return;
    }

    addLog('📤 Sending test notification via API...');
    try {
      const response = await fetch('/api/notifications/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 'ukm-band-push-2025-secret-key'}`
        },
        body: JSON.stringify({
          userId: testUserId,
          title: testTitle,
          message: testMessage,
          icon: '/icons/favicon.png',
          data: {
            type: 'TEST_NOTIFICATION',
            url: '/dashboard/member',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Test notification sent: ${result.message}`);
        addLog(`📊 Sent to ${result.sent} device(s), Failed: ${result.failed}`);
        toast({
          title: "Test Notification Sent",
          description: `Sent to ${result.sent} device(s)`,
          status: "success",
          duration: 3000,
        });
      } else {
        const error = await response.json();
        addLog(`❌ Failed to send: ${error.error}`);
      }
    } catch (error) {
      addLog(`❌ Error sending test notification: ${error}`);
    }
  };

  const clearLogs = () => setLogs([]);

  if (status === 'loading') {
    return <Box p={6}><Text>Loading...</Text></Box>;
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="2xl" mb={2}>📱 Push Notification Test</Heading>
          <Text color="gray.600">Test push notification functionality and setup</Text>
        </Box>

        {/* Auth Status */}
        {status === 'authenticated' ? (
          <Alert status='success'>
            <AlertIcon />
            <Text>
              Logged in as <strong>{session.user.name}</strong> (ID: {session.user.id})
            </Text>
          </Alert>
        ) : (
          <Alert status='warning'>
            <AlertIcon />
            <Text>You need to be logged in to test push notifications</Text>
            <Button ml={4} size="sm" onClick={() => signIn()}>
              Sign In
            </Button>
          </Alert>
        )}

        <HStack spacing={4} align="stretch">
          {/* Left Column - Controls */}
          <VStack spacing={4} flex={1} align="stretch">
            {/* Status */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Status</Heading>
              <VStack spacing={2} align="start">
                <HStack>
                  <Text>Supported:</Text>
                  <Badge colorScheme={isSupported ? 'green' : 'red'}>
                    {isSupported ? '✅ Yes' : '❌ No'}
                  </Badge>
                </HStack>
                <HStack>
                  <Text>Permission:</Text>
                  <Badge colorScheme={
                    permission === 'granted' ? 'green' :
                    permission === 'denied' ? 'red' : 'yellow'
                  }>
                    {permission}
                  </Badge>
                </HStack>
                <HStack>
                  <Text>Subscribed:</Text>
                  <Badge colorScheme={isSubscribed ? 'green' : 'red'}>
                    {isSubscribed ? '✅ Yes' : '❌ No'}
                  </Badge>
                </HStack>
                {isLoading && <Text color="blue.600">⏳ Loading...</Text>}
              </VStack>
            </Box>

            {/* Actions */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Actions</Heading>
              <VStack spacing={2}>
                {!isSupported && (
                  <Alert status="error">
                    <AlertIcon />
                    <Text>Push notifications are not supported in this browser</Text>
                  </Alert>
                )}

                {permission !== 'granted' && (
                  <Button
                    onClick={handleRequestPermission}
                    colorScheme="blue"
                    size="sm"
                    isDisabled={!isSupported || isLoading}
                  >
                    🔔 Request Permission
                  </Button>
                )}

                {permission === 'granted' && !isSubscribed && (
                  <Button
                    onClick={handleSubscribe}
                    colorScheme="green"
                    size="sm"
                    isDisabled={isLoading}
                  >
                    📡 Subscribe
                  </Button>
                )}

                {isSubscribed && (
                  <Button
                    onClick={handleUnsubscribe}
                    colorScheme="red"
                    size="sm"
                    isDisabled={isLoading}
                  >
                    🚫 Unsubscribe
                  </Button>
                )}

                <Button
                  onClick={handleTestLocal}
                  colorScheme="purple"
                  size="sm"
                  isDisabled={permission !== 'granted'}
                >
                  📱 Test Local Notification
                </Button>

                <Button
                  onClick={handleTestPush}
                  colorScheme="orange"
                  size="sm"
                  isDisabled={!isSubscribed}
                >
                  📤 Test Push Notification
                </Button>
              </VStack>
            </Box>

            {/* Send Custom Test */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Send Custom Test</Heading>
              <VStack spacing={2}>
                <Input
                  placeholder="User ID"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                />
                <Input
                  placeholder="Title"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
                <Input
                  placeholder="Message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
                <Button
                  onClick={sendTestNotification}
                  colorScheme="teal"
                  size="sm"
                  isDisabled={!testUserId}
                >
                  📡 Send Test Notification
                </Button>
              </VStack>
            </Box>
          </VStack>

          {/* Right Column - Info and Logs */}
          <VStack spacing={4} flex={1} align="stretch">
            {/* Subscription Info */}
            {subscription && (
              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading size="md" mb={3}>Subscription Info</Heading>
                <VStack spacing={2} align="start">
                  <Text fontSize="sm"><strong>Endpoint:</strong></Text>
                  <Code fontSize="xs" p={2} borderRadius="md" overflowX="auto" maxW="100%">
                    {subscription.endpoint}
                  </Code>
                  <Text fontSize="sm"><strong>Keys:</strong></Text>
                  <Code fontSize="xs" p={2} borderRadius="md">
                    p256dh: {subscription.keys.p256dh.substring(0, 50)}...
                  </Code>
                </VStack>
              </Box>
            )}

            {/* Logs */}
            <Box p={4} borderWidth={1} borderRadius="md" flex={1}>
              <HStack justify="space-between" mb={3}>
                <Heading size="md">Logs</Heading>
                <Button onClick={clearLogs} colorScheme="gray" size="xs">
                  Clear
                </Button>
              </HStack>
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
                  <Text color="gray.500">No logs yet...</Text>
                ) : (
                  logs.map((log, index) => (
                    <Text key={index} mb={1}>{log}</Text>
                  ))
                )}
              </Box>
            </Box>
          </VStack>
        </HStack>

        {/* Instructions */}
        <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
          <Heading size="md" mb={2}>📖 Testing Instructions</Heading>
          <VStack spacing={1} align="start">
            <Text>• <strong>Step 1:</strong> Make sure you're logged in</Text>
            <Text>• <strong>Step 2:</strong> Grant notification permission when prompted</Text>
            <Text>• <strong>Step 3:</strong> Click "Subscribe" to register for push notifications</Text>
            <Text>• <strong>Step 4:</strong> Test with "Test Push Notification" button</Text>
            <Text>• <strong>Step 5:</strong> Check browser DevTools → Application → Service Workers</Text>
            <Text>• <strong>Pro Tip:</strong> Open DevTools to see console logs and network requests</Text>
          </VStack>
        </Box>

        {/* Browser Requirements */}
        <Box p={4} borderWidth={1} borderRadius="md" bg="yellow.50">
          <Heading size="md" mb={2}>🌐 Browser Requirements</Heading>
          <VStack spacing={1} align="start">
            <Text>• <strong>Supported:</strong> Chrome, Firefox, Edge (modern versions)</Text>
            <Text>• <strong>HTTPS Required:</strong> Push notifications only work over HTTPS</Text>
            <Text>• <strong>Service Worker:</strong> Browser must support service workers</Text>
            <Text>• <strong>Not Supported:</strong> Safari (limited PWA support), IE</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}