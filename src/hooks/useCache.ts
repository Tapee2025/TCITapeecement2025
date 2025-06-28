import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
  maxSize?: number; // Maximum size in bytes (approximate)
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
  private maxSize = 10 * 1024 * 1024; // Default 10MB max cache size

  constructor(maxSize?: number) {
    if (maxSize) {
      this.maxSize = maxSize;
    }
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
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

  // Evict oldest entries until we're under maxSize
  private evictOldest(): void {
    // Sort entries by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries until we're under the limit
    for (const [key, entry] of entries) {
      if (this.totalSize <= this.maxSize * 0.8) { // Clear until we're at 80% capacity
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
  const { key, ttl = 5 * 60 * 1000 } = options;
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = memoryCache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetchRef.current();
      memoryCache.set(key, freshData, ttl);
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, ttl]);

  useEffect(() => {
    fetchData();
    
    // Set up automatic cache cleanup
    const cleanupInterval = setInterval(() => {
      // This will trigger cache to check for expired items
      memoryCache.get(key);
    }, ttl);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [key, ttl, fetchData]);

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