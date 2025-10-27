'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Button,
  Alert,
  AlertIcon,
  useToast,
  Heading,
  Divider,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  Badge,
  Spinner,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { usePushNotification } from '@/hooks/usePushNotification';
import { useState, useEffect } from 'react';
import { TestIcon, BellIcon } from '@chakra-ui/icons';

export default function PWASettings() {
  const toast = useToast();
  const {
    isSupported,
    permission,
    subscription,
    isSubscribed,
    subscribe,
    unsubscribe,
    requestPermission,
    testPushNotification,
    isLoading,
    error
  } = usePushNotification();

  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstalling(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: 'Success',
        description: 'PWA installed successfully!',
        status: 'success',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Cancelled',
        description: 'PWA installation cancelled',
        status: 'info',
        duration: 3000,
      });
    }

    setDeferredPrompt(null);
    setIsInstalling(false);
  };

  const handleSubscribe = async () => {
    const success = await subscribe();

    if (success) {
      toast({
        title: 'Success',
        description: 'Push notifications enabled!',
        status: 'success',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Failed',
        description: 'Failed to enable push notifications',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();

    if (success) {
      toast({
        title: 'Success',
        description: 'Push notifications disabled',
        status: 'info',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Failed',
        description: 'Failed to disable push notifications',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();

    if (granted) {
      toast({
        title: 'Success',
        description: 'Notification permission granted',
        status: 'success',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Permission Denied',
        description: 'Notification permission denied',
        status: 'warning',
        duration: 3000,
      });
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { color: 'green', text: 'Granted', icon: '✓' };
      case 'denied':
        return { color: 'red', text: 'Denied', icon: '✗' };
      default:
        return { color: 'yellow', text: 'Not Requested', icon: '?' };
    }
  };

  const getBrowserSupportStatus = () => {
    if (isSubscribed) {
      return { color: 'green', text: 'Subscribed', icon: '🔔' };
    } else if (isSupported) {
      return { color: 'blue', text: 'Supported', icon: '📱' };
    } else {
      return { color: 'red', text: 'Not Supported', icon: '❌' };
    }
  };

  const permissionStatus = getPermissionStatus();
  const browserSupportStatus = getBrowserSupportStatus();

  return (
    <Box p={6} maxW="600px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">PWA & Notification Settings</Heading>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        {/* Browser Support Status */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="600">Browser Support</Text>
            <Badge colorScheme={browserSupportStatus.color}>
              {browserSupportStatus.icon} {browserSupportStatus.text}
            </Badge>
          </HStack>

          {!isSupported && (
            <Alert status="error">
              <AlertIcon />
              <Text fontSize="sm">
                Your browser doesn't support PWA features. Please try using a modern browser like Chrome, Firefox, or Edge.
              </Text>
            </Alert>
          )}
        </Box>

        <Divider />

        {/* PWA Installation */}
        {isSupported && (
          <Box>
            <Heading size="md" mb={4}>PWA Installation</Heading>

            {isInstalling ? (
              <Button
                colorScheme="blue"
                onClick={handleInstallPWA}
                size="md"
                w="full"
              >
                  Install App
                </Button>
            ) : (
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm">
                    This app can be installed on your device for offline access and a native app-like experience.
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Installable: {isInstalling ? 'Yes' : 'No'}
                  </Text>
                </VStack>
              </Alert>
            )}
          </Box>
        )}

        <Divider />

        {/* Push Notifications */}
        {isSupported && (
          <Box>
            <Heading size="md" mb={4}>Push Notifications</Heading>

            <VStack spacing={4} align="stretch">
              {/* Permission Status */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="600">Permission Status</Text>
                  <Badge colorScheme={permissionStatus.color}>
                    {permissionStatus.icon} {permissionStatus.text}
                  </Badge>
                </HStack>

                {permission === 'default' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestPermission}
                    w="full"
                  >
                    Request Permission
                  </Button>
                )}

                {permission === 'denied' && (
                  <Alert status="warning">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">
                        Notification permission was denied. Please enable it in your browser settings.
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Look for the lock icon (🔒) in the address bar and allow notifications.
                      </Text>
                    </VStack>
                  </Alert>
                )}
              </Box>

              {/* Subscription Management */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="600">Push Notifications</Text>
                  <Badge colorScheme={isSubscribed ? 'green' : 'gray'}>
                    {isSubscribed ? 'Active' : 'Inactive'}
                  </Badge>
                </HStack>

                {permission === 'granted' && (
                  <Button
                    colorScheme={isSubscribed ? 'red' : 'green'}
                    onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                    size="md"
                    w="full"
                  >
                    {isSubscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'}
                  </Button>
                )}

                {permission === 'granted' && !isSubscribed && (
                  <Alert status="info">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Enable push notifications to receive alerts even when the app is closed or in the background.
                    </Text>
                  </Alert>
                )}

                {isSubscribed && (
                  <>
                    <Button
                      variant="outline"
                      colorScheme="blue"
                      onClick={testPushNotification}
                      size="sm"
                      w="full"
                      isLoading={isLoading}
                      leftIcon={<BellIcon />}
                    >
                      Test Push Notification
                    </Button>

                    <Alert status="success">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm">
                          Push notifications are active! You'll receive real-time alerts for:
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • 🎸 Practice reminders (every 3 days)
                          • 🗓️ Event reminders (1 day before)
                          • 🏃‍♂️ Gather reminders (2 hours before)
                          • 🎉 New events published
                          • 👥 User joins team
                          • 🎵 Songs added to events
                          • 📊 Event status changes
                        </Text>
                      </VStack>
                    </Alert>
                  </>
                )}
              </Box>
            </VStack>
          </Box>
        )}

        <Divider />

        {/* Features Overview */}
        <Box>
          <Heading size="md" mb={4}>Features Overview</Heading>

          <VStack spacing={3} align="start">
            <Box>
              <Text fontWeight="600" color="blue.600">🔔 Real-time Notifications</Text>
              <Text fontSize="sm" color="gray.600">Instant updates via WebSocket</Text>
            </Box>

            <Box>
              <Text fontWeight="600" color="green.600">📱 Push Notifications</Text>
              <Text fontSize="sm" color="gray.600">Alerts even when app is closed</Text>
            </Box>

            <Box>
              <Text fontWeight="600" color="purple.600">📱 Installable App</Text>
              <Text fontSize="sm" color="gray.600">Add to home screen for easy access</Text>
            </Box>

            <Box>
              <Text fontWeight="600" color="orange.600">📱 Offline Support</Text>
              <Text fontSize="sm" color="gray.600">Works without internet connection</Text>
            </Box>

            <Box>
              <Text fontWeight="600" color="teal.600">📋 App Shortcuts</Text>
              <Text fontSize="sm" color="gray.600">Quick access to Dashboard & Events</Text>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}