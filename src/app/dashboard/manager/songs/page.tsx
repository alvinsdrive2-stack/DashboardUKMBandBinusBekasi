'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  MusicalNoteIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ManagerSidebar from '@/components/ManagerSidebar';
import { useManagerSongs } from '@/hooks/useManagerData';

interface SongWithEvent extends EventSong {
  event: {
    id: string;
    title: string;
    date: Date;
    location: string;
  };
}

export default function ManagerSongsPage() {
  // All hooks must be called at the top in the same order on every render
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  // Theme colors
  const bgMain = useColorModeValue('#ffffff', '#1a202c');
  const textPrimary = useColorModeValue('#1f2937', '#f7fafc');
  const textSecondary = useColorModeValue('#6b7280', '#a0aec0');
  const borderColor = useColorModeValue('#e5e7eb', '#2d3748');
  const accentColor = '#dc2626';

  // State hooks
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Use React Query for data fetching
  const {
    songs,
    isLoading: loading,
    error,
    refetch,
  } = useManagerSongs(filterEvent);

  // Memoized computed values
  const events = useMemo(() => {
    const uniqueEvents = new Map();
    songs.forEach(song => {
      if (!uniqueEvents.has(song.event.id)) {
        uniqueEvents.set(song.event.id, song.event);
      }
    });
    return Array.from(uniqueEvents.values());
  }, [songs]);

  // Authentication and authorization check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' &&
               session?.user?.organizationLvl !== 'COMMISSIONER' &&
               session?.user?.organizationLvl !== 'PENGURUS') {
      router.push('/dashboard/member');
    }
  }, [status, session, router]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data lagu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  const filteredSongs = songs.filter(song => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.event.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEvent = !filterEvent || song.event.id === filterEvent;

    return matchesSearch && matchesEvent;
  });

  const openSongDetail = (song: SongWithEvent) => {
    setSelectedSong(song);
    setIsDetailOpen(true);
  };

  const goToEventSongs = (eventId: string) => {
    router.push(`/dashboard/songs?eventId=${eventId}`);
  };

  if (status === 'loading' || loading) {
    return (
      <Box minH="100vh" bg={bgMain}>
        <ManagerSidebar activeRoute="songs" />
        <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
          <Flex justify="center" align="center" minH="60vh">
            <VStack spacing="4">
              <Spinner size="xl" color={accentColor} />
              <Text color={textSecondary}>Memuat data lagu...</Text>
            </VStack>
          </Flex>
        </Box>
      </Box>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgMain}>
      <ManagerSidebar activeRoute="songs" />

      <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
        <VStack spacing="6" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary}>Manajemen Lagu</Heading>
              <Text color={textSecondary}>
                Monitor dan kelola semua lagu dari setiap event
              </Text>
            </Box>
            <HStack spacing="3">
              <Button
                variant="outline"
                size="lg"
                borderRadius="xl"
                fontWeight="semibold"
                onClick={() => refetch()}
                isLoading={loading}
                _hover={{ bg: 'gray.50' }}
              >
                Refresh
              </Button>
              <Button
                as="a"
                href="/dashboard/manager/events"
                variant="outline"
                size="lg"
                borderRadius="xl"
                leftIcon={<PlusIcon width={16} height={16} />}
              >
                Event Baru
              </Button>
            </HStack>
          </Flex>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" color={textPrimary}>Monitoring Lagu:</Text>
              <Text fontSize="sm" color={textSecondary}>
                Lihat semua lagu dari event yang dipublikasikan. Klik pada lagu untuk detail atau navigasi ke event untuk mengelola setlist.
              </Text>
            </Box>
          </Alert>

          {/* Filters */}
          <HStack spacing="4" flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement>
                <MagnifyingGlassIcon width={16} height={16} color={textSecondary} />
              </InputLeftElement>
              <Input
                placeholder="Cari lagu, artis, atau event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="xl"
              />
            </InputGroup>

            <Select
              placeholder="Filter Event"
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              maxW="250px"
              borderRadius="xl"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} - {new Date(event.date).toLocaleDateString('id-ID')}
                </option>
              ))}
            </Select>

            {(searchTerm || filterEvent) && (
              <Button
                variant="outline"
                size="sm"
                borderRadius="xl"
                onClick={() => {
                  setSearchTerm('');
                  setFilterEvent('');
                }}
              >
                Reset Filter
              </Button>
            )}
          </HStack>

          {/* Songs Table */}
          {filteredSongs.length === 0 ? (
            <Box
              bg={useColorModeValue('gray.50', 'gray.800')}
              borderRadius="2xl"
              p="12"
              textAlign="center"
            >
              <VStack spacing="4">
                <Box fontSize="5xl">🎵</Box>
                <Text fontSize="xl" fontWeight="medium" color={textPrimary}>
                  {searchTerm || filterEvent ? 'Tidak ada lagu yang cocok dengan filter' : 'Belum ada lagu'}
                </Text>
                <Text fontSize="md" color={textSecondary} maxW="md">
                  {searchTerm || filterEvent
                    ? 'Coba ubah filter atau pencarian untuk menemukan lagu yang Anda cari'
                    : 'Lagu akan muncul di sini setelah event dibuat dan lagu ditambahkan ke setlist'
                  }
                </Text>
              </VStack>
            </Box>
          ) : (
            <TableContainer bg={bgMain} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                  <Tr>
                    <Th color={textPrimary} fontWeight="semibold">No.</Th>
                    <Th color={textPrimary} fontWeight="semibold">Judul Lagu</Th>
                    <Th color={textPrimary} fontWeight="semibold">Artis</Th>
                    <Th color={textPrimary} fontWeight="semibold">Event</Th>
                    <Th color={textPrimary} fontWeight="semibold">Tanggal</Th>
                    <Th color={textPrimary} fontWeight="semibold">Key</Th>
                    <Th color={textPrimary} fontWeight="semibold">Durasi</Th>
                    <Th color={textPrimary} fontWeight="semibold">Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredSongs.map((song, index) => (
                    <Tr
                      key={song.id}
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.800') }}
                      transition="all 0.2s"
                    >
                      <Td color={textSecondary} fontWeight="medium">{song.order}</Td>
                      <Td>
                        <VStack align="start" spacing="1">
                          <Text fontWeight="semibold" color={textPrimary}>
                            {song.title}
                          </Text>
                          {song.notes && (
                            <Text fontSize="xs" color={textSecondary} noOfLines={1}>
                              {song.notes}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td color={textSecondary}>{song.artist || '-'}</Td>
                      <Td>
                        <VStack align="start" spacing="1">
                          <Text fontWeight="medium" color={textPrimary}>
                            {song.event.title}
                          </Text>
                          <Text fontSize="xs" color={textSecondary}>
                            {song.event.location}
                          </Text>
                        </VStack>
                      </Td>
                      <Td color={textSecondary}>
                        {new Date(song.event.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Td>
                      <Td>
                        <Badge
                          bg={useColorModeValue('purple.100', 'purple.900')}
                          color={useColorModeValue('purple.800', 'purple.200')}
                          fontSize="xs"
                          px="2"
                          py="1"
                          borderRadius="md"
                        >
                          {song.key || '-'}
                        </Badge>
                      </Td>
                      <Td color={textSecondary}>{song.duration || '-'}</Td>
                      <Td>
                        <HStack spacing="2">
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => openSongDetail(song)}
                            leftIcon={<EyeIcon width={14} height={14} />}
                          >
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => goToEventSongs(song.event.id)}
                          >
                            Event
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          {/* Stats Summary */}
          <HStack spacing="6" justify="center" pt="4">
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color={textPrimary}>
                {filteredSongs.length}
              </Text>
              <Text fontSize="sm" color={textSecondary}>Total Lagu</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                {events.length}
              </Text>
              <Text fontSize="sm" color={textSecondary}>Event Aktif</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('green.600', 'green.400')}>
                {events.reduce((total, event) => total + (event.personnel?.filter((p: any) => p.user)?.length || 0), 0)}
              </Text>
              <Text fontSize="sm" color={textSecondary}>Personel Terisi</Text>
            </Box>
          </HStack>
        </VStack>
      </Box>

      {/* Song Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        size="lg"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader
            bg={useColorModeValue('gray.50', 'gray.800')}
            borderBottomWidth="1px"
            borderColor={borderColor}
          >
            <HStack spacing="3">
              <MusicalNoteIcon width={24} height={24} color={accentColor} />
              <Box>
                <Text fontSize="xl" fontWeight="bold" color={textPrimary}>
                  {selectedSong?.title}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Detail lagu dari event {selectedSong?.event.title}
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p="6">
            {selectedSong && (
              <VStack spacing="4" align="stretch">
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="semibold">Artis</FormLabel>
                  <Text color={textSecondary}>{selectedSong.artist || 'Tidak ada artis'}</Text>
                </FormControl>

                <HStack spacing="4">
                  <FormControl flex="1">
                    <FormLabel color={textPrimary} fontWeight="semibold">Key/Nada</FormLabel>
                    <Badge
                      bg={useColorModeValue('purple.100', 'purple.900')}
                      color={useColorModeValue('purple.800', 'purple.200')}
                      fontSize="md"
                      px="3"
                      py="2"
                      borderRadius="md"
                    >
                      {selectedSong.key || 'Tidak ada key'}
                    </Badge>
                  </FormControl>

                  <FormControl flex="1">
                    <FormLabel color={textPrimary} fontWeight="semibold">Durasi</FormLabel>
                    <Text color={textSecondary}>{selectedSong.duration || 'Tidak ada durasi'}</Text>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="semibold">Urutan dalam Setlist</FormLabel>
                  <Badge
                    bg={useColorModeValue('red.100', 'red.900')}
                    color={useColorModeValue('red.800', 'red.200')}
                    fontSize="md"
                    px="3"
                    py="2"
                    borderRadius="md"
                  >
                    Lagu ke-{selectedSong.order}
                  </Badge>
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="semibold">Catatan</FormLabel>
                  <Text color={textSecondary}>
                    {selectedSong.notes || 'Tidak ada catatan'}
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="semibold">Event</FormLabel>
                  <Box
                    p="4"
                    bg={useColorModeValue('gray.50', 'gray.800')}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <VStack align="start" spacing="2">
                      <Text fontWeight="semibold" color={textPrimary}>
                        {selectedSong.event.title}
                      </Text>
                      <HStack spacing="4" color={textSecondary} fontSize="sm">
                        <Text>📅 {new Date(selectedSong.event.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</Text>
                        <Text>📍 {selectedSong.event.location}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter
            borderTopWidth="1px"
            borderColor={borderColor}
            p="6"
          >
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setIsDetailOpen(false)}
            >
              Tutup
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                if (selectedSong) {
                  goToEventSongs(selectedSong.event.id);
                  setIsDetailOpen(false);
                }
              }}
            >
              Kelola di Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}