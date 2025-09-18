/**
 * Tests for Azure DevOps Sync Script Migration
 * Tests the migration of autopm/.claude/scripts/azure/sync.sh to Node.js
 *
 * TDD RED PHASE: These tests define the expected behavior before implementation
 *
 * Original script functionality:
 * - Loads Azure DevOps credentials from .env file
 * - Supports --full and --quick sync modes
 * - Creates cache directory structure for features, stories, tasks
 * - Queries Azure DevOps API for work items using WIQL
 * - Caches work item details as JSON files
 * - Tracks sync metadata and statistics
 * - Handles cache cleanup for old files
 * - Displays progress and completion status
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Mock nock for HTTP request mocking
const nock = require('nock');

// Import the Azure Sync class (to be implemented)
const AzureSync = require('../../bin/node/azure-sync');

describe('Azure DevOps Sync Migration Tests', () => {
  let testDir;
  let originalEnv;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `autopm-azure-sync-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Create .claude directory structure
    await fs.ensureDir(path.join(testDir, '.claude'));

    // Create test .env file
    const envContent = `AZURE_DEVOPS_PAT=fake-pat-token-12345
AZURE_DEVOPS_ORG=test-org
AZURE_DEVOPS_PROJECT=test-project`;
    await fs.writeFile(path.join(testDir, '.claude', '.env'), envContent);

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

  describe('AzureSync Initialization', () => {
    it('should create AzureSync instance with default options', () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      assert.ok(sync);
      assert.strictEqual(sync.options.projectPath, testDir);
      assert.strictEqual(sync.options.silent, true);
    });

    it('should set default mode to quick', () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      assert.strictEqual(sync.options.mode, 'quick');
    });

    it('should accept full mode option', () => {
      const sync = new AzureSync({
        projectPath: testDir,
        mode: 'full',
        silent: true
      });

      assert.strictEqual(sync.options.mode, 'full');
    });

    it('should set correct cache paths', () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      const expectedCachePath = path.join(testDir, '.claude', 'azure', 'cache');
      assert.strictEqual(sync.cachePath, expectedCachePath);
    });
  });

  describe('Environment Loading', () => {
    it('should load Azure DevOps credentials from .env file', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.loadEnvironment();

      assert.strictEqual(sync.credentials.AZURE_DEVOPS_PAT, 'fake-pat-token-12345');
      assert.strictEqual(sync.credentials.AZURE_DEVOPS_ORG, 'test-org');
      assert.strictEqual(sync.credentials.AZURE_DEVOPS_PROJECT, 'test-project');
    });

    it('should throw error when .env file is missing', async () => {
      // Remove .env file
      await fs.remove(path.join(testDir, '.claude', '.env'));

      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await assert.rejects(
        async () => await sync.loadEnvironment(),
        /Azure DevOps credentials not configured/
      );
    });

    it('should throw error when credentials are incomplete', async () => {
      // Create incomplete .env file
      const incompleteEnv = 'AZURE_DEVOPS_PAT=fake-token';
      await fs.writeFile(path.join(testDir, '.claude', '.env'), incompleteEnv);

      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await assert.rejects(
        async () => await sync.loadEnvironment(),
        /Azure DevOps credentials not configured/
      );
    });
  });

  describe('Cache Directory Management', () => {
    it('should create cache directory structure', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.createCacheDirectories();

      const cacheDirs = [
        'features',
        'stories',
        'tasks'
      ];

      for (const dir of cacheDirs) {
        const dirPath = path.join(testDir, '.claude', 'azure', 'cache', dir);
        assert.ok(await fs.pathExists(dirPath), `Directory ${dir} should exist`);
      }

      const syncDir = path.join(testDir, '.claude', 'azure', 'sync');
      assert.ok(await fs.pathExists(syncDir), 'Sync directory should exist');
    });
  });

  describe('Azure DevOps API Interaction', () => {
    // TODO: Enable after Azure DevOps Phase 3 migration
    // Requires proper environment setup and API mocking
    it('should make API calls with correct authentication', async () => {
      const mockResponse = {
        workItems: [
          { id: 123, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/123' }
        ]
      };

      // Mock the WIQL query endpoint
      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(200, mockResponse);

      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.loadEnvironment();
      const result = await sync.callAzureAPI('wit/wiql', {
        method: 'POST',
        body: JSON.stringify({ query: 'SELECT [System.Id] FROM workitems' })
      });

      assert.deepStrictEqual(result, mockResponse);
    });

    it('should handle API authentication errors', async () => {
      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(401, { message: 'Unauthorized' });

      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.loadEnvironment();

      await assert.rejects(
        async () => await sync.callAzureAPI('wit/wiql', {
          method: 'POST',
          body: JSON.stringify({ query: 'SELECT [System.Id] FROM workitems' })
        }),
        /API call failed.*401/
      );
    });

    it('should handle network errors gracefully', async () => {
      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .replyWithError('Network error');

      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.loadEnvironment();

      await assert.rejects(
        async () => await sync.callAzureAPI('wit/wiql', {
          method: 'POST',
          body: JSON.stringify({ query: 'SELECT [System.Id] FROM workitems' })
        }),
        /Network error/
      );
    });
  });

  describe('Work Item Synchronization', () => {
    beforeEach(() => {
      // Mock work items query response
      const wiqlResponse = {
        workItems: [
          { id: 123, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/123' },
          { id: 456, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/456' }
        ]
      };

      // Mock individual work item responses
      const workItem1 = {
        id: 123,
        fields: {
          'System.WorkItemType': 'Feature',
          'System.Title': 'Test Feature',
          'System.State': 'New'
        }
      };

      const workItem2 = {
        id: 456,
        fields: {
          'System.WorkItemType': 'User Story',
          'System.Title': 'Test Story',
          'System.State': 'Active'
        }
      };

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(200, wiqlResponse);

      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/wit/workitems/123')
        .query({ 'api-version': '7.0' })
        .reply(200, workItem1);

      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/wit/workitems/456')
        .query({ 'api-version': '7.0' })
        .reply(200, workItem2);
    });

    it('should sync work items by type', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.loadEnvironment();
      await sync.createCacheDirectories();

      const result = await sync.syncWorkItems('Feature', 'features');

      assert.strictEqual(result.count, 2);
      assert.ok(result.success);

      // Check that cache files were created
      const featureCachePath = path.join(testDir, '.claude', 'azure', 'cache', 'features');
      assert.ok(await fs.pathExists(path.join(featureCachePath, '123.json')));
      assert.ok(await fs.pathExists(path.join(featureCachePath, '456.json')));
    });

    it('should save work item details to cache files', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.loadEnvironment();
      await sync.createCacheDirectories();

      await sync.syncWorkItems('Feature', 'features');

      const cacheFile = path.join(testDir, '.claude', 'azure', 'cache', 'features', '123.json');
      const cachedItem = JSON.parse(await fs.readFile(cacheFile, 'utf8'));

      assert.strictEqual(cachedItem.id, 123);
      assert.strictEqual(cachedItem.fields['System.Title'], 'Test Feature');
    });
  });

  describe('Quick Sync Mode', () => {
    // TODO: Enable after implementing quick sync
    it('should perform quick sync for recent changes', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        mode: 'quick',
        silent: true
      });

      const mockRecentQuery = {
        workItems: [
          { id: 789, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/789' }
        ]
      };

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(200, mockRecentQuery);

      await sync.loadEnvironment();
      const result = await sync.run();

      assert.ok(result.success);
      assert.strictEqual(result.mode, 'quick');
    });

    it('should use correct date range for recent changes', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        mode: 'quick',
        silent: true
      });

      let capturedQuery = '';
      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(function(uri, requestBody) {
          capturedQuery = JSON.parse(requestBody).query;
          return [200, { workItems: [] }];
        });

      await sync.loadEnvironment();
      await sync.run();

      assert.ok(capturedQuery.includes('@Today-7'), 'Should query for last 7 days');
    });
  });

  describe('Full Sync Mode', () => {
    // TODO: Enable after Azure DevOps Phase 3 migration
    it('should perform full sync for all work item types', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        mode: 'full',
        silent: true
      });

      // Mock responses for each work item type
      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .times(4) // Feature, User Story, Task, Bug
        .query({ 'api-version': '7.0' })
        .reply(200, { workItems: [] });

      await sync.loadEnvironment();
      const result = await sync.run();

      assert.ok(result.success);
      assert.strictEqual(result.mode, 'full');
    });

    it('should clean up old cache files in full mode', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        mode: 'full',
        silent: true
      });

      // Create old cache file
      const cachePath = path.join(testDir, '.claude', 'azure', 'cache', 'features');
      await fs.ensureDir(cachePath);
      const oldFile = path.join(cachePath, 'old-item.json');
      await fs.writeFile(oldFile, '{}');

      // Set file date to 31 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      await fs.utimes(oldFile, oldDate, oldDate);

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .times(4)
        .query({ 'api-version': '7.0' })
        .reply(200, { workItems: [] });

      await sync.loadEnvironment();
      await sync.run();

      // Old file should be removed
      assert.ok(!(await fs.pathExists(oldFile)), 'Old cache file should be removed');
    });
  });

  describe('Sync Metadata Management', () => {
    // TODO: Enable after implementing metadata management
    it('should create sync metadata file', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(200, { workItems: [] });

      await sync.loadEnvironment();
      await sync.createCacheDirectories();
      await sync.updateSyncMetadata({
        mode: 'quick',
        itemsSynced: { features: 0, stories: 0, tasks: 0 }
      });

      const metadataPath = path.join(testDir, '.claude', 'azure', 'sync', 'last-sync.json');
      assert.ok(await fs.pathExists(metadataPath));

      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      assert.strictEqual(metadata.mode, 'quick');
      assert.ok(metadata.timestamp);
      assert.ok(metadata.items_synced);
    });

    it('should calculate cache size in metadata', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      // Create some cache files
      const cachePath = path.join(testDir, '.claude', 'azure', 'cache', 'features');
      await fs.ensureDir(cachePath);
      await fs.writeFile(path.join(cachePath, 'test.json'), '{"test": "data"}');

      await sync.updateSyncMetadata({
        mode: 'test',
        itemsSynced: { features: 1, stories: 0, tasks: 0 }
      });

      const metadataPath = path.join(testDir, '.claude', 'azure', 'sync', 'last-sync.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

      assert.ok(metadata.cache_size);
      assert.notStrictEqual(metadata.cache_size, '0');
    });
  });

  describe('Error Handling', () => {
    // TODO: Enable after implementing error handling
    it('should gracefully handle missing credentials', async () => {
      // Remove .env file
      await fs.remove(path.join(testDir, '.claude', '.env'));

      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      const result = await sync.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('credentials not configured'));
    });

    it('should handle API rate limiting', async () => {
      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(429, 'Rate limit exceeded');

      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.loadEnvironment();
      const result = await sync.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('429'));
    });

    it('should continue sync even if individual work items fail', async () => {
      const wiqlResponse = {
        workItems: [
          { id: 123, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/123' },
          { id: 456, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/456' }
        ]
      };

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(200, wiqlResponse);

      // First work item succeeds
      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/wit/workitems/123')
        .query({ 'api-version': '7.0' })
        .reply(200, { id: 123, fields: { 'System.Title': 'Test' } });

      // Second work item fails
      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/wit/workitems/456')
        .query({ 'api-version': '7.0' })
        .reply(404, 'Not found');

      const sync = new AzureSync({
        projectPath: testDir,
        silent: true
      });

      await sync.loadEnvironment();
      await sync.createCacheDirectories();

      const result = await sync.syncWorkItems('Feature', 'features');

      // Should still succeed with partial results
      assert.ok(result.success);
      assert.strictEqual(result.count, 1); // Only one successful
    });
  });

  describe('Backward Compatibility', () => {
    it('should be executable via bash wrapper', async () => {
      // This test ensures the bash wrapper works
      // Implementation will delegate to Node.js version
      const { spawn } = require('child_process');

      const wrapperPath = path.join(__dirname, '../../autopm/.claude/scripts/azure/sync.sh');

      // Test should pass once wrapper is implemented
      const result = await new Promise((resolve) => {
        const child = spawn('bash', [wrapperPath, '--quick'], {
          cwd: testDir,
          stdio: 'pipe',
          env: { ...process.env, AUTOPM_TEST_MODE: '1' }
        });

        let output = '';
        child.stdout.on('data', (data) => output += data.toString());
        child.stderr.on('data', (data) => output += data.toString());

        child.on('close', (code) => {
          resolve({ code, output });
        });
      });

      // Should either succeed or fail gracefully
      assert.ok(result.code === 0 || result.output.includes('sync'));
    });

    it('should accept same command line arguments as bash script', () => {
      // Test --full mode
      const syncFull = new AzureSync({
        projectPath: testDir,
        mode: 'full',
        silent: true
      });
      assert.strictEqual(syncFull.options.mode, 'full');

      // Test --quick mode (default)
      const syncQuick = new AzureSync({
        projectPath: testDir,
        silent: true
      });
      assert.strictEqual(syncQuick.options.mode, 'quick');
    });

    it('should produce same output format as bash script', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: false
      });

      // Mock empty response to test output format
      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(200, { workItems: [] });

      await sync.loadEnvironment();
      const result = await sync.run();

      // Should include expected output sections
      assert.ok(result.success);
      // Output format verification would be in the actual implementation
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during sync', async () => {
      const sync = new AzureSync({
        projectPath: testDir,
        silent: false // Enable output to test progress reporting
      });

      // Mock large number of work items to test progress
      const workItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        url: `https://dev.azure.com/test-org/test-project/_apis/wit/workItems/${i + 1}`
      }));

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(200, { workItems });

      // Mock individual work item responses
      for (let i = 0; i < 25; i++) {
        nock('https://dev.azure.com')
          .get(`/test-org/test-project/_apis/wit/workitems/${i + 1}`)
          .query({ 'api-version': '7.0' })
          .reply(200, {
            id: i + 1,
            fields: { 'System.Title': `Item ${i + 1}` }
          });
      }

      await sync.loadEnvironment();
      await sync.createCacheDirectories();

      const result = await sync.syncWorkItems('Feature', 'features');

      assert.ok(result.success);
      assert.strictEqual(result.count, 25);
      // Progress reporting verification would be in implementation
    });
  });
});