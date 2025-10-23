'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

// Types untuk dashboard data
interface DashboardData {
  events: {
    dashboard: any[];
    member: any[];
    public: any[];
  };
  stats: {
    userStats: {
      approved_count: number;
      pending_count: number;
      rejected_count: number;
    };
    monthlyData: Array<{
      month: string;
      event_count: number;
      participation_count: number;
    }>;
    ranking: Array<{
      id: string;
      name: string;
      instruments: string[];
      participation_count: number;
    }>;
  } | null;
  meta: {
    lastUpdated: string;
    cacheHit: boolean;
  };
}

interface DashboardParams {
  page?: number;
  limit?: number;
  includeStats?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  noCache?: boolean; // Tambah opsi untuk disable cache
}

// API endpoint
const DASHBOARD_API = '/api/dashboard/combine';

// Cache keys untuk React Query
const queryKeys = {
  dashboard: (params: DashboardParams) => ['dashboard', params],
  events: (type: 'dashboard' | 'member' | 'public', page = 1, limit = 10) =>
    ['events', type, page, limit],
  stats: (userId: string) => ['stats', userId],
};

// Hook untuk fetch dashboard data dengan React Query
export function useOptimizedDashboard(params: DashboardParams = {}) {
  const {
    page = 1,
    limit = 10,
    includeStats = true,
    autoRefresh = false,
    refreshInterval = 30000, // 30 detik
    noCache = false // Default false untuk backward compatibility
  } = params;

  const queryClient = useQueryClient();

  // Main dashboard query
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isRefetching,
    isError
  } = useQuery<DashboardData>({
    queryKey: queryKeys.dashboard({ page, limit, includeStats }),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeStats: includeStats.toString(),
        noCache: noCache.toString(), // Tambah parameter noCache
      });

      const response = await fetch(`${DASHBOARD_API}?${searchParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();

      // Log cache hits untuk monitoring
      if (data.meta?.cacheHit && !noCache) {
        console.log('🎯 Cache hit for dashboard data');
      } else if (noCache) {
        console.log('🚫 Cache disabled - fetching fresh data');
      }

      return data;
    },
    staleTime: noCache ? 0 : 2 * 60 * 1000, // No cache jika noCache=true
    gcTime: noCache ? 0 : 5 * 60 * 1000,  // No cache jika noCache=true
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: false, // Disable untuk mobile performance
    retry: (failureCount, error) => {
      // Retry 2 kali untuk network errors
      if (failureCount < 2 && error instanceof Error) {
        return !error.message.includes('404') && !error.message.includes('401');
      }
      return false;
    },
    // Suspense tidak didukung di versi React Query ini

  });

  // Background refresh mutation
  const refreshMutation = useMutation<void, Error, unknown, void>({
    mutationFn: async (forceRefresh = true) => {
      const searchParams = Object.fromEntries([
        ['page', page.toString()],
        ['limit', limit.toString()],
        ['includeStats', includeStats.toString()],
        ['forceRefresh', 'true']
      ]);

      const response = await fetch(`${DASHBOARD_API}?${searchParams}`);

      if (!response.ok) {
        throw new Error(`Failed to refresh dashboard data: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (newData) => {
      // Update cache dengan fresh data
      queryClient.setQueryData(
        queryKeys.dashboard({ page, limit, includeStats }),
        newData
      );

      console.log('🔄 Dashboard data refreshed');
    },
    onError: (error) => {
      console.error('Failed to refresh dashboard:', error);
    },
  });

  // Optimized refresh function
  const refresh = useCallback((forceRefresh = true) => {
    refreshMutation.mutate(forceRefresh);
  }, [refreshMutation]);

  // Invalidate cache untuk data yang spesifik
  const invalidateEvents = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  }, [queryClient]);

  const invalidateStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  }, [queryClient]);

  // Prefetch next page untuk smoother pagination
  const prefetchNextPage = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard({ page: page + 1, limit, includeStats }),
      queryFn: async () => {
        const searchParams = new URLSearchParams({
          page: (page + 1).toString(),
          limit: limit.toString(),
          includeStats: includeStats.toString(),
        });

        const response = await fetch(`${DASHBOARD_API}?${searchParams}`);

        if (!response.ok) {
          throw new Error(`Failed to prefetch dashboard data: ${response.status}`);
        }

        return response.json();
      },
      staleTime: 30 * 1000, // 30 detik untuk prefetched data
    });
  }, [queryClient, page, limit, includeStats]);

  // Auto prefetch next page saat data loading selesai
  useEffect(() => {
    if (!isLoading && !isError && dashboardData?.events?.dashboard && dashboardData.events.dashboard.length >= limit) {
      prefetchNextPage();
    }
  }, [isLoading, isError, dashboardData, limit, prefetchNextPage]);

  // Cleanup cache saat unmount (optional)
  useEffect(() => {
    return () => {
      // Optional: cleanup old cache entries
      // queryClient.removeQueries(['dashboard'], { stale: true });
    };
  }, []);

  return {
    data: dashboardData,
    isLoading,
    isRefetching,
    isError,
    error,
    refresh,
    invalidateEvents,
    invalidateStats,
    prefetchNextPage,
    // Additional helpers
    isRefreshing: refreshMutation.isPending,
    lastUpdated: dashboardData?.meta?.lastUpdated,
    cacheHit: dashboardData?.meta?.cacheHit,
  };
}

// Hook untuk events data spesifik
export function useEvents(type: 'dashboard' | 'member' | 'public', params: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 10 } = params;

  return useQuery({
    queryKey: queryKeys.events(type, page, limit),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        type,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/events?${searchParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} events: ${response.status}`);
      }

      return response.json();
    },
    staleTime: type === 'public' ? 5 * 60 * 1000 : 2 * 60 * 1000, // Public events bisa lebih lama
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Hook untuk user stats
export function useUserStats(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats(userId),
    queryFn: async () => {
      const response = await fetch(`/api/stats/participation`);

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 menit
    gcTime: 15 * 60 * 1000, // 15 menit
    refetchInterval: false, // Manual refresh untuk stats
    enabled: !!userId && enabled,
    refetchOnWindowFocus: false,
  });
}

// Hook untuk real-time updates
export function useRealtimeDashboard(params: DashboardParams = {}) {
  const dashboard = useOptimizedDashboard(params);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Refresh saat kembali online
      dashboard.refresh();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dashboard]);

  return {
    ...dashboard,
    isOnline,
    // Auto refresh saat online kembali
    autoRefresh: isOnline ? dashboard.refresh : () => {},
  };
}

// Export untuk mudah access
export { queryKeys };
export type { DashboardData, DashboardParams };