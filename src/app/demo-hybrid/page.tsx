'use client';

import { useState } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, HStack, Badge, Code, Input, Textarea } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useHybridNotifications } from '@/hooks/useHybridNotifications';

export default function DemoHybrid() {
  const { data: session } = useSession();
  const {
    isSupported,
    permission,
    vapidAvailable,
    requestPermission,
    sendNotification,
    sendLocalNotification,
    sendScheduledNotification,
    attemptVAPIDSubscription
  } = useHybridNotifications();

  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 10)]);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    addLog(granted ? '✅ Permission granted!' : '❌ Permission denied');
  };

  const handleTestNotification = async () => {
    const success = await sendNotification({
      title: '🎉 Hybrid Notification Test!',
      message: 'This notification was sent using the hybrid system!',
      icon: '/icons/favicon.png',
      tag: 'hybrid-test',
      data: {
        type: 'HYBRID_TEST',
        url: '/dashboard/member',
        timestamp: new Date().toISOString()
      }
    });

    addLog(success ? '✅ Hybrid notification sent!' : '❌ Failed to send notification');
  };

  const handleCustomNotification = async () => {
    if (!customTitle.trim() || !customMessage.trim()) {
      addLog('⚠️ Please fill in title and message');
      return;
    }

    const success = await sendNotification({
      title: customTitle,
      message: customMessage,
      tag: 'custom-notification'
    });

    addLog(success ? '✅ Custom notification sent!' : '❌ Failed to send custom notification');
  };

  const handleScheduledNotification = () => {
    sendScheduledNotification(
      3000, // 3 seconds
      '⏰ Scheduled Notification',
      'This was scheduled 3 seconds ago!',
      { tag: 'scheduled' }
    );

    addLog('⏰ Notification scheduled for 3 seconds from now');
  };

  const handleTestLocalOnly = () => {
    const success = sendLocalNotification(
      '🔔 Local Only',
      'This is a local notification only (no push service)',
      { tag: 'local-only' }
    );

    addLog(success ? '✅ Local notification sent!' : '❌ Failed to send local notification');
  };

  const handleAttemptVAPID = async () => {
    addLog('🚀 Attempting VAPID subscription...');

    const subscription = await attemptVAPIDSubscription();

    if (subscription) {
      addLog('✅ VAPID subscription successful!');
      addLog(`📋 Endpoint: ${subscription.toJSON().endpoint.substring(0, 50)}...`);
    } else {
      addLog('❌ VAPID subscription failed (expected in some environments)');
    }
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔔 Hybrid Notification System</Heading>
          <Text color="gray.600">Production-ready notification system with VAPID + Local fallback</Text>
        </Box>

        {!session ? (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please login to test notifications</Text>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Status */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📊 System Status</Heading>
              <VStack spacing={2} align="start">
                <HStack>
                  <Text>Browser Support:</Text>
                  <Badge colorScheme={isSupported ? 'green' : 'red'}>
                    {isSupported ? '✅ Supported' : '❌ Not Supported'}
                  </Badge>
                </HStack>
                <HStack>
                  <Text>Permission:</Text>
                  <Badge colorScheme={
                    permission === 'granted' ? 'green' :
                    permission === 'denied' ? 'red' : 'yellow'
                  }>
                    {permission === 'granted' ? '✅ Granted' :
                     permission === 'denied' ? '❌ Denied' : '⏳ Default'}
                  </Badge>
                </HStack>
                <HStack>
                  <Text>VAPID Available:</Text>
                  <Badge colorScheme={vapidAvailable ? 'green' : 'orange'}>
                    {vapidAvailable ? '✅ Available' : '⚠️ Limited'}
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            {/* Permission Request */}
            {permission !== 'granted' && (
              <Button
                onClick={handleRequestPermission}
                colorScheme="blue"
                size="lg"
                w="full"
              >
                🔔 Request Notification Permission
              </Button>
            )}

            {/* Test Buttons */}
            <VStack spacing={3}>
              <Button
                onClick={handleTestNotification}
                colorScheme="green"
                size="lg"
                w="full"
                isDisabled={permission !== 'granted'}
              >
                🎉 Test Hybrid Notification
              </Button>

              <Button
                onClick={handleTestLocalOnly}
                colorScheme="purple"
                size="lg"
                w="full"
                isDisabled={permission !== 'granted'}
              >
                🔔 Test Local Only
              </Button>

              <Button
                onClick={handleScheduledNotification}
                colorScheme="orange"
                size="lg"
                w="full"
                isDisabled={permission !== 'granted'}
              >
                ⏰ Schedule Notification (3s)
              </Button>

              <Button
                onClick={handleAttemptVAPID}
                colorScheme="blue"
                size="lg"
                w="full"
                isDisabled={!vapidAvailable}
              >
                🚀 Attempt VAPID Subscription
              </Button>
            </VStack>

            {/* Custom Notification */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
              <Heading size="md" mb={3}>📝 Custom Notification</Heading>
              <VStack spacing={3}>
                <Input
                  placeholder="Notification title..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Notification message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleCustomNotification}
                  colorScheme="blue"
                  w="full"
                  isDisabled={permission !== 'granted' || !customTitle.trim() || !customMessage.trim()}
                >
                  📤 Send Custom Notification
                </Button>
              </VStack>
            </Box>

            {/* Info */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="green.50">
              <Heading size="md" mb={3}>💡 How It Works:</Heading>
              <VStack spacing={2} align="start">
                <Text>• <strong>Hybrid System:</strong> Always tries local + VAPID together</Text>
                <Text>• <strong>Local Notifications:</strong> 100% reliable, no server needed</Text>
                <Text>• <strong>VAPID Push:</strong> Best effort, may fail in some environments</Text>
                <Text>• <strong>Production Ready:</strong> Works in all browsers and environments</Text>
                <Text>• <strong>Fallback:</strong> If VAPID fails, local still works</Text>
              </VStack>
            </Box>

            {/* Logs */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📋 Activity Logs</Heading>
              <Box
                bg="gray.900"
                color="green.400"
                p={3}
                borderRadius="md"
                fontFamily="monospace"
                fontSize="xs"
                height="200px"
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
          </VStack>
        )}
      </VStack>
    </Box>
  );
}