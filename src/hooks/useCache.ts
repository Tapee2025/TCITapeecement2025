import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
  maxSize?: number; // Maximum size in bytes (approximate)
  enabled?: boolean; // Allow disabling cache
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number; // Approximate size in bytes
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private totalSize = 0;
  private maxSize = 5 * 1024 * 1024; // Default 5MB max cache size

  constructor(maxSize?: number) {
    if (maxSize) {
      this.maxSize = maxSize;
    }
  }

  set<T>(key: string, data: T, ttl: number = 3 * 60 * 1000): void {
    // Don't cache if data is null or undefined
    if (data === null || data === undefined) {
      return;
    }

    // Remove old entry if it exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.totalSize -= oldEntry.size;
      this.cache.delete(key);
    }

    // Estimate size of data (rough approximation)
    const size = this.estimateSize(data);
    
    // If this single item is too large, don't cache it
    if (size > this.maxSize) {
      console.warn(`Cache item ${key} is too large (${size} bytes) and won't be cached`);
      return;
    }
    
    // If adding this would exceed max size, clear some space
    if (this.totalSize + size > this.maxSize) {
      this.evictOldest();
    }

    // Add to cache
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      size
    });
    
    this.totalSize += size;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.totalSize -= entry.size;
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  delete(key: string): void {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      this.totalSize -= entry.size;
      this.cache.delete(key);
    }
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.totalSize -= entry.size;
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Evict oldest entries until we're under maxSize
  private evictOldest(): void {
    // Sort entries by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries until we're under the limit
    for (const [key, entry] of entries) {
      if (this.totalSize <= this.maxSize * 0.7) { // Clear until we're at 70% capacity
        break;
      }
      this.totalSize -= entry.size;
      this.cache.delete(key);
    }
  }

  // Estimate size of data in bytes (rough approximation)
  private estimateSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // Rough estimate: 2 bytes per character
    } catch (e) {
      return 1000; // Default size if we can't stringify
    }
  }
}

const memoryCache = new MemoryCache();

export function useCache<T>(
  fetchFn: () => Promise<T>,
  options: CacheOptions
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { key, ttl = 5 * 60 * 1000, enabled = true } = options;
  const fetchRef = useRef(fetchFn);
  const abortControllerRef = useRef<AbortController | null>(null);
  fetchRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);

      // Check cache first if enabled
      if (enabled) {
        const cachedData = memoryCache.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
      });
      
      const fetchPromise = fetchRef.current();
      
      const freshData = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      // Cache the data if enabled and valid
      if (enabled && freshData !== null && freshData !== undefined) {
        memoryCache.set(key, freshData, ttl);
      }
      
      setData(freshData);
    } catch (err) {
      // Don't set error if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      // Check if we have cached data to fall back to
      if (enabled) {
        const cachedData = memoryCache.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          console.warn('Using cached data due to fetch error:', err);
          return;
        }
      }
      
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [key, ttl, enabled]);

  // Cleanup function
  useEffect(() => {
    return () => {
      // Cancel any ongoing request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    // Only fetch if enabled
    if (enabled) {
      fetchData();
    } else {
      setLoading(false);
    }
    
    // Set up automatic cache cleanup only if enabled
    if (enabled) {
      const cleanupInterval = setInterval(() => {
        // This will trigger cache to check for expired items
        memoryCache.get(key);
      }, ttl);
      
      return () => {
        clearInterval(cleanupInterval);
      };
    }
  }, [key, ttl, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Function to clear all cache
export function clearCache() {
  memoryCache.clear();
}

export { memoryCache };