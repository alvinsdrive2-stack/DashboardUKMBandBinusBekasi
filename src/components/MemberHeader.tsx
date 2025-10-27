'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  HStack,
  Text,
  Avatar,
  useColorModeValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';
import notificationService from '@/services/notificationService';
import { useSocketContext } from '@/contexts/SocketContext';
import { useFallbackNotifications } from '@/hooks/useFallbackNotifications';

interface MemberHeaderProps {
  // Tidak ada props yang diperlukan, hanya menggunakan session
}

export default function MemberHeader() {
  const { data: session } = useSession();
  const { isConnected, useFallback } = useSocketContext();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);

  // Fallback notifications
  const fallbackNotifications = useFallbackNotifications();

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch unread count on mount and when notifications might change
  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount();

      // Set up polling for unread count (every 30 seconds) - fallback for WebSocket
      const interval = setInterval(fetchUnreadCount, 30000);

      return () => clearInterval(interval);
    }
  }, [session?.user?.id, fetchUnreadCount]);

  // Show connection status - more tolerant and includes fallback mode
  useEffect(() => {
    if (session?.user?.user?.id) {
      // Check if both Socket.IO and fallback are disconnected
      const timer = setTimeout(() => {
        if (!isConnected && !fallbackNotifications.isConnected) {
          setShowConnectionAlert(true);
        }
      }, 8000); // 8 seconds to show connection alert

      // Hide alert when either Socket.IO or fallback is connected
      if (isConnected || fallbackNotifications.isConnected) {
        setShowConnectionAlert(false);
      }

      return () => clearTimeout(timer);
    }
  }, [session?.user?.id, isConnected, fallbackNotifications.isConnected]);

  // Clean white theme
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const accentColor = '#dc2626';

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleMarkAsRead = (id: string) => {
    // When a notification is marked as read, refresh unread count
    fetchUnreadCount();
  };

  const handleDelete = (id: string) => {
    // When a notification is deleted, refresh unread count
    fetchUnreadCount();
  };

  return (
    <>
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        top="0"
        left="0"
        right="0"
        height="60px"
        bg={bgMain}
        borderBottom="1px solid"
        borderColor="#e5e7eb"
        zIndex="900"
        px="4"
        py="3"
      >
        <HStack spacing="3" height="100%" align="center" justify="space-between">
          {/* Left: Logo */}
          <Box flex="0 0 auto">
            <img
              src="/icons/favicon.png"
              alt="UKM Band Logo"
              width="32"
              height="32"
              style={{ objectFit: 'contain' }}
            />
          </Box>

          {/* Center: Empty Space */}
          <Box flex="1" />

          {/* Right: Notification Bell (menggantikan profile) */}
          <HStack spacing="3" flex="0 0 auto">
            {/* User info di kiri bell */}
            <Box textAlign="right" minW="0" display={{ base: 'none', sm: 'block' }}>
              <Text
                fontSize="11px"
                fontWeight="600"
                color={textPrimary}
                noOfLines={1}
                textOverflow="ellipsis"
              >
                {session?.user?.name?.split(' ')[0]}
              </Text>
              <Text
                fontSize="9px"
                color={textSecondary}
                noOfLines={1}
              >
                Anggota
              </Text>
            </Box>

            {/* Notification Bell */}
            <NotificationBell
              unreadCount={unreadCount}
              onClick={handleNotificationClick}
            />

            {/* Small avatar untuk mobile */}
            <Avatar
              size="xs"
              name={session?.user?.name}
              bg={accentColor}
              color="white"
              fontWeight="600"
              border="1px solid"
              borderColor="#fecaca"
              flexShrink={0}
              display={{ base: 'none', sm: 'flex' }}
            >
              <Text fontSize="8px">
                {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </Avatar>
          </HStack>
        </HStack>
      </Box>

      {/* Connection Status Alert */}
      {showConnectionAlert && !isConnected && (
        <Box
          position="fixed"
          top="70px"
          left="50%"
          transform="translateX(-50%)"
          zIndex="9999"
          maxW="350px"
          w="calc(100% - 32px)"
        >
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              Real-time notifications disconnected. Using polling mode.
              {!isConnected && useFallback && (
                <Text fontSize="xs" color="gray.600" mt={1}>
                  WebSocket unavailable, using API polling for updates.
                </Text>
              )}
            </Text>
          </Alert>
        </Box>
      )}

      {/* Connection Status Indicator */}
      {isConnected && (
        <Box
          position="absolute"
          top="2px"
          right="2px"
          w="8px"
          h="8px"
          bg="green.500"
          borderRadius="full"
          border="2px solid white"
          title="Real-time notifications connected"
        />
      )}

      {/* Notification Dropdown */}
      <NotificationDropdown
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />
    </>
  );
}