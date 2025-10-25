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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
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
  Avatar,
  InputGroup,
  InputLeftElement,
  Input,
  Image,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  StarIcon,
  UserIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  UsersIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';
import MemberSidebar from '@/components/MemberSidebar';
import MemberHeader from '@/components/MemberHeader';
import Footer from '@/components/Footer';

export default function AvailableEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [events, setEvents] = useState<EventWithPersonnel[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithPersonnel | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [registeringSlots, setRegisteringSlots] = useState<Set<string>>(new Set());
  const [selectedCustomRole, setSelectedCustomRole] = useState<string>('');
  const [userInstruments, setUserInstruments] = useState<any[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedPersonnelForRole, setSelectedPersonnelForRole] = useState<any>(null);

  // --- Theme dan Style Kustom (Consistent dengan Manager Events) ---
  const bgMain = '#ffffff'; // Putih
  const bgHeader = '#f9fafb';
  const bgAccentLight = '#fef2f2'; // Merah muda sangat terang
  const textPrimary = '#1f2937'; // Abu-abu gelap
  const textSecondary = '#6b7280'; // Abu-abu sedang
  const borderColor = '#e5e7eb'; // Abu-abu sangat terang
  const accentColor = '#dc2626'; // Merah
  const successColor = '#38A169'; // Green.600
  const successBg = '#f0fff4'; // Green.50
  const warningColor = '#ED8936'; // Orange.600
  const warningBg = '#fffbf0'; // Orange.50
  const background = 'gray.50';
  const cardBg = 'white';
  // --- Akhir Warna Kustom ---

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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
      fetchUserInstruments();
    }
  }, [status]);

  const fetchUserInstruments = async () => {
    try {
      const response = await fetch('/api/user/instruments');
      if (response.ok) {
        const data = await response.json();
        setUserInstruments(data.instruments || []);
      }
    } catch (error) {
      console.error('Error fetching user instruments:', error);
    }
  };

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

  const handleRegisterForEvent = async (personnelId: string, customRole?: string) => {
    if (!selectedEvent) return;

    setRegisteringSlots(prev => new Set(prev).add(personnelId));

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personnelId, customRole }),
      });

      if (response.ok) {
        // Optimistic update
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === selectedEvent.id
              ? {
                  ...event,
                  personnel: event.personnel.map(p =>
                    p.id === personnelId
                      ? { ...p, userId: session?.user.id || null, user: session?.user || null }
                      : p
                  )
                } as any
              : event
          )
        );

        toast({
          title: '🎉 Pendaftaran Berhasil!',
          description: 'Anda telah terdaftar untuk event ini. Cek halaman Jadwal untuk detailnya.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Background refresh
        setTimeout(() => {
          refreshDataInBackground();
        }, 1000);

        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register for event');
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message && error.message.includes('skill:')) {
        toast({
          title: '⚠️ Role Tidak Cocok',
          description: error.message,
          status: 'warning',
          duration: 6000,
          isClosable: true,
        });
      } else {
        toast({
          title: '❌ Gagal Mendaftar',
          description: error.message || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      setRegisteringSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(personnelId);
        return newSet;
      });
    }
  };

  const openRoleSelectionModal = (personnel: any) => {
    setSelectedPersonnelForRole(personnel);
    setSelectedCustomRole('');
    setIsRoleModalOpen(true);
  };

  const closeRoleSelectionModal = () => {
    setSelectedPersonnelForRole(null);
    setSelectedCustomRole('');
    setIsRoleModalOpen(false);
  };

  const handleRegisterWithCustomRole = async () => {
    if (!selectedPersonnelForRole || !selectedCustomRole) {
      toast({
        title: 'Error',
        description: 'Silakan pilih peran terlebih dahulu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    await handleRegisterForEvent(selectedPersonnelForRole.id, selectedCustomRole);
    closeRoleSelectionModal();
  };

  const refreshDataInBackground = async () => {
    try {
      console.log('🔄 Background refresh started...');

      const [eventsRefresh] = await Promise.allSettled([
        fetch('/api/events/member', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).then(res => res.json()),

        fetch('/api/clear-cache', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: AbortSignal.timeout(3000)
        }).catch(() => null)
      ]);

      if (eventsRefresh.status === 'fulfilled' && eventsRefresh.value) {
        const newEvents = eventsRefresh.value.events || eventsRefresh.value;
        setEvents(newEvents);
        console.log('✅ Background refresh completed');
      }
    } catch (error) {
      console.log('📝 Background refresh skipped (network issues)');
    }
  };

  const openRegistrationModal = (event: EventWithPersonnel) => {
    setSelectedEvent(event);
    onOpen();
  };

  const getAvailableSlots = (event: EventWithPersonnel) => {
    return event.personnel.filter((p: any) => p.userId === null);
  };

  const getMyRegistrations = () => {
    if (!session?.user?.id) return [];

    return events.flatMap((event: any) =>
      event.personnel.filter((p: any) => p.userId === session.user.id)
    );
  };

  // Filter events based on search
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Stats calculation
  const getStats = () => {
    const total = events.length;
    const available = events.reduce((total, event) => total + getAvailableSlots(event).length, 0);
    const registered = getMyRegistrations().length;
    const upcoming = events.filter(event =>
      new Date(event.date) > new Date()
    ).length;

    return { total, available, registered, upcoming };
  };

  const stats = getStats();

  // Color mapping for stats boxes
  const statColorMap: { [key: string]: { bg: string, color: string } } = {
    total: { bg: bgAccentLight, color: '#3182CE' },
    available: { bg: successBg, color: successColor },
    registered: { bg: bgAccentLight, color: accentColor },
    upcoming: { bg: warningBg, color: warningColor },
  };

  // Helper function to format dates
  const formatDateID = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      ...options
    });
  };

  if (!isClient || !session) {
    return null;
  }

  // Komponen pembantu untuk tampilan Event Info yang lebih bersih
  const EventInfoItem = ({ icon: IconComponent, text }: { icon: any, text: string }) => (
    <HStack spacing="2" color={textSecondary}>
      <Icon as={IconComponent} w={4} h={4} color={accentColor} />
      <Text fontSize="sm">{text}</Text>
    </HStack>
  );

  if (contentLoading) {
    return (
      <Box minH="100vh" bg={bgMain}>
        <MemberSidebar activeRoute="events" />
        <MemberHeader />
        <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 8 }}>
          <Flex justify="center" align="center" minH="60vh">
            <VStack spacing="4">
              <Spinner size="xl" color={accentColor} />
              <Text color={textSecondary}>Memuat data event...</Text>
            </VStack>
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgMain}>
      {/* Fixed Sidebar */}
      <MemberSidebar activeRoute="events" />
      <MemberHeader />

      {/* Main Content */}
      <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 8 }}>
        <VStack spacing="6" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary}>Daftar Event Tersedia</Heading>
              <Text color={textSecondary}>
                Temukan dan daftar event yang tersedia untuk Anda
              </Text>
            </Box>
          </Flex>

          {/* Stats Cards - Compact */}
          <SimpleGrid columns={{ base: 2, lg: 4 }} spacing="4">
            {/* Total Event */}
            <Card
              bg={bgMain}
              shadow="sm"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            >
              <CardBody p="4">
                <HStack spacing="3" align="center">
                  <Box
                    p="2"
                    bg={statColorMap.total.bg}
                    borderRadius="lg"
                    color={statColorMap.total.color}
                  >
                    <CalendarDaysIcon width={16} height={16} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">
                      Total Event
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={textPrimary}>
                      {stats.total}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            {/* Slot Tersedia */}
            <Card
              bg={bgMain}
              shadow="sm"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            >
              <CardBody p="4">
                <HStack spacing="3" align="center">
                  <Box
                    p="2"
                    bg={statColorMap.available.bg}
                    borderRadius="lg"
                    color={statColorMap.available.color}
                  >
                    <CheckCircleIcon width={16} height={16} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">
                      Slot Tersedia
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={statColorMap.available.color}>
                      {stats.available}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            {/* Terdaftar */}
            <Card
              bg={bgMain}
              shadow="sm"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            >
              <CardBody p="4">
                <HStack spacing="3" align="center">
                  <Box
                    p="2"
                    bg={statColorMap.registered.bg}
                    borderRadius="lg"
                    color={statColorMap.registered.color}
                  >
                    <StarIcon width={16} height={16} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">
                      Terdaftar
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={statColorMap.registered.color}>
                      {stats.registered}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            {/* Event Aktif */}
            <Card
              bg={bgMain}
              shadow="sm"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            >
              <CardBody p="4">
                <HStack spacing="3" align="center">
                  <Box
                    p="2"
                    bg={statColorMap.upcoming.bg}
                    borderRadius="lg"
                    color={statColorMap.upcoming.color}
                  >
                    <ClockIcon width={16} height={16} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">
                      Event Aktif
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={statColorMap.upcoming.color}>
                      {stats.upcoming}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Search and Filters */}
          <HStack spacing="4" flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement>
                <MagnifyingGlassIcon width={14} height={14} color={textSecondary} />
              </InputLeftElement>
              <Input
                placeholder="Cari judul, deskripsi, atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="xl"
              />
            </InputGroup>

            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                borderRadius="xl"
                onClick={() => setSearchTerm('')}
              >
                Reset Filter
              </Button>
            )}
          </HStack>

          {/* Alert Info */}
          <Alert status="info" borderRadius="md" bg={bgHeader} borderColor={borderColor} borderWidth="1px">
            <AlertIcon color={accentColor} />
            <Box>
              <Text fontWeight="bold" color={textPrimary}>Informasi Pendaftaran:</Text>
              <Text fontSize="sm" color={textSecondary}>
  • Pendaftaran langsung diterima (First-Come, First-Served).<br />
  • Anda hanya dapat mendaftar untuk peran yang <b>sesuai</b> dengan keahlian Anda.<br />
  • Cek kembali halaman <b>Jadwal</b> setelah mendaftar.
</Text>

            </Box>
          </Alert>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <Box
              bg={background}
              borderRadius="2xl"
              p="12"
              textAlign="center"
            >
              <VStack spacing="4">
                <Box p="4" bg="gray.100" borderRadius="xl" color={textSecondary}>
                  <CalendarDaysIcon width={32} height={32} />
                </Box>
                <Text fontSize="xl" fontWeight="medium" color={textPrimary}>
                  {searchTerm ? 'Tidak ada event yang cocok dengan pencarian' : 'Belum ada event yang tersedia'}
                </Text>
                <Text fontSize="md" color={textSecondary} maxW="md">
                  {searchTerm
                    ? 'Coba ubah kata kunci pencarian untuk menemukan event yang Anda cari'
                    : 'Event akan muncul di sini setelah dipublikasikan oleh manager'
                  }
                </Text>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="4">
              {filteredEvents.map((event) => {
                const availableSlots = getAvailableSlots(event);
                const isUserRegistered = event.personnel.some((p: any) => p.userId === session?.user?.id);
                const completionPercentage = ((event.personnel.length - availableSlots.length) / event.personnel.length) * 100;

                return (
                  <Card
                    key={event.id}
                    bg={isUserRegistered ? '#f9fafb' : bgMain}
                    shadow="sm"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                    overflow="hidden"
                    transition="all 0.3s"
                    opacity={isUserRegistered ? 0.6 : 1}
                    cursor={isUserRegistered ? 'not-allowed' : 'pointer'}
                    _hover={!isUserRegistered ? {
                      shadow: 'md',
                      transform: 'translateY(-2px)',
                      bg: '#f8f9fa'
                    } : {}}
                    onClick={() => !isUserRegistered && openRegistrationModal(event)}
                  >
                    <CardHeader bg="gray.50" p="4">
                      <Flex justify="space-between" align="start" gap="3">
                        <Box flex="1">
                          <Heading size="sm" color={textPrimary} mb="1" fontWeight="semibold">
                            {event.title}
                          </Heading>
                          {event.description && (
                            <Text fontSize="xs" color={textSecondary} noOfLines={1}>
                              {event.description}
                            </Text>
                          )}
                        </Box>
                        <VStack align="end" spacing="1">
                          <Badge colorScheme="green" variant="solid" px="3" py="1" borderRadius="full">
                            Dipublikasikan
                          </Badge>
                        </VStack>
                      </Flex>
                    </CardHeader>

                    <CardBody p="4" position="relative">
                      {/* Overlay indicator for registered/full events */}
                      {isUserRegistered && (
                        <Box
                          position="absolute"
                          top="0"
                          left="0"
                          right="0"
                          bottom="0"
                          borderRadius="lg"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          zIndex="10"
                        >
                          <VStack spacing="4">
                            <Image
                              src="/icons/terdaftar.png"
                              alt="Terdaftar"
                              boxSize="400px"
                              objectFit="contain"
                            />
                          </VStack>
                        </Box>
                      )}

                      {availableSlots.length === 0 && !isUserRegistered && (
                        <Box
                          position="absolute"
                          top="0"
                          left="0"
                          right="0"
                          bottom="0"
                          bg="rgba(107, 114, 128, 0.9)"
                          borderRadius="lg"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          zIndex="10"
                        >
                          <VStack spacing="2">
                            <Text
                              fontSize="lg"
                              fontWeight="bold"
                              color="white"
                              textAlign="center"
                              fontStyle="italic"
                            >
                              Slot Penuh!
                            </Text>
                            <Text fontSize="sm" color="rgba(255,255,255,0.9)">
                              Semua posisi sudah terisi
                            </Text>
                          </VStack>
                        </Box>
                      )}

                      <VStack spacing="3" align="stretch">
                        {/* Event Details */}
                        <VStack align="start" spacing="1">
                          <HStack spacing="2" color={textSecondary}>
                            <CalendarDaysIcon width={12} height={12} />
                            <Text fontSize="xs">
                              {formatDateID(event.date, {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </HStack>
                          <HStack spacing="2" color={textSecondary}>
                            <MapPinIcon width={12} height={12} />
                            <Text fontSize="xs">{event.location}</Text>
                          </HStack>
                        </VStack>

                        <Divider />

                        {/* Personnel Status */}
                        <Box>
                          <Flex justify="space-between" align="center" mb="3">
                            <Text fontSize="sm" fontWeight="semibold" color={textPrimary}>
                              Personel
                            </Text>
                            <Badge
                              colorScheme="gray"
                              fontSize="xs"
                              px="2"
                              py="1"
                              borderRadius="md"
                            >
                              {event.personnel.filter((p: any) => p.user).length} / {event.personnel.length}
                            </Badge>
                          </Flex>
                          <Progress
                            value={completionPercentage}
                            size="sm"
                            colorScheme={completionPercentage > 80 ? 'red' : 'green'}
                            borderRadius="full"
                            mb="3"
                          />
                          <VStack spacing="2" align="stretch">
                            {/* Display max 5 personnel */}
                            {event.personnel.slice(0, 5).map((personnel: any) => (
                              <HStack
                                key={personnel.id}
                                spacing="2"
                                minW="0"
                                p="1"
                                bg="gray.50"
                                borderRadius="md"
                              >
                                <Avatar
                                  size="xs"
                                  name={personnel.user?.name || personnel.role}
                                  bg={personnel.user ? accentColor : 'gray.400'}
                                />
                                <Box flex="1" minW="0">
                                  <Text fontSize="xs" fontWeight="medium" color={textPrimary} noOfLines={1}>
                                    {personnel.user?.name || 'Belum ada'}
                                  </Text>
                                  <Text fontSize="10px" color={textSecondary} noOfLines={1}>
                                    {personnel.role}
                                  </Text>
                                </Box>
                                {personnel.user && (
                                  <Badge
                                    colorScheme="green"
                                    fontSize="8px"
                                    px="1"
                                    py="0.5"
                                    borderRadius="sm"
                                  >
                                    Terisi
                                  </Badge>
                                )}
                              </HStack>
                            ))}

                            {/* Remaining personnel indicator */}
                            {event.personnel.length > 5 && (
                              <HStack
                                spacing="2"
                                minW="0"
                                p="2"
                                bg={bgAccentLight}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={accentColor}
                                borderStyle="dashed"
                                justify="center"
                              >
                                <Box
                                  p="1"
                                  bg={accentColor}
                                  borderRadius="full"
                                  color="white"
                                  minW="16px"
                                  h="16px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Text fontSize="8px" fontWeight="bold">+</Text>
                                </Box>
                                <Text fontSize="xs" fontWeight="medium" color={accentColor}>
                                  {event.personnel.length - 5} lainnya
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        </Box>

                        {/* Action Button */}
                       
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>

        {/* Enhanced Registration Modal */}
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="xl"
          isCentered
          scrollBehavior="inside"
        >
          <ModalOverlay
            backdropFilter="blur(6px)"
            bg="rgba(0, 0, 0, 0.4)"
          />
          <ModalContent
            borderRadius="xl"
            boxShadow="2xl"
            overflow="hidden"
            bg="white"
          >
            {/* Modal Header dengan warna accent */}
            <Box
              bg={accentColor}
              p="6"
              position="relative"
              borderTopRadius="xl"
            >
              <ModalCloseButton
                color="white"
                _hover={{ bg: 'rgba(255,255,255,0.2)' }}
                borderRadius="full"
                w="8"
                h="8"
              />
              <VStack align="start" spacing="1" color="white">
                <HStack>
                  <Box bg="rgba(255,255,255,0.2)" p="2" borderRadius="lg">
                    <CalendarDaysIcon width={5} height={5} />
                  </Box>
                  <Box>
                    <Heading size="lg" color="white" fontWeight="bold">Daftar untuk Event</Heading>
                    <Text color="rgba(255,255,255,0.9)" fontSize="sm">
                      Pilih peran yang sesuai dengan skill Anda
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>

            <ModalBody p="0">
              {selectedEvent && (
                <VStack align="stretch" spacing="0">
                  {/* Event Info Card (Mini) */}
                  <Box
                    bg="gray.50"
                    p="5"
                    borderBottom="1px"
                    borderColor="gray.200"
                  >
                    <VStack align="stretch" spacing="4">
                      {/* Event Title and Basic Info */}
                      <HStack align="start">
                        <Box flex="1">
                          <Heading size="md" color={textPrimary} mb="2" fontWeight="bold">
                            {selectedEvent.title}
                          </Heading>
                        </Box>
                      </HStack>

                      {/* Description */}
                      {selectedEvent.description && (
                        <Box>
                          <Text fontSize="sm" fontWeight="500" color={textPrimary} mb="1">
                            Deskripsi:
                          </Text>
                          <Text fontSize="sm" color={textSecondary} lineHeight="1.5">
                            {selectedEvent.description}
                          </Text>
                        </Box>
                      )}

                      {/* Event Details */}
                      <VStack align="stretch" spacing="3">
                        {/* Location */}
                        <HStack spacing="3" color={textSecondary}>
                          <MapPinIcon width={12} height={12} color={accentColor} />
                          <Text fontSize="sm" fontWeight="500">Lokasi:</Text>
                          <Text fontSize="sm">{selectedEvent.location}</Text>
                        </HStack>

                        {/* Date and Time */}
                        <HStack spacing="3" color={textSecondary}>
                          <ClockIcon width={12} height={12} color={accentColor} />
                          <Text fontSize="sm" fontWeight="500">Waktu:</Text>
                          <Text fontSize="sm">
                            {formatDateID(selectedEvent.date, {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </HStack>
                      </VStack>

                      <Divider borderColor="gray.300" />

                      {/* Stats Overview */}
                      <VStack align="stretch" spacing="2">
                        <Text fontSize="sm" fontWeight="600" color={textPrimary}>
                          Statistik Personel
                        </Text>
                        <SimpleGrid columns={3} spacing="3">
                          {/* Total Personil */}
                          <VStack
                            bg="white"
                            p="3"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={borderColor}
                            spacing="0"
                          >
                            <Text fontSize="lg" fontWeight="bold" color={accentColor}>
                              {selectedEvent.personnel.length}
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>Total</Text>
                          </VStack>
                          {/* Slot Tersedia */}
                          <VStack
                            bg={successBg}
                            p="3"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="green.200"
                            spacing="0"
                          >
                            <Text fontSize="lg" fontWeight="bold" color={successColor}>
                              {selectedEvent.personnel.filter((p: any) => p.userId === null).length}
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>Tersedia</Text>
                          </VStack>
                          {/* Terisi */}
                          <VStack
                            bg={warningBg}
                            p="3"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="yellow.200"
                            spacing="0"
                          >
                            <Text fontSize="lg" fontWeight="bold" color={warningColor}>
                              {selectedEvent.personnel.filter((p: any) => p.userId !== null).length}
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>Terisi</Text>
                          </VStack>
                        </SimpleGrid>
                      </VStack>
                    </VStack>
                  </Box>

                  {/* Personnel yang sudah terdaftar */}
                  {selectedEvent.personnel.filter((p: any) => p.userId !== null).length > 0 && (
                    <Box
                      bg="blue.50"
                      p="5"
                      borderBottom="1px"
                      borderColor="gray.200"
                    >
                      <VStack align="stretch" spacing="3">
                        <HStack justify="space-between" align="center">
                          <Heading size="sm" color="blue.800" fontWeight="semibold">
                            Personel Terdaftar
                          </Heading>
                          <Badge colorScheme="blue" variant="subtle" px="3" py="1" borderRadius="full">
                            {selectedEvent.personnel.filter((p: any) => p.userId !== null).length} Orang
                          </Badge>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing="3">
                          {selectedEvent.personnel
                            .filter((p: any) => p.userId !== null)
                            .map((personnel: any) => (
                              <HStack
                                key={personnel.id}
                                bg="white"
                                p="3"
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="blue.200"
                                justify="space-between"
                                align="center"
                              >
                                <VStack align="start" spacing="1" flex="1">
                                  <Text fontWeight="600" color="blue.800" fontSize="sm">
                                    {personnel.role}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {personnel.user?.name || 'Unknown'}
                                  </Text>
                                </VStack>
                                <Badge
                                  colorScheme="green"
                                  variant="solid"
                                  fontSize="xs"
                                  borderRadius="full"
                                  px="2"
                                >
                                  ✓ Terdaftar
                                </Badge>
                              </HStack>
                            ))}
                        </SimpleGrid>
                      </VStack>
                    </Box>
                  )}

                  {/* Role Selection Section */}
                  <Box p="6">
                    <VStack align="stretch" spacing="4">
                      {selectedEvent.personnel.filter((p: any) => p.userId === null).length > 0 && (
                        <HStack justify="space-between" align="center">
                          <Heading size="sm" color={textPrimary} fontWeight="semibold">
                            Slot Tersedia
                          </Heading>
                          <Badge colorScheme="green" variant="subtle" px="3" py="1" borderRadius="full">
                            {selectedEvent.personnel.filter((p: any) => p.userId === null).length} Slot
                          </Badge>
                        </HStack>
                      )}

                      <VStack spacing="3" align="stretch">
                        {selectedEvent.personnel
                          .filter((p: any) => p.userId === null)
                          .map((personnel: any) => {
                            const isCustomSlot = personnel.role.toLowerCase().includes('kustom');

                            return (
                              <Flex
                                key={personnel.id}
                                bg="white"
                                p="4"
                                borderRadius="xl"
                                border="2px solid"
                                borderColor={borderColor}
                                _hover={{
                                  borderColor: accentColor,
                                  bg: bgAccentLight,
                                  transform: 'translateY(-2px)',
                                  shadow: 'md'
                                }}
                                transition="all 0.3s ease"
                                cursor="pointer"
                                onClick={() => isCustomSlot ? openRoleSelectionModal(personnel) : handleRegisterForEvent(personnel.id)}
                                align="center"
                                justify="space-between"
                              >
                                <HStack spacing="3">
                                  <Box bg={isCustomSlot ? '#fef3c7' : bgAccentLight} p="2" borderRadius="lg" border="1px solid" borderColor={isCustomSlot ? '#fbbf24' : 'red.200'}>
                                    <UserIcon width={14} height={14} color={isCustomSlot ? '#d97706' : accentColor} />
                                  </Box>
                                  <VStack align="start" spacing="0">
                                    <Text fontWeight="bold" color={textPrimary} fontSize="md">
                                      {personnel.role}
                                    </Text>
                                    <Text fontSize="xs" color={textSecondary}>
                                      {isCustomSlot ? 'Pilih peran Anda terlebih dahulu' : 'Klik untuk mendaftar'}
                                    </Text>
                                  </VStack>
                                </HStack>

                                <Button
                                  size="sm"
                                  colorScheme={isCustomSlot ? "yellow" : "red"}
                                  variant="solid"
                                  isLoading={registeringSlots.has(personnel.id)}
                                  loadingText="Mendaftar..."
                                  rightIcon={<CheckCircleIcon width={14} height={14} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isCustomSlot) {
                                      openRoleSelectionModal(personnel);
                                    } else {
                                      handleRegisterForEvent(personnel.id);
                                    }
                                  }}
                                  _hover={{ bg: isCustomSlot ? '#d97706' : '#a31f1f' }}
                                >
                                  {registeringSlots.has(personnel.id) ? 'Proses' : isCustomSlot ? 'Pilih Peran' : 'Daftar'}
                                </Button>

                              </Flex>
                            );
                          })}
                      </VStack>

                      {selectedEvent.personnel.filter((p: any) => p.userId === null).length === 0 && (
                        <Box
                          bg="gray.100"
                          p="6"
                          borderRadius="xl"
                          textAlign="center"
                          border="1px solid"
                          borderColor="gray.200"
                        >
                          <UserIcon width={8} height={8} color="gray.400" />
                          <Text color="gray.600" fontSize="md" fontWeight="semibold">
                            Semua slot sudah terisi
                          </Text>
                          <Text color="gray.500" fontSize="sm">
                            Event ini sudah lengkap dengan personel yang dibutuhkan
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>

                  {/* Optional: Footer */}
                  <Box
                    bg="gray.100"
                    p="4"
                    borderTop="1px"
                    borderColor="gray.200"
                    textAlign="right"
                    borderBottomRadius="xl"
                  >
                    <Button onClick={onClose} size="sm" variant="ghost" colorScheme="gray">
                      Tutup
                    </Button>
                  </Box>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Role Selection Modal for Custom Slots */}
        <Modal
          isOpen={isRoleModalOpen}
          onClose={closeRoleSelectionModal}
          size="md"
          isCentered
        >
          <ModalOverlay
            backdropFilter="blur(6px)"
            bg="rgba(0, 0, 0, 0.4)"
          />
          <ModalContent
            borderRadius="xl"
            boxShadow="2xl"
            overflow="hidden"
            bg="white"
          >
            <ModalHeader
              bg={accentColor}
              borderBottom="1px solid"
              borderColor={borderColor}
              py="4"
            >
              <VStack align="start" spacing="1">
                <Heading size="md" color="white" fontWeight="bold">
                  Pilih Peran Anda
                </Heading>
                <Text fontSize="sm" color="white">
                  Pilih peran yang sesuai dengan keahlian Anda
                </Text>
              </VStack>
            </ModalHeader>

            <ModalBody p="6">
              <VStack spacing="4">
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600" color={textPrimary}>
                    Peran yang Anda Pilih:
                  </FormLabel>
                  <Select
                    placeholder="Pilih peran Anda..."
                    value={selectedCustomRole}
                    onChange={(e) => setSelectedCustomRole(e.target.value)}
                    borderRadius="lg"
                    borderColor={borderColor}
                    focusBorderColor={accentColor}
                    color='black'
                  >
                    <option value="Vokalis">Vokalis</option>
                    <option value="Gitaris">Gitaris</option>
                    <option value="Keyboardist">Keyboardist</option>
                    <option value="Drummer">Drummer</option>
                    <option value="Basis">Basis</option>
                  </Select>
                </FormControl>

                <Alert status="info" borderRadius="md" bg="#fef3c7" borderColor="#fbbf24" borderWidth="1px">
                  <AlertIcon color="#d97706" />
                  <Box>
                    <Text fontSize="sm" color="#92400e" fontWeight="500">
                      Perhatian:
                    </Text>
                    <Text fontSize="xs" color="#78350f">
                      Anda hanya bisa memilih peran yang sesuai dengan instruments yang Anda miliki.
                    </Text>
                  </Box>
                </Alert>

                {/* Display user's available instruments */}
                {userInstruments.length > 0 && (
                  <Box
                    bg="gray.50"
                    p="3"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Text fontSize="xs" fontWeight="600" color={textPrimary} mb="2">
                      Instruments Anda:
                    </Text>
                    <HStack spacing="2" flexWrap="wrap">
                      {userInstruments.map((instrument: any, index: number) => (
                        <Badge
                          key={index}
                          bg="white"
                          color={accentColor}
                          fontSize="xs"
                          px="2"
                          py="1"
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={accentColor}
                        >
                          {instrument.name || instrument}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter
              bg="gray.50"
              borderTop="1px solid"
              borderColor={borderColor}
              py="4"
            >
              <HStack spacing="3">
                <Button
                  variant="outline"
                  colorScheme="gray"
                  onClick={closeRoleSelectionModal}
                  borderRadius="lg"
                >
                  Batal
                </Button>
                <Button
                  bg="#d97706"
                  color="white"
                  onClick={handleRegisterWithCustomRole}
                  isLoading={registeringSlots.has(selectedPersonnelForRole?.id || '')}
                  loadingText="Mendaftar..."
                  borderRadius="lg"
                  _hover={{ bg: accentColor }}
                  isDisabled={!selectedCustomRole}
                >
                  Daftar dengan Peran Ini
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Footer />
      </Box>
    </Box>
  );
}