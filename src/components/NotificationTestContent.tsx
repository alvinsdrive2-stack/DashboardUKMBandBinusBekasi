'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  useToast,
  Heading,
  Alert,
  AlertIcon,
  Button,
  Input,
  Textarea,
  Select,
  Text,
  Divider,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { $Enums } from '@/generated/prisma';
import notificationService from '@/services/notificationService';

// Component for the actual notification testing content
export default function NotificationTestContent() {
  const { data: session } = useSession();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [testNotification, setTestNotification] = useState({
    userId: '',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'EVENT_REMINDER' as $Enums.NotificationType,
    eventId: '',
    actionUrl: ''
  });

  const [reminderResult, setReminderResult] = useState<any>(null);

  const handleCreateTestNotification = async () => {
    if (!testNotification.userId) {
      toast({
        title: 'Error',
        description: 'User ID is required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testNotification),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Test notification created successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Failed to create notification');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create notification',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerReminders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/schedule-reminders');
      const result = await response.json();

      if (response.ok) {
        setReminderResult(result);
        toast({
          title: 'Success',
          description: 'Reminders scheduled successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Failed to schedule reminders');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule reminders',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNotificationForCurrentUser = async () => {
    if (!session?.user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await notificationService.createNotification({
        title: 'Test Notification for You',
        message: 'This is a test notification created just for you!',
        type: 'EVENT_REMINDER',
        actionUrl: '/dashboard/member'
      });

      toast({
        title: 'Success',
        description: 'Test notification created for you',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create notification',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <Box p={8}>
        <Text>Please log in to access this page.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Notification System Testing</Heading>

      <Alert status="info">
        <AlertIcon />
        This page is for testing the notification system. Only admin users should have access.
      </Alert>

      <Divider />

      {/* Test Notification for Current User */}
      <Box>
        <Heading size="md" mb={4}>Quick Test - Create for Yourself</Heading>
        <Button
          colorScheme="blue"
          onClick={handleCreateNotificationForCurrentUser}
          isLoading={isLoading}
        >
          Create Test Notification for Me
        </Button>
      </Box>

      <Divider />

      {/* Manual Notification Creation */}
      <Box>
        <Heading size="md" mb={4}>Manual Notification Creation</Heading>
        <VStack spacing={4} align="stretch">
          <HStack>
            <Text w="120px">User ID:</Text>
            <Input
              value={testNotification.userId}
              onChange={(e) => setTestNotification(prev => ({ ...prev, userId: e.target.value }))}
              placeholder="Enter user ID"
              flex={1}
            />
          </HStack>

          <HStack>
            <Text w="120px">Title:</Text>
            <Input
              value={testNotification.title}
              onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
              flex={1}
            />
          </HStack>

          <HStack>
            <Text w="120px">Message:</Text>
            <Textarea
              value={testNotification.message}
              onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
              flex={1}
            />
          </HStack>

          <HStack>
            <Text w="120px">Type:</Text>
            <Select
              value={testNotification.type}
              onChange={(e) => setTestNotification(prev => ({ ...prev, type: e.target.value as $Enums.NotificationType }))}
              flex={1}
            >
              <option value="EVENT_REMINDER">Event Reminder</option>
              <option value="PERSONNEL_ASSIGNED">Personnel Assigned</option>
              <option value="EVENT_STATUS_CHANGED">Event Status Changed</option>
              <option value="SONG_ADDED">Song Added</option>
              <option value="DEADLINE_REMINDER">Deadline Reminder</option>
              <option value="SLOT_AVAILABLE">Slot Available</option>
            </Select>
          </HStack>

          <HStack>
            <Text w="120px">Event ID:</Text>
            <Input
              value={testNotification.eventId}
              onChange={(e) => setTestNotification(prev => ({ ...prev, eventId: e.target.value }))}
              placeholder="Optional"
              flex={1}
            />
          </HStack>

          <HStack>
            <Text w="120px">Action URL:</Text>
            <Input
              value={testNotification.actionUrl}
              onChange={(e) => setTestNotification(prev => ({ ...prev, actionUrl: e.target.value }))}
              placeholder="Optional"
              flex={1}
            />
          </HStack>

          <Button
            colorScheme="green"
            onClick={handleCreateTestNotification}
            isLoading={isLoading}
          >
            Create Test Notification
          </Button>
        </VStack>
      </Box>

      <Divider />

      {/* Trigger Event Reminders */}
      <Box>
        <Heading size="md" mb={4}>Trigger Event Reminders</Heading>
        <VStack spacing={4} align="stretch">
          <Text>
            This will check for upcoming events (within 24 hours) and create reminder notifications.
            Normally this would be called by a cron job, but you can trigger it manually here for testing.
          </Text>
          <Button
            colorScheme="purple"
            onClick={handleTriggerReminders}
            isLoading={isLoading}
          >
            Trigger Event Reminders
          </Button>

          {reminderResult && (
            <Box p={4} bg="gray.100" borderRadius="md">
              <Text fontWeight="bold">Result:</Text>
              <pre>{JSON.stringify(reminderResult, null, 2)}</pre>
            </Box>
          )}
        </VStack>
      </Box>

      <Divider />

      {/* Current Session Info */}
      <Box>
        <Heading size="md" mb={4}>Current Session Info</Heading>
        <VStack align="start" spacing={2}>
          <Text><strong>User ID:</strong> {session.user?.id}</Text>
          <Text><strong>Name:</strong> {session.user?.name}</Text>
          <Text><strong>Email:</strong> {session.user?.email}</Text>
        </VStack>
      </Box>
    </VStack>
  );
}