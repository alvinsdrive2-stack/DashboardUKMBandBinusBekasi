import { Redis } from '@upstash/redis';
import { LRUCache } from 'lru-cache';

// Fallback in-memory cache jika Redis tidak tersedia
class MemoryCache {
  private cache: LRUCache<string, any>;

  constructor(options: { maxSize: number; ttl: number }) {
    this.cache = new LRUCache({
      max: options.maxSize,
      ttl: options.ttl * 1000, // LRU cache expects milliseconds
      allowStale: true,
      updateAgeOnGet: true,
    });
  }

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    this.cache.set(key, value, { ttl: ttl * 1000 });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) count++;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async size(): Promise<number> {
    return this.cache.size;
  }
}

// Redis cache implementation
class RedisCache {
  private redis: Redis;

  constructor() {
    // Check if Redis environment variables are available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      throw new Error('Redis configuration not found');
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), { ex: ttl });
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;
      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Redis deleteMultiple error:', error);
      return 0;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await this.redis.keys(pattern);
      return keys;
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis has error:', error);
      return false;
    }
  }

  async size(): Promise<number> {
    try {
      const result = await this.redis.dbsize();
      return result;
    } catch (error) {
      console.error('Redis size error:', error);
      return 0;
    }
  }
}

// Unified cache interface
interface CacheInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  deleteMultiple(keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  size(): Promise<number>;
}

// Cache manager yang otomatis memilih antara Redis atau Memory
class CacheManager implements CacheInterface {
  private cache: CacheInterface;
  private isRedis: boolean;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  constructor() {
    try {
      this.cache = new RedisCache();
      this.isRedis = true;
      console.log('✅ Redis cache initialized');
    } catch (error) {
      console.warn('⚠️ Redis not available, using memory cache:', error);
      this.cache = new MemoryCache({ maxSize: 1000, ttl: 300 }); // 1000 items, 5 menit TTL
      this.isRedis = false;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.cache.get(key);
      if (value !== null) {
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }
      return value;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
      this.stats.sets++;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.cache.delete(key);
      if (result) this.stats.deletes++;
      return result;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    try {
      const result = await this.cache.deleteMultiple(keys);
      this.stats.deletes += result;
      return result;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache deleteMultiple error:', error);
      return 0;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.cache.keys(pattern);
    } catch (error) {
      this.stats.errors++;
      console.error('Cache keys error:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cache.clear();
      // Reset stats
      this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };
    } catch (error) {
      this.stats.errors++;
      console.error('Cache clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return await this.cache.has(key);
    } catch (error) {
      this.stats.errors++;
      console.error('Cache has error:', error);
      return false;
    }
  }

  async size(): Promise<number> {
    try {
      return await this.cache.size();
    } catch (error) {
      this.stats.errors++;
      console.error('Cache size error:', error);
      return 0;
    }
  }

  // Additional methods
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      backend: this.isRedis ? 'Redis' : 'Memory'
    };
  }

  getType() {
    return this.isRedis ? 'Redis' : 'Memory';
  }

  // Cache warming untuk data yang sering diakses
  async warmUp(keys: Array<{ key: string; fetcher: () => Promise<any>; ttl: number }>) {
    console.log(`🔥 Warming up ${keys.length} cache entries...`);

    const promises = keys.map(async ({ key, fetcher, ttl }) => {
      try {
        const exists = await this.has(key);
        if (!exists) {
          const data = await fetcher();
          await this.set(key, data, ttl);
        }
      } catch (error) {
        console.error(`Failed to warm up cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('✅ Cache warming completed');
  }

  // Smart cache invalidation based on patterns
  async invalidatePattern(patterns: string[]) {
    console.log(`🗑️ Invalidating cache patterns:`, patterns);

    const allKeys: string[] = [];
    for (const pattern of patterns) {
      const keys = await this.keys(pattern);
      allKeys.push(...keys);
    }

    // Remove duplicates
    const uniqueKeys = Array.from(new Set(allKeys));

    if (uniqueKeys.length > 0) {
      const deletedCount = await this.deleteMultiple(uniqueKeys);
      console.log(`🗑️ Invalidated ${deletedCount} cache entries`);
      return deletedCount;
    }

    return 0;
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Export types and utilities
export type { CacheInterface };
export { MemoryCache, RedisCache };

// Helper functions for common cache operations
export const cacheKeys = {
  dashboard: (userId?: string, page = 1, limit = 10) =>
    `dashboard:${userId || 'public'}:${page}:${limit}`,

  events: (type: 'dashboard' | 'member' | 'public', userId?: string, page = 1, limit = 10) =>
    `events:${type}:${userId || 'public'}:${page}:${limit}`,

  stats: (userId: string) => `stats:${userId}`,

  user: (userId: string) => `user:${userId}`,

  event: (eventId: string) => `event:${eventId}`,

  personnel: (eventId: string, userId?: string) =>
    `personnel:${eventId}${userId ? `:${userId}` : ''}`
};

export const cacheTTL = {
  short: 60,      // 1 menit
  medium: 300,    // 5 menit
  long: 1800,     // 30 menit
  daily: 86400    // 24 jam
};

// React hook untuk cache operations
export function useCache() {
  return {
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    delete: cache.delete.bind(cache),
    invalidatePattern: cache.invalidatePattern.bind(cache),
    getStats: cache.getStats.bind(cache),
    getType: cache.getType.bind(cache)
  };
}