import { Box, VStack, HStack, Skeleton, SkeletonText, SimpleGrid, Text } from '@chakra-ui/react';

export function CalendarSkeleton() {
  return (
    <Box bg="white" borderRadius="lg" border="1px solid #e5e7eb" boxShadow="md" p="6">
      {/* Calendar Header Skeleton */}
      <HStack justify="space-between" align="center" mb="6">
        <Skeleton height="24px" width="120px" />
        <HStack spacing="2">
          <Skeleton height="32px" width="32px" borderRadius="md" />
          <Skeleton height="32px" width="140px" />
          <Skeleton height="32px" width="32px" borderRadius="md" />
        </HStack>
      </HStack>

      {/* Calendar Grid Skeleton */}
      <VStack spacing="1" align="stretch">
        {/* Day Headers */}
        <HStack spacing="1">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
            <Box key={day} flex="1" textAlign="center" py="2">
              <Skeleton height="16px" width="100%" />
            </Box>
          ))}
        </HStack>

        {/* Calendar Days */}
        {Array.from({ length: 5 }).map((_, weekIndex) => (
          <HStack key={weekIndex} spacing="1">
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <Box key={dayIndex} flex="1" aspectRatio="1">
                <Skeleton height="100%" width="100%" borderRadius="md" />
              </Box>
            ))}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

export function StatsCardsSkeleton() {
  return (
    <VStack spacing="4" align="stretch">
      {/* Partisipasi Card Skeleton */}
      <Box bg="white" borderRadius="lg" border="1px solid #e5e7eb" boxShadow="md" p="4">
        <HStack>
          <Skeleton height="48px" width="48px" borderRadius="xl" />
          <VStack align="start" spacing="1" flex="1">
            <Skeleton height="12px" width="80px" />
            <Skeleton height="28px" width="60px" />
            <Skeleton height="14px" width="100px" />
          </VStack>
        </HStack>
      </Box>

      {/* Performa Card Skeleton */}
      <Box bg="white" borderRadius="lg" border="1px solid #e5e7eb" boxShadow="md" p="4">
        <HStack>
          <Skeleton height="48px" width="48px" borderRadius="xl" />
          <VStack align="start" spacing="1" flex="1">
            <Skeleton height="12px" width="80px" />
            <Skeleton height="28px" width="60px" />
          </VStack>
        </HStack>
        <Box mt="3">
          <Skeleton height="6px" width="100%" borderRadius="full" />
        </Box>
      </Box>

      {/* Total Event Card Skeleton */}
      <Box bg="white" borderRadius="lg" border="1px solid #e5e7eb" boxShadow="md" p="4">
        <HStack>
          <Skeleton height="48px" width="48px" borderRadius="xl" />
          <VStack align="start" spacing="1" flex="1">
            <Skeleton height="12px" width="80px" />
            <Skeleton height="28px" width="60px" />
            <Skeleton height="14px" width="120px" />
          </VStack>
        </HStack>
      </Box>
    </VStack>
  );
}

export function EventListSkeleton() {
  return (
    <VStack spacing="4" align="stretch">
      <Box>
        <Skeleton height="24px" width="200px" mb="2" />
        <Skeleton height="16px" width="150px" />
      </Box>

      {/* User Events Skeleton */}
      <Box>
        <Skeleton height="16px" width="120px" mb="3" />
        <VStack spacing="3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Box key={index} bg="#fef3c7" border="1px solid #f59e0b" borderRadius="lg" p="4">
              <HStack justify="space-between">
                <VStack align="start" spacing="2" flex="1">
                  <HStack>
                    <Skeleton height="16px" width="16px" />
                    <Skeleton height="18px" width="150px" />
                    <Skeleton height="20px" width="60px" borderRadius="md" />
                  </HStack>
                  <HStack spacing="4">
                    <Skeleton height="14px" width="80px" />
                    <Skeleton height="14px" width="60px" />
                  </HStack>
                </VStack>
                <Skeleton height="28px" width="60px" borderRadius="md" />
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Available Events Skeleton */}
      <Box>
        <Skeleton height="16px" width="120px" mb="3" />
        <VStack spacing="3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Box key={index} bg="#f0fdf4" border="1px solid #10b981" borderRadius="lg" p="4">
              <HStack justify="space-between">
                <VStack align="start" spacing="2" flex="1">
                  <HStack>
                    <Skeleton height="16px" width="16px" />
                    <Skeleton height="18px" width="150px" />
                    <Skeleton height="20px" width="60px" borderRadius="md" />
                  </HStack>
                  <HStack spacing="4">
                    <Skeleton height="14px" width="80px" />
                    <Skeleton height="14px" width="60px" />
                  </HStack>
                </VStack>
                <Skeleton height="28px" width="80px" borderRadius="md" />
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}

// Full page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <Box minH="100vh" bg="#f9fafb">
      {/* Header Skeleton */}
      <Box bg="white" borderBottom="1px solid #e5e7eb" p="4">
        <HStack justify="space-between">
          <Skeleton height="32px" width="200px" />
          <HStack spacing="3">
            <Skeleton height="32px" width="32px" borderRadius="full" />
            <Skeleton height="24px" width="100px" />
          </HStack>
        </HStack>
      </Box>

      {/* Sidebar + Content Layout */}
      <HStack>
        {/* Sidebar Skeleton */}
        <Box w="280px" bg="white" borderRight="1px solid #e5e7eb" p="4">
          <VStack align="start" spacing="4">
            <Skeleton height="24px" width="120px" />
            <VStack align="start" spacing="2" w="full">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} height="36px" width="100%" borderRadius="md" />
              ))}
            </VStack>
          </VStack>
        </Box>

        {/* Main Content Skeleton */}
        <Box flex="1" p="8">
          <VStack spacing="6" align="stretch">
            {/* Page Title Skeleton */}
            <HStack justify="space-between">
              <VStack align="start" spacing="1">
                <Skeleton height="32px" width="250px" />
                <Skeleton height="20px" width="300px" />
              </VStack>
              <Skeleton height="36px" width="120px" borderRadius="md" />
            </HStack>

            {/* Alert/Info Skeleton */}
            <Box bg="white" borderRadius="md" p="4" border="1px solid #e5e7eb">
              <HStack>
                <Skeleton height="20px" width="20px" borderRadius="full" />
                <VStack align="start" spacing="1" flex="1">
                  <Skeleton height="18px" width="200px" />
                  <Skeleton height="16px" width="400px" />
                </VStack>
              </HStack>
            </Box>

            {/* Content Grid Skeleton */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing="6">
              <StatsCardsSkeleton />
            </SimpleGrid>

            {/* Main Content Area Skeleton */}
            <HStack align="start" spacing="6">
              <Box flex="0 0 70%">
                <CalendarSkeleton />
              </Box>
              <Box flex="0 0 30%">
                <StatsCardsSkeleton />
              </Box>
            </HStack>
          </VStack>
        </Box>
      </HStack>
    </Box>
  );
}

// Quick loading overlay for transitions
export function LoadingOverlay({ message = "Memuat..." }: { message?: string }) {
  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(255, 255, 255, 0.9)"
      backdropFilter="blur(4px)"
      zIndex="9999"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      gap="4"
    >
      <Box
        w="60px"
        h="60px"
        border="4px solid #e5e7eb"
        borderTop="4px solid #3b82f6"
        borderRadius="50%"
        animation="spin 1s linear infinite"
      />
      <Text fontSize="lg" color="#4b5563" fontWeight="500">
        {message}
      </Text>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}