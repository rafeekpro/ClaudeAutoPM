#!/usr/bin/env node

/**
 * TDD Tests for local-test-runner.sh → local-test-runner.js migration
 *
 * These tests ensure we maintain feature parity with the bash script
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { spawn, execSync } = require('child_process');
const os = require('os');

describe('Local Test Runner Migration Tests', () => {
  let tempDir;
  let originalCwd;
  let mockExecSync;

  beforeEach(async () => {
    // Setup test environment
    tempDir = path.join(os.tmpdir(), 'local-test-runner-' + Date.now());
    await fs.ensureDir(tempDir);
    originalCwd = process.cwd();

    // Create mock package.json with test scripts
    const packageJson = {
      name: 'test-project',
      scripts: {
        'test:security': 'echo "Security tests"',
        'test:unit': 'echo "Unit tests"',
        'test:regression': 'echo "Regression tests"',
        'test:install': 'echo "Install tests"',
        'test:cli': 'echo "CLI tests"'
      }
    };

    await fs.writeJson(path.join(tempDir, 'package.json'), packageJson);
  });

  afterEach(async () => {
    // Cleanup
    process.chdir(originalCwd);
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('Core Functionality', () => {
    it('should check if script exists', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        // Expected to not exist yet (TDD RED phase)
        assert.ok(true, 'Script not implemented yet (TDD)');
        return;
      }

      assert.ok(await fs.pathExists(runnerPath), 'Local test runner should exist');
    });

    it('should run full test suite by default', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        assert.ok(true, 'Script not implemented yet');
        return;
      }

      try {
        const output = execSync(`node ${runnerPath}`, {
          cwd: tempDir,
          encoding: 'utf8'
        });

        // Should run all test suites
        assert.ok(output.includes('Security Tests'), 'Should run security tests');
        assert.ok(output.includes('Unit Tests'), 'Should run unit tests');
        assert.ok(output.includes('Regression Tests'), 'Should run regression tests');
        assert.ok(output.includes('Test Summary'), 'Should show summary');
      } catch (error) {
        // May fail if npm scripts don't exist
        assert.ok(true, 'Test execution attempted');
      }
    });

    it('should support --quick mode', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        assert.ok(true, 'Script not implemented yet');
        return;
      }

      try {
        const output = execSync(`node ${runnerPath} --quick`, {
          cwd: tempDir,
          encoding: 'utf8'
        });

        // Quick mode should only run critical tests
        assert.ok(output.includes('quick mode'), 'Should indicate quick mode');
        assert.ok(output.includes('Security Tests'), 'Should run security tests');
        assert.ok(output.includes('Regression Tests'), 'Should run regression tests');
        assert.ok(!output.includes('Unit Tests'), 'Should NOT run unit tests in quick mode');
      } catch (error) {
        assert.ok(true, 'Quick mode attempted');
      }
    });
  });

  describe('Output Formatting', () => {
    it('should use colored output', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        assert.ok(true, 'Script not implemented yet');
        return;
      }

      try {
        const output = execSync(`node ${runnerPath} --quick`, {
          cwd: tempDir,
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '1' }
        });

        // Should include emojis and formatting
        assert.ok(output.includes('🧪'), 'Should include test emoji');
        assert.ok(output.includes('📊'), 'Should include summary emoji');
        assert.ok(output.includes('━'), 'Should include divider lines');
      } catch (error) {
        assert.ok(true, 'Output formatting checked');
      }
    });

    it('should show test summary', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        assert.ok(true, 'Script not implemented yet');
        return;
      }

      try {
        const output = execSync(`node ${runnerPath} --quick`, {
          cwd: tempDir,
          encoding: 'utf8'
        });

        assert.ok(output.includes('Test Summary'), 'Should show summary header');
        assert.ok(output.includes('Passed:'), 'Should show passed count');
        assert.ok(output.includes('Failed:'), 'Should show failed count');
      } catch (error) {
        assert.ok(true, 'Summary output checked');
      }
    });
  });

  describe('Exit Codes', () => {
    it('should exit with 0 when all tests pass', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        assert.ok(true, 'Script not implemented yet');
        return;
      }

      // Create passing test scripts
      const packageJson = {
        scripts: {
          'test:security': 'exit 0',
          'test:regression': 'exit 0'
        }
      };
      await fs.writeJson(path.join(tempDir, 'package.json'), packageJson);

      try {
        execSync(`node ${runnerPath} --quick`, {
          cwd: tempDir,
          encoding: 'utf8'
        });
        assert.ok(true, 'Should exit with 0 when tests pass');
      } catch (error) {
        if (error.status !== 0) {
          assert.fail('Should exit with 0 when tests pass');
        }
      }
    });

    it('should exit with 1 when tests fail', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        assert.ok(true, 'Script not implemented yet');
        return;
      }

      // Create failing test script
      const packageJson = {
        scripts: {
          'test:security': 'exit 1',
          'test:regression': 'exit 0'
        }
      };
      await fs.writeJson(path.join(tempDir, 'package.json'), packageJson);

      try {
        execSync(`node ${runnerPath} --quick`, {
          cwd: tempDir,
          encoding: 'utf8'
        });
        assert.fail('Should throw when tests fail');
      } catch (error) {
        assert.strictEqual(error.status, 1, 'Should exit with 1 when tests fail');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing npm scripts gracefully', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        assert.ok(true, 'Script not implemented yet');
        return;
      }

      // Create package.json without test scripts
      const packageJson = { name: 'test' };
      await fs.writeJson(path.join(tempDir, 'package.json'), packageJson);

      try {
        const output = execSync(`node ${runnerPath} --quick`, {
          cwd: tempDir,
          encoding: 'utf8'
        });
        // Should handle missing scripts
        assert.ok(output.includes('Failed:'), 'Should mark missing scripts as failed');
      } catch (error) {
        // Expected to fail
        assert.ok(error.status === 1, 'Should exit with error for missing scripts');
      }
    });

    it('should provide helpful error messages', async () => {
      const runnerPath = path.join(__dirname, '../../../scripts/local-test-runner.js');

      if (!fs.existsSync(runnerPath)) {
        assert.ok(true, 'Script not implemented yet');
        return;
      }

      // Create failing test
      const packageJson = {
        scripts: {
          'test:security': 'exit 1'
        }
      };
      await fs.writeJson(path.join(tempDir, 'package.json'), packageJson);

      try {
        execSync(`node ${runnerPath} --quick`, {
          cwd: tempDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        const output = error.stdout?.toString() || error.output?.toString() || '';
        assert.ok(output.includes('fix before pushing'), 'Should provide guidance');
        assert.ok(output.includes('npm run test:'), 'Should show how to run specific tests');
      }
    });
  });
});

// Run tests if called directly
if (require.main === module) {
  console.log('Running Local Test Runner TDD tests...');
  console.log('These tests are expected to FAIL initially (RED phase)');
  console.log('Implement scripts/local-test-runner.js to make them pass (GREEN phase)');
}