/**
 * Simple in-memory cache for Azure DevOps API responses
 * Reduces API calls and improves performance
 */

class AzureCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTTL = options.ttl || 60000; // Default 1 minute
    this.maxSize = options.maxSize || 100; // Maximum cache entries
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cached value if valid
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Set cache value with TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Clear expired entries
   */
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Generate cache key from parameters
   */
  static generateKey(...args) {
    return JSON.stringify(args);
  }
}

module.exports = AzureCache;