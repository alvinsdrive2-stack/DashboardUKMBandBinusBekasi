'use client';

import { useState } from 'react';
import { Button, Box, VStack, Text, Heading, Alert, AlertIcon } from '@chakra-ui/react';

export default function ResetServiceWorker() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const resetServiceWorker = async () => {
    setIsResetting(true);
    addLog('🔄 Starting service worker reset...');

    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        addLog(`Found ${registrations.length} service worker registrations`);

        for (const registration of registrations) {
          addLog(`Unregistering: ${registration.scope}`);
          await registration.unregister();
        }
        addLog('✅ All service workers unregistered');
      }

      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        addLog(`Found ${cacheNames.length} caches`);

        for (const cacheName of cacheNames) {
          addLog(`Deleting cache: ${cacheName}`);
          await caches.delete(cacheName);
        }
        addLog('✅ All caches cleared');
      }

      // Clear localStorage and sessionStorage
      addLog('Clearing localStorage...');
      localStorage.clear();

      addLog('Clearing sessionStorage...');
      sessionStorage.clear();

      addLog('✅ Service worker reset completed!');
      addLog('🔄 Refreshing page in 3 seconds...');

      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      addLog(`❌ Error during reset: ${error}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Box p={6} maxW="600px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>🔄 Reset Service Worker</Heading>
          <Text color="gray.600">Clear service workers and caches to fix push notification issues</Text>
        </Box>

        <Alert status="warning">
          <AlertIcon />
          <Text>This will unregister all service workers and clear all caches. You'll need to log in again.</Text>
        </Alert>

        <Box p={4} borderWidth={1} borderRadius="md">
          <VStack spacing={4}>
            <Button
              onClick={resetServiceWorker}
              colorScheme="red"
              size="lg"
              isLoading={isResetting}
              loadingText="Resetting..."
            >
              🔄 Reset Service Worker & Caches
            </Button>

            <Text fontSize="sm" color="gray.600">
              After resetting, the page will automatically refresh and you'll need to:
            </Text>
            <VStack spacing={1} align="start" fontSize="sm">
              <Text>1. Log in again</Text>
              <Text>2. Grant notification permission</Text>
              <Text>3. Subscribe to push notifications</Text>
            </VStack>
          </VStack>
        </Box>

        {logs.length > 0 && (
          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="md" mb={3}>Reset Logs</Heading>
            <Box
              bg="gray.900"
              color="green.400"
              p={3}
              borderRadius="md"
              fontFamily="monospace"
              fontSize="xs"
              height="300px"
              overflowY="auto"
            >
              {logs.map((log, index) => (
                <Text key={index} mb={1}>{log}</Text>
              ))}
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
}