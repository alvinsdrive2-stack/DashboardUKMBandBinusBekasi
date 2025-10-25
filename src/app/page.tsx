'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Spinner, Text, Image } from '@chakra-ui/react';
import Footer from '@/components/Footer';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || status === 'loading') return;

    if (status === 'authenticated') {
      // If logged in, redirect to appropriate dashboard
      if (session?.user?.organizationLvl === 'COMMISSIONER' || session?.user?.organizationLvl === 'PENGURUS') {
        router.replace('/dashboard/manager');
      } else {
        router.replace('/dashboard/member');
      }
    } else {
      // If not logged in, redirect to signin
      router.replace('/auth/signin');
    }
  }, [status, session, router, isClient]);

  // Only render loading state on client side
  if (!isClient) {
    return null;
  }

  // Theme colors yang sama dengan dashboard member
  const bgMain = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const accentColor = '#dc2626';

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      justifyContent="center"
      alignItems="center"
      bg={bgMain}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap="6"
        flex="1"
        justifyContent="center"
      >
        {/* Logo/Favicon */}
        <Image
          src="/icons/favicon.png"
          alt="UKM Band Bekasi"
          boxSize="80px"
          objectFit="contain"
        />

        {/* Loading content */}
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap="4"
        >
          <Spinner size="xl" color={accentColor} />
          <Text fontSize="lg" color={textPrimary} fontWeight="500">
            Loading...
          </Text>
          <Text fontSize="sm" color={textSecondary}>
            Redirecting to your dashboard
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
