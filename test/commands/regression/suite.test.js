/**
 * Test suite for regression:suite command
 * TDD Phase: RED - Writing failing tests first
 * Task: 4.2
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('regression:suite command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `regression-suite-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .claude directory
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'regression'), { recursive: true });

    // Create sample test project
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'test'), { recursive: true });

    // Create sample source files
    await fs.writeFile(path.join(testDir, 'src', 'index.js'),
      'function add(a, b) { return a + b; }\nmodule.exports = { add };');
    await fs.writeFile(path.join(testDir, 'src', 'utils.js'),
      'function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }\nmodule.exports = { capitalize };');

    // Create sample test files
    await fs.writeFile(path.join(testDir, 'test', 'index.test.js'),
      'const { add } = require("../src/index");\nconsole.assert(add(2, 3) === 5, "Add test");');

    // Create package.json
    await fs.writeFile(path.join(testDir, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0', scripts: { test: 'node test/index.test.js' } }));
  });

  afterEach(async () => {
    // Restore original directory
    if (originalCwd) {
      process.chdir(originalCwd);
    }

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Regression Test Execution', () => {
    it('should run regression test suite', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should run without errors');
      assert.ok(stdout.includes('Regression') || stdout.includes('Running'),
        'Should show regression suite execution');
      assert.ok(stdout.includes('Tests') || stdout.includes('Pass') || stdout.includes('Success'),
        'Should show test results');
    });

    it('should capture baseline for regression testing', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite baseline`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should capture baseline without errors');
      assert.ok(stdout.includes('Baseline') || stdout.includes('captured'),
        'Should confirm baseline capture');

      // Check baseline file was created
      const files = await fs.readdir(path.join(testDir, '.claude', 'regression'));
      const baselineFile = files.find(f => f.includes('baseline'));
      assert.ok(baselineFile, 'Should create baseline file');
    });

    it('should compare current state with baseline', async () => {
      // Arrange - Create baseline
      const baseline = {
        timestamp: new Date().toISOString(),
        tests: { total: 1, passed: 1, failed: 0 },
        coverage: { lines: 80, branches: 75 },
        performance: { duration: 100 }
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'regression', 'baseline.json'),
        JSON.stringify(baseline)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite compare`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should compare without errors');
      assert.ok(
        stdout.includes('Comparison') || stdout.includes('Baseline') || stdout.includes('Current'),
        'Should show comparison results'
      );
    });
  });

  describe('Test Coverage Analysis', () => {
    it('should analyze test coverage', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite coverage`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should run coverage analysis');
      assert.ok(
        stdout.includes('Coverage') || stdout.includes('%') || stdout.includes('Lines'),
        'Should show coverage metrics'
      );
    });

    it('should detect coverage regression', async () => {
      // Arrange - Create baseline with good coverage
      const baseline = {
        timestamp: new Date().toISOString(),
        coverage: { lines: 90, branches: 85, functions: 95 }
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'regression', 'baseline.json'),
        JSON.stringify(baseline)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite coverage --threshold 80`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Coverage') || stdout.includes('threshold') || stdout.includes('regression'),
        'Should check coverage threshold'
      );
    });

    it('should generate coverage report', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite coverage --report`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate coverage report');
      assert.ok(
        stdout.includes('Report') || stdout.includes('generated') || stdout.includes('coverage'),
        'Should confirm report generation'
      );
    });
  });

  describe('Test Pattern Detection', () => {
    it('should detect flaky tests', async () => {
      // Arrange - Create history with flaky test patterns
      const history = [
        { timestamp: '2024-01-01', test: 'test1', passed: true },
        { timestamp: '2024-01-02', test: 'test1', passed: false },
        { timestamp: '2024-01-03', test: 'test1', passed: true }
      ];

      await fs.writeFile(
        path.join(testDir, '.claude', 'regression', 'history.json'),
        JSON.stringify(history)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite analyze --flaky`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should analyze flaky tests');
      assert.ok(
        stdout.includes('Flaky') || stdout.includes('unstable') || stdout.includes('intermittent'),
        'Should detect flaky tests'
      );
    });

    it('should identify slow tests', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite analyze --slow`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should analyze slow tests');
      assert.ok(
        stdout.includes('Slow') || stdout.includes('Performance') || stdout.includes('Duration'),
        'Should identify slow tests'
      );
    });

    it('should track test success rate over time', async () => {
      // Arrange - Create test history
      const history = [];
      for (let i = 0; i < 5; i++) {
        history.push({
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          tests: { total: 10, passed: 8 + i % 2, failed: 2 - i % 2 }
        });
      }

      await fs.writeFile(
        path.join(testDir, '.claude', 'regression', 'history.json'),
        JSON.stringify(history)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite trends`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should analyze trends');
      assert.ok(
        stdout.includes('Trend') || stdout.includes('Success rate') || stdout.includes('History'),
        'Should show test success trends'
      );
    });
  });

  describe('Regression Report Generation', () => {
    it('should generate comprehensive regression report', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} regression:suite report`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate report');
      assert.ok(
        stdout.includes('Report') || stdout.includes('Summary') || stdout.includes('Results'),
        'Should show regression report'
      );

      // Check if report file was created
      const files = await fs.readdir(path.join(testDir, '.claude', 'regression'));
      const reportFile = files.find(f => f.includes('report'));
      assert.ok(reportFile, 'Should create report file');
    });
  });
});