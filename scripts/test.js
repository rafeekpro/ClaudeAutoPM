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
  constructor(options = {}) {
    this.totalPass = 0;
    this.totalFail = 0;
    this.failedSuites = [];
    // Allow custom project root for testing
    this.projectRoot = options.projectRoot || process.cwd();
    // If no projectRoot specified and running from scripts/, go up one level
    if (!options.projectRoot && __dirname.includes('scripts')) {
      this.projectRoot = path.resolve(__dirname, '..');
    }
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
   * Check if test files exist in directory (recursively)
   */
  hasTestFiles(dir, pattern = '*.test.js', recursive = false) {
    const fullPath = path.isAbsolute(dir) ? dir : path.join(this.projectRoot, dir);

    if (!fs.existsSync(fullPath)) {
      return false;
    }

    try {
      const findTestFiles = (currentPath) => {
        const files = fs.readdirSync(currentPath);

        for (const file of files) {
          const filePath = path.join(currentPath, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && recursive) {
            if (findTestFiles(filePath)) return true;
          } else if (stat.isFile()) {
            if (pattern.includes('*')) {
              // Simple glob pattern matching
              const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
              if (regex.test(file)) return true;
            } else if (file === pattern) {
              return true;
            }
          }
        }
        return false;
      };

      return findTestFiles(fullPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Main test execution
   * @returns {Promise<number>} Exit code (0 for success, 1 for failure)
   */
  async run() {
    console.log(colors.bold('🧪 Running ClaudeAutoPM Test Suite'));
    console.log('='.repeat(34));

    // Run unit tests (including subdirectories)
    if (this.hasTestFiles('test/unit', '*.test.js', true)) {
      await this.runTestSuite('Unit Tests', 'node', ['--test', 'test/unit/**/*.test.js']);
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

    // Run command tests
    if (this.hasTestFiles('test/commands', '*.test.js', true)) {
      await this.runTestSuite('Command Tests', 'node', ['--test', 'test/commands/**/*.test.js']);
    } else {
      console.log(colors.yellow('⚠️  No command tests found'));
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
      return 1; // Return exit code instead of calling process.exit
    } else {
      console.log('');
      console.log(colors.green('🎉 All tests passed!'));
      return 0; // Return exit code instead of calling process.exit
    }
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  if (args.includes('--cwd')) {
    const cwdIndex = args.indexOf('--cwd');
    if (args[cwdIndex + 1]) {
      options.projectRoot = path.resolve(args[cwdIndex + 1]);
    }
  }

  const runner = new TestRunner(options);
  runner.run()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error(colors.red('Fatal error:'), error);
      process.exit(1);
    });
}

module.exports = TestRunner;