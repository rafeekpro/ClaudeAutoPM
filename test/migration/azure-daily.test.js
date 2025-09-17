/**
 * Tests for Azure DevOps Daily Workflow Script Migration
 * Tests the migration of autopm/.claude/scripts/azure/daily.sh to Node.js
 *
 * TDD RED PHASE: These tests define the expected behavior before implementation
 *
 * Original script functionality:
 * - Shows daily standup summary with completed tasks from yesterday
 * - Shows active work for current user (@Me)
 * - Checks for blocked items (items with 'blocked' tag)
 * - Shows current sprint status and name
 * - Suggests next highest priority task
 * - Provides quick action suggestions
 * - Uses multiple WIQL queries for different data sets
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Mock nock for HTTP request mocking
const nock = require('nock');

// Import the Azure Daily class (to be implemented)
const AzureDaily = require('../../bin/node/azure-daily');

describe('Azure DevOps Daily Workflow Migration Tests', () => {
  let testDir;
  let originalEnv;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `autopm-azure-daily-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Backup original environment
    originalEnv = { ...process.env };

    // Set test environment variables
    process.env.AZURE_DEVOPS_PAT = 'test_pat_token';
    process.env.AZURE_DEVOPS_ORG = 'testorg';
    process.env.AZURE_DEVOPS_PROJECT = 'testproject';

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

  describe('AzureDaily Initialization', () => {
    it('should create AzureDaily instance with default options', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      assert.ok(daily);
      assert.strictEqual(daily.options.projectPath, testDir);
      assert.strictEqual(daily.options.silent, true);
    });

    it('should load environment variables from .env file', async () => {
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);
      const envContent = 'AZURE_DEVOPS_PAT=file_pat_token\nAZURE_DEVOPS_ORG=fileorg\nAZURE_DEVOPS_PROJECT=fileproject\n';
      await fs.writeFile(path.join(claudeDir, '.env'), envContent);

      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      await daily.loadEnvironment();

      assert.strictEqual(daily.envVars.AZURE_DEVOPS_PAT, 'file_pat_token');
      assert.strictEqual(daily.envVars.AZURE_DEVOPS_ORG, 'fileorg');
      assert.strictEqual(daily.envVars.AZURE_DEVOPS_PROJECT, 'fileproject');
    });
  });

  describe('Date Utilities', () => {
    it('should get yesterday date in correct format', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const yesterday = daily.getYesterdayDate();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 1);
      const expected = expectedDate.toISOString().split('T')[0];

      assert.strictEqual(yesterday, expected);
    });

    it('should handle cross-platform date formatting', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const yesterday = daily.getYesterdayDate();

      // Should be in YYYY-MM-DD format
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(yesterday));
    });
  });

  describe('WIQL Query Building', () => {
    it('should build query for completed tasks from yesterday', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const yesterday = '2024-01-14';
      const query = daily.buildCompletedTasksQuery(yesterday);

      assert.ok(query.includes('SELECT [System.Id], [System.Title]'));
      assert.ok(query.includes('[System.WorkItemType] = \'Task\''));
      assert.ok(query.includes('[System.State] = \'Done\''));
      assert.ok(query.includes('[System.AssignedTo] = @Me'));
      assert.ok(query.includes(`[System.ChangedDate] >= '${yesterday}'`));
    });

    it('should build query for active tasks assigned to me', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const query = daily.buildActiveTasksQuery();

      assert.ok(query.includes('[System.WorkItemType] = \'Task\''));
      assert.ok(query.includes('[System.State] = \'In Progress\''));
      assert.ok(query.includes('[System.AssignedTo] = @Me'));
      assert.ok(query.includes('[Microsoft.VSTS.Scheduling.RemainingWork]'));
    });

    it('should build query for blocked items', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const query = daily.buildBlockedItemsQuery();

      assert.ok(query.includes('[System.Tags] CONTAINS \'blocked\''));
      assert.ok(query.includes('[System.State] != \'Closed\''));
    });

    it('should build query for next highest priority task', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const query = daily.buildNextTaskQuery();

      assert.ok(query.includes('SELECT TOP 1'));
      assert.ok(query.includes('[System.WorkItemType] = \'Task\''));
      assert.ok(query.includes('[System.State] = \'To Do\''));
      assert.ok(query.includes('([System.AssignedTo] = \'\' OR [System.AssignedTo] = @Me)'));
      assert.ok(query.includes('ORDER BY [Microsoft.VSTS.Common.Priority] ASC'));
    });
  });

  describe.skip('Azure DevOps API Integration - PENDING: Phase 3 migration', () => {
    // TODO: Enable after Azure DevOps Phase 3 migration
    // Requires proper environment setup and API mocking
    it('should fetch completed tasks from yesterday', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      // Mock WIQL query response for completed tasks
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: [
            { id: 123 },
            { id: 456 }
          ]
        });

      const yesterday = '2024-01-14';
      const completedTasks = await daily.fetchCompletedTasks(yesterday);

      assert.strictEqual(completedTasks.length, 2);
      assert.deepStrictEqual(completedTasks, [{ id: 123 }, { id: 456 }]);
    });

    it('should fetch active tasks for current user', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: [
            { id: 789 }
          ]
        });

      const activeTasks = await daily.fetchActiveTasks();

      assert.strictEqual(activeTasks.length, 1);
      assert.deepStrictEqual(activeTasks, [{ id: 789 }]);
    });

    it('should fetch blocked items', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: [
            { id: 999 }
          ]
        });

      const blockedItems = await daily.fetchBlockedItems();

      assert.strictEqual(blockedItems.length, 1);
      assert.deepStrictEqual(blockedItems, [{ id: 999 }]);
    });

    it('should fetch current iteration', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      nock('https://dev.azure.com')
        .get('/testorg/testproject/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          value: [
            {
              name: 'Sprint 5',
              id: 'iteration-id-123',
              attributes: {
                startDate: '2024-01-01T00:00:00Z',
                finishDate: '2024-01-14T23:59:59Z'
              }
            }
          ]
        });

      const iteration = await daily.fetchCurrentIteration();

      assert.strictEqual(iteration.name, 'Sprint 5');
      assert.strictEqual(iteration.id, 'iteration-id-123');
    });

    it('should fetch next recommended task', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: [
            { id: 555 }
          ]
        });

      const nextTask = await daily.fetchNextTask();

      assert.strictEqual(nextTask.length, 1);
      assert.deepStrictEqual(nextTask, [{ id: 555 }]);
    });

    it('should handle empty API responses gracefully', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: []
        });

      const result = await daily.fetchCompletedTasks('2024-01-14');

      assert.deepStrictEqual(result, []);
    });
  });

  describe('Standup Summary Generation', () => {
    it('should generate standup summary with completed tasks count', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const completedTasks = [
        { id: 123 },
        { id: 456 },
        { id: 789 }
      ];

      const summary = daily.generateStandupSummary(completedTasks);

      assert.ok(summary.includes('📋 Daily Standup Summary'));
      assert.ok(summary.includes('✅ Tasks completed yesterday: 3'));
    });

    it('should handle zero completed tasks', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const summary = daily.generateStandupSummary([]);

      assert.ok(summary.includes('✅ Tasks completed yesterday: 0'));
    });
  });

  describe('Active Work Summary Generation', () => {
    it('should generate active work summary with count', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const activeTasks = [
        { id: 111 },
        { id: 222 }
      ];

      const summary = daily.generateActiveWorkSummary(activeTasks);

      assert.ok(summary.includes('🔄 Your Active Work'));
      assert.ok(summary.includes('Active tasks: 2'));
    });

    it('should handle zero active tasks', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const summary = daily.generateActiveWorkSummary([]);

      assert.ok(summary.includes('Active tasks: 0'));
    });
  });

  describe('Blockers Check Generation', () => {
    it('should show warning when blockers found', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const blockedItems = [
        { id: 999 },
        { id: 888 }
      ];

      const summary = daily.generateBlockersCheck(blockedItems);

      assert.ok(summary.includes('🚧 Checking for Blockers'));
      assert.ok(summary.includes('⚠️  Found 2 blocked items!'));
    });

    it('should show success message when no blockers', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const summary = daily.generateBlockersCheck([]);

      assert.ok(summary.includes('✅ No blockers found'));
    });
  });

  describe('Sprint Status Generation', () => {
    it('should show current sprint information', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const iteration = {
        name: 'Sprint 5',
        id: 'iteration-123'
      };

      const summary = daily.generateSprintStatus(iteration);

      assert.ok(summary.includes('📊 Sprint Status'));
      assert.ok(summary.includes('Current Sprint: Sprint 5'));
    });

    it('should handle missing iteration gracefully', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const summary = daily.generateSprintStatus(null);

      assert.ok(summary.includes('Current Sprint: No active sprint'));
    });
  });

  describe('Next Task Suggestion Generation', () => {
    it('should suggest next highest priority task', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const nextTask = [{ id: 555 }];

      const summary = daily.generateNextTaskSuggestion(nextTask);

      assert.ok(summary.includes('🎯 Suggested Next Task'));
      assert.ok(summary.includes('Recommended: Task #555'));
      assert.ok(summary.includes('/azure:task-start 555'));
    });

    it('should handle no available tasks', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const summary = daily.generateNextTaskSuggestion([]);

      assert.ok(summary.includes('No tasks available. Check backlog or blocked items.'));
    });
  });

  describe('Quick Actions Generation', () => {
    it('should generate quick actions section', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const actions = daily.generateQuickActions();

      assert.ok(actions.includes('Quick actions:'));
      assert.ok(actions.includes('1. Start recommended task'));
      assert.ok(actions.includes('2. View sprint dashboard (/azure:sprint-status)'));
      assert.ok(actions.includes('3. Check blocked items (/azure:blocked-items)'));
      assert.ok(actions.includes('4. View all your tasks (/azure:task-list --my-tasks)'));
    });
  });

  describe.skip('Complete Daily Workflow - PENDING: Phase 3 migration', () => {
    // TODO: Enable after Azure DevOps Phase 3 migration
    it('should execute complete daily workflow', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      // Mock all API responses
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Mock completed tasks query
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: [{ id: 123 }, { id: 456 }]
        });

      // Mock active tasks query
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: [{ id: 789 }]
        });

      // Mock blocked items query
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: []
        });

      // Mock current iteration
      nock('https://dev.azure.com')
        .get('/testorg/testproject/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          value: [{ name: 'Sprint 5' }]
        });

      // Mock next task query
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: [{ id: 555 }]
        });

      const result = await daily.run();

      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('🌅 Starting Azure DevOps Daily Workflow'));
      assert.ok(result.output.includes('📋 Daily Standup Summary'));
      assert.ok(result.output.includes('🔄 Your Active Work'));
      assert.ok(result.output.includes('🚧 Checking for Blockers'));
      assert.ok(result.output.includes('📊 Sprint Status'));
      assert.ok(result.output.includes('🎯 Suggested Next Task'));
      assert.ok(result.output.includes('✅ Daily workflow complete!'));
    });

    it('should handle API errors gracefully', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      // Mock API error for first request
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(500, { message: 'Internal Server Error' });

      const result = await daily.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('500'));
    });

    it('should handle authentication errors', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      // Mock authentication error
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(401, { message: 'Unauthorized' });

      const result = await daily.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('401'));
    });
  });

  describe.skip('Environment Validation - PENDING: Implementation', () => {
    // TODO: Enable after implementing validation methods
    it('should validate required environment variables', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const validation = daily.validateEnvironment();

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    it('should detect missing environment variables', () => {
      delete process.env.AZURE_DEVOPS_PAT;

      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const validation = daily.validateEnvironment();

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.includes('AZURE_DEVOPS_PAT'));
    });
  });

  describe('Output Formatting', () => {
    it('should format output with proper headers and sections', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      const sections = [
        daily.generateStandupSummary([{ id: 123 }]),
        daily.generateActiveWorkSummary([{ id: 456 }]),
        daily.generateBlockersCheck([]),
        daily.generateSprintStatus({ name: 'Sprint 5' }),
        daily.generateNextTaskSuggestion([{ id: 789 }])
      ];

      const fullOutput = daily.formatDailyOutput(sections);

      assert.ok(fullOutput.includes('🌅 Starting Azure DevOps Daily Workflow'));
      assert.ok(fullOutput.includes('========================================'));
      assert.ok(fullOutput.includes('✅ Daily workflow complete!'));
    });

    it('should use appropriate colors in interactive mode', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: false
      });

      assert.ok(daily.colors.green);
      assert.ok(daily.colors.blue);
      assert.ok(daily.colors.yellow);
    });

    it('should suppress colors in silent mode', () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      assert.strictEqual(daily.colors.green, '');
      assert.strictEqual(daily.colors.blue, '');
      assert.strictEqual(daily.colors.yellow, '');
    });
  });

  describe.skip('Error Handling - PENDING: Implementation', () => {
    // TODO: Enable after implementing error handling
    it('should provide meaningful error messages', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      // Mock network error
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .replyWithError('ENOTFOUND dev.azure.com');

      const result = await daily.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('ENOTFOUND'));
    });

    it('should handle malformed API responses', async () => {
      const daily = new AzureDaily({
        projectPath: testDir,
        silent: true
      });

      // Mock invalid JSON response
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, 'invalid json');

      const result = await daily.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });
});