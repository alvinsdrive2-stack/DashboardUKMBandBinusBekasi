'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Spinner, Text } from '@chakra-ui/react';

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

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      flexDirection="column"
      gap="4"
    >
      <Spinner size="xl" color="yellow.400" />
      <Text fontSize="lg" color="yellow.400" bg="red.600" px="4" py="2" borderRadius="md" border="2px solid" borderColor="yellow.400">
        Loading...
      </Text>
    </Box>
  );
}
