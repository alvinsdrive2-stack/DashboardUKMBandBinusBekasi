import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

// Types for manager data
export interface ManagerEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string;
  status: string;
  personnel: Array<{
    id: string;
    role: string;
    status: string;
    user?: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerSong {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  duration: string | null;
  notes: string | null;
  order: number;
  eventId: string;
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    status: string;
  };
}

export interface ManagerMember {
  id: string;
  name: string;
  email: string;
  instruments: string[];
  organizationLvl: string;
  stats: {
    totalParticipations: number;
    approvedParticipations: number;
    pendingParticipations: number;
    rejectedParticipations: number;
    upcomingEvents: number;
  };
  participations: Array<{
    id: string;
    role: string;
    status: string;
    event: {
      id: string;
      title: string;
      date: string;
      location: string;
      status: string;
    };
  }>;
}

// Fetcher functions
async function fetchManagerEvents(): Promise<ManagerEvent[]> {
  const response = await fetch('/api/events/manager');
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

async function fetchManagerSongs(eventId?: string): Promise<ManagerSong[]> {
  const url = eventId ? `/api/songs/manager?eventId=${eventId}` : '/api/songs/manager';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch songs');
  }
  return response.json();
}

async function fetchManagerMembers(level?: string, active?: string): Promise<ManagerMember[]> {
  const params = new URLSearchParams();
  if (level && level !== 'all') params.append('level', level);
  if (active) params.append('active', active);

  const response = await fetch(`/api/members/manager?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }
  return response.json();
}

// Hooks
export function useManagerEvents() {
  const queryClient = useQueryClient();

  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['manager-events'],
    queryFn: fetchManagerEvents,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoized computed values
  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter(e => e.status === 'PUBLISHED').length;
    const finished = events.filter(e => e.status === 'FINISHED').length;
    const upcoming = events.filter(e =>
      e.status === 'PUBLISHED' && new Date(e.date) > new Date()
    ).length;

    return { total, published, finished, upcoming };
  }, [events]);

  const publishedEvents = useMemo(() =>
    events.filter(e => e.status === 'PUBLISHED'),
    [events]
  );

  // Invalidate related data
  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: ['manager-events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-combine'] });
  };

  return {
    events,
    stats,
    publishedEvents,
    isLoading,
    error,
    refetch,
    invalidateEvents,
  };
}

export function useManagerSongs(eventId?: string) {
  const queryClient = useQueryClient();

  const {
    data: songs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['manager-songs', eventId],
    queryFn: () => fetchManagerSongs(eventId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Invalidate related data
  const invalidateSongs = () => {
    queryClient.invalidateQueries({ queryKey: ['manager-songs'] });
  };

  return {
    songs,
    isLoading,
    error,
    refetch,
    invalidateSongs,
  };
}

export function useManagerMembers(level?: string, active?: string) {
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['manager-members', level, active],
    queryFn: () => fetchManagerMembers(level, active),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Memoized computed values
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.stats.upcomingEvents > 0).length;
    const totalParticipations = members.reduce((sum, m) => sum + m.stats.totalParticipations, 0);
    const avgParticipations = total > 0 ? Math.round(totalParticipations / total * 10) / 10 : 0;

    return { total, active, totalParticipations, avgParticipations };
  }, [members]);

  // Invalidate related data
  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: ['manager-members'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-combine'] });
  };

  return {
    members,
    stats,
    isLoading,
    error,
    refetch,
    invalidateMembers,
  };
}

// Utility hook for combined manager dashboard data
export function useManagerDashboard() {
  const {
    events,
    stats: eventStats,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useManagerEvents();

  const {
    members,
    stats: memberStats,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useManagerMembers();

  const {
    songs,
    isLoading: songsLoading,
    error: songsError,
    refetch: refetchSongs,
  } = useManagerSongs();

  // Combined loading state
  const isLoading = eventsLoading || membersLoading || songsLoading;

  // Combined error state
  const error = eventsError || membersError || songsError;

  // Refetch all data
  const refetchAll = () => {
    refetchEvents();
    refetchMembers();
    refetchSongs();
  };

  return {
    events,
    members,
    songs,
    eventStats,
    memberStats,
    isLoading,
    error,
    refetchAll,
  };
}