#!/usr/bin/env node

/**
 * ClaudeAutoPM Test Runner
 * Node.js implementation of test.sh
 * Runs all test suites sequentially and provides unified reporting
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const colors = require('../lib/utils/colors');

class TestRunner {
  constructor() {
    this.totalPass = 0;
    this.totalFail = 0;
    this.failedSuites = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  /**
   * Run a test suite
   */
  async runTestSuite(suiteName, testCommand, testArgs = []) {
    console.log('');
    console.log(colors.blue(`📋 Running ${suiteName}...`));
    console.log('-'.repeat(35));

    return new Promise((resolve) => {
      const child = spawn(testCommand, testArgs, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(colors.green(`✅ ${suiteName}: PASSED`));
          this.totalPass++;
        } else {
          console.log(colors.red(`❌ ${suiteName}: FAILED`));
          this.totalFail++;
          this.failedSuites.push(suiteName);
        }
        resolve(code);
      });

      child.on('error', (err) => {
        console.error(colors.red(`Error running ${suiteName}:`), err.message);
        this.totalFail++;
        this.failedSuites.push(suiteName);
        resolve(1);
      });
    });
  }

  /**
   * Check if test files exist in directory
   */
  hasTestFiles(dir, pattern = '*.test.js') {
    const fullPath = path.join(this.projectRoot, dir);

    if (!fs.existsSync(fullPath)) {
      return false;
    }

    const files = fs.readdirSync(fullPath);
    const testFiles = files.filter(file => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(file);
      }
      return file === pattern;
    });

    return testFiles.length > 0;
  }

  /**
   * Main test execution
   */
  async run() {
    console.log(colors.bold('🧪 Running ClaudeAutoPM Test Suite'));
    console.log('='.repeat(34));

    // Run unit tests
    if (this.hasTestFiles('test/unit')) {
      await this.runTestSuite('Unit Tests', 'node', ['--test', 'test/unit/*.test.js']);
    } else {
      console.log(colors.yellow('⚠️  No unit tests found'));
    }

    // Run Azure provider tests
    if (this.hasTestFiles('test/providers/azure')) {
      await this.runTestSuite('Azure Provider Tests', 'node', ['--test', 'test/providers/azure/*.test.js']);
    } else {
      console.log(colors.yellow('⚠️  No Azure provider tests found'));
    }

    // Run security tests
    if (this.hasTestFiles('test/security')) {
      await this.runTestSuite('Security Tests', 'node', ['--test', 'test/security/*.test.js']);
    } else {
      console.log(colors.yellow('⚠️  No security tests found'));
    }

    // Run regression tests
    if (this.hasTestFiles('test/regression')) {
      await this.runTestSuite('Regression Tests', 'node', ['--test', 'test/regression/*.test.js']);
    } else {
      console.log(colors.yellow('⚠️  No regression tests found'));
    }

    // Run installation tests (skip in CI)
    if (process.env.CI !== 'true') {
      const installTestPath = path.join(this.projectRoot, 'test/installation/integration.test.sh');
      if (fs.existsSync(installTestPath)) {
        await this.runTestSuite('Installation Tests', 'bash', [installTestPath]);
      } else {
        console.log(colors.yellow('⚠️  No installation tests found'));
      }
    } else {
      console.log(colors.gray('⏩ Skipping installation tests in CI'));
    }

    // Run E2E tests
    if (this.hasTestFiles('test/e2e')) {
      await this.runTestSuite('E2E Tests', 'node', ['--test', 'test/e2e/*.test.js']);
    } else {
      console.log(colors.yellow('⚠️  No E2E tests found'));
    }

    // Summary
    console.log('');
    console.log('='.repeat(34));
    console.log(colors.bold('📊 Test Summary'));
    console.log('='.repeat(34));
    console.log(colors.green(`✅ Passed: ${this.totalPass} suites`));
    console.log(colors.red(`❌ Failed: ${this.totalFail} suites`));

    if (this.totalFail > 0) {
      console.log('');
      console.log('Failed suites:');
      this.failedSuites.forEach(suite => {
        console.log(colors.red(`  - ${suite}`));
      });
      process.exit(1);
    } else {
      console.log('');
      console.log(colors.green('🎉 All tests passed!'));
      process.exit(0);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error(colors.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = TestRunner;