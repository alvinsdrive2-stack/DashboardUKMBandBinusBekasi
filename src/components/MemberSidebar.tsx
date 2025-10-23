'use client';

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Icon,
  Divider,
  Tooltip,
  useDisclosure,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePageTransition, useSmartPreload } from '@/hooks/usePageTransition';
import { useEffect, useState } from 'react';

interface MemberSidebarProps {
  activeRoute: string;
  onMobileMenuToggle?: () => void;
}

export default function MemberSidebar({ activeRoute }: MemberSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { navigateWithTransition } = usePageTransition();
  const { preloadData } = useSmartPreload();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [availableEventsCount, setAvailableEventsCount] = useState<number>(0);

  // Fetch available events count for badge
  useEffect(() => {
    const fetchAvailableEventsCount = async () => {
      try {
        const response = await fetch('/api/events/member');
        if (response.ok) {
          const data = await response.json();
          const events = data.events || data || [];

          // Filter events that are upcoming (date >= today)
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to start of day for comparison

          const upcomingEvents = events.filter((event: any) => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
          });

          setAvailableEventsCount(upcomingEvents.length);
        }
      } catch (error) {
        console.error('Error fetching available events count:', error);
      }
    };

    fetchAvailableEventsCount();
  }, []);

  // Preload data on hover
  const handleMenuHover = (href: string) => {
    // Preload events data when hovering over menu items
    if (href.includes('schedule') || href.includes('available-events')) {
      preloadData('/api/events/member', 'events_data', 200);
    }
  };

  const handleNavigation = (href: string, label: string) => {
    navigateWithTransition(href, `Memuat ${label}...`);
    // Close mobile drawer after navigation
    if (isOpen) {
      onClose();
    }
  };

  // Clean white theme with red accent
  const sidebarBg = '#ffffff';
  const cardBg = '#f9fafb';
  const hoverBg = '#f3f4f6';
  const activeBg = '#dc2626';
  const textColor = '#1f2937';
  const secondaryTextColor = '#6b7280';
  const borderColor = '#e5e7eb';
  const accentColor = '#dc2626';

  // Sidebar content component
  const SidebarContent = () => (
    <>
      {/* Header with Logo */}
      <Box p={{ base: 4, md: 6 }} borderBottom="1px solid" borderColor={borderColor}>
        <HStack spacing="3">
          <Box
            bg={accentColor}
            p={{ base: 1.5, md: 2 }}
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 4px 12px rgba(220, 38, 38, 0.3)"
          >
            <img
              src="https://i.imgur.com/YZICojL.png"
              alt="UKM Band Logo"
              width={60}
              height={60}
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <VStack spacing="0" align="start" flex="1">
            <Heading size={{ base: 'sm', md: 'md' }} color={textColor} fontWeight="700" letterSpacing="tight">
              UKM Band
            </Heading>
            <Text fontSize={{ base: '10px', md: 'xs' }} color={secondaryTextColor} fontWeight="500">
              Bekasi Music Community
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* User Profile Card */}
      {session?.user && (
        <Box p={{ base: 3, md: 4 }} borderBottom="1px solid" borderColor={borderColor}>
          <Box
            p={{ base: 3, md: 4 }}
            borderRadius="xl"
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            transition="all 0.3s"
          >
            <HStack spacing={{ base: 2, md: 3 }} mb="3" align="start">
              <Avatar
                size={{ base: 'sm', md: 'md' }}
                name={session.user.name}
                bg={accentColor}
                color="white"
                fontWeight="600"
                border="2px solid"
                borderColor="#fecaca"
                boxShadow="0 4px 12px rgba(220, 38, 38, 0.2)"
                flexShrink={0}
              >
                <Text fontSize={{ base: 'xs', md: 'sm' }}>
                  {getUserInitial(session.user.name)}
                </Text>
              </Avatar>
              <VStack align="start" spacing={{ base: 1, md: 2 }} flex="1">
                <Text fontSize={{ base: 'xs', md: 'sm' }} color={textColor} fontWeight="600" noOfLines={1}>
                  {session.user.name}
                </Text>
                <Badge
                  bg="#fef2f2"
                  color={accentColor}
                  fontSize={{ base: '10px', md: 'xs' }}
                  px={{ base: 2, md: 2.5 }}
                  py="1"
                  borderRadius="md"
                  fontWeight="600"
                  textTransform="capitalize"
                  border="1px solid"
                  borderColor="#fecaca"
                >
                  {session.user.organizationLvl}
                </Badge>
              </VStack>
            </HStack>

            <Divider borderColor={borderColor} my={{ base: 2, md: 3 }} />

            {/* Instruments Section - Container Terpisah */}
            {(session.user as any).instruments && (session.user as any).instruments.length > 0 && (
              <Box>
                <Text fontSize="10px" color={secondaryTextColor} fontWeight="600" mb="2" textTransform="uppercase" letterSpacing="wide">
                  Instruments
                </Text>
                <VStack spacing="2" align="stretch">
                  <HStack spacing="1" flexWrap="wrap">
                    {(session.user as any).instruments.map((instrument: any, index: number) => (
                      <Badge
                        key={index}
                        bg="#fef2f2"
                        color={accentColor}
                        fontSize={{ base: '9px', md: 'xs' }}
                        px={{ base: 1.5, md: 2.5 }}
                        py="1"
                        borderRadius="md"
                        fontWeight="500"
                        border="1px solid"
                        borderColor="#fecaca"
                      >
                        {instrument.name || instrument}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <Box flex="1" py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }} overflowY="auto">
        <VStack spacing="2" align="stretch">
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
            const isActive = activeRoute === item.id;
            return (
              <Tooltip
                key={item.id}
                label={item.description}
                placement="right"
                hasArrow
                bg="gray.900"
                color="white"
                fontSize="sm"
                borderRadius="lg"
                isDisabled={isOpen} // Disable tooltip when drawer is open
              >
                <Box
                  position="relative"
                  w="full"
                  p={{ base: 2, md: 3 }}
                  borderRadius="xl"
                  cursor="pointer"
                  transition="all 0.2s ease"
                  bg={isActive ? accentColor : 'transparent'}
                  _hover={{
                    bg: isActive ? accentColor : hoverBg,
                    transform: "translateX(4px)",
                  }}
                  onClick={() => handleNavigation(item.href, item.label)}
                  onMouseEnter={() => handleMenuHover(item.href)}
                  border="1px solid"
                  borderColor={isActive ? 'transparent' : 'transparent'}
                  boxShadow={isActive ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'}
                >
                  <HStack spacing="3" align="center">
                    <Box
                      p="2"
                      borderRadius="lg"
                      bg={isActive ? 'whiteAlpha.200' : cardBg}
                    >
                      <Icon
                        as={item.icon}
                        width={{ base: 16, md: 18 }}
                        height={{ base: 16, md: 18 }}
                        color={isActive ? 'white' : secondaryTextColor}
                      />
                    </Box>
                    <Text
                      fontSize={{ base: 'sm', md: 'sm' }}
                      fontWeight={isActive ? '600' : '500'}
                      color={isActive ? 'white' : textColor}
                      flex="1"
                    >
                      {item.label}
                    </Text>
                    {item.badge && (
                      <Badge
                        bg="#ef4444"
                        color="white"
                        fontSize="xs"
                        px="2"
                        py="0.5"
                        borderRadius="full"
                        fontWeight="700"
                        boxShadow="0 2px 8px rgba(239, 68, 68, 0.3)"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </Tooltip>
            );
          })}
        </VStack>
      </Box>

      {/* Logout Button */}
      <Box p={{ base: 3, md: 4 }} borderTop="1px solid" borderColor={borderColor}>
        <Button
          w="full"
          size={{ base: 'sm', md: 'md' }}
          bg={cardBg}
          color={textColor}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          _hover={{
            bg: hoverBg,
            borderColor: secondaryTextColor,
            transform: "translateY(-2px)",
          }}
          _active={{
            transform: "translateY(0)",
          }}
          transition="all 0.2s ease"
          onClick={handleLogout}
          leftIcon={<Icon as={ArrowRightOnRectangleIcon} width={{ base: 16, md: 18 }} height={{ base: 16, md: 18 }} />}
          fontWeight="600"
          fontSize={{ base: 'sm', md: 'sm' }}
        >
          Sign Out
        </Button>
      </Box>
    </>
  );

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      href: '/dashboard/member',
      description: 'Kalender & Statistik',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: CalendarDaysIcon,
      href: '/dashboard/member/schedule',
      description: 'Upcoming Events',
    },
    {
      id: 'events',
      label: 'Available Events',
      icon: CheckCircleIcon,
      href: '/dashboard/member/available-events',
      description: 'Join Events',
      badge: availableEventsCount > 0 ? availableEventsCount.toString() : undefined,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitial = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Debug log untuk melihat data user
  console.log('Session user data:', session?.user);
  console.log('User instruments:', (session?.user as any)?.instruments);

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <Box
        display={{ base: 'none', md: 'block' }}
        position="fixed"
        left="0"
        top="0"
        h="100vh"
        w="280px"
        bg={sidebarBg}
        color={textColor}
        zIndex="1000"
        boxShadow="lg"
        borderRight="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        displayFlex="flex"
        flexDirection="column"
      >
        <SidebarContent />
      </Box>

      {/* Mobile Menu Button */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        top="0"
        left="0"
        right="0"
        bg={sidebarBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        p="4"
        zIndex="999"
        boxShadow="sm"
      >
        <HStack justify="space-between" align="center">
          <HStack spacing="3">
            <IconButton
              aria-label="Open menu"
              icon={<Bars3Icon width={20} height={20} />}
              onClick={onOpen}
              bg={accentColor}
              color="white"
              borderRadius="lg"
              _hover={{ bg: '#b91c1c' }}
              _active={{ bg: '#991b1b' }}
            />
            <HStack spacing="2">
              <Box
                bg={accentColor}
                p="1.5"
                borderRadius="lg"
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
              <Box>
                <Heading size="sm" color={textColor} fontWeight="700" letterSpacing="tight">
                  UKM Band
                </Heading>
                <Text fontSize="9px" color={secondaryTextColor} fontWeight="500">
                  Bekasi Music Community
                </Text>
              </Box>
            </HStack>
          </HStack>

          {/* User avatar and info in mobile header */}
          {session?.user && (
            <HStack spacing="2">
              <Avatar
                size="sm"
                name={session.user.name}
                bg={accentColor}
                color="white"
                fontWeight="600"
                border="2px solid"
                borderColor="#fecaca"
              >
                <Text fontSize="10px">
                  {getUserInitial(session.user.name)}
                </Text>
              </Avatar>
              <Box display={{ base: 'block', sm: 'none' }}>
                <Badge
                  bg="#fef2f2"
                  color={accentColor}
                  fontSize="9px"
                  px="2"
                  py="0.5"
                  borderRadius="md"
                  fontWeight="600"
                  textTransform="capitalize"
                  border="1px solid"
                  borderColor="#fecaca"
                >
                  {session.user.organizationLvl}
                </Badge>
              </Box>
            </HStack>
          )}
        </HStack>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="xs"
      >
        <DrawerOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
        <DrawerContent bg={sidebarBg} borderRight="1px solid" borderColor={borderColor}>
          <SidebarContent />
        </DrawerContent>
      </Drawer>
    </>
  );
}