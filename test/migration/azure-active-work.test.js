/**
 * Tests for Azure DevOps Active Work Script Migration
 * Tests the migration of autopm/.claude/scripts/azure/active-work.sh to Node.js
 *
 * TDD RED PHASE: These tests define the expected behavior before implementation
 *
 * Original script functionality:
 * - Shows all work items currently in progress
 * - Supports user filtering (--user=email or --user=me)
 * - Groups items by type (Task, User Story, Bug)
 * - Displays formatted tables with item details
 * - Shows summary statistics and recent activity
 * - Provides quick action suggestions
 * - Uses WIQL queries to fetch data from Azure DevOps API
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Mock nock for HTTP request mocking
const nock = require('nock');

// Import the Azure Active Work class (to be implemented)
const AzureActiveWork = require('../../bin/node/azure-active-work');

describe('Azure DevOps Active Work Migration Tests', () => {
  let testDir;
  let originalEnv;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `autopm-azure-active-work-test-${Date.now()}`);
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

  describe('AzureActiveWork Initialization', () => {
    it('should create AzureActiveWork instance with default options', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      assert.ok(activeWork);
      assert.strictEqual(activeWork.options.projectPath, testDir);
      assert.strictEqual(activeWork.options.silent, true);
    });

    it('should load environment variables from .env file', async () => {
      // Create .env file in test directory
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);
      const envContent = 'AZURE_DEVOPS_PAT=file_pat_token\nAZURE_DEVOPS_ORG=fileorg\nAZURE_DEVOPS_PROJECT=fileproject\n';
      await fs.writeFile(path.join(claudeDir, '.env'), envContent);

      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      await activeWork.loadEnvironment();

      assert.strictEqual(activeWork.envVars.AZURE_DEVOPS_PAT, 'file_pat_token');
      assert.strictEqual(activeWork.envVars.AZURE_DEVOPS_ORG, 'fileorg');
      assert.strictEqual(activeWork.envVars.AZURE_DEVOPS_PROJECT, 'fileproject');
    });

    it('should handle missing environment variables gracefully', () => {
      delete process.env.AZURE_DEVOPS_PAT;
      delete process.env.AZURE_DEVOPS_ORG;
      delete process.env.AZURE_DEVOPS_PROJECT;

      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      // Should not throw, but should indicate missing credentials
      assert.ok(activeWork);
    });
  });

  describe('User Filter Parsing', () => {
    it('should parse --user=me filter', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true,
        args: ['--user=me']
      });

      const filter = activeWork.parseUserFilter();
      assert.strictEqual(filter.type, 'me');
      assert.strictEqual(filter.email, null);
    });

    it('should parse --user=email@example.com filter', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true,
        args: ['--user=test@example.com']
      });

      const filter = activeWork.parseUserFilter();
      assert.strictEqual(filter.type, 'email');
      assert.strictEqual(filter.email, 'test@example.com');
    });

    it('should return no filter when no user argument provided', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true,
        args: []
      });

      const filter = activeWork.parseUserFilter();
      assert.strictEqual(filter.type, 'none');
      assert.strictEqual(filter.email, null);
    });

    it('should handle malformed user arguments', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true,
        args: ['--user=']
      });

      const filter = activeWork.parseUserFilter();
      assert.strictEqual(filter.type, 'none');
    });
  });

  describe('WIQL Query Building', () => {
    it('should build basic WIQL query for active items', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const query = activeWork.buildWiqlQuery({ type: 'none' });

      assert.ok(query.includes('SELECT [System.Id], [System.Title], [System.WorkItemType]'));
      assert.ok(query.includes('[System.State] IN (\'Active\', \'In Progress\')'));
      assert.ok(query.includes('[System.WorkItemType] IN (\'Task\', \'Bug\', \'User Story\')'));
      assert.ok(query.includes('ORDER BY [System.ChangedDate] DESC'));
    });

    it('should add user filter for @Me', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const query = activeWork.buildWiqlQuery({ type: 'me' });

      assert.ok(query.includes('[System.AssignedTo] = @Me'));
    });

    it('should add user filter for specific email', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const query = activeWork.buildWiqlQuery({ type: 'email', email: 'test@example.com' });

      assert.ok(query.includes('[System.AssignedTo] = \'test@example.com\''));
    });

    it('should include all required fields in query', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const query = activeWork.buildWiqlQuery({ type: 'none' });

      const requiredFields = [
        '[System.Id]',
        '[System.Title]',
        '[System.WorkItemType]',
        '[System.State]',
        '[System.AssignedTo]',
        '[System.ChangedDate]',
        '[Microsoft.VSTS.Scheduling.RemainingWork]',
        '[System.IterationPath]'
      ];

      for (const field of requiredFields) {
        assert.ok(query.includes(field), `Query should include ${field}`);
      }
    });
  });

  describe('Azure DevOps API Integration', () => {
    it('should fetch work item IDs using WIQL query', async () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      // Mock WIQL query response
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: [
            { id: 123 },
            { id: 456 },
            { id: 789 }
          ]
        });

      const ids = await activeWork.fetchWorkItemIds({ type: 'none' });

      assert.deepStrictEqual(ids, [123, 456, 789]);
    });

    it('should handle empty WIQL query results', async () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      // Mock empty response
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: []
        });

      const ids = await activeWork.fetchWorkItemIds({ type: 'none' });

      assert.deepStrictEqual(ids, []);
    });

    it('should fetch work item details', async () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const mockWorkItem = {
        id: 123,
        fields: {
          'System.Title': 'Test Task',
          'System.WorkItemType': 'Task',
          'System.State': 'Active',
          'System.AssignedTo': {
            displayName: 'John Doe'
          },
          'System.ChangedDate': '2024-01-15T10:30:00Z',
          'Microsoft.VSTS.Scheduling.RemainingWork': 8,
          'System.IterationPath': 'Project\\Sprint 1'
        }
      };

      nock('https://dev.azure.com')
        .get('/testorg/testproject/_apis/wit/workitems/123')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, mockWorkItem);

      const item = await activeWork.fetchWorkItem(123);

      assert.strictEqual(item.id, 123);
      assert.strictEqual(item.title, 'Test Task');
      assert.strictEqual(item.type, 'Task');
      assert.strictEqual(item.state, 'Active');
      assert.strictEqual(item.assignedTo, 'John Doe');
      assert.strictEqual(item.remainingWork, 8);
      assert.strictEqual(item.sprint, 'Sprint 1');
    });

    it('should handle API authentication errors', async () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(401, { message: 'Unauthorized' });

      await assert.rejects(
        async () => {
          await activeWork.fetchWorkItemIds({ type: 'none' });
        },
        {
          name: 'Error',
          message: /401/
        }
      );
    });

    it('should handle network errors gracefully', async () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .replyWithError('Network error');

      await assert.rejects(
        async () => {
          await activeWork.fetchWorkItemIds({ type: 'none' });
        },
        {
          name: 'Error',
          message: /Network error/
        }
      );
    });
  });

  describe('Work Item Processing and Grouping', () => {
    it('should group work items by type', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const workItems = [
        { id: 1, type: 'Task', title: 'Task 1' },
        { id: 2, type: 'User Story', title: 'Story 1' },
        { id: 3, type: 'Bug', title: 'Bug 1' },
        { id: 4, type: 'Task', title: 'Task 2' }
      ];

      const grouped = activeWork.groupWorkItemsByType(workItems);

      assert.strictEqual(grouped.tasks.length, 2);
      assert.strictEqual(grouped.stories.length, 1);
      assert.strictEqual(grouped.bugs.length, 1);
    });

    it('should calculate total remaining work', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const workItems = [
        { remainingWork: 8 },
        { remainingWork: 4 },
        { remainingWork: null },
        { remainingWork: 6 }
      ];

      const total = activeWork.calculateTotalRemainingWork(workItems);

      assert.strictEqual(total, 18);
    });

    it('should filter recent activity within 24 hours', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const workItems = [
        { id: 1, title: 'Recent Item', changedDate: now.toISOString() },
        { id: 2, title: 'Old Item', changedDate: twoDaysAgo.toISOString() },
        { id: 3, title: 'Yesterday Item', changedDate: yesterday.toISOString() }
      ];

      const recent = activeWork.filterRecentActivity(workItems);

      assert.strictEqual(recent.length, 2); // Recent and yesterday items
      assert.ok(recent.some(item => item.id === 1));
      assert.ok(recent.some(item => item.id === 3));
    });
  });

  describe('Output Formatting', () => {
    it('should format task table with all required columns', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const tasks = [
        {
          id: 123,
          title: 'Test Task'.padEnd(40),
          assignedTo: 'John Doe',
          remainingWork: 8,
          changedDate: '2024-01-15',
          sprint: 'Sprint 1'
        }
      ];

      const output = activeWork.formatTasksTable(tasks);

      assert.ok(output.includes('📋 Active Tasks'));
      assert.ok(output.includes('ID'));
      assert.ok(output.includes('Title'));
      assert.ok(output.includes('Assigned'));
      assert.ok(output.includes('Remain'));
      assert.ok(output.includes('Modified'));
      assert.ok(output.includes('Sprint'));
      assert.ok(output.includes('#123'));
      assert.ok(output.includes('Test Task'));
      assert.ok(output.includes('John Doe'));
      assert.ok(output.includes('8h'));
    });

    it('should format user stories table without remaining work column', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const stories = [
        {
          id: 456,
          title: 'User Story',
          assignedTo: 'Jane Smith',
          changedDate: '2024-01-15',
          sprint: 'Sprint 1'
        }
      ];

      const output = activeWork.formatStoriesTable(stories);

      assert.ok(output.includes('📖 Active User Stories'));
      assert.ok(output.includes('#456'));
      assert.ok(output.includes('User Story'));
      assert.ok(output.includes('Jane Smith'));
      assert.ok(!output.includes('Remain')); // Should not have remaining work column
    });

    it('should format bugs table', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const bugs = [
        {
          id: 789,
          title: 'Critical Bug',
          assignedTo: 'Bob Wilson',
          changedDate: '2024-01-15',
          sprint: 'Sprint 1'
        }
      ];

      const output = activeWork.formatBugsTable(bugs);

      assert.ok(output.includes('🐛 Active Bugs'));
      assert.ok(output.includes('#789'));
      assert.ok(output.includes('Critical Bug'));
      assert.ok(output.includes('Bob Wilson'));
    });

    it('should format summary statistics', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const summary = {
        tasks: 5,
        stories: 3,
        bugs: 2,
        total: 10,
        totalRemainingWork: 24
      };

      const output = activeWork.formatSummary(summary);

      assert.ok(output.includes('📊 Summary'));
      assert.ok(output.includes('Active Tasks: 5'));
      assert.ok(output.includes('Active Stories: 3'));
      assert.ok(output.includes('Active Bugs: 2'));
      assert.ok(output.includes('Total Active Items: 10'));
      assert.ok(output.includes('Total Remaining Work: 24h'));
    });

    it('should format recent activity section', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const recentItems = [
        { id: 123, title: 'Recent Task', changedDate: '2024-01-15' },
        { id: 456, title: 'Another Recent Item', changedDate: '2024-01-15' }
      ];

      const output = activeWork.formatRecentActivity(recentItems);

      assert.ok(output.includes('📅 Recent Activity (Last 24h)'));
      assert.ok(output.includes('• #123: Recent Task'));
      assert.ok(output.includes('• #456: Another Recent Item'));
    });

    it('should show appropriate message when no recent activity', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const output = activeWork.formatRecentActivity([]);

      assert.ok(output.includes('No items modified in the last 24 hours'));
    });

    it('should format quick actions section', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const output = activeWork.formatQuickActions();

      assert.ok(output.includes('🔧 Quick Actions'));
      assert.ok(output.includes('/azure:task-show'));
      assert.ok(output.includes('/azure:task-edit'));
      assert.ok(output.includes('/azure:task-close'));
      assert.ok(output.includes('/azure:sprint-status'));
      assert.ok(output.includes('/azure:next-task'));
    });

    it('should format filter help section', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const output = activeWork.formatFilterHelp();

      assert.ok(output.includes('Available Filters:'));
      assert.ok(output.includes('--user=me'));
      assert.ok(output.includes('--user=email@example.com'));
    });
  });

  describe('Complete Workflow', () => {
    it('should execute complete active work workflow', async () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      // Mock WIQL query response
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

      // Mock work item details
      nock('https://dev.azure.com')
        .get('/testorg/testproject/_apis/wit/workitems/123')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          id: 123,
          fields: {
            'System.Title': 'Test Task',
            'System.WorkItemType': 'Task',
            'System.State': 'Active',
            'System.AssignedTo': { displayName: 'John Doe' },
            'System.ChangedDate': new Date().toISOString(),
            'Microsoft.VSTS.Scheduling.RemainingWork': 8,
            'System.IterationPath': 'Project\\Sprint 1'
          }
        });

      nock('https://dev.azure.com')
        .get('/testorg/testproject/_apis/wit/workitems/456')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          id: 456,
          fields: {
            'System.Title': 'User Story',
            'System.WorkItemType': 'User Story',
            'System.State': 'In Progress',
            'System.AssignedTo': { displayName: 'Jane Smith' },
            'System.ChangedDate': new Date().toISOString(),
            'System.IterationPath': 'Project\\Sprint 1'
          }
        });

      const result = await activeWork.run();

      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('🔄 Azure DevOps Active Work Items'));
      assert.ok(result.output.includes('Test Task'));
      assert.ok(result.output.includes('User Story'));
    });

    it('should handle no active work items gracefully', async () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      // Mock empty WIQL response
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(200, {
          workItems: []
        });

      const result = await activeWork.run();

      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('No active work items found'));
    });

    it('should handle API errors during execution', async () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      // Mock API error
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .basicAuth('', 'test_pat_token')
        .reply(500, { message: 'Internal Server Error' });

      const result = await activeWork.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('500'));
    });
  });

  describe('Environment and Configuration', () => {
    it('should validate required environment variables', () => {
      delete process.env.AZURE_DEVOPS_PAT;

      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const validation = activeWork.validateEnvironment();

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.includes('AZURE_DEVOPS_PAT'));
    });

    it('should pass validation with all required variables', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      const validation = activeWork.validateEnvironment();

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });
  });

  describe('Color Output Management', () => {
    it('should use colors in interactive mode', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: false
      });

      assert.ok(activeWork.colors.green);
      assert.ok(activeWork.colors.blue);
      assert.ok(activeWork.colors.yellow);
    });

    it('should suppress colors in silent mode', () => {
      const activeWork = new AzureActiveWork({
        projectPath: testDir,
        silent: true
      });

      assert.strictEqual(activeWork.colors.green, '');
      assert.strictEqual(activeWork.colors.blue, '');
      assert.strictEqual(activeWork.colors.yellow, '');
    });
  });
});