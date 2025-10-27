'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  Heading,
  Card,
  CardBody,
  Divider,
  Spinner,
} from '@chakra-ui/react';

export default function TestSocketVercel() {
  const { data: session } = useSession();
  const { socket, isConnected, joinEvent, leaveEvent } = useSocket();
  const [logs, setLogs] = useState<string[]>([]);
  const [testEventId, setTestEventId] = useState('test-event-123');

  useEffect(() => {
    addLog('🔧 Socket.IO Test Page Loaded');
    addLog(`🌐 Environment: ${process.env.NODE_ENV}`);
    addLog(`🔗 Base URL: ${window.location.origin}`);

    if (socket) {
      addLog('✅ Socket instance available');

      socket.on('connect', () => {
        addLog(`🟢 Socket connected with ID: ${socket.id}`);
      });

      socket.on('disconnect', (reason) => {
        addLog(`🔴 Socket disconnected: ${reason}`);
      });

      socket.on('connect_error', (error) => {
        addLog(`❌ Connection error: ${error.message}`);
      });

      socket.on('new-notification', (data) => {
        addLog(`📨 Notification received: ${JSON.stringify(data)}`);
      });
    } else {
      addLog('⚠️ Socket instance not available');
    }
  }, [socket]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testConnection = () => {
    if (!socket) {
      addLog('❌ No socket available');
      return;
    }

    addLog('🔍 Testing connection...');

    if (isConnected) {
      addLog('✅ Socket is connected');
      socket.emit('test-message', {
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });
      addLog('📤 Test message sent');
    } else {
      addLog('❌ Socket is not connected');
    }
  };

  const testEventJoin = () => {
    if (!socket) {
      addLog('❌ No socket available');
      return;
    }

    addLog(`🎯 Joining event: ${testEventId}`);
    joinEvent(testEventId);
  };

  const testEventLeave = () => {
    if (!socket) {
      addLog('❌ No socket available');
      return;
    }

    addLog(`🚪 Leaving event: ${testEventId}`);
    leaveEvent(testEventId);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Box p={8} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading>Socket.IO Vercel Test</Heading>

        {/* Connection Status */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="600">Connection Status:</Text>
                <Badge colorScheme={isConnected ? 'green' : 'red'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </HStack>

              <HStack justify="space-between">
                <Text fontWeight="600">User Authenticated:</Text>
                <Badge colorScheme={session ? 'green' : 'red'}>
                  {session ? `Yes (${session.user?.name})` : 'No'}
                </Badge>
              </HStack>

              <HStack justify="space-between">
                <Text fontWeight="600">Socket ID:</Text>
                <Text fontSize="sm" fontFamily="mono">
                  {socket?.id || 'N/A'}
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Test Controls</Heading>

              <HStack>
                <Button onClick={testConnection} colorScheme="blue">
                  Test Connection
                </Button>
                <Button onClick={testEventJoin} colorScheme="green">
                  Join Test Event
                </Button>
                <Button onClick={testEventLeave} colorScheme="orange">
                  Leave Test Event
                </Button>
                <Button onClick={clearLogs} variant="outline">
                  Clear Logs
                </Button>
              </HStack>

              <Text fontSize="sm" color="gray.600">
                Test Event ID: {testEventId}
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Logs */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Activity Logs</Heading>

              <Box
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={4}
                h="300px"
                overflowY="auto"
                fontFamily="mono"
                fontSize="sm"
              >
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <Text key={index} mb={1} color="gray.700">
                      {log}
                    </Text>
                  ))
                ) : (
                  <Text color="gray.500">No logs yet...</Text>
                )}
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Environment Info */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="600">Testing Information:</Text>
            <Text fontSize="sm">• This page tests Socket.IO connectivity on Vercel</Text>
            <Text fontSize="sm">• Uses polling transport for Vercel compatibility</Text>
            <Text fontSize="sm">• Check browser console for additional debug info</Text>
          </VStack>
        </Alert>
      </VStack>
    </Box>
  );
}