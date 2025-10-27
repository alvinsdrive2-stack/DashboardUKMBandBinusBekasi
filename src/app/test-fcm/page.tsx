'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, HStack, Badge, Code, Input, Textarea, Divider } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useFCM } from '@/hooks/useFCM';

export default function TestFCM() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  const {
    isSupported,
    permission,
    fcmToken,
    isLoading,
    error,
    requestPermission,
    subscribeToFCM,
    unsubscribeFromFCM,
    sendFCMNotification
  } = useFCM();

  // Prevent SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box p={6} maxW="900px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Heading size="2xl">🔥 Firebase Cloud Messaging (FCM)</Heading>
          <Text color="gray.600">Loading...</Text>
        </VStack>
      </Box>
    );
  }

  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 15)]);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    addLog(granted ? '✅ Permission granted!' : '❌ Permission denied');
  };

  const handleSubscribeFCM = async () => {
    addLog('🚀 Starting FCM subscription...');

    const token = await subscribeToFCM();

    if (token) {
      addLog('✅ FCM subscription successful!');
      addLog(`📋 Token: ${token.substring(0, 50)}...`);
    } else {
      addLog('❌ FCM subscription failed');
    }
  };

  const handleUnsubscribeFCM = async () => {
    addLog('🔕 Unsubscribing from FCM...');

    await unsubscribeFromFCM();

    addLog('✅ FCM unsubscription successful');
  };

  const handleTestFCMNotification = async () => {
    const success = await sendFCMNotification({
      title: '🔥 FCM Test Success!',
      message: 'Firebase Cloud Messaging is working perfectly!',
      icon: '/icons/favicon.png',
      tag: 'fcm-test',
      data: {
        type: 'FCM_TEST',
        url: '/dashboard/member',
        timestamp: new Date().toISOString()
      }
    });

    addLog(success ? '✅ FCM notification sent!' : '❌ Failed to send FCM notification');
  };

  const handleCustomFCMNotification = async () => {
    if (!customTitle.trim() || !customMessage.trim()) {
      addLog('⚠️ Please fill in title and message');
      return;
    }

    const success = await sendFCMNotification({
      title: customTitle,
      message: customMessage,
      tag: 'custom-fcm',
      data: {
        type: 'CUSTOM_FCM',
        timestamp: new Date().toISOString()
      }
    });

    addLog(success ? '✅ Custom FCM notification sent!' : '❌ Failed to send custom FCM notification');
  };

  const handleTestEventReminder = async () => {
    const success = await sendFCMNotification({
      title: '🎵 Event Reminder',
      message: 'Practice starts in 1 hour! Don\'t forget your instrument.',
      icon: '/icons/favicon.png',
      tag: 'event-reminder',
      data: {
        type: 'EVENT_REMINDER',
        eventId: 'test-event-123',
        timestamp: new Date().toISOString()
      }
    });

    addLog(success ? '✅ Event reminder sent!' : '❌ Failed to send event reminder');
  };

  const copyToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      addLog('📋 FCM token copied to clipboard');
    }
  };

  return (
    <Box p={6} maxW="900px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔥 Firebase Cloud Messaging (FCM)</Heading>
          <Text color="gray.600">Test reliable push notifications with Firebase</Text>
        </Box>

        {!session ? (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please login to test FCM notifications</Text>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Status */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📊 FCM Status</Heading>
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
                  <Text>FCM Token:</Text>
                  <Badge colorScheme={fcmToken ? 'green' : 'gray'}>
                    {fcmToken ? '✅ Active' : '❌ None'}
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            {/* Error Display */}
            {error && (
              <Alert status="error">
                <AlertIcon />
                <Text>{error}</Text>
              </Alert>
            )}

            {/* Permission Request */}
            {permission !== 'granted' && (
              <Button
                onClick={handleRequestPermission}
                colorScheme="blue"
                size="lg"
                w="full"
                isLoading={isLoading}
              >
                🔔 Request Notification Permission
              </Button>
            )}

            {/* FCM Subscription */}
            <VStack spacing={3}>
              {!fcmToken ? (
                <Button
                  onClick={handleSubscribeFCM}
                  colorScheme="green"
                  size="lg"
                  w="full"
                  isDisabled={permission !== 'granted'}
                  isLoading={isLoading}
                >
                  🔥 Subscribe to FCM
                </Button>
              ) : (
                <>
                  <Box p={4} borderWidth={1} borderRadius="md" bg="green.50">
                    <VStack spacing={2} align="start">
                      <Text fontWeight="bold">✅ FCM Subscription Active</Text>
                      <Code fontSize="xs" p={2} borderRadius="md" overflowX="auto" maxH="100px" w="full">
                        {fcmToken}
                      </Code>
                      <Button size="sm" onClick={copyToken} colorScheme="blue">
                        📋 Copy Token
                      </Button>
                    </VStack>
                  </Box>
                  <Button
                    onClick={handleUnsubscribeFCM}
                    colorScheme="red"
                    size="sm"
                    w="full"
                  >
                    🔕 Unsubscribe from FCM
                  </Button>
                </>
              )}
            </VStack>

            <Divider />

            {/* Test Notifications */}
            <Box>
              <Heading size="md" mb={3}>📤 Test FCM Notifications</Heading>
              <VStack spacing={3}>
                <Button
                  onClick={handleTestFCMNotification}
                  colorScheme="purple"
                  size="lg"
                  w="full"
                  isDisabled={!fcmToken}
                >
                  🔥 Test FCM Notification
                </Button>

                <Button
                  onClick={handleTestEventReminder}
                  colorScheme="orange"
                  size="lg"
                  w="full"
                  isDisabled={!fcmToken}
                >
                  🎵 Test Event Reminder
                </Button>
              </VStack>
            </Box>

            <Divider />

            {/* Custom Notification */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
              <Heading size="md" mb={3}>📝 Custom FCM Notification</Heading>
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
                  onClick={handleCustomFCMNotification}
                  colorScheme="blue"
                  w="full"
                  isDisabled={!fcmToken || !customTitle.trim() || !customMessage.trim()}
                >
                  📤 Send Custom FCM
                </Button>
              </VStack>
            </Box>

            {/* Info */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="yellow.50">
              <Heading size="md" mb={3}>💡 About FCM:</Heading>
              <VStack spacing={2} align="start">
                <Text>• <strong>Reliable:</strong> Google maintained push service</Text>
                <Text>• <strong>Cross-platform:</strong> Works on web, Android, iOS</Text>
                <Text>• <strong>Background:</strong> Works even when app is closed</Text>
                <Text>• <strong>Scalable:</strong> Handles millions of notifications</Text>
                <Text>• <strong>Free:</strong> Generous free tier for most apps</Text>
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
                height="250px"
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