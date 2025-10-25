'use client';

import { useSession } from 'next-auth/react';
import {
  Box,
  HStack,
  Text,
  Avatar,
} from '@chakra-ui/react';

interface MemberHeaderProps {
  // Tidak ada props yang diperlukan, hanya menggunakan session
}

export default function MemberHeader() {
  const { data: session } = useSession();

  // Clean white theme
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const accentColor = '#dc2626';

  return (
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

        {/* Right: Profile */}
        <HStack spacing="2" flex="0 0 auto">
          <Box textAlign="right" minW="0">
            <Text
              fontSize="12px"
              fontWeight="600"
              color={textPrimary}
              noOfLines={1}
              textOverflow="ellipsis"
            >
              {session?.user?.name}
            </Text>
            <Text
              fontSize="10px"
              color={textSecondary}
              noOfLines={1}
            >
              Anggota
            </Text>
          </Box>
          <Avatar
            size="sm"
            name={session?.user?.name}
            bg={accentColor}
            color="white"
            fontWeight="600"
            border="2px solid"
            borderColor="#fecaca"
            flexShrink={0}
          >
            <Text fontSize="10px">
              {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </Avatar>
        </HStack>
      </HStack>
    </Box>
  );
}