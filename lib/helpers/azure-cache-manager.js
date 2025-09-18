#!/usr/bin/env node
/**
 * Azure DevOps Intelligent Cache Manager
 * Implements smart caching with preloading and predictive fetching
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CacheManager {
    constructor(options = {}) {
        this.cacheDir = options.cacheDir || path.join(process.cwd(), '.claude', 'azure', 'cache');
        this.maxAge = options.maxAge || 3600000; // 1 hour default
        this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
        this.preloadPatterns = new Map();
        this.accessLog = new Map();
    }

    /**
     * Initialize cache directory
     */
    async init() {
        await fs.mkdir(this.cacheDir, { recursive: true });
        await fs.mkdir(path.join(this.cacheDir, 'workitems'), { recursive: true });
        await fs.mkdir(path.join(this.cacheDir, 'queries'), { recursive: true });
        await fs.mkdir(path.join(this.cacheDir, 'metadata'), { recursive: true });
        await this.loadAccessLog();
    }

    /**
     * Get cached item with intelligent preloading
     */
    async get(key, category = 'general') {
        const filePath = this.getCachePath(key, category);

        try {
            const stats = await fs.stat(filePath);
            const age = Date.now() - stats.mtime.getTime();

            if (age > this.maxAge) {
                await fs.unlink(filePath).catch(() => {});
                return null;
            }

            const data = await fs.readFile(filePath, 'utf8');

            // Track access for intelligent preloading
            this.trackAccess(key, category);

            // Trigger preloading if patterns detected
            this.triggerPreload(key, category);

            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    /**
     * Set cache item
     */
    async set(key, value, category = 'general', ttl = null) {
        const filePath = this.getCachePath(key, category);

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(value, null, 2));

        if (ttl) {
            // Store TTL metadata
            const metaPath = path.join(this.cacheDir, 'metadata', `${key}.meta`);
            await fs.writeFile(metaPath, JSON.stringify({ ttl, created: Date.now() }));
        }

        // Cleanup if cache size exceeded
        await this.enforceSize();
    }

    /**
     * Intelligent preloading based on access patterns
     */
    async preload(items, fetcher, category = 'workitems') {
        const uncached = [];
        const cached = [];

        // Check what's already cached
        for (const item of items) {
            const key = typeof item === 'object' ? item.id : item;
            const cachedItem = await this.get(key, category);

            if (cachedItem) {
                cached.push(cachedItem);
            } else {
                uncached.push(item);
            }
        }

        // Fetch uncached items in parallel
        if (uncached.length > 0 && fetcher) {
            const freshData = await fetcher(uncached);

            // Cache the fresh data
            for (let i = 0; i < freshData.length; i++) {
                if (freshData[i]) {
                    const key = typeof uncached[i] === 'object' ? uncached[i].id : uncached[i];
                    await this.set(key, freshData[i], category);
                    cached.push(freshData[i]);
                }
            }
        }

        return cached;
    }

    /**
     * Track access patterns for intelligent preloading
     * @private
     */
    trackAccess(key, category) {
        const accessKey = `${category}:${key}`;
        const accesses = this.accessLog.get(accessKey) || [];
        accesses.push(Date.now());

        // Keep only recent accesses (last 24 hours)
        const cutoff = Date.now() - 86400000;
        const recentAccesses = accesses.filter(time => time > cutoff);

        this.accessLog.set(accessKey, recentAccesses);
    }

    /**
     * Trigger preloading based on patterns
     * @private
     */
    async triggerPreload(key, category) {
        // Detect sequential access patterns
        if (category === 'workitems' && /^\d+$/.test(key)) {
            const id = parseInt(key);
            const related = [];

            // Preload adjacent items
            for (let i = id - 2; i <= id + 2; i++) {
                if (i !== id && i > 0) {
                    related.push(i.toString());
                }
            }

            // Preload in background
            setImmediate(async () => {
                for (const relatedId of related) {
                    const cached = await this.get(relatedId, category);
                    if (!cached) {
                        // Mark for background fetch
                        this.preloadPatterns.set(relatedId, Date.now());
                    }
                }
            });
        }
    }

    /**
     * Get cache path for key
     * @private
     */
    getCachePath(key, category) {
        const hashedKey = crypto.createHash('md5').update(key).digest('hex');
        return path.join(this.cacheDir, category, `${hashedKey}.json`);
    }

    /**
     * Enforce cache size limit
     * @private
     */
    async enforceSize() {
        try {
            const files = await this.getAllCacheFiles();
            let totalSize = 0;
            const fileStats = [];

            for (const file of files) {
                const stats = await fs.stat(file);
                totalSize += stats.size;
                fileStats.push({ path: file, size: stats.size, mtime: stats.mtime });
            }

            if (totalSize > this.maxSize) {
                // Sort by modification time (oldest first)
                fileStats.sort((a, b) => a.mtime - b.mtime);

                // Remove oldest files until under limit
                for (const file of fileStats) {
                    if (totalSize <= this.maxSize) break;

                    await fs.unlink(file.path).catch(() => {});
                    totalSize -= file.size;
                }
            }
        } catch (error) {
            console.error('Cache cleanup error:', error.message);
        }
    }

    /**
     * Get all cache files
     * @private
     */
    async getAllCacheFiles() {
        const files = [];
        const categories = ['workitems', 'queries', 'general'];

        for (const category of categories) {
            const dir = path.join(this.cacheDir, category);
            try {
                const entries = await fs.readdir(dir);
                files.push(...entries.map(f => path.join(dir, f)));
            } catch {}
        }

        return files;
    }

    /**
     * Load access log from disk
     * @private
     */
    async loadAccessLog() {
        const logPath = path.join(this.cacheDir, 'metadata', 'access.log');
        try {
            const data = await fs.readFile(logPath, 'utf8');
            this.accessLog = new Map(JSON.parse(data));
        } catch {}
    }

    /**
     * Save access log to disk
     */
    async saveAccessLog() {
        const logPath = path.join(this.cacheDir, 'metadata', 'access.log');
        await fs.mkdir(path.dirname(logPath), { recursive: true });
        await fs.writeFile(logPath, JSON.stringify([...this.accessLog]));
    }

    /**
     * Clear all cache
     */
    async clear() {
        await fs.rm(this.cacheDir, { recursive: true, force: true });
        await this.init();
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        const files = await this.getAllCacheFiles();
        let totalSize = 0;
        let totalFiles = files.length;
        let oldestFile = null;
        let newestFile = null;

        for (const file of files) {
            try {
                const stats = await fs.stat(file);
                totalSize += stats.size;

                if (!oldestFile || stats.mtime < oldestFile.mtime) {
                    oldestFile = { path: file, mtime: stats.mtime };
                }

                if (!newestFile || stats.mtime > newestFile.mtime) {
                    newestFile = { path: file, mtime: stats.mtime };
                }
            } catch {}
        }

        return {
            totalFiles,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            oldestFile,
            newestFile,
            utilizationPercent: Math.round((totalSize / this.maxSize) * 100)
        };
    }
}

module.exports = CacheManager;