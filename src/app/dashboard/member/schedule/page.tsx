'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Heading,
  Stack,
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
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Divider,
  Flex,
  Spacer,
  Spinner,
  useColorModeValue,
  Avatar,
  SimpleGrid as Grid,
  Center,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  StarIcon,
  UserIcon,
  MusicalNoteIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';
import MemberSidebar from '@/components/MemberSidebar';
import MemberHeader from '@/components/MemberHeader';
import SearchParamsHandler from '@/components/SearchParamsHandler';
import Footer from '@/components/Footer';

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [events, setEvents] = useState<EventWithPersonnel[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [eventPersonnel, setEventPersonnel] = useState<any[]>([]);
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Theme variables consistent with EventDetailModal
  const bgCard = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const borderColor = '#e5e7eb';
  const bgHeader = '#f9fafb';
  const bgAccentLight = '#dbeafe';
  const statusBoxBg = '#f9fafb';

  // Helper function to format dates with proper timezone
  const formatDateID = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      ...options
    });
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (
      status === 'authenticated' &&
      (session?.user?.organizationLvl === 'COMMISSIONER' ||
        session?.user?.organizationLvl === 'PENGURUS')
    ) {
      router.push('/dashboard/manager');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status]);

  
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

  const handleCancelRegistration = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/events/personnel/${registrationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Berhasil',
          description: 'Pendaftaran berhasil dibatalkan',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchEvents();
        onClose();
      } else {
        throw new Error('Failed to cancel registration');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membatalkan pendaftaran',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getUserRegistrations = () => {
    if (!session?.user?.id) return [];
    return events.flatMap((event: any) =>
      event.personnel
        .filter((p: any) => p.userId === session.user.id)
        .map((p: any) => ({
          ...p,
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
          eventDescription: event.description,
          // Add event personnel data for fallback
          eventPersonnel: event.personnel || [],
        })),
    );
  };

  const getUpcomingEvents = () => {
    const registrations = getUserRegistrations();
    return registrations
      .filter((reg) => new Date(reg.eventDate) > new Date())
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  };

  const getPastEvents = () => {
    const registrations = getUserRegistrations();
    return registrations
      .filter((reg) => new Date(reg.eventDate) <= new Date())
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  };

  const fetchEventPersonnel = async (eventId: string) => {
    if (!eventId) {
      console.error('No eventId provided');
      setEventPersonnel([]);
      setPersonnelLoading(false);
      return;
    }

    setPersonnelLoading(true);
    console.log('🔄 Fetching event detail for personnel:', eventId);

    try {
      // Use same API as EventDetailModal
      const response = await fetch(`/api/events/${eventId}/detail`);
      console.log('📡 Event detail API response status:', response.status);

      if (response.ok) {
        const eventData = await response.json();
        console.log('✅ Event detail data received:', {
          personnelCount: eventData.personnel?.length || 0,
          hasPersonnel: !!eventData.personnel
        });
        setEventPersonnel(eventData.personnel || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch event detail:', response.status, errorText);

        // Fallback to event data
        const eventPersonnel = selectedRegistration?.eventPersonnel || [];
        console.log('🔄 Using fallback personnel data:', eventPersonnel.length, 'personnel');
        setEventPersonnel(eventPersonnel);
      }
    } catch (error) {
      console.error('❌ Error fetching event detail:', error);

      // Fallback to event data
      const eventPersonnel = selectedRegistration?.eventPersonnel || [];
      console.log('🔄 Using fallback personnel data due to error:', eventPersonnel.length, 'personnel');
      setEventPersonnel(eventPersonnel);
    } finally {
      setPersonnelLoading(false);
    }
  };

  const openEventDetail = (registration: any) => {
    console.log('📋 Opening event detail:', registration);
    setSelectedRegistration(registration);
    setEventPersonnel([]); // Reset personnel data
    setIsDetailModalOpen(true);

    // Check if eventId exists
    if (registration.eventId) {
      console.log('✅ Event ID found:', registration.eventId);
      // Fetch personnel when modal opens
      fetchEventPersonnel(registration.eventId);
    } else {
      console.error('❌ No eventId in registration:', registration);
      toast({
        title: 'Error',
        description: 'Event ID tidak ditemukan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const closeEventDetail = () => {
    setSelectedRegistration(null);
    setEventPersonnel([]); // Reset personnel data
    setIsDetailModalOpen(false);

    // Clean up URL parameters if they exist
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('modal');
      url.searchParams.delete('eventId');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const navigateToSongManager = () => {
    if (selectedRegistration?.eventId) {
      router.push(`/dashboard/songs?eventId=${selectedRegistration.eventId}`);
    }
  };

  if (!isClient || !session) return null;

  // 🎨 Light Mode Theme Variables
  const bgMain = '#ffffff'; // Putih bersih/ Abu-abu sedang
  const alertBg = '#f3f4f6'; // Abu-abu sangat terang
  const cardBg = '#ffffff';
  const upcomingCardBg = '#f8fafc'; // Latar belakang item event yang lebih terang
  const pastCardBg = '#f0fdf4'; // Latar belakang event selesai
  const accentColor = '#dc2626';
  const accentBg = '#fef2f2';
  const successColor = '#10b981';
  const warningColor = '#f59e0b';
  const dangerColor = '#ef4444';

  return (
    <Box minH="100vh" bg={bgMain}>
      <MemberSidebar activeRoute="schedule" />
      <MemberHeader />

      {/* SearchParams handler with Suspense boundary */}
      <Suspense fallback={null}>
        <SearchParamsHandler
          events={getUserRegistrations()}
          contentLoading={contentLoading}
          openEventDetail={openEventDetail}
        />
      </Suspense>
      <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 8 }}>
        {/* Loading Overlay */}
        {contentLoading && (
          <Box
            position="fixed"
            top="0"
            left={{ base: 0, md: '280px' }}
            right="0"
            bottom="0"
            bg="rgba(255, 255, 255, 0.8)"
            backdropFilter="blur(6px)"
            zIndex="999"
            display="flex"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
            gap="4"
          >
            <Spinner size="xl" color="red.500" />
            <Text color={textPrimary}>Memuat data event...</Text>
          </Box>
        )}

        <VStack spacing="8" align="stretch">
          {/* Header dan Refresh Button */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary}>
                Jadwal Saya
              </Heading>
              <Text color={textSecondary}>
                Kelola jadwal dan partisipasi event Anda
              </Text>
            </Box>
          </Flex>

          {/* Info Alert */}
          <Alert status="info" borderRadius="md" bg={alertBg} borderColor={borderColor} borderWidth="1px">
            <AlertIcon color={accentColor} />
            <Box>
              <Text fontWeight="bold" color={textPrimary}>
                Informasi:
              </Text>
              <Text fontSize="sm" color={textPrimary}>
                Anda dapat melihat semua event yang Anda daftarkan di sini. Klik pada event untuk detail dan manajemen lagu.
              </Text>
            </Box>
          </Alert>

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing="6">
            {[
              {
                label: 'Total Event',
                count: getUserRegistrations().length,
                icon: <CalendarDaysIcon width={24} height={24} color="#dc2626" />,
              },
              {
                label: 'Akan Datang',
                count: getUpcomingEvents().length,
                icon: <ClockIcon width={24} height={24} color="#dc2626" />,
              },
              {
                label: 'Selesai',
                count: getPastEvents().length,
                icon: <CheckCircleIcon width={24} height={24} color="#10b981" />,
              },
            ].map((item, idx) => (
              <Card
                key={idx}
                bg={cardBg}
                boxShadow="base"
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
              >
                <CardBody>
                  <VStack align="start" spacing="2">
                    <HStack>
                      <Box p="2" borderRadius="md" bg="#f1f5f9">
                        {item.icon}
                      </Box>
                      <Text color={textSecondary} fontSize="sm">
                        {item.label}
                      </Text>
                    </HStack>
                    <Heading size="lg" color={textPrimary}>
                      {contentLoading ? '-' : item.count}
                    </Heading>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
          
          {/* Upcoming Events List */}
          {!contentLoading && getUpcomingEvents().length > 0 && (
            <Box bg={cardBg} p="6" borderRadius="lg" boxShadow="md" border="1px" borderColor={borderColor}>
              <Flex align="center" mb="6">
                <Box bg="#fee2e2" p="2" borderRadius="md" mr="3">
                  <ClockIcon width={20} height={20} color="#dc2626" />
                </Box>
                <Heading size="md" color={textPrimary}>
                  Event Akan Datang
                </Heading>
                <Spacer />
                <Badge colorScheme="red" px="3" py="1">
                  {getUpcomingEvents().length} Event
                </Badge>
              </Flex>

              <VStack spacing="3" align="stretch">
                {getUpcomingEvents().map((registration) => (
                  <Box
                    key={registration.id}
                    bg={upcomingCardBg}
                    p="4"
                    borderRadius="md"
                    border="1px"
                    borderColor={borderColor}
                    _hover={{ bg: '#eef2ff', shadow: 'md', transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => openEventDetail(registration)}
                  >
                    <Flex justify="space-between" align="center">
                      <Box flex="1">
                        <HStack mb="2">
                          <StarIcon width={16} height={16} color="#f59e0b" />
                          <Text fontWeight="bold" color={textPrimary}>
                            {registration.eventTitle}
                          </Text>
                          <Badge
                            bg="#dbeafe"
                            px="2"
                            py="1"
                            borderRadius="full"
                            color="#1e40af"
                            textTransform="none"
                            onClick={(e) => e.stopPropagation()}
                            cursor="pointer"
                          >
                            <Text fontSize="xs">Lihat Detail</Text>
                          </Badge>
                        </HStack>
                        <HStack spacing="4" color={textSecondary} fontSize="sm">
                          <HStack>
                            <UserIcon width={14} height={14} />
                            <Text fontWeight="semibold">{registration.role}</Text>
                          </HStack>
                          <HStack>
                            <CalendarDaysIcon width={14} height={14} />
                            <Text>
                              {new Date(registration.eventDate).toLocaleString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </HStack>
                          <HStack>
                            <MapPinIcon width={14} height={14} />
                            <Text>{registration.eventLocation}</Text>
                          </HStack>
                        </HStack>
                      </Box>
                      <VStack spacing="2">
                        <Badge colorScheme="green" px="3" py="1" borderRadius="full">
                          Terdaftar
                        </Badge>
                      </VStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Past Events List */}
          {!contentLoading && getPastEvents().length > 0 && (
            <Box bg={cardBg} p="6" borderRadius="lg" boxShadow="md" border="1px" borderColor={borderColor}>
              <Flex align="center" mb="6">
                <Box bg="#d1fae5" p="2" borderRadius="md" mr="3">
                  <CheckCircleIcon width={20} height={20} color="#059669" />
                </Box>
                <Heading size="md" color={textPrimary}>
                  Event Selesai
                </Heading>
                <Spacer />
                <Badge colorScheme="green" px="3" py="1">
                  {getPastEvents().length} Event
                </Badge>
              </Flex>

              <VStack spacing="3" align="stretch">
                {getPastEvents().map((registration) => (
                  <Box
                    key={registration.id}
                    bg={pastCardBg}
                    p="4"
                    borderRadius="md"
                    border="1px"
                    borderColor={borderColor}
                    _hover={{ bg: '#ecfdf5', shadow: 'md', transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => openEventDetail(registration)}
                  >
                    <Flex justify="space-between" align="center">
                      <Box flex="1">
                        <HStack mb="2">
                          <CheckCircleIcon width={16} height={16} color="#059669" />
                          <Text fontWeight="bold" color={textPrimary}>
                            {registration.eventTitle}
                          </Text>
                        </HStack>
                        <HStack spacing="4" color={textSecondary} fontSize="sm">
                          <HStack>
                            <UserIcon width={14} height={14} />
                            <Text fontWeight="semibold">{registration.role}</Text>
                          </HStack>
                          <HStack>
                            <CalendarDaysIcon width={14} height={14} />
                            <Text>
                              {new Date(registration.eventDate).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </Text>
                          </HStack>
                          <HStack>
                            <MapPinIcon width={14} height={14} />
                            <Text>{registration.eventLocation}</Text>
                          </HStack>
                        </HStack>
                      </Box>
                      <Badge colorScheme="gray" px="3" py="1" borderRadius="full">
                          Selesai
                      </Badge>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Empty State */}
          {!contentLoading && getUserRegistrations().length === 0 && (
            <Box bg={cardBg} p="6" borderRadius="lg" boxShadow="sm" border="1px" borderColor={borderColor}>
              <VStack spacing="4" py="12">
                <CalendarDaysIcon width={48} height={48} color="#94a3b8" />
                <Text color={textSecondary} fontSize="lg" fontWeight="bold">
                  Belum Ada Jadwal
                </Text>
                <Text color={textSecondary} fontSize="sm" textAlign="center">
                  Anda belum mendaftar untuk event apa pun.
                  <br />
                  Kunjungi halaman Daftar Event untuk melihat event yang tersedia.
                </Text>
                <Button colorScheme="red" onClick={() => router.push('/dashboard/member/available-events')}>
                  Lihat Event Tersedia
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>

        {/* Modal Batalkan Pendaftaran */}
<Modal
  isOpen={isOpen}
  onClose={onClose}
  size={{ base: 'xs', sm: 'sm', md: 'md' }}
  isCentered
>
  <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
  <ModalContent
    borderRadius="xl"
    overflow="hidden"
    mx={{ base: 4, md: 0 }}
  >
    {/* HEADER */}
    <ModalHeader
      bg={bgHeader}
      borderBottomWidth="1px"
      borderColor={borderColor}
      py={{ base: 3, md: 4 }}
    >
      <HStack spacing={3}>
        <CalendarDaysIcon width={20} height={20} color={dangerColor} />
        <Box>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="bold"
            color={textPrimary}
          >
            Batalkan Pendaftaran
          </Text>
          <Text
            fontSize="sm"
            color={textSecondary}
          >
            Konfirmasi tindakan ini
          </Text>
        </Box>
      </HStack>
    </ModalHeader>

    <ModalCloseButton size="sm" />

    {/* BODY */}
    <ModalBody p={{ base: 4, md: 5 }}>
      {selectedEvent && (
        <VStack align="stretch" spacing={4}>
          {/* Info Event */}
          <Box>
            <Heading
              size="sm"
              color={textPrimary}
              mb={2}
              noOfLines={2}
            >
              {selectedEvent.eventTitle}
            </Heading>

            <VStack
              align="start"
              spacing={1.5}
              color={textSecondary}
              fontSize="sm"
            >
              <HStack>
                <UserIcon width={14} height={14} />
                <Text>{selectedEvent.role}</Text>
              </HStack>
              <HStack>
                <CalendarDaysIcon width={14} height={14} />
                <Text>
                  {new Date(selectedEvent.eventDate).toLocaleString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </HStack>
              <HStack>
                <MapPinIcon width={14} height={14} />
                <Text noOfLines={1}>{selectedEvent.eventLocation}</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Warning Section */}
          <Alert
            status="warning"
            borderRadius="md"
            bg="#fef3c7"
            borderColor="#f59e0b"
            borderWidth="1px"
          >
            <AlertIcon color={warningColor} />
            <Text fontSize="sm" color={textSecondary}>
              Slot kamu akan tersedia untuk anggota lain, dan setlist yang sudah dibuat akan hilang.
            </Text>
          </Alert>
        </VStack>
      )}
    </ModalBody>

    {/* FOOTER */}
    <ModalFooter
      borderTop="1px solid"
      borderColor={borderColor}
      py={{ base: 3, md: 4 }}
    >
      <VStack spacing={3} w="full">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          colorScheme="gray"
          w="full"
        >
          Batal
        </Button>
        {selectedEvent && (
          <Button
            colorScheme="red"
            size="sm"
            onClick={() => handleCancelRegistration(selectedEvent.id)}
            w="full"
          >
            Ya, Batalkan Pendaftaran
          </Button>
        )}
      </VStack>
    </ModalFooter>
  </ModalContent>
</Modal>


        {/* Modal Detail Event */}
<Modal
  isOpen={isDetailModalOpen}
  onClose={closeEventDetail}
  size={{ base: 'sm', sm: 'md', md: 'lg', lg: '2xl' }}
  isCentered
>
  <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
  <ModalContent borderRadius="xl" overflow="hidden" mx={{ base: 4, md: 0 }}>
    <ModalHeader
      bg={bgHeader}
      borderBottomWidth="1px"
      borderColor={borderColor}
      py={{ base: 3, md: 4 }}
    >
      <HStack spacing="3">
        <CalendarDaysIcon width={20} height={20} color={accentColor} />
        <Box>
          <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" color={textPrimary}>
            Detail Event
          </Text>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color={textSecondary}>
            Informasi dan manajemen lagu
          </Text>
        </Box>
      </HStack>
    </ModalHeader>

    <ModalCloseButton size={{ base: 'sm', md: 'md' }} />

    <ModalBody p={{ base: 5, md: 6 }}>
      {selectedRegistration && (
        <VStack align="stretch" spacing={5}>
          {/* Info Event */}
          <Box>
            <Heading
              size={{ base: 'sm', md: 'md' }}
              color={textPrimary}
              mb={2}
              lineHeight="short"
            >
              {selectedRegistration.eventTitle}
            </Heading>

            <VStack
              align="start"
              spacing={2}
              color={textSecondary}
              fontSize={{ base: 'sm', md: 'sm' }}
            >
              <HStack spacing={2}>
                <CalendarDaysIcon width={16} height={16} />
                <Text>
                  {new Date(selectedRegistration.eventDate).toLocaleString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </HStack>

              <HStack spacing={2}>
                <MapPinIcon width={16} height={16} />
                <Text>{selectedRegistration.eventLocation}</Text>
              </HStack>

              {selectedRegistration.eventDescription && (
                <HStack align="start" spacing={2}>
                  <InformationCircleIcon width={16} height={16} />
                  <Text
                    fontSize={{ base: 'sm', md: 'sm' }}
                    color={textSecondary}
                    whiteSpace="pre-wrap"
                  >
                    {selectedRegistration.eventDescription}
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>

          <Divider />

          {/* Status User */}
          <HStack
            spacing={4}
            p={4}
            bg={statusBoxBg}
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            justify="space-between"
          >
            <HStack spacing={3}>
              <Avatar size="sm" name={session?.user?.name} bg={accentColor} />
              <Box>
                <Text fontWeight="semibold" fontSize="sm" color={textPrimary}>
                  {session?.user?.name}
                </Text>
                <Text fontSize="xs" color={textSecondary}>
                  {selectedRegistration.role}
                </Text>
              </Box>
            </HStack>

            <Badge
              colorScheme="green"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="full"
            >
              TERDAFTAR
            </Badge>
          </HStack>

          {/* Personnel Event - Using EventDetailModal style */}
          <VStack align="stretch" spacing="4">
            <Flex justify="space-between" align="center" mb="3">
              <Heading
                size={{ base: 'sm', md: 'sm' }}
                color={textPrimary}
              >
                Personel Terdaftar
              </Heading>
              <Badge fontSize="xs" px="2" py="1" borderRadius="md">
                {eventPersonnel.filter(p => p.status === 'APPROVED').length} / {eventPersonnel.length}
              </Badge>
            </Flex>

            {personnelLoading ? (
              <Box
                bg="gray.50"
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                p="6"
                textAlign="center"
              >
                <Spinner size="sm" color={accentColor} mb="2" />
                <Text color={textSecondary} fontSize="sm">
                  Memuat data personel...
                </Text>
              </Box>
            ) : eventPersonnel.length > 0 ? (
              <VStack
                align="stretch"
                spacing="2"
                maxH="280px" // Max height for 8 items
                overflowY="auto"
                p="2"
                bg="gray.50"
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#a8a8a8',
                  },
                }}
              >
                {eventPersonnel.map((p: any) => (
                  <HStack
                    key={p.id}
                    spacing="3"
                    justify="space-between"
                    p="2"
                    borderRadius="md"
                    bg={p.user ? 'white' : 'gray.100'}
                    border="1px solid"
                    borderColor={p.user ? borderColor : 'gray.300'}
                  >
                    <HStack minW="0" flex="1">
                      <Avatar
                        size="sm"
                        name={p.user?.name || p.role}
                        bg={p.user ? accentColor : 'gray.400'}
                      />
                      <VStack align="start" spacing="0" minW="0" flex="1">
                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color={textPrimary}
                          noOfLines={1}
                        >
                          {p.user?.name || 'Slot Kosong'}
                        </Text>
                        {p.user?.nim && (
                          <Text fontSize="11px" color={textSecondary} noOfLines={1}>
                            {p.user.nim}
                          </Text>
                        )}
                        <Text fontSize="12px" color={textSecondary} noOfLines={1}>
                          {p.role}
                        </Text>
                      </VStack>
                    </HStack>

                    {p.user && (
                      <Badge
                        colorScheme={
                          p.status === 'APPROVED'
                            ? 'green'
                            : p.status === 'PENDING'
                            ? 'yellow'
                            : 'red'
                        }
                        fontSize="10px"
                        px="2"
                        py="1"
                        borderRadius="sm"
                      >
                        {p.status}
                      </Badge>
                    )}
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Box
                bg="gray.50"
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                p="6"
                textAlign="center"
              >
                <Text fontSize="sm" color={textSecondary}>
                  Belum ada personel terdaftar
                </Text>
              </Box>
            )}
          </VStack>

          {/* Manajemen Lagu */}
          <Box>
            <Heading
              size={{ base: 'sm', md: 'sm' }}
              color={textPrimary}
              mb={3}
            >
              Manajemen Lagu
            </Heading>

            <Alert
              status="info"
              borderRadius="md"
              bg={statusBoxBg}
              borderColor={borderColor}
              borderWidth="1px"
            >
              <AlertIcon color={accentColor} />
              <Text fontSize="sm" color={textSecondary}>
                Kelola setlist, tambah lagu, dan atur urutan penampilan untuk event ini.
              </Text>
            </Alert>
          </Box>
        </VStack>
      )}
    </ModalBody>

    <ModalFooter
      borderTop="1px solid"
      borderColor={borderColor}
      py={{ base: 3, md: 4 }}
    >
      <HStack
        w="full"
        spacing={3}
        justify="flex-end"
        flexWrap="wrap"
      >
        <Button
          leftIcon={<MusicalNoteIcon width={16} height={16} />}
          onClick={navigateToSongManager}
          colorScheme="blue"
          variant="outline"
          size="sm"
        >
          Kelola Lagu
        </Button>
        <Button
          colorScheme="red"
          size="sm"
          onClick={() => {
            setSelectedEvent(selectedRegistration);
            closeEventDetail();
            onOpen();
          }}
        >
          Batalkan
        </Button>
        <Button
          variant="ghost"
          onClick={closeEventDetail}
        >
          Tutup
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