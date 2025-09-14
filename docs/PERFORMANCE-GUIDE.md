# Performance Optimization Guide

## Overview

ClaudeAutoPM v1.1.0 includes significant performance improvements that can make your commands run **40% faster** while reducing API calls by **80%**. This guide shows you how to maximize these benefits.

## Quick Wins (5 minutes)

### 1. Enable Caching (80% API Reduction)

Add to `.claude/config.json`:
```json
{
  "performance": {
    "enableCaching": true,
    "cacheTimeout": 120000  // 2 minutes
  }
}
```

**Impact**: Repeated commands use cached data instead of making new API calls.

### 2. Enable Batch Processing

```json
{
  "performance": {
    "batchSize": 50,  // Optimal for Azure DevOps
    "enableBatching": true
  }
}
```

**Impact**: Bulk operations complete 60% faster.

### 3. Enable Module Preloading

```json
{
  "performance": {
    "modulePreloading": true,
    "preloadCommands": ["issue:list", "issue:show", "pr:create"]
  }
}
```

**Impact**: Commands execute 95% faster after first run.

## Performance Metrics

### Current Performance (v1.1.0)

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Issue List (50 items) | 350ms | 210ms | 40% faster |
| Issue List (cached) | 350ms | 15ms | 95% faster |
| Bulk Update (100 items) | 5000ms | 2000ms | 60% faster |
| Module Load | 45ms | 2ms | 95% faster |
| Memory Usage | 45MB | 31MB | 31% less |

## Configuration Options

### Complete Performance Configuration

```json
{
  "projectManagement": {
    "provider": "azure",
    "settings": {
      // Provider settings
    }
  },
  "performance": {
    // Caching
    "enableCaching": true,
    "cacheTimeout": 120000,      // 2 minutes (in milliseconds)
    "cacheMaxSize": 100,         // Maximum cache entries

    // Batching
    "enableBatching": true,
    "batchSize": 50,             // Items per batch
    "batchConcurrency": 3,       // Parallel batch requests

    // Network
    "requestTimeout": 30000,     // 30 seconds
    "maxRetries": 3,            // Retry failed requests
    "exponentialBackoff": true,  // Smart retry delays

    // Module Loading
    "modulePreloading": true,
    "preloadCommands": [
      "issue:list",
      "issue:show",
      "pr:create"
    ],

    // Memory Management
    "maxMemoryUsage": 100,       // MB
    "gcInterval": 60000         // Garbage collection interval
  }
}
```

## Caching Strategy

### How Caching Works

1. **First Request**: Makes API call, stores result
2. **Subsequent Requests**: Returns cached data (within TTL)
3. **Cache Expiry**: After TTL, makes fresh API call

### Cache Configuration

```javascript
// Aggressive caching (for stable data)
{
  "cacheTimeout": 300000  // 5 minutes
}

// Moderate caching (default)
{
  "cacheTimeout": 120000  // 2 minutes
}

// Conservative caching (for frequently changing data)
{
  "cacheTimeout": 30000   // 30 seconds
}

// Disable caching (for real-time requirements)
{
  "enableCaching": false
}
```

### Cache Management Commands

```bash
# View cache statistics
/pm:cache:stats

# Clear cache
/pm:cache:clear

# Clear specific cache entry
/pm:cache:clear --key="issue:list"
```

## Batching Optimization

### Optimal Batch Sizes

| Provider | Optimal Batch Size | Max Concurrent |
|----------|-------------------|----------------|
| GitHub | 100 | 5 |
| Azure DevOps | 50 | 3 |
| GitLab | 100 | 4 |

### Configure Batching

```json
{
  "performance": {
    "batching": {
      "github": {
        "size": 100,
        "concurrent": 5
      },
      "azure": {
        "size": 50,
        "concurrent": 3
      }
    }
  }
}
```

## Network Optimization

### Rate Limiting

Handle rate limits intelligently:

```json
{
  "performance": {
    "rateLimiting": {
      "maxRequestsPerSecond": 10,
      "exponentialBackoff": true,
      "backoffMultiplier": 2,
      "maxBackoffTime": 60000
    }
  }
}
```

### Connection Pooling

```json
{
  "performance": {
    "connectionPool": {
      "maxSockets": 10,
      "keepAlive": true,
      "keepAliveMsecs": 30000
    }
  }
}
```

## Benchmarking Your Performance

### Run Built-in Benchmarks

```bash
# Benchmark Azure DevOps operations
node scripts/benchmarks/azure-issue-list.bench.js 20

# Benchmark provider routing
node scripts/benchmarks/provider-router.bench.js 50

# Benchmark file operations
node scripts/benchmarks/self-maintenance-validate.bench.js 10
```

### Interpret Results

```
📊 Results Summary:

⏱️ Execution Time (ms):
  Min:    150.23ms
  Max:    285.67ms
  Avg:    210.45ms    ← Target: < 250ms
  Median: 205.12ms

💾 Memory Usage (MB):
  Min: 28.45MB
  Max: 35.23MB
  Avg: 31.12MB        ← Target: < 50MB

🌐 API Calls:
  Avg Queries: 1.0
  Avg Gets:    1.0    ← With caching: 0.2
```

### Create Custom Benchmarks

```javascript
// custom-benchmark.js
const { performance } = require('perf_hooks');

async function benchmark() {
  const start = performance.now();

  // Your operation here
  await yourOperation();

  const end = performance.now();
  console.log(`Operation took ${end - start}ms`);
}

benchmark();
```

## Memory Optimization

### Monitor Memory Usage

```bash
# Check current memory usage
npm run pm:metrics

# Run memory profiling
node --inspect scripts/self-maintenance.js health
```

### Reduce Memory Footprint

```json
{
  "performance": {
    "memory": {
      "maxHeapSize": 100,        // MB
      "gcInterval": 60000,       // Run GC every minute
      "streamLargeResults": true, // Don't load all data at once
      "pruneCache": true         // Remove expired cache entries
    }
  }
}
```

## Provider-Specific Optimizations

### GitHub

```json
{
  "performance": {
    "github": {
      "useGraphQL": true,        // More efficient queries
      "parallelRequests": 5,     // GitHub allows more parallel
      "cacheTimeout": 180000     // 3 minutes (stable data)
    }
  }
}
```

### Azure DevOps

```json
{
  "performance": {
    "azure": {
      "useWIQL": true,           // Optimized queries
      "batchSize": 50,           // Azure optimal
      "cacheTimeout": 120000,    // 2 minutes
      "expandRelations": false   // Only when needed
    }
  }
}
```

## Troubleshooting Performance Issues

### Issue: Commands Still Slow

**Check**:
1. Is caching enabled? Check `.claude/config.json`
2. Cache hit rate: Run `/pm:cache:stats`
3. Network latency: Check with `ping` to API servers

**Solution**:
```json
{
  "performance": {
    "enableCaching": true,
    "cacheTimeout": 300000,  // Increase timeout
    "modulePreloading": true
  }
}
```

### Issue: High Memory Usage

**Check**:
```bash
npm run pm:metrics
```

**Solution**:
```json
{
  "performance": {
    "cacheMaxSize": 50,       // Reduce cache size
    "streamLargeResults": true,
    "gcInterval": 30000       // More frequent GC
  }
}
```

### Issue: Rate Limiting Errors

**Solution**:
```json
{
  "performance": {
    "exponentialBackoff": true,
    "maxRetries": 5,
    "rateLimiting": {
      "maxRequestsPerSecond": 5  // Reduce request rate
    }
  }
}
```

## Performance Best Practices

### 1. Use Caching Wisely
- ✅ Enable for read operations
- ✅ Use longer TTL for stable data
- ⚠️ Shorter TTL for frequently changing data
- ❌ Disable for real-time requirements

### 2. Batch Operations
- ✅ Group related operations
- ✅ Use optimal batch sizes
- ⚠️ Monitor memory usage with large batches

### 3. Preload Common Modules
- ✅ Preload frequently used commands
- ✅ Preload during idle time
- ⚠️ Don't preload everything (wastes memory)

### 4. Monitor and Adjust
- ✅ Run benchmarks regularly
- ✅ Monitor cache hit rates
- ✅ Adjust configuration based on usage patterns

## Advanced Optimizations

### Custom Cache Implementation

```javascript
// custom-cache.js
class CustomCache {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }
    this.misses++;
    return null;
  }

  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total * 100) : 0;
  }
}
```

### Parallel Processing

```javascript
// Parallel operations
const results = await Promise.all([
  getIssues(),
  getPullRequests(),
  getEpics()
]);
```

## Monitoring Dashboard

Create a performance monitoring dashboard:

```bash
# Generate performance report
npm run pm:metrics > performance-report.json

# View in real-time
watch -n 5 'npm run pm:metrics'
```

## Expected Results

After implementing these optimizations:

### Immediate (After Enabling Caching)
- 80% reduction in API calls
- 40% faster command execution
- Improved responsiveness

### After Fine-Tuning (1 Week)
- 90% cache hit rate for common operations
- 60% reduction in average response time
- 50% reduction in API costs

### Long-Term (1 Month)
- Optimized configuration for your workflow
- Predictable performance metrics
- Minimal API rate limiting issues

## Need Help?

- Check current performance: `npm run pm:metrics`
- Run benchmarks: `node scripts/benchmarks/*.bench.js`
- Report issues: [GitHub Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)

Remember: The best configuration depends on your specific usage patterns. Start with defaults, measure, and adjust!