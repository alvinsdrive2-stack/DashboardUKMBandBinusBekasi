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
  useMediaQuery,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePageTransition, useSmartPreload } from '@/hooks/usePageTransition';
import { useEffect, useState, useRef } from 'react';

interface MemberSidebarProps {
  activeRoute: string;
  onMobileMenuToggle?: () => void;
}

export default function MemberSidebar({ activeRoute }: MemberSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { navigateWithTransition } = usePageTransition();
  const { preload } = useSmartPreload();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [availableEventsCount, setAvailableEventsCount] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [buttonTranslateX, setButtonTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

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

  // Global swipe gesture handlers
  const handleGlobalTouchStart = (e: TouchEvent) => {
    const touchX = e.touches[0].clientX;
    console.log('Global touch start at:', touchX); // Debug log

    // Only detect swipe from left edge of screen (first 100px)
    if (touchX <= 30000) {
      touchStartX.current = touchX;
      touchEndX.current = touchX;
      setIsSwiping(true);
      console.log('Global swipe gesture started at:', touchX); // Debug log
    }
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (!isSwiping || touchStartX.current === null) return;

    const currentX = e.touches[0].clientX;
    touchEndX.current = currentX;

    // Calculate distance and direction
    const diff = currentX - touchStartX.current;
    console.log('Global touch move - Current:', currentX, 'Start:', touchStartX.current, 'Diff:', diff); // Debug log

    // For opening: only allow right swipe (positive diff)
    // For closing: allow left swipe when sidebar is open
    if (!isOpen && diff > 0) {
      // Visual feedback during swipe
      if (diff <= 200) {
        setButtonTranslateX(diff * 0.3); // Scale down the movement
      }
    } else if (isOpen && diff < 0) {
      // Allow left swipe to close
      const closeDiff = Math.abs(diff);
      if (closeDiff <= 200) {
        setButtonTranslateX(-closeDiff * 0.3);
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

    console.log('Global touch ended - Distance:', swipeDistance, 'Required:', minSwipeDistance); // Debug log

    // Detect swipe and perform action
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      setShowSwipeHint(false);

      if (swipeDistance > 30) { // Right swipe to open
        if (!isOpen) {
          console.log('Opening sidebar via global swipe'); // Debug log
          onOpen();
          animateButtonSlide();
        }
      } else if (swipeDistance < -30) { // Left swipe to close
        if (isOpen) {
          console.log('Closing sidebar via global swipe'); // Debug log
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

  // Hide swipe hint after 5 seconds or after first swipe
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
      preload('/api/events/member', 'events_data', 200);
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
                  size={{ base: 'md', md: 'md' }}
                  name={session.user.name}
                  bg={accentColor}
                  color="white"
                  fontWeight="600"
                  border="2px solid"
                  borderColor="#fecaca"
                  boxShadow="0 4px 12px rgba(220, 38, 38, 0.2)"
                  flexShrink={0}
                >
                  <Text fontSize={{ base: 'sm', md: 'sm' }}>
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
                    Peran
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
                    p={{ base: 1.5, md: 2 }}
                    borderRadius="lg"
                    cursor="pointer"
                    transition="all 0.2s ease"
                    bg={isActive ? accentColor : 'transparent'}
                    _hover={{
                      bg: isActive ? accentColor : hoverBg,
                      transform: "translateX(2px)",
                    }}
                    onClick={() => handleNavigation(item.href, item.label)}
                    onMouseEnter={() => handleMenuHover(item.href)}
                    border="1px solid"
                    borderColor={isActive ? 'transparent' : 'transparent'}
                    boxShadow={isActive ? '0 2px 8px rgba(220, 38, 38, 0.2)' : 'none'}
                  >
                    <HStack spacing="2" align="center">
                      <Box
                        p="1.5"
                        borderRadius="md"
                        bg={isActive ? 'whiteAlpha.200' : cardBg}
                      >
                        <Icon
                          as={item.icon}
                          width={{ base: 12, md: 10 }}
                          height={{ base: 12, md: 10 }}
                          color={isActive ? 'white' : secondaryTextColor}
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
                        fontWeight={isActive ? ( { base: '700', md: '600' } ) : { base: '600', md: '500' }}
                        color={isActive ? 'white' : textColor}
                        flex="1"
                      >
                        {item.label}
                      </Text>
                      {item.badge && (
                        <Badge
                          bg="#ef4444"
                          color="white"
                          fontSize="10px"
                          px="1.5"
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
      label: 'Jadwal Saya',
      icon: CalendarDaysIcon,
      href: '/dashboard/member/schedule',
      description: 'Upcoming Events',
    },
    {
      id: 'events',
      label: 'Daftar Event',
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
            animation: isSwiping ? 'none' : 'slideHint 2.0s ease-in-out infinite'
          }}
        >
          <ChevronLeftIcon width={16} height={16} style={{ marginRight: '4px' }} />
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