'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Heading,
  Text,
  useToast,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  ModalHeader,
  ModalFooter,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Divider,
  Flex,
  Spacer,
  Icon,
  Progress,
  IconButton,
  Tooltip,
  Spinner,
  InputGroup,
  Input,
  Select,
  InputLeftElement,
  Avatar,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  StarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';
import MemberSidebar from '@/components/MemberSidebar';

export default function AvailableEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [events, setEvents] = useState<EventWithPersonnel[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Theme variables
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const borderColor = '#e5e7eb';
  const bgCard = '#ffffff';
  const bgHeader = '#f9fafb';
  const accentColor = '#dc2626';
  const accentBg = '#fef2f2';
  const successColor = '#10b981';
  const successBg = '#d1fae5';
  const warningColor = '#f59e0b';
  const warningBg = '#fef3c7';

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

  const fetchEvents = async () => {
    setContentLoading(true);
    try {
      const response = await fetch('/api/events/member');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || data);
      } else {
        throw new Error('Failed to fetch events');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data acara',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status]);

  if (!isClient || !session) {
    return (
      <Box minH="100vh" bg={bgMain} display="flex" alignItems="center" justifyContent="center">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgMain}>
      {/* Main Content */}
      <Box flex="1" p={8}>
        {/* Header */}
        <VStack spacing={6} align="stretch" mb={8}>
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary} mb={2}>
                Acara yang Tersedia
              </Heading>
              <Text color={textSecondary}>
                Daftar acara yang bisa Anda ikuti
              </Text>
            </Box>
            <Button
              leftIcon={<ArrowPathIcon />}
              variant="outline"
              onClick={fetchEvents}
              isLoading={contentLoading}
            >
              Refresh
            </Button>
          </Flex>
        </VStack>

        {/* Content */}
        {contentLoading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <VStack spacing={4}>
              <Spinner size="xl" color={accentColor} />
              <Text color={textSecondary}>Memuat data acara...</Text>
            </VStack>
          </Box>
        ) : events.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Alert status="info" borderRadius="lg" mb={4}>
              <AlertIcon />
              Belum ada acara yang tersedia saat ini
            </Alert>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {events.map((event) => (
              <Card key={event.id} borderWidth={1} borderColor={borderColor} borderRadius="lg" overflow="hidden">
                <CardHeader bg={bgHeader} pb={4}>
                  <VStack spacing={3} align="start">
                    <Heading size="md" color={textPrimary} noOfLines={2}>
                      {event.title}
                    </Heading>
                    <HStack spacing={4} color={textSecondary} fontSize="sm">
                      <HStack spacing={1}>
                        <CalendarDaysIcon width={16} height={16} />
                        <Text>{new Date(event.date).toLocaleDateString('id-ID')}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <MapPinIcon width={16} height={16} />
                        <Text>{event.location}</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </CardHeader>
                <CardBody pt={4}>
                  <Text color={textSecondary} fontSize="sm" mb={4} noOfLines={3}>
                    {event.description || 'Tidak ada deskripsi'}
                  </Text>
                  <HStack justify="space-between">
                    <Badge colorScheme={event.status === 'PUBLISHED' ? 'green' : 'yellow'}>
                      {event.status}
                    </Badge>
                    <Text fontSize="sm" color={textSecondary}>
                      {event.personnel?.length || 0} peserta
                    </Text>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
}