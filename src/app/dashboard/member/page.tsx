'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '@/hooks/usePageTransition';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';
import MemberSidebar from '@/components/MemberSidebar';
import MemberHeader from '@/components/MemberHeader';
import OptimizedEventCalendar from '@/components/OptimizedEventCalendar';
import StatsCards from '@/components/StatsCards';
import Footer from '@/components/Footer';
import { useOptimizedDashboard, useRealtimeDashboard } from '@/hooks/useOptimizedDashboard';

export default function MemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { TransitionOverlay } = usePageTransition();
  const [isClient, setIsClient] = useState(false);

  // Use optimized dashboard data hook dengan React Query
  const {
    data: dashboardData,
    isLoading: loading,
    isRefetching,
    isError,
    error,
    refresh,
    isRefreshing,
    lastUpdated,
    cacheHit,
    isOnline
  } = useRealtimeDashboard({
    page: 1,
    limit: 20,
    includeStats: true,
    autoRefresh: false, // Nonaktifkan auto refresh karena noCache sudah fetch fresh data
    refreshInterval: 5000,
    noCache: true // Nonaktifkan cache sepenuhnya
  });

  // Extract data dari dashboardData
  const events = (dashboardData as any)?.events?.dashboard || [];
  const publishedEvents = (dashboardData as any)?.events?.member || [];
  const participationStats = (dashboardData as any)?.stats;

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

  


  
  
  // Combine all events for calendar, removing duplicates
  const allEvents = Array.from(
    new Map([...events, ...publishedEvents].map(event => [event.id, event])).values()
  );

  const handleEventClick = (event: EventWithPersonnel) => {
    console.log('Event clicked:', event);
    console.log('Event personnel:', event.personnel);
    console.log('Personnel length:', event.personnel?.length || 0);
    // Navigate to event details or show modal
  };

  const getUserStats = () => {
    if (!participationStats?.userStats || loading) {
      return {
        participations: 0,
        rank: 0,
        isTopPerformer: false,
        totalMembers: 0
      };
    }

    // Cari user rank dari data ranking
    const userRankData = (participationStats as any).ranking?.find((r: any) => r.name === session?.user?.name);

    return {
      participations: participationStats.userStats?.approved_count || 0,
      rank: userRankData ? participationStats.ranking.indexOf(userRankData) + 1 : 0,
      isTopPerformer: userRankData ? userRankData.participation_count > 0 && participationStats.ranking.indexOf(userRankData) < 5 : false,
      totalMembers: participationStats.ranking?.length || 0
    };
  };

  const userStats = getUserStats();

  
  // Clean white theme
// Clean white theme
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const alertBg = '#f3f4f6';
  const borderColor = '#e5e7eb';
  const accentColor = '#dc2626';
  const accentBg = '#fef2f2';

  if (!isClient) {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgMain}>
      <MemberSidebar activeRoute="dashboard" />
      <TransitionOverlay />

      {/* Mobile Header */}
      <MemberHeader />

      <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 8 }}>
        {loading && (
          <Box
            position="fixed"
            top={{ base: '60px', md: 0 }}
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
            <Spinner size="xl" color={accentColor} />
          </Box>
        )}

        <VStack spacing="6" align="stretch">
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary}>Dashboard Anggota</Heading>
              <Text color={textSecondary}>
                Selamat datang, {session.user.name}!
                {!isOnline && (
                  <Text as="span" color="orange.500" fontSize="sm" ml="2">
                    • Offline
                  </Text>
                )}
              </Text>
            </Box>
           
          </Flex>

          <Alert status="info" borderRadius="md" bg={alertBg} borderColor={borderColor} borderWidth="1px">
            <AlertIcon color={accentColor} />
            <Box>
              <Text fontWeight="bold" color={textPrimary}>Dashboard dengan Kalender Event:</Text>
              <Text fontSize="sm" color={textSecondary}>
                Lihat kalender event dan statistik partisipasi Anda dalam satu tampilan yang komprehensif.
              </Text>
            </Box>
          </Alert>

          {isError && error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text>
                Error memuat data: {error instanceof Error ? error.message : 'Unknown error'}
                {!isOnline && (
                  <Text fontSize="sm" mt="1">
                    Periksa koneksi internet Anda dan coba lagi.
                  </Text>
                )}
              </Text>
            </Alert>
          )}

          {!loading && !isError && (!participationStats || !participationStats.userStats) && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Belum Ada Data Statistik</Text>
                <Text fontSize="sm">
                  Data statistik partisipasi akan muncul setelah ada event dan partisipasi.
                </Text>
              </Box>
            </Alert>
          )}

          {/* Calendar Section - 70:30 Layout */}
          <Box
            display={{ base: 'block', lg: 'flex' }}
            gap="6"
            alignItems="flex-start"
          >
            {/* Calendar - 70% */}
            <Box
              flex={{ base: '1', lg: '0 0 70%' }}
              mb={{ base: '6', lg: '0' }}
            >
              <OptimizedEventCalendar
                events={allEvents}
                userId={session.user.id}
                onEventClick={handleEventClick}
              />
            </Box>

            {/* Stats Sidebar - 30% */}
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
                  display={{ base: 'block', lg: 'block' }}
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

        </VStack>
        <Footer />
      </Box>
    </Box>
  );
}