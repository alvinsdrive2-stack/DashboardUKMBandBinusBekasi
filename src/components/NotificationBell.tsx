'use client';

import {
  Box,
  Icon,
  Text,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export default function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  const iconColor = useColorModeValue('#4b5563', '#e5e7eb');
  const badgeBg = useColorModeValue('#dc2626', '#ef4444');

  return (
    <Box
      position="relative"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{
        transform: 'scale(1.1)',
      }}
      _active={{
        transform: 'scale(0.95)',
      }}
    >
      <BellIcon
        width="20px"
        height="20px"
        color={iconColor}
      />

      {/* Badge untuk unread count */}
      {unreadCount > 0 && (
        <Badge
          position="absolute"
          top="-6px"
          right="-6px"
          bg={badgeBg}
          color="white"
          borderRadius="full"
          minW="18px"
          h="18px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="10px"
          fontWeight="bold"
          border="2px solid"
          borderColor="white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Box>
  );
}