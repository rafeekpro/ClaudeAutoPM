#!/usr/bin/env node

/**
 * Performance Benchmark: Self-Maintenance Validation
 * Measures performance of the pm validate command
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Benchmark the validation process
async function benchmarkValidation(iterations = 5) {
  console.log('🏃 Performance Benchmark: Self-Maintenance Validation');
  console.log(`Running ${iterations} iterations...`);
  console.log('');

  const results = {
    times: [],
    memory: [],
    fileOperations: []
  };

  // Load the self-maintenance module
  const SelfMaintenance = require('../self-maintenance');

  for (let i = 0; i < iterations; i++) {
    const maintenance = new SelfMaintenance();

    // Track file operations
    let fileOps = 0;
    const originalReadFileSync = fs.readFileSync;
    const originalExistsSync = fs.existsSync;
    const originalStatSync = fs.statSync;

    // Monkey-patch to count file operations
    fs.readFileSync = function(...args) {
      fileOps++;
      return originalReadFileSync.apply(fs, args);
    };
    fs.existsSync = function(...args) {
      fileOps++;
      return originalExistsSync.apply(fs, args);
    };
    fs.statSync = function(...args) {
      fileOps++;
      return originalStatSync.apply(fs, args);
    };

    // Measure memory before
    const memBefore = process.memoryUsage();

    // Start timing
    const startTime = performance.now();

    try {
      // Execute validation
      await maintenance.runValidation();
    } catch (error) {
      console.error(`Iteration ${i + 1} failed:`, error.message);
    }

    // End timing
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Restore original functions
    fs.readFileSync = originalReadFileSync;
    fs.existsSync = originalExistsSync;
    fs.statSync = originalStatSync;

    // Measure memory after
    const memAfter = process.memoryUsage();
    const memoryUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024; // MB

    // Record results
    results.times.push(executionTime);
    results.memory.push(memoryUsed);
    results.fileOperations.push(fileOps);

    process.stdout.write(`  Iteration ${i + 1}/${iterations}: ${executionTime.toFixed(2)}ms\r`);
  }

  console.log('\n');
  return analyzeResults(results);
}

// Analyze file scan performance
async function benchmarkFileScan(iterations = 10) {
  console.log('🏃 Performance Benchmark: File Scanning');
  console.log(`Running ${iterations} iterations...`);
  console.log('');

  const results = {
    sequential: [],
    parallel: []
  };

  const projectRoot = path.join(__dirname, '../..');
  const agentsDir = path.join(projectRoot, 'autopm/.claude/agents');

  // Sequential file scanning
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    const files = scanDirectorySequential(agentsDir, '.md');

    const endTime = performance.now();
    results.sequential.push(endTime - startTime);
  }

  // Parallel file scanning (using Promise.all)
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    await scanDirectoryParallel(agentsDir, '.md');

    const endTime = performance.now();
    results.parallel.push(endTime - startTime);
  }

  console.log('');
  console.log('📊 File Scanning Comparison:');
  console.log('');
  console.log('Sequential:');
  console.log(`  Avg: ${getAverage(results.sequential).toFixed(2)}ms`);
  console.log('');
  console.log('Parallel:');
  console.log(`  Avg: ${getAverage(results.parallel).toFixed(2)}ms`);
  console.log('');

  const improvement = ((getAverage(results.sequential) - getAverage(results.parallel)) / getAverage(results.sequential) * 100);
  console.log(`⚡ Parallel is ${improvement.toFixed(1)}% faster`);
}

// Sequential directory scanning
function scanDirectorySequential(dir, extension) {
  const files = [];

  function scan(directory) {
    if (!fs.existsSync(directory)) return;

    const items = fs.readdirSync(directory);
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        scan(fullPath);
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

// Parallel directory scanning
async function scanDirectoryParallel(dir, extension) {
  const files = [];

  async function scan(directory) {
    if (!fs.existsSync(directory)) return;

    const items = fs.readdirSync(directory);
    const promises = items.map(async item => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        await scan(fullPath);
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    });

    await Promise.all(promises);
  }

  await scan(dir);
  return files;
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
    fileOps: {
      min: Math.min(...results.fileOperations),
      max: Math.max(...results.fileOperations),
      avg: results.fileOperations.reduce((a, b) => a + b, 0) / results.fileOperations.length
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
  console.log('📁 File Operations:');
  console.log(`  Min: ${stats.fileOps.min}`);
  console.log(`  Max: ${stats.fileOps.max}`);
  console.log(`  Avg: ${stats.fileOps.avg.toFixed(1)}`);

  // Performance analysis
  console.log('');
  console.log('🔍 Performance Analysis:');

  if (stats.time.avg > 1000) {
    console.log('  ⚠️  High validation time detected');
    console.log('     Consider parallelizing file checks');
  }

  if (stats.fileOps.avg > 100) {
    console.log('  ⚠️  High number of file operations');
    console.log('     Consider caching file system state');
  }

  if (stats.memory.avg > 20) {
    console.log('  ⚠️  High memory usage detected');
    console.log('     Consider streaming file contents');
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
  const command = process.argv[2] || 'validate';
  const iterations = parseInt(process.argv[3]) || 5;

  if (command === 'validate') {
    benchmarkValidation(iterations).catch(console.error);
  } else if (command === 'scan') {
    benchmarkFileScan(iterations).catch(console.error);
  } else {
    console.log('Usage: node self-maintenance-validate.bench.js [validate|scan] [iterations]');
  }
}

module.exports = { benchmarkValidation, benchmarkFileScan };