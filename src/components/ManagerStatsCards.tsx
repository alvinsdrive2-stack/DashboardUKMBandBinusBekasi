'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
  Icon,
  Flex,
} from '@chakra-ui/react';
import {
  CalendarIcon,
  TimeIcon,
  CheckCircleIcon,
  AtSignIcon,
} from '@chakra-ui/icons';
interface ManagerStatsCardsProps {
  totalEvents?: number;
  totalMembers?: number;
  upcomingEvents?: number;
  finishedEvents?: number;
  activeMembers?: number;
  isLoading?: boolean;
}

export default function ManagerStatsCards({
  totalEvents = 0,
  totalMembers = 0,
  upcomingEvents = 0,
  finishedEvents = 0,
  activeMembers = 0,
  isLoading = false,
}: ManagerStatsCardsProps) {
  const stats = [
  {
    label: 'Total Event',
    value: totalEvents.toString(),
    icon: CalendarIcon, // simbol kalender → cocok untuk total event
    color: '#2b6cb0',   // biru netral
    bgColor: '#ebf8ff',
    borderColor: '#e2e8f0', // netral abu-abu
  },
  {
    label: 'Event Akan Datang',
    value: upcomingEvents.toString(),
    icon: TimeIcon, // ikon jam → event mendatang
    color: '#6b46c1',
    bgColor: '#faf5ff',
    borderColor: '#e2e8f0',
    showBadge: upcomingEvents > 0,
  },
  {
    label: 'Event Selesai',
    value: finishedEvents.toString(),
    icon: CheckCircleIcon, // menandakan selesai
    color: '#2f855a',
    bgColor: '#f0fff4',
    borderColor: '#e2e8f0',
  },
  {
    label: 'Member Aktif',
    value: activeMembers.toString(),
    icon: AtSignIcon, // simbol user/keanggotaan
    color: '#b7791f',
    bgColor: '#fffbeb',
    borderColor: '#e2e8f0',
  },
];

  if (isLoading) {
    return (
      <SimpleGrid
        columns={{ base: 2, sm: 2, md: 4 }}
        spacing={{ base: 3, md: 4 }}
        mb={{ base: 6, md: 8 }}
      >
        {[1, 2, 3, 4].map((item) => (
          <Card
            key={item}
            variant="outline"
            borderColor="#e2e8f0"
            borderRadius="lg"
            overflow="hidden"
          >
            <CardBody p={{ base: 4, md: 6 }}>
              <VStack spacing={2} align="center">
                <Box
                  w={{ base: 10, md: 12 }}
                  h={{ base: 10, md: 12 }}
                  bg="#f7fafc"
                  borderRadius="full"
                />
                <Box w="60%" h="8px" bg="#e2e8f0" borderRadius="full" />
                <Box w="40%" h="6px" bg="#e2e8f0" borderRadius="full" />
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid
      columns={{ base: 2, md: 4 }}
      spacing={{ base: 3, md: 4 }}
      mb={{ base: 4, md: 6 }}
    >
      {stats.map((stat, index) => (
        <Card
          key={index}
          bg="white"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
          borderRadius="xl"
          border="1px solid"
          borderColor={stat.borderColor}
          transition="all 0.2s ease"
          _hover={{
            transform: { base: 'translateY(-1px)', md: 'translateY(-2px)' },
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderColor: stat.color,
          }}
        >
          <CardBody
            p={{ base: 4, md: 5 }}
            position="relative"
          >
            {stat.showBadge && (
              <Badge
                position="absolute"
                top="2"
                right="2"
                bg={stat.color}
                color="white"
                fontSize="10px"
                px="2"
                py="1"
                borderRadius="full"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                NEW
              </Badge>
            )}
            <VStack spacing={{ base: 3, md: 4 }} align="center">
              {/* Icon Circle */}
              <Flex
                w={{ base: 12, md: 14 }}
                h={{ base: 12, md: 14 }}
                bg={stat.bgColor}
                borderRadius="full"
                align="center"
                justify="center"
                border="2px solid"
                borderColor={stat.borderColor}
                boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
              >
                <Icon
                  as={stat.icon}
                  w={{ base: 5, md: 6 }}
                  h={{ base: 5, md: 6 }}
                  color={stat.color}
                />
              </Flex>

              {/* Stats Content */}
              <VStack spacing={{ base: 1, md: 2 }} align="center" textAlign="center">
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="bold"
                  color={stat.color}
                  lineHeight="1"
                  letterSpacing="-0.5px"
                >
                  {stat.value}
                </Text>
                <Text
                  fontSize={{ base: 'sm', md: 'sm' }}
                  color="#4b5563"
                  fontWeight="600"
                  textAlign="center"
                  noOfLines={1}
                  letterSpacing="0.2px"
                >
                  {stat.label}
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
}