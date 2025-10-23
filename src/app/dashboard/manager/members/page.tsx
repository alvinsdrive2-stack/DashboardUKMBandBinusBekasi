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
  useColorModeValue, // WAJIB: Diimpor untuk penyesuaian warna light/dark mode
} from '@chakra-ui/react';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MusicalNoteIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import ManagerSidebar from '@/components/ManagerSidebar';
import { useManagerMembers } from '@/hooks/useManagerData';

// --- Antarmuka (Interface) tetap sama ---
interface Member {
  id: string;
  name: string;
  email: string;
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

  // --- PERBAIKAN: Menggunakan useColorModeValue untuk penamaan warna yang valid ---
  const accentColor = 'red.600'; // Warna aksen umum
  
  // Warna Utama
  const bgMain = useColorModeValue('white', 'gray.800');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Warna UI Tambahan (Mengganti string yang tidak valid)
  const blueBg = useColorModeValue('blue.50', 'blue.900');
  const blueIcon = useColorModeValue('blue.600', 'blue.400');
  const greenBg = useColorModeValue('green.50', 'green.900');
  const greenIcon = useColorModeValue('green.600', 'green.400');
  const greenText = useColorModeValue('green.600', 'green.400');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const purpleIcon = useColorModeValue('purple.600', 'purple.400');
  const purpleText = useColorModeValue('purple.600', 'purple.400');
  const orangeBg = useColorModeValue('orange.50', 'orange.900'); // Hanya digunakan sebagai warna, bukan ikon/teks
  const grayBg = useColorModeValue('gray.50', 'gray.700');
  const grayBadgeBg = useColorModeValue('gray.100', 'gray.600');
  const purpleBadgeBg = useColorModeValue('purple.100', 'purple.800');
  const purpleBadgeText = useColorModeValue('purple.800', 'purple.200');

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
        member.instruments.some(inst => inst.toLowerCase().includes(searchTerm.toLowerCase())); // PERBAIKAN: Tanda kurung () ditambahkan

      const matchesLevel = !filterLevel || member.organizationLvl === filterLevel;

      const matchesStatus = !filterStatus ||
        (filterStatus === 'active' && member.stats.upcomingEvents > 0) ||
        (filterStatus === 'inactive' && member.stats.upcomingEvents === 0); // PERBAIKAN: Tanda kurung ) ditambahkan

      return matchesSearch && matchesLevel && matchesStatus;
    }); // PERBAIKAN: Tanda kurung ) ditambahkan
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
        <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
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

      <Box flex="1" ml={{ base: 0, md: '280px' }} p="8">
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
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="6">
            <Box
              bg={bgMain}
              p="6"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-4px)' }}
              color='black'
            >
              <VStack align="start" spacing="3">
                <Box p="3" bg={blueBg} borderRadius="xl">
                  <UsersIcon width={24} height={24} color={blueIcon} />
                </Box>
                <Box>
                  <Text fontSize="sm" color={textSecondary} fontWeight="medium" mb="1">
                    Total Anggota
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" color={textPrimary}>
                    {stats.total || 0}
                  </Text>
                </Box>
              </VStack>
            </Box>

            <Box
              bg={bgMain}
              p="6"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-4px)' }}
              color='black'
            >
              <VStack align="start" spacing="3">
                <Box p="3" bg={greenBg} borderRadius="xl">
                  <CalendarDaysIcon width={24} height={24} color={greenIcon} />
                </Box>
                <Box>
                  <Text fontSize="sm" color={textSecondary} fontWeight="medium" mb="1">
                    Anggota Aktif
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" color={greenText}>
                    {stats.active || 0}
                  </Text>
                  <Progress
                    value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
                    size="sm"
                    colorScheme="green"
                    mt="2"
                    borderRadius="full"
                  />
                </Box>
              </VStack>
            </Box>

            <Box
              bg={bgMain}
              p="6"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              transition="all 0.3s"
              _hover={{ shadow: 'md', transform: 'translateY(-4px)' }}
              color='black'
            >
              <VStack align="start" spacing="3">
                <Box p="3" bg={purpleBg} borderRadius="xl">
                  <MusicalNoteIcon width={24} height={24} color={purpleIcon} />
                </Box>
                <Box>
                  <Text fontSize="sm" color={textSecondary} fontWeight="medium" mb="1">
                    Total Partisipasi
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" color={purpleText}>
                    {stats.totalParticipations || 0}
                  </Text>
                </Box>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Filters */}
          <HStack spacing="4" flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <MagnifyingGlassIcon width={16} height={16} color={textSecondary} />
              </InputLeftElement>
              <Input
                placeholder="Cari nama, email, atau instrument..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="xl"
                color={textPrimary}
              />
            </InputGroup>

            <Select
              placeholder="Filter Level"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              maxW="200px"
              borderRadius="xl"
              color={filterLevel ? textPrimary : textSecondary}
            >
              <option value="COMMISSIONER">Komisaris</option>
              <option value="PENGURUS">Pengurus</option>
              <option value="SPECTA">Specta</option>
              <option value="TALENT">Talent</option>
            </Select>

            <Select
              placeholder="Filter Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              maxW="200px"
              borderRadius="xl"
              color={filterStatus ? textPrimary : textSecondary}
            >
              <option value="active">Aktif (Ada event)</option>
              <option value="inactive">Tidak Aktif</option>
            </Select>

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
              >
                Reset Filter
              </Button>
            )}
          </HStack>

          {/* Members Table */}
          {filteredMembers.length === 0 ? (
            <Box
              bg={grayBg}
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
            <TableContainer bg={bgMain} borderRadius="2xl" borderWidth="1px" borderColor={borderColor}>
              <Table variant="simple">
                <Thead bg={grayBg}>
                  <Tr>
                    <Th color={textPrimary} fontWeight="semibold">Anggota</Th>
                    <Th color={textPrimary} fontWeight="semibold">Level</Th>
                    <Th color={textPrimary} fontWeight="semibold">Instrument</Th>
                    <Th color={textPrimary} fontWeight="semibold">Partisipasi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredMembers.map((member) => (
                    <Tr
                      key={member.id}
                      _hover={{ bg: grayBg, cursor: 'pointer' }}
                      transition="all 0.2s"
                      onClick={() => openMemberDetail(member)}
                    >
                      <Td>
                        <HStack spacing="3">
                          <Avatar
                            size="sm"
                            name={member.name}
                            bg={accentColor}
                          />
                          <Box>
                            <Text fontWeight="semibold" color={textPrimary}>
                              {member.name}
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>
                              {member.email}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getLevelColor(member.organizationLvl)}
                          fontSize="xs"
                          px="2"
                          py="1"
                          borderRadius="md"
                        >
                          {getLevelText(member.organizationLvl)}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing="1" maxW="200px">
                          {member.instruments.slice(0, 2).map((instrument, idx) => (
                            <Badge
                              key={idx}
                              bg={grayBadgeBg}
                              color={textSecondary}
                              fontSize="xs"
                              px="2"
                              py="1"
                              borderRadius="md"
                            >
                              {instrument}
                            </Badge>
                          ))}
                          {member.instruments.length > 2 && (
                            <Text fontSize="xs" color={textSecondary}>
                              +{member.instruments.length - 2} lagi
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing="1">
                          <HStack spacing="2">
                            <Badge colorScheme="green" fontSize="xs" px="2" py="1">
                              ✓ {member.stats.approvedParticipations}
                            </Badge>
                            <Badge colorScheme="yellow" fontSize="xs" px="2" py="1">
                              ⏳ {member.stats.pendingParticipations}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color={textSecondary}>
                            Total: {member.stats.totalParticipations}
                          </Text>
                        </VStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </VStack>
      </Box>

      {/* Member Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        size="2xl"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" bg={bgMain}>
          <ModalHeader
            bg={grayBg}
            borderBottomWidth="1px"
            borderColor={borderColor}
          >
            <HStack spacing="3">
              <Avatar
                size="md"
                name={selectedMember?.name}
                bg={accentColor}
              />
              <Box>
                <Text fontSize="xl" fontWeight="bold" color={textPrimary}>
                  {selectedMember?.name}
                </Text>
                <HStack spacing="2">
                  <Badge
                    colorScheme={selectedMember ? getLevelColor(selectedMember.organizationLvl) : 'gray'}
                    fontSize="xs"
                  >
                    {selectedMember ? getLevelText(selectedMember.organizationLvl) : ''}
                  </Badge>
                  <Text fontSize="sm" color={textSecondary}>
                    {selectedMember?.email}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p="6">
            {selectedMember && (
              <VStack spacing="6" align="stretch">
                {/* Instruments */}
                <Box>
                  <Text fontWeight="semibold" color={textPrimary} mb="3">Instrument</Text>
                  <HStack spacing="2" flexWrap="wrap">
                    {selectedMember.instruments.map((instrument, idx) => (
                      <Badge
                        key={idx}
                        bg={purpleBadgeBg}
                        color={purpleBadgeText}
                        fontSize="sm"
                        px="3"
                        py="2"
                        borderRadius="md"
                      >
                        🎵 {instrument}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                {/* Stats */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing="4">
                  <Stat>
                    <StatLabel color={textSecondary} fontSize="sm">Total Partisipasi</StatLabel>
                    <StatNumber color={textPrimary} fontSize="2xl">
                      {selectedMember.stats.totalParticipations}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel color={textSecondary} fontSize="sm">Disetujui</StatLabel>
                    <StatNumber color="green.500" fontSize="2xl">
                      {selectedMember.stats.approvedParticipations}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel color={textSecondary} fontSize="sm">Pending</StatLabel>
                    <StatNumber color="yellow.500" fontSize="2xl">
                      {selectedMember.stats.pendingParticipations}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel color={textSecondary} fontSize="sm">Event Aktif</StatLabel>
                    <StatNumber color={accentColor} fontSize="2xl">
                      {selectedMember.stats.upcomingEvents}
                    </StatNumber>
                  </Stat>
                </SimpleGrid>

                {/* Recent Participations */}
                <Box>
                  <Text fontWeight="semibold" color={textPrimary} mb="3">Partisipasi Terkini</Text>
                  <VStack spacing="2" align="stretch" maxH="300px" overflowY="auto" p="1">
                    {selectedMember.participations.length === 0 ? (
                      <Text color={textSecondary} textAlign="center" py="4">
                        Belum ada partisipasi
                      </Text>
                    ) : (
                      selectedMember.participations.map((participation) => (
                        <Box
                          key={participation.id}
                          p="3"
                          bg={grayBg}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor={borderColor}
                        >
                          <Flex justify="space-between" align="center">
                            <VStack align="start" spacing="1">
                              <Text fontWeight="medium" color={textPrimary}>
                                {participation.event.title}
                              </Text>
                              <HStack spacing="3" fontSize="xs" color={textSecondary} divider={<Text>|</Text>}>
                                <Text>📅 {new Date(participation.event.date).toLocaleDateString('id-ID')}</Text>
                                <Text>📍 {participation.event.location}</Text>
                                <Text>🎭 {participation.role}</Text>
                              </HStack>
                            </VStack>
                            <Badge
                              colorScheme={getStatusColor(participation.status)}
                              fontSize="xs"
                              px="2"
                              py="1"
                              borderRadius="md"
                            >
                              {participation.status}
                            </Badge>
                          </Flex>
                        </Box>
                      ))
                    )}
                  </VStack>
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
              onClick={() => setIsDetailOpen(false)}
            >
              Tutup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}