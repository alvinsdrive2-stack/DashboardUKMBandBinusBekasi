'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Divider,
  Heading,
  Button,
  SimpleGrid,
  useColorModeValue,
  useToast,
  Box,
  Flex, Spinner,
} from '@chakra-ui/react';
import {
  ArrowLeftIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';
import { useSession } from 'next-auth/react';
import { useState,useEffect,useCallback } from 'react';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventWithPersonnel & { availableSlots?: any[] } | null;
  currentUserId?: string;
  viewMode?: string;
}

export default function EventDetailModal({
  isOpen,
  onClose,
  event,
}: EventDetailModalProps) {
  const { data: session } = useSession();
  const toast = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventDetail, setEventDetail] = useState<EventWithPersonnel | null>(null);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);

  const bgCard = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const borderColor = '#e5e7eb';
  const accentColor = 'red.500';
  const bgHeader = '#f9fafb';

  // Fetch event detail with all personnel when modal opens
  const fetchEventDetail = useCallback(async () => {
    if (!event || !event.id) return;

    setLoadingPersonnel(true);
    try {
      const response = await fetch(`/api/events/${event.id}/detail`);
      if (response.ok) {
        const eventData = await response.json();
        setEventDetail(eventData);
      } else {
        console.error('Failed to fetch event detail');
        setEventDetail(event);
      }
    } catch (error) {
      console.error('Error fetching event detail:', error);
      setEventDetail(event);
    } finally {
      setLoadingPersonnel(false);
    }
  }, [event]);

  const isManager =
    session?.user?.organizationLvl &&
    ['COMMISSIONER', 'PENGURUS'].includes(session.user.organizationLvl);

  // Use eventDetail if available, otherwise fallback to original event
  const displayEvent = eventDetail || event;
  const filledSlots = displayEvent?.personnel?.filter((p: any) => p.user).length || 0;
  const totalSlots = displayEvent?.personnel?.length || 0;
  const availableSlotsCount = totalSlots - filledSlots;
  const eventDate = displayEvent ? new Date(displayEvent.date) : null;

  // Fetch event detail when modal opens
  useEffect(() => {
    if (isOpen && event?.id) {
      fetchEventDetail();
    }
  }, [isOpen, event, fetchEventDetail]);

  if (!displayEvent) return null;

  const downloadPDF = async () => {
    if (!event) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/pdf`);
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Event_Report_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Berhasil!',
        description: 'Laporan event berhasil diunduh.',
        status: 'success',
        duration: 3000,
      });
    } catch {
      toast({
        title: 'Gagal mengunduh',
        description: 'Silakan coba lagi.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!isManager || !event) return;
    const confirmed = confirm(`Hapus event "${event.title}"?`);
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/events/manager/${event.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({
        title: 'Event dihapus',
        status: 'success',
        duration: 3000,
      });
      onClose();
      window.location.reload();
    } catch {
      toast({
        title: 'Gagal menghapus',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: 'full', sm: 'xl', md: '2xl', lg: '4xl' }}
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent
        borderRadius="2xl"
        overflow="hidden"
        mx={{ base: 4, sm: 6, md: 8 }}
        maxH="90vh"
      >
        {/* Header */}
        <ModalHeader
  bg={bgHeader}
  borderBottomWidth="1px"
  borderColor={borderColor}
  py={{ base: 3, md: 4 }}
>
  <HStack spacing="3">
    <CalendarDaysIcon width={22} height={22} color={accentColor} />
    <Box>
      <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color={textPrimary}>
        {event ? event.title : 'No Event Title'}
      </Text>
      <Text fontSize={{ base: 'xs', md: 'sm' }} color={textSecondary}>
        Detail event dan personel
      </Text>
    </Box>
  </HStack>
</ModalHeader>
        <ModalCloseButton />

        {/* Body */}
        <ModalBody px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 5, md: 6 }}>
            {/* Info Dasar */}
            <VStack align="stretch" spacing="4">
              <Heading
                size="sm"
                color={textPrimary}
                borderBottom="1px solid"
                borderColor={borderColor}
                pb="2"
              >
                Informasi Dasar
              </Heading>

              <HStack justify="space-between" flexWrap="wrap">
  <Text fontWeight="semibold" color={textPrimary}>
    Status:
  </Text>
  <Badge
    colorScheme={event?.status === 'PUBLISHED' ? 'green' : 'gray'}
    fontSize="sm"
    borderRadius="full"
    px="3"
  >
    {event?.status ?? 'No Status'}
  </Badge>
</HStack>

              <HStack spacing="3" align="start">
                <CalendarDaysIcon width={20} height={20} color={textSecondary} />
                <Box>
                  <Text fontSize="sm" color={textSecondary}>
                    Tanggal & Waktu
                  </Text>
                  <Text fontWeight="medium" color={textPrimary} fontSize={{ base: 'sm', md: 'md' }}>
                    {eventDate?.toLocaleString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Box>
              </HStack>

              <HStack spacing="3" align="start">
                <MapPinIcon width={20} height={20} color={textSecondary} />
                <Box>
                  <Text fontSize="sm" color={textSecondary}>
                    Lokasi
                  </Text>
                  <Text fontWeight="medium" color={textPrimary}>
                    {event?.location ?? 'No Location'}
                  </Text>
                </Box>
              </HStack>

              {event?.description && (
                <Box>
                  <Text fontSize="sm" color={textSecondary} mb="1">
                    Deskripsi
                  </Text>
                  <Text fontSize="sm" color={textPrimary} lineHeight="1.6">
                    {event?.description ?? 'No Description'}
                  </Text>
                </Box>
              )}

              <Divider borderColor={borderColor} />

            </VStack>

            {/* Personel */}
            <VStack align="stretch" spacing="4">
              <Flex justify="space-between" align="center" mb="3">
                <Heading size="sm" color={textPrimary}>
                  Personel Terdaftar
                </Heading>
                <Badge fontSize="xs" px="2" py="1" borderRadius="md">
                  {filledSlots} / {totalSlots || availableSlotsCount || 0}
                </Badge>
              </Flex>

              {loadingPersonnel ? (
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
              ) : displayEvent.personnel && displayEvent.personnel.length > 0 ? (
                <VStack
                  align="stretch"
                  spacing="2"
                  maxH={{ base: '200px', md: '250px' }}
                  overflowY="auto"
                  p="2"
                  bg="gray.50"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  {displayEvent.personnel.map((p: any) => (
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
                  <Text color={textSecondary} fontSize="sm">
                    Belum ada personel terdaftar
                  </Text>
                </Box>
              )}
            </VStack>
          </SimpleGrid>
        </ModalBody>

        {/* Footer */}
        <ModalFooter
          pt="3"
          borderTop="1px solid"
          borderColor={borderColor}
          flexWrap="wrap"
        >
          <Button
            leftIcon={<ArrowLeftIcon width={18} height={18} />}
            variant="outline"
            size="sm"
            onClick={onClose}
            colorScheme="gray"
            w={{ base: 'full', sm: 'auto' }}
          >
            Kembali
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
