'use client';

import { useState, useEffect } from 'react';
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

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [events, setEvents] = useState<EventWithPersonnel[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithPersonnel | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
    try {
      const response = await fetch('/api/events/member');
      if (response.ok) {
        const data = await response.json();
        // Handle new API response format: {events, pagination}
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

  const openEventDetail = (registration: any) => {
    setSelectedRegistration(registration);
    setIsDetailModalOpen(true);
  };

  const closeEventDetail = () => {
    setSelectedRegistration(null);
    setIsDetailModalOpen(false);
  };

  const navigateToSongManager = () => {
    if (selectedRegistration?.eventId) {
      console.log('Navigating to songs with eventId:', selectedRegistration.eventId);
      router.push(`/dashboard/songs?eventId=${selectedRegistration.eventId}`);
    } else {
      console.log('No eventId found in selectedRegistration:', selectedRegistration);
    }
  };

  if (!isClient || !session) return null;

  // 🌤️ Light neutral theme
// Clean white theme
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const alertBg = '#f3f4f6';
  const cardBg = '#ffffff';
  const borderColor = '#e5e7eb';

  return (
    <Box minH="100vh" bg={bgMain}>
      <MemberSidebar activeRoute="schedule" />
      <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
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
          </Box>
        )}

        <VStack spacing="8" align="stretch">
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary}>
                Jadwal Saya
              </Heading>
              <Text color={textSecondary}>
                Kelola jadwal dan partisipasi event Anda
              </Text>
            </Box>
            <Button
              colorScheme="red"
              onClick={fetchEvents}
              leftIcon={<CalendarDaysIcon width={20} height={20} />}
              isLoading={contentLoading}
              loadingText="Memuat..."
            >
              Refresh Data
            </Button>
          </Flex>

          <Alert status="info" borderRadius="md" bg={alertBg}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" color={textPrimary}>
                Informasi:
              </Text>
              <Text fontSize="sm" color={textSecondary}>
                Anda dapat melihat semua event yang Anda daftarkan di sini. Gunakan tombol
                "Batalkan" jika ingin membatalkan partisipasi.
              </Text>
            </Box>
          </Alert>

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
                boxShadow="sm"
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

          {/* Upcoming Events */}
          {!contentLoading && getUpcomingEvents().length > 0 && (
            <Box bg={cardBg} p="6" borderRadius="lg" boxShadow="sm" border="1px" borderColor={borderColor}>
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
                    bg="#f8fafc"
                    p="4"
                    borderRadius="md"
                    border="1px"
                    borderColor={borderColor}
                    _hover={{ bg: '#f1f5f9', shadow: 'md', transform: 'translateY(-1px)' }}
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
                          <Box
                            bg="#dbeafe"
                            px="2"
                            py="1"
                            borderRadius="full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Text fontSize="xs" color="#1e40af">
                              Lihat Detail
                            </Text>
                          </Box>
                        </HStack>
                        <HStack spacing="4" color={textSecondary} fontSize="sm">
                          <HStack>
                            <UserIcon width={14} height={14} />
                            <Text>{registration.role}</Text>
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
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(registration);
                            onOpen();
                          }}
                        >
                          Batalkan
                        </Button>
                      </VStack>
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
                  Kunjungi halaman "Daftar Event" untuk melihat event yang tersedia.
                </Text>
                <Button colorScheme="red" onClick={() => router.push('/dashboard/available-events')}>
                  Lihat Event Tersedia
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>

        {/* Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Batalkan Pendaftaran</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedEvent && (
                <VStack align="stretch" spacing="4">
                  <Box>
                    <Heading size="sm">{selectedEvent.eventTitle}</Heading>
                    <Text color="gray.600" fontSize="sm">
                      {selectedEvent.role} •{' '}
                      {new Date(selectedEvent.eventDate).toLocaleString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Box>
                  {selectedEvent.eventDescription && (
                    <Box>
                      <Text fontWeight="bold" mb="1">
                        Deskripsi:
                      </Text>
                      <Text fontSize="sm">{selectedEvent.eventDescription}</Text>
                    </Box>
                  )}
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm">
                        Apakah Anda yakin ingin membatalkan pendaftaran untuk event ini? Slot
                        ini akan tersedia untuk anggota lain.
                      </Text>
                    </Box>
                  </Alert>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Batal
              </Button>
              {selectedEvent && (
                <Button colorScheme="red" onClick={() => handleCancelRegistration(selectedEvent.id)}>
                  Ya, Batalkan
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Event Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeEventDetail}
          size="2xl"
          isCentered
          scrollBehavior="inside"
        >
          <ModalOverlay
            backdropFilter="blur(8px)"
            bg="rgba(0, 0, 0, 0.6)"
          />
          <ModalContent
            borderRadius="2xl"
            boxShadow="2xl"
            overflow="hidden"
            bg="white"
          >
            {/* Modal Header dengan gradient */}
            <Box
  // Gradient dari Merah Terang ke Merah Gelap (Maroon)
  bg="linear-gradient(135deg, #FF416C 0%, #D40C0C 100%)"
  p="6"
  position="relative"
>
              <ModalCloseButton
                color="white"
                _hover={{ bg: 'rgba(255,255,255,0.2)' }}
                borderRadius="full"
                w="8"
                h="8"
              />
              <VStack align="start" spacing="2" color="white">
                <HStack>
                  <Box bg="rgba(255,255,255,0.2)" p="2" borderRadius="md">
                    <InformationCircleIcon width={24} height={24} />
                  </Box>
                  <Box>
                    <Heading size="lg" color="white">Detail Event</Heading>
                    <Text color="rgba(255,255,255,0.9)" fontSize="sm">
                      Informasi lengkap dan manajemen lagu
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>

            <ModalBody p="0">
              {selectedRegistration && (
                <VStack align="stretch" spacing="0">
                  {/* Event Info Card */}
                  <Box
                    bg="gray.50"
                    p="6"
                    borderBottom="1px"
                    borderColor="gray.200"
                  >
                    <VStack align="stretch" spacing="4">
                      <HStack align="start">
                        <Box
                          bg="#fef2f2"
                          p="3"
                          borderRadius="xl"
                          border="2px solid"
                          borderColor="#dc2626"
                        >
                          <CalendarDaysIcon width={28} height={28} color="#dc2626" />
                        </Box>
                        <Box flex="1">
                          <Heading size="md" color={textPrimary} mb="2">
                            {selectedRegistration.eventTitle}
                          </Heading>
                          <VStack align="start" spacing="2" color={textSecondary}>
                            <HStack>
                              <ClockIcon width={16} height={16} />
                              <Text fontSize="sm">
                                {new Date(selectedRegistration.eventDate).toLocaleString('id-ID', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </HStack>
                            <HStack>
                              <MapPinIcon width={16} height={16} />
                              <Text fontSize="sm">{selectedRegistration.eventLocation}</Text>
                            </HStack>
                          </VStack>
                        </Box>
                      </HStack>

                      {selectedRegistration.eventDescription && (
                        <Box
                          bg="white"
                          p="4"
                          borderRadius="lg"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <HStack align="start" mb="2">
                            <InformationCircleIcon width={16} height={16} color="#dc2626" />
                            <Text fontWeight="bold" color={textPrimary}>
                              Deskripsi Event
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color={textSecondary} lineHeight="1.6">
                            {selectedRegistration.eventDescription}
                          </Text>
                        </Box>
                      )}

                      {/* User Role Info */}
                      <HStack spacing="4" justify="space-between">
                        <Box
                          bg="white"
                          p="4"
                          borderRadius="lg"
                          flex="1"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <VStack align="center" spacing="2">
                            <UserIcon width={20} height={20} color="#dc2626" />
                            <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                              {selectedRegistration.role}
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>Peran Anda</Text>
                          </VStack>
                        </Box>
                        <Box
                          bg="white"
                          p="4"
                          borderRadius="lg"
                          flex="1"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <VStack align="center" spacing="2">
                            <CheckCircleIcon width={20} height={20} color="#10b981" />
                            <Text fontSize="lg" fontWeight="bold" color="#10b981">
                              Terdaftar
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>Status</Text>
                          </VStack>
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Song Management Section */}
                  <Box p="6">
                    <VStack align="stretch" spacing="4">
                      <HStack justify="space-between" align="center">
                        <Heading size="sm" color={textPrimary}>
                          <MusicalNoteIcon width={16} height={16} mr="2" />
                          Manajemen Lagu
                        </Heading>
                        <Badge bg="#fef2f2" color="#dc2626" px="3" py="1" borderRadius="full">
                          Kelola setlist untuk event ini
                        </Badge>
                      </HStack>

                      <Alert
                        status="info"
                        borderRadius="xl"
                        bg="#f0f9ff"
                        borderColor="#bfdbfe"
                        borderWidth="1px"
                      >
                        <AlertIcon color="#3b82f6" />
                        <VStack align="start" spacing="2">
                          <Text fontWeight="600" color={textPrimary} fontSize="sm">
                            Manajemen Lagu Event
                          </Text>
                          <Text fontSize="xs" color={textSecondary} lineHeight="1.5">
                            • Tambahkan lagu-lagu yang akan dibawakan dalam event<br />
                            • Atur urutan pemilihan dan setlist<br />
                            • Berikan informasi kunci dan aransemen untuk setiap lagu
                          </Text>
                        </VStack>
                      </Alert>

                      {/* Action Buttons */}
                      <HStack spacing="4" justify="center" pt="2">
                        <Button
                          colorScheme="red"
                          size="lg"
                          onClick={navigateToSongManager}
                          leftIcon={<MusicalNoteIcon width={20} height={20} />}
                          _hover={{ bg: '#2563eb' }}
                          px="8"
                        >
                          Kelola Lagu
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={closeEventDetail}
                          px="8"
                        >
                          Tutup
                        </Button>
                      </HStack>
                    </VStack>
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
