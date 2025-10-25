import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ManagerStats {
  totalEvents: number;
  totalMembers: number;
  upcomingEvents: number;
  finishedEvents: number;
  activeMembers: number;
}

export function useManagerStats() {
  const [stats, setStats] = useState<ManagerStats>({
    totalEvents: 0,
    totalMembers: 0,
    upcomingEvents: 0,
    finishedEvents: 0,
    activeMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/manager/stats');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching manager stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Fallback to default values on error
      setStats({
        totalEvents: 0,
        totalMembers: 0,
        upcomingEvents: 0,
        finishedEvents: 0,
        activeMembers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is authenticated and is a manager
    if (session?.user?.organizationLvl &&
        ['COMMISSIONER', 'PENGURUS'].includes(session.user.organizationLvl)) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [session]);

  return { stats, loading, error, refetch: fetchStats };
}