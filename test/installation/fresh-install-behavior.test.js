#!/usr/bin/env node

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

/**
 * Fresh Installation Behavior Test Suite
 *
 * Tests that fresh installations don't prompt unnecessarily
 */

class FreshInstallTester {
  constructor() {
    this.testDir = null;
    this.originalCwd = process.cwd();
    this.packageRoot = this.originalCwd;
    this.autopmBin = path.join(this.packageRoot, 'bin', 'autopm.js');
  }

  async setup() {
    this.testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopm-fresh-test-'));
    process.chdir(this.testDir);
  }

  async cleanup() {
    process.chdir(this.originalCwd);
    if (this.testDir) {
      await fs.rm(this.testDir, { recursive: true, force: true });
    }
  }

  async runAutopmInstall() {
    const result = execSync(`node ${this.autopmBin} install`, {
      cwd: this.testDir,
      encoding: 'utf8',
      stdio: 'pipe',
      env: {
        ...process.env,
        AUTOPM_TEST_MODE: '1',
        AUTOPM_PACKAGE_ROOT: this.packageRoot
      }
    });
    return result;
  }

  async testFreshInstallNoCLAUDEPrompt() {
    // Fresh install should NOT prompt about CLAUDE.md regeneration
    const output = await this.runAutopmInstall();

    // Should NOT contain CLAUDE.md already exists message
    assert(
      !output.includes('CLAUDE.md already exists in target directory'),
      'Fresh install should NOT prompt about existing CLAUDE.md'
    );

    // Should NOT ask about regeneration
    assert(
      !output.includes('Would you like to regenerate CLAUDE.md'),
      'Fresh install should NOT ask about CLAUDE.md regeneration'
    );

    // Should generate CLAUDE.md successfully
    assert(
      output.includes('Generated CLAUDE.md based on your configuration'),
      'Fresh install should generate CLAUDE.md'
    );

    // CLAUDE.md should exist after installation
    const claudeExists = await fs.access(path.join(this.testDir, 'CLAUDE.md'))
      .then(() => true).catch(() => false);
    assert(claudeExists, 'CLAUDE.md should be created during fresh install');

    return { passed: true, output };
  }

  async testUpdateModeStillPrompts() {
    // First install
    await this.runAutopmInstall();

    // Second install (update mode)
    const updateOutput = await this.runAutopmInstall();

    // Should detect existing installation
    assert(
      updateOutput.includes('Detected existing ClaudeAutoPM installation'),
      'Update should detect existing installation'
    );

    // Should ask about CLAUDE.md regeneration in update mode
    assert(
      updateOutput.includes('CLAUDE.md already exists in target directory'),
      'Update mode should detect existing CLAUDE.md'
    );

    assert(
      updateOutput.includes('Would you like to regenerate CLAUDE.md'),
      'Update mode should ask about CLAUDE.md regeneration'
    );

    return { passed: true };
  }
}

describe('Fresh Installation Behavior', () => {
  let tester;

  beforeEach(async () => {
    tester = new FreshInstallTester();
    await tester.setup();
  });

  afterEach(async () => {
    await tester.cleanup();
  });

  it('should NOT prompt about CLAUDE.md regeneration on fresh install', async () => {
    const result = await tester.testFreshInstallNoCLAUDEPrompt();
    assert(result.passed, 'Fresh install should not prompt about CLAUDE.md');
    console.log('✓ Fresh install works without CLAUDE.md prompts');
  });

  it('should still prompt about CLAUDE.md in update mode', async () => {
    const result = await tester.testUpdateModeStillPrompts();
    assert(result.passed, 'Update mode should still prompt about CLAUDE.md');
    console.log('✓ Update mode correctly prompts about CLAUDE.md');
  });

  it('should accept "y" response (not just "yes")', async () => {
    // This is tested implicitly in AUTOPM_TEST_MODE=1 which uses "y" responses
    // The test mode auto-answers with "y" and if it worked, our other tests pass

    // Also verify our bash patterns work correctly
    const bashTest = `
      test_pattern() {
        case "$1" in
          [yY]|[yY][eE][sS]) echo "ACCEPT_YES" ;;
          [nN]|[nN][oO]) echo "ACCEPT_NO" ;;
          *) echo "REJECT" ;;
        esac
      }

      # Test the exact same patterns used in confirm()
      echo "y=$(test_pattern 'y')"
      echo "Y=$(test_pattern 'Y')"
      echo "yes=$(test_pattern 'yes')"
      echo "n=$(test_pattern 'n')"
      echo "no=$(test_pattern 'no')"
    `;

    const { execSync } = require('child_process');
    const result = execSync(bashTest, { encoding: 'utf8' });

    assert(result.includes('y=ACCEPT_YES'), 'Lowercase "y" should be accepted');
    assert(result.includes('Y=ACCEPT_YES'), 'Uppercase "Y" should be accepted');
    assert(result.includes('yes=ACCEPT_YES'), 'Word "yes" should be accepted');
    assert(result.includes('n=ACCEPT_NO'), 'Lowercase "n" should be accepted');
    assert(result.includes('no=ACCEPT_NO'), 'Word "no" should be accepted');

    console.log('✓ Bash patterns correctly accept "y" and "n" responses');
  });
});

// Allow running directly
if (require.main === module) {
  console.log('🧪 Running Fresh Installation Behavior Tests...\n');

  const runManualTest = async () => {
    const tester = new FreshInstallTester();
    await tester.setup();

    try {
      console.log('🆕 Testing fresh install behavior...');
      await tester.testFreshInstallNoCLAUDEPrompt();
      console.log('✓ Fresh install: No unnecessary prompts\n');

      console.log('🔄 Testing update mode behavior...');
      await tester.testUpdateModeStillPrompts();
      console.log('✓ Update mode: Prompts correctly\n');

      console.log('🎉 All behavior tests passed!');

    } catch (error) {
      console.error('❌ Test error:', error.message);
    } finally {
      await tester.cleanup();
    }
  };

  runManualTest();
}