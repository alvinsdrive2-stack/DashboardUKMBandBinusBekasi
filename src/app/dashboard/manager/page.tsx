'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '@/hooks/usePageTransition';
import EventDetailModal from '@/components/EventDetailModal';
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
  useToast,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Divider,
  Avatar,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  ChartBarIcon,
  UsersIcon,
  MusicalNoteIcon,
  ClipboardDocumentIcon,
  DocumentIcon,
  MegaphoneIcon,
  FlagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel, EventStatus } from '@/types';
import ManagerSidebar from '@/components/ManagerSidebar';
import OptimizedEventCalendar from '@/components/OptimizedEventCalendar';
import StatsCards from '@/components/StatsCards';

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { TransitionOverlay } = usePageTransition();
  const [events, setEvents] = useState<EventWithPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // State for add event modal
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // State for event detail modal
  const [selectedEvent, setSelectedEvent] = useState<EventWithPersonnel | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' &&
               session?.user?.organizationLvl !== 'COMMISSIONER' &&
               session?.user?.organizationLvl !== 'PENGURUS') {
      router.push('/dashboard/member');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events/manager');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
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
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/events/manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEvent,
          date: new Date(newEvent.date).toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Berhasil',
          description: 'Acara baru berhasil ditambahkan dan langsung dipublikasikan',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchEvents();
        setIsAddEventOpen(false);
        setNewEvent({
          title: '',
          description: '',
          date: '',
          location: '',
        });
      } else {
        throw new Error('Failed to create event');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menambahkan acara',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEventClick = (event: EventWithPersonnel) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'SUBMITTED': return 'orange';
      case 'DRAFT': return 'gray';
      case 'PUBLISHED': return 'red';
      case 'FINISHED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: EventStatus) => {
    switch (status) {
      case 'SUBMITTED': return 'Menunggu Persetujuan';
      case 'DRAFT': return 'Draft';
      case 'PUBLISHED': return 'Dipublikasikan';
      case 'FINISHED': return 'Selesai';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  const publishedEvents = events.filter(e => e.status === 'PUBLISHED').length;
  const finishedEvents = events.filter(e => e.status === 'FINISHED').length;
  const availableSlots = events
    .filter(e => e.status === 'PUBLISHED')
    .reduce((total, event) => total + event.personnel.filter((p: any) => p.userId === null).length, 0);
  const totalSlots = events
    .filter(e => e.status === 'PUBLISHED')
    .reduce((total, event) => total + event.personnel.length, 0);

  const totalMembers = new Set(
    events.flatMap(e => e.personnel.filter((p: any) => p.user).map((p: any) => p.user!.id))
  ).size;

  const upcomingEvents = events.filter((e: any) =>
    e.status === 'PUBLISHED' && new Date(e.date) > new Date()
  ).length;

  const totalParticipations = events
    .flatMap((e: any) => e.personnel.filter((p: any) => p.user))
    .length;

  const averageParticipationPerEvent = events.length > 0
    ? Math.round(totalParticipations / events.length * 10) / 10
    : 0;

  const filledSlotPercentage = totalSlots > 0
    ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100)
    : 0;

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
      <ManagerSidebar activeRoute="dashboard" />
      <TransitionOverlay />

      <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
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
            <Spinner size="xl" color={accentColor} />
            <Text color={textSecondary}>Memuat data...</Text>
          </Box>
        )}

        <VStack spacing="6" align="stretch">
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary}>Dashboard Pengurus</Heading>
              <Text color={textSecondary}>
                Selamat datang, {session.user.name}! Kelola acara dan monitor anggota UKM Band.
              </Text>
            </Box>
            <HStack spacing="3">
              <Button
                colorScheme="red"
                size="lg"
                borderRadius="xl"
                fontWeight="semibold"
                px="8"
                onClick={() => setIsAddEventOpen(true)}
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.2s"
              >
                + Tambah Acara
              </Button>
              <Button
                variant="outline"
                size="lg"
                borderRadius="xl"
                fontWeight="semibold"
                onClick={fetchEvents}
                _hover={{ bg: 'gray.50' }}
              >
                Refresh
              </Button>
            </HStack>
          </Flex>

          <Alert status="info" borderRadius="md" bg={alertBg} borderColor={borderColor} borderWidth="1px">
            <AlertIcon color={accentColor} />
            <Box>
              <Text fontWeight="bold" color={textPrimary}>Dashboard Manager:</Text>
              <Text fontSize="sm" color={textSecondary}>
                Monitor semua acara, personel, dan statistik UKM Band dalam satu tampilan komprehensif.
              </Text>
            </Box>
          </Alert>

          {/* Manager Stats Overview - Compact */}
          <SimpleGrid columns={{ base: 2, lg: 4 }} spacing="4">
            <Card
              bg="white"
              shadow="sm"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.100"
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            >
              <CardBody p="4">
                <HStack spacing="3" align="center">
                  <Box
                    p="2"
                    bg="gray.50"
                    borderRadius="lg"
                    color="gray.600"
                  >
                    <DocumentIcon width={20} height={20} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color="gray.600" fontWeight="500">
                      Total Acara
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={textPrimary}>
                      {events.length}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            <Card
              bg="white"
              shadow="sm"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.100"
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            >
              <CardBody p="4">
                <HStack spacing="3" align="center">
                  <Box
                    p="2"
                    bg={accentBg}
                    borderRadius="lg"
                    color={accentColor}
                  >
                    <MegaphoneIcon width={20} height={20} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color="gray.600" fontWeight="500">
                      Dipublikasikan
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                      {publishedEvents}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            <Card
              bg="white"
              shadow="sm"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.100"
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            >
              <CardBody p="4">
                <HStack spacing="3" align="center">
                  <Box
                    p="2"
                    bg="#f0fdf4"
                    borderRadius="lg"
                    color="#16a34a"
                  >
                    <FlagIcon width={20} height={20} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color="gray.600" fontWeight="500">
                      Event Aktif
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="#16a34a">
                      {upcomingEvents}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            <Card
              bg="white"
              shadow="sm"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.100"
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            >
              <CardBody p="4">
                <HStack spacing="3" align="center">
                  <Box
                    p="2"
                    bg="#faf5ff"
                    borderRadius="lg"
                    color="#9333ea"
                  >
                    <UserGroupIcon width={20} height={20} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color="gray.600" fontWeight="500">
                      Total Anggota
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="#9333ea">
                      {totalMembers}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Main Content - 70:30 Layout */}
          <Box
            display={{ base: 'block', lg: 'flex' }}
            gap="6"
            alignItems="stretch"
          >
            {/* Calendar - 70% */}
            <Box
              flex={{ base: '1', lg: '0 0 70%' }}
              mb={{ base: '6', lg: '0' }}
            >
              <Card
                bg="white"
                shadow="sm"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="gray.100"
                overflow="hidden"
                h="full"
              >
                <CardBody p="0">
                  <OptimizedEventCalendar
                    events={events}
                    userId={session.user.id}
                    onEventClick={handleEventClick}
                    viewMode="manager"
                  />
                </CardBody>
              </Card>
            </Box>

            {/* Member Activity - 30% */}
            <Box
              flex={{ base: '1', lg: '0 0 30%' }}
              position={{ base: 'static', lg: 'sticky' }}
              top={{ base: 'auto', lg: '8' }}
            >
              <Card
                bg="white"
                shadow="sm"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="gray.100"
                overflow="hidden"
                h="full"
              >
                <CardHeader p="4" borderBottomWidth="1px" borderColor="gray.100">
                  <HStack spacing="3">
                    <Box p="2" bg="gray.50" borderRadius="lg" color="gray.600">
                      <UserGroupIcon width={20} height={20} />
                    </Box>
                    <Box>
                      <Heading size="md" color={textPrimary} fontWeight="semibold">
                        Monitoring Anggota
                      </Heading>
                      <Text fontSize="sm" color={textSecondary}>
                        Partisipasi & aktivitas
                      </Text>
                    </Box>
                  </HStack>
                </CardHeader>
                <CardBody p="4">
                  <VStack spacing="4" align="stretch">
                    <Box
                      bg="gray.50"
                      borderRadius="xl"
                      p="3"
                    >
                      <HStack justify="space-between" align="center">
                        <Text fontSize="sm" color={textSecondary}>Total Partisipasi</Text>
                        <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                          {totalParticipations}
                        </Text>
                      </HStack>
                    </Box>

                    <Box
                      bg="gray.50"
                      borderRadius="xl"
                      p="3"
                    >
                      <HStack justify="space-between" align="center">
                        <Text fontSize="sm" color={textSecondary}>Rata-rata/Event</Text>
                        <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                          {averageParticipationPerEvent}
                        </Text>
                      </HStack>
                    </Box>

                    <Box
                      bg={accentBg}
                      borderRadius="xl"
                      p="3"
                      borderWidth="1px"
                      borderColor="#fca5a5"
                    >
                      <HStack justify="space-between" align="center">
                        <Text fontSize="sm" color={accentColor} fontWeight="600">Tingkat Isi Slot</Text>
                        <Text fontSize="lg" fontWeight="bold" color={accentColor}>
                          {filledSlotPercentage}%
                        </Text>
                      </HStack>
                    </Box>

                    <Divider />

                    <Button
                      as="a"
                      href="/dashboard/manager/members"
                      variant="outline"
                      size="sm"
                      borderRadius="xl"
                      colorScheme="red"
                      leftIcon={<UsersIcon width={16} height={16} />}
                      w="full"
                    >
                      Monitor Anggota
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </Box>

          {/* Recent Events Preview */}
        </VStack>
      </Box>

          {/* Add Event Modal */}
      <Modal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        size="2xl"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader
            color={textPrimary}
            bg="white"
            borderBottomWidth="1px"
            borderColor={borderColor}
            py="6"
          >
            <HStack spacing="3">
              <Box p="2" bg={accentBg} borderRadius="lg" color={accentColor}>
                <MusicalNoteIcon width={20} height={20} />
              </Box>
              <Box>
                <Text fontSize="xl" fontWeight="bold">Tambah Acara Baru</Text>
                <Text fontSize="sm" fontWeight="normal" color={textSecondary}>
                  Buat acara baru untuk UKM Band Bekasi
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton top="5" right="5" />
          <ModalBody py="8" px="8">
            <form onSubmit={handleAddEvent}>
              <VStack spacing="6" align="stretch">
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="semibold" mb="2">
                    Judul Acara
                  </FormLabel>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Contoh: Pentas Seni Sekolah 2024"
                    size="lg"
                    borderRadius="xl"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    color="black"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="semibold" mb="2">
                    Deskripsi Acara
                  </FormLabel>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Jelaskan detail acara, tema, dan hal penting lainnya..."
                    rows={4}
                    size="lg"
                    borderRadius="xl"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    color="black"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="semibold" mb="2">
                    Tanggal & Waktu Acara
                  </FormLabel>
                  <Input
                    type="datetime-local"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    size="lg"
                    borderRadius="xl"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    color="black"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="semibold" mb="2">
                    Lokasi Acara
                  </FormLabel>
                  <Input
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Contoh: Aula Sekolah, Jl. Pendidikan No. 1"
                    size="lg"
                    borderRadius="xl"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    color="black"
                  />
                </FormControl>

                <Box
                  p="5"
                  bg={accentBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="#fca5a5"
                >
                  <HStack spacing="3" mb="3">
                    <Box p="2" bg="white" borderRadius="lg" color={accentColor}>
                      <ClipboardDocumentIcon width={16} height={16} />
                    </Box>
                    <Text fontSize="md" color={accentColor} fontWeight="bold">
                      Informasi Penting
                    </Text>
                  </HStack>
                  <VStack align="start" spacing="2" pl="10">
                    <Text fontSize="sm" color="#991b1b">
                      • Acara akan langsung dibuat dengan status <strong>PUBLISHED</strong>
                    </Text>
                    <Text fontSize="sm" color="#991b1b">
                      • 6 slot personel otomatis dibuat (Vocal, Guitar 1, Guitar 2, Keyboard, Bass, Drum)
                    </Text>
                    <Text fontSize="sm" color="#991b1b">
                      • Anggota dapat langsung mendaftar sebagai personel setelah acara dipublikasikan
                    </Text>
                  </VStack>
                </Box>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter
            borderTopWidth="1px"
            borderColor={borderColor}
            py="5"
            px="8"
          >
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setIsAddEventOpen(false)}
              size="lg"
              borderRadius="xl"
              fontWeight="semibold"
            >
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleAddEvent}
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
              size="lg"
              borderRadius="xl"
              fontWeight="semibold"
              px="8"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.2s"
            >
              Tambah Acara
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isEventDetailOpen}
        onClose={() => setIsEventDetailOpen(false)}
        event={selectedEvent}
        viewMode="manager" // Manager view mode
      />
    </Box>
  );
}