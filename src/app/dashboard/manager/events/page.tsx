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
  SimpleGrid,
  Divider,
  Stack,
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
  AcademicCapIcon,
  BuildingOfficeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import ManagerSidebar from '@/components/ManagerSidebar';
import ManagerHeader from '@/components/ManagerHeader';
import ManagerResponsiveTable from '@/components/ManagerResponsiveTable';
import ManagerResponsiveModal from '@/components/ManagerResponsiveModal';
import ManagerResponsiveForm from '@/components/ManagerResponsiveForm';
import ManagerStatsCards from '@/components/ManagerStatsCards';
import Footer from '@/components/Footer';
import { ModalActions } from '@/components/ManagerResponsiveModal';
import { useManagerStats } from '@/hooks/useManagerStats';
import { EventWithPersonnel, EventStatus } from '@/types';

// Types untuk slot configuration
interface EventSlot {
  id: string;
  slotName: string;
  slotType: 'VOCAL' | 'GUITAR' | 'BASS' | 'DRUMS' | 'KEYBOARD' | 'CUSTOM';
  capacity: number;
  required: boolean;
  isActive: boolean;
}

interface EventWithSlots extends EventWithPersonnel {
  slotConfigurable: boolean;
  slotConfiguration: any;
  availableSlots: EventSlot[];
}

export default function ManagerEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { stats: globalStats, loading: statsLoading } = useManagerStats();
  const [events, setEvents] = useState<EventWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventWithPersonnel | null>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [eventSongs, setEventSongs] = useState<any[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadingDataPdf, setDownloadingDataPdf] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for edit event modal
  const [editEvent, setEditEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    status: 'PUBLISHED' as EventStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk slot management
  const [slotConfigModal, setSlotConfigModal] = useState(false);
  const [eventSlots, setEventSlots] = useState<any[]>([]);
  const [slotConfigEnabled, setSlotConfigEnabled] = useState(false);

  // State untuk personnel detail modal
  const [selectedPersonnel, setSelectedPersonnel] = useState<any | null>(null);
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Theme colors
  const bgMain = '#ffffff'; // Putih
  const bgAccentLight = '#fef2f2'; // Merah muda sangat terang (Pengganti warna.50)
  const textPrimary = '#1f2937'; // Abu-abu gelap
  const textSecondary = '#6b7280'; // Abu-abu sedang
  const borderColor = '#e5e7eb'; // Abu-abu sangat terang
  const accentColor = '#dc2626'; // Merah

  // Helper function to format dates with proper timezone
  const formatDateID = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      ...options
    });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' &&
      (session?.user?.organizationLvl !== 'COMMISSIONER' &&
        session?.user?.organizationLvl !== 'PENGURUS')) {
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

  const fetchEventSlots = async (eventId: string) => {
    try {
      setLoadingSlots(true);
      const response = await fetch(`/api/events/${eventId}/slots`);
      if (response.ok) {
        const data = await response.json();
        setEventSlots(data.data.slots || []);
        setSlotConfigEnabled(data.data.slotConfigurable || false);
      }
    } catch (error) {
      console.error('Error fetching event slots:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat konfigurasi slot',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const toggleSlotConfig = async (eventId: string, enable: boolean) => {
    try {
      const response = await fetch(`/api/events/${eventId}/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enableSlotConfig: enable,
          slotConfiguration: enable ? [
            { type: 'VOCAL', name: 'Vokalis Utama', count: 3, required: true },
            { type: 'VOCAL', name: 'Vokalis Pendukung', count: 2, required: false },
            { type: 'GUITAR', name: 'Gitar 1', count: 2, required: true },
            { type: 'GUITAR', name: 'Gitar 2', count: 2, required: false },
            { type: 'BASS', name: 'Basis', count: 1, required: true },
            { type: 'DRUMS', name: 'Drummer', count: 1, required: true },
            { type: 'KEYBOARD', name: 'Keyboardis/Pianis', count: 2, required: false }
          ] : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSlotConfigEnabled(enable);
        toast({
          title: 'Success',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Refresh slots after update
        fetchEventSlots(eventId);
      }
    } catch (error) {
      console.error('Error toggling slot config:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengupdate konfigurasi slot',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/manager/${selectedEvent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Berhasil! 🎉',
          description: `Event "${selectedEvent.title}" berhasil dihapus`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchEvents();
        setIsDeleteModalOpen(false);
        setIsFloatingOpen(false);
        setSelectedEvent(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }
    } catch (error) {
      toast({
        title: 'Error 😭',
        description: 'Gagal menghapus event. Silakan coba lagi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (event: EventWithPersonnel) => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };

  const openPersonnelModal = (personnel: any) => {
    setSelectedPersonnel(personnel);
    setIsPersonnelModalOpen(true);
  };

  const closePersonnelModal = () => {
    setSelectedPersonnel(null);
    setIsPersonnelModalOpen(false);
  };

const downloadEventReport = async (event: EventWithPersonnel) => {
  setDownloadingPdf(event.id);

  try {
    // Bagian ini dipertahankan sesuai kerangka asli Anda
    const songsResponse = await fetch(`/api/songs/event/${event.id}`);
    const songs = songsResponse.ok ? await songsResponse.json() : [];

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'legal',
    });

    const loadImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    // Asumsikan URL gambar ini valid
    const [logoImg, ttdImg] = await Promise.all([
      loadImage('/icons/favicon.png'),
      loadImage('https://i.imgur.com/HCEqzqg.jpeg'),
    ]);

    // === PENGATURAN MARGIN ===
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginLeft = 20;
    const marginRight = 20;
    // Disesuaikan agar kop lebih ke atas
    const marginTop = 20; 
    const marginBottom = 25; // Margin bawah untuk footer
    const SAFE_ZONE = pageHeight - marginBottom; // Batas aman konten

    const contentEnd = pageWidth - marginRight;
    const maxWidth = pageWidth - marginLeft - marginRight;
    const center = pageWidth / 2;

    let y = marginTop;

    // === FUNGSI OVERFLOW CHECK KUSTOM ===
    const checkOverflowAndAddPage = (requiredSpace: number) => {
      if (y + requiredSpace > SAFE_ZONE) {
        pdf.addPage();
        y = marginTop; 
        return true;
      }
      return false;
    };

    // === FUNGSI JUSTIFY KUSTOM ===
    const addJustifiedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6) => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line: string, index: number) => {
        checkOverflowAndAddPage(lineHeight); 

        const isLastLine = index === lines.length - 1;
        
        if (!isLastLine && line.trim().split(' ').length > 1) {
          const words = line.trim().split(' ');
          const lineWidth = pdf.getTextWidth(line);
          const spaceWidth = (maxWidth - lineWidth) / (words.length - 1);
          
          let currentX = x;
          words.forEach((word, i) => {
            pdf.text(word, currentX, y);
            currentX += pdf.getTextWidth(word + ' ') + spaceWidth;
          });
        } else {
          pdf.text(line, x, y);
        }
        y += lineHeight;
      });
      return y; 
    };

    // === KOP SURAT (Disesuaikan agar lebih ke atas) ===
    pdf.addImage(logoImg, 'PNG', marginLeft, y, 25, 25); 

    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.text('UKM BAND BINUS BEKASI', center, y + 5, { align: 'center' }); 

    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.text('Universitas Bina Nusantara - Kampus Bekasi', center, y + 12, { align: 'center' });
    pdf.text('Jl. Lingkar Boulevar Blok WA No.1 Summarecon Bekasi', center, y + 18, { align: 'center' });
    pdf.text('Telp: 0813-2209-5203 | Email: ukmband.binusbekasi@gmail.com', center, y + 24, { align: 'center' });

    pdf.setLineWidth(0.7);
    pdf.line(marginLeft, y + 28, contentEnd, y + 28);

    y += 35; // Jarak setelah kop dikurangi

    // === INFORMASI SURAT ===
    pdf.text(
      `Bekasi, ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      contentEnd,
      y,
      { align: 'right' }
    );
    y += 10;

    const col1 = marginLeft;
    const col2 = col1 + 25;
    const col3 = col2 + 3;

    pdf.text('Nomor', col1, y);
    pdf.text(':', col2, y);
    pdf.text('-', col3, y);
    y += 6;

    pdf.text('Perihal', col1, y);
    pdf.text(':', col2, y);
    pdf.setFont('times', 'bold');
    pdf.text('Surat Pernyataan Kesanggupan Performance', col3, y);
    pdf.setFont('times', 'normal');
    y += 10;

    pdf.text('Kepada Yth.', col1, y);
    y += 6;

    const recipientText = `Ketua Panitia Penyelenggara Event ${event.title}`;
    const recipientLines = pdf.splitTextToSize(recipientText, maxWidth - 5);
    pdf.text(recipientLines, col1 + 5, y);
    y += recipientLines.length * 6;

    pdf.text('di Tempat', col1 + 5, y);
    y += 10;

    pdf.text('Dengan hormat,', col1, y);
    y += 8;

    // === PARAGRAF PEMBUKA (Kesanggupan) ===
    const openingText = `Menanggapi surat undangan/permohonan dari Panitia Penyelenggara ` +
      `Event "${event.title}", dengan ini kami dari UKM Band BINUS Bekasi menyatakan ` +
      `SANGGUP untuk berpartisipasi dan menampilkan performa musik ` +
      `sesuai dengan rincian kegiatan dan personel terlampir.`;
    
    y = addJustifiedText(openingText, marginLeft, y, maxWidth);
    y += 8; 

    pdf.text('Berikut merupakan rincian kegiatan dan kesanggupan kami:', marginLeft, y);
    y += 10;

    // === 1. DETAIL ACARA PERFORMANCE ===
    checkOverflowAndAddPage(70);
    
    pdf.setFont('times', 'bold');
    pdf.text('1. Detail Acara Performance', marginLeft, y); 
    pdf.setFont('times', 'normal');
    y += 8;

    const detCol1 = marginLeft + 5;
    const detCol2 = detCol1 + 25;
    const detCol3 = detCol2 + 3;
    const detWidth = maxWidth - (detCol3 - marginLeft);

    const addDetail = (label: string, value: string) => {
      const lines = pdf.splitTextToSize(value || '-', detWidth);
      const requiredHeight = lines.length * 6;
        
      checkOverflowAndAddPage(requiredHeight);

      pdf.text(label, detCol1, y);
      pdf.text(':', detCol2, y);
      pdf.text(lines, detCol3, y);
      y += requiredHeight;
    };

    addDetail('Nama Event', event.title);
    addDetail(
      'Waktu Perform',
      formatDateID(event.date, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
    addDetail('Lokasi', event.location);
    if (event.description) addDetail('Keterangan', event.description);

    // === 2. DAFTAR PERSONEL ===
    y += 8;
    checkOverflowAndAddPage(40);
    
    pdf.setFont('times', 'bold');
    pdf.text('2. Daftar Personel', marginLeft, y);
    pdf.setFont('times', 'normal');
    y += 8;

    // Filter only personnel with users (no empty slots)
    const actualPersonnel = event.personnel.filter((p: any) => p.user);

    if (!actualPersonnel.length) {
      pdf.text('- Belum ada personel terdaftar.', detCol1, y);
      y += 6;
    } else {
      // Filter only personnel with users (no empty slots)
      const actualPersonnel = event.personnel.filter((p: any) => p.user);

      actualPersonnel.forEach((p: any, i: number) => {
        const line = `${i + 1 || ''}. ${p.role || ''} : ${p.user?.name || ''} - ${p.user?.id || ''} - ${p.user?.major || ''}`;
        const lines = pdf.splitTextToSize(line, maxWidth);
        const requiredHeight = lines.length * 6;
        
        checkOverflowAndAddPage(requiredHeight);

        pdf.text(lines, detCol1, y);
        y += requiredHeight;
      });
    }

    // === 3. DAFTAR LAGU YANG DIBAWAKAN ===
    y += 10;
    checkOverflowAndAddPage(40); 
    
    pdf.setFont('times', 'bold');
    pdf.text('3. Daftar Lagu yang Dibawakan', marginLeft, y);
    pdf.setFont('times', 'normal');
    y += 8;

    if (!songs.length) {
      pdf.text('- Belum ada lagu yang tercatat.', detCol1, y);
      y += 6;
    } else {
      songs.forEach((song: any, i: number) => {
        const line = `${i + 1}. ${song.title}${song.artist ? ' - ' + song.artist : ''}`;
        const lines = pdf.splitTextToSize(line, maxWidth);
        const requiredHeight = lines.length * 6;
        
        checkOverflowAndAddPage(requiredHeight);

        pdf.text(lines, detCol1, y);
        y += requiredHeight;
      });
    }

    // === 4. PERNYATAAN TANGGUNG JAWAB ===
    y += 10;
    checkOverflowAndAddPage(50);
    
    pdf.setFont('times', 'bold');
    pdf.text('4. Pernyataan Tanggung Jawab', marginLeft, y); 
    pdf.setFont('times', 'normal');
    y += 8;

    const responsibilityText = `Kami bertanggung jawab penuh atas kualitas performa yang disajikan. ` +
      `Oleh karena itu, UKM Band BINUS Bekasi bersedia dan bertanggung jawab ` +
      `untuk menanggung segala konsekuensi, memberikan klarifikasi atau perbaikan, ` +
      `jika terjadi kesalahan teknis, ketidaksesuaian dengan rundown yang disepakati, ` +
      `atau kurangnya performa dalam penampilan kami.`;
    
    y = addJustifiedText(responsibilityText, marginLeft, y, maxWidth);


    // === PENUTUP ===
    y += 12;
    checkOverflowAndAddPage(100); 
    
    const closingText = `Demikian surat pernyataan kesanggupan ini kami buat untuk digunakan ` +
      `sebagaimana mestinya. Kami berharap dapat memberikan performa terbaik ` +
      `dan turut menyukseskan Event "${event.title}". Atas perhatian dan kerjasamanya, kami ` +
      `ucapkan terima kasih.`;

    y = addJustifiedText(closingText, marginLeft, y, maxWidth);
    y += 12; 

    // === TANDA TANGAN ===
    const ttdX = contentEnd - 60;
    pdf.text('Hormat kami,', ttdX, y);
    y += 5;
    pdf.addImage(ttdImg, 'JPEG', ttdX, y, 40, 20);
    y += 25;
    pdf.text('Jones Morgan', ttdX, y);
    pdf.line(ttdX - 2, y + 1, ttdX + 40, y + 1);
    y += 6;
    pdf.setFont('times', 'bold');
    pdf.text('Ketua UKM Band BINUS Bekasi', ttdX, y);

    // === FOOTER (Diulang di semua halaman) ===
    // PERBAIKAN TYPE ERROR DENGAN TYPE ASSERTION (as any)
    const totalPages = (pdf.internal as any).getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      const footerText = 'Dokumen ini dihasilkan secara otomatis oleh UKM Band Bekasi Dashboard';
      const footerLines = pdf.splitTextToSize(footerText, maxWidth);
      pdf.text(footerLines, center, pageHeight - marginBottom + 10, { align: 'center' }); 
    }

    // === SIMPAN PDF ===
    const eventTitleSlug = event.title.replace(/[^a-z0-9]/gi, '_').toUpperCase();
    const todayDate = new Date().toISOString().split('T')[0];
    const fileName = `Surat_Kesanggupan_${eventTitleSlug}_${todayDate}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    toast({ 
      title: 'Error',
      description: 'Gagal membuat surat kesanggupan', 
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setDownloadingPdf(null);
  }
};

const downloadDataReport = async (event: EventWithPersonnel) => {
  setDownloadingDataPdf(event.id);

  try {
    // Import jsPDF
    const { jsPDF } = await import('jspdf');

    // PDF Configuration
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // PDF Constants
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 20;
    const marginBottom = 20;
    const maxWidth = pageWidth - marginLeft - marginRight;
    const center = pageWidth / 2;

    // Fonts
    pdf.setFont('times', 'normal');
    let fontSize = 12;
    pdf.setFontSize(fontSize);
    let y = marginTop;

    // Helper function for page overflow
    const checkOverflowAndAddPage = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - marginBottom) {
        pdf.addPage();
        y = marginTop;
      }
    };

    // === HEADER ===
    checkOverflowAndAddPage(50);

    // Title
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.text('LAPORAN DATA PERSONEL EVENT', center, y, { align: 'center' });
    y += 12;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    pdf.text('UKM Band BINUS Bekasi', center, y, { align: 'center' });
    y += 8;

    // === EVENT DETAILS ===
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.text('Detail Event', marginLeft, y);
    pdf.setFont('times', 'normal');
    y += 8;

    const detCol1 = marginLeft;
    const detCol2 = detCol1 + 25;
    const detCol3 = detCol2 + 3;
    const detWidth = maxWidth - (detCol3 - marginLeft);

    const addDetail = (label: string, value: string) => {
      const lines = pdf.splitTextToSize(value || '-', detWidth);
      const requiredHeight = lines.length * 5;

      checkOverflowAndAddPage(requiredHeight);

      pdf.setFont('times', 'bold');
      pdf.setFontSize(10);
      pdf.text(label, detCol1, y);
      pdf.setFont('times', 'normal');
      pdf.text(':', detCol2, y);
      pdf.text(lines, detCol3, y);
      y += requiredHeight;
    };

    addDetail('Nama Event', event.title);
    addDetail('Waktu', formatDateID(event.date, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }));
    addDetail('Lokasi', event.location);

    // === PERSONNEL LIST ===
    y += 10;
    checkOverflowAndAddPage(30);

    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.text('Data Personel Terdaftar', marginLeft, y);
    y += 10;

    // Filter only personnel with users (no empty slots)
    const actualPersonnel = event.personnel.filter((p: any) => p.user);

    if (!actualPersonnel.length) {
      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);
      pdf.text('- Belum ada personel terdaftar.', marginLeft, y);
      y += 6;
    } else {
      // Table headers
      const headers = ['No', 'Nama Lengkap', 'Role', 'NIM', 'Jurusan/Prodi'];
      const colWidths = [10, 40, 30, 25, 35];
      let totalWidth = colWidths.reduce((a, b) => a + b, 0);
      const scale = maxWidth / totalWidth;

      checkOverflowAndAddPage(15);

      pdf.setFont('times', 'bold');
      pdf.setFontSize(9);
      let currentX = marginLeft;

      headers.forEach((header, i) => {
        pdf.text(header, currentX, y);
        currentX += colWidths[i] * scale;
      });

      y += 8;

      // Table rows
      // Filter only personnel with users (no empty slots)
      const actualPersonnel = event.personnel.filter((p: any) => p.user);

      actualPersonnel.forEach((p: any, i: number) => {
        checkOverflowAndAddPage(10);

        pdf.setFont('times', 'normal');
        pdf.setFontSize(8);

        const rowData = [
          (i + 1).toString(),
          p.user?.name || '-',
          p.role || '-',
          p.user?.id || '-',
          p.user?.major || '-'
        ];

        currentX = marginLeft;
        rowData.forEach((data, j) => {
          const lines = pdf.splitTextToSize(data, colWidths[j] * scale);
          pdf.text(lines[0] || '-', currentX, y);
          currentX += colWidths[j] * scale;
        });

        y += 6;
      });
    }

        // === FOOTER ===
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont('times', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      const footerText = `Dokumen ini dihasilkan secara otomatis oleh UKM Band Bekasi Dashboard - Halaman ${i} dari ${totalPages}`;
      pdf.text(footerText, center, pageHeight - marginBottom + 10, { align: 'center' });
    }

    // === SIMPAN PDF ===
    const eventTitleSlug = event.title.replace(/[^a-z0-9]/gi, '_').toUpperCase();
    const todayDate = new Date().toISOString().split('T')[0];
    const fileName = `Data_Personel_${eventTitleSlug}_${todayDate}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating data PDF:', error);
    toast({
      title: 'Error',
      description: 'Gagal membuat laporan data personel',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setDownloadingDataPdf(null);
  }
};


  const getStats = () => {
    const now = new Date();

    // Total Events - semua event tanpa terkecuali
    const total = events.length;

    // Event Akan Datang - event dengan tanggal di masa depan (setelah sekarang)
    const upcoming = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate > now; // Hanya berdasarkan tanggal, tidak peduli status
    }).length;

    // Event Selesai - event yang sudah lewat tanggalnya atau status FINISHED
    const finished = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate <= now || e.status === 'FINISHED';
    }).length;

    // Published - event yang statusnya PUBLISHED (untuk info tambahan)
    const published = events.filter(e => e.status === 'PUBLISHED').length;

    return { total, published, finished, upcoming };
  };

  const stats = getStats();

  // Limit displayed events to max 5
  const displayedEvents = filteredEvents.slice(0, 5);
  const remainingEventsCount = Math.max(0, filteredEvents.length - 5);

  // Color mapping for stats boxes
  const statColorMap: { [key: string]: { bg: string, color: string } } = {
    total: { bg: bgAccentLight, color: '#3182CE' }, // Blue.600
    published: { bg: bgAccentLight, color: '#38A169' }, // Green.600
    upcoming: { bg: bgAccentLight, color: '#805AD5' }, // Purple.600
    finished: { bg: bgAccentLight, color: '#ED8936' }, // Orange.600
  };

  if (status === 'loading' || loading) {
    return (
      <Box minH="100vh" bg={bgMain}>
        <ManagerSidebar activeRoute="events" />
        <ManagerHeader />
        <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 8 }}>
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
      <ManagerHeader />

      <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 8 }}>
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
              href="/dashboard/manager/create-event"
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

          

          {/* Filters */}
          {/* Search + Filter Section */}
<Stack
  direction={{ base: "column", md: "row" }}
  spacing={4}
  w="full"
  align={{ base: "stretch", md: "center" }}
>
  {/* Search Input */}
  <InputGroup flex="1" maxW="full">
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

  {/* Filter Dropdown */}
  <Select
    placeholder="Filter Status"
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    borderRadius="xl"
    color="darkgrey"
    w={{ base: "full", md: "180px" }}
  >
    <option value="PUBLISHED">Dipublikasikan</option>
    <option value="DRAFT">Draft</option>
    <option value="FINISHED">Selesai</option>
    <option value="SUBMITTED">Menunggu Persetujuan</option>
    <option value="REJECTED">Ditolak</option>
  </Select>

  {/* Filter Tanggal */}
  <Input
    type="date"
    value={filterDate}
    onChange={(e) => setFilterDate(e.target.value)}
    borderRadius="xl"
    color="darkgrey"
    w={{ base: "full", md: "180px" }}
  />

  {/* Tombol Reset */}
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
      w={{ base: "full", md: "auto" }}
    >
      Reset Filter
    </Button>
  )}
</Stack>


          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <Box
              bg={'gray.50'} // Mengganti useColorModeValue('gray.50', 'gray.800')
              borderRadius="2xl"
              p="12"
              textAlign="center"
            >
              <VStack spacing="4">
                <Box p="4" bg={'gray.100'} borderRadius="xl" color={textSecondary}> {/* Mengganti useColorModeValue('gray.100', 'gray.700') */}
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
              {displayedEvents.map((event) => (
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
                  <CardHeader bg={'gray.50'} p="4"> {/* Mengganti useColorModeValue('gray.50', 'gray.800') */}
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
                              cursor={personnel.user ? "pointer" : "default"}
                              onClick={() => personnel.user && openPersonnelModal(personnel)}
                              transition="all 0.2s"
                              _hover={personnel.user ? { bg: "#f3f4f6", transform: "translateY(-1px)" } : {}}
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
                              cursor="pointer"
                              _hover={{ bg: 'red.100' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openFloatingWindow(event);
                              }}
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

                    </VStack>
                  </CardBody>
                </Card>
              ))}

              {/* Remaining Events Card */}
              {remainingEventsCount > 0 && (
                <Card
                  bg={bgAccentLight}
                  shadow="sm"
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor={accentColor}
                  borderStyle="dashed"
                  overflow="hidden"
                  transition="all 0.3s"
                  _hover={{ shadow: 'md', transform: 'translateY(-2px)', cursor: 'pointer' }}
                  onClick={() => {
                    // Optional: bisa scroll ke view all atau navigasi ke page lain
                    toast({
                      title: `${remainingEventsCount} Event Tambahan`,
                      description: 'Gunakan filter untuk menemukan event spesifik atau lihat semua event di view lengkap',
                      status: 'info',
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                >
                  <CardBody p="8" display="flex" alignItems="center" justifyContent="center" minH="200px">
                    <VStack spacing="4" textAlign="center">
                      <Box
                        p="4"
                        bg={accentColor}
                        borderRadius="full"
                        color="white"
                      >
                        <PlusIcon width={24} height={24} />
                      </Box>
                      <VStack spacing="1">
                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                          +{remainingEventsCount}
                        </Text>
                        <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                          Event Lainnya
                        </Text>
                        <Text fontSize="xs" color={textSecondary}>
                          Klik untuk info lebih lanjut
                        </Text>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </SimpleGrid>
          )}
        </VStack>
        <Footer />
      </Box>

      {/* Event Detail Modal */}
      <ManagerResponsiveModal
        isOpen={isFloatingOpen}
        onClose={() => setIsFloatingOpen(false)}
        title={selectedEvent?.title}
        subtitle="Detail event, personel, dan lagu yang akan dibawakan"
        size="xl"
      >
        {selectedEvent && (
          <VStack spacing={6} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {/* Event Info */}
              <VStack align="stretch" spacing={4} gridColumn={{ base: 'span 1', md: 'span 2' }}>
                <Box>
                  <Text fontSize="md" fontWeight="600" color={textPrimary} borderBottom="1px solid" borderColor={borderColor} pb={2} mb={4}>
                    Informasi Dasar
                  </Text>

                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="600" color={textPrimary}>Status:</Text>
                      <Badge
                        colorScheme={getStatusColor(selectedEvent.status)}
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontWeight="600"
                      >
                        {getStatusText(selectedEvent.status)}
                      </Badge>
                    </HStack>

                    <HStack spacing={3} align="start">
                      <CalendarDaysIcon width={20} height={20} color={textSecondary} />
                      <Box>
                        <Text fontSize="sm" color={textSecondary}>Tanggal & Waktu</Text>
                        <Text fontWeight="500" color={textPrimary}>
                          {formatDateID(selectedEvent.date, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack spacing={3} align="start">
                      <MapPinIcon width={20} height={20} color={textSecondary} />
                      <Box>
                        <Text fontSize="sm" color={textSecondary}>Lokasi</Text>
                        <Text fontWeight="500" color={textPrimary}>{selectedEvent.location}</Text>
                      </Box>
                    </HStack>

                    <Box>
                      <Text fontSize="sm" color={textSecondary} mb={1}>Deskripsi</Text>
                      <Text color={textPrimary}>
                        {selectedEvent.description || 'Tidak ada deskripsi.'}
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              </VStack>

              {/* Personnel & Songs */}
              <VStack align="stretch" spacing={6}>
                {/* Personnel */}
                <Box>
                  <Text fontSize="sm" fontWeight="600" color={textPrimary} mb={3}>
                    Personel ({selectedEvent.personnel.filter((p: any) => p.user).length}/{selectedEvent.personnel.length})
                  </Text>
                  <VStack align="stretch" spacing={3} maxH="200px" overflowY="auto" p={2} bg={'gray.50'} borderRadius="md">
                    {selectedEvent.personnel.map((p: any) => (
                      <HStack
                        key={p.id}
                        spacing={3}
                        justify="space-between"
                        p={2}
                        borderRadius="md"
                        cursor={p.user ? "pointer" : "default"}
                        onClick={() => p.user && openPersonnelModal(p)}
                        transition="all 0.2s"
                        _hover={p.user ? { bg: "#f9fafb", transform: "translateY(-1px)" } : {}}
                      >
                        <HStack minW={0} flex={1}>
                          <Avatar size="sm" name={p.user?.name || p.role} bg={p.user ? accentColor : 'gray.400'} />
                          <Box minW={0} flex={1}>
                            <Text fontSize="sm" fontWeight="500" color={textPrimary} noOfLines={1}>
                              {p.user?.name || 'Belum Ada'}
                            </Text>
                            <Text fontSize="xs" color={textSecondary} noOfLines={1}>
                              {p.role}
                            </Text>
                          </Box>
                        </HStack>
                        {p.user && p.status !== 'APPROVED' && (
                          <Badge
                            colorScheme={p.status === 'PENDING' ? 'yellow' : 'red'}
                            fontSize="9px"
                            px={2}
                            py="0.5"
                            borderRadius="full"
                          >
                            {p.status}
                          </Badge>
                        )}
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                {/* Songs */}
                <Box>
                  <Text fontSize="sm" fontWeight="600" color={textPrimary} mb={3}>
                    Lagu ({eventSongs.length})
                  </Text>
                  <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto" p={2} bg={'gray.50'} borderRadius="md">
                    {loadingSongs ? (
                      <Spinner size="sm" color={accentColor} />
                    ) : eventSongs.length > 0 ? (
                      eventSongs.map((song, index) => (
                        <HStack key={song.id} spacing={2} align="center">
                          <Text fontSize="sm" color={textPrimary}>
                            {index + 1}.
                          </Text>
                          <Box flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="500" color={textPrimary} noOfLines={1}>
                              {song.title}
                            </Text>
                            {song.artist && (
                              <Text fontSize="xs" color={textSecondary} noOfLines={1}>
                                {song.artist}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                      ))
                    ) : (
                      <Text fontSize="sm" color={textSecondary}>Tidak ada lagu yang ditambahkan.</Text>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </SimpleGrid>

            {/* Action Buttons */}
            <VStack spacing={4} width="full">
              {/* Download Actions - Paling Atas */}
              <HStack spacing={2} width="full" justify="center">
                <Button
                  leftIcon={<ArrowDownTrayIcon width={16} height={16} />}
                  colorScheme="red"
                  bg="red.600"
                  color="white"
                  onClick={() => selectedEvent && downloadEventReport(selectedEvent)}
                  isLoading={downloadingPdf === selectedEvent?.id}
                  loadingText="Mengunduh..."
                  size="sm"
                  flex={1}
                  minW="120px"
                >
                  Surat Kesanggupan
                </Button>
                <Button
                  leftIcon={<ArrowDownTrayIcon width={16} height={16} />}
                  colorScheme="darkred"
                  bg="darkred"
                  color="white"
                  onClick={() => selectedEvent && downloadDataReport(selectedEvent)}
                  isLoading={downloadingDataPdf === selectedEvent?.id}
                  loadingText="Mengunduh..."
                  size="sm"
                  flex={1}
                  minW="120px"
                >
                  Data Personel
                </Button>
              </HStack>

              <Divider />

              {/* Edit & Delete Actions - Tengah */}
              <HStack spacing={2} width="full" justify="center">
                <Button
                  leftIcon={<PencilIcon width={16} height={16} />}
                  size="sm"
                  onClick={() => {
                    setIsFloatingOpen(false);
                    openEditEvent(selectedEvent!);
                  }}
                  colorScheme="red"
                  variant="outline"
                  flex={1}
                  minW="120px"
                >
                  Edit Event
                </Button>
                <Button
                  leftIcon={<TrashIcon width={16} height={16} />}
                  size="sm"
                  onClick={() => openDeleteModal(selectedEvent!)}
                  colorScheme="red"
                  variant="solid"
                  flex={1}
                  minW="120px"
                >
                  Hapus Event
                </Button>
              </HStack>

              <Divider />

              {/* Close Button - Paling Bawah */}
              <HStack spacing={2} width="full" justify="center">
                <Button
                  variant="outline"
                  onClick={() => setIsFloatingOpen(false)}
                  size="sm"
                  flex={1}
                  minW="120px"
                  borderColor="gray.300"
                  color="gray.600"
                  _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                >
                  Tutup
                </Button>
              </HStack>
            </VStack>
          </VStack>
        )}
      </ManagerResponsiveModal>

      {/* Edit Event Modal */}
      <ManagerResponsiveModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Event: ${selectedEvent?.title}`}
        size="xl"
      >
        <VStack spacing={6} align="stretch">
          {/* Slot Configuration Section */}
          <Box p={5} bg="#f8fafc" borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
            <HStack spacing={3} mb={4}>
              <Box p={2} bg="red.100" borderRadius="lg">
                <Text fontSize="lg" color="red.600">⚙</Text>
              </Box>
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="lg" fontWeight="600" color={textPrimary}>Konfigurasi Slot</Text>
                <Text fontSize="sm" color={textSecondary}>Atur konfigurasi slot personel untuk event ini</Text>
              </VStack>
            </HStack>

            <HStack spacing={4} align="center" p={4} bg="white" borderRadius="lg">
              <Text fontSize="sm" color={textSecondary} flex={1}>
                Status Konfigurasi Slot:
              </Text>
              <Button
                size="md"
                colorScheme={slotConfigEnabled ? 'green' : 'gray'}
                onClick={() => toggleSlotConfig(selectedEvent?.id || '', !slotConfigEnabled)}
                isLoading={loadingSlots}
                px={6}
              >
                {slotConfigEnabled ? '✓ Slot Diaktifkan' : 'Slot Dinonaktifkan'}
              </Button>
            </HStack>

            {slotConfigEnabled && (
              <Alert status="info" borderRadius="lg" mt={4}>
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="600" color={textPrimary}>
                    Format Band Standar:
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    3 Vokalis, 1 Basis, 1 Drummer, 1 Keyboardis, 2 Gitaris
                  </Text>
                </VStack>
              </Alert>
            )}
          </Box>

          {/* Event Information Form */}
          <Box p={5} bg="#f8fafc" borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
            <HStack spacing={3} mb={6}>
              <Box p={2} bg="red.100" borderRadius="lg">
                <Text fontSize="lg" color="red.600">📝</Text>
              </Box>
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="lg" fontWeight="600" color={textPrimary}>Informasi Event</Text>
                <Text fontSize="sm" color={textSecondary}>Edit detail informasi event</Text>
              </VStack>
            </HStack>

            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color={textPrimary}>Judul Event</FormLabel>
                <Input
                  value={editEvent.title}
                  onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                  placeholder="Nama Acara"
                  borderRadius="lg"
                  size="lg"
                  fontSize="md"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color={textPrimary}>Deskripsi</FormLabel>
                <Textarea
                  value={editEvent.description}
                  onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                  placeholder="Deskripsi singkat acara (opsional)"
                  borderRadius="lg"
                  size="lg"
                  fontSize="md"
                  rows={4}
                  resize="vertical"
                />
              </FormControl>

              <HStack spacing={4} align="stretch">
                <FormControl isRequired flex={1}>
                  <FormLabel fontSize="sm" fontWeight="600" color={textPrimary}>Tanggal & Waktu</FormLabel>
                  <Input
                    type="datetime-local"
                    value={editEvent.date}
                    onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })}
                    borderRadius="lg"
                    size="lg"
                    fontSize="md"
                    color="darkgrey"
                  />
                </FormControl>

                <FormControl isRequired flex={1}>
                  <FormLabel fontSize="sm" fontWeight="600" color={textPrimary}>Lokasi</FormLabel>
                  <Input
                    value={editEvent.location}
                    onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                    placeholder="Contoh: Lapangan Kampus"
                    borderRadius="lg"
                    size="lg"
                    fontSize="md"
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color={textPrimary}>Status Event</FormLabel>
                <Select
                  value={editEvent.status}
                  onChange={(e) => setEditEvent({ ...editEvent, status: e.target.value as EventStatus })}
                  borderRadius="lg"
                  size="lg"
                  fontSize="md"
                  color="darkgrey"
                >
                  <option value="DRAFT">📝 Draft</option>
                  <option value="SUBMITTED">⏳ Menunggu Persetujuan</option>
                  <option value="PUBLISHED">✅ Dipublikasikan</option>
                  <option value="FINISHED">🎉 Selesai</option>
                  <option value="REJECTED">❌ Ditolak</option>
                </Select>
              </FormControl>
            </VStack>
          </Box>

          {/* Action Buttons */}
          <ModalActions
            onCancel={() => setIsEditOpen(false)}
            onConfirm={handleUpdateEvent}
            cancelText="Batal"
            confirmText="Simpan Perubahan"
            confirmColor="red"
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          />
        </VStack>
      </ManagerResponsiveModal>

      {/* Delete Confirmation Modal */}
      <ManagerResponsiveModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Event"
        size="md"
      >
        <VStack spacing={4} align="start">
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="600" color={textPrimary}>Peringatan!</Text>
              <Text fontSize="sm" color={textSecondary}>
                Tindakan ini tidak dapat dibatalkan.
              </Text>
            </Box>
          </Alert>

          <Text color={textPrimary}>
            Apakah Anda yakin ingin menghapus event <strong>"{selectedEvent?.title}"</strong>?
          </Text>

          <Text fontSize="sm" color={textSecondary}>
            Semua data personel, lagu, dan konfigurasi yang terkait dengan event ini akan dihapus secara permanen.
          </Text>
        </VStack>

        <ModalActions
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteEvent}
          cancelText="Batal"
          confirmText="Ya, Hapus Event"
          confirmColor="red"
          isLoading={isDeleting}
          isDisabled={isDeleting}
        />
      </ManagerResponsiveModal>

      {/* Personnel Detail Modal */}
      <ManagerResponsiveModal
        isOpen={isPersonnelModalOpen}
        onClose={closePersonnelModal}
        title={selectedPersonnel?.user?.name}
        subtitle={`${selectedPersonnel?.role} • ${selectedPersonnel?.status}`}
        size="xl"
      >
        {selectedPersonnel?.user && (
          <VStack spacing={6} align="stretch">
            {/* Profile Header */}
            <HStack spacing={4} p={4} bg="#f9fafb" borderRadius="lg">
              <Avatar
                size="lg"
                name={selectedPersonnel.user.name}
                bg={accentColor}
              />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="lg" fontWeight="600" color={textPrimary}>
                  {selectedPersonnel.user.name}
                </Text>
                <Badge
                  colorScheme={selectedPersonnel.status === 'APPROVED' ? 'green' : selectedPersonnel.status === 'PENDING' ? 'yellow' : 'red'}
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  {selectedPersonnel.status}
                </Badge>
                <Text fontSize="sm" color={textSecondary}>
                  {selectedPersonnel.role}
                </Text>
              </VStack>
            </HStack>

            {/* Contact Information */}
            <Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} mb={3}>Informasi Kontak</Text>
              <VStack align="start" spacing={3} bg="#f9fafb" p={4} borderRadius="lg">
                <HStack spacing={3}>
                  <AcademicCapIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">NIM</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedPersonnel.user.nim}</Text>
                  </VStack>
                </HStack>
                <HStack spacing={3}>
                  <BuildingOfficeIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">Jurusan</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedPersonnel.user.major}</Text>
                  </VStack>
                </HStack>
                <HStack spacing={3}>
                  <PhoneIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">Telepon</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedPersonnel.user.phoneNumber}</Text>
                  </VStack>
                </HStack>
                <HStack spacing={3}>
                  <UsersIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">Email</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedPersonnel.user.email}</Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* Event Information */}
            <Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} mb={3}>Informasi Event</Text>
              <VStack align="start" spacing={3} bg="#f9fafb" p={4} borderRadius="lg">
                <HStack spacing={3}>
                  <MusicalNoteIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">Peran dalam Event</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedPersonnel.role}</Text>
                  </VStack>
                </HStack>
                <HStack spacing={3}>
                  <CalendarDaysIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">Status Partisipasi</Text>
                    <Badge
                      colorScheme={selectedPersonnel.status === 'APPROVED' ? 'green' : selectedPersonnel.status === 'PENDING' ? 'yellow' : 'red'}
                      fontSize="sm"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {selectedPersonnel.status}
                    </Badge>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* Organization Level */}
            <Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} mb={3}>Level Organisasi</Text>
              <HStack spacing={2} bg="#f9fafb" p={4} borderRadius="lg">
                <Badge
                  colorScheme={
                    selectedPersonnel.user.organizationLvl === 'COMMISSIONER' ? 'purple' :
                    selectedPersonnel.user.organizationLvl === 'PENGURUS' ? 'blue' :
                    selectedPersonnel.user.organizationLvl === 'SPECTA' ? 'green' : 'orange'
                  }
                  fontSize="sm"
                  px={3}
                  py={2}
                  borderRadius="md"
                >
                  {selectedPersonnel.user.organizationLvl === 'COMMISSIONER' ? 'Komisaris' :
                   selectedPersonnel.user.organizationLvl === 'PENGURUS' ? 'Pengurus' :
                   selectedPersonnel.user.organizationLvl === 'SPECTA' ? 'Specta' :
                   selectedPersonnel.user.organizationLvl}
                </Badge>
              </HStack>
            </Box>

            {/* Musical Instruments */}
            <Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} mb={3}>Instrumen Musik</Text>
              <HStack spacing={2} flexWrap="wrap" bg="#f9fafb" p={4} borderRadius="lg">
                {selectedPersonnel.user.instruments?.length > 0 ? (
                  selectedPersonnel.user.instruments.map((instrument: string, idx: number) => (
                    <Badge
                      key={idx}
                      colorScheme="orange"
                      fontSize="sm"
                      px={3}
                      py={2}
                      borderRadius="md"
                    >
                      {instrument}
                    </Badge>
                  ))
                ) : (
                  <Text fontSize="sm" color={textSecondary}>Belum ada informasi instrumen</Text>
                )}
              </HStack>
            </Box>

            <ModalActions
              onCancel={closePersonnelModal}
              onConfirm={closePersonnelModal}
              cancelText="Tutup"
              confirmText="Tutup"
            />
          </VStack>
        )}
      </ManagerResponsiveModal>
    </Box>
  );
}