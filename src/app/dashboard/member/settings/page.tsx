'use client';

import { Box, Heading, Container } from '@chakra-ui/react';
import PWASettings from '@/components/PWASettings';

export default function SettingsPage() {
  return (
    <Container maxW="container.lg" py={8}>
      <Box>
        <Heading size="2xl" mb={6}>Pengaturan Aplikasi</Heading>
        <PWASettings />
      </Box>
    </Container>
  );
}