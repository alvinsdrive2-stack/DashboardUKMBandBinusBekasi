'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Switch,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Card,
  CardHeader,
  CardBody,
  Select,
  Divider,
  Spinner,
  Center,
} from '@chakra-ui/react';
import {
  PlusIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import ManagerSidebar from '@/components/ManagerSidebar';
import ManagerHeader from '@/components/ManagerHeader';
import Footer from '@/components/Footer';

// Interface untuk slot configuration
interface SlotConfiguration {
  type: 'VOCAL' | 'GUITAR' | 'BASS' | 'DRUMS' | 'KEYBOARD' | 'CUSTOM';
  name: string;
  count: number;
  required: boolean;
}

// Pilihan Tipe Slot
const SLOT_TYPES = [
  'VOCAL',
  'GUITAR',
  'BASS',
  'DRUMS',
  'KEYBOARD',
  'CUSTOM',
];

export default function CreateEventPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: (() => {
      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      // Format for datetime-local: YYYY-MM-DDTHH:MM (in local timezone)
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      const hours = String(defaultDate.getHours()).padStart(2, '0');
      const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })(),
    location: '',
    status: 'PUBLISHED' as const,
    isSubmittedByPublic: false
  });

  // Slot configuration state
  const [enableSlotConfig, setEnableSlotConfig] = useState(false);
  const [slotConfiguration, setSlotConfiguration] = useState<SlotConfiguration[]>([
    { type: 'VOCAL', name: 'Vokalis Utama', count: 1, required: true },
    { type: 'GUITAR', name: 'Gitaris', count: 1, required: true },
    { type: 'BASS', name: 'Basis', count: 1, required: true },
    { type: 'DRUMS', name: 'Drummer', count: 1, required: true },
  ]);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Theme colors
  const bgMain = 'gray.50';
  const bgCard = 'white';
  const textPrimary = 'gray.800';
  const textSecondary = 'gray.600';
  const borderColor = 'gray.200';
  const accentColor = 'red.500';

  // Check if user is manager
  useEffect(() => {
    if (session && (!session.user?.organizationLvl || !['COMMISSIONER', 'PENGURUS'].includes(session.user.organizationLvl))) {
      router.push('/dashboard/manager');
    }
  }, [session, router]);

  // Show loading spinner while checking session
  if (!session) {
    return (
      <Center minH="100vh" bg={bgMain}>
        <VStack spacing={4}>
          <Spinner size="xl" color="red.500" thickness="4px" />
          <Text color={textSecondary}>Memeriksa otorisasi...</Text>
        </VStack>
      </Center>
    );
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSlotConfigChange = (index: number, field: string, value: string | number | boolean) => {
    const newConfig = [...slotConfiguration];
    newConfig[index] = { ...newConfig[index], [field]: value };
    setSlotConfiguration(newConfig);
  };

  const addSlotType = () => {
    setSlotConfiguration([...slotConfiguration, {
      type: 'CUSTOM',
      name: 'Slot Kustom Baru',
      count: 1,
      required: false
    }]);
  };

  const removeSlotType = (index: number) => {
    const newConfig = slotConfiguration.filter((_, i) => i !== index);
    setSlotConfiguration(newConfig);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.location) {
      toast({
        title: 'Validasi Gagal',
        description: 'Judul, Tanggal, dan Lokasi wajib diisi.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Set loading state to true
    setIsLoading(true);

    // Convert datetime-local to proper timezone handling
    // datetime-local format: "YYYY-MM-DDTHH:MM" in user's local timezone
    console.log('Original datetime-local input:', formData.date);

    // Create date object from the datetime-local input (preserves local time)
    const localDate = new Date(formData.date);
    console.log('Parsed local date:', localDate.toString());

    // Convert to ISO string for server (this converts to UTC but preserves the actual time)
    const isoDate = localDate.toISOString();
    console.log('ISO date sent to server:', isoDate);

    try {
      const response = await fetch('/api/events/manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: isoDate, // Send proper ISO date
          slotConfigurable: enableSlotConfig,
          slotConfiguration: enableSlotConfig ? slotConfiguration : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Berhasil! 🎉',
          description: data.message || 'Event berhasil dibuat',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push('/dashboard/manager/events');
      } else {
        console.error('Error creating event:', data.error);
        toast({
          title: 'Error 😭',
          description: data.error || 'Gagal membuat event. Silakan coba lagi.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error 😭',
        description: 'Gagal membuat event. Silakan coba lagi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      // Always set loading to false
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={bgMain}>
      <ManagerSidebar activeRoute="events" />
      <ManagerHeader />

      <Box flex="1" ml={{ base: 0, md: '280px' }} mt={{ base: '60px', md: 0 }} p={{ base: 4, md: 6 }} position="relative">
        {/* Loading Overlay */}
        {isLoading && (
          <Box
            position="fixed"
            top={{ base: '60px', md: 0 }}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={9999}
          >
          <VStack spacing={4} bg="white" p={8} borderRadius="lg" boxShadow="lg">
            <Spinner size="xl" color="red.500" thickness="4px" />
            <Text color={textPrimary} fontWeight="medium">Membuat event...</Text>
            <Text color={textSecondary} fontSize="sm">Mohon tunggu sebentar</Text>
          </VStack>
        </Box>
      )}

      <VStack spacing={5} maxW="4xl" mx="auto" as="form" onSubmit={handleSubmit}>
        {/* Header dan Tombol Kembali */}
        <Flex justify="space-between" align="center" w="full">
          <Box>
            <Button
              onClick={() => router.push('/dashboard/manager/events')}
              colorScheme="gray"
              variant="outline"
              size="sm"
              borderRadius="md"
              leftIcon={<ArrowLeftIcon width={14} height={14} />}
              _hover={{ bg: 'gray.100' }}
              isDisabled={isLoading}
            >
              Kembali
            </Button>
          </Box>
          <Box textAlign="center">
            <Heading size="lg" color={textPrimary} fontWeight="bold">
              Buat Event Baru
            </Heading>
            <Text color={textSecondary} mt={1} fontSize="sm">
              Atur detail dan kebutuhan musisi untuk event yang akan datang.
            </Text>
          </Box>
          <Box></Box>
        </Flex>

        {/* Kartu Informasi Dasar */}
        <Card w="full" bg={bgCard} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={3}>
            <Heading size="sm" color={textPrimary} mb={2} fontWeight="semibold">
              1. Informasi Dasar Event
            </Heading>
            <Divider />
          </CardHeader>
          <CardBody pt={3}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel color={textSecondary} fontSize="sm" mb={1}>Judul Event</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Contoh: Showcase Band Akhir Tahun"
                  size="sm"
                  borderRadius="md"
                  focusBorderColor={accentColor}
                  isDisabled={isLoading}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textSecondary} fontSize="sm" mb={1}>Lokasi</FormLabel>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Contoh: Auditorium Kampus"
                  size="sm"
                  borderRadius="md"
                  focusBorderColor={accentColor}
                  isDisabled={isLoading}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textSecondary} fontSize="sm" mb={1}>Tanggal & Waktu Event</FormLabel>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  size="sm"
                  borderRadius="md"
                  focusBorderColor={accentColor}
                  isDisabled={isLoading}
                  min={new Date().toISOString().slice(0, 16)} // Tidak bisa pilih waktu yang sudah lewat
                />
              </FormControl>

              <Box></Box>

              <FormControl gridColumn={{ base: 'span 1', md: 'span 2' }}>
                <FormLabel color={textSecondary} fontSize="sm" mb={1}>Deskripsi</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Jelaskan tujuan dan format event ini secara singkat."
                  size="sm"
                  borderRadius="md"
                  rows={3}
                  focusBorderColor={accentColor}
                  isDisabled={isLoading}
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Kartu Konfigurasi Slot */}
        <Card w="full" bg={bgCard} shadow="md" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={3}>
            <HStack justify="space-between" align="center">
              <Heading size="sm" color={textPrimary} mb={2} fontWeight="semibold">
                2. Konfigurasi Slot Musisi
              </Heading>
              <HStack spacing={2} align="center">
                <Text fontSize="xs" color={textSecondary}>
                  {enableSlotConfig ? 'Aktif' : 'Nonaktif'}
                </Text>
                <Switch
                  isChecked={enableSlotConfig}
                  onChange={(e) => setEnableSlotConfig(e.target.checked)}
                  size="md"
                  colorScheme="red"
                  isDisabled={isLoading}
                />
              </HStack>
            </HStack>
            <Divider />
          </CardHeader>
          <CardBody pt={3}>
            <VStack spacing={3} align="stretch">
              <Text color={textSecondary} fontSize="xs">
                {enableSlotConfig
                  ? 'Atur jumlah dan jenis peran musisi yang dibutuhkan. Aktifkan "Wajib" jika peran harus diisi.'
                  : 'Nonaktif: Menggunakan konfigurasi slot default (1 Vokalis, 1 Gitar, 1 Bass, 1 Drummer).'}
              </Text>

              {enableSlotConfig && (
                <VStack spacing={3} align="stretch">
                  {slotConfiguration.map((slot, index) => (
                    <Box
                      key={index}
                      bg="gray.50"
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      p={3}
                    >
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} spacing={3} alignItems="flex-end">
                        <FormControl gridColumn={{ base: 'span 1', md: 'span 2' }}>
                          <FormLabel fontSize="xs" color={textSecondary} mb={1}>Nama Slot</FormLabel>
                          <Input
                            value={slot.name}
                            onChange={(e) => handleSlotConfigChange(index, 'name', e.target.value)}
                            placeholder="Nama slot"
                            size="sm"
                            bg={bgCard}
                            focusBorderColor={accentColor}
                            isDisabled={isLoading}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="xs" color={textSecondary} mb={1}>Jenis</FormLabel>
                          <Select
                            value={slot.type}
                            onChange={(e) => handleSlotConfigChange(index, 'type', e.target.value as SlotConfiguration['type'])}
                            size="sm"
                            bg={bgCard}
                            focusBorderColor={accentColor}
                            isDisabled={isLoading}
                          >
                            {SLOT_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="xs" color={textSecondary} mb={1}>Jumlah</FormLabel>
                          <NumberInput
                            value={slot.count}
                            onChange={(_, valueAsNumber) => handleSlotConfigChange(index, 'count', valueAsNumber)}
                            min={1}
                            size="sm"
                            bg={bgCard}
                            focusBorderColor={accentColor}
                            isDisabled={isLoading}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <HStack spacing={2} justifyContent="space-between" alignItems="center">
                          <FormControl display="flex" alignItems="center" mb={1}>
                            <FormLabel fontSize="xs" mb={0} mr={2}>Wajib</FormLabel>
                            <Switch
                              isChecked={slot.required}
                              onChange={(e) => handleSlotConfigChange(index, 'required', e.target.checked)}
                              size="sm"
                              colorScheme="red"
                              isDisabled={isLoading}
                            />
                          </FormControl>
                          <Button
                            size="xs"
                            colorScheme="red"
                            onClick={() => removeSlotType(index)}
                            variant="ghost"
                            isDisabled={isLoading}
                          >
                            <XMarkIcon width={12} height={12} />
                          </Button>
                        </HStack>
                      </SimpleGrid>
                    </Box>
                  ))}
                </VStack>
              )}

              <Button
                leftIcon={<PlusIcon width={14} height={14} />}
                onClick={addSlotType}
                colorScheme="red"
                variant="solid"
                size="sm"
                borderRadius="md"
                _hover={{ transform: 'translateY(-1px)', shadow: 'sm', bg: 'red.600' }}
                isDisabled={isLoading}
              >
                Tambah Slot
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Tombol Submit */}
        <HStack w="full" justify="center" spacing={3} mt={4}>
          <Button
            type="submit"
            colorScheme="red"
            size="sm"
            borderRadius="md"
            fontWeight="semibold"
            px={6}
            isLoading={isLoading}
            loadingText="Membuat Event..."
            spinnerPlacement="end"
            _hover={{ transform: 'translateY(-1px)', shadow: 'md', bg: 'red.600' }}
            disabled={isLoading}
          >
            Buat Event
          </Button>
        </HStack>
      </VStack>
      <Footer />
      </Box>
    </Box>
  );
}