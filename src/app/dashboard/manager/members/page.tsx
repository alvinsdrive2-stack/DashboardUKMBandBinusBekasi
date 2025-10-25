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
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Avatar,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  useColorModeValue,
  Icon,// WAJIB: Diimpor untuk penyesuaian warna light/dark mode
  Card,
  CardBody,
  Divider,
  Stack,
} from '@chakra-ui/react';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MusicalNoteIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { CalendarIcon, InfoOutlineIcon, AtSignIcon } from '@chakra-ui/icons';

import ManagerSidebar from '@/components/ManagerSidebar';
import ManagerHeader from '@/components/ManagerHeader';
import ManagerResponsiveModal from '@/components/ManagerResponsiveModal';
import ManagerStatsCards from '@/components/ManagerStatsCards';
import Footer from '@/components/Footer';
import { ModalActions } from '@/components/ManagerResponsiveModal';
import { useManagerMembers } from '@/hooks/useManagerData';
import { useManagerStats } from '@/hooks/useManagerStats';

// --- Antarmuka (Interface) tetap sama ---
interface Member {
  id: string;
  name: string;
  email: string;
  nim: string;
  major: string;
  phoneNumber: string;
  instruments: string[];
  organizationLvl: string;
  participations: {
    id: string;
    event: {
      id: string;
      title: string;
      date: string;
      location: string;
      status: string;
    };
    role: string;
    status: string;
  }[];
  stats: {
    totalParticipations: number;
    approvedParticipations: number;
    pendingParticipations: number;
    rejectedParticipations: number;
    upcomingEvents: number;
  };
}

interface GlobalStats {
  total: number;
  active: number;
  totalParticipations: number;
}
// ----------------------------------------

export default function ManagerMembersPage() {
  // --- PERBAIKAN: Tanda kurung () ditambahkan pada semua hook ---
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { stats: globalStats, loading: statsLoading } = useManagerStats();
  
  // Warna Utama
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const borderColor = '#e5e7eb';

  // Warna UI Tambahan
  const blueBg = '#dbeafe';
  const blueIcon = '#2563eb';
  const greenBg = '#d1fae5';
  const greenIcon = '#059669';
  const greenText = '#059669';
  const purpleBg = '#ede9fe';
  const purpleIcon = '#7c3aed';
  const purpleText = '#7c3aed';
  const orangeBg = '#fed7aa'; // Hanya digunakan sebagai warna, bukan ikon/teks
  const grayBg = '#f9fafb';
  const grayBadgeBg = '#f3f4f6';
  const purpleBadgeBg = '#f3e8ff';
  const purpleBadgeText = '#581c87';
const accentColor = '#dc2626';
  // --- PERBAIKAN: Tanda kurung () ditambahkan pada useState ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Use React Query for data fetching
  // PERBAIKAN: Menambahkan destructuring default value dan type assertion untuk 'stats'
  const {
    members = [],
    stats = {} as GlobalStats,
    isLoading: loading,
    error,
    refetch,
  } = useManagerMembers(filterLevel, filterStatus); // PERBAIKAN: Tanda kurung () ditambahkan

  // Authentication and authorization check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin'); // PERBAIKAN: Tanda kurung () ditambahkan
    } else if (status === 'authenticated' &&
      (session?.user?.organizationLvl !== 'COMMISSIONER' && // PERBAIKAN: Tanda kurung '()' untuk grouping
      session?.user?.organizationLvl !== 'PENGURUS')) {
      router.push('/dashboard/member'); // PERBAIKAN: Tanda kurung () ditambahkan
    }
  }, [status, session, router]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data anggota',
        status: 'error',
        duration: 3000,
        isClosable: true,
      }); // PERBAIKAN: Tanda kurung } ditutup dan () ditambahkan
    }
  }, [error, toast]);

  // Memoized filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.instruments.some(inst => inst.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLevel = !filterLevel || member.organizationLvl === filterLevel;

      const matchesStatus = !filterStatus ||
        (filterStatus === 'active' && member.stats.upcomingEvents > 0) ||
        (filterStatus === 'inactive' && member.stats.upcomingEvents === 0);

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [members, searchTerm, filterLevel, filterStatus]);

  
  const openMemberDetail = (member: Member) => {
    setSelectedMember(member); // PERBAIKAN: Tanda kurung ) ditambahkan
    setIsDetailOpen(true); // PERBAIKAN: Tanda kurung ) ditambahkan
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'COMMISSIONER': return 'purple';
      case 'PENGURUS': return 'blue';
      case 'SPECTA': return 'green';
      case 'TALENT': return 'orange';
      default: return 'gray';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'COMMISSIONER': return 'Komisaris';
      case 'PENGURUS': return 'Pengurus';
      case 'SPECTA': return 'Specta';
      case 'TALENT': return 'Talent';
      default: return level;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'PENDING': return 'yellow';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box minH="100vh" bg={bgMain}>
        <ManagerSidebar activeRoute="members" />
        <ManagerHeader />
        <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 8 }}>
          <Flex justify="center" align="center" minH="60vh">
            <VStack spacing="4">
              <Spinner size="xl" color={accentColor} />
              <Text color={textSecondary}>Memuat data anggota...</Text>
            </VStack>
          </Flex>
        </Box>
      </Box>
    ); // PERBAIKAN: Tanda kurung } ditutup dan ) ditambahkan
  }

  if (!session) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgMain}>
      <ManagerSidebar activeRoute="members" />
      <ManagerHeader />

      <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 8 }}>
        <VStack spacing="6" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" color={textPrimary}>Monitoring Anggota</Heading>
              <Text color={textSecondary}>
                Pantau aktivitas dan partisipasi semua anggota UKM Band
              </Text>
            </Box>
          </Flex>

          <Alert status="info" borderRadius="md" bg={grayBg}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" color={textPrimary}>Dashboard Monitoring:</Text>
              <Text fontSize="sm" color={textSecondary}>
                Lihat statistik partisipasi, instrument yang dimainkan, dan aktivitas terbaru dari setiap anggota.
              </Text>
            </Box>
          </Alert>

                  {/* Stats Cards */}
          <ManagerStatsCards
            totalEvents={globalStats.totalEvents}
            totalMembers={globalStats.totalMembers}
            upcomingEvents={globalStats.upcomingEvents}
            finishedEvents={globalStats.finishedEvents}
            activeMembers={globalStats.activeMembers}
            isLoading={statsLoading}
          />

          {/* Filters */}
          <Stack
  direction={{ base: 'column', md: 'row' }}
  spacing={4}
  align={{ base: 'stretch', md: 'center' }}
  w="full"
  flexWrap="wrap"
>
  {/* Search Input */}
  <InputGroup flex="1" w={{ base: 'full', md: '300px' }}>
    <InputLeftElement pointerEvents="none">
      <MagnifyingGlassIcon width={16} height={16} color={textSecondary} />
    </InputLeftElement>
    <Input
      placeholder="Cari nama, email, NIM, jurusan, telepon, atau instrument..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      borderRadius="xl"
      color={textPrimary}
    />
  </InputGroup>

  {/* Filter Level */}
  <Select
    placeholder="Filter Level"
    value={filterLevel}
    onChange={(e) => setFilterLevel(e.target.value)}
    borderRadius="xl"
    color={filterLevel ? textPrimary : textSecondary}
    w={{ base: 'full', md: '200px' }}
  >
    <option value="COMMISSIONER">Komisaris</option>
    <option value="PENGURUS">Pengurus</option>
    <option value="SPECTA">Specta</option>
    <option value="TALENT">Talent</option>
  </Select>

  {/* Filter Status */}
  <Select
    placeholder="Filter Status"
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    borderRadius="xl"
    color={filterStatus ? textPrimary : textSecondary}
    w={{ base: 'full', md: '200px' }}
  >
    <option value="active">Aktif (Ada event)</option>
    <option value="inactive">Tidak Aktif</option>
  </Select>

  {/* Reset Button */}
  {(searchTerm || filterLevel || filterStatus) && (
    <Button
      variant="outline"
      size="sm"
      borderRadius="xl"
      onClick={() => {
        setSearchTerm('');
        setFilterLevel('');
        setFilterStatus('');
      }}
      w={{ base: 'full', md: 'auto' }}
    >
      Reset Filter
    </Button>
  )}
</Stack>

                {/* Members Cards */}
          {loading ? (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
              {[...Array(6)].map((_, i) => (
                <Card key={i} borderRadius="2xl" overflow="hidden">
                  <CardBody p={6}>
                    <VStack spacing={4} align="center">
                      <Box w={16} h={16} bg="#f3f4f6" borderRadius="full" />
                      <Box w="60%" h="16px" bg="#f3f4f6" borderRadius="full" />
                      <Box w="40%" h="12px" bg="#f3f4f6" borderRadius="full" />
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          ) : filteredMembers.length === 0 ? (
            <Box
              bg={useColorModeValue('gray.50', 'gray.800')}
              borderRadius="2xl"
              p="12"
              textAlign="center"
            >
              <VStack spacing="4">
                <Box fontSize="5xl">👥</Box>
                <Text fontSize="xl" fontWeight="medium" color={textPrimary}>
                  {searchTerm || filterLevel || filterStatus ? 'Tidak ada anggota yang cocok dengan filter' : 'Belum ada anggota'}
                </Text>
                <Text fontSize="md" color={textSecondary} maxW="md">
                  {searchTerm || filterLevel || filterStatus
                    ? 'Coba ubah filter atau pencarian untuk menemukan anggota yang Anda cari'
                    : 'Data anggota akan muncul setelah pendaftaran pertama'
                  }
                </Text>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
              {filteredMembers.map((member) => (
                <Card
                  key={member.id}
                  borderRadius="2xl"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor={borderColor}
                  cursor="pointer"
                  transition="all 0.3s ease"
                  _hover={{
                    transform: { base: 'translateY(-2px)', md: 'translateY(-4px)' },
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    borderColor: accentColor
                  }}
                  onClick={() => openMemberDetail(member)}
                >
                  <CardBody p={6}>
                    <VStack spacing={4} align="center">
                      {/* Avatar */}
                      <Box
                        w={20}
                        h={20}
                        bg="linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        position="relative"
                      >
                        <Text fontSize="2xl" fontWeight="bold" color="white">
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                        <Badge
                          position="absolute"
                          bottom="-2px"
                          right="-2px"
                          colorScheme={getLevelColor(member.organizationLvl)}
                          borderRadius="full"
                          boxSize="6"
                          borderWidth="2px"
                          borderColor="white"
                        />
                      </Box>

                      {/* Name and Level */}
                      <VStack spacing={2} align="center" textAlign="center">
                        <Text fontSize="lg" fontWeight="600" color={textPrimary} noOfLines={1}>
                          {member.name}
                        </Text>
                        <Badge
                          colorScheme={getLevelColor(member.organizationLvl)}
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="md"
                        >
                          {getLevelText(member.organizationLvl)}
                        </Badge>
                      </VStack>

                      {/* Contact Info */}
                      <VStack spacing={2} align="center" w="full">
                        <HStack spacing={2} color={textSecondary} fontSize="sm">
                          <Icon as={EnvelopeIcon} w={4} h={4} />
                          <Text noOfLines={1}>{member.email}</Text>
                        </HStack>
                        {member.nim && (
                          <HStack spacing={2} color={textSecondary} fontSize="sm">
                            <Icon as={AcademicCapIcon} w={4} h={4} />
                            <Text>{member.nim}</Text>
                          </HStack>
                        )}
                        {member.phoneNumber && (
                          <HStack spacing={2} color={textSecondary} fontSize="sm">
                            <Icon as={PhoneIcon} w={4} h={4} />
                            <Text>{member.phoneNumber}</Text>
                          </HStack>
                        )}
                      </VStack>

                      {/* Stats */}
                      <HStack spacing={4} justify="center" w="full">
                        <VStack spacing={1}>
                          <Text fontSize="lg" fontWeight="bold" color={accentColor}>
                            {member.stats?.upcomingEvents || 0}
                          </Text>
                          <Text fontSize="xs" color={textSecondary}>Event</Text>
                        </VStack>
                        <Divider orientation="vertical" h="8" />
                        <VStack spacing={1}>
                          <Text fontSize="lg" fontWeight="bold" color="green.500">
                            {member.stats?.totalParticipations > 0
                              ? `${Math.round((member.stats.approvedParticipations / member.stats.totalParticipations) * 100)}%`
                              : '0%'
                            }
                          </Text>
                          <Text fontSize="xs" color={textSecondary}>Partisipasi</Text>
                        </VStack>
                      </HStack>

                      {/* Instruments */}
                      {member.instruments && member.instruments.length > 0 && (
                        <HStack spacing={2} flexWrap="wrap" justify="center" maxW="full">
                          {member.instruments.slice(0, 3).map((instrument, index) => (
                            <Badge
                              key={index}
                              bg={useColorModeValue('blue.100', 'blue.900')}
                              color={useColorModeValue('blue.800', 'blue.200')}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="md"
                            >
                              {instrument}
                            </Badge>
                          ))}
                          {member.instruments.length > 3 && (
                            <Badge
                              bg={useColorModeValue('gray.100', 'gray.900')}
                              color={useColorModeValue('gray.800', 'gray.200')}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="md"
                            >
                              +{member.instruments.length - 3}
                            </Badge>
                          )}
                        </HStack>
                      )}

                      {/* Click hint */}
                      <Text fontSize="xs" color={textSecondary} textAlign="center">
                        Klik untuk detail →
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </VStack>
        <Footer />
      </Box>

          {/* Member Detail Modal */}
      <ManagerResponsiveModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedMember?.name}
        subtitle={selectedMember?.email}
        size="xl"
      >
        {selectedMember && (
          <VStack spacing={6} align="stretch">
            {/* Profile Header */}
            <HStack spacing={4} p={4} bg="#f9fafb" borderRadius="lg">
              <Avatar
                size="lg"
                name={selectedMember.name}
                bg={accentColor}
              />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="lg" fontWeight="600" color={textPrimary}>
                  {selectedMember.name}
                </Text>
                <Badge
                  colorScheme={getLevelColor(selectedMember.organizationLvl)}
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  {getLevelText(selectedMember.organizationLvl)}
                </Badge>
                <Text fontSize="sm" color={textSecondary}>
                  {selectedMember.email}
                </Text>
              </VStack>
            </HStack>

            {/* Contact Information */}
            <Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} mb={3}>
                Informasi Kontak
              </Text>
              <VStack align="start" spacing={3} bg="#f9fafb" p={4} borderRadius="lg">
                <HStack spacing={3}>
                  <AcademicCapIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">NIM</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedMember.nim}</Text>
                  </VStack>
                </HStack>

                <HStack spacing={3}>
                  <BuildingOfficeIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">Jurusan</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedMember.major}</Text>
                  </VStack>
                </HStack>

                <HStack spacing={3}>
                  <PhoneIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">Telepon</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedMember.phoneNumber}</Text>
                  </VStack>
                </HStack>

                <HStack spacing={3}>
                  <UsersIcon width={16} height={16} color={accentColor} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={textSecondary} fontWeight="500">Email</Text>
                    <Text fontSize="sm" color={textPrimary}>{selectedMember.email}</Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* Instruments */}
            <Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} mb={3}>
                Instrumen
              </Text>
              <HStack spacing={2} flexWrap="wrap" bg="#f9fafb" p={4} borderRadius="lg">
                {selectedMember.instruments.map((instrument, idx) => (
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
                ))}
              </HStack>
            </Box>

            {/* Statistics */}
            <Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} mb={3}>
                Statistik Partisipasi
              </Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} bg="#f9fafb" p={4} borderRadius="lg">
                <VStack spacing={1}>
                  <Text fontSize="xs" color={textSecondary} fontWeight="500">
                    Total Partisipasi
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={textPrimary}>
                    {selectedMember.stats.totalParticipations}
                  </Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontSize="xs" color={textSecondary} fontWeight="500">
                    Disetujui
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {selectedMember.stats.approvedParticipations}
                  </Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontSize="xs" color={textSecondary} fontWeight="500">
                    Pending
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                    {selectedMember.stats.pendingParticipations}
                  </Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontSize="xs" color={textSecondary} fontWeight="500">
                    Event Aktif
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                    {selectedMember.stats.upcomingEvents}
                  </Text>
                </VStack>
              </SimpleGrid>
            </Box>

            {/* Recent Participations */}
            <Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} mb={3}>
                Partisipasi Terkini
              </Text>

              <VStack
                spacing={3}
                align="stretch"
                maxH="320px"
                overflowY="auto"
                bg="#f9fafb"
                p={4}
                borderRadius="lg"
              >
                {selectedMember.participations.length === 0 ? (
                  <Text color={textSecondary} textAlign="center" py={4}>
                    Belum ada partisipasi
                  </Text>
                ) : (
                  selectedMember.participations.map((p) => (
                    <Box
                      key={p.id}
                      p={4}
                      bg="white"
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                      transition="all 0.2s ease"
                    >
                      <Flex justify="space-between" align="center" gap={4}>
                        <VStack align="start" spacing={1}>
                          <Text
                            fontWeight="600"
                            color={textPrimary}
                            fontSize="sm"
                            noOfLines={1}
                          >
                            {p.event.title}
                          </Text>

                          <HStack spacing={4} fontSize="xs" color={textSecondary}>
                            <HStack spacing={1.5}>
                              <CalendarIcon boxSize={3.5} color="red.500" />
                              <Text>{new Date(p.event.date).toLocaleDateString("id-ID")}</Text>
                            </HStack>

                            <HStack spacing={1.5}>
                              <InfoOutlineIcon boxSize={3.5} color="red.500" />
                              <Text noOfLines={1}>{p.event.location}</Text>
                            </HStack>

                            <HStack spacing={1.5}>
                              <AtSignIcon boxSize={3.5} color="red.500" />
                              <Text>{p.role}</Text>
                            </HStack>
                          </HStack>
                        </VStack>

                        <Badge
                          colorScheme={getStatusColor(p.status)}
                          fontSize="xs"
                          px={3}
                          py={1}
                          borderRadius="md"
                          textTransform="capitalize"
                        >
                          {p.status.toLowerCase()}
                        </Badge>
                      </Flex>
                    </Box>
                  ))
                )}
              </VStack>
            </Box>

            <ModalActions
              onCancel={() => setIsDetailOpen(false)}
              onConfirm={() => {}}
              cancelText="Tutup"
            />
          </VStack>
        )}
      </ManagerResponsiveModal>
    </Box>)}