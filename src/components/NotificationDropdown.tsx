'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Divider,
  Button,
  useColorModeValue,
  Fade,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import {
  CalendarIcon,
  TimeIcon,
  CheckIcon,
  CloseIcon,
  WarningIcon,
  ViewIcon,
} from '@chakra-ui/icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/generated/prisma';
import notificationService from '@/services/notificationService';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete
}: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle notification click with navigation
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }

    // Close dropdown
    onClose();

    // Navigate based on actionUrl
    if (notification.actionUrl) {
      console.log('🔗 Navigating to:', notification.actionUrl);

      // Parse actionUrl and construct proper navigation
      try {
        const url = new URL(notification.actionUrl, window.location.origin);
        const pathname = url.pathname;
        const searchParams = url.searchParams;

        // Handle different action types
        if (pathname.includes('/dashboard/member/schedule')) {
          // For schedule page, check if we need to open modal
          if (notification.eventId) {
            // Add query parameters for modal
            const params = new URLSearchParams(searchParams);
            params.set('modal', 'open');
            params.set('eventId', notification.eventId);

            const newUrl = `${pathname}?${params.toString()}`;
            console.log('🎯 Redirecting to schedule with modal:', newUrl);
            router.push(newUrl);
          } else {
            router.push(notification.actionUrl);
          }
        } else if (pathname.includes('/dashboard/songs')) {
          // For songs page with eventId
          if (notification.eventId) {
            const params = new URLSearchParams(searchParams);
            params.set('eventId', notification.eventId);

            const newUrl = `${pathname}?${params.toString()}`;
            console.log('🎵 Redirecting to songs:', newUrl);
            router.push(newUrl);
          } else {
            router.push(notification.actionUrl);
          }
        } else {
          // Default navigation
          console.log('🔗 Default navigation to:', notification.actionUrl);
          router.push(notification.actionUrl);
        }
      } catch (error) {
        console.error('❌ Error parsing actionUrl:', error);
        // Fallback to direct navigation
        router.push(notification.actionUrl);
      }
    } else {
      console.log('⚠️ No actionUrl for notification:', notification.id);
    }
  }, [onMarkAsRead, onClose, router]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationService.getNotifications(1, 20);
      setNotifications(response.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Gagal memuat notifikasi');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const bgCard = useColorModeValue('#ffffff', '#2d3748');
  const bgHover = useColorModeValue('#f9fafb', '#374151');
  const textPrimary = useColorModeValue('#1f2937', '#f9fafb');
  const textSecondary = useColorModeValue('#6b7280', '#9ca3af');
  const borderColor = useColorModeValue('#e5e7eb', '#4b5563');
  const bgUnread = useColorModeValue('#fef2f2', '#450a0a');
  const bgIconDefault = useColorModeValue('#f3f4f6', '#4b5563');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EVENT_REMINDER':
        return CalendarIcon;
      case 'PERSONNEL_ASSIGNED':
        return ViewIcon;
      case 'SONG_ADDED':
        return WarningIcon;
      case 'DEADLINE_REMINDER':
        return TimeIcon;
      default:
        return WarningIcon;
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const notificationDate = date instanceof Date ? date : new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) {
      return `${diffInMins} menit lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    } else {
      return `${diffInDays} hari lalu`;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setIsLoading(true);

    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      onMarkAsRead(id);
    } catch (err) {
      console.error('Failed to mark as read:', err);
      setError('Gagal menandai sebagai dibaca');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);

    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      onDelete(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setError('Gagal menghapus notifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);

    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setError('Gagal menandai semua sebagai dibaca');
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom-end"
      closeOnBlur={false}
    >
      <PopoverTrigger>
        <Box />
      </PopoverTrigger>
      <Portal>
        <PopoverContent
          w="380px"
          maxH="500px"
          overflow="hidden"
          bg={bgCard}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          boxShadow="lg"
        >
          <PopoverBody p={0}>
            {/* Header */}
            <Box
              p={4}
              borderBottom="1px solid"
              borderColor={borderColor}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text
                fontSize="14px"
                fontWeight="600"
                color={textPrimary}
              >
                Notifikasi
                {unreadCount > 0 && (
                  <Text
                    as="span"
                    ml={2}
                    fontSize="12px"
                    color="#dc2626"
                    fontWeight="normal"
                  >
                    ({unreadCount} baru)
                  </Text>
                )}
              </Text>
              <Button
                size="xs"
                variant="ghost"
                fontSize="11px"
                color={textSecondary}
                _hover={{ color: textPrimary }}
                onClick={handleMarkAllAsRead}
                isDisabled={unreadCount === 0 || isLoading}
              >
                Tandai semua dibaca
              </Button>
            </Box>

            {/* Notification List */}
            <Box
              maxH="400px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: borderColor,
                  borderRadius: '2px',
                },
              }}
            >
              {error ? (
                <Box
                  p={8}
                  textAlign="center"
                  color="#dc2626"
                >
                  <WarningIcon boxSize="32px" color="#dc2626" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <Text fontSize="14px">{error}</Text>
                  <Button
                    size="sm"
                    mt={4}
                    variant="outline"
                    color="#dc2626"
                    borderColor="#dc2626"
                    onClick={fetchNotifications}
                    isLoading={isLoading}
                  >
                    Coba Lagi
                  </Button>
                </Box>
              ) : isLoading && notifications.length === 0 ? (
                <Box
                  p={8}
                  textAlign="center"
                  color={textSecondary}
                >
                  <Spinner size="lg" />
                  <Text fontSize="14px" mt={4}>Memuat notifikasi...</Text>
                </Box>
              ) : notifications.length === 0 ? (
                <Box
                  p={8}
                  textAlign="center"
                  color={textSecondary}
                >
                  <WarningIcon boxSize="32px" color={textSecondary} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <Text fontSize="14px">Belum ada notifikasi</Text>
                </Box>
              ) : (
                <VStack spacing={0} align="stretch">
                  {notifications.map((notification, index) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    const isUnread = !notification.isRead;

                    return (
                      <Box key={notification.id}>
                        <Box
                          p={4}
                          bg={isUnread ? bgUnread : 'transparent'}
                          _hover={{ bg: bgHover }}
                          cursor="pointer"
                          transition="background-color 0.2s"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <HStack spacing={3} align="start">
                            {/* Icon */}
                            <Box
                              p={2}
                              bg={isUnread ? '#dc2626' : bgIconDefault}
                              borderRadius="full"
                              flexShrink={0}
                            >
                              <IconComponent
                                boxSize="14px"
                                color={isUnread ? 'white' : textSecondary}
                              />
                            </Box>

                            {/* Content */}
                            <Box flex={1} minW="0">
                              <Text
                                fontSize="13px"
                                fontWeight={isUnread ? '600' : '500'}
                                color={textPrimary}
                                noOfLines={1}
                              >
                                {notification.title}
                              </Text>
                              <Text
                                fontSize="12px"
                                color={textSecondary}
                                noOfLines={2}
                                mt={1}
                              >
                                {notification.message}
                              </Text>
                              <Text
                                fontSize="11px"
                                color={textSecondary}
                                mt={2}
                              >
                                {formatTimeAgo(notification.createdAt)}
                              </Text>
                            </Box>

                            {/* Actions */}
                            <HStack spacing={1} flexShrink={0}>
                              {isUnread && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  p={1}
                                  minW="auto"
                                  h="auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  isDisabled={isLoading}
                                >
                                  <CheckIcon boxSize="12px" color={textSecondary} />
                                </Button>
                              )}
                              <Button
                                size="xs"
                                variant="ghost"
                                p={1}
                                minW="auto"
                                h="auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                                isDisabled={isLoading}
                              >
                                <CloseIcon boxSize="12px" color="#dc2626" />
                              </Button>
                            </HStack>
                          </HStack>
                        </Box>

                        {index < notifications.length - 1 && (
                          <Divider borderColor={borderColor} />
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>

            {/* Footer */}
            <Box
              p={3}
              borderTop="1px solid"
              borderColor={borderColor}
              textAlign="center"
            >
              <Button
                size="sm"
                variant="ghost"
                fontSize="12px"
                color={textSecondary}
                _hover={{ color: textPrimary }}
              >
                Lihat semua notifikasi
              </Button>
            </Box>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}