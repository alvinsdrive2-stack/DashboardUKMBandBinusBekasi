import { useState, useEffect, useCallback } from 'react';
import { EventWithPersonnel } from '@/types';

interface SimpleDashboardData {
  events: EventWithPersonnel[];
  publishedEvents: EventWithPersonnel[];
  participationStats: any;
  loading: boolean;
  error: string | null;
}

export function useSimpleDashboardData() {
  const [data, setData] = useState<SimpleDashboardData>({
    events: [],
    publishedEvents: [],
    participationStats: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔄 Fetching simple dashboard data...');

      // Simple parallel fetch like available-events and schedule
      const [eventsRes, publishedEventsRes, statsRes] = await Promise.all([
        fetch('/api/events/member'),
        fetch('/api/events/public'),
        fetch('/api/stats/participation')
      ]);

      // Handle each response individually
      let eventsData = { events: [] };
      let publishedEventsData = { events: [] };
      let statsData = null;

      if (eventsRes.ok) {
        eventsData = await eventsRes.json();
      }

      if (publishedEventsRes.ok) {
        publishedEventsData = await publishedEventsRes.json();
      }

      if (statsRes.ok) {
        statsData = await statsRes.json();
      }

      const eventsArray = Array.isArray(eventsData) ? eventsData : eventsData?.events || [];
      const publishedEventsArray = publishedEventsData?.events || [];

      // Default stats if null
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

      setData({
        events: eventsArray,
        publishedEvents: publishedEventsArray,
        participationStats: statsData || defaultStats,
        loading: false,
        error: null
      });

      console.log('✅ Simple dashboard data loaded');

    } catch (error) {
      console.error('Simple dashboard fetch error:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    refetch: fetchData
  };
}