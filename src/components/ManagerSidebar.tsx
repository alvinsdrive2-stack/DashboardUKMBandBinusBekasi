'use client';

import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from '@chakra-ui/react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Divider,
  Tooltip,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Avatar,
  Badge,
  Heading,
} from '@chakra-ui/react';
import {
  HomeIcon,
  CalendarDaysIcon,
  UsersIcon,
  ClipboardDocumentIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface ManagerSidebarProps {
  activeRoute: string;
}

export default function ManagerSidebar({ activeRoute }: ManagerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [buttonTranslateX, setButtonTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Detect mobile screen size
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [hasShownHint, setHasShownHint] = useState(false);

  // Hide hint after first interaction or after 5 seconds
  useEffect(() => {
    if (showSwipeHint && !hasShownHint && isMobile) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        setHasShownHint(true);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [showSwipeHint, hasShownHint, isMobile]);

  // Hide hint when user starts swiping
  useEffect(() => {
    if (isSwiping) {
      setShowSwipeHint(false);
      setHasShownHint(true);
    }
  }, [isSwiping]);

  // Function to get role text in Indonesian
  const getRoleText = (organizationLvl: string) => {
    switch (organizationLvl) {
      case 'COMMISSIONER':
        return 'Komisaris';
      case 'PENGURUS':
        return 'Pengurus';
      case 'SPECTA':
        return 'Specta';
      case 'TALENT':
        return 'Talent';
      default:
        return organizationLvl;
    }
  };

  // Global swipe gesture handlers
  const handleGlobalTouchStart = (e: TouchEvent) => {
    const touchX = e.touches[0].clientX;
    console.log('Global touch start at:', touchX);

    // Only detect swipe from left edge of screen (first 100px)
    if (touchX <= 10000) {
      touchStartX.current = touchX;
      touchEndX.current = touchX;
      setIsSwiping(true);
      console.log('Global swipe gesture started at:', touchX);
    }
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (!isSwiping || touchStartX.current === null) return;

    const currentX = e.touches[0].clientX;
    touchEndX.current = currentX;

    // Calculate distance and direction
    const diff = currentX - touchStartX.current;
    console.log('Global touch move - Current:', currentX, 'Start:', touchStartX.current, 'Diff:', diff);

    // For opening: only allow right swipe (positive diff)
    // For closing: allow left swipe when sidebar is open
    if (!isOpen && diff > 0) {
      // Visual feedback during swipe
      if (diff <= 200) {
        setButtonTranslateX(diff * 0.5); // Scale down the movement
      }
    } else if (isOpen && diff < 0) {
      // Allow left swipe to close
      const closeDiff = Math.abs(diff);
      if (closeDiff <= 200) {
        setButtonTranslateX(-closeDiff * 0.5);
      }
    }
  };

  const handleGlobalTouchEnd = () => {
    if (!isSwiping || touchStartX.current === null || touchEndX.current === null) {
      resetSwipeState();
      return;
    }

    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 80; // Reduced minimum distance for easier detection

    console.log('Global touch ended - Distance:', swipeDistance, 'Required:', minSwipeDistance);

    // Detect swipe and perform action
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      setShowSwipeHint(false);

      if (swipeDistance > 30) { // Right swipe to open
        if (!isOpen) {
          console.log('Opening sidebar via global swipe');
          onOpen();
          animateButtonSlide();
        }
      } else if (swipeDistance < -30) { // Left swipe to close
        if (isOpen) {
          console.log('Closing sidebar via global swipe');
          onClose();
        }
      }
    }

    resetSwipeState();
  };

  const resetSwipeState = () => {
    setTimeout(() => setButtonTranslateX(0), 100);
    touchStartX.current = null;
    touchEndX.current = null;
    setIsSwiping(false);
  };

  const animateButtonSlide = () => {
    setButtonTranslateX(200);
    setTimeout(() => setButtonTranslateX(0), 300);
  };

  // Add global event listeners for touch events
  useEffect(() => {
    // Only add global listeners on mobile devices
    if (isMobile) {
      document.addEventListener('touchstart', handleGlobalTouchStart, { passive: false });
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });

      // Clean up event listeners when component unmounts
      return () => {
        document.removeEventListener('touchstart', handleGlobalTouchStart);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
      };
    }
  }, [isMobile, isOpen, isSwiping]);

  // Hide swipe hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Reset button position when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setButtonTranslateX(0);
    }
  }, [isOpen]);

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

  const getUserInitial = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Sidebar content component
  const SidebarContent = () => (
    <>
      {/* Scrollable Content Area */}
      <Box flex="1" overflowY="auto">
        {/* Header with Logo */}
        <Box p={{ base: 4, md: 6 }} borderBottom="1px solid" borderColor={borderColor}>
          <HStack spacing="3">
            <Box
              p={{ base: 1.5, md: 2 }}
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <img
                src="/icons/favicon.png"
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
                Manager Dashboard
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* User Profile Card */}
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
                size={{ base: 'md', md: 'md' }}
                name={session?.user?.name || 'Manager'}
                bg={accentColor}
                color="white"
                fontWeight="600"
                border="2px solid"
                borderColor="#fecaca"
                boxShadow="0 4px 12px rgba(220, 38, 38, 0.2)"
                flexShrink={0}
              >
                <Text fontSize={{ base: 'sm', md: 'sm' }}>
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'M'}
                </Text>
              </Avatar>
              <VStack align="start" spacing={{ base: 1, md: 2 }} flex="1">
                <Text fontSize={{ base: 'xs', md: 'sm' }} color={textColor} fontWeight="600" noOfLines={1}>
                  {session?.user?.name || 'Manager'}
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
                  {session?.user?.organizationLvl ? getRoleText(session.user.organizationLvl) : 'Administrator'}
                </Badge>
              </VStack>
            </HStack>
          </Box>
        </Box>

        {/* Navigation */}
        <Box py={{ base: 2, md: 3 }} px={{ base: 3, md: 4 }}>
          <VStack spacing="1" align="stretch">
            <Text
              fontSize="9px"
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
              const active = isActive(item.route);
              return (
                <Tooltip
                  key={item.route}
                  label={item.label}
                  placement="right"
                  hasArrow
                  bg="gray.900"
                  color="white"
                  fontSize="sm"
                  borderRadius="lg"
                  isDisabled={isOpen}
                >
                  <Box
                    position="relative"
                    w="full"
                    p={{ base: 1.5, md: 2 }}
                    borderRadius="lg"
                    cursor="pointer"
                    transition="all 0.2s ease"
                    bg={active ? accentColor : 'transparent'}
                    _hover={{
                      bg: active ? accentColor : hoverBg,
                      transform: "translateX(2px)",
                    }}
                    onClick={() => router.push(item.route)}
                    border="1px solid"
                    borderColor={active ? 'transparent' : 'transparent'}
                    boxShadow={active ? '0 2px 8px rgba(220, 38, 38, 0.2)' : 'none'}
                  >
                    <HStack spacing="2" align="center">
                      <Box
                        p="1.5"
                        borderRadius="md"
                        bg={active ? 'whiteAlpha.200' : cardBg}
                      >
                        <Icon
                          as={item.icon}
                          width={{ base: 12, md: 10 }}
                          height={{ base: 12, md: 10 }}
                          color={active ? 'white' : secondaryTextColor}
                          transition="all 0.2s ease"
                          sx={{
                            '&:hover': {
                              width: { base: '10px', md: '8px' },
                              height: { base: '10px', md: '8px' }
                            }
                          }}
                        />
                      </Box>
                      <Text
                        fontSize={{ base: '12px', md: 'xs' }}
                        fontWeight={active ? ({ base: '700', md: '600' }) : { base: '600', md: '500' }}
                        color={active ? 'white' : textColor}
                        flex="1"
                      >
                        {item.label}
                      </Text>
                    </HStack>
                  </Box>
                </Tooltip>
              );
            })}
          </VStack>
        </Box>
      </Box>

      {/* Fixed Logout Button at Bottom */}
      <Box
        p={{ base: 4, md: 4 }}
        borderTop="1px solid"
        borderColor={borderColor}
        bg={sidebarBg}
        flexShrink={0}
      >
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
          leftIcon={
            <Icon
              as={ArrowRightOnRectangleIcon}
              className="logout-icon-mobile"
              sx={{
                '@media (max-width: 768px)': {
                  width: '16px',
                  height: '16px'
                },
                '@media (min-width: 769px)': {
                  width: '36px',
                  height: '36px'
                }
              }}
            />
          }
          fontWeight="600"
          fontSize={{ base: 'sm', md: 'sm' }}
          isLoading={isLoggingOut}
        >
          Sign Out
        </Button>
      </Box>
    </>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <Box
        display={{ base: 'none', md: 'flex' }}
        position="fixed"
        left="0"
        top="0"
        h="100%"
        w="280px"
        bg={sidebarBg}
        color={textColor}
        zIndex="1000"
        boxShadow="lg"
        borderRight="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        justifyContent="space-between"
        flexDirection="column"
      >
        <SidebarContent />
      </Box>

      {/* Slide hint indicator for Mobile Only */}
      {showSwipeHint && !isOpen && isMobile && !hasShownHint && (
        <Box
          position="fixed"
          top="50%"
          left="15px"
          transform={`translateY(-50%) translateX(${buttonTranslateX}px)`}
          display="flex"
          alignItems="center"
          bg="rgba(220, 38, 38, 0.95)"
          color="white"
          px="3"
          py="2"
          borderRadius="full"
          boxShadow="0 4px 12px rgba(0,0,0,0.2)"
          fontSize="sm"
          fontWeight="600"
          zIndex="1600"
          transition="all 0.15s ease-out"
          sx={{
            '@keyframes slideHint': {
              '0%': { transform: `translateY(-50%) translateX(${buttonTranslateX}px)` },
              '50%': { transform: `translateY(-50%) translateX(${Math.min(buttonTranslateX + 15, 80)}px)` },
              '100%': { transform: `translateY(-50%) translateX(${buttonTranslateX}px)` }
            },
            animation: isSwiping ? 'none' : 'slideHint 2.5s ease-in-out infinite'
          }}
        >
          <Text>Slide untuk buka menu</Text>
        </Box>
      )}

      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="xs"
      >
        <DrawerOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
        <DrawerContent
          bg={sidebarBg}
          borderRight="1px solid"
          borderColor={borderColor}
          display="flex"
          flexDirection="column"
          h="100dvh"
          w="80vw"
          overflow="hidden"
        >
          {/* Use same SidebarContent as desktop */}
          <Box flex="1" display="flex" flexDirection="column" h="100%">
            <SidebarContent />
          </Box>
        </DrawerContent>
      </Drawer>
    </>
  );
}