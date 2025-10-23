'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
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
  VStack,
  useToast,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [nim, setNim] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        nim,
        redirect: false,
      });

      if (result?.ok) {
        const session = await getSession();

        toast({
          title: 'Login berhasil',
          description: 'Selamat datang kembali!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        if (
          session?.user?.organizationLvl === 'COMMISSIONER' ||
          session?.user?.organizationLvl === 'PENGURUS'
        ) {
          router.push('/dashboard/manager');
        } else {
          router.push('/dashboard/member');
        }
      } else {
        toast({
          title: 'Login gagal',
          description: 'Email atau NIM salah',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Terjadi kesalahan',
        description: 'Silakan coba lagi',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-b, gray.50, white)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="md" py={{ base: '3', md: '4' }}>
        <Stack spacing="8" textAlign="center">
          <Heading size="lg" color="gray.800">
           <Box
            p={{ base: 1.5, md: 2 }}
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <img
              src="https://i.imgur.com/YZICojL.png"
              alt="UKM Band Logo"
              width={200}
              height={200}
              style={{ objectFit: 'contain' }}
            />
          </Box>
          </Heading>

          <Card
            bg="white"
            boxShadow="xl"
            borderRadius="2xl"
            p={6}
            border="1px solid"
            borderColor="gray.200"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
          >
            <CardBody>
              <form onSubmit={handleSubmit}>
                <Stack spacing="6">
                  <FormControl>
                    <FormLabel fontWeight="600" color="gray.700">
                      Email
                    </FormLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukkan email anda"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      borderColor="gray.300"
                      _focus={{ borderColor: 'black', boxShadow: '0 0 0 1px black' }}
                      color="black"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="600" color="gray.700">
                      NIM
                    </FormLabel>
                    <Input
                      id="nim"
                      type="text"
                      placeholder="Masukkan NIM anda"
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      required
                      borderColor="gray.300"
                      _focus={{ borderColor: 'black', boxShadow: '0 0 0 1px black' }}
                      color="black"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    bg="black"
                    color="white"
                    size="lg"
                    borderRadius="xl"
                    fontWeight="600"
                    isLoading={isLoading}
                    loadingText="Masuk..."
                    _hover={{ bg: 'gray.800' }}
                  >
                    Masuk
                  </Button>
                </Stack>
              </form>
            </CardBody>
          </Card>


          <Text color="gray.600" fontSize="sm">
            Belum punya akun? <strong>Hubungi pengurus</strong> untuk registrasi
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
