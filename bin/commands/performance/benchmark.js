#!/usr/bin/env node
/**
 * performance:benchmark command implementation
 * Performance benchmarking and profiling for codebases
 * TDD Phase: REFACTOR - Improved organization with benchmarker
 * Task: 4.1
 */

const PerformanceBenchmarker = require('../../../lib/performance/benchmarker');

/**
 * Runs performance benchmark
 */
async function runBenchmark(targetPath, options) {
  const benchmarker = new PerformanceBenchmarker();

  console.log('Running Performance Benchmark...');
  console.log(`Target: ${targetPath}`);

  // Run benchmark
  const result = await benchmarker.runBenchmark(targetPath, options);

  // Display metrics
  if (result.metrics.executionTime !== undefined) {
    console.log(`\nExecution time: ${result.metrics.executionTime}ms`);
  }

  if (result.metrics.memoryUsage !== undefined) {
    const memory = result.metrics.memoryDetails;
    console.log(`\nMemory Usage:`);
    console.log(`  Heap Used: ${memory.heapUsed} MB`);
    console.log(`  Heap Total: ${memory.heapTotal} MB`);
    console.log(`  RSS: ${memory.rss} MB`);
  }

  if (result.metrics.cpuUsage !== undefined) {
    const cpu = result.metrics.cpuDetails;
    console.log(`\nCPU Usage:`);
    console.log(`  User: ${cpu.user}ms`);
    console.log(`  System: ${cpu.system}ms`);
    console.log(`  Usage: ${cpu.percent}%`);
  }

  // Display analysis
  if (result.analysis.type === 'directory') {
    console.log(`  Analyzed ${result.analysis.files} files (${result.analysis.sizeKB}KB)`);
  } else if (result.analysis.type === 'file') {
    console.log(`  Analyzed file: ${result.analysis.name}`);
    console.log(`  Size: ${result.analysis.sizeKB}KB, Lines: ${result.analysis.lines}`);
  }

  // Save benchmark if requested
  if (options.save) {
    const savedPath = await benchmarker.saveBenchmark(result);
    console.log(`\nBenchmark saved to: ${savedPath}`);
  }

  // Compare with previous benchmarks if requested
  if (options.compare) {
    await compareBenchmarks(benchmarker, result.metrics);
  }

  // Check threshold if specified
  if (options.threshold) {
    await checkThreshold(benchmarker, result.metrics, parseInt(options.threshold));
  }

  return result;
}

/**
 * Compares with previous benchmarks
 */
async function compareBenchmarks(benchmarker, currentMetrics) {
  const benchmarks = await benchmarker.loadBenchmarks();

  if (benchmarks.length === 0) {
    console.log('\nNo previous benchmarks to compare');
    return;
  }

  // Get the most recent benchmark
  const previous = benchmarks[benchmarks.length - 1];

  console.log('\nComparison with Previous Benchmark:');
  console.log(`  Previous: ${previous.timestamp}`);
  console.log(`  Change from previous:`);

  const comparison = benchmarker.compareBenchmarks(currentMetrics, previous.metrics || {});

  if (comparison.executionTime) {
    const change = comparison.executionTime.change;
    console.log(`  Execution Time: ${change > 0 ? '+' : ''}${change}%`);
  }

  if (comparison.memoryUsage) {
    const change = comparison.memoryUsage.change;
    console.log(`  Memory Usage: ${change > 0 ? '+' : ''}${change}%`);
  }

  if (comparison.cpuUsage) {
    const change = comparison.cpuUsage.change;
    console.log(`  CPU Usage: ${change > 0 ? '+' : ''}${change}%`);
  }
}

/**
 * Checks performance threshold
 */
async function checkThreshold(benchmarker, currentMetrics, threshold) {
  const benchmarks = await benchmarker.loadBenchmarks();
  const baseline = benchmarks.find(b => b.file === 'baseline.json');

  if (!baseline) {
    console.log(`\nNo baseline found for threshold check`);
    return;
  }

  console.log(`\nChecking threshold (${threshold}%):`);

  const regressions = benchmarker.checkThreshold(
    currentMetrics,
    baseline.metrics || {},
    threshold
  );

  if (regressions.length > 0) {
    for (const regression of regressions) {
      const metricName = regression.metric.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`  ⚠️ Warning: ${metricName} regression detected! (+${regression.change}%)`);
    }
  } else {
    console.log('  ✓ No performance regression detected');
  }
}

/**
 * Shows benchmark history
 */
async function showHistory(options = {}) {
  const benchmarker = new PerformanceBenchmarker();
  const history = await benchmarker.getHistory(options.limit || 10);

  if (history.length === 0) {
    console.log('No benchmark history found');
    return;
  }

  console.log('Benchmark History:');
  console.log('==================');

  for (const benchmark of history) {
    console.log(`\ntimestamp: ${benchmark.timestamp}`);
    console.log('  metrics:');

    if (benchmark.metrics) {
      if (benchmark.metrics.executionTime !== undefined) {
        console.log(`    Execution Time: ${benchmark.metrics.executionTime}ms`);
      }
      if (benchmark.metrics.memoryUsage !== undefined) {
        console.log(`    Memory Usage: ${benchmark.metrics.memoryUsage} MB`);
      }
      if (benchmark.metrics.cpuUsage !== undefined) {
        console.log(`    CPU Usage: ${benchmark.metrics.cpuUsage}%`);
      }
    }
  }
}

/**
 * Generates CPU profile
 */
async function generateCPUProfile(options = {}) {
  const benchmarker = new PerformanceBenchmarker();

  console.log('Generating CPU Profile...');
  const profilePath = await benchmarker.generateCPUProfile();
  console.log(`CPU Profile saved to: ${profilePath}`);

  return profilePath;
}

/**
 * Generates memory heap snapshot
 */
async function generateHeapSnapshot(options = {}) {
  const benchmarker = new PerformanceBenchmarker();

  console.log('Generating Memory Heap Snapshot...');
  const snapshotPath = await benchmarker.generateHeapSnapshot();
  console.log(`Memory Heap Snapshot saved to: ${snapshotPath}`);

  return snapshotPath;
}

// Command Definition for yargs
exports.command = 'performance:benchmark [target] [action]';
exports.describe = 'Run performance benchmarks and profiling';

exports.builder = (yargs) => {
  return yargs
    .positional('target', {
      describe: 'Target file or directory to benchmark',
      type: 'string',
      default: '.'
    })
    .positional('action', {
      describe: 'Action to perform (history, profile)',
      type: 'string'
    })
    .option('save', {
      describe: 'Save benchmark results',
      type: 'boolean',
      default: false
    })
    .option('metrics', {
      describe: 'Metrics to measure (time,memory,cpu)',
      type: 'string'
    })
    .option('compare', {
      describe: 'Compare with previous benchmarks',
      type: 'boolean',
      default: false
    })
    .option('threshold', {
      describe: 'Performance regression threshold (%)',
      type: 'number'
    })
    .option('profile', {
      describe: 'Generate profile (cpu or memory)',
      type: 'string',
      choices: ['cpu', 'memory']
    })
    .option('limit', {
      describe: 'Limit history entries',
      type: 'number',
      default: 10
    })
    .example('$0 performance:benchmark', 'Run benchmark on current directory')
    .example('$0 performance:benchmark src/ --save', 'Benchmark src/ and save results')
    .example('$0 performance:benchmark --metrics time,memory', 'Measure specific metrics')
    .example('$0 performance:benchmark --compare', 'Compare with previous benchmark')
    .example('$0 performance:benchmark history', 'Show benchmark history')
    .example('$0 performance:benchmark --profile cpu', 'Generate CPU profile');
};

exports.handler = async (argv) => {
  try {
    // Handle special actions
    if (argv.target === 'history' || argv.action === 'history') {
      await showHistory({ limit: argv.limit });
      return;
    }

    // Handle profiling
    if (argv.profile === 'cpu') {
      await generateCPUProfile();
      return;
    }

    if (argv.profile === 'memory') {
      await generateHeapSnapshot();
      return;
    }

    // Run benchmark
    await runBenchmark(argv.target, {
      save: argv.save,
      metrics: argv.metrics,
      compare: argv.compare,
      threshold: argv.threshold
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);

  // Default to current directory
  const target = args[0] || '.';
  const options = {
    save: false,
    compare: false
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--save') {
      options.save = true;
    } else if (args[i] === '--metrics' && args[i + 1]) {
      options.metrics = args[++i];
    } else if (args[i] === '--compare') {
      options.compare = true;
    } else if (args[i] === '--threshold' && args[i + 1]) {
      options.threshold = parseInt(args[++i]);
    } else if (args[i] === '--profile' && args[i + 1]) {
      const profileType = args[++i];
      if (profileType === 'cpu') {
        generateCPUProfile().catch(console.error);
        return;
      } else if (profileType === 'memory') {
        generateHeapSnapshot().catch(console.error);
        return;
      }
    } else if (args[i] === 'history') {
      showHistory().catch(console.error);
      return;
    }
  }

  runBenchmark(target, options).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.PerformanceBenchmarker = PerformanceBenchmarker;