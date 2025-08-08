import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AutoRefreshOptions {
  interval?: number; // in milliseconds
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  dependencies?: any[];
}

export function useAutoRefresh({
  interval = 30000, // 30 seconds default
  onRefresh,
  enabled = true,
  dependencies = []
}: AutoRefreshOptions) {
  const { currentUser } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);
  const lastRefreshRef = useRef(Date.now());

  // Track if page is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      
      // If page becomes visible and it's been more than the interval since last refresh
      if (!document.hidden && Date.now() - lastRefreshRef.current > interval) {
        onRefresh();
        lastRefreshRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [interval, onRefresh]);

  // Auto refresh logic
  useEffect(() => {
    if (!enabled || !currentUser) return;

    const startAutoRefresh = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        // Only refresh if page is visible and user is active
        if (isActiveRef.current) {
          onRefresh();
          lastRefreshRef.current = Date.now();
        }
      }, interval);
    };

    startAutoRefresh();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, currentUser, interval, onRefresh, ...dependencies]);

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    await onRefresh();
    lastRefreshRef.current = Date.now();
  }, [onRefresh]);

  return { manualRefresh };
}