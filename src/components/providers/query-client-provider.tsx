'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

interface QueryClientProviderProps {
  children: ReactNode;
}

export function QueryClientProviderWrapper({ children }: QueryClientProviderProps) {
  // Create a client dengan konfigurasi optimasi
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache time: 10 menit
            staleTime: 5 * 60 * 1000, // 5 menit
            cacheTime: 10 * 60 * 1000, // 10 menit
            retry: (failureCount, error) => {
              // Retry 2 kali untuk network errors
              if (failureCount < 2 && error instanceof Error) {
                return !error.message.includes('404') && !error.message.includes('401');
              }
              return false;
            },
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false, // Tidak refetch saat window focus untuk mobile friendly
            refetchOnReconnect: true, // Refetch saat reconnect
            refetchOnMount: true, // Refetch saat component mount
            // Background refetching untuk data aktual
            refetchInterval: false, // Tidak auto refetch untuk efficiency
            // Error boundary handling
            useErrorBoundary: false, // Handle error di component level
            // Suspense mode untuk better loading states
            suspense: false,
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
            // Optimistic updates akan diimplementasi di mutation level
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        position="bottom-right"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}

// Export hook untuk mudah access query client
export function useQueryClient() {
  const { useQuery: useTanStackQuery, useMutation: useTanStackMutation, useQueryClient } = require('@tanstack/react-query');

  return {
    useQuery: useTanStackQuery,
    useMutation: useTanStackMutation,
    useQueryClient: useQueryClient,
  };
}