'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Spinner,
  IconButton,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  TimeIcon,
  InfoIcon, // Menggantikan AtSignIcon untuk location, lebih universal
} from '@chakra-ui/icons';
// Tetap menggunakan Heroicons untuk ikon yang lebih spesifik visualnya,
// tetapi dengan kontrol ukuran boxSize di Chakra.
import {
  MusicalNoteIcon,
} from '@heroicons/react/24/outline'; 

import MemberSidebar from '@/components/MemberSidebar'; // Asumsikan path komponen ini benar

interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  duration?: string;
  notes?: string;
  order: number;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

interface EventInfo {
  id: string;
  title: string;
  date: string;
  location: string;
  userRole: string;
}

function SongsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const eventId = searchParams.get('eventId');
  console.log('Songs page - eventId from URL:', eventId);

  const [songs, setSongs] = useState<Song[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    key: '',
    duration: '',
    notes: '',
  });

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
    if (status === 'authenticated' && eventId) {
      fetchEventInfo();
      fetchSongs();
    }
  }, [status, eventId]);

  const fetchEventInfo = async () => {
    if (!eventId) return;

    try {
      const response = await fetch('/api/events/member'); 
      if (response.ok) {
        const data = await response.json();
        const events = data.events || data;
        const userEvent = events.find((event: any) =>
          event.id === eventId &&
          event.personnel.some((p: any) => p.userId === session?.user?.id)
        );

        if (userEvent) {
          const userPersonnel = userEvent.personnel.find((p: any) => p.userId === session?.user?.id);
          setEventInfo({
            id: userEvent.id,
            title: userEvent.title,
            date: userEvent.date,
            location: userEvent.location,
            userRole: userPersonnel?.role || 'Unknown',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching event info:', error);
    }
  };

  const fetchSongs = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/songs`);
      if (response.ok) {
        const data = await response.json();
        setSongs(data.songs || []);
      } else {
        console.error('Failed to fetch songs');
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data lagu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventId || !formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Judul lagu harus diisi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const url = editingSong
        ? `/api/events/${eventId}/songs/${editingSong.id}`
        : `/api/events/${eventId}/songs`;

      const method = editingSong ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          order: editingSong ? editingSong.order : (songs.length > 0 ? songs[songs.length - 1].order + 1 : 1),
        }),
      });

      if (response.ok) {
        toast({
          title: editingSong ? 'Lagu Diperbarui' : 'Lagu Ditambahkan',
          description: editingSong
            ? 'Lagu berhasil diperbarui'
            : 'Lagu berhasil ditambahkan ke setlist',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        resetForm();
        fetchSongs();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save song');
      }
    } catch (error: any) {
      console.error('Error saving song:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan lagu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (songId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lagu ini?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}/songs/${songId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Lagu Dihapus',
          description: 'Lagu berhasil dihapus dari setlist',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchSongs();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete song');
      }
    } catch (error: any) {
      console.error('Error deleting song:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus lagu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openAddModal = () => {
    setEditingSong(null);
    resetForm();
    onOpen();
  };

  const openEditModal = (song: Song) => {
    setEditingSong(song);
    setFormData({
      title: song.title,
      artist: song.artist,
      key: song.key,
      duration: song.duration || '',
      notes: song.notes || '',
    });
    onOpen();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artist: '',
      key: '',
      duration: '',
      notes: '',
    });
  };

  const moveSong = async (songId: string, direction: 'up' | 'down') => {
    const currentIndex = songs.findIndex(s => s.id === songId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === songs.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newSongs = [...songs];
    [newSongs[currentIndex], newSongs[newIndex]] = [newSongs[newIndex], newSongs[currentIndex]];

    const reorderedSongs = newSongs.map((song, index) => ({ id: song.id, order: index + 1 }));

    setSongs(newSongs.map((song, index) => ({ ...song, order: index + 1 })));

    try {
      await fetch(`/api/events/${eventId}/songs/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songs: reorderedSongs,
        }),
      });
    } catch (error) {
      console.error('Error reordering songs:', error);
      fetchSongs(); 
      toast({
        title: 'Error',
        description: 'Gagal mengubah urutan lagu. Data dimuat ulang.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!isClient || !session) return null;

  if (!eventId) {
    return (
      <Box minH="100vh" bg="gray.50">
        <MemberSidebar activeRoute="schedule" />
        <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
          <VStack spacing="4" py="12">
            <Text fontSize="lg" color="gray.600">
              Event tidak ditemukan
            </Text>
            <Button
              colorScheme="red" // Red for primary action
              onClick={() => router.push('/dashboard/member/schedule')}
              leftIcon={<ChevronLeftIcon boxSize={5} />}
            >
              Kembali ke Jadwal
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  }

  // Chakra Theme Aligned Colors - Netral dengan merah sebagai highlight
  const bgPrimary = 'gray.50'; // Sangat terang, hampir putih
  const textPrimary = 'gray.800'; // Dark gray for main text
  const textSecondary = 'gray.600'; // Medium gray for secondary text
  const cardBg = 'white'; // White for card backgrounds
  const borderColor = 'gray.200'; // Light gray for borders
  const highlightRed = 'red.600'; // Deeper red for strong highlights
  const accentRed = 'red.500'; // Standard red for buttons, icons
  const infoBlue = 'blue.500'; // Blue for informational alerts

  return (
    <Box minH="100vh" bg={bgPrimary}>
      <MemberSidebar activeRoute="schedule" />
      <Box flex="1" ml={{ base: 0, md: '280px' }} p={{ base: 4, md: 8 }}>
        
        {/* Header */}
        <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap={4}>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/member/schedule')}
            leftIcon={<ChevronLeftIcon boxSize={5} />}
            colorScheme="gray" // Netral untuk tombol kembali
          >
            Kembali
          </Button>

          {eventInfo && (
            <VStack align={{ base: 'center', md: 'start' }} spacing="1" flexGrow={1} order={{ base: 3, md: 2 }}>
              <Heading size={{ base: 'md', md: 'lg' }} color={textPrimary} textAlign="center">
                Setlist Lagu
              </Heading>
              <Text color={textSecondary} fontSize="sm">
                {eventInfo.title} • {eventInfo.userRole}
              </Text>
              <HStack color={textSecondary} fontSize="xs" wrap="wrap" justify="center">
                <HStack>
                  <TimeIcon boxSize={3} color={textSecondary} />
                  <Text>
                    {new Date(eventInfo.date).toLocaleString('id-ID', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </HStack>
                <HStack>
                  <InfoIcon boxSize={3} color={textSecondary} /> {/* Menggunakan InfoIcon */}
                  <Text>{eventInfo.location}</Text>
                </HStack>
              </HStack>
            </VStack>
          )}

          <Button
            colorScheme="red" // Red for primary action (Add Song)
            onClick={openAddModal}
            leftIcon={<AddIcon boxSize={4} />}
            order={{ base: 2, md: 3 }}
          >
            Tambah Lagu
          </Button>
        </Flex>

        {/* Content */}
        {loading ? (
          <VStack spacing="4" py="12">
            <Spinner size="xl" color={accentRed} /> {/* Red spinner */}
            <Text color={textSecondary}>Memuat setlist...</Text>
          </VStack>
        ) : songs.length === 0 ? (
          <Card bg={cardBg} boxShadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing="4" py="12">
                <MusicalNoteIcon width={48} height={48} color="gray.400" /> {/* Gray icon for no songs */}
                <Text color={textSecondary} fontSize="lg" fontWeight="bold">
                  Belum Ada Lagu
                </Text>
                <Text color={textSecondary} fontSize="sm" textAlign="center">
                  Event ini belum memiliki setlist lagu. Tambahkan lagu-lagu yang akan dibawakan.
                </Text>
                <Button colorScheme="red" onClick={openAddModal}> {/* Red for primary action */}
                  Tambah Lagu Pertama
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing="4" align="stretch">
            <Alert status="info" borderRadius="md" colorScheme="blue"> {/* Blue for info alerts */}
              <AlertIcon />
              <Box>
                <Text fontWeight="bold" color={textPrimary}>
                  Informasi Setlist
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Atur urutan lagu dengan tombol panah, edit detail lagu, atau hapus lagu yang tidak diperlukan.
                </Text>
              </Box>
            </Alert>

            {songs.map((song, index) => (
              <Card
                key={song.id}
                bg={cardBg}
                boxShadow="sm"
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                _hover={{ shadow: 'md' }}
              >
                <CardBody p={4}>
                  <HStack justify="space-between" align="center">
                    {/* Reordering Controls */}
                    <VStack spacing="1" minW="8">
                      <Tooltip label="Pindah ke Atas">
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={<ArrowUpIcon />}
                          onClick={() => moveSong(song.id, 'up')}
                          isDisabled={index === 0}
                          aria-label="Move up"
                          colorScheme="gray" // Netral
                        />
                      </Tooltip>
                      <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                        {index + 1}
                      </Text>
                      <Tooltip label="Pindah ke Bawah">
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={<ArrowDownIcon />}
                          onClick={() => moveSong(song.id, 'down')}
                          isDisabled={index === songs.length - 1}
                          aria-label="Move down"
                          colorScheme="gray" // Netral
                        />
                      </Tooltip>
                    </VStack>

                    {/* Song Details */}
                    <VStack align="start" spacing="1" flex="1" ml={4}>
                      <HStack>
                        <MusicalNoteIcon width={16} height={16} color={accentRed} /> {/* Red icon */}
                        <Text fontWeight="bold" color={textPrimary} fontSize="lg">
                          {song.title}
                        </Text>
                        {song.key && (
                          <Badge colorScheme="gray" fontSize="xs" variant="solid"> {/* Neutral gray badge */}
                            {song.key}
                          </Badge>
                        )}
                      </HStack>
                      <Text color={textSecondary} fontSize="sm">
                        {song.artist}
                      </Text>
                      <HStack spacing={4} fontSize="xs" color={textSecondary}>
                         {song.duration && (
                          <Text>Durasi: {song.duration}</Text>
                        )}
                        {song.notes && (
                          <Text noOfLines={1}>Catatan: {song.notes}</Text>
                        )}
                      </HStack>
                    </VStack>

                    {/* Actions */}
                    <HStack spacing="2">
                      <IconButton
                        size="sm"
                        variant="outline"
                        colorScheme="blue" // Blue for edit (secondary action)
                        icon={<EditIcon />}
                        onClick={() => openEditModal(song)}
                        aria-label="Edit song"
                      />
                      <IconButton
                        size="sm"
                        variant="outline"
                        colorScheme="red" // Red for delete (destructive action)
                        icon={<DeleteIcon />}
                        onClick={() => handleDelete(song.id)}
                        aria-label="Delete song"
                      />
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}

        {/* Add/Edit Song Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader color={textPrimary}>
              {editingSong ? 'Edit Lagu' : 'Tambah Lagu Baru'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing="4">
                <FormControl isRequired>
                  <FormLabel color={textPrimary}>Judul Lagu</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul lagu"
                    borderColor={borderColor} // Add border color
                    color={textPrimary}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary}>Artis/Band</FormLabel>
                  <Input
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    placeholder="Masukkan nama artis atau band"
                    borderColor={borderColor}
                    color={textPrimary}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary}>Kunci (Nada)</FormLabel>
                  <Input
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="Contoh: C, Am, G#m"
                    borderColor={borderColor}
                    color={textPrimary}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary}>Durasi</FormLabel>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Contoh: 3:45, 4:20"
                    borderColor={borderColor}
                    color={textPrimary}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary}>Catatan</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan tambahan tentang lagu (aransemen, tempo, dll)"
                    rows={3}
                    borderColor={borderColor}
                    color={textPrimary}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose} colorScheme="gray"> {/* Neutral ghost button */}
                Batal
              </Button>
              <Button colorScheme="red" onClick={handleSubmit}> {/* Red for submit action */}
                {editingSong ? 'Perbarui' : 'Tambah'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
}

// Wrapper with Suspense for useSearchParams
function SongsPageWrapper() {
  return (
    <Suspense fallback={<Box>Loading...</Box>}>
      <SongsPage />
    </Suspense>
  );
}

export default SongsPageWrapper;