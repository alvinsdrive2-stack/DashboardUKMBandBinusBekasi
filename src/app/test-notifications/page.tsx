'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useSocketContext } from '@/contexts/SocketContext';
import { Box, Button, VStack, HStack, Text, Heading, Divider, Alert, AlertIcon, useToast, Input, Textarea, Select } from '@chakra-ui/react';
import notificationService from '@/services/notificationService';

export default function TestNotifications() {
  const { data: session, status } = useSession();
  const { isConnected, notifications } = useSocketContext();
  const [logs, setLogs] = useState<string[]>([]);
  const [notificationForm, setNotificationForm] = useState({
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'EVENT_REMINDER',
    eventId: '',
    actionUrl: ''
  });
  const [targetUserId, setTargetUserId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const toast = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20)); // Keep last 20 logs
  };

  useEffect(() => {
    if (status === 'authenticated') {
      addLog(`✅ Logged in as ${session.user.name} (${session.user.id})`);
      fetchNotifications();
    } else if (status === 'unauthenticated') {
      addLog('❌ Not authenticated');
    }
  }, [status, session]);

  useEffect(() => {
    addLog(`🔌 Socket status: ${isConnected ? 'Connected' : 'Disconnected'}`);
  }, [isConnected]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotif = notifications[0];
      addLog(`📨 New notification received: ${latestNotif.title}`);
      toast({
        title: "New Notification!",
        description: latestNotif.message,
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      addLog('🔄 Fetching notifications...');
      const response = await notificationService.getNotifications(1, 10);
      setNotificationsList(response.notifications || []);
      addLog(`✅ Fetched ${response.notifications?.length || 0} notifications`);
    } catch (error) {
      addLog(`❌ Failed to fetch notifications: ${error}`);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unreadCount);
      addLog(`📊 Unread count: ${response.unreadCount}`);
    } catch (error) {
      addLog(`❌ Failed to fetch unread count: ${error}`);
    }
  };

  const createNotification = async () => {
    try {
      addLog('📤 Creating notification...');
      const notificationData = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        eventId: notificationForm.eventId || undefined,
        actionUrl: notificationForm.actionUrl || undefined
      };

      const response = await notificationService.createNotification(notificationData);
      addLog(`✅ Notification created: ${response.notification.title}`);
      fetchNotifications();
      fetchUnreadCount();

      toast({
        title: "Success!",
        description: "Notification created successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      addLog(`❌ Failed to create notification: ${error}`);
      toast({
        title: "Error!",
        description: "Failed to create notification",
        status: "error",
        duration: 3000,
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      addLog(`📖 Marking notification as read: ${notificationId}`);
      await notificationService.markAsRead(notificationId);
      addLog('✅ Notification marked as read');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      addLog(`❌ Failed to mark as read: ${error}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      addLog('📖 Marking all notifications as read...');
      await notificationService.markAllAsRead();
      addLog('✅ All notifications marked as read');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      addLog(`❌ Failed to mark all as read: ${error}`);
    }
  };

  const clearLogs = () => setLogs([]);

  const simulateEventCreation = async () => {
    try {
      addLog('🎵 Simulating event creation...');
      const response = await fetch('/api/events/manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Event for Notifications',
          description: 'This is a test event created from notification test page',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          location: 'Test Location',
          slotConfigurable: false
        })
      });

      if (response.ok) {
        addLog('✅ Test event created - notifications should be sent to all members');
        toast({
          title: "Event Created!",
          description: "Test event created successfully",
          status: "success",
          duration: 3000,
        });
      } else {
        const error = await response.json();
        addLog(`❌ Failed to create test event: ${error.error}`);
      }
    } catch (error) {
      addLog(`❌ Error creating test event: ${error}`);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="2xl" mb={2}>🔔 Notification System Test</Heading>
          <Text color="gray.600">Test real-time notifications and system functionality</Text>
        </Box>

        {/* Connection Status */}
        <Alert status={isConnected ? 'success' : 'warning'}>
          <AlertIcon />
          <Text>
            Socket Status: <strong>{isConnected ? 'Connected' : 'Disconnected'}</strong>
            {status === 'authenticated' && (
              <> | User: <strong>{session.user.name}</strong> ({session.user.id})</>
            )}
          </Text>
        </Alert>

        <HStack spacing={4} align="stretch">
          {/* Left Column - Controls */}
          <VStack spacing={4} flex={1} align="stretch">
            {/* Auth Section */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Authentication</Heading>
              {status === 'authenticated' ? (
                <VStack spacing={2}>
                  <Text>✅ Signed in as {session.user.name}</Text>
                  <Button onClick={() => signOut()} colorScheme="red" size="sm">
                    Sign Out
                  </Button>
                </VStack>
              ) : (
                <Button onClick={() => signIn()} colorScheme="blue">
                  Sign In
                </Button>
              )}
            </Box>

            {/* Create Notification */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Create Test Notification</Heading>
              <VStack spacing={3}>
                <Input
                  placeholder="Notification Title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Notification Message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                />
                <Select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="EVENT_REMINDER">Event Reminder</option>
                  <option value="PERSONNEL_ASSIGNED">User Joined Event</option>
                  <option value="EVENT_STATUS_CHANGED">Event Status Changed</option>
                  <option value="SONG_ADDED">Song Added</option>
                  <option value="DEADLINE_REMINDER">Deadline Reminder</option>
                  <option value="SLOT_AVAILABLE">Slot Available</option>
                </Select>
                <Input
                  placeholder="Event ID (optional)"
                  value={notificationForm.eventId}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, eventId: e.target.value }))}
                />
                <Button onClick={createNotification} colorScheme="blue" isDisabled={!session}>
                  Create Notification
                </Button>
              </VStack>
            </Box>

            {/* Quick Actions */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Quick Actions</Heading>
              <VStack spacing={2}>
                <Button onClick={fetchNotifications} colorScheme="green" size="sm">
                  🔄 Refresh Notifications
                </Button>
                <Button onClick={fetchUnreadCount} colorScheme="purple" size="sm">
                  📊 Get Unread Count
                </Button>
                <Button onClick={markAllAsRead} colorScheme="orange" size="sm">
                  📖 Mark All as Read
                </Button>
                <Button onClick={simulateEventCreation} colorScheme="teal" size="sm">
                  🎵 Simulate Event Creation
                </Button>
                <Button onClick={clearLogs} colorScheme="gray" size="sm">
                  🧹 Clear Logs
                </Button>
              </VStack>
            </Box>

            {/* Stats */}
            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={3}>Statistics</Heading>
              <VStack spacing={2} align="start">
                <Text>📨 Unread Count: <strong>{unreadCount}</strong></Text>
                <Text>📝 Total Notifications: <strong>{notificationsList.length}</strong></Text>
                <Text>🔌 Real-time Notifications: <strong>{notifications.length}</strong></Text>
              </VStack>
            </Box>
          </VStack>

          {/* Right Column - Logs and Notifications */}
          <VStack spacing={4} flex={1} align="stretch">
            {/* Logs */}
            <Box p={4} borderWidth={1} borderRadius="md" flex={1}>
              <Heading size="md" mb={3}>System Logs</Heading>
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

            {/* Recent Notifications */}
            <Box p={4} borderWidth={1} borderRadius="md" flex={1}>
              <Heading size="md" mb={3}>Recent Notifications</Heading>
              <Box
                bg="gray.50"
                p={3}
                borderRadius="md"
                height="300px"
                overflowY="auto"
              >
                {notificationsList.length === 0 ? (
                  <Text color="gray.500">No notifications...</Text>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {notificationsList.map((notif) => (
                      <Box
                        key={notif.id}
                        p={3}
                        bg={notif.isRead ? 'white' : 'blue.50'}
                        borderWidth={1}
                        borderRadius="md"
                        borderColor={notif.isRead ? 'gray.200' : 'blue.200'}
                      >
                        <VStack spacing={1} align="start">
                          <HStack justify="space-between" width="100%">
                            <Text fontWeight="bold" fontSize="sm">{notif.title}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(notif.createdAt).toLocaleString()}
                            </Text>
                          </HStack>
                          <Text fontSize="sm">{notif.message}</Text>
                          <Text fontSize="xs" color="gray.600">Type: {notif.type}</Text>
                          {!notif.isRead && (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              onClick={() => markAsRead(notif.id)}
                              alignSelf="flex-end"
                            >
                              Mark as Read
                            </Button>
                          )}
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Box>
          </VStack>
        </HStack>

        {/* Instructions */}
        <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
          <Heading size="md" mb={2}>📖 How to Test</Heading>
          <VStack spacing={1} align="start">
            <Text>• <strong>Real-time Test:</strong> Open this page in two different browser windows with different users</Text>
            <Text>• <strong>Create Notification:</strong> Send a notification and see it appear in real-time</Text>
            <Text>• <strong>Simulate Event:</strong> Create a test event to trigger bulk notifications</Text>
            <Text>• <strong>Check Connection:</strong> Look for the green indicator showing Socket.IO connection</Text>
            <Text>• <strong>Monitor Logs:</strong> Watch the system logs for real-time updates</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}