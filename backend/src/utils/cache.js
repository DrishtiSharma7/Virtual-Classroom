/**
 * High-performance, zero-dependency in-memory cache with TTL, LRU eviction,
 * and prefix invalidation.
 *
 * Designed to work seamlessly out-of-the-box without requiring external
 * services (like Redis), while maintaining an interface that can easily
 * back onto Redis if configured in the future.
 */

class MemoryCache {
  constructor({ maxItems = 5000, defaultTTL = 60, cleanupIntervalMs = 60000 } = {}) {
    this.store = new Map();
    this.maxItems = maxItems;
    this.defaultTTL = defaultTTL; // in seconds
    this.hits = 0;
    this.misses = 0;

    // Periodic sweep to clean up expired entries without blocking
    if (cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanExpired();
      }, cleanupIntervalMs);

      // Allow Node process to exit without waiting for this interval
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  /**
   * Set a key-value pair in cache with an optional TTL in seconds.
   */
  set(key, value, ttlSeconds = this.defaultTTL) {
    if (!key) return false;

    // Enforce max capacity (LRU: oldest inserted key evicted)
    if (this.store.size >= this.maxItems && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
      }
    }

    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;

    this.store.set(key, {
      value,
      expiresAt,
    });

    return true;
  }

  /**
   * Get a cached value by key. Returns null if expired or missing.
   */
  get(key) {
    if (!key || !this.store.has(key)) {
      this.misses++;
      return null;
    }

    const item = this.store.get(key);

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    // Refresh position for LRU
    this.store.delete(key);
    this.store.set(key, item);

    this.hits++;
    return item.value;
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key from cache.
   */
  del(key) {
    if (!key) return false;
    return this.store.delete(key);
  }

  /**
   * Delete all keys that start with a given prefix.
   * Useful for invalidating resource namespaces (e.g. "dashboard:", "analytics:").
   */
  delPrefix(prefix) {
    if (!prefix) return 0;
    let deletedCount = 0;

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Wrap a function with caching (Cache-Aside pattern).
   * If the key exists, return cached value. Otherwise, execute fetchFn, cache, and return.
   */
  async wrap(key, fetchFn, ttlSeconds = this.defaultTTL) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    if (fresh !== undefined) {
      this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  /**
   * Clear all entries from the cache.
   */
  flush() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Clean expired entries.
   */
  cleanExpired() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get operational cache statistics.
   */
  getStats() {
    return {
      size: this.store.size,
      maxItems: this.maxItems,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses === 0
          ? 0
          : (this.hits / (this.hits + this.misses)).toFixed(2),
    };
  }

  /**
   * Destroy timer on cleanup.
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.store.clear();
  }
}

// Global cache instance
const cache = new MemoryCache();

module.exports = {
  MemoryCache,
  cache,
};
