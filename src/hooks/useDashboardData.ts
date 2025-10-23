import { useState, useEffect, useCallback, useRef } from 'react';
import { EventWithPersonnel } from '@/types';

interface DashboardData {
  events: EventWithPersonnel[];
  publishedEvents: EventWithPersonnel[];
  participationStats: any;
  monthlyData: any[];
  loading: boolean;
  error: string | null;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function useCache<T>(key: string, fetcher: () => Promise<T>, ttl: number = CACHE_TTL): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      // Fetch new data
      const result = await fetcher();

      // Handle different response formats (events API now returns {events, pagination})
      let processedResult = result;
      if (result && result.events && Array.isArray(result.events)) {
        processedResult = result.events;
      }

      // Cache the result
      cache.set(key, {
        data: processedResult,
        timestamp: Date.now()
      });

      setData(processedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Cache fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    events: [],
    publishedEvents: [],
    participationStats: null,
    monthlyData: [],
    loading: true,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTime = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple rapid requests
    const now = Date.now();
    if (now - lastFetchTime.current < 1000 && !forceRefresh) {
      console.log('Skipping fetch - too soon');
      return;
    }

    lastFetchTime.current = now;

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      const cacheKey = 'dashboard_data';
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL && !forceRefresh) {
        console.log('📊 Using cached dashboard data');
        setDashboardData(cached.data);
        return;
      }

      console.log('🔄 Fetching fresh dashboard data...');

      // Create parallel fetches with AbortController and timeout
      const fetchWithTimeout = (url: string, timeout = 8000) => {
        return Promise.race([
          fetch(url, {
            signal: abortControllerRef.current?.signal,
            headers: {
              'Cache-Control': 'no-cache',
            }
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const fetchEvents = fetchWithTimeout('/api/events/dashboard').then(res => {
        if (!res.ok) throw new Error(`Dashboard events fetch failed: ${res.status}`);
        return res.json();
      });

      const fetchPublishedEvents = fetchWithTimeout('/api/events/public').then(res => {
        if (!res.ok) throw new Error(`Published events fetch failed: ${res.status}`);
        return res.json();
      });

      const fetchStats = fetchWithTimeout('/api/stats/participation').then(res => {
        if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
        return res.json();
      });

      // Execute all fetches in parallel with individual error handling
      const results = await Promise.allSettled([fetchEvents, fetchPublishedEvents, fetchStats]);

      const [eventsResult, publishedEventsResult, statsResult] = results;

      // Extract successful results or use fallbacks
      const eventsData = eventsResult.status === 'fulfilled' ? eventsResult.value : { events: [] };
      const publishedEventsData = publishedEventsResult.status === 'fulfilled' ? publishedEventsResult.value : { events: [] };
      const statsData = statsResult.status === 'fulfilled' ? statsResult.value : null;

      console.log('API Results:', {
        dashboardEvents: eventsResult.status,
        publicEvents: publishedEventsResult.status,
        stats: statsResult.status,
        statsData: statsData
      });

      // Log stats error if any
      if (statsResult.status === 'rejected') {
        console.error('❌ Stats fetch failed:', statsResult.reason);
      }

      // Handle both array and object formats for events API response
      const eventsArray = Array.isArray(eventsData) ? eventsData : eventsData?.events || [];
      const publishedEventsArray = publishedEventsData?.events || [];

      // Remove duplicates from all events
      const allEvents = Array.from(
        new Map([...eventsArray, ...publishedEventsArray].map(event => [event.id, event])).values()
      );

      // Ensure participationStats is never null
      const defaultStats = {
        user: {
          participations: 0,
          rank: 0,
          isTopPerformer: false
        },
        statistics: {
          totalMembers: 0,
          averageParticipations: 0,
          totalParticipations: 0,
          maxParticipations: 0
        },
        monthlyData: []
      };

      const result: DashboardData = {
        events: eventsArray, // ALL published events from dashboard API (including past events)
        publishedEvents: publishedEventsArray, // Future events from public API (for available events)
        participationStats: statsData || defaultStats,
        monthlyData: statsData?.monthlyData || [],
        loading: false,
        error: null
      };

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      setDashboardData(result);
      console.log('✅ Dashboard data loaded successfully - Events:', {
        totalEvents: eventsArray.length,
        futureEvents: publishedEventsArray.length,
        hasStats: !!statsData
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }

      console.error('Dashboard data fetch error:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDashboardData]);

  const refetch = useCallback(() => {
    // Clear all cache and refetch with force refresh
    cache.clear(); // Clear everything
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Add debounce for rapid refetches
  const debouncedRefetch = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      refetch();
    }, 300);
  }, [refetch]);

  return {
    ...dashboardData,
    refetch,
    debouncedRefetch
  };
}

// Separate hook for calendar data to avoid re-fetching main dashboard data
export function useCalendarData() {
  return useCache('calendar_data', async () => {
    const [eventsResponse, publishedEventsResponse] = await Promise.all([
      fetch('/api/events/member'),
      fetch('/api/events/public')
    ]);

    if (!eventsResponse.ok || !publishedEventsResponse.ok) {
      throw new Error('Failed to fetch calendar data');
    }

    const [eventsData, publishedEventsData] = await Promise.all([
      eventsResponse.json(),
      publishedEventsResponse.json()
    ]);

    return Array.from(
      new Map([...(eventsData || []), ...(publishedEventsData?.events || [])].map(event => [event.id, event])).values()
    );
  });
}