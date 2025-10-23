'use client';

import { Card, CardBody, Stat, StatLabel, StatNumber, VStack, HStack, Box, Icon, Text, Progress, Badge } from '@chakra-ui/react';
import {
  UsersIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  StarIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface StatsCardsProps {
  participations?: number;
  performanceScore?: number;
  totalEvents?: number;
  rank?: number;
  totalMembers?: number;
  isTopPerformer?: boolean;
  isLoading?: boolean;
}

export default function StatsCards({
  participations = 0,
  performanceScore = 0,
  totalEvents = 0,
  rank = 0,
  totalMembers = 0,
  isTopPerformer = false,
  isLoading = false
}: StatsCardsProps) {

  // Color scheme
  const bgCard = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const borderColor = '#e5e7eb';
  const accentColor = '#dc2626';
  const accentBg = '#fef2f2';
  const successColor = '#10b981';
  const successBg = '#f0fdf4';
  const warningColor = '#f59e0b';
  const warningBg = '#fffbeb';
  const purpleColor = '#8b5cf6';
  const purpleBg = '#faf5ff';

  const calculatePerformancePercentage = () => {
    if (totalMembers === 0) return 0;
    return Math.min(100, (participations / Math.max(1, totalMembers)) * 100);
  };

  const getPerformanceLevel = () => {
    const percentage = calculatePerformancePercentage();
    if (percentage >= 80) return { level: 'Sangat Aktif', color: successColor, bg: successBg };
    if (percentage >= 50) return { level: 'Aktif', color: accentColor, bg: accentBg };
    if (percentage >= 25) return { level: 'Normal', color: warningColor, bg: warningBg };
    return { level: 'Pemula', color: '#ef4444', bg: '#fef2f2' };
  };

  const performance = getPerformanceLevel();

  return (
    <VStack spacing="4" align="stretch">
      {/* Partisipasi Card */}
      <Card bg={bgCard} boxShadow="md" borderRadius="lg" border="1px" borderColor={borderColor}>
        <CardBody p="4">
          <HStack spacing="3">
            <Box
              bg={accentBg}
              p="3"
              borderRadius="xl"
              boxShadow="sm"
              border="1px solid"
              borderColor="rgba(220, 38, 38, 0.2)"
            >
              <UsersIcon width={20} height={20} color={accentColor} />
            </Box>
            <VStack align="start" spacing="1" flex="1">
              <Stat>
                <StatLabel color={textSecondary} fontSize="xs" fontWeight="600" textTransform="uppercase">
                  Partisipasi Anda
                </StatLabel>
                <StatNumber color={textPrimary} fontSize="2xl" fontWeight="700">
                  {isLoading ? '-' : participations}
                </StatNumber>
              </Stat>
              <Text fontSize="sm" color={textSecondary}>
                Event terdaftar
              </Text>
            </VStack>
            {isTopPerformer && (
              <Badge bg={warningColor} color="white" px="2" py="1" borderRadius="full" fontSize="xs">
                <StarIcon width={12} height={12} display="inline" mr="1" />
                TOP
              </Badge>
            )}
          </HStack>
        </CardBody>
      </Card>

      {/* Performa Card */}
      <Card bg={bgCard} boxShadow="md" borderRadius="lg" border="1px" borderColor={borderColor}>
        <CardBody p="4">
          <HStack spacing="3" mb="3">
            <Box
              bg={performance.bg}
              p="3"
              borderRadius="xl"
              boxShadow="sm"
              border="1px solid"
              borderColor={`${performance.color}33`}
            >
              <ChartBarIcon width={20} height={20} color={performance.color} />
            </Box>
            <VStack align="start" spacing="1" flex="1">
              <Stat>
                <StatLabel color={textSecondary} fontSize="xs" fontWeight="600" textTransform="uppercase">
                  Performa Anda
                </StatLabel>
                <StatNumber color={textPrimary} fontSize="2xl" fontWeight="700">
                  {isLoading ? '-' : Math.round(calculatePerformancePercentage())}%
                </StatNumber>
              </Stat>
              <Badge
                bg={performance.bg}
                color={performance.color}
                px="2"
                py="1"
                borderRadius="md"
                fontSize="xs"
                fontWeight="600"
              >
                {performance.level}
              </Badge>
            </VStack>
          </HStack>
          <Box>
            <HStack justify="space-between" mb="1">
              <Text fontSize="xs" color={textSecondary}>Progress</Text>
              <Text fontSize="xs" color={textSecondary}>
                {isLoading ? '-%' : `${Math.round(calculatePerformancePercentage())}%`}
              </Text>
            </HStack>
            <Progress
              value={calculatePerformancePercentage()}
              colorScheme={performance.color === successColor ? 'green' : performance.color === accentColor ? 'red' : performance.color === warningColor ? 'yellow' : 'red'}
              h="6px"
              borderRadius="full"
              isAnimated={!isLoading}
            />
          </Box>
        </CardBody>
      </Card>

      {/* Event Total Card */}
      <Card bg={bgCard} boxShadow="md" borderRadius="lg" border="1px" borderColor={borderColor}>
        <CardBody p="4">
          <HStack spacing="3">
            <Box
              bg={purpleBg}
              p="3"
              borderRadius="xl"
              boxShadow="sm"
              border="1px solid"
              borderColor="rgba(139, 92, 246, 0.2)"
            >
              <CalendarDaysIcon width={20} height={20} color={purpleColor} />
            </Box>
            <VStack align="start" spacing="1" flex="1">
              <Stat>
                <StatLabel color={textSecondary} fontSize="xs" fontWeight="600" textTransform="uppercase">
                  Total Event
                </StatLabel>
                <StatNumber color={textPrimary} fontSize="2xl" fontWeight="700">
                  {isLoading ? '-' : totalEvents}
                </StatNumber>
              </Stat>
              <Text fontSize="sm" color={textSecondary}>
                Tersedia untuk registrasi
              </Text>
            </VStack>
            {rank > 0 && totalMembers > 0 && (
              <Badge bg={purpleBg} color={purpleColor} px="2" py="1" borderRadius="full" fontSize="xs">
                <TrophyIcon width={12} height={12} display="inline" mr="1" />
                #{rank}
              </Badge>
            )}
          </HStack>
        </CardBody>
      </Card>

      {/* Ranking Info (if available) */}
      {rank > 0 && totalMembers > 0 && (
        <Card bg={bgCard} boxShadow="md" borderRadius="lg" border="1px" borderColor={borderColor}>
          <CardBody p="4">
            <HStack spacing="3">
              <Box
                bg="linear-gradient(135deg, #f59e0b, #ef4444)"
                p="3"
                borderRadius="xl"
                boxShadow="sm"
              >
                <FireIcon width={20} height={20} color="white" />
              </Box>
              <VStack align="start" spacing="1" flex="1">
                <Stat>
                  <StatLabel color={textSecondary} fontSize="xs" fontWeight="600" textTransform="uppercase">
                    Ranking
                  </StatLabel>
                  <StatNumber color={textPrimary} fontSize="xl" fontWeight="700">
                    #{rank} dari {totalMembers}
                  </StatNumber>
                </Stat>
                <Text fontSize="sm" color={textSecondary}>
                  {isTopPerformer ? 'Top Performer!' : 'Tetap semangat!'}
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}