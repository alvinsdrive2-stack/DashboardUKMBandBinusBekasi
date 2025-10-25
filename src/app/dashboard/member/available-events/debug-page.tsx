'use client';

import { Box, Text, Button } from '@chakra-ui/react';

export default function DebugPage() {
  return (
    <Box minH="100vh" bg="white" p={8}>
      <Text fontSize="3xl" color="black" mb={4}>DEBUG PAGE</Text>
      <Text fontSize="xl" color="black" mb={4}>If you can see this, the basic rendering works</Text>
      <Button colorScheme="blue">Test Button</Button>
    </Box>
  );
}