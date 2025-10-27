'use client';

import { useState, useEffect } from 'react';
import { Box, Button, VStack, Text, Heading, Alert, AlertIcon, Input, Textarea } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function TestLocalPush() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('Test Notification');
  const [notificationMessage, setNotificationMessage] = useState('This is a test local notification!');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 30));
  };

  useEffect(() => {
    if (session) {
      addLog(`✅ Logged in as ${session.user.name}`);
    }
    checkExistingSubscription();
  }, [session]);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      addLog(!!subscription ? '✅ Found existing subscription' : '❌ No existing subscription');
    } catch (error) {
      addLog(`❌ Error checking subscription: ${error.message}`);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      addLog(`📋 Permission result: ${permission}`);

      if (permission === 'granted') {
        addLog('✅ Permission granted! You can now send local notifications.');

        // Test immediate notification
        const notification = new Notification('Permission Granted!', {
          body: 'You can now receive notifications from UKM Band Dashboard',
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png'
        });
        setTimeout(() => notification.close(), 3000);
      } else {
        addLog('❌ Permission denied');
      }
    } catch (error) {
      addLog(`❌ Error requesting permission: ${error.message}`);
    }
  };

  const subscribeToNotifications = async () => {
    try {
      addLog('🔄 Starting notification subscription...');

      // Request permission first
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        addLog('❌ Permission required for notifications');
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw-simple.js');
      addLog(`✅ Service worker registered: ${registration.scope}`);

      // Subscribe to push (basic, no VAPID)
      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true
        });
        addLog('✅ Basic subscription successful!');
        setIsSubscribed(true);

        // Test immediate notification
        sendLocalNotification('Subscription Success!', 'You are now subscribed to notifications');

      } catch (error) {
        addLog(`❌ Subscription failed: ${error.message}`);
        addLog('💡 But you can still use local notifications!');
      }

    } catch (error) {
      addLog(`❌ Error in subscription process: ${error.message}`);
    }
  };

  const sendLocalNotification = (title?: string, message?: string) => {
    try {
      if (Notification.permission !== 'granted') {
        addLog('❌ Permission not granted. Click "Request Permission" first.');
        return;
      }

      const notification = new Notification(
        title || notificationTitle,
        {
          body: message || notificationMessage,
          icon: '/icons/favicon.png',
          badge: '/icons/favicon.png',
          tag: 'local-notification',
          requireInteraction: false,
          silent: false
        }
      );

      addLog(`✅ Local notification sent: "${title || notificationTitle}"`);

      setTimeout(() => {
        notification.close();
      }, 5000);

    } catch (error) {
      addLog(`❌ Error sending local notification: ${error.message}`);
    }
  };

  const testNotificationFromServer = async () => {
    if (!session?.user?.id) {
      addLog('❌ User not logged in');
      return;
    }

    try {
      addLog('📤 Sending notification from server...');

      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'EVENT_REMINDER'
        })
      });

      if (response.ok) {
        addLog('✅ Notification created successfully!');

        // Also show local notification
        sendLocalNotification();

      } else {
        const error = await response.json();
        addLog(`❌ Failed to create notification: ${error.error}`);
      }

    } catch (error) {
      addLog(`❌ Error creating notification: ${error.message}`);
    }
  };

  const clearNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markAllAsRead'
        })
      });

      if (response.ok) {
        addLog('✅ All notifications marked as read');
      } else {
        addLog('❌ Failed to clear notifications');
      }
    } catch (error) {
      addLog(`❌ Error clearing notifications: ${error.message}`);
    }
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔔 Local Notification Test</Heading>
          <Text color="gray.600">Test browser notifications without VAPID dependencies</Text>
        </Box>

        {!session && (
          <Alert status="warning">
            <AlertIcon />
            <Text>Please sign in to test notifications</Text>
          </Alert>
        )}

        {session && (
          <VStack spacing={4} align="stretch">
            {/* Permission Section */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📋 Notification Permission</Heading>
              <VStack spacing={2}>
                <Button onClick={requestPermission} colorScheme="blue" size="lg">
                  🔔 Request Notification Permission
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Required to show notifications in your browser
                </Text>
              </VStack>
            </Box>

            {/* Subscription Section */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📡 Notification Subscription</Heading>
              <VStack spacing={2}>
                <Button
                  onClick={subscribeToNotifications}
                  colorScheme="green"
                  size="lg"
                  isDisabled={isSubscribed}
                >
                  {isSubscribed ? '✅ Already Subscribed' : '📡 Subscribe to Notifications'}
                </Button>
                <Text fontSize="sm" color="gray.600">
                  {isSubscribed ? 'You are subscribed to notifications' : 'Subscribe for better notification handling'}
                </Text>
              </VStack>
            </Box>

            {/* Test Local Notification */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>📱 Test Local Notification</Heading>
              <VStack spacing={3}>
                <Input
                  placeholder="Notification Title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Notification Message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={3}
                />
                <Button onClick={() => sendLocalNotification()} colorScheme="purple" size="lg">
                  📱 Send Local Notification
                </Button>
              </VStack>
            </Box>

            {/* Server Notification */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>🌐 Test Server Notification</Heading>
              <VStack spacing={2}>
                <Button onClick={testNotificationFromServer} colorScheme="orange" size="lg">
                  📤 Create Notification in Server
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Creates a notification that appears in your notification bell
                </Text>
              </VStack>
            </Box>

            {/* Clear Notifications */}
            <Button onClick={clearNotifications} colorScheme="gray" size="sm">
              🧹 Clear All Notifications
            </Button>

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
                  <Text color="gray.500">No activity yet...</Text>
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