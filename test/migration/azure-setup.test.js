/**
 * Tests for Azure DevOps Setup Script Migration
 * Tests the migration of autopm/.claude/scripts/azure/setup.sh to Node.js
 *
 * TDD RED PHASE: These tests define the expected behavior before implementation
 *
 * Original script functionality:
 * - Creates/manages .claude/.env file with Azure DevOps credentials
 * - Interactive prompts for PAT, organization, and project details
 * - Connection testing via Azure DevOps API
 * - Directory structure creation
 * - YAML configuration file generation
 * - Permission management on scripts
 * - Initial sync attempt
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Mock nock for HTTP request mocking
const nock = require('nock');

// Import the Azure Setup class (to be implemented)
const AzureSetup = require('../../bin/node/azure-setup');

describe('Azure DevOps Setup Migration Tests', () => {
  let testDir;
  let originalEnv;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `autopm-azure-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Backup original environment
    originalEnv = { ...process.env };

    // Clean up HTTP mocks
    nock.cleanAll();
  });

  afterEach(async () => {
    // Restore environment
    process.env = originalEnv;

    // Clean up test directory
    await fs.remove(testDir);

    // Clean up HTTP mocks
    nock.cleanAll();
  });

  describe('AzureSetup Initialization', () => {
    it('should create AzureSetup instance with default options', () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        silent: true
      });

      assert.ok(setup);
      assert.strictEqual(setup.options.projectPath, testDir);
      assert.strictEqual(setup.options.interactive, true);
      assert.strictEqual(setup.options.silent, true);
    });

    it('should set correct paths for configuration files', () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        silent: true
      });

      const expectedEnvPath = path.join(testDir, '.claude', '.env');
      const expectedConfigPath = path.join(testDir, '.claude', 'azure', 'config.yml');

      assert.strictEqual(setup.envPath, expectedEnvPath);
      assert.strictEqual(setup.configPath, expectedConfigPath);
    });

    it('should initialize with non-interactive mode', () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      assert.strictEqual(setup.options.interactive, false);
    });
  });

  describe('Environment File Management', () => {
    it('should detect missing .env file', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      const exists = await setup.envFileExists();
      assert.strictEqual(exists, false);
    });

    it('should create .env file from .env.example if available', async () => {
      // Create .env.example file
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);

      const exampleContent = 'AZURE_DEVOPS_PAT=\nAZURE_DEVOPS_ORG=\nAZURE_DEVOPS_PROJECT=\n';
      await fs.writeFile(path.join(claudeDir, '.env.example'), exampleContent);

      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      await setup.createEnvFromExample();

      const envExists = await fs.pathExists(path.join(claudeDir, '.env'));
      assert.strictEqual(envExists, true);

      const envContent = await fs.readFile(path.join(claudeDir, '.env'), 'utf8');
      assert.strictEqual(envContent, exampleContent);
    });

    it('should load existing environment variables', async () => {
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);

      const envContent = 'AZURE_DEVOPS_PAT=test_pat_123\nAZURE_DEVOPS_ORG=testorg\nAZURE_DEVOPS_PROJECT=testproject\n';
      await fs.writeFile(path.join(claudeDir, '.env'), envContent);

      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      await setup.loadExistingEnv();

      assert.strictEqual(setup.envVars.AZURE_DEVOPS_PAT, 'test_pat_123');
      assert.strictEqual(setup.envVars.AZURE_DEVOPS_ORG, 'testorg');
      assert.strictEqual(setup.envVars.AZURE_DEVOPS_PROJECT, 'testproject');
    });
  });

  describe('Interactive Prompts', () => {
    it('should prompt for missing Azure DevOps PAT', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        silent: true
      });

      // Mock inquirer prompt
      const mockPrompt = mock.fn(() => Promise.resolve({
        AZURE_DEVOPS_PAT: 'new_pat_token',
        AZURE_DEVOPS_ORG: 'neworg',
        AZURE_DEVOPS_PROJECT: 'newproject'
      }));

      setup.prompt = mockPrompt;

      await setup.collectCredentials();

      assert.strictEqual(mockPrompt.mock.callCount(), 1);
      assert.strictEqual(setup.envVars.AZURE_DEVOPS_PAT, 'new_pat_token');
      assert.strictEqual(setup.envVars.AZURE_DEVOPS_ORG, 'neworg');
      assert.strictEqual(setup.envVars.AZURE_DEVOPS_PROJECT, 'newproject');
    });

    it('should skip prompts for existing values', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        silent: true
      });

      // Pre-populate environment variables
      setup.envVars = {
        AZURE_DEVOPS_PAT: 'existing_pat',
        AZURE_DEVOPS_ORG: 'existingorg',
        AZURE_DEVOPS_PROJECT: 'existingproject'
      };

      const mockPrompt = mock.fn();
      setup.prompt = mockPrompt;

      await setup.collectCredentials();

      // Should not prompt for existing values
      assert.strictEqual(mockPrompt.mock.callCount(), 0);
    });

    it('should handle secret input for PAT token', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        silent: true
      });

      const mockPrompt = mock.fn((questions) => {
        // Verify PAT input is configured as password
        const patQuestion = questions.find(q => q.name === 'AZURE_DEVOPS_PAT');
        assert.strictEqual(patQuestion.type, 'password');
        assert.strictEqual(patQuestion.mask, '*');

        return Promise.resolve({
          AZURE_DEVOPS_PAT: 'secret_pat_token'
        });
      });

      setup.prompt = mockPrompt;

      await setup.collectCredentials();

      assert.strictEqual(setup.envVars.AZURE_DEVOPS_PAT, 'secret_pat_token');
    });
  });

  describe('Azure DevOps API Connection Testing', () => {
    // TODO: Enable after Azure DevOps Phase 3 migration
    // Requires proper environment setup and API mocking
    it('should test connection with valid credentials', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_PAT: 'valid_pat_token',
        AZURE_DEVOPS_ORG: 'testorg',
        AZURE_DEVOPS_PROJECT: 'testproject'
      };

      // Mock successful API response
      nock('https://dev.azure.com')
        .get('/testorg/_apis/projects/testproject')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'valid_pat_token')
        .reply(200, {
          name: 'testproject',
          id: 'project-id-123',
          description: 'Test project'
        });

      const result = await setup.testConnection();

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.projectName, 'testproject');
    });

    it('should handle connection failure with invalid credentials', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_PAT: 'invalid_pat_token',
        AZURE_DEVOPS_ORG: 'testorg',
        AZURE_DEVOPS_PROJECT: 'testproject'
      };

      // Mock failed API response
      nock('https://dev.azure.com')
        .get('/testorg/_apis/projects/testproject')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'invalid_pat_token')
        .reply(401, { message: 'Unauthorized' });

      const result = await setup.testConnection();

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 401);
    });

    it('should handle network errors gracefully', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_PAT: 'any_token',
        AZURE_DEVOPS_ORG: 'testorg',
        AZURE_DEVOPS_PROJECT: 'testproject'
      };

      // Mock network error
      nock('https://dev.azure.com')
        .get('/testorg/_apis/projects/testproject')
        .query({ 'api-version': '7.0' })
        .replyWithError('Network error');

      const result = await setup.testConnection();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Network error'));
    });
  });

  describe('Directory Structure Creation', () => {
    it('should create all required Azure directories', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      await setup.createDirectoryStructure();

      const expectedDirs = [
        '.claude/azure/cache/features',
        '.claude/azure/cache/stories',
        '.claude/azure/cache/tasks',
        '.claude/azure/user-stories',
        '.claude/azure/tasks',
        '.claude/azure/features',
        '.claude/azure/reports',
        '.claude/azure/imports',
        '.claude/azure/sync',
        '.claude/azure/archive'
      ];

      for (const dir of expectedDirs) {
        const dirPath = path.join(testDir, dir);
        const exists = await fs.pathExists(dirPath);
        assert.strictEqual(exists, true, `Directory ${dir} should exist`);
      }
    });

    it('should not overwrite existing directories', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      // Create a directory with some content
      const featuresDir = path.join(testDir, '.claude', 'azure', 'features');
      await fs.ensureDir(featuresDir);
      const testFile = path.join(featuresDir, 'existing-feature.md');
      await fs.writeFile(testFile, 'existing content');

      await setup.createDirectoryStructure();

      // Verify existing content is preserved
      const content = await fs.readFile(testFile, 'utf8');
      assert.strictEqual(content, 'existing content');
    });
  });

  describe('Configuration File Generation', () => {
    // TODO: Enable after implementing configuration generation
    it('should generate valid YAML configuration', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_ORG: 'testorg',
        AZURE_DEVOPS_PROJECT: 'testproject'
      };

      await setup.generateConfig();

      const configPath = path.join(testDir, '.claude', 'azure', 'config.yml');
      const exists = await fs.pathExists(configPath);
      assert.strictEqual(exists, true);

      const content = await fs.readFile(configPath, 'utf8');

      // Verify YAML structure
      assert.ok(content.includes('azure_devops:'));
      assert.ok(content.includes('organization: testorg'));
      assert.ok(content.includes('project: testproject'));
      assert.ok(content.includes('api_version: "7.0"'));
      assert.ok(content.includes('defaults:'));
      assert.ok(content.includes('sync:'));
      assert.ok(content.includes('git:'));
      assert.ok(content.includes('features:'));
      assert.ok(content.includes('team:'));
      assert.ok(content.includes('aliases:'));
    });

    it('should include generation timestamp', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_ORG: 'testorg',
        AZURE_DEVOPS_PROJECT: 'testproject'
      };

      await setup.generateConfig();

      const configPath = path.join(testDir, '.claude', 'azure', 'config.yml');
      const content = await fs.readFile(configPath, 'utf8');

      assert.ok(content.includes('# Generated:'));
      assert.ok(content.includes(new Date().getFullYear().toString()));
    });
  });

  describe('Script Permissions Management', () => {
    it('should set executable permissions on Azure scripts', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      // Create some test scripts
      const scriptsDir = path.join(testDir, '.claude', 'scripts', 'azure');
      await fs.ensureDir(scriptsDir);

      const scriptFiles = ['dashboard.sh', 'sync.sh', 'help.sh'];
      for (const script of scriptFiles) {
        await fs.writeFile(path.join(scriptsDir, script), '#!/bin/bash\necho "test"');
      }

      await setup.setScriptPermissions();

      // Verify permissions on non-Windows systems
      if (process.platform !== 'win32') {
        for (const script of scriptFiles) {
          const scriptPath = path.join(scriptsDir, script);
          const stats = await fs.stat(scriptPath);
          const mode = stats.mode & parseInt('777', 8);

          // Should have execute permissions
          assert.ok(mode & parseInt('100', 8), `${script} should have owner execute permission`);
        }
      }
    });

    it('should handle missing scripts directory gracefully', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      // Should not throw when scripts directory doesn't exist
      await assert.doesNotReject(async () => {
        await setup.setScriptPermissions();
      });
    });
  });

  describe('Initial Sync', () => {
    it('should attempt initial sync if sync script exists', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      // Create sync script
      const scriptsDir = path.join(testDir, '.claude', 'scripts', 'azure');
      await fs.ensureDir(scriptsDir);
      await fs.writeFile(path.join(scriptsDir, 'sync.sh'), '#!/bin/bash\necho "sync complete"');
      await fs.chmod(path.join(scriptsDir, 'sync.sh'), 0o755);

      const mockSpawn = mock.fn(() => ({
        on: mock.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        })
      }));

      setup.spawn = mockSpawn;

      await setup.performInitialSync();

      assert.strictEqual(mockSpawn.mock.callCount(), 1);
      const [command, args] = mockSpawn.mock.calls[0].arguments;
      assert.ok(command.includes('sync.sh'));
      assert.ok(args.includes('--quick'));
    });

    it('should handle sync failure gracefully', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      const mockSpawn = mock.fn(() => ({
        on: mock.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10); // Exit code 1 (failure)
          }
        })
      }));

      setup.spawn = mockSpawn;

      // Should not throw on sync failure
      await assert.doesNotReject(async () => {
        await setup.performInitialSync();
      });
    });
  });

  describe('Complete Setup Process', () => {
    // TODO: Enable after completing setup process implementation
    it('should execute complete setup with valid inputs', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_PAT: 'valid_pat_token',
        AZURE_DEVOPS_ORG: 'testorg',
        AZURE_DEVOPS_PROJECT: 'testproject'
      };

      // Mock successful connection test
      nock('https://dev.azure.com')
        .get('/testorg/_apis/projects/testproject')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'valid_pat_token')
        .reply(200, { name: 'testproject' });

      const result = await setup.run();

      assert.strictEqual(result.success, true);

      // Verify all components were created
      assert.ok(await fs.pathExists(path.join(testDir, '.claude', '.env')));
      assert.ok(await fs.pathExists(path.join(testDir, '.claude', 'azure', 'config.yml')));
      assert.ok(await fs.pathExists(path.join(testDir, '.claude', 'azure', 'cache')));
    });

    it('should fail setup with invalid credentials', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_PAT: 'invalid_pat_token',
        AZURE_DEVOPS_ORG: 'testorg',
        AZURE_DEVOPS_PROJECT: 'testproject'
      };

      // Mock failed connection test
      nock('https://dev.azure.com')
        .get('/testorg/_apis/projects/testproject')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'invalid_pat_token')
        .reply(401, { message: 'Unauthorized' });

      const result = await setup.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('401'));
    });
  });

  describe('Output Formatting and Colors', () => {
    it('should use appropriate colors in interactive mode', () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        interactive: true,
        silent: false
      });

      // Test color utilities
      assert.ok(setup.colors.green);
      assert.ok(setup.colors.yellow);
      assert.ok(setup.colors.red);
      assert.ok(setup.colors.reset);
    });

    it('should suppress colors in silent mode', () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        silent: true
      });

      // Colors should be empty strings in silent mode
      assert.strictEqual(setup.colors.green, '');
      assert.strictEqual(setup.colors.yellow, '');
      assert.strictEqual(setup.colors.red, '');
    });
  });

  describe('Environment Variable Persistence', () => {
    it('should save environment variables in correct format', async () => {
      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_PAT: 'test_pat_token',
        AZURE_DEVOPS_ORG: 'testorg',
        AZURE_DEVOPS_PROJECT: 'testproject'
      };

      await setup.saveEnvironment();

      const envPath = path.join(testDir, '.claude', '.env');
      const content = await fs.readFile(envPath, 'utf8');

      assert.ok(content.includes('AZURE_DEVOPS_PAT=test_pat_token'));
      assert.ok(content.includes('AZURE_DEVOPS_ORG=testorg'));
      assert.ok(content.includes('AZURE_DEVOPS_PROJECT=testproject'));
    });

    it('should append to existing .env file without duplicates', async () => {
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);

      // Create existing .env with some content
      const existingContent = 'GITHUB_TOKEN=existing_token\nOTHER_VAR=value\n';
      await fs.writeFile(path.join(claudeDir, '.env'), existingContent);

      const setup = new AzureSetup({
        projectPath: testDir,
        nonInteractive: true,
        silent: true
      });

      setup.envVars = {
        AZURE_DEVOPS_PAT: 'new_pat_token',
        AZURE_DEVOPS_ORG: 'neworg'
      };

      await setup.saveEnvironment();

      const content = await fs.readFile(path.join(claudeDir, '.env'), 'utf8');

      // Should contain both existing and new variables
      assert.ok(content.includes('GITHUB_TOKEN=existing_token'));
      assert.ok(content.includes('OTHER_VAR=value'));
      assert.ok(content.includes('AZURE_DEVOPS_PAT=new_pat_token'));
      assert.ok(content.includes('AZURE_DEVOPS_ORG=neworg'));
    });
  });
});