import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface OptimizedQueryOptions<T> {
  queryKey: string;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number; // Time before data is considered stale
  cacheTime?: number; // Time to keep data in cache
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// Simple in-memory cache
const queryCache = new Map<string, {
  data: any;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
}>();

// Cleanup expired cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of queryCache.entries()) {
    if (now - entry.timestamp > entry.cacheTime) {
      queryCache.delete(key);
    }
  }
}, 60000); // Cleanup every minute

export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  cacheTime = 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus = true,
  refetchInterval,
  onSuccess,
  onError
}: OptimizedQueryOptions<T>): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Check if data is stale
  const checkStale = useCallback(() => {
    const cached = queryCache.get(queryKey);
    if (cached) {
      const isDataStale = Date.now() - cached.timestamp > cached.staleTime;
      setIsStale(isDataStale);
      return isDataStale;
    }
    return true;
  }, [queryKey]);

  // Fetch data function
  const fetchData = useCallback(async (force = false) => {
    if (!enabled || !isMountedRef.current) return;

    // Check cache first
    const cached = queryCache.get(queryKey);
    const now = Date.now();
    
    if (!force && cached && (now - cached.timestamp < cached.staleTime)) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      setIsStale(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      if (!cached) {
        setLoading(true);
      }
      setError(null);

      const result = await queryFn();
      
      if (!isMountedRef.current) return;

      // Cache the result
      queryCache.set(queryKey, {
        data: result,
        timestamp: now,
        staleTime,
        cacheTime
      });

      setData(result);
      setIsStale(false);
      onSuccess?.(result);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      
      // Use cached data if available on error
      if (cached) {
        setData(cached.data);
        setIsStale(true);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [queryKey, queryFn, enabled, staleTime, cacheTime, onSuccess, onError]);

  // Manual refetch
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchData();
        }
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (checkStale()) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, fetchData, checkStale]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    isStale
  };
}