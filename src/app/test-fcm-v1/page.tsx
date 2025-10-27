'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, HStack, Badge, Code, Input, Textarea, Divider, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useFCMv1 } from '@/hooks/useFCMv1';

export default function TestFCMV1() {
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
    sendFCMNotification,
    sendToTopic,
    sendWithActions
  } = useFCMv1();

  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [topicName, setTopicName] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 20)]);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    addLog(granted ? '✅ Permission granted!' : '❌ Permission denied');
  };

  const handleSubscribeFCM = async () => {
    addLog('🚀 Starting FCM V1 subscription...');

    const token = await subscribeToFCM();

    if (token) {
      addLog('✅ FCM V1 subscription successful!');
      addLog(`📋 Token: ${token.substring(0, 50)}...`);
    } else {
      addLog('❌ FCM V1 subscription failed');
    }
  };

  const handleTestBasicNotification = async () => {
    const success = await sendFCMNotification({
      title: '🔥 FCM V1 Test Success!',
      message: 'Firebase Cloud Messaging API V1 is working perfectly!',
      icon: '/icons/favicon.png',
      tag: 'fcm-v1-test',
      data: {
        type: 'FCM_V1_TEST',
        url: '/dashboard/member',
        timestamp: new Date().toISOString()
      }
    });

    addLog(success ? '✅ Basic FCM V1 notification sent!' : '❌ Failed to send basic notification');
  };

  const handleTestNotificationWithActions = async () => {
    const success = await sendWithActions({
      title: '🎵 Event Reminder',
      message: 'Practice starts in 1 hour! What do you want to do?',
      icon: '/icons/favicon.png',
      tag: 'event-reminder-v1',
      data: {
        type: 'EVENT_REMINDER',
        eventId: 'test-event-123',
        timestamp: new Date().toISOString()
      }
    });

    addLog(success ? '✅ Notification with actions sent!' : '❌ Failed to send notification with actions');
  };

  const handleTestTopicNotification = async () => {
    if (!topicName.trim()) {
      addLog('⚠️ Please enter a topic name');
      return;
    }

    const success = await sendToTopic(topicName, {
      title: '📢 Topic Broadcast',
      message: `This message was sent to topic: ${topicName}`,
      icon: '/icons/favicon.png',
      tag: 'topic-broadcast',
      data: {
        type: 'TOPIC_BROADCAST',
        topic: topicName,
        timestamp: new Date().toISOString()
      }
    });

    addLog(success ? `✅ Topic notification sent to "${topicName}"!` : '❌ Failed to send topic notification');
  };

  const handleCustomFCMV1Notification = async () => {
    if (!customTitle.trim() || !customMessage.trim()) {
      addLog('⚠️ Please fill in title and message');
      return;
    }

    const success = await sendFCMNotification({
      title: customTitle,
      message: customMessage,
      tag: 'custom-fcm-v1',
      data: {
        type: 'CUSTOM_FCM_V1',
        timestamp: new Date().toISOString()
      }
    });

    addLog(success ? '✅ Custom FCM V1 notification sent!' : '❌ Failed to send custom FCM V1 notification');
  };

  const handleUnsubscribeFCM = async () => {
    addLog('🔕 Unsubscribing from FCM V1...');

    await unsubscribeFromFCM();

    addLog('✅ FCM V1 unsubscription successful');
  };

  const copyToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      addLog('📋 FCM V1 token copied to clipboard');
    }
  };

  if (!mounted) {
    return (
      <Box p={6} maxW="1000px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Heading size="2xl">🔥 Firebase Cloud Messaging API V1</Heading>
          <Text color="gray.600">Loading...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="1000px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔥 Firebase Cloud Messaging API V1</Heading>
          <Text color="gray.600">Test modern Firebase Cloud Messaging with OAuth 2.0 authentication</Text>
        </Box>

        {!session ? (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please login to test FCM V1 notifications</Text>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Status */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📊 FCM V1 Status</Heading>
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
                  <Text>FCM V1 Token:</Text>
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

            {/* FCM V1 Subscription */}
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
                  🔥 Subscribe to FCM V1
                </Button>
              ) : (
                <>
                  <Box p={4} borderWidth={1} borderRadius="md" bg="green.50">
                    <VStack spacing={2} align="start">
                      <Text fontWeight="bold">✅ FCM V1 Subscription Active</Text>
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
                    🔕 Unsubscribe from FCM V1
                  </Button>
                </>
              )}
            </VStack>

            <Divider />

            {/* Test Notifications */}
            <Box>
              <Heading size="md" mb={3}>📤 Test FCM V1 Notifications</Heading>
              <Tabs isFitted variant="enclosed">
                <TabList mb="1em">
                  <Tab>Basic</Tab>
                  <Tab>With Actions</Tab>
                  <Tab>Topic</Tab>
                  <Tab>Custom</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <VStack spacing={3}>
                      <Button
                        onClick={handleTestBasicNotification}
                        colorScheme="purple"
                        size="lg"
                        w="full"
                        isDisabled={!fcmToken}
                      >
                        🔥 Test Basic FCM V1
                      </Button>
                    </VStack>
                  </TabPanel>
                  <TabPanel>
                    <VStack spacing={3}>
                      <Button
                        onClick={handleTestNotificationWithActions}
                        colorScheme="orange"
                        size="lg"
                        w="full"
                        isDisabled={!fcmToken}
                      >
                        🎵 Test with Actions
                      </Button>
                      <Text fontSize="sm" color="gray.600">
                        Notifications with interactive buttons (View/Dismiss)
                      </Text>
                    </VStack>
                  </TabPanel>
                  <TabPanel>
                    <VStack spacing={3}>
                      <Input
                        placeholder="Enter topic name (e.g., 'band-members')"
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                      />
                      <Button
                        onClick={handleTestTopicNotification}
                        colorScheme="teal"
                        size="lg"
                        w="full"
                        isDisabled={!topicName.trim()}
                      >
                        📢 Send to Topic
                      </Button>
                      <Text fontSize="sm" color="gray.600">
                        Send notifications to all subscribers of a topic
                      </Text>
                    </VStack>
                  </TabPanel>
                  <TabPanel>
                    <VStack spacing={3}>
                      <Input
                        placeholder="Custom notification title..."
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Custom notification message..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={handleCustomFCMV1Notification}
                        colorScheme="blue"
                        w="full"
                        isDisabled={!fcmToken || !customTitle.trim() || !customMessage.trim()}
                      >
                        📤 Send Custom FCM V1
                      </Button>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>

            {/* Info */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="yellow.50">
              <Heading size="md" mb={3}>💡 About FCM API V1:</Heading>
              <VStack spacing={2} align="start">
                <Text>• <strong>OAuth 2.0:</strong> Secure authentication with service accounts</Text>
                <Text>• <strong>Modern API:</strong> RESTful design with better structure</Text>
                <Text>• <strong>Interactive Actions:</strong> Buttons and replies in notifications</Text>
                <Text>• <strong>Topics:</strong> Broadcast to multiple users</Text>
                <Text>• <strong>Analytics:</strong> Better tracking and insights</Text>
                <Text>• <strong>Reliability:</strong> Google's recommended API version</Text>
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