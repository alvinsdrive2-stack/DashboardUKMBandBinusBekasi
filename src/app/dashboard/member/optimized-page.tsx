'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import MemberSidebar from '@/components/MemberSidebar';
import OptimizedEventCalendar from '@/components/OptimizedEventCalendar';
import StatsCards from '@/components/StatsCards';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function OptimizedMemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Use optimized dashboard data hook
  const {
    events,
    publishedEvents,
    participationStats,
    loading,
    error,
    refetch
  } = useDashboardData();

  // Color scheme
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const alertBg = '#f3f4f6';
  const borderColor = '#e5e7eb';
  const accentColor = '#3b82f6';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' &&
               (session?.user?.organizationLvl === 'COMMISSIONER' ||
                session?.user?.organizationLvl === 'PENGURUS')) {
      router.push('/dashboard/manager');
    }
  }, [status, session, router]);

  // Helper functions
  const getUserRegistrations = () => {
    if (!session?.user?.id) return [];
    return events.flatMap((event: any) =>
      event.personnel.filter((p: any) => p.userId === session.user.id)
        .map((p: any) => ({
          ...p,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
          userName: session.user.name
        }))
    );
  };

  const getUpcomingEvents = () => {
    const registrations = getUserRegistrations();
    return registrations
      .filter(reg => new Date(reg.eventDate) > new Date())
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 3);
  };

  const getUserStats = () => {
    if (!participationStats) {
      return {
        participations: 0,
        rank: 0,
        isTopPerformer: false,
        totalMembers: 0
      };
    }

    return {
      participations: participationStats.user?.participations || 0,
      rank: participationStats.user?.rank || 0,
      isTopPerformer: participationStats.user?.isTopPerformer || false,
      totalMembers: participationStats.statistics?.totalMembers || 0
    };
  };

  // Combine all events for calendar
  const allEvents = Array.from(
    new Map([...events, ...publishedEvents].map(event => [event.id, event])).values()
  );

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
  };

  const userStats = getUserStats();
  const upcomingEvents = getUpcomingEvents();

  if (!isClient) {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgMain}>
      <MemberSidebar activeRoute="dashboard" />

      <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
        {/* Loading state */}
        {loading && (
          <Box
            position="fixed"
            top="0"
            left={{ base: 0, md: '280px' }}
            right="0"
            bottom="0"
            bg="rgba(255, 255, 255, 0.95)"
            backdropFilter="blur(8px)"
            zIndex="999"
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
            gap="4"
          >
            <div>Loading dashboard...</div>
          </Box>
        )}

        {/* Error state */}
        {error && (
          <Box>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Error loading dashboard</Text>
                <Text fontSize="sm">{error}</Text>
              </Box>
            </Alert>
            <Button mt="4" onClick={refetch}>
              Retry
            </Button>
          </Box>
        )}

        {/* Main content */}
        {!loading && !error && (
          <VStack spacing="6" align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="lg" color={textPrimary}>Dashboard Anggota</Heading>
                <Text color={textSecondary}>Selamat datang, <b>{session.user.name}!</b></Text>
              </Box>
              <HStack>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={refetch}
                  _hover={{ bg: '#f3f4f6' }}
                  borderRadius="md"
                >
                  Refresh
                </Button>
              </HStack>
            </Flex>

            {/* Alert */}
            <Alert status="info" borderRadius="md" bg={alertBg} borderColor={borderColor} borderWidth="1px">
              <AlertIcon color={accentColor} />
              <Box>
                <Text fontWeight="bold" color={textPrimary}>Dashboard dengan Kalender Event:</Text>
                <Text fontSize="sm" color={textSecondary}>
                  Lihat kalender event dan statistik partisipasi Anda dalam satu tampilan yang komprehensif.
                </Text>
              </Box>
            </Alert>

            {/* Main Content - Calendar 70% + Stats 30% */}
            <Box
              display={{ base: 'block', lg: 'flex' }}
              gap="6"
              alignItems="flex-start"
            >
              {/* Calendar - Desktop 70%, Mobile 100% */}
              <Box
                flex={{ base: '1', lg: '0 0 70%' }}
                mb={{ base: '6', lg: '0' }}
              >
                <OptimizedEventCalendar
                  events={allEvents}
                  userId={session.user.id}
                  onEventClick={handleEventClick}
                  loading={loading}
                />
              </Box>

              {/* Stats Sidebar - Desktop 30%, Mobile 100% */}
              <Box
                flex={{ base: '1', lg: '0 0 30%' }}
                position={{ base: 'static', lg: 'sticky' }}
                top={{ base: 'auto', lg: '8' }}
              >
                <VStack spacing="4" align="stretch">
                  <Text
                    fontSize={{ base: 'md', lg: 'lg' }}
                    fontWeight="600"
                    color={textPrimary}
                    display={{ base: 'none', lg: 'block' }}
                  >
                    Statistik Anda
                  </Text>
                  <StatsCards
                    participations={userStats.participations}
                    performanceScore={userStats.participations}
                    totalEvents={publishedEvents.length}
                    rank={userStats.rank}
                    totalMembers={userStats.totalMembers}
                    isTopPerformer={userStats.isTopPerformer}
                    isLoading={loading}
                  />
                </VStack>
              </Box>
            </Box>

            {/* Quick Action Buttons */}
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="4">
              <Button
                size="lg"
                height="48px"
                bg="#eff6ff"
                color={textPrimary}
                fontWeight="600"
                fontSize="md"
                borderRadius="xl"
                boxShadow="md"
                border="1px solid"
                borderColor="rgba(59, 130, 246, 0.3)"
                _hover={{
                  bg: "#dbeafe",
                  transform: "translateY(-2px)",
                  boxShadow: "lg",
                  borderColor: 'rgba(59, 130, 246, 0.5)'
                }}
                _active={{
                  transform: "translateY(0)"
                }}
                onClick={() => router.push('/dashboard/member/available-events')}
              >
                Jelajahi Event
              </Button>
              <Button
                size="lg"
                height="48px"
                bg="#eff6ff"
                color={textPrimary}
                fontWeight="600"
                fontSize="md"
                borderRadius="xl"
                boxShadow="md"
                border="1px solid"
                borderColor="rgba(59, 130, 246, 0.3)"
                _hover={{
                  bg: "#dbeafe",
                  transform: "translateY(-2px)",
                  boxShadow: "lg",
                  borderColor: 'rgba(59, 130, 246, 0.5)'
                }}
                _active={{
                  transform: "translateY(0)"
                }}
                onClick={() => router.push('/dashboard/member/schedule')}
              >
                Jadwal Saya
              </Button>
            </SimpleGrid>
          </VStack>
        )}
      </Box>
    </Box>
  );
}