/**
 * Client-side caching system with TTL and storage management
 */

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.storagePrefix = 'dea_cache_';
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxMemoryItems = 100;
    
    this.setupCleanup();
  }

  /**
   * Get item from cache (memory first, then localStorage)
   */
  get(key) {
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data;
    }

    // Try localStorage
    try {
      const storageKey = this.storagePrefix + key;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const item = JSON.parse(stored);
        if (!this.isExpired(item)) {
          // Promote to memory cache
          this.memoryCache.set(key, item);
          return item.data;
        } else {
          // Clean up expired item
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }

    return null;
  }

  /**
   * Set item in cache with TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory
    this.memoryCache.set(key, item);
    this.enforceMemoryLimit();

    // Store in localStorage for persistence
    try {
      const storageKey = this.storagePrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(item));
    } catch (e) {
      // Handle quota exceeded
      if (e.name === 'QuotaExceededError') {
        this.clearOldestFromStorage();
        try {
          localStorage.setItem(storageKey, JSON.stringify(item));
        } catch (e2) {
          console.warn('Unable to cache to localStorage:', e2);
        }
      }
    }
  }

  /**
   * Remove item from cache
   */
  delete(key) {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(this.storagePrefix + key);
    } catch (e) {
      console.warn('Cache delete error:', e);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
  }

  /**
   * Get or set pattern - fetch if not cached
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.warn(`Failed to fetch data for cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if item is expired
   */
  isExpired(item) {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Enforce memory cache size limit
   */
  enforceMemoryLimit() {
    if (this.memoryCache.size > this.maxMemoryItems) {
      // Remove oldest items (simple LRU)
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.maxMemoryItems);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  /**
   * Clear oldest items from localStorage when quota exceeded
   */
  clearOldestFromStorage() {
    try {
      const cacheItems = [];
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            cacheItems.push({ key, timestamp: item.timestamp });
          } catch (e) {
            // Remove corrupted items
            localStorage.removeItem(key);
          }
        }
      });

      // Sort by timestamp and remove oldest 25%
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = cacheItems.slice(0, Math.ceil(cacheItems.length * 0.25));
      
      toRemove.forEach(({ key }) => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Error clearing old cache items:', e);
    }
  }

  /**
   * Setup periodic cleanup
   */
  setupCleanup() {
    // Clean expired items every 10 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 10 * 60 * 1000);
  }

  /**
   * Remove expired items from both caches
   */
  cleanupExpired() {
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (this.isExpired(item)) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Remove corrupted items
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      console.warn('Error during cache cleanup:', e);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    let storageSize = 0;
    let storageBytes = 0;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          storageSize++;
          storageBytes += localStorage.getItem(key).length;
        }
      });
    } catch (e) {
      console.warn('Error calculating cache stats:', e);
    }

    return {
      memory: {
        items: memorySize,
        maxItems: this.maxMemoryItems
      },
      storage: {
        items: storageSize,
        estimatedBytes: storageBytes
      }
    };
  }
}

// Create global cache instance
export const cache = new CacheManager();

// Utility functions for common caching patterns
export const cacheAPI = (url, options = {}) => {
  const key = `api_${url}_${JSON.stringify(options)}`;
  return cache.getOrSet(key, () => fetch(url, options).then(r => r.json()));
};

export const cacheImage = (url) => {
  const key = `img_${url}`;
  return cache.getOrSet(key, () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  }, 30 * 60 * 1000); // Cache images for 30 minutes
};