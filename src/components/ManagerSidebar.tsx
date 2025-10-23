'use client';

import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import {
  HomeIcon,
  CalendarDaysIcon,
  UsersIcon,
  ClipboardDocumentIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

interface ManagerSidebarProps {
  activeRoute: string;
}

export default function ManagerSidebar({ activeRoute }: ManagerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- Tema ---
  const sidebarBg = '#ffffff';
  const textColor = '#1f2937';
  const secondaryTextColor = '#6b7280';
  const borderColor = '#e5e7eb';
  const accentColor = '#dc2626';
  const cardBg = '#f9fafb';
  const hoverBg = '#f3f4f6';

  const menuItems = [
    {
      label: 'Dashboard',
      icon: HomeIcon,
      route: '/dashboard/manager',
    },
    {
      label: 'Semua Event',
      icon: CalendarDaysIcon,
      route: '/dashboard/manager/events',
    },
    {
      label: 'Monitoring Member',
      icon: UsersIcon,
      route: '/dashboard/manager/members',
    }
  ];

  const isActive = (route: string) => {
    if (route === '/dashboard/manager') return pathname === route;
    return pathname.startsWith(route);
  };

  // --- Logout ---
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        callbackUrl: '/auth/signin',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      h="full"
      w={{ base: 'full', md: '280px' }}
      bg={sidebarBg}
      color={textColor}
      borderRight="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
      zIndex="sticky"
      display="flex"
      flexDirection="column"
    >
      {/* ====== HEADER ====== */}
      <Box p="6" borderBottom="1px solid" borderColor={borderColor}>
        <VStack spacing="2" align="start">
          <HStack spacing="3">
            <Box
              p="1.5"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <img
                src="https://i.imgur.com/YZICojL.png"
                alt="UKM Band Logo"
                width={60}
                height={60}
                style={{ objectFit: 'contain' }}
              />
            </Box>
            <VStack spacing="0" align="start">
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                UKM Band
              </Text>
              <Text
                fontSize="xs"
                color={secondaryTextColor}
                fontWeight="normal"
              >
                Manager Panel
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      {/* ====== NAVIGATION MENU ====== */}
      <Box flex="1" py="4" px="4" overflowY="auto">
        <VStack spacing="1" align="stretch">
          <Text
            fontSize="10px"
            fontWeight="700"
            color={secondaryTextColor}
            textTransform="uppercase"
            letterSpacing="wider"
            mb="1"
            px="1"
          >
            Navigation
          </Text>

          {menuItems.map((item) => {
            const isItemActive = isActive(item.route);
            return (
              <Tooltip
                key={item.route}
                label={item.label}
                placement="right"
                bg="gray.900"
                color="white"
                hasArrow
                borderRadius="lg"
              >
                <Box
                  w="full"
                  p="3"
                  borderRadius="xl"
                  cursor="pointer"
                  onClick={() => router.push(item.route)}
                  transition="all 0.2s ease"
                  bg={isItemActive ? accentColor : 'transparent'}
                  color={isItemActive ? 'white' : textColor}
                  fontWeight={isItemActive ? '600' : '500'}
                  boxShadow={
                    isItemActive ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'
                  }
                  _hover={{
                    bg: isItemActive ? accentColor : hoverBg,
                    transform: 'translateX(4px)',
                    color: isItemActive ? 'white' : textColor,
                  }}
                >
                  <HStack spacing="3" align="center">
                    <Box
                      p="2"
                      borderRadius="lg"
                      bg={isItemActive ? 'whiteAlpha.200' : cardBg}
                    >
                      <Icon
                        as={item.icon}
                        width={18}
                        height={18}
                        color={
                          isItemActive ? 'white' : secondaryTextColor
                        }
                      />
                    </Box>
                    <Text
                      fontSize="sm"
                      fontWeight={isItemActive ? '600' : '500'}
                      color={isItemActive ? 'white' : textColor}
                      flex="1"
                    >
                      {item.label}
                    </Text>
                  </HStack>
                </Box>
              </Tooltip>
            );
          })}

          <Divider borderColor={borderColor} my="2" />
        </VStack>
      </Box>

      {/* ====== LOGOUT BUTTON ====== */}
      <Box p="4" borderTop="1px solid" borderColor={borderColor}>
        <Button
          w="full"
          size="md"
          bg={cardBg}
          color={textColor}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          _hover={{
            bg: hoverBg,
            borderColor: secondaryTextColor,
            transform: 'translateY(-2px)',
          }}
          _active={{
            transform: 'translateY(0)',
          }}
          transition="all 0.2s ease"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          loadingText="Keluar..."
          leftIcon={<Icon as={ChevronLeftIcon} width={18} height={18} />}
          fontWeight="600"
          fontSize="sm"
        >
          Keluar
        </Button>
      </Box>
    </Box>
  );
}
