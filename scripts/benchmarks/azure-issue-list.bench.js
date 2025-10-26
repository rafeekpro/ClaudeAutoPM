#!/usr/bin/env node

/**
 * Performance Benchmark: Azure DevOps Issue List
 * Measures performance of the issue:list command for Azure DevOps
 */

const { performance } = require('perf_hooks');
const path = require('path');

// Mock configuration
const mockConfig = {
  organization: 'test-org',
  project: 'test-project',
  team: 'test-team'
};

// Mock Azure DevOps client for benchmarking
class MockAzureClient {
  constructor() {
    this.queryCount = 0;
    this.getCount = 0;
  }

  async executeWiql(query) {
    this.queryCount++;
    // Simulate API latency (50-150ms)
    await this.simulateLatency(50, 150);

    // Return mock work item IDs
    const itemCount = Math.floor(Math.random() * 50) + 10;
    return {
      workItems: Array.from({ length: itemCount }, (_, i) => ({ id: i + 1000 }))
    };
  }

  async getWorkItems(ids) {
    this.getCount++;
    // Simulate API latency (100-300ms per batch)
    await this.simulateLatency(100, 300);

    // Return mock work items
    return ids.map(id => ({
      id,
      fields: {
        'System.Title': `Work Item ${id}`,
        'System.State': ['New', 'Active', 'Done'][Math.floor(Math.random() * 3)],
        'System.WorkItemType': ['Task', 'Bug', 'User Story'][Math.floor(Math.random() * 3)],
        'System.AssignedTo': { displayName: `User ${Math.floor(Math.random() * 5)}` },
        'Microsoft.VSTS.Scheduling.StoryPoints': Math.floor(Math.random() * 13),
        'System.IterationPath': 'Sprint 1'
      }
    }));
  }

  async simulateLatency(min, max) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Benchmark function
async function benchmarkIssueList(iterations = 10) {
  console.log('🏃 Performance Benchmark: Azure DevOps Issue List');
  console.log(`Running ${iterations} iterations...`);
  console.log('');

  const results = {
    times: [],
    memory: [],
    apiCalls: []
  };

  // Load the actual module (with mocked client)
  const AzureIssueList = require('../../.claude/providers/azure/issue-list');

  for (let i = 0; i < iterations; i++) {
    // Create fresh instance
    const mockClient = new MockAzureClient();
    const issueList = new AzureIssueList(mockConfig);

    // Replace client with mock
    issueList.client = mockClient;
    issueList.client.project = mockConfig.project;

    // Measure memory before
    const memBefore = process.memoryUsage();

    // Start timing
    const startTime = performance.now();

    try {
      // Execute the operation
      await issueList.execute({
        state: 'open',
        assignee: '@me',
        limit: 50
      });
    } catch (error) {
      // Handle errors gracefully in benchmark
      console.error(`Iteration ${i + 1} failed:`, error.message);
    }

    // End timing
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Measure memory after
    const memAfter = process.memoryUsage();
    const memoryUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024; // MB

    // Record results
    results.times.push(executionTime);
    results.memory.push(memoryUsed);
    results.apiCalls.push({
      queries: mockClient.queryCount,
      gets: mockClient.getCount
    });

    process.stdout.write(`  Iteration ${i + 1}/${iterations}: ${executionTime.toFixed(2)}ms\r`);
  }

  console.log('\n');
  return analyzeResults(results);
}

// Analyze and report results
function analyzeResults(results) {
  const stats = {
    time: {
      min: Math.min(...results.times),
      max: Math.max(...results.times),
      avg: results.times.reduce((a, b) => a + b, 0) / results.times.length,
      median: getMedian(results.times)
    },
    memory: {
      min: Math.min(...results.memory),
      max: Math.max(...results.memory),
      avg: results.memory.reduce((a, b) => a + b, 0) / results.memory.length
    },
    apiCalls: {
      avgQueries: results.apiCalls.reduce((a, b) => a + b.queries, 0) / results.apiCalls.length,
      avgGets: results.apiCalls.reduce((a, b) => a + b.gets, 0) / results.apiCalls.length
    }
  };

  console.log('📊 Results Summary:');
  console.log('');
  console.log('⏱️  Execution Time (ms):');
  console.log(`  Min:    ${stats.time.min.toFixed(2)}ms`);
  console.log(`  Max:    ${stats.time.max.toFixed(2)}ms`);
  console.log(`  Avg:    ${stats.time.avg.toFixed(2)}ms`);
  console.log(`  Median: ${stats.time.median.toFixed(2)}ms`);
  console.log('');
  console.log('💾 Memory Usage (MB):');
  console.log(`  Min: ${stats.memory.min.toFixed(2)}MB`);
  console.log(`  Max: ${stats.memory.max.toFixed(2)}MB`);
  console.log(`  Avg: ${stats.memory.avg.toFixed(2)}MB`);
  console.log('');
  console.log('🌐 API Calls:');
  console.log(`  Avg Queries: ${stats.apiCalls.avgQueries.toFixed(1)}`);
  console.log(`  Avg Gets:    ${stats.apiCalls.avgGets.toFixed(1)}`);

  // Performance analysis
  console.log('');
  console.log('🔍 Performance Analysis:');

  if (stats.time.avg > 500) {
    console.log('  ⚠️  High average execution time detected');
    console.log('     Consider implementing result caching');
  }

  if (stats.memory.avg > 10) {
    console.log('  ⚠️  High memory usage detected');
    console.log('     Consider streaming results instead of loading all at once');
  }

  if (stats.apiCalls.avgGets > 1) {
    console.log('  ⚠️  Multiple API calls per operation');
    console.log('     Consider batching requests or implementing pagination');
  }

  return stats;
}

function getMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Run benchmark if executed directly
if (require.main === module) {
  const iterations = parseInt(process.argv[2]) || 10;
  benchmarkIssueList(iterations).catch(console.error);
}

module.exports = { benchmarkIssueList };