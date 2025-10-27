'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, Code, HStack, Badge, Input, Textarea, Divider, Tabs, TabList, TabPanels, Tab, TabPanel, Card } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useUniversalNotifications } from '@/hooks/useUniversalNotifications';

export default function TestUniversalNotifications() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [topicName, setTopicName] = useState('');

  const {
    isSupported,
    permission,
    fcmAvailable,
    logs,
    requestPermission,
    sendLocalNotification,
    sendScheduledNotification,
    attemptFCM,
    sendUniversalNotification,
    sendToTopic,
    clearLogs
  } = useUniversalNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      // Try to setup FCM automatically
      setTimeout(() => attemptFCM(), 1000);
    }
  };

  const handleTestLocalOnly = async () => {
    const success = await sendLocalNotification(
      '🔔 Local Notification Test',
      'This is a local-only notification - always works!',
      {
        tag: 'local-test',
        requireInteraction: false,
        vibration: [200, 100, 200]
      }
    );
  };

  const handleTestScheduled = () => {
    sendScheduledNotification(
      3000,
      '⏰ Scheduled Notification',
      'This was scheduled 3 seconds ago!',
      {
        tag: 'scheduled-test'
      }
    );

    // Schedule another one
    sendScheduledNotification(
      5000,
      '⏰ Another Scheduled',
      'This was scheduled 5 seconds ago!',
      {
        tag: 'scheduled-test-2'
      }
    );
  };

  const handleTestUniversal = async () => {
    const success = await sendUniversalNotification({
      title: '🎉 Universal Test Success!',
      message: 'This notification tries all available methods!',
      icon: '/icons/favicon.png',
      tag: 'universal-test',
      data: {
        type: 'UNIVERSAL_TEST',
        timestamp: new Date().toISOString(),
        url: '/dashboard/member'
      },
      actionUrl: '/dashboard/member'
    });
  };

  const handleCustomUniversal = async () => {
    if (!customTitle.trim() || !customMessage.trim()) {
      return;
    }

    const success = await sendUniversalNotification({
      title: customTitle,
      message: customMessage,
      tag: 'custom-universal',
      data: {
        type: 'CUSTOM_UNIVERSAL',
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleTestEventReminder = async () => {
    const success = await sendUniversalNotification({
      title: '🎵 Event Reminder',
      message: 'Practice starts in 1 hour! Don\'t forget your instrument!',
      icon: '/icons/favicon.png',
      tag: 'event-reminder',
      data: {
        type: 'EVENT_REMINDER',
        eventId: 'test-event-123',
        timestamp: new Date().toISOString()
      },
      actionUrl: '/dashboard/member/schedule?eventId=test-event-123'
    });
  };

  const handleTestTopicBroadcast = async () => {
    if (!topicName.trim()) {
      return;
    }

    const success = await sendToTopic(topicName, {
      title: '📢 Band Broadcast',
      message: `Important announcement for all band members!`,
      icon: '/icons/favicon.png',
      tag: 'band-broadcast',
      data: {
        type: 'BAND_BROADCAST',
        topic: topicName,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleSetupFCM = async () => {
    await attemptFCM();
  };

  if (!mounted) {
    return (
      <Box p={6} maxW="1000px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Heading size="2xl">🔔 Universal Notifications</Heading>
          <Text color="gray.600">Loading...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="1000px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔔 Universal Notification System</Heading>
          <Text color="gray.600">Hybrid system - Always works, tries all notification methods</Text>
        </Box>

        {!session ? (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please login first</Text>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* Status Card */}
            <Card p={4}>
              <Heading size="md" mb={4}>📊 System Status</Heading>
              <VStack spacing={3} align="start">
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
                  <Text>FCM Available:</Text>
                  <Badge colorScheme={fcmAvailable ? 'green' : 'orange'}>
                    {fcmAvailable ? '✅ Available' : '⚠️ Limited'}
                  </Badge>
                </HStack>
              </VStack>
            </Card>

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

            {/* FCM Setup */}
            <VStack spacing={3}>
              <Button
                onClick={handleSetupFCM}
                colorScheme="purple"
                size="lg"
                w="full"
                isDisabled={permission !== 'granted' || !fcmAvailable}
              >
                🔧 Setup FCM (Optional)
              </Button>
              <Text fontSize="sm" color="gray.600">
                FCM provides better delivery but may fail in some environments
              </Text>
            </VStack>

            <Divider />

            {/* Test Tabs */}
            <Tabs isFitted variant="enclosed">
              <TabList mb="1em">
                <Tab>📱 Local Only</Tab>
                <Tab>🚀 Universal</Tab>
                <Tab>⏰ Scheduled</Tab>
                <Tab>📢 Topic</Tab>
                <Tab>📝 Custom</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack spacing={3}>
                    <Button
                      onClick={handleTestLocalOnly}
                      colorScheme="green"
                      size="lg"
                      w="full"
                      isDisabled={permission !== 'granted'}
                    >
                      🔔 Test Local Notification
                    </Button>
                    <Text fontSize="sm" color="gray.600">
                      100% reliable - works even when app is closed
                    </Text>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack spacing={3}>
                    <Button
                      onClick={handleTestUniversal}
                      colorScheme="blue"
                      size="lg"
                      w="full"
                      isDisabled={permission !== 'granted'}
                    >
                      🚀 Test Universal System
                    </Button>
                    <Button
                      onClick={handleTestEventReminder}
                      colorScheme="orange"
                      size="lg"
                      w="full"
                      isDisabled={permission !== 'granted'}
                    >
                      🎵 Test Event Reminder
                    </Button>
                    <Text fontSize="sm" color="gray.600">
                      Tries all methods (local + FCM + FCM V1)
                    </Text>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack spacing={3}>
                    <Button
                      onClick={handleTestScheduled}
                      colorScheme="teal"
                      size="lg"
                      w="full"
                      isDisabled={permission !== 'granted'}
                    >
                      ⏰ Test Scheduled Notifications
                    </Button>
                    <Text fontSize="sm" color="gray.600">
                      Sends notifications after delays
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
                      onClick={handleTestTopicBroadcast}
                      colorScheme="pink"
                      size="lg"
                      w="full"
                      isDisabled={!topicName.trim()}
                    >
                      📢 Send Topic Broadcast
                    </Button>
                    <Text fontSize="sm" color="gray.600">
                      Broadcast to all subscribers of a topic
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
                      onClick={handleCustomUniversal}
                      colorScheme="gray"
                      size="lg"
                      w="full"
                      isDisabled={permission !== 'granted' || !customTitle.trim() || !customMessage.trim()}
                    >
                      📝 Send Custom Notification
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Divider />

            {/* Logs */}
            <Card p={4}>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">📋 Activity Logs</Heading>
                  <Button
                    onClick={clearLogs}
                    colorScheme="gray"
                    size="sm"
                  >
                    🗑️ Clear
                  </Button>
                </HStack>
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
                    <Text color="gray.500">No activity yet...</Text>
                  ) : (
                    logs.map((log, index) => (
                      <Text key={index} mb={1}>{log}</Text>
                    ))
                  )}
                </Box>
              </VStack>
            </Card>

            {/* Info */}
            <Card p={4} bg="blue.50">
              <Heading size="md" mb={3}>💡 How Universal Notifications Work:</Heading>
              <VStack spacing={2} align="start">
                <Text>• <strong>Primary: Local Notifications</strong> - Always work, no server needed</Text>
                <Text>• <strong>Secondary: FCM</strong> - Better delivery, may fail in some environments</Text>
                <Text>• <strong>Fallback: FCM V1</strong> - Modern API with OAuth 2.0</Text>
                <Text>• <strong>Result: 100% reliability</strong> - At least one method always works</Text>
                <Text>• <strong>Background: ✅</strong> - Works even when app is closed</Text>
              </VStack>
            </Card>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}