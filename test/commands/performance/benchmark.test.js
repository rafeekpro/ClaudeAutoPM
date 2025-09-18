/**
 * Test suite for performance:benchmark command
 * TDD Phase: RED - Writing failing tests first
 * Task: 4.1
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('performance:benchmark command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `performance-benchmark-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .claude directory
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'benchmarks'), { recursive: true });

    // Create sample project structure
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'index.js'),
      'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }\nmodule.exports = { fibonacci };');
    await fs.writeFile(path.join(testDir, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0', scripts: { test: 'echo "test"' } }));
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

  describe('Basic Benchmarking', () => {
    it('should run performance benchmarks on codebase', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should run without errors');
      assert.ok(stdout.includes('Performance') || stdout.includes('Benchmark'),
        'Should show performance benchmark output');
      assert.ok(stdout.includes('Memory') || stdout.includes('CPU') || stdout.includes('Time'),
        'Should include performance metrics');
    });

    it('should save benchmark results to file', async () => {
      // Act
      await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark --save`
      ).catch(err => err);

      // Assert
      const benchmarkFiles = await fs.readdir(path.join(testDir, '.claude', 'benchmarks'));
      assert.ok(benchmarkFiles.length > 0, 'Should create benchmark result file');

      const benchmarkFile = benchmarkFiles[0];
      const content = await fs.readFile(
        path.join(testDir, '.claude', 'benchmarks', benchmarkFile), 'utf8'
      );
      const benchmark = JSON.parse(content);

      assert.ok(benchmark.timestamp, 'Should have timestamp');
      assert.ok(benchmark.metrics, 'Should have metrics');
    });

    it('should benchmark specific files or directories', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark src/`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should run without errors');
      assert.ok(stdout.includes('src') || stdout.includes('index.js'),
        'Should benchmark specified directory');
    });
  });

  describe('Performance Metrics', () => {
    it('should measure execution time', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark --metrics time`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Execution time') || stdout.includes('ms') || stdout.includes('seconds'),
        'Should show execution time metrics');
    });

    it('should measure memory usage', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark --metrics memory`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Memory') || stdout.includes('MB') || stdout.includes('heap'),
        'Should show memory usage metrics');
    });

    it('should measure CPU usage', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark --metrics cpu`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('CPU') || stdout.includes('%') || stdout.includes('usage'),
        'Should show CPU usage metrics');
    });
  });

  describe('Comparison and History', () => {
    it('should compare with previous benchmarks', async () => {
      // Arrange - Create previous benchmark
      const previousBenchmark = {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        metrics: {
          executionTime: 100,
          memoryUsage: 50,
          cpuUsage: 25
        }
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'benchmarks', 'previous.json'),
        JSON.stringify(previousBenchmark)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark --compare`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Comparison') || stdout.includes('Previous') || stdout.includes('Change'),
        'Should compare with previous benchmark'
      );
    });

    it('should show benchmark history', async () => {
      // Arrange - Create multiple benchmarks
      for (let i = 0; i < 3; i++) {
        const benchmark = {
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          metrics: { executionTime: 100 + i * 10 }
        };
        await fs.writeFile(
          path.join(testDir, '.claude', 'benchmarks', `benchmark-${i}.json`),
          JSON.stringify(benchmark)
        );
      }

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark history`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('History') || stdout.includes('benchmark'),
        'Should show benchmark history');
      assert.ok(stdout.includes('timestamp') || stdout.includes('metrics'),
        'Should show historical data');
    });

    it('should detect performance regression', async () => {
      // Arrange - Create baseline with good performance
      const baseline = {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        metrics: {
          executionTime: 50,
          memoryUsage: 30
        }
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'benchmarks', 'baseline.json'),
        JSON.stringify(baseline)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark --threshold 10`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Regression') || stdout.includes('Warning') || stdout.includes('threshold'),
        'Should detect performance regression'
      );
    });
  });

  describe('Profile Generation', () => {
    it('should generate CPU profile', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark --profile cpu`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should run without errors');
      assert.ok(stdout.includes('Profile') || stdout.includes('CPU'),
        'Should generate CPU profile');

      // Check if profile file was created
      const files = await fs.readdir(path.join(testDir, '.claude', 'benchmarks'));
      const profileFile = files.find(f => f.includes('profile') || f.includes('.cpuprofile'));
      assert.ok(profileFile, 'Should create CPU profile file');
    });

    it('should generate memory heap snapshot', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} performance:benchmark --profile memory`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should run without errors');
      assert.ok(stdout.includes('Memory') || stdout.includes('Heap'),
        'Should generate memory profile');

      // Check if heap snapshot was created
      const files = await fs.readdir(path.join(testDir, '.claude', 'benchmarks'));
      const heapFile = files.find(f => f.includes('heap') || f.includes('.heapsnapshot'));
      assert.ok(heapFile, 'Should create heap snapshot file');
    });
  });
});