# Batch Processor for GitHub Sync Operations

## Overview

The BatchProcessor is a high-performance utility for batch uploading PRDs, Epics, and Tasks to GitHub Issues. It provides parallel processing with concurrency control, intelligent rate limiting, comprehensive error recovery, and real-time progress tracking.

## Features

- **Parallel Processing**: Process up to 10 items concurrently (configurable)
- **Rate Limiting**: Respects GitHub API limits with exponential backoff
- **Progress Tracking**: Real-time progress callbacks
- **Error Recovery**: Continues processing on individual failures
- **Dry Run Mode**: Preview changes without executing
- **Performance**: Process 1000 items in < 30 seconds
- **Memory Efficient**: < 100MB memory usage for 1000 items

## Installation

The BatchProcessor is included in the ClaudeAutoPM framework:

```javascript
const BatchProcessor = require('./lib/batch-processor');
```

## Basic Usage

### Simple Example

```javascript
const { Octokit } = require('@octokit/rest');
const BatchProcessor = require('./lib/batch-processor');
const { syncPRDToGitHub, loadSyncMap } = require('./autopm/.claude/scripts/pm-sync-upload-local');

// Initialize
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const syncMap = await loadSyncMap('.claude/sync-map.json');

// Create processor
const processor = new BatchProcessor({
  maxConcurrent: 10,
  rateLimit: {
    requestsPerHour: 5000,
    retryDelay: 1000,
    maxRetries: 3
  }
});

// Define items to sync
const items = [
  { path: '.claude/prds/prd-001.md', id: 'prd-001' },
  { path: '.claude/prds/prd-002.md', id: 'prd-002' }
];

// Batch upload
const results = await processor.batchUpload({
  items,
  syncFn: syncPRDToGitHub,
  repo: { owner: 'your-username', repo: 'your-repo' },
  octokit,
  syncMap,
  dryRun: false,
  onProgress: (current, total, item) => {
    console.log(`[${current}/${total}] Processing ${item.path}`);
  }
});

console.log(`Completed: ${results.succeeded}/${results.total} items`);
```

### Using Integration Helpers

```javascript
const { batchSyncAll } = require('./lib/batch-processor-integration');

const results = await batchSyncAll({
  basePath: '.claude',
  owner: 'your-username',
  repo: 'your-repo',
  octokit,
  dryRun: false,
  maxConcurrent: 10,
  onProgress: (type, current, total, item) => {
    console.log(`[${type}] ${current}/${total}: ${item.path}`);
  }
});
```

## Configuration

### Constructor Options

```javascript
new BatchProcessor({
  maxConcurrent: 10,        // Max parallel uploads (default: 10)
  rateLimit: {
    requestsPerHour: 5000,  // GitHub rate limit (default: 5000)
    retryDelay: 1000,       // Initial retry delay ms (default: 1000)
    maxRetries: 3,          // Max retry attempts (default: 3)
    threshold: 10           // Wait threshold (default: 10)
  }
})
```

### Upload Parameters

```javascript
await processor.batchUpload({
  items: [],              // Array of items to process
  syncFn: Function,       // Sync function for each item
  repo: { owner, repo },  // GitHub repository
  octokit: Object,        // Octokit instance
  syncMap: Object,        // Sync mapping object
  dryRun: false,          // Dry run mode
  onProgress: Function    // Progress callback (optional)
})
```

## API Reference

### Class: BatchProcessor

#### Constructor

```javascript
new BatchProcessor(options)
```

**Parameters:**
- `options.maxConcurrent` (number): Maximum concurrent uploads (default: 10)
- `options.rateLimit` (object): Rate limiting configuration

**Throws:**
- Error if `maxConcurrent` is not a positive number

#### Method: batchUpload

```javascript
await processor.batchUpload(params)
```

**Parameters:**
- `params.items` (Array): Items to upload
- `params.syncFn` (Function): Sync function to call for each item
- `params.repo` (Object): Repository info `{owner, repo}`
- `params.octokit` (Object): Octokit instance
- `params.syncMap` (Object): Sync mapping object
- `params.dryRun` (boolean): Dry run mode
- `params.onProgress` (Function): Progress callback `(current, total, item) => {}`

**Returns:** Promise<Object>
```javascript
{
  total: 10,           // Total items processed
  succeeded: 9,        // Successfully synced
  failed: 1,           // Failed syncs
  duration: 2500,      // Duration in ms
  errors: [...],       // Array of error objects
  rateLimit: {
    remaining: 4990,   // Remaining API requests
    reset: 1234567890  // Reset timestamp
  }
}
```

#### Method: updateRateLimit

```javascript
processor.updateRateLimit(headers)
```

Updates rate limit information from GitHub API response headers.

**Parameters:**
- `headers` (Object): Response headers containing `x-ratelimit-remaining` and `x-ratelimit-reset`

#### Method: shouldWaitForRateLimit

```javascript
const shouldWait = processor.shouldWaitForRateLimit()
```

**Returns:** boolean - True if remaining requests are below threshold

#### Method: waitForRateLimit

```javascript
await processor.waitForRateLimit()
```

Waits until the rate limit resets.

#### Method: calculateBackoffDelay

```javascript
const delay = processor.calculateBackoffDelay(attempt)
```

Calculates exponential backoff delay.

**Parameters:**
- `attempt` (number): Current attempt number (1-based)

**Returns:** number - Delay in milliseconds

## Integration Functions

### batchSyncPRDs

Batch sync PRDs to GitHub.

```javascript
const { batchSyncPRDs } = require('./lib/batch-processor-integration');

const results = await batchSyncPRDs({
  basePath: '.claude',
  owner: 'username',
  repo: 'repository',
  octokit,
  dryRun: false,
  maxConcurrent: 10,
  onProgress: (current, total, item) => {
    console.log(`${current}/${total}: ${item.path}`);
  }
});
```

### batchSyncEpics

Batch sync Epics to GitHub.

```javascript
const results = await batchSyncEpics({
  basePath: '.claude',
  owner: 'username',
  repo: 'repository',
  octokit,
  dryRun: false,
  maxConcurrent: 10
});
```

### batchSyncTasks

Batch sync Tasks to GitHub.

```javascript
const results = await batchSyncTasks({
  basePath: '.claude',
  owner: 'username',
  repo: 'repository',
  octokit,
  dryRun: false,
  maxConcurrent: 10
});
```

### batchSyncAll

Batch sync all items (PRDs, Epics, Tasks) to GitHub.

```javascript
const results = await batchSyncAll({
  basePath: '.claude',
  owner: 'username',
  repo: 'repository',
  octokit,
  dryRun: false,
  maxConcurrent: 10,
  onProgress: (type, current, total, item) => {
    console.log(`[${type}] ${current}/${total}: ${item.id}`);
  }
});
```

## Rate Limiting

### How It Works

1. **Request Tracking**: Monitors GitHub API rate limit from response headers
2. **Threshold Checking**: Waits when remaining requests drop below threshold
3. **Exponential Backoff**: Retries with increasing delays on 429 errors
4. **Automatic Reset**: Resets to full limit after waiting period

### Rate Limit Strategy

```javascript
const processor = new BatchProcessor({
  rateLimit: {
    requestsPerHour: 5000,  // GitHub's limit
    retryDelay: 1000,       // Start with 1s delay
    maxRetries: 3,          // Try up to 3 times
    threshold: 10           // Wait when < 10 requests remain
  }
});
```

### Backoff Calculation

The processor uses exponential backoff:
- Attempt 1: 1000ms
- Attempt 2: 2000ms
- Attempt 3: 4000ms

## Error Handling

### Error Recovery

The processor continues processing even when individual items fail:

```javascript
const results = await processor.batchUpload({...});

if (results.failed > 0) {
  console.log(`Failed: ${results.failed} items`);
  results.errors.forEach(err => {
    console.log(`${err.item.path}: ${err.error}`);
  });
}
```

### Error Object Structure

```javascript
{
  item: {
    path: '.claude/prds/prd-001.md',
    id: 'prd-001',
    type: 'prd'
  },
  error: 'Error message string'
}
```

## Progress Tracking

### Progress Callback

```javascript
const onProgress = (current, total, item) => {
  const percent = Math.round((current / total) * 100);
  console.log(`[${percent}%] ${item.path}`);
};

await processor.batchUpload({
  items,
  syncFn,
  repo,
  octokit,
  syncMap,
  dryRun: false,
  onProgress
});
```

### Progress Bar Example

```javascript
const onProgress = (current, total, item) => {
  const percent = Math.round((current / total) * 100);
  const filled = Math.floor(percent / 2);
  const bar = '█'.repeat(filled) + '░'.repeat(50 - filled);
  process.stdout.write(`\r[${bar}] ${percent}% - ${item.id}`);
  if (current === total) console.log('');
};
```

## Performance

### Benchmarks

- **1000 items**: < 30 seconds
- **Concurrent uploads**: Up to 10 parallel
- **Memory usage**: < 100MB for 1000 items
- **Throughput**: ~33+ items/second

### Optimization Tips

1. **Adjust Concurrency**: Increase `maxConcurrent` for faster uploads (up to API limits)
2. **Batch Similar Items**: Group PRDs, Epics, and Tasks separately
3. **Use Dry Run**: Test configuration without API calls
4. **Monitor Rate Limits**: Check `results.rateLimit.remaining`

## Dry Run Mode

### Preview Changes

```javascript
const results = await processor.batchUpload({
  items,
  syncFn,
  repo,
  octokit,
  syncMap,
  dryRun: true  // No actual API calls
});

console.log(`Would sync ${results.total} items`);
console.log(`Estimated duration: ${results.duration}ms`);
```

### Use Cases

- **Testing**: Verify configuration before execution
- **Estimation**: Predict sync duration
- **Validation**: Check item count and structure
- **Debugging**: Identify issues without side effects

## Examples

See `/examples/batch-sync-example.js` for comprehensive examples:

```bash
# Run examples
node examples/batch-sync-example.js

# With environment variables
GITHUB_TOKEN=ghp_xxx \
GITHUB_OWNER=username \
GITHUB_REPO=repository \
node examples/batch-sync-example.js
```

## Testing

The BatchProcessor has comprehensive test coverage (31 tests, 100% pass rate):

```bash
# Run tests
npm run test:full -- test/unit/batch-processor-jest.test.js

# Run with coverage
npm run test:coverage -- test/unit/batch-processor-jest.test.js
```

### Test Coverage

- ✅ Constructor and configuration
- ✅ Batch upload operations
- ✅ Rate limiting and retries
- ✅ Error recovery and reporting
- ✅ Progress tracking
- ✅ Performance benchmarks
- ✅ Dry run mode
- ✅ Integration scenarios

## Troubleshooting

### Common Issues

#### 1. Rate Limit Errors

**Symptom**: Frequent 429 errors

**Solution**:
```javascript
const processor = new BatchProcessor({
  maxConcurrent: 5,  // Lower concurrency
  rateLimit: {
    threshold: 50,   // Wait earlier
    maxRetries: 5    // More retries
  }
});
```

#### 2. Slow Performance

**Symptom**: Processing takes too long

**Solution**:
```javascript
const processor = new BatchProcessor({
  maxConcurrent: 15  // Increase concurrency (careful with rate limits)
});
```

#### 3. Memory Issues

**Symptom**: High memory usage

**Solution**: Process in smaller batches:
```javascript
// Process 100 items at a time
const batchSize = 100;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await processor.batchUpload({ items: batch, ... });
}
```

## Best Practices

1. **Always Use Dry Run First**: Test configuration before live execution
2. **Monitor Rate Limits**: Check `results.rateLimit` after each batch
3. **Handle Errors Gracefully**: Implement retry logic for critical operations
4. **Use Progress Callbacks**: Provide user feedback for long operations
5. **Batch Similar Items**: Group by type for better organization
6. **Save Sync Map**: Always save after successful syncs
7. **Test in Development**: Verify behavior in test environment first

## Advanced Usage

### Custom Sync Function

```javascript
const customSyncFn = async (item, repo, octokit, syncMap, dryRun) => {
  // Custom preprocessing
  const enrichedItem = await enrichItem(item);

  // Call original sync
  const result = await syncPRDToGitHub(
    enrichedItem.path,
    repo,
    octokit,
    syncMap,
    dryRun
  );

  // Custom postprocessing
  await logSync(result);

  return result;
};

await processor.batchUpload({
  items,
  syncFn: customSyncFn,
  ...
});
```

### Conditional Processing

```javascript
const filteredItems = items.filter(item => {
  // Only sync PRDs with high priority
  return item.priority === 'P0' || item.priority === 'P1';
});

const results = await processor.batchUpload({
  items: filteredItems,
  ...
});
```

### Multi-Repository Sync

```javascript
const repos = [
  { owner: 'org1', repo: 'repo1' },
  { owner: 'org2', repo: 'repo2' }
];

for (const repo of repos) {
  console.log(`Syncing to ${repo.owner}/${repo.repo}...`);

  const results = await batchSyncAll({
    basePath: '.claude',
    owner: repo.owner,
    repo: repo.repo,
    octokit,
    dryRun: false
  });

  console.log(`Completed: ${results.succeeded}/${results.total}`);
}
```

## License

MIT - See LICENSE file for details

## Support

- **Issues**: https://github.com/rafeekpro/ClaudeAutoPM/issues
- **Documentation**: See README.md and wiki
- **Examples**: See /examples directory
