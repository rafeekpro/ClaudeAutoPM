/**
 * Tests for setup-env.js migration
 * Validates functionality parity with setup-env.sh
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Import the setup class
const EnvSetup = require('../../../bin/node/setup-env');

describe('Setup-env.js Migration Tests', () => {
  let testDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `autopm-test-env-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('EnvSetup Initialization', () => {
    it('should create EnvSetup instance', () => {
      const setup = new EnvSetup({
        path: testDir,
        silent: true
      });

      assert.ok(setup);
      assert.strictEqual(setup.options.targetPath, testDir);
      assert.strictEqual(setup.options.interactive, true);
    });

    it('should set correct env path', () => {
      const setup = new EnvSetup({
        path: testDir,
        silent: true
      });

      const expectedPath = path.join(testDir, '.claude', '.env');
      assert.strictEqual(setup.envPath, expectedPath);
    });
  });

  describe('Environment File Operations', () => {
    it('should detect missing .env file', async () => {
      const setup = new EnvSetup({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const exists = await setup.fs.exists(setup.envPath);
      assert.strictEqual(exists, false);
    });

    it('should create backup of existing .env', async () => {
      const envDir = path.join(testDir, '.claude');
      await fs.ensureDir(envDir);

      const envPath = path.join(envDir, '.env');
      await fs.writeFile(envPath, 'TEST_VAR=value\n');

      const setup = new EnvSetup({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      // Create backup
      const backupPath = await setup.fs.backup(envPath);
      assert.ok(backupPath);
      assert.ok(await fs.pathExists(backupPath));

      // Verify backup content
      const backupContent = await fs.readFile(backupPath, 'utf8');
      assert.strictEqual(backupContent, 'TEST_VAR=value\n');
    });

    it('should load existing environment variables', async () => {
      const envDir = path.join(testDir, '.claude');
      await fs.ensureDir(envDir);

      const envPath = path.join(envDir, '.env');
      const content = 'GITHUB_TOKEN=ghp_test123\nAZURE_TOKEN=azure456\n';
      await fs.writeFile(envPath, content);

      const setup = new EnvSetup({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      await setup.loadExistingEnv();

      assert.strictEqual(setup.envVars['GITHUB_TOKEN'], 'ghp_test123');
      assert.strictEqual(setup.envVars['AZURE_TOKEN'], 'azure456');
    });
  });

  describe('Token Validation', () => {
    it('should validate GitHub token formats', () => {
      const setup = new EnvSetup({
        path: testDir,
        silent: true
      });

      // Valid formats
      assert.strictEqual(
        setup.validateGitHubToken('ghp_' + 'a'.repeat(36)),
        true
      );

      assert.strictEqual(
        setup.validateGitHubToken('github_pat_' + 'a'.repeat(22) + '_' + 'b'.repeat(59)),
        true
      );

      // Invalid formats
      assert.strictEqual(
        setup.validateGitHubToken('invalid_token'),
        false
      );

      assert.strictEqual(
        setup.validateGitHubToken('ghp_tooshort'),
        false
      );
    });
  });

  describe('Environment File Generation', () => {
    it('should generate properly formatted .env file', async () => {
      const setup = new EnvSetup({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      // Set test environment variables
      setup.envVars = {
        'GITHUB_TOKEN': 'test_github_token',
        'AZURE_DEVOPS_TOKEN': 'test_azure_token',
        'AWS_ACCESS_KEY_ID': 'test_aws_key',
        'OPENAI_API_KEY': 'test_openai_key'
      };

      await setup.saveEnvironment();

      // Verify file exists
      const envPath = path.join(testDir, '.claude', '.env');
      assert.ok(await fs.pathExists(envPath));

      // Verify content
      const content = await fs.readFile(envPath, 'utf8');
      assert.ok(content.includes('GITHUB_TOKEN="test_github_token"'));
      assert.ok(content.includes('AZURE_DEVOPS_TOKEN="test_azure_token"'));
      assert.ok(content.includes('AWS_ACCESS_KEY_ID="test_aws_key"'));
      assert.ok(content.includes('OPENAI_API_KEY="test_openai_key"'));

      // Verify headers
      assert.ok(content.includes('# GitHub'));
      assert.ok(content.includes('# Azure DevOps'));
      assert.ok(content.includes('# AWS'));
      assert.ok(content.includes('# AI Services'));
    });

    it('should set secure permissions on .env file', async () => {
      const setup = new EnvSetup({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        'TEST_TOKEN': 'secret_value'
      };

      await setup.saveEnvironment();

      const envPath = path.join(testDir, '.claude', '.env');
      const stats = await fs.stat(envPath);

      // Check permissions (owner read/write only)
      // On Windows, this might be different
      if (process.platform !== 'win32') {
        const mode = stats.mode & parseInt('777', 8);
        assert.strictEqual(mode, parseInt('600', 8));
      }
    });
  });

  describe('Non-Interactive Mode', () => {
    it('should complete without prompts in non-interactive mode', async () => {
      const setup = new EnvSetup({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      // Should not throw
      await assert.doesNotReject(async () => {
        await setup.saveEnvironment();
      });
    });
  });

  describe('Configuration Summary', () => {
    it('should generate correct summary', async () => {
      const setup = new EnvSetup({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        'GITHUB_TOKEN': 'test',
        'AZURE_DEVOPS_TOKEN': 'test',
        'OPENAI_API_KEY': 'test'
      };

      // Test summary generation (should not throw)
      await assert.doesNotReject(async () => {
        await setup.showSummary();
      });
    });
  });
});