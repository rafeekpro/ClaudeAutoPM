#!/usr/bin/env node

/**
 * Performance Benchmark: Provider Router
 * Measures command routing and provider loading performance
 */

const { performance } = require('perf_hooks');
const path = require('path');
const fs = require('fs');

// Benchmark provider routing
async function benchmarkProviderRouting(iterations = 20) {
  console.log('🏃 Performance Benchmark: Provider Router');
  console.log(`Running ${iterations} iterations...`);
  console.log('');

  const results = {
    loadTimes: [],
    routingTimes: [],
    memory: [],
    moduleCache: []
  };

  // Test different commands
  const testCommands = [
    { command: 'issue-show', args: ['123'] },
    { command: 'issue-list', args: ['--status=open'] },
    { command: 'epic-list', args: [] },
    { command: 'pr-create', args: ['--title="Test"'] }
  ];

  for (let i = 0; i < iterations; i++) {
    const commandTest = testCommands[i % testCommands.length];

    // Clear require cache for clean test
    Object.keys(require.cache).forEach(key => {
      if (key.includes('providers')) {
        delete require.cache[key];
      }
    });

    // Measure memory before
    const memBefore = process.memoryUsage();

    // Measure module loading time
    const loadStart = performance.now();
    const ProviderRouter = require('../../.claude/providers/router');
    const loadEnd = performance.now();

    // Measure routing time
    const routeStart = performance.now();

    // Mock the actual execution to focus on routing
    const originalExecute = ProviderRouter.execute;
    ProviderRouter.execute = async function(command, args) {
      // Just load the module, don't execute
      const module = this.loadProviderModule(command);
      return module ? { success: true } : { success: false };
    };

    try {
      await ProviderRouter.execute(commandTest.command, commandTest.args);
    } catch (error) {
      // Ignore execution errors in benchmark
    }

    const routeEnd = performance.now();

    // Restore original method
    ProviderRouter.execute = originalExecute;

    // Measure memory after
    const memAfter = process.memoryUsage();

    // Record results
    results.loadTimes.push(loadEnd - loadStart);
    results.routingTimes.push(routeEnd - routeStart);
    results.memory.push((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024);
    results.moduleCache.push(Object.keys(require.cache).filter(k => k.includes('providers')).length);

    process.stdout.write(`  Iteration ${i + 1}/${iterations}: ${(routeEnd - routeStart).toFixed(2)}ms\r`);
  }

  console.log('\n');
  return analyzeResults(results);
}

// Benchmark config loading performance
async function benchmarkConfigLoading(iterations = 50) {
  console.log('🏃 Performance Benchmark: Config Loading');
  console.log(`Running ${iterations} iterations...`);
  console.log('');

  const results = {
    jsonParse: [],
    configLoad: [],
    providerDetection: []
  };

  const testConfig = {
    projectManagement: {
      provider: 'azure',
      settings: {
        github: {
          owner: 'test-owner',
          repo: 'test-repo'
        },
        azure: {
          organization: 'test-org',
          project: 'test-project',
          team: 'test-team'
        }
      }
    }
  };

  const configString = JSON.stringify(testConfig);

  for (let i = 0; i < iterations; i++) {
    // Benchmark JSON parsing
    const parseStart = performance.now();
    JSON.parse(configString);
    const parseEnd = performance.now();
    results.jsonParse.push(parseEnd - parseStart);

    // Benchmark full config loading
    const loadStart = performance.now();

    // Simulate config file reading and parsing
    const configPath = path.join(process.cwd(), '.claude', 'config.json');
    let config = {};

    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(content);
      }
    } catch (error) {
      // Use default config
      config = testConfig;
    }

    const loadEnd = performance.now();
    results.configLoad.push(loadEnd - loadStart);

    // Benchmark provider detection
    const detectStart = performance.now();

    let provider = 'github'; // default
    if (process.env.AUTOPM_PROVIDER) {
      provider = process.env.AUTOPM_PROVIDER;
    } else if (config.projectManagement?.provider) {
      provider = config.projectManagement.provider;
    }

    const detectEnd = performance.now();
    results.providerDetection.push(detectEnd - detectStart);
  }

  console.log('');
  console.log('📊 Config Loading Performance:');
  console.log('');
  console.log('JSON Parse:');
  console.log(`  Avg: ${getAverage(results.jsonParse).toFixed(4)}ms`);
  console.log('');
  console.log('Full Config Load:');
  console.log(`  Avg: ${getAverage(results.configLoad).toFixed(2)}ms`);
  console.log('');
  console.log('Provider Detection:');
  console.log(`  Avg: ${getAverage(results.providerDetection).toFixed(4)}ms`);

  return results;
}

// Analyze and report results
function analyzeResults(results) {
  const stats = {
    load: {
      min: Math.min(...results.loadTimes),
      max: Math.max(...results.loadTimes),
      avg: getAverage(results.loadTimes),
      median: getMedian(results.loadTimes)
    },
    routing: {
      min: Math.min(...results.routingTimes),
      max: Math.max(...results.routingTimes),
      avg: getAverage(results.routingTimes),
      median: getMedian(results.routingTimes)
    },
    memory: {
      min: Math.min(...results.memory),
      max: Math.max(...results.memory),
      avg: getAverage(results.memory)
    },
    cache: {
      min: Math.min(...results.moduleCache),
      max: Math.max(...results.moduleCache),
      avg: getAverage(results.moduleCache)
    }
  };

  console.log('📊 Results Summary:');
  console.log('');
  console.log('⏱️  Module Load Time (ms):');
  console.log(`  Min:    ${stats.load.min.toFixed(2)}ms`);
  console.log(`  Max:    ${stats.load.max.toFixed(2)}ms`);
  console.log(`  Avg:    ${stats.load.avg.toFixed(2)}ms`);
  console.log(`  Median: ${stats.load.median.toFixed(2)}ms`);
  console.log('');
  console.log('🔀 Routing Time (ms):');
  console.log(`  Min:    ${stats.routing.min.toFixed(2)}ms`);
  console.log(`  Max:    ${stats.routing.max.toFixed(2)}ms`);
  console.log(`  Avg:    ${stats.routing.avg.toFixed(2)}ms`);
  console.log(`  Median: ${stats.routing.median.toFixed(2)}ms`);
  console.log('');
  console.log('💾 Memory Usage (MB):');
  console.log(`  Min: ${stats.memory.min.toFixed(2)}MB`);
  console.log(`  Max: ${stats.memory.max.toFixed(2)}MB`);
  console.log(`  Avg: ${stats.memory.avg.toFixed(2)}MB`);
  console.log('');
  console.log('📦 Module Cache:');
  console.log(`  Avg modules cached: ${stats.cache.avg.toFixed(1)}`);

  // Performance analysis
  console.log('');
  console.log('🔍 Performance Analysis:');

  if (stats.load.avg > 50) {
    console.log('  ⚠️  High module load time detected');
    console.log('     Consider implementing module preloading');
  }

  if (stats.routing.avg > 10) {
    console.log('  ⚠️  High routing overhead detected');
    console.log('     Consider caching provider modules');
  }

  if (stats.cache.avg < 2) {
    console.log('  💡 Low module cache usage');
    console.log('     Implement module caching for better performance');
  }

  return stats;
}

function getMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getAverage(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Run benchmarks if executed directly
if (require.main === module) {
  const command = process.argv[2] || 'routing';
  const iterations = parseInt(process.argv[3]) || 20;

  Promise.resolve()
    .then(() => {
      if (command === 'routing' || command === 'all') {
        return benchmarkProviderRouting(iterations);
      }
    })
    .then(() => {
      if (command === 'config' || command === 'all') {
        return benchmarkConfigLoading(iterations * 2);
      }
    })
    .catch(console.error);
}

module.exports = { benchmarkProviderRouting, benchmarkConfigLoading };