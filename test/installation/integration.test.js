#!/usr/bin/env node

/**
 * Integration Test for ClaudeAutoPM Installation
 * Node.js implementation of integration.test.sh
 * Tests actual installation process with all scenarios
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');
const colors = require('../../lib/utils/colors');

class IntegrationTestRunner {
  constructor() {
    this.testBaseDir = path.join(os.tmpdir(), `autopm-integration-tests-${process.pid}`);
    this.installScript = path.join(process.cwd(), 'install', 'install.sh');
    this.scenarios = ['1', '2', '3', '4'];
    this.scenarioNames = ['Minimal', 'Docker-only', 'Full DevOps', 'Performance'];
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  /**
   * Print formatted header
   */
  printHeader(text) {
    console.log('');
    console.log(colors.blue('═'.repeat(40)));
    console.log(colors.blue(`  ${text}`));
    console.log(colors.blue('═'.repeat(40)));
    console.log('');
  }

  /**
   * Print test being executed
   */
  printTest(text) {
    console.log(`${colors.yellow('▶ Testing:')} ${text}`);
  }

  /**
   * Print passing test
   */
  printPass(text) {
    console.log(`${colors.green('✓')} ${text}`);
    this.passed++;
  }

  /**
   * Print failing test
   */
  printFail(text) {
    console.log(`${colors.red('✗')} ${text}`);
    this.failed++;
    this.results.push(`FAIL: ${text}`);
  }

  /**
   * Setup test directory for scenario
   */
  async setupTestDir(scenarioName) {
    const testDir = path.join(this.testBaseDir, `scenario-${scenarioName}`);

    // Clean and create directory
    await fs.remove(testDir).catch(() => {});
    await fs.ensureDir(testDir);

    // Initialize git
    execSync('git init -q', { cwd: testDir });

    return testDir;
  }

  /**
   * Run installation with specific choice
   */
  async runInstallation(choice, testDir) {
    process.env.AUTOPM_TEST_MODE = '1';

    return new Promise((resolve) => {
      const child = spawn('bash', [this.installScript], {
        cwd: testDir,
        env: { ...process.env, AUTOPM_TEST_MODE: '1' }
      });

      // Provide automated inputs:
      // 1) Platform choice (GitHub=1)
      // 2) GitHub owner
      // 3) GitHub repo
      // 4) Development config choice
      // 5) CI/CD choice (GitHub Actions=1)
      const input = `1\ntest-org\ntest-repo\n${choice}\n1\n`;
      child.stdin.write(input);
      child.stdin.end();

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // Write log file
        fs.writeFileSync(path.join(testDir, 'install.log'), output);
        resolve(code === 0);
      });

      child.on('error', (err) => {
        console.error('Installation error:', err);
        resolve(false);
      });
    });
  }

  /**
   * Verify core files exist
   */
  async verifyCoreFiles(testDir, scenario) {
    const coreFiles = [
      '.claude',
      '.claude/agents',
      '.claude/commands',
      '.claude/rules',
      '.claude/scripts',
      'CLAUDE.md',
      '.claude/scripts/safe-commit.sh',
      '.claude/scripts/setup-hooks.sh'
    ];

    let allExist = true;

    for (const file of coreFiles) {
      const filePath = path.join(testDir, file);
      if (await fs.pathExists(filePath)) {
        this.printPass(`${scenario}: ${file} exists`);
      } else {
        this.printFail(`${scenario}: ${file} missing`);
        allExist = false;
      }
    }

    return allExist;
  }

  /**
   * Verify scenario-specific files
   */
  async verifyScenarioFiles(testDir, scenarioName) {
    let filesValid = true;

    // Check for strategy file
    const strategyFile = path.join(testDir, '.claude', 'strategies', 'ACTIVE_STRATEGY.md');
    if (await fs.pathExists(strategyFile)) {
      this.printPass(`${scenarioName}: Strategy file exists`);

      // Verify strategy content matches scenario
      const content = await fs.readFile(strategyFile, 'utf8');

      if (scenarioName === 'Performance' && content.includes('hybrid')) {
        this.printPass(`${scenarioName}: Hybrid strategy configured`);
      } else if (scenarioName === 'Minimal' && content.includes('sequential')) {
        this.printPass(`${scenarioName}: Sequential strategy configured`);
      } else if (content.includes('adaptive')) {
        this.printPass(`${scenarioName}: Adaptive strategy configured`);
      }
    } else {
      this.printFail(`${scenarioName}: Strategy file missing`);
      filesValid = false;
    }

    return filesValid;
  }

  /**
   * Test a single scenario
   */
  async testScenario(index) {
    const choice = this.scenarios[index];
    const name = this.scenarioNames[index];

    this.printHeader(`Testing Scenario ${choice}: ${name}`);

    try {
      // Setup test directory
      this.printTest('Setting up test directory');
      const testDir = await this.setupTestDir(name.toLowerCase());
      this.printPass('Test directory created');

      // Run installation
      this.printTest('Running installation');
      const success = await this.runInstallation(choice, testDir);

      if (success) {
        this.printPass('Installation completed');

        // Verify core files
        this.printTest('Verifying core files');
        await this.verifyCoreFiles(testDir, name);

        // Verify scenario-specific files
        this.printTest('Verifying scenario-specific files');
        await this.verifyScenarioFiles(testDir, name);
      } else {
        this.printFail('Installation failed');
      }

      // Cleanup
      if (process.env.KEEP_TEST_DIRS !== '1') {
        await fs.remove(testDir).catch(() => {});
      }

    } catch (error) {
      this.printFail(`${name}: ${error.message}`);
    }
  }

  /**
   * Display test summary
   */
  displaySummary() {
    this.printHeader('Test Summary');

    console.log(`${colors.green('Passed:')} ${this.passed} tests`);
    console.log(`${colors.red('Failed:')} ${this.failed} tests`);

    if (this.results.length > 0) {
      console.log('');
      console.log('Failed tests:');
      for (const result of this.results) {
        console.log(`  ${result}`);
      }
    }

    const totalTests = this.passed + this.failed;
    const passRate = totalTests > 0 ? Math.round((this.passed / totalTests) * 100) : 0;

    console.log('');
    console.log(`Pass rate: ${passRate}%`);

    if (this.failed === 0) {
      console.log('');
      console.log(colors.green('✅ All integration tests passed!'));
    } else {
      console.log('');
      console.log(colors.red('❌ Some integration tests failed'));
    }
  }

  /**
   * Main test execution
   */
  async run() {
    this.printHeader('ClaudeAutoPM Integration Tests');

    // Check if install script exists
    if (!await fs.pathExists(this.installScript)) {
      console.error(colors.red('Error: Install script not found at'), this.installScript);
      process.exit(1);
    }

    // Parse command line arguments
    const args = process.argv.slice(2);
    let scenariosToTest = [0, 1, 2, 3]; // All scenarios by default

    if (args.includes('--scenario')) {
      const scenarioArg = args[args.indexOf('--scenario') + 1];
      if (scenarioArg === 'minimal') scenariosToTest = [0];
      else if (scenarioArg === 'docker') scenariosToTest = [1];
      else if (scenarioArg === 'devops') scenariosToTest = [2];
      else if (scenarioArg === 'performance') scenariosToTest = [3];
    }

    if (args.includes('--quick')) {
      scenariosToTest = [0, 2]; // Just test Minimal and Full DevOps
    }

    // Create base directory
    await fs.ensureDir(this.testBaseDir);

    // Run tests for selected scenarios
    for (const index of scenariosToTest) {
      await this.testScenario(index);
    }

    // Display summary
    this.displaySummary();

    // Cleanup base directory
    if (process.env.KEEP_TEST_DIRS !== '1') {
      await fs.remove(this.testBaseDir).catch(() => {});
    }

    // Exit with appropriate code
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.run().catch(error => {
    console.error(colors.red('Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = IntegrationTestRunner;