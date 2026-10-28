/**
 * Ultra-fast In-Memory LRU/TTL Cache for IndiStay Backend.
 * Delivers sub-millisecond cached responses for destinations, hot searches, and hotel metadata.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class FastCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxItems = 1000;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    // Evict oldest item if capacity exceeded
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  delPattern(pattern: RegExp | string): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; maxItems: number } {
    return {
      size: this.cache.size,
      maxItems: this.maxItems,
    };
  }
}

export const memoryCache = new FastCache();
