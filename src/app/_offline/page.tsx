"use client";

import { Box, Container, Heading, Text, Button, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Box flex="1">
        <Container maxW="container.md" py={20}>
          <VStack spacing={6} textAlign="center">
            <Heading size="2xl" color="red.600">
              Anda Sedang Offline
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Tidak ada koneksi internet. Beberapa fitur mungkin tidak tersedia.
            </Text>
            <Text color="gray.500">
              Halaman ini akan berfungsi kembali saat koneksi internet terhubung.
            </Text>
            <Button
              colorScheme="red"
              onClick={() => router.push("/")}
              size="lg"
            >
              Kembali ke Dashboard
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}