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
  VStack,
  HStack,
  Badge,
  SimpleGrid,
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
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  StarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowPathIcon, // Mengganti CalendarDaysIcon untuk refresh
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';
import MemberSidebar from '@/components/MemberSidebar';

export default function AvailableEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [events, setEvents] = useState<EventWithPersonnel[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithPersonnel | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [registeringSlots, setRegisteringSlots] = useState<Set<string>>(new Set());

  // --- Warna dan Style Kustom (Menggunakan Tailwind/Chakra Default Shades untuk konsistensi) ---
  const primaryColor = 'red.600'; // Accent Color - Merah
  const primaryBg = 'red.50'; // Accent Background
  const textPrimary = 'gray.800';
  const textSecondary = 'gray.500';
  const background = 'gray.50';
  const cardBg = 'white';
  const borderColor = 'gray.200';
  const successColor = 'green.500';
  const successBg = 'green.50';
  const warningColor = 'yellow.600';
  const warningBg = 'yellow.50';
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
    }
  }, [status]);
  const bgMain = '#ffffff';
  const alertBg = '#f3f4f6';
  const accentColor = '#dc2626';
  const accentBg = '#fef2f2';
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

  const handleRegisterForEvent = async (personnelId: string) => {
    if (!selectedEvent) return;

    setRegisteringSlots(prev => new Set(prev).add(personnelId));

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personnelId }),
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

  if (!isClient || !session) {
    return null;
  }

  // Komponen pembantu untuk tampilan Event Info yang lebih bersih
  const EventInfoItem = ({ icon: IconComponent, text }: { icon: any, text: string }) => (
    <HStack spacing="2" color={textSecondary}>
      <Icon as={IconComponent} w={4} h={4} color={primaryColor} />
      <Text fontSize="sm">{text}</Text>
    </HStack>
  );

  return (
    <Box minH="100vh" bg={background}>
      {/* Fixed Sidebar */}
      <MemberSidebar activeRoute="events" />

      {/* Main Content */}
      <Box flex="1" ml={{ base: 0, md: '280px' }} p={{ base: 4, md: 8 }}>
        {/* Loading Overlay */}
        {contentLoading && (
          <Box
            position="fixed"
            top="0"
            left={{ base: 0, md: '280px' }}
            right="0"
            bottom="0"
            bg="rgba(255, 255, 255, 0.9)"
            backdropFilter="blur(4px)"
            zIndex="999"
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
            gap="4"
          >
            <Spinner size="xl" color={primaryColor} />
            <Text color={textSecondary}>Memuat data event...</Text>
          </Box>
        )}

        <VStack spacing="8" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="xl" color={textPrimary} fontWeight="extrabold">Daftar Event</Heading>
              <Text color={textSecondary}>Temukan dan daftar event yang tersedia</Text>
            </Box>
          </Flex>

          {/* Alert Info */}
          <Alert status="info" borderRadius="md" bg={alertBg} borderColor={borderColor} borderWidth="1px">
            <AlertIcon color={accentColor} />
            <Box>
              <Text fontWeight="bold" color="blue.800">Informasi Pendaftaran:</Text>
              <Text fontSize="sm">
                • Pendaftaran langsung diterima (First-Come, First-Served).<br />
                • Anda hanya dapat mendaftar untuk peran yang **sesuai** dengan keahlian Anda.<br />
                • Cek kembali halaman **Jadwal** setelah mendaftar.
              </Text>
            </Box>
          </Alert>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing="6">
            <Card bg={cardBg} boxShadow="lg" borderRadius="xl" border="1px" borderColor={borderColor}>
              <CardBody>
                <HStack spacing="4">
                  <Box bg={primaryBg} p="3" borderRadius="lg" border="1px solid" borderColor="red.200">
                    <Icon as={CalendarDaysIcon} w={6} h={6} color={primaryColor} />
                  </Box>
                  <VStack align="start" spacing="0">
                    <Text color={textSecondary} fontSize="sm">Total Event</Text>
                    <Heading size="lg" color={textPrimary}>{contentLoading ? <Spinner size="md" /> : events.length}</Heading>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
            <Card bg={cardBg} boxShadow="lg" borderRadius="xl" border="1px" borderColor={borderColor}>
              <CardBody>
                <HStack spacing="4">
                  <Box bg={successBg} p="3" borderRadius="lg" border="1px solid" borderColor="green.200">
                    <Icon as={CheckCircleIcon} w={6} h={6} color={successColor} />
                  </Box>
                  <VStack align="start" spacing="0">
                    <Text color={textSecondary} fontSize="sm">Slot Tersedia</Text>
                    <Heading size="lg" color={textPrimary}>
                      {contentLoading ? <Spinner size="md" /> : events.reduce((total, event) => total + getAvailableSlots(event).length, 0)}
                    </Heading>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
            <Card bg={cardBg} boxShadow="lg" borderRadius="xl" border="1px" borderColor={borderColor}>
              <CardBody>
                <HStack spacing="4">
                  <Box bg={primaryBg} p="3" borderRadius="lg" border="1px solid" borderColor="red.200">
                    <Icon as={StarIcon} w={6} h={6} color={primaryColor} />
                  </Box>
                  <VStack align="start" spacing="0">
                    <Text color={textSecondary} fontSize="sm">Sudah Terdaftar</Text>
                    <Heading size="lg" color={textPrimary}>
                      {contentLoading ? <Spinner size="md" /> : getMyRegistrations().length}
                    </Heading>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Available Events */}
          <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" boxShadow="xl" border="1px" borderColor={borderColor}>
            <Flex align="center" mb="6" pb="4" borderBottom="1px solid" borderColor={borderColor}>
              <Icon as={CalendarDaysIcon} w={6} h={6} color={primaryColor} mr="3" />
              <Heading size="lg" color={textPrimary}>Event Tersedia</Heading>
              <Spacer />
              <Badge colorScheme="red" variant="subtle" px="4" py="1" borderRadius="full">
                {contentLoading ? 'Memuat...' : `${events.length} Event`}
              </Badge>
            </Flex>

            {contentLoading ? (
              // Loading skeleton
              <VStack spacing="6" align="stretch">
                {[1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    bg={background}
                    p="6"
                    borderRadius="lg"
                    border="1px"
                    borderColor={borderColor}
                    opacity={0.7}
                  >
                    <Flex justify="space-between" align="start" mb="4">
                      <Box flex="1">
                        <Box height="6" width="300px" bg="gray.300" borderRadius="md" mb="2" />
                        <HStack spacing="4">
                          <Box height="4" width="120px" bg="gray.200" borderRadius="sm" />
                          <Box height="4" width="150px" bg="gray.200" borderRadius="sm" />
                        </HStack>
                      </Box>
                      <Box height="8" width="80px" bg="gray.300" borderRadius="full" />
                    </Flex>
                    <Progress value={50} size="xs" colorScheme="gray" borderRadius="full" mb="4" />
                    <SimpleGrid columns={{ base: 2, md: 3 }} gap="3">
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <HStack
                          key={j}
                          bg="white"
                          p="2"
                          borderRadius="md"
                          border="1px"
                          borderColor="gray.100"
                          justify="space-between"
                        >
                          <Box height="3" width="60%" bg="gray.200" borderRadius="sm" />
                          <Box height="3" width="20%" bg="gray.300" borderRadius="full" />
                        </HStack>
                      ))}
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
            ) : events.length === 0 ? (
              <Box textAlign="center" py="12">
                <Icon as={CalendarDaysIcon} w={12} h={12} color={textSecondary} mb="4" />
                <Text color={textSecondary} fontSize="xl" fontWeight="semibold">
                  Belum ada event yang tersedia saat ini.
                </Text>
                <Text color={textSecondary} fontSize="sm">
                  Cek kembali nanti untuk event mendatang.
                </Text>
              </Box>
            ) : (
              <VStack spacing="6" align="stretch">
                {events.map(event => {
                  const availableSlots = getAvailableSlots(event);
                  const isUserRegistered = event.personnel.some((p: any) => p.userId === session?.user?.id);
                  const completionPercentage = ((event.personnel.length - availableSlots.length) / event.personnel.length) * 100;

                  return (
                    <Box
                      key={event.id}
                      bg={cardBg}
                      p={{ base: 4, md: 6 }}
                      borderRadius="xl"
                      border="1px"
                      borderColor={borderColor}
                      boxShadow="sm"
                      _hover={{
                        bg: "gray.50",
                        shadow: 'lg',
                        transform: 'translateY(-2px)',
                        borderColor: primaryColor,
                      }}
                      transition="all 0.3s"
                    >
                      <Flex justify="space-between" align="start" mb="4">
                        <Box flex="1">
                          <Heading size="md" color={textPrimary} mb="2">{event.title}</Heading>
                          <HStack flexWrap="wrap" spacing={{ base: 2, md: 4 }} color={textSecondary} fontSize="sm">
                            <EventInfoItem
                              icon={ClockIcon}
                              text={new Date(event.date).toLocaleString('id-ID', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            />
                            <EventInfoItem
                              icon={MapPinIcon}
                              text={event.location}
                            />
                          </HStack>
                        </Box>
                        <VStack align="end" spacing="1">
                          <Badge colorScheme="green" variant="solid" px="3" py="1" borderRadius="full">
                            Dipublikasikan
                          </Badge>
                          {isUserRegistered && (
                            <Badge colorScheme="red" variant="subtle" px="3" py="1" borderRadius="full">
                              Anda Terdaftar
                            </Badge>
                          )}
                        </VStack>
                      </Flex>

                      {event.description && (
                        <Text color={textSecondary} fontSize="sm" mb="4" noOfLines={2}>
                          {event.description}
                        </Text>
                      )}

                      <Box mb="4">
                        <Flex justify="space-between" align="center" mb="2">
                          <Text fontSize="sm" fontWeight="bold" color={textPrimary}>
                            Slot Personel
                          </Text>
                          <Text fontSize="sm" color={textSecondary}>
                            <Text as="span" fontWeight="bold" color={availableSlots.length > 0 ? successColor : primaryColor}>{availableSlots.length}</Text> dari {event.personnel.length} Tersedia
                          </Text>
                        </Flex>
                        <Progress
                          value={completionPercentage}
                          size="sm"
                          colorScheme={completionPercentage > 80 ? 'red' : 'green'}
                          borderRadius="full"
                        />
                      </Box>

                      <SimpleGrid columns={{ base: 2, md: 3 }} gap="3" mb="4">
                        {event.personnel.map((personnel: any) => (
                          <HStack
                            key={personnel.id}
                            bg={personnel.user ? successBg : warningBg}
                            p="2"
                            borderRadius="md"
                            border="1px"
                            borderColor={personnel.user ? 'green.200' : 'yellow.200'}
                            justify="space-between"
                          >
                            <Tooltip label={`Role: ${personnel.role}`} placement="top" hasArrow>
                              <Text fontSize="xs" fontWeight="medium" color={textPrimary} maxW="70%" isTruncated>{personnel.role}</Text>
                            </Tooltip>
                            {personnel.user ? (
                              <Badge
                                colorScheme="green"
                                fontSize="xs"
                                borderRadius="full"
                                px="2"
                              >
                                Terisi
                              </Badge>
                            ) : (
                              <Badge colorScheme="yellow" fontSize="xs" borderRadius="full" px="2">
                                Tersedia
                              </Badge>
                            )}
                          </HStack>
                        ))}
                      </SimpleGrid>

                      <Flex justify="end">
                        {!isUserRegistered && availableSlots.length > 0 && (
                          <Button
                            bg={primaryColor}
                            color="white"
                            size="md"
                            onClick={() => openRegistrationModal(event)}
                            leftIcon={<Icon as={CheckCircleIcon} w={5} h={5} />}
                            _hover={{ bg: 'red.700', transform: 'translateY(-1px)', boxShadow: 'md' }}
                            _active={{ bg: 'red.800' }}
                            fontWeight="bold"
                          >
                            Daftar Sekarang
                          </Button>
                        )}

                        {isUserRegistered && (
                          <Button size="md" disabled leftIcon={<Icon as={CheckCircleIcon} w={5} h={5} />} bg="gray.100" color="gray.500" variant="solid">
                            Anda sudah terdaftar
                          </Button>
                        )}

                        {availableSlots.length === 0 && !isUserRegistered && (
                          <Button size="md" disabled bg="gray.100" color="gray.500" variant="solid">
                            Semua slot terisi
                          </Button>
                        )}
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        </VStack>

        {/* Enhanced Registration Modal */}
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="2xl"
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
              bg={primaryColor}
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
                    <Icon as={CalendarDaysIcon} w={6} h={6} />
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
                      {/* Event Details - Location, Time, Description */}
                      <VStack align="stretch" spacing="3">
                        {/* Location */}
                        <HStack spacing="3" color={textSecondary}>
                          <Icon as={MapPinIcon} w={4} h={4} color={primaryColor} />
                          <Text fontSize="sm" fontWeight="500">Lokasi:</Text>
                          <Text fontSize="sm">{selectedEvent.location}</Text>
                        </HStack>

                        {/* Date and Time */}
                        <HStack spacing="3" color={textSecondary}>
                          <Icon as={ClockIcon} w={4} h={4} color={primaryColor} />
                          <Text fontSize="sm" fontWeight="500">Waktu:</Text>
                          <Text fontSize="sm">
                            {new Date(selectedEvent.date).toLocaleString('id-ID', {
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

                      {/* Divider */}
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
                            <Text fontSize="lg" fontWeight="bold" color={primaryColor}>
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
                            <Icon as={UserIcon} w={4} h={4} mr="2" color="blue.600" />
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
                            <Icon as={UserIcon} w={4} h={4} mr="2" color={primaryColor} />
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
                          .map((personnel: any) => (
                            <Flex
                              key={personnel.id}
                              bg="white"
                              p="4"
                              borderRadius="xl"
                              border="2px solid"
                              borderColor={borderColor}
                              _hover={{
                                borderColor: primaryColor,
                                bg: primaryBg,
                                transform: 'translateY(-2px)',
                                shadow: 'md'
                              }}
                              transition="all 0.3s ease"
                              cursor="pointer"
                              onClick={() => handleRegisterForEvent(personnel.id)}
                              align="center"
                              justify="space-between"
                            >
                              <HStack spacing="3">
                                <Box bg={primaryBg} p="2" borderRadius="lg" border="1px solid" borderColor="red.200">
                                  <Icon as={UserIcon} w={5} h={5} color={primaryColor} />
                                </Box>
                                <VStack align="start" spacing="0">
                                  <Text fontWeight="bold" color={textPrimary} fontSize="md">
                                    {personnel.role}
                                  </Text>
                                  <Text fontSize="xs" color={textSecondary}>
                                    Klik untuk mendaftar
                                  </Text>
                                </VStack>
                              </HStack>

                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="solid"
                                isLoading={registeringSlots.has(personnel.id)}
                                loadingText="Mendaftar..."
                                rightIcon={<Icon as={CheckCircleIcon} w={4} h={4} />}
                                onClick={(e) => {
                                  e.stopPropagation(); // Mencegah klik dari Box parent
                                  handleRegisterForEvent(personnel.id);
                                }}
                                _hover={{ bg: 'red.700' }}
                              >
                                {registeringSlots.has(personnel.id) ? 'Proses' : 'Daftar'}
                              </Button>

                            </Flex>
                          ))}
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
                          <Icon as={UserIcon} w={8} h={8} color="gray.400" mb="2" />
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
      </Box>
    </Box>
  );
}

// Catatan: Pastikan Heroicons Anda diinstal dan komponen MemberSidebar tersedia.