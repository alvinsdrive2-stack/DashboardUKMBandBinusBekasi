'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  ChartBarIcon,
  UserIcon,
  CalendarDaysIcon,
  ChartBarIcon as TrendingUpIcon,
} from '@heroicons/react/24/outline';

interface ParticipationChartProps {
  monthlyData: Array<{
    month: string;
    totalParticipations: number;
    uniqueParticipants: number;
    userParticipations: number;
  }>;
  userStats: {
    participations: number;
    rank: number;
    isTopPerformer: boolean;
  };
  stats: {
    totalMembers: number;
    averageParticipations: number;
    maxParticipations: number;
  };
}

export default function ParticipationChart({
  monthlyData,
  userStats,
  stats
}: ParticipationChartProps) {
  const cardBg = '#ffffff';
  const borderColor = '#e5e7eb';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box bg={cardBg} p="3" borderRadius="md" border="1px" borderColor={borderColor} boxShadow="md">
          <Text fontWeight="bold" color={textPrimary} mb="2">{label}</Text>
          {payload.map((entry: any, index: number) => (
            <HStack key={index} justify="space-between" minW="150px">
              <Text fontSize="sm" color={textSecondary}>
                {entry.name}:
              </Text>
              <Text fontSize="sm" fontWeight="bold" color={entry.color}>
                {entry.value}
              </Text>
            </HStack>
          ))}
        </Box>
      );
    }
    return null;
  };

  const chartColors = {
    user: '#dc2626', // redAccent
    average: '#7c3aed', // purple accent
    total: '#16a34a', // success
    participants: '#ea580c' // orange accent
  };

  return (
    <VStack spacing="6" align="stretch">
      {/* Chart Header */}
    

      {/* Main Line Chart */}
      <Box bg={cardBg} p="6" borderRadius="lg" border="1px" borderColor={borderColor}>
        <Heading size="sm" color={textPrimary} mb="4">Trend Partisipasi Bulanan</Heading>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('corporate.200', 'corporate.700')} />
            <XAxis
              dataKey="month"
              stroke={borderColor}
              tick={{ fill: textSecondary }}
            />
            <YAxis
              stroke={borderColor}
              tick={{ fill: textSecondary }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="userParticipations"
              stroke={chartColors.user}
              strokeWidth={3}
              dot={{ fill: chartColors.user, r: 6 }}
              activeDot={{ r: 8 }}
              name="Partisipasi Anda"
            />
            <Line
              type="monotone"
              dataKey="uniqueParticipants"
              stroke={chartColors.participants}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: chartColors.participants, r: 4 }}
              name="Peserta Unik"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing="2">
              <HStack>
                <Icon as={UserIcon} width={20} height={20} color={chartColors.user} />
                <Text fontSize="sm" color={textSecondary}>Total Partisipasi Anda</Text>
              </HStack>
              <Heading size="lg" color={textPrimary}>{userStats.participations}</Heading>
              <Text fontSize="xs" color={textSecondary}>
                Rata-rata: {stats.averageParticipations} event/anggota
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing="2">
              <HStack>
                <Icon as={TrendingUpIcon} width={20} height={20} color={chartColors.average} />
                <Text fontSize="sm" color={textSecondary}>Performa Anda</Text>
              </HStack>
              <Heading size="lg" color={textPrimary}>
                {userStats.participations > stats.averageParticipations ? '↑' : '→'}
                {' '}
                {userStats.participations > 0
                  ? `${Math.round((userStats.participations / stats.averageParticipations) * 100)}%`
                  : '0%'
                }
              </Heading>
              <Text fontSize="xs" color={textSecondary}>
                {userStats.participations > stats.averageParticipations
                  ? 'Di atas rata-rata'
                  : 'Sekitar rata-rata'
                }
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack align="start" spacing="2">
              <HStack>
                <Icon as={CalendarDaysIcon} width={20} height={20} color={chartColors.total} />
                <Text fontSize="sm" color={textSecondary}>Total Event</Text>
              </HStack>
              <Heading size="lg" color={textPrimary}>
                {monthlyData.reduce((sum, month) => sum + month.totalParticipations, 0)}
              </Heading>
              <Text fontSize="xs" color={textSecondary}>
                6 bulan terakhir
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Bar Chart for Monthly Comparison */}
      <Box bg={cardBg} p="6" borderRadius="lg" border="1px" borderColor={borderColor}>
        <Heading size="sm" color={textPrimary} mb="4">Detail Partisipasi per Bulan</Heading>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('corporate.200', 'corporate.700')} />
            <XAxis
              dataKey="month"
              stroke={borderColor}
              tick={{ fill: textSecondary }}
            />
            <YAxis
              stroke={borderColor}
              tick={{ fill: textSecondary }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="totalParticipations" fill={chartColors.total} name="Total Partisipasi" />
            <Bar dataKey="userParticipations" fill={chartColors.user} name="Partisipasi Anda" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </VStack>
  );
}