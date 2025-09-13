#!/usr/bin/env node

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

/**
 * Non-Interactive Installation Test Suite
 *
 * Tests command-line parameters for fully automated installation
 */

class NonInteractiveInstallTester {
  constructor() {
    this.testDir = null;
    this.originalCwd = process.cwd();
    this.packageRoot = this.originalCwd;
    this.autopmBin = path.join(this.packageRoot, 'bin', 'autopm.js');
  }

  async setup() {
    this.testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopm-non-interactive-'));
    process.chdir(this.testDir);
  }

  async cleanup() {
    process.chdir(this.originalCwd);
    if (this.testDir) {
      await fs.rm(this.testDir, { recursive: true, force: true });
    }
  }

  runAutopmInstall(args = '') {
    const result = execSync(`node ${this.autopmBin} install ${args}`, {
      cwd: this.testDir,
      encoding: 'utf8',
      stdio: 'pipe',
      env: {
        ...process.env,
        AUTOPM_PACKAGE_ROOT: this.packageRoot
      }
    });
    return result;
  }

  async testMinimalNonInteractive() {
    const output = this.runAutopmInstall('--yes --config minimal --no-env --no-hooks');

    // Should NOT have any prompts
    assert(
      !output.includes('Your choice [1-5]:'),
      'Should not prompt for configuration choice'
    );

    assert(
      !output.includes('Would you like to set up your .env'),
      'Should not prompt for .env setup'
    );

    assert(
      !output.includes('Would you like to install git hooks'),
      'Should not prompt for git hooks'
    );

    // Should show preset configuration messages
    assert(
      output.includes('Using preset configuration: minimal') || output.includes('auto-accepted'),
      'Should indicate non-interactive mode'
    );

    // Should have minimal configuration
    const configFile = path.join(this.testDir, '.claude', 'config.json');
    const configExists = await fs.access(configFile).then(() => true).catch(() => false);
    assert(configExists, 'Config file should be created');

    const config = JSON.parse(await fs.readFile(configFile, 'utf8'));
    assert.strictEqual(config.execution_strategy.mode, 'sequential', 'Should use minimal/sequential config');

    return { passed: true };
  }

  async testDevOpsNonInteractive() {
    const output = this.runAutopmInstall('--yes -c devops --no-env');

    // Should use DevOps configuration
    assert(
      output.includes('Using preset configuration: devops') || output.includes('Full DevOps'),
      'Should indicate DevOps configuration'
    );

    // Should skip .env but still ask about hooks (unless --no-hooks)
    assert(
      output.includes('Skipping .env setup (--no-env flag)'),
      'Should skip .env setup with flag'
    );

    // Verify DevOps config
    const config = JSON.parse(await fs.readFile(path.join(this.testDir, '.claude', 'config.json'), 'utf8'));
    assert(config.docker && config.docker.enabled, 'DevOps config should have Docker enabled');
    assert(config.kubernetes && config.kubernetes.enabled, 'DevOps config should have Kubernetes enabled');

    return { passed: true };
  }

  async testPerformanceNonInteractive() {
    const output = this.runAutopmInstall('-y --config performance');

    // Should use Performance configuration
    assert(
      output.includes('Using preset configuration: performance') || output.includes('Performance'),
      'Should indicate Performance configuration'
    );

    // Verify performance config
    const config = JSON.parse(await fs.readFile(path.join(this.testDir, '.claude', 'config.json'), 'utf8'));
    assert.strictEqual(config.execution_strategy.mode, 'hybrid', 'Performance config should use hybrid mode');

    return { passed: true };
  }

  async testInvalidPreset() {
    const output = this.runAutopmInstall('--yes --config invalid-preset');

    // Should warn about invalid preset and use default
    assert(
      output.includes('Unknown preset') || output.includes('Using devops'),
      'Should handle invalid preset gracefully'
    );

    return { passed: true };
  }
}

describe('Non-Interactive Installation', () => {
  let tester;

  beforeEach(async () => {
    tester = new NonInteractiveInstallTester();
    await tester.setup();
  });

  afterEach(async () => {
    await tester.cleanup();
  });

  it('should support minimal non-interactive installation', async () => {
    const result = await tester.testMinimalNonInteractive();
    assert(result.passed, 'Minimal non-interactive installation should work');
    console.log('✓ Minimal non-interactive: --yes --config minimal --no-env --no-hooks');
  });

  it('should support DevOps non-interactive installation', async () => {
    const result = await tester.testDevOpsNonInteractive();
    assert(result.passed, 'DevOps non-interactive installation should work');
    console.log('✓ DevOps non-interactive: --yes -c devops --no-env');
  });

  it('should support Performance non-interactive installation', async () => {
    const result = await tester.testPerformanceNonInteractive();
    assert(result.passed, 'Performance non-interactive installation should work');
    console.log('✓ Performance non-interactive: -y --config performance');
  });

  it('should handle invalid presets gracefully', async () => {
    const result = await tester.testInvalidPreset();
    assert(result.passed, 'Should handle invalid presets');
    console.log('✓ Invalid preset handling works');
  });
});

// Allow running directly
if (require.main === module) {
  console.log('🧪 Running Non-Interactive Installation Tests...\n');

  const runManualTest = async () => {
    const tester = new NonInteractiveInstallTester();
    await tester.setup();

    try {
      console.log('🏃 Testing minimal non-interactive...');
      await tester.testMinimalNonInteractive();
      console.log('✓ Minimal installation works\n');

      await tester.cleanup();
      await tester.setup();

      console.log('🚀 Testing DevOps non-interactive...');
      await tester.testDevOpsNonInteractive();
      console.log('✓ DevOps installation works\n');

      await tester.cleanup();
      await tester.setup();

      console.log('⚡ Testing Performance non-interactive...');
      await tester.testPerformanceNonInteractive();
      console.log('✓ Performance installation works\n');

      console.log('🎉 All non-interactive tests passed!');

    } catch (error) {
      console.error('❌ Test error:', error.message);
    } finally {
      await tester.cleanup();
    }
  };

  runManualTest();
}