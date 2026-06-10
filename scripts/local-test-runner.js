#!/usr/bin/env node

/**
 * Local Test Runner for ClaudeAutoPM
 * Node.js implementation of local-test-runner.sh
 * Run this before pushing to ensure all tests pass
 */

const { spawn } = require('child_process');
const colors = require('../lib/utils/colors');

class LocalTestRunner {
  constructor() {
    this.failedTests = [];
    this.passedTests = [];
    this.isQuickMode = process.argv.includes('--quick');
  }

  /**
   * Run a test suite
   */
  async runTest(testName, testCommand) {
    process.stdout.write(colors.yellow(`▶ Running: ${testName}... `));

    return new Promise((resolve) => {
      const [cmd, ...args] = testCommand.split(' ');

      const child = spawn(cmd, args, {
        shell: true,
        stdio: 'pipe'
      });

      // Drain the pipes so the child cannot block on a full buffer;
      // the collected output is intentionally unused (stdio is piped).
      let _output = '';
      let _errorOutput = '';

      child.stdout.on('data', (data) => {
        _output += data.toString();
      });

      child.stderr.on('data', (data) => {
        _errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(colors.green('✓'));
          this.passedTests.push(testName);
        } else {
          console.log(colors.red('✗'));
          this.failedTests.push(testName);
        }
        resolve(code);
      });

      child.on('error', (err) => {
        console.log(colors.red('✗'));
        this.failedTests.push(testName);
        resolve(1);
      });
    });
  }

  /**
   * Display header
   */
  displayHeader() {
    console.log(colors.blue('━'.repeat(45)));
    console.log(colors.blue('🧪 ClaudeAutoPM Local Test Runner'));
    console.log(colors.blue('━'.repeat(45)));
    console.log('');
  }

  /**
   * Display summary
   */
  displaySummary() {
    console.log('');
    console.log(colors.blue('━'.repeat(45)));
    console.log(colors.blue('📊 Test Summary'));
    console.log(colors.blue('━'.repeat(45)));

    console.log(`${colors.green('Passed:')} ${this.passedTests.length} tests`);
    console.log(`${colors.red('Failed:')} ${this.failedTests.length} tests`);

    if (this.failedTests.length > 0) {
      console.log('');
      console.log(colors.red('Failed tests:'));
      for (const test of this.failedTests) {
        console.log(`  ${colors.red('✗')} ${test}`);
      }

      console.log('');
      console.log(colors.red('❌ Tests failed! Please fix before pushing.'));
      console.log(colors.yellow('To run specific test:'));
      console.log('  npm run test:security');
      console.log('  npm run test:unit');
      console.log('  npm run test:regression');
      process.exit(1);
    } else {
      console.log('');
      console.log(colors.green('✅ All tests passed! Safe to push.'));
      process.exit(0);
    }
  }

  /**
   * Main execution
   */
  async run() {
    this.displayHeader();

    if (this.isQuickMode) {
      console.log(colors.yellow('Running in quick mode (critical tests only)'));
      console.log('');

      // Quick mode - only critical tests
      await this.runTest('Security Tests', 'npm run test:security');
      await this.runTest('Regression Tests', 'npm run test:regression');
    } else {
      console.log(colors.yellow('Running full test suite'));
      console.log('');

      // Full mode - all tests
      await this.runTest('Security Tests', 'npm run test:security');
      await this.runTest('Unit Tests', 'npm run test:unit');
      await this.runTest('Regression Tests', 'npm run test:regression');
      await this.runTest('Installation Tests', 'npm run test:install');
      await this.runTest('CLI Tests', 'npm run test:cli');
    }

    this.displaySummary();
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new LocalTestRunner();
  runner.run().catch(error => {
    console.error(colors.red('Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = LocalTestRunner;