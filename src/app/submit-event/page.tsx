'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  Card,
  CardBody,
  Textarea,
} from '@chakra-ui/react';
import Footer from '@/components/Footer';

export default function SubmitEvent() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    submittedBy: '',
    email: '',
    phoneNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/events/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date).toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Pengajuan berhasil!',
          description: 'Acara Anda telah berhasil diajukan dan akan ditinjau oleh pengurus.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Reset form
        setFormData({
          title: '',
          description: '',
          date: '',
          location: '',
          submittedBy: '',
          email: '',
          phoneNumber: '',
        });
      } else {
        throw new Error('Gagal mengajukan acara');
      }
    } catch (error) {
      toast({
        title: 'Pengajuan gagal',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Box flex="1">
        <Container maxW="lg" py={{ base: '12', md: '24' }}>
          <Stack spacing="8">
            <Stack spacing="6" align="center">
              <Heading size={{ base: 'md', md: 'lg' }}>Ajukan Acara</Heading>
              <Text color="fg.muted" textAlign="center">
                Isi formulir berikut untuk mengajukan acara untuk UKM Band Bekasi.
                Pengajuan Anda akan ditinjau oleh pengurus kami.
              </Text>
            </Stack>

            <Card>
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <Stack spacing="6">
                    <Stack spacing="5">
                      <FormControl isRequired>
                        <FormLabel htmlFor="title">Judul Acara</FormLabel>
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          placeholder="Contoh: Pentas Seni Sekolah"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor="description">Deskripsi Acara</FormLabel>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Jelaskan secara detail tentang acara Anda..."
                          rows={4}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor="date">Tanggal Acara</FormLabel>
                        <Input
                          id="date"
                          name="date"
                          type="datetime-local"
                          value={formData.date}
                          onChange={handleChange}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor="location">Lokasi Acara</FormLabel>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Contoh: Aula Sekolah, Jl. Pendidikan No. 1"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor="submittedBy">Nama Lengkap</FormLabel>
                        <Input
                          id="submittedBy"
                          name="submittedBy"
                          value={formData.submittedBy}
                          onChange={handleChange}
                          placeholder="Nama pengaju acara"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor="email">Email</FormLabel>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="email@example.com"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel htmlFor="phoneNumber">Nomor Telepon</FormLabel>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="0812-3456-7890"
                        />
                      </FormControl>
                    </Stack>

                    <Stack spacing="4">
                      <Button
                        type="submit"
                        colorScheme="red"
                        isLoading={isSubmitting}
                        loadingText="Mengajukan..."
                      >
                        Ajukan Acara
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              </CardBody>
            </Card>

            <Text textAlign="center" color="fg.muted" fontSize="sm">
              Setelah pengajuan, Anda akan menerima konfirmasi melalui email jika acara disetujui.
            </Text>
          </Stack>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}