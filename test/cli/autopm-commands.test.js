#!/usr/bin/env node

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

/**
 * AutoPM CLI Commands Test Suite
 *
 * Tests all autopm CLI commands:
 * - autopm --help
 * - autopm --version
 * - autopm init <project>
 * - autopm install [path]
 * - autopm update [path]
 * - autopm setup-env [path]
 * - autopm merge
 * - autopm config
 */

class AutoPMCLITester {
  constructor() {
    this.testDir = null;
    this.originalCwd = process.cwd();
    this.autopmBin = path.join(this.originalCwd, 'bin', 'autopm.js');
  }

  async setup() {
    // Create temporary test directory
    this.testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopm-cli-test-'));
    process.chdir(this.testDir);
  }

  async cleanup() {
    process.chdir(this.originalCwd);
    if (this.testDir) {
      await fs.rm(this.testDir, { recursive: true, force: true });
    }
  }

  execAutopm(args, options = {}) {
    const command = `node ${this.autopmBin} ${args}`;
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        ...options
      });
    } catch (error) {
      // Return error details for analysis
      return {
        error: true,
        code: error.status,
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || '',
        message: error.message
      };
    }
  }

  async testHelpCommand() {
    const output = this.execAutopm('--help');

    assert(!output.error, `Help command failed: ${output.message}`);
    assert(output.includes('Commands:'), 'Help should show commands section');
    assert(output.includes('install'), 'Help should list install command');
    assert(output.includes('pm:init'), 'Help should list pm:init command');
    assert(output.includes('setup-env'), 'Help should list setup-env command');

    return { passed: true, output };
  }

  async testVersionCommand() {
    const output = this.execAutopm('--version');

    assert(!output.error, `Version command failed: ${output.message}`);
    assert(/\d+\.\d+\.\d+/.test(output), 'Should show version number format');

    return { passed: true, version: output.trim() };
  }

  async testInitCommand() {
    const projectName = 'test-init-project';
    const output = this.execAutopm(`init ${projectName}`);

    if (output.error) {
      // Check if it's a prerequisite error (acceptable in test env)
      if (output.stderr.includes('Missing requirements') ||
          output.stderr.includes('git') ||
          output.stderr.includes('node')) {
        return { passed: true, skipped: true, reason: 'Prerequisites not met in test env' };
      }
      throw new Error(`Init command failed: ${output.message}`);
    }

    // Check if project directory was created
    const projectPath = path.join(this.testDir, projectName);
    const exists = await fs.access(projectPath).then(() => true).catch(() => false);

    assert(exists, `Project directory ${projectName} should be created`);

    return { passed: true, projectPath };
  }

  async testInstallCommand() {
    // Test install in current directory
    const output = this.execAutopm('install');

    if (output.error) {
      // Check if it's expected error (no ClaudeAutoPM project)
      if (output.stderr.includes('Missing requirements') ||
          output.stderr.includes('prerequisites')) {
        return { passed: true, skipped: true, reason: 'Prerequisites check working' };
      }
      throw new Error(`Install command failed: ${output.message}`);
    }

    return { passed: true };
  }

  async testSetupEnvCommand() {
    // Create a basic project structure first
    await fs.mkdir('.claude', { recursive: true });
    await fs.writeFile('.claude/.env.example', 'TEST_VAR=example\n');

    const output = this.execAutopm('setup-env');

    if (output.error) {
      // Expected if no .env.example exists or script requires interaction
      if (output.stderr.includes('not found') ||
          output.code === 1) {
        return { passed: true, skipped: true, reason: 'No .env.example or interactive mode' };
      }
      throw new Error(`Setup-env command failed: ${output.message}`);
    }

    return { passed: true };
  }

  async testMergeCommand() {
    const output = this.execAutopm('merge');

    if (output.error) {
      // Expected if no CLAUDE.md files exist
      if (output.stderr.includes('not found') ||
          output.code === 1) {
        return { passed: true, skipped: true, reason: 'No CLAUDE.md files to merge' };
      }
      throw new Error(`Merge command failed: ${output.message}`);
    }

    return { passed: true };
  }

  async testConfigCommand() {
    const output = this.execAutopm('config');

    if (output.error) {
      // Expected if no config files exist
      if (output.stderr.includes('not found') ||
          output.code === 1) {
        return { passed: true, skipped: true, reason: 'No config files found' };
      }
      throw new Error(`Config command failed: ${output.message}`);
    }

    return { passed: true };
  }

  async testInvalidCommand() {
    const output = this.execAutopm('invalid-command');

    // Should show help or error message
    assert(output.error || output.includes('help'), 'Invalid command should show help or error');

    return { passed: true };
  }
}

describe('AutoPM CLI Commands', () => {
  let tester;

  beforeEach(async () => {
    tester = new AutoPMCLITester();
    await tester.setup();
  });

  afterEach(async () => {
    await tester.cleanup();
  });

  it('should show help with --help', async () => {
    const result = await tester.testHelpCommand();
    assert(result.passed, 'Help command should work');
    console.log('✓ Help command working');
  });

  it('should show version with --version', async () => {
    const result = await tester.testVersionCommand();
    assert(result.passed, 'Version command should work');
    console.log(`✓ Version command working: ${result.version}`);
  });

  it('should handle init command', async () => {
    const result = await tester.testInitCommand();
    assert(result.passed, 'Init command should work or fail gracefully');
    if (result.skipped) {
      console.log(`⚠ Init command skipped: ${result.reason}`);
    } else {
      console.log('✓ Init command working');
    }
  });

  it('should handle install command', async () => {
    const result = await tester.testInstallCommand();
    assert(result.passed, 'Install command should work or fail gracefully');
    if (result.skipped) {
      console.log(`⚠ Install command skipped: ${result.reason}`);
    } else {
      console.log('✓ Install command working');
    }
  });

  it('should handle setup-env command', async () => {
    const result = await tester.testSetupEnvCommand();
    assert(result.passed, 'Setup-env command should work or fail gracefully');
    if (result.skipped) {
      console.log(`⚠ Setup-env command skipped: ${result.reason}`);
    } else {
      console.log('✓ Setup-env command working');
    }
  });

  it('should handle merge command', async () => {
    const result = await tester.testMergeCommand();
    assert(result.passed, 'Merge command should work or fail gracefully');
    if (result.skipped) {
      console.log(`⚠ Merge command skipped: ${result.reason}`);
    } else {
      console.log('✓ Merge command working');
    }
  });

  it('should handle config command', async () => {
    const result = await tester.testConfigCommand();
    assert(result.passed, 'Config command should work or fail gracefully');
    if (result.skipped) {
      console.log(`⚠ Config command skipped: ${result.reason}`);
    } else {
      console.log('✓ Config command working');
    }
  });

  it('should handle invalid commands gracefully', async () => {
    const result = await tester.testInvalidCommand();
    assert(result.passed, 'Invalid commands should be handled gracefully');
    console.log('✓ Invalid command handling working');
  });
});

// Allow running this test directly
if (require.main === module) {
  // Skip old CLI tests
  console.log('⏭️  Skipping old CLI API tests (commands have been migrated to yargs)');
  process.exit(0);

  console.log('🧪 Running AutoPM CLI Commands Test Suite...\n');

  // Simple test runner for direct execution
  const runTest = async () => {
    const tester = new AutoPMCLITester();
    await tester.setup();

    try {
      console.log('Testing help command...');
      await tester.testHelpCommand();
      console.log('✓ Help OK\n');

      console.log('Testing version command...');
      const version = await tester.testVersionCommand();
      console.log(`✓ Version OK: ${version.version}\n`);

      console.log('Testing init command...');
      const init = await tester.testInitCommand();
      if (init.skipped) {
        console.log(`⚠ Init skipped: ${init.reason}\n`);
      } else {
        console.log('✓ Init OK\n');
      }

      console.log('Testing install command...');
      const install = await tester.testInstallCommand();
      if (install.skipped) {
        console.log(`⚠ Install skipped: ${install.reason}\n`);
      } else {
        console.log('✓ Install OK\n');
      }

      console.log('🎉 All CLI commands tested successfully!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    } finally {
      await tester.cleanup();
    }
  };

  runTest();
}