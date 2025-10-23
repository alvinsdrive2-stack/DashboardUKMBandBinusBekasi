import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/LoadingSkeleton';

interface PageTransitionState {
  isLoading: boolean;
  message: string;
  progress: number;
}

export function usePageTransition() {
  const [transition, setTransition] = useState<PageTransitionState>({
    isLoading: false,
    message: 'Memuat...',
    progress: 0
  });

  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTransition = useCallback((message: string = 'Memuat...') => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setTransition({ isLoading: true, message, progress: 0 });

    // Simulate progress
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 90) {
        progress = 90;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
      setTransition(prev => ({ ...prev, progress: Math.min(progress, 90) }));
    }, 200);

    // Auto-hide after max 10 seconds
    timeoutRef.current = setTimeout(() => {
      completeTransition();
    }, 10000);
  }, []);

  const completeTransition = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setTransition(prev => ({ ...prev, progress: 100 }));

    setTimeout(() => {
      setTransition({ isLoading: false, message: 'Memuat...', progress: 0 });
    }, 300);
  }, []);

  const navigateWithTransition = useCallback((path: string, message?: string) => {
    startTransition(message || 'Memuat halaman...');
    router.push(path);

    // Complete transition after a short delay to allow page to start loading
    setTimeout(() => {
      completeTransition();
    }, 500);
  }, [router, startTransition, completeTransition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const TransitionOverlay = () => {
    if (!transition.isLoading) return null;

    return (
      <LoadingOverlay message={transition.message} />
    );
  };

  return {
    startTransition,
    completeTransition,
    navigateWithTransition,
    TransitionOverlay,
    isLoading: transition.isLoading
  };
}

// Hook for smart preloading
export function useSmartPreload() {
  const [preloadedData, setPreloadedData] = useState<Map<string, any>>(new Map());
  const preloadTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const preloadData = useCallback(async (url: string, cacheKey: string, delay: number = 100) => {
    // Skip if already cached or preloading
    if (preloadedData.has(cacheKey)) {
      return preloadedData.get(cacheKey);
    }

    // Clear existing timeout for this cache key
    const existingTimeout = preloadTimeoutRef.current.get(cacheKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for preloading
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPreloadedData(prev => new Map(prev.set(cacheKey, data)));
          console.log(`🚀 Preloaded data for ${cacheKey}`);
        }
      } catch (error) {
        console.warn(`Failed to preload ${cacheKey}:`, error);
      }
    }, delay);

    preloadTimeoutRef.current.set(cacheKey, timeout);
  }, []);

  const getPreloadedData = useCallback((cacheKey: string) => {
    return preloadedData.get(cacheKey);
  }, [preloadedData]);

  const clearPreloadedData = useCallback((cacheKey?: string) => {
    if (cacheKey) {
      setPreloadedData(prev => {
        const newMap = new Map(prev);
        newMap.delete(cacheKey);
        return newMap;
      });

      const timeout = preloadTimeoutRef.current.get(cacheKey);
      if (timeout) {
        clearTimeout(timeout);
        preloadTimeoutRef.current.delete(cacheKey);
      }
    } else {
      // Clear all
      setPreloadedData(new Map());
      preloadTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      preloadTimeoutRef.current.clear();
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup all timeouts on unmount
      preloadTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    preloadData,
    getPreloadedData,
    clearPreloadedData
  };
}