'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchParamsHandlerProps {
  events: any[];
  contentLoading: boolean;
  openEventDetail: (registration: any) => void;
}

export default function SearchParamsHandler({
  events,
  contentLoading,
  openEventDetail
}: SearchParamsHandlerProps) {
  const searchParams = useSearchParams();

  // Handle query parameters for auto-opening modal
  useEffect(() => {
    if (events.length > 0 && !contentLoading) {
      const shouldOpenModal = searchParams.get('modal') === 'open';
      const targetEventId = searchParams.get('eventId');

      if (shouldOpenModal && targetEventId) {
        const registration = events.find(reg => reg.eventId === targetEventId);
        if (registration) {
          openEventDetail(registration);
          // Clean up URL parameters after opening modal
          const url = new URL(window.location.href);
          url.searchParams.delete('modal');
          url.searchParams.delete('eventId');
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [events, contentLoading, searchParams, openEventDetail]);

  return null; // This component doesn't render anything
}