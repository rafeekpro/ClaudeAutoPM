#!/usr/bin/env node
/**
 * regression:suite command implementation
 * Comprehensive regression testing suite for codebases
 * TDD Phase: REFACTOR - Improved organization with analyzer
 * Task: 4.2
 */

const RegressionAnalyzer = require('../../../lib/regression/analyzer');

/**
 * Runs regression test suite
 */
async function handleRun(options) {
  const analyzer = new RegressionAnalyzer();

  console.log('Running Regression Test Suite...');
  console.log('================================');

  const results = await analyzer.runTests();

  console.log('\nTest Results:');
  if (results.tests) {
    console.log(`  Tests Passed: ${results.tests.passed}/${results.tests.total}`);
    console.log(`  Success Rate: ${Math.round((results.tests.passed / results.tests.total) * 100)}%`);
  } else {
    console.log(`  Tests: Running`);
    console.log(`  Success: Complete`);
  }

  if (results.duration) {
    console.log(`  Duration: ${results.duration}ms`);
  }

  if (!results.success) {
    console.log('\n⚠️ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed');
  }
}

/**
 * Captures baseline
 */
async function handleBaseline(options) {
  const analyzer = new RegressionAnalyzer();

  console.log('Capturing baseline...');

  const { baseline, path } = await analyzer.captureBaseline();

  console.log('Baseline captured successfully');
  console.log(`  Tests: ${baseline.tests.passed}/${baseline.tests.total} passed`);
  if (baseline.coverage) {
    console.log(`  Coverage: ${baseline.coverage.lines}% lines`);
  }
  console.log(`  Saved to: ${path}`);
}

/**
 * Compares with baseline
 */
async function handleCompare(options) {
  const analyzer = new RegressionAnalyzer();

  console.log('Comparing with baseline...');

  try {
    const comparison = await analyzer.compareWithBaseline();

    console.log('\nComparison Results:');
    console.log('==================');
    console.log(`Baseline: ${comparison.baseline.timestamp}`);
    console.log(`Current: ${comparison.current.timestamp}`);

    // Show tests comparison
    console.log('\nTests:');
    console.log(`  Baseline: ${comparison.baseline.tests.passed}/${comparison.baseline.tests.total} passed`);
    console.log(`  Current: ${comparison.current.tests.passed}/${comparison.current.tests.total} passed`);

    // Show coverage comparison
    if (comparison.baseline.coverage && comparison.current.coverage) {
      console.log('\nCoverage:');
      console.log(`  Baseline: ${comparison.baseline.coverage.lines}% lines`);
      console.log(`  Current: ${comparison.current.coverage.lines}% lines`);
    }

    // Show performance comparison
    if (comparison.baseline.performance && comparison.current.performance) {
      console.log('\nPerformance:');
      console.log(`  Baseline: ${comparison.baseline.performance.duration}ms`);
      console.log(`  Current: ${comparison.current.performance.duration}ms`);
    }

    // Show regressions
    if (comparison.regressions.length > 0) {
      console.log('\n⚠️ Regressions detected:');
      for (const regression of comparison.regressions) {
        console.log(`  - ${regression.message}`);
      }
    }

    // Show improvements
    if (comparison.improvements.length > 0) {
      console.log('\n✅ Improvements:');
      for (const improvement of comparison.improvements) {
        console.log(`  - ${improvement.message}`);
      }
    }
  } catch (error) {
    console.log(error.message);
  }
}

/**
 * Analyzes coverage
 */
async function handleCoverage(options) {
  const analyzer = new RegressionAnalyzer();

  console.log('Analyzing test coverage...');

  const coverage = await analyzer.getCoverage();

  console.log('\nCoverage Analysis:');
  console.log('==================');
  console.log(`  Lines: ${coverage.lines}%`);
  console.log(`  Branches: ${coverage.branches}%`);
  console.log(`  Functions: ${coverage.functions}%`);

  // Check threshold if specified
  if (options.threshold) {
    console.log(`\nChecking threshold (${options.threshold}%):`);

    const failures = analyzer.checkCoverageThreshold(coverage, options.threshold);

    if (failures.length > 0) {
      for (const failure of failures) {
        console.log(`  ⚠️ ${failure.metric} coverage below threshold: ${failure.actual}% < ${failure.threshold}%`);
      }
    } else {
      console.log('  ✅ All coverage metrics meet threshold');
    }
  }

  // Generate report if requested
  if (options.report) {
    const { report, path } = await analyzer.generateReport();
    console.log(`\nCoverage report generated: ${path}`);
  }
}

/**
 * Analyzes test patterns
 */
async function handleAnalyze(options) {
  const analyzer = new RegressionAnalyzer();

  console.log('Analyzing test patterns...');

  const analysis = await analyzer.analyzePatterns(options);

  if (options.flaky) {
    console.log('\nFlaky Test Detection:');
    console.log('====================');

    if (analysis.flaky.length > 0) {
      console.log('  Flaky tests detected:');
      for (const flaky of analysis.flaky) {
        console.log(`    - ${flaky.test} (${flaky.passRate}% pass rate)`);
      }
    } else {
      console.log('  No flaky tests detected');
    }
  }

  if (options.slow) {
    console.log('\nSlow Test Analysis:');
    console.log('==================');

    if (analysis.slow.length > 0) {
      console.log(`  Slow tests (>${options.slowThreshold || 1000}ms):`);
      for (const test of analysis.slow) {
        console.log(`    - ${test.name}: ${test.duration}ms`);
      }

      const avgDuration = Math.round(
        analysis.slow.reduce((a, t) => a + t.duration, 0) / analysis.slow.length
      );
      console.log(`\nPerformance Summary:`);
      console.log(`  Average Duration: ${avgDuration}ms`);
    } else {
      console.log('  No slow tests detected');
    }
  }
}

/**
 * Shows test trends
 */
async function handleTrends(options) {
  const analyzer = new RegressionAnalyzer();

  console.log('Test Trend Analysis:');
  console.log('===================');

  const { history, statistics } = await analyzer.getTrends(options.limit || 10);

  if (history.length === 0) {
    console.log('No history data available');
    return;
  }

  console.log('\nSuccess Rate Trend:');
  for (const run of history) {
    if (run.tests && run.tests.total > 0) {
      const successRate = Math.round((run.tests.passed / run.tests.total) * 100);
      const bar = '█'.repeat(Math.floor(successRate / 5));
      const timestamp = run.timestamp ? run.timestamp.slice(0, 10) : 'Unknown';
      console.log(`  ${timestamp}: ${bar} ${successRate}%`);
    }
  }

  console.log('\nHistory Statistics:');
  console.log(`  Total runs: ${statistics.totalRuns}`);
  if (statistics.avgSuccessRate) {
    console.log(`  Average success rate: ${statistics.avgSuccessRate}%`);
  }
  if (statistics.avgDuration) {
    console.log(`  Average duration: ${statistics.avgDuration}ms`);
  }
  if (statistics.avgCoverage) {
    console.log(`  Average coverage: ${statistics.avgCoverage}%`);
  }
}

/**
 * Generates regression report
 */
async function handleReport(options) {
  const analyzer = new RegressionAnalyzer();

  console.log('Generating Regression Report...');

  const { report, path } = await analyzer.generateReport();

  console.log('\nRegression Report Summary:');
  console.log('=========================');
  console.log(`  Timestamp: ${report.timestamp}`);

  console.log('\nTest Results:');
  if (report.summary.tests) {
    console.log(`  Total: ${report.summary.tests.total}`);
    console.log(`  Passed: ${report.summary.tests.passed}`);
    console.log(`  Failed: ${report.summary.tests.failed}`);
  }

  if (report.summary.coverage) {
    console.log('\nCoverage:');
    console.log(`  Lines: ${report.summary.coverage.lines}%`);
    console.log(`  Branches: ${report.summary.coverage.branches}%`);
  }

  console.log(`\nReport saved to: ${path}`);
}

// Command Definition for yargs
exports.command = 'regression:suite <action>';
exports.describe = 'Run comprehensive regression testing suite';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['run', 'baseline', 'compare', 'coverage', 'analyze', 'trends', 'report']
    })
    .option('threshold', {
      describe: 'Coverage threshold percentage',
      type: 'number'
    })
    .option('report', {
      describe: 'Generate detailed report',
      type: 'boolean',
      default: false
    })
    .option('flaky', {
      describe: 'Detect flaky tests',
      type: 'boolean',
      default: false
    })
    .option('slow', {
      describe: 'Identify slow tests',
      type: 'boolean',
      default: false
    })
    .option('limit', {
      describe: 'Limit history entries',
      type: 'number',
      default: 10
    })
    .option('slow-threshold', {
      describe: 'Threshold for slow tests (ms)',
      type: 'number',
      default: 1000
    })
    .example('$0 regression:suite run', 'Run regression test suite')
    .example('$0 regression:suite baseline', 'Capture baseline')
    .example('$0 regression:suite compare', 'Compare with baseline')
    .example('$0 regression:suite coverage --threshold 80', 'Check coverage threshold')
    .example('$0 regression:suite analyze --flaky --slow', 'Analyze test patterns')
    .example('$0 regression:suite trends', 'Show test trends')
    .example('$0 regression:suite report', 'Generate comprehensive report');
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'run':
        await handleRun(argv);
        break;

      case 'baseline':
        await handleBaseline(argv);
        break;

      case 'compare':
        await handleCompare(argv);
        break;

      case 'coverage':
        await handleCoverage(argv);
        break;

      case 'analyze':
        await handleAnalyze(argv);
        break;

      case 'trends':
        await handleTrends(argv);
        break;

      case 'report':
        await handleReport(argv);
        break;

      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0] || 'run';

  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--threshold' && args[i + 1]) {
      options.threshold = parseInt(args[++i]);
    } else if (args[i] === '--report') {
      options.report = true;
    } else if (args[i] === '--flaky') {
      options.flaky = true;
    } else if (args[i] === '--slow') {
      options.slow = true;
    } else if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[++i]);
    } else if (args[i] === '--slow-threshold' && args[i + 1]) {
      options.slowThreshold = parseInt(args[++i]);
    }
  }

  exports.handler({ action, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.RegressionAnalyzer = RegressionAnalyzer;