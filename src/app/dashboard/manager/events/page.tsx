'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
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
  Textarea,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Avatar,
  useColorModeValue,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  MusicalNoteIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import ManagerSidebar from '@/components/ManagerSidebar';
import { EventWithPersonnel, EventStatus } from '@/types';

export default function ManagerEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [events, setEvents] = useState<EventWithPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventWithPersonnel | null>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [eventSongs, setEventSongs] = useState<any[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // State for edit event modal
  const [editEvent, setEditEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    status: 'PUBLISHED' as EventStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme colors
  const bgMain = useColorModeValue('#ffffff', '#1a202c');
  const textPrimary = useColorModeValue('#1f2937', '#f7fafc');
  const textSecondary = useColorModeValue('#6b7280', '#a0aec0');
  const borderColor = useColorModeValue('#e5e7eb', '#2d3748');
  const accentColor = '#dc2626';

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

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || event.status === filterStatus;

    const matchesDate = !filterDate ||
      new Date(event.date).toISOString().split('T')[0] === filterDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'SUBMITTED': return 'orange';
      case 'DRAFT': return 'gray';
      case 'PUBLISHED': return 'green';
      case 'FINISHED': return 'blue';
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

  const fetchEventSongs = async (eventId: string) => {
    setLoadingSongs(true);
    try {
      const response = await fetch(`/api/songs/event/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEventSongs(data);
      } else {
        setEventSongs([]);
      }
    } catch (error) {
      setEventSongs([]);
    } finally {
      setLoadingSongs(false);
    }
  };

  const openFloatingWindow = (event: EventWithPersonnel) => {
    setSelectedEvent(event);
    fetchEventSongs(event.id);
    setIsFloatingOpen(true);
  };

  const openEditEvent = (event: EventWithPersonnel) => {
    setSelectedEvent(event);
    setEditEvent({
      title: event.title,
      description: event.description || '',
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      status: event.status,
    });
    setIsEditOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/manager/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editEvent,
          date: new Date(editEvent.date).toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Berhasil',
          description: 'Acara berhasil diperbarui',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchEvents();
        setIsEditOpen(false);
      } else {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui acara',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToEventSongs = (eventId: string) => {
    router.push(`/dashboard/songs?eventId=${eventId}`);
  };

  const goToEventPersonnel = (eventId: string) => {
    router.push(`/dashboard/manager/events/${eventId}/personnel`);
  };
  const downloadEventReport = async (event: EventWithPersonnel) => {
  setDownloadingPdf(event.id);

  try {
    // Ambil daftar lagu dari event
    const songsResponse = await fetch(`/api/songs/event/${event.id}`);
    const songs = songsResponse.ok ? await songsResponse.json() : [];

    // Buat dokumen PDF baru
    const pdf = new jsPDF();
    
    // --- UTILITY UNTUK MEMUAT GAMBAR ---
    // Fungsi ini akan memuat gambar dan mengembalikannya sebagai objek Image
    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
        img.src = url;
      });
    };
    
    // Muat gambar Tanda Tangan dan Logo Kop Surat secara paralel/await
    const [logoImg, ttdImg] = await Promise.all([
        loadImage('https://i.imgur.com/YZICojL.png'),
        loadImage('https://i.imgur.com/HCEqzqg.jpeg'),
    ]);
    // ------------------------------------


    // === KOP SURAT ===
    pdf.addImage(logoImg, 'PNG', 20, 10, 25, 25);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text('UKM BAND BINUS BEKASI', 105, 20, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Universitas Bina Nusantara - Kampus Bekasi', 105, 27, { align: 'center' });
    pdf.text('Jl. Lingkar Boulevar Blok WA No.1 Summarecon', 105, 33, { align: 'center' });
    pdf.text('Telp: 0813-2209-5203 | Email: ukmband.binusbekasi@gmail.com', 105, 39, { align: 'center' });

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.7);
    pdf.line(20, 43, 190, 43);

    let y = 48;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);

    // Tanggal surat
    pdf.text(
      `Bekasi, ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      140,
      y,
      { align: 'left' }
    );
    y += 10;

    // Perataan titik dua untuk Nomor dan Perihal
    const col1 = 20; // Kolom awal teks
    const col2 = 45; // Posisi titik dua
    const col3 = 48; // Posisi nilai setelah titik dua
    
    // Nomor Surat (Tambahkan)
    pdf.text('Nomor', col1, y);
    pdf.text(':', col2, y);
    pdf.text('-', col3, y);
    y += 7;
    
    // Perihal Surat (Tambahkan)
    pdf.text('Perihal', col1, y);
    pdf.text(':', col2, y);
    pdf.text('Laporan Kegiatan Event', col3, y);
    y += 12;


    // Alamat Tujuan
    pdf.text('Kepada Yth.', col1, y);
    y += 6;
    pdf.text(`Panitia Penyelenggara Event ${event.title}`, col1 + 5, y); // Indent 5
    y += 6;
    pdf.text('di Tempat', col1 + 5, y); // Indent 5
    y += 10;

    // Paragraf pembuka
    pdf.text('Dengan hormat,', col1, y);
    y += 10;

    const bodyLines = pdf.splitTextToSize(
      `Sehubungan dengan pelaksanaan acara "${event.title}" yang telah diselenggarakan oleh UKM Band BINUS Bekasi, bersama surat ini kami sampaikan laporan kegiatan sebagai bentuk dokumentasi dan pertanggungjawaban pelaksanaan event tersebut.`,
      165
    );
    pdf.text(bodyLines, col1 + 5, y); // Indent 5
    y += bodyLines.length * 6 + 8; // Mengubah 4 menjadi 6 untuk spasi baris yang lebih baik

    pdf.text('Berikut merupakan rincian kegiatan:', col1 + 5, y); // Indent 5
    y += 10;

    // === 1. DETAIL ACARA ===
    pdf.setFont('times', 'bold');
    pdf.text('1. Detail Acara', col1, y);
    pdf.setFont('times', 'normal');
    y += 8;

    // Perataan titik dua untuk Detail Acara
    const detCol1 = col1 + 5; // Awal teks detail
    const detCol2 = detCol1 + 25; // Posisi titik dua
    const detCol3 = detCol2 + 3; // Posisi nilai setelah titik dua

    // Judul
    pdf.text(`Judul`, detCol1, y);
    pdf.text(`:`, detCol2, y);
    pdf.text(`${event.title}`, detCol3, y);
    y += 7;

    // Tanggal
    pdf.text(`Tanggal`, detCol1, y);
    pdf.text(`:`, detCol2, y);
    pdf.text(
      `${new Date(event.date).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      detCol3,
      y
    );
    y += 7;

    // Lokasi
    pdf.text(`Lokasi`, detCol1, y);
    pdf.text(`:`, detCol2, y);
    pdf.text(`${event.location}`, detCol3, y);
    y += 7;

    // Status
    pdf.text(`Status`, detCol1, y);
    pdf.text(`:`, detCol2, y);
    pdf.text(`${getStatusText(event.status)}`, detCol3, y);
    y += 7;

    // Deskripsi
    if (event.description) {
      pdf.text(`Deskripsi`, detCol1, y);
      pdf.text(`:`, detCol2, y);
      const descLines = pdf.splitTextToSize(`${event.description}`, 160);
      pdf.text(descLines, detCol3, y);
      y += descLines.length * 6 + 87;
    }

    // === 2. DAFTAR PERSONEL ===
    y += 8;
    pdf.setFont('times', 'bold');
    pdf.text('2. Daftar Personel', col1, y);
    pdf.setFont('times', 'normal');
    y += 8;

    const persCol1 = col1 + 5; 
    const persCol2 = persCol1 + 10;
    const persCol3 = persCol2 + 30;
    const persCol4 = persCol3 + 3; 

    if (event.personnel.length === 0) {
      pdf.text('- Belum ada personel terdaftar.', persCol1, y);
      y += 6;
    } else {
      event.personnel.forEach((p: any, i: number) => {
        if (y > 260) { pdf.addPage(); y = 20; }
        
        pdf.text(`${i + 1}.`, persCol1, y);
        pdf.text(`${p.role}`, persCol2, y);
        pdf.text(`:`, persCol3, y);
        pdf.text(`${p.user?.name || 'Belum ada'}`, persCol4, y);
        y += 6;
      });
    }

    // === 3. DAFTAR LAGU ===
    y += 8;
    pdf.setFont('times', 'bold');
    pdf.text('3. Daftar Lagu yang Dibawakan', col1, y);
    pdf.setFont('times', 'normal');
    y += 8;

    const songCol1 = col1 + 5;

    if (songs.length === 0) {
      pdf.text('- Belum ada lagu yang tercatat.', songCol1, y);
      y += 6;
    } else {
      songs.forEach((song: any, i: number) => {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.text(`${i + 1}. ${song.title}${song.artist ? ' - ' + song.artist : ''}`, songCol1, y);
        y += 6;
      });
    }

    // === PENUTUP & TANDA TANGAN ===
    y += 12;
    
    // ** PENCEGAHAN HALAMAN TERPOTONG **
    // Jika posisi y terlalu dekat dengan batas bawah (297)
    if (y > 240) { 
        pdf.addPage();
        y = 20; 
    }
    // **********************************

    const closingLines = pdf.splitTextToSize(
      `Demikian laporan kegiatan ini kami sampaikan. Besar harapan kami laporan ini dapat memberikan gambaran menyeluruh mengenai pelaksanaan kegiatan yang telah dilaksanakan. Atas perhatian dan kerja samanya kami ucapkan terima kasih.`,
      165
    );
    pdf.text(closingLines, col1 + 5, y); // Indent 5
    y += closingLines.length * 6 + 12;

    // Penempatan Tanda Tangan
    const ttdX = 140; // Posisi x Tanda Tangan
    const ttdGap = 25; // Jarak kosong untuk TTD
    const ttdWidth = 40; // Lebar TTD (unit default jsPDF, biasanya mm)
    const ttdHeight = 20; // Tinggi TTD (sesuaikan agar proporsional)

    // ** PENCEGAHAN HALAMAN TERPOTONG (Kedua) **
    if (y > 255) { // Cek lagi sebelum mencetak TTD
        pdf.addPage();
        y = 20;
    }
    // **********************************
    
    // Teks Hormat Kami
    pdf.text('Hormat kami,', ttdX, y);
    y += 2; // Geser y sedikit ke bawah untuk memberi ruang antara teks dan gambar ttd
    
    // Tambahkan Gambar Tanda Tangan (TTD)
    pdf.addImage(ttdImg, 'JPEG', ttdX, y, ttdWidth, ttdHeight); // X, Y, Width, Height
    y += ttdGap; // Lompat ke bawah setelah area TTD

    pdf.setFont('times', 'normal');
    pdf.text('Jones Morgan', ttdX, y); // Nama penanggung jawab
    
    // Buat garis penanda TTD
    pdf.line(ttdX - 2, y + 1, ttdX + 40, y + 1); // Garis bawah nama
    y += 6;
    
    pdf.setFont('times', 'bold');
    pdf.text('Ketua UKM Band BINUS Bekasi', ttdX, y); // Jabatan


    // === FOOTER ===
    const pageHeight = pdf.internal.pageSize.height;
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      'Dokumen ini dihasilkan secara otomatis oleh UKM Band Bekasi Dashboard',
      105,
      pageHeight - 8,
      { align: 'center' }
    );

    // Simpan file
    const fileName = `Surat_Laporan_${event.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    toast({
      title: 'Berhasil',
      description: 'Surat laporan event berhasil diunduh',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    toast({
      title: 'Error',
      description: 'Gagal membuat surat laporan',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setDownloadingPdf(null);
  }
};


  const getStats = () => {
    const total = events.length;
    const published = events.filter(e => e.status === 'PUBLISHED').length;
    const finished = events.filter(e => e.status === 'FINISHED').length;
    const upcoming = events.filter(e =>
      e.status === 'PUBLISHED' && new Date(e.date) > new Date()
    ).length;

    return { total, published, finished, upcoming };
  };

  const stats = getStats();

  if (status === 'loading' || loading) {
    return (
      <Box minH="100vh" bg={bgMain}>
        <ManagerSidebar activeRoute="events" />
        <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
          <Flex justify="center" align="center" minH="60vh">
            <VStack spacing="4">
              <Spinner size="xl" color={accentColor} />
              <Text color={textSecondary}>Memuat data acara...</Text>
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
      <ManagerSidebar activeRoute="events" />

      <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
        <VStack spacing="6" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary}>Manajemen Event</Heading>
              <Text color={textSecondary}>
                Kelola semua acara UKM Band Bekasi
              </Text>
            </Box>
            <Button
              as="a"
              href="/dashboard/manager"
              colorScheme="red"
              size="lg"
              borderRadius="xl"
              fontWeight="semibold"
              px="8"
              leftIcon={<PlusIcon width={16} height={16} />}
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.2s"
            >
               Event Baru
            </Button>
          </Flex>

          {/* Stats Cards - Compact */}
          <SimpleGrid columns={{ base: 2, lg: 4 }} spacing="4">
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
                    bg={useColorModeValue('blue.50', 'blue.900')}
                    borderRadius="lg"
                    color={useColorModeValue('blue.600', 'blue.400')}
                  >
                    <CalendarDaysIcon width={20} height={20} />
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
                    bg={useColorModeValue('green.50', 'green.900')}
                    borderRadius="lg"
                    color={useColorModeValue('green.600', 'green.400')}
                  >
                    <CalendarDaysIcon width={20} height={20} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">
                      Dipublikasikan
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('green.600', 'green.400')}>
                      {stats.published}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

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
                    bg={useColorModeValue('purple.50', 'purple.900')}
                    borderRadius="lg"
                    color={useColorModeValue('purple.600', 'purple.400')}
                  >
                    <ClockIcon width={20} height={20} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">
                      Event Aktif
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('purple.600', 'purple.400')}>
                      {stats.upcoming}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

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
                    bg={useColorModeValue('orange.50', 'orange.900')}
                    borderRadius="lg"
                    color={useColorModeValue('orange.600', 'orange.400')}
                  >
                    <CalendarDaysIcon width={20} height={20} />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">
                      Selesai
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('orange.600', 'orange.400')}>
                      {stats.finished}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters */}
          <HStack spacing="4" flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement>
                <MagnifyingGlassIcon width={16} height={16} color={textSecondary} />
              </InputLeftElement>
              <Input
                placeholder="Cari judul, deskripsi, atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="xl"
              />
            </InputGroup>

            <Select
              placeholder="Filter Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              maxW="200px"
              borderRadius="xl"
              color="darkgrey"
            >
              <option value="PUBLISHED">Dipublikasikan</option>
              <option value="DRAFT">Draft</option>
              <option value="FINISHED">Selesai</option>
              <option value="SUBMITTED">Menunggu Persetujuan</option>
              <option value="REJECTED">Ditolak</option>
            </Select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              maxW="200px"
              borderRadius="xl"
              color="darkgrey"
            />

            {(searchTerm || filterStatus || filterDate) && (
              <Button
                variant="outline"
                size="sm"
                borderRadius="xl"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                  setFilterDate('');
                }}
              >
                Reset Filter
              </Button>
            )}
          </HStack>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <Box
              bg={useColorModeValue('gray.50', 'gray.800')}
              borderRadius="2xl"
              p="12"
              textAlign="center"
            >
              <VStack spacing="4">
                <Box p="4" bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="xl" color={textSecondary}>
                  <CalendarDaysIcon width={48} height={48} />
                </Box>
                <Text fontSize="xl" fontWeight="medium" color={textPrimary}>
                  {searchTerm || filterStatus || filterDate ? 'Tidak ada event yang cocok dengan filter' : 'Belum ada event'}
                </Text>
                <Text fontSize="md" color={textSecondary} maxW="md">
                  {searchTerm || filterStatus || filterDate
                    ? 'Coba ubah filter atau pencarian untuk menemukan event yang Anda cari'
                    : 'Event akan muncul di sini setelah dibuat oleh manager'
                  }
                </Text>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="4">
              {filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  bg={bgMain}
                  shadow="sm"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                  overflow="hidden"
                  transition="all 0.3s"
                  _hover={{ shadow: 'md', transform: 'translateY(-2px)', cursor: 'pointer' }}
                  onClick={() => openFloatingWindow(event)}
                >
                  <CardHeader bg={useColorModeValue('gray.50', 'gray.800')} p="4">
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
                      <Badge
                        colorScheme={getStatusColor(event.status)}
                        fontSize="xs"
                        px="2"
                        py="1"
                        borderRadius="md"
                        fontWeight="semibold"
                      >
                        {getStatusText(event.status)}
                      </Badge>
                    </Flex>
                  </CardHeader>

                  <CardBody p="4">
                    <VStack spacing="3" align="stretch">
                      {/* Event Details */}
                      <VStack align="start" spacing="1">
                        <HStack spacing="2" color={textSecondary}>
                          <CalendarDaysIcon width={14} height={14} />
                          <Text fontSize="xs">
                            {new Date(event.date).toLocaleString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </HStack>
                        <HStack spacing="2" color={textSecondary}>
                          <MapPinIcon width={14} height={14} />
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
                        <SimpleGrid columns={2} gap="2">
                          {event.personnel.map((personnel: any) => (
                            <HStack key={personnel.id} spacing="2" minW="0">
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
                                  colorScheme={
                                    personnel.status === 'APPROVED' ? 'green' :
                                    personnel.status === 'PENDING' ? 'yellow' : 'red'
                                  }
                                  fontSize="8px"
                                  px="1"
                                  py="0.5"
                                  borderRadius="sm"
                                >
                                  {personnel.status}
                                </Badge>
                              )}
                            </HStack>
                          ))}
                        </SimpleGrid>
                      </Box>

                      </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Box>

      {/* Floating Event Detail Modal */}
      <Modal
        isOpen={isFloatingOpen}
        onClose={() => setIsFloatingOpen(false)}
        size="3xl"
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
              <CalendarDaysIcon width={24} height={24} color={accentColor} />
              <Box>
                <Text fontSize="xl" fontWeight="bold" color={textPrimary}>
                  {selectedEvent?.title}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Detail event, personel, dan lagu yang akan dibawakan
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p="6">
            {selectedEvent && (
              <VStack spacing="6" align="stretch">
                {/* Event Info */}
                <Box>
                  <Text fontWeight="semibold" color={textPrimary} mb="3">Informasi Event</Text>
                  <VStack align="start" spacing="3">
                    <HStack spacing="3">
                      <Text fontWeight="medium" color={textSecondary} minW="120px">Status:</Text>
                      <Badge
                        colorScheme={getStatusColor(selectedEvent.status)}
                        fontSize="sm"
                        px="3"
                        py="1"
                        borderRadius="md"
                      >
                        {getStatusText(selectedEvent.status)}
                      </Badge>
                    </HStack>
                    <HStack spacing="3">
                      <Text fontWeight="medium" color={textSecondary} minW="120px">Tanggal:</Text>
                      <Text color={textPrimary}>
                        {new Date(selectedEvent.date).toLocaleString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </HStack>
                    <HStack spacing="3">
                      <Text fontWeight="medium" color={textSecondary} minW="120px">Lokasi:</Text>
                      <Text color={textPrimary}>{selectedEvent.location}</Text>
                    </HStack>
                    {selectedEvent.description && (
                      <HStack spacing="3" align="start">
                        <Text fontWeight="medium" color={textSecondary} minW="120px">Deskripsi:</Text>
                        <Text color={textPrimary} flex="1">
                          {selectedEvent.description}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Personnel */}
                <Box>
                  <Text fontWeight="semibold" color={textPrimary} mb="3">
                    Daftar Personel ({selectedEvent.personnel.filter((p: any) => p.user).length} / {selectedEvent.personnel.length})
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
                    {selectedEvent.personnel.map((personnel: any) => (
                      <Box
                        key={personnel.id}
                        p="3"
                        bg={useColorModeValue('gray.50', 'gray.800')}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Flex justify="space-between" align="center">
                          <HStack spacing="3">
                            <Avatar
                              size="sm"
                              name={personnel.user?.name || personnel.role}
                              bg={personnel.user ? accentColor : 'gray.400'}
                            />
                            <Box>
                              <Text fontWeight="medium" color={textPrimary}>
                                {personnel.role}
                              </Text>
                              <Text fontSize="xs" color={textSecondary}>
                                {personnel.user?.name || 'Belum terisi'}
                              </Text>
                            </Box>
                          </HStack>
                          {personnel.user && (
                            <Badge
                              colorScheme={
                                personnel.status === 'APPROVED' ? 'green' :
                                personnel.status === 'PENDING' ? 'yellow' : 'red'
                              }
                              fontSize="xs"
                              px="2"
                              py="1"
                              borderRadius="md"
                            >
                              {personnel.status}
                            </Badge>
                          )}
                        </Flex>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Songs Section */}
                <Box>
                  <Text fontWeight="semibold" color={textPrimary} mb="3">
                    Lagu yang Akan Dibawakan ({eventSongs.length})
                  </Text>
                  {loadingSongs ? (
                    <Flex justify="center" align="center" py="6">
                      <Spinner size="md" color={accentColor} />
                      <Text ml="3" color={textSecondary}>Memuat lagu...</Text>
                    </Flex>
                  ) : eventSongs.length === 0 ? (
                    <Box
                      bg={useColorModeValue('gray.50', 'gray.800')}
                      borderRadius="lg"
                      p="6"
                      textAlign="center"
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <VStack spacing="3">
                        <Box p="3" bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="lg" color={textSecondary}>
                          <MusicalNoteIcon width={32} height={32} />
                        </Box>
                        <Text color={textSecondary}>Belum ada lagu yang ditambahkan untuk event ini</Text>
                      </VStack>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
                      {eventSongs.map((song: any) => (
                        <Box
                          key={song.id}
                          p="3"
                          bg={useColorModeValue('gray.50', 'gray.800')}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor={borderColor}
                          _hover={{ shadow: 'md', transform: 'translateY(-1px)' }}
                          transition="all 0.2s"
                        >
                          <VStack align="start" spacing="2">
                            <HStack spacing="2" justify="space-between" w="full">
                              <Text fontWeight="medium" color={textPrimary} noOfLines={1}>
                                {song.order}. {song.title}
                              </Text>
                              {song.artist && (
                                <Badge
                                  colorScheme="purple"
                                  fontSize="xs"
                                  px="2"
                                  py="1"
                                  borderRadius="md"
                                >
                                  {song.artist}
                                </Badge>
                              )}
                            </HStack>
                            {song.key && (
                              <Text fontSize="xs" color={textSecondary}>
                                Nada: {song.key}
                              </Text>
                            )}
                            {song.duration && (
                              <Text fontSize="xs" color={textSecondary}>
                                Durasi: {song.duration}
                              </Text>
                            )}
                            {song.notes && (
                              <Text fontSize="xs" color={textSecondary} noOfLines={2}>
                                Catatan: {song.notes}
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>
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
              onClick={() => setIsFloatingOpen(false)}
            >
              Tutup
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                if (selectedEvent) {
                  downloadEventReport(selectedEvent);
                }
              }}
              isLoading={downloadingPdf === selectedEvent?.id}
              loadingText="Downloading..."
              leftIcon={<ArrowDownTrayIcon width={16} height={16} />}
              mr={3}
            >
              Download Report
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                if (selectedEvent) {
                  goToEventSongs(selectedEvent.id);
                  setIsFloatingOpen(false);
                }
              }}
            >
              Kelola Lagu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        size="2xl"
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
              <PencilIcon width={24} height={24} color={accentColor} />
              <Box>
                <Text fontSize="xl" fontWeight="bold" color={textPrimary}>
                  Edit Event
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Perbarui informasi event
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p="6">
            <VStack spacing="4" align="stretch">
              <FormControl isRequired>
                <FormLabel color={textPrimary} fontWeight="semibold">Judul Event</FormLabel>
                <Input
                  value={editEvent.title}
                  onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textPrimary} fontWeight="semibold">Deskripsi</FormLabel>
                <Textarea
                  value={editEvent.description}
                  onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                  rows={3}
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textPrimary} fontWeight="semibold">Tanggal & Waktu</FormLabel>
                <Input
                  type="datetime-local"
                  value={editEvent.date}
                  onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })}
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textPrimary} fontWeight="semibold">Lokasi</FormLabel>
                <Input
                  value={editEvent.location}
                  onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textPrimary} fontWeight="semibold">Status</FormLabel>
                <Select
                  value={editEvent.status}
                  onChange={(e) => setEditEvent({ ...editEvent, status: e.target.value as EventStatus })}
                  borderRadius="xl"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Dipublikasikan</option>
                  <option value="FINISHED">Selesai</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter
            borderTopWidth="1px"
            borderColor={borderColor}
            p="6"
          >
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setIsEditOpen(false)}
            >
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleUpdateEvent}
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
            >
              Simpan Perubahan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}