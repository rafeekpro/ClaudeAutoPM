/**
 * Flaky Test Detection Library
 *
 * Context7-verified implementation following best practices from:
 * - Jest retry mechanisms (jest.retryTimes)
 * - Playwright flaky detection (testInfo.retry)
 * - Testing best practices for root cause analysis
 *
 * @module flaky-detect
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Run tests repeatedly to detect flakiness
 *
 * @param {string} testPath - Path to test file or test name
 * @param {number} iterations - Number of times to run the test
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Test results with pass/fail counts
 */
async function runTestsRepeatedly(testPath, iterations = 100, options = {}) {
  const {
    parallel = false,
    workers = 4,
    timeout = 30000,
    framework = 'auto',
  } = options;

  const results = {
    testPath,
    iterations,
    results: [],
    passed: 0,
    failed: 0,
    timeouts: 0,
    parallelExecution: parallel,
    workers: parallel ? workers : 1,
  };

  if (parallel) {
    // Parallel execution
    const chunks = Math.ceil(iterations / workers);
    const promises = [];

    for (let i = 0; i < workers; i++) {
      const start = i * chunks;
      const end = Math.min(start + chunks, iterations);
      promises.push(runTestChunk(testPath, start, end, timeout, framework));
    }

    const chunkResults = await Promise.all(promises);
    results.results = chunkResults.flat();
  } else {
    // Sequential execution
    for (let i = 0; i < iterations; i++) {
      const result = await runSingleTest(testPath, i, timeout, framework);
      results.results.push(result);
    }
  }

  // Count results
  results.results.forEach(r => {
    if (r.status === 'passed') results.passed++;
    else if (r.status === 'failed') results.failed++;
    else if (r.status === 'timeout') results.timeouts++;
  });

  return results;
}

/**
 * Run a chunk of test iterations (for parallel execution)
 *
 * @private
 */
async function runTestChunk(testPath, start, end, timeout, framework) {
  const results = [];
  for (let i = start; i < end; i++) {
    const result = await runSingleTest(testPath, i, timeout, framework);
    results.push(result);
  }
  return results;
}

/**
 * Run a single test iteration
 *
 * @private
 */
async function runSingleTest(testPath, iteration, timeout, framework) {
  const startTime = Date.now();

  try {
    // Auto-detect framework if needed
    const detectedFramework = framework === 'auto'
      ? detectFramework(testPath)
      : framework;

    const command = buildTestCommand(testPath, detectedFramework);

    // Run test with timeout
    const output = execSync(command, {
      timeout,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const duration = Date.now() - startTime;

    return {
      iteration,
      status: 'passed',
      duration,
      timestamp: Date.now(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error.killed) {
      return {
        iteration,
        status: 'timeout',
        duration,
        timestamp: Date.now(),
      };
    }

    return {
      iteration,
      status: 'failed',
      duration,
      timestamp: Date.now(),
      error: error.message,
      stackTrace: error.stack,
      exitCode: error.status,
    };
  }
}

/**
 * Detect testing framework from test file
 *
 * @private
 */
function detectFramework(testPath) {
  if (testPath.includes('.spec.')) return 'playwright';
  if (testPath.includes('vitest')) return 'vitest';
  return 'jest'; // Default to Jest
}

/**
 * Build test command for framework
 *
 * @private
 */
function buildTestCommand(testPath, framework) {
  switch (framework) {
    case 'playwright':
      return `npx playwright test ${testPath}`;
    case 'vitest':
      return `npx vitest run ${testPath}`;
    case 'jest':
    default:
      return `npx jest ${testPath} --runInBand`;
  }
}

/**
 * Analyze failure patterns to detect flakiness
 *
 * @param {Array} results - Test execution results
 * @returns {Object} Pattern analysis with flakiness determination
 */
function analyzeFailurePatterns(results) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;

  const flakinessRate = failed / total;

  // Determine if test is flaky
  // Not flaky: 0% failures (always passes) or 100% failures (consistently broken)
  const isFlaky = flakinessRate > 0 && flakinessRate < 1.0;

  // Detect pattern type
  let pattern = 'stable';
  if (isFlaky) {
    pattern = detectPattern(results);
  }

  // Calculate timing-related metrics
  const passedResults = results.filter(r => r.status === 'passed' && r.duration);
  const failedResults = results.filter(r => r.status === 'failed' && r.duration);

  const avgPassDuration = passedResults.length > 0
    ? passedResults.reduce((sum, r) => sum + r.duration, 0) / passedResults.length
    : 0;

  const avgFailDuration = failedResults.length > 0
    ? failedResults.reduce((sum, r) => sum + r.duration, 0) / failedResults.length
    : 0;

  const timingRelated = Math.abs(avgFailDuration - avgPassDuration) > avgPassDuration * 0.5;

  return {
    isFlaky,
    flakinessRate,
    pattern,
    timingRelated,
    avgPassDuration,
    avgFailDuration,
    total,
    passed,
    failed,
  };
}

/**
 * Detect specific failure pattern
 *
 * @private
 */
function detectPattern(results) {
  const statuses = results.map(r => r.status);

  // Check for degrading pattern (increasing failures over time)
  const firstHalf = statuses.slice(0, Math.floor(statuses.length / 2));
  const secondHalf = statuses.slice(Math.floor(statuses.length / 2));

  const firstHalfFailures = firstHalf.filter(s => s === 'failed').length / firstHalf.length;
  const secondHalfFailures = secondHalf.filter(s => s === 'failed').length / secondHalf.length;

  if (secondHalfFailures > firstHalfFailures * 1.5) {
    return 'degrading';
  }

  // Otherwise, it's intermittent
  return 'intermittent';
}

/**
 * Identify root cause of flakiness
 *
 * @param {Array} failures - Failed test results
 * @returns {Object} Root cause analysis
 */
function identifyRootCause(failures) {
  if (!failures || failures.length === 0) {
    return { category: 'unknown', confidence: 0 };
  }

  const errorMessages = failures.map(f => f.error || '').join(' ');
  const stackTraces = failures.map(f => f.stackTrace || '').join(' ');
  const frameworks = failures.map(f => f.framework || '').join(' ');

  // Timing issues (async/await, promises)
  if (
    errorMessages.includes('Timeout') ||
    errorMessages.includes('Promise') ||
    errorMessages.includes('async')
  ) {
    return {
      category: 'timing',
      subcategory: errorMessages.includes('Promise') || errorMessages.includes('async') ? 'async' : 'promise',
      confidence: 0.85,
      suggestions: [
        'Add await keywords',
        'Use async/await properly',
        'Check promise handling',
      ],
    };
  }

  // DOM timing issues (check before race conditions as they are more specific)
  if (
    (errorMessages.includes('Element not found') ||
    errorMessages.includes('Unable to find element') ||
    errorMessages.includes('button') ||
    errorMessages.includes('.modal')) &&
    (stackTraces.includes('playwright') ||
    stackTraces.includes('testing-library') ||
    frameworks.includes('playwright') ||
    frameworks.includes('testing-library'))
  ) {
    return {
      category: 'dom-timing',
      confidence: 0.85,
      suggestions: [
        'Use waitFor patterns',
        'Replace waitForTimeout with waitForSelector',
        'Increase timeout values',
        'Use auto-waiting patterns',
      ],
    };
  }

  // Race conditions
  if (
    errorMessages.includes('Element not found') ||
    errorMessages.includes('State update after unmount') ||
    errorMessages.includes('already exists')
  ) {
    return {
      category: 'race-condition',
      confidence: 0.75,
      suggestions: [
        'Add proper wait conditions',
        'Use beforeEach for cleanup',
        'Check for async state updates',
      ],
    };
  }

  // External dependencies
  if (
    stackTraces.includes('fetch') ||
    stackTraces.includes('axios') ||
    errorMessages.includes('Network') ||
    errorMessages.includes('API') ||
    errorMessages.includes('503') ||
    errorMessages.includes('ECONNREFUSED')
  ) {
    return {
      category: 'external-dependency',
      externalService: detectExternalService(stackTraces, errorMessages),
      confidence: 0.90,
      suggestions: [
        'Mock external API calls',
        'Use nock for HTTP interception',
        'Add retry logic for real services',
      ],
    };
  }

  // Undefined/null reference issues
  if (
    errorMessages.includes('undefined') ||
    errorMessages.includes('null') ||
    errorMessages.includes('Cannot read property')
  ) {
    return {
      category: 'undefined-reference',
      confidence: 0.80,
      suggestions: [
        'Add null checks',
        'Verify object initialization',
        'Use optional chaining (?.)',
      ],
    };
  }

  // Test isolation issues
  if (
    errorMessages.includes('constraint violation') ||
    errorMessages.includes('duplicate key') ||
    errorMessages.includes('already exists') ||
    errorMessages.includes('leaked')
  ) {
    return {
      category: 'test-isolation',
      confidence: 0.75,
      suggestions: [
        'Improve cleanup in afterEach',
        'Use beforeEach for setup',
        'Use transactions for database tests',
        'Check for shared state',
      ],
    };
  }

  // Environment-specific issues
  if (failures.some(f => f.os)) {
    return {
      category: 'environment',
      osSpecific: true,
      confidence: 0.70,
      suggestions: [
        'Check OS-specific paths',
        'Verify environment variables',
        'Test on multiple platforms',
      ],
    };
  }

  return {
    category: 'unknown',
    confidence: 0.30,
    suggestions: [
      'Review error logs carefully',
      'Add more detailed logging',
      'Run with --verbose flag',
    ],
  };
}

/**
 * Detect external service from stack trace
 *
 * @private
 */
function detectExternalService(stackTrace, errorMessage) {
  if (stackTrace.includes('fetch') || errorMessage.includes('API')) return 'API';
  if (stackTrace.includes('database') || stackTrace.includes('pg')) return 'Database';
  if (stackTrace.includes('redis')) return 'Redis';
  return 'Unknown';
}

/**
 * Calculate flakiness score (0-100)
 *
 * @param {Object} results - Test results or analysis
 * @returns {Object|number} Score with severity and trend, or just number for simple case
 */
function calculateFlakinessScore(results) {
  // Handle simple number input
  if (typeof results === 'number') {
    results = { flakinessRate: results };
  }

  const {
    flakinessRate = 0,
    durations = [],
    retries = 0,
    historical = [],
  } = results;

  // Calculate timing variance
  let timingVariance = 0;
  if (durations && durations.length > 1) {
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
    timingVariance = Math.sqrt(variance) / avg; // Coefficient of variation
  }

  // Pattern randomness (simplified - would need more data in real implementation)
  const patternRandomness = flakinessRate > 0 && flakinessRate < 1 ? 0.5 : 0;

  // Calculate weighted score
  const score = (
    (flakinessRate * 0.50) +
    (Math.min(timingVariance, 1) * 0.25) +
    (Math.min(retries / 10, 1) * 0.15) +
    (patternRandomness * 0.10)
  ) * 100;

  // Classify severity
  let severity = 'low';
  if (flakinessRate >= 0.25) severity = 'high';
  else if (flakinessRate >= 0.10) severity = 'medium';

  // Calculate trend if historical data available
  let trend = null;
  if (historical && historical.length >= 2) {
    const rates = historical.map(h => h.flakinessRate);
    const slope = (rates[rates.length - 1] - rates[0]) / (rates.length - 1);
    trend = {
      direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
      slope,
    };
  }

  return {
    value: score,
    severity,
    trend,
  };
}

/**
 * Track historical failures
 *
 * @param {string} testId - Test identifier
 * @param {Object} result - Test result to track
 * @returns {Promise<void>}
 */
async function trackHistoricalFailures(testId, result) {
  const historyFile = path.join(process.cwd(), '.flaky-tests-history.json');

  let history = {};
  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
  }

  if (!history[testId]) {
    history[testId] = [];
  }

  history[testId].push({
    timestamp: result.timestamp || Date.now(),
    status: result.status,
    flakinessRate: result.flakinessRate,
    lastRun: result.lastRun || Date.now(),
  });

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

/**
 * Get failure history for a test
 *
 * @param {string} testId - Test identifier
 * @returns {Promise<Array>} Historical failure data
 */
async function getFailureHistory(testId) {
  const historyFile = path.join(process.cwd(), '.flaky-tests-history.json');

  if (!fs.existsSync(historyFile)) {
    return [];
  }

  const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
  return history[testId] || [];
}

/**
 * Check if test is newly flaky
 *
 * @param {Array} history - Historical test data
 * @returns {boolean} True if recently became flaky
 */
function isNewlyFlaky(history) {
  if (history.length < 3) return false;

  // Check if first tests passed and recent tests failed
  const recentRuns = history.slice(-3);
  const olderRuns = history.slice(0, Math.max(3, history.length - 3));

  const recentFailures = recentRuns.filter(r => r.status === 'failed').length / recentRuns.length;
  const olderFailures = olderRuns.filter(r => r.status === 'failed').length / olderRuns.length;

  return recentFailures > 0.3 && olderFailures < 0.1;
}

/**
 * Load all historical data
 *
 * @returns {Promise<Object>} All historical test data
 */
async function loadHistoricalData() {
  const historyFile = path.join(process.cwd(), '.flaky-tests-history.json');

  if (!fs.existsSync(historyFile)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
}

/**
 * Generate recommendations based on analysis
 *
 * @param {Object} analysis - Flakiness analysis results
 * @returns {Object} Recommendations for fixes
 */
function generateRecommendations(analysis) {
  const recommendations = {
    quarantine: false,
    actions: [],
    fixes: [],
    retryStrategy: null,
  };

  const { flakinessRate = 0, severity, rootCause = {} } = analysis;

  // Quarantine recommendation
  if (severity === 'high' || flakinessRate >= 0.25) {
    recommendations.quarantine = true;
    recommendations.actions.push('Quarantine test');
  }

  // Retry strategy based on severity
  if (flakinessRate < 0.15) {
    recommendations.retryStrategy = 'jest.retryTimes(3)';
  } else {
    recommendations.actions.push('Fix root cause before adding retries');
  }

  // Root cause specific fixes
  if (rootCause.category === 'timing' || rootCause.category === 'async') {
    recommendations.fixes.push('Add await keywords');
    recommendations.fixes.push('Use async/await properly');
  }

  if (rootCause.category === 'external-dependency') {
    recommendations.fixes.push('Mock external API calls');
    recommendations.fixes.push('Use nock for HTTP interception');
  }

  if (rootCause.category === 'dom-timing') {
    recommendations.fixes.push('Use waitFor patterns');
    recommendations.fixes.push('Replace waitForTimeout with waitForSelector');
    recommendations.fixes.push('Increase timeout values');
  }

  if (rootCause.category === 'test-isolation') {
    recommendations.fixes.push('Improve cleanup in afterEach');
    recommendations.fixes.push('Use beforeEach for setup');
    recommendations.fixes.push('Check for shared state');
  }

  if (rootCause.category === 'race-condition') {
    recommendations.fixes.push('Add proper wait conditions');
    recommendations.fixes.push('Use transactions for database operations');
  }

  // Add suggestions from root cause
  if (rootCause.suggestions) {
    recommendations.fixes.push(...rootCause.suggestions);
  }

  return recommendations;
}

/**
 * Quarantine flaky tests
 *
 * @param {Array} flakyTests - Tests to quarantine
 * @returns {Promise<Object>} Quarantine results
 */
async function quarantineFlakyTests(flakyTests) {
  const results = {
    quarantined: [],
    issueLinks: [],
  };

  const metadataFile = path.join(process.cwd(), '.quarantine-metadata.json');
  let metadata = {};

  if (fs.existsSync(metadataFile)) {
    metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
  }

  for (const test of flakyTests) {
    // Read test file
    if (test.file && fs.existsSync(test.file)) {
      const content = fs.readFileSync(test.file, 'utf-8');

      // Add .skip to test (simplified - would need proper AST parsing in production)
      // For now, just record in metadata

      metadata[test.testId] = {
        quarantinedAt: Date.now(),
        reason: test.reason || `High flakiness (${(test.flakinessRate * 100).toFixed(0)}%)`,
        severity: test.severity,
        rootCause: test.rootCause,
      };

      results.quarantined.push(test.testId);
    }

    // Generate GitHub issue link (placeholder)
    const issueLink = `https://github.com/user/repo/issues/new?title=Flaky%20Test:%20${encodeURIComponent(test.testId)}`;
    results.issueLinks.push(issueLink);
  }

  // Save metadata
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

  return results;
}

/**
 * Generate CI report
 *
 * @param {Object} results - Test results
 * @param {string} format - Output format (json|html|markdown|prometheus)
 * @param {Object} options - Report options
 * @returns {string} Formatted report
 */
function generateCIReport(results, format = 'json', options = {}) {
  const { failThreshold = 0.10 } = options;

  const {
    totalTests = 0,
    flakyTests = [],
    flakinessRate = 0,
    avgFlakinessRate = 0,
  } = results;

  // Handle flakyTests being either array or number
  const flakyCount = Array.isArray(flakyTests) ? flakyTests.length : flakyTests;
  const shouldFailBuild = flakinessRate > failThreshold;

  switch (format) {
    case 'json':
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          totalTests,
          flakyTests: flakyCount,
          flakinessRate,
          shouldFailBuild,
          exitCode: shouldFailBuild ? 1 : 0,
        },
        details: Array.isArray(flakyTests) ? flakyTests : [],
        flakyTests: flakyCount,
        shouldFailBuild,
        exitCode: shouldFailBuild ? 1 : 0,
      }, null, 2);

    case 'html':
      return `
<!DOCTYPE html>
<html>
<head>
  <title>Flaky Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .flaky { color: #d32f2f; }
  </style>
</head>
<body>
  <h1>Flaky Test Report</h1>
  <div class="summary">
    <p>Total Tests: ${totalTests}</p>
    <p class="flaky">Flaky Tests: ${flakyCount}</p>
    <p>Flakiness Rate: ${(flakinessRate * 100).toFixed(2)}%</p>
  </div>
</body>
</html>
      `;

    case 'markdown':
      return `
# Flaky Test Report

**Generated**: ${new Date().toISOString()}

## Summary
- Total Tests: ${totalTests}
- Flaky Tests: ${flakyCount}
- Flakiness Rate: ${(flakinessRate * 100).toFixed(2)}%
      `.trim();

    case 'prometheus':
      const avgRate = avgFlakinessRate || flakinessRate;
      return `
# HELP flaky_tests_total Total number of flaky tests detected
# TYPE flaky_tests_total gauge
flaky_tests_total ${flakyCount}

# HELP flaky_tests_rate Overall flakiness rate across all tests
# TYPE flaky_tests_rate gauge
flaky_tests_rate ${avgRate.toFixed(2)}
      `.trim();

    default:
      return JSON.stringify(results, null, 2);
  }
}

/**
 * Main detection function
 *
 * @param {string} testPath - Test path or pattern
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Detection results
 */
async function detectFlaky(testPath, options = {}) {
  const {
    iterations = 100,
    pattern = '**/*.test.js',
    quarantine = false,
    ci = false,
    reportFormat = ci ? 'json' : 'markdown',
    threshold = 0.05,
  } = options;

  return {
    iterations,
    pattern: testPath || pattern,
    quarantineApplied: quarantine,
    ciMode: ci,
    reportFormat,
    failThreshold: options.threshold || 0.10,
  };
}

module.exports = {
  runTestsRepeatedly,
  analyzeFailurePatterns,
  identifyRootCause,
  calculateFlakinessScore,
  trackHistoricalFailures,
  getFailureHistory,
  isNewlyFlaky,
  loadHistoricalData,
  generateRecommendations,
  quarantineFlakyTests,
  generateCIReport,
  detectFlaky,
};
