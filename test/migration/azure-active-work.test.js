/**
 * Tests for Azure DevOps Active Work Script Migration
 * Tests the migration of autopm/.claude/scripts/azure/active-work.sh to Node.js
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

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const nock = require('nock');
const sinon = require('sinon');

// Import the Azure Active Work class
const AzureActiveWork = require('../../bin/node/azure-active-work');
const AzureDevOpsClient = require('../../lib/azure/client');

describe('Azure DevOps Active Work Migration Tests', () => {
  // Skip these tests unless in integration test mode
  if (!process.env.AZURE_DEVOPS_INTEGRATION_TESTS) {
    console.log('Skipping Azure DevOps tests (set AZURE_DEVOPS_INTEGRATION_TESTS=true to run)');
    return;
  }

  let testDir;
  let originalEnv;
  let clientStub;

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

    // Stub AzureDevOpsClient to prevent real connections
    clientStub = sinon.stub(AzureDevOpsClient.prototype, 'initConnection').returns(undefined);

    // Mock the queryWorkItems and getWorkItems methods
    sinon.stub(AzureDevOpsClient.prototype, 'queryWorkItems').resolves({ workItems: [] });
    sinon.stub(AzureDevOpsClient.prototype, 'getWorkItems').resolves([]);

    // Clean up HTTP mocks
    nock.cleanAll();
  });

  afterEach(async () => {
    // Restore environment
    process.env = originalEnv;

    // Clean up test directory
    await fs.remove(testDir);

    // Restore sinon stubs
    sinon.restore();

    // Clean up HTTP mocks
    nock.cleanAll();
  });

  describe('AzureActiveWork Initialization', () => {
    beforeEach(() => {
      // Mock the Azure DevOps API to prevent real connections
      nock('https://dev.azure.com')
        .persist()
        .get(/.*\/wiql/)
        .reply(200, { workItems: [] })
        .get(/.*\/workitems/)
        .reply(200, { value: [] });
    });

    it('should create AzureActiveWork instance with default options', () => {
      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      assert.ok(activeWork);
      assert.strictEqual(activeWork.silent, true);
      assert.strictEqual(activeWork.format, 'table');
      assert.strictEqual(activeWork.groupBy, 'assignee');
    });

    it('should initialize with Azure DevOps client', () => {
      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      assert.ok(activeWork.client);
      assert.strictEqual(activeWork.client.organization, 'testorg');
      assert.strictEqual(activeWork.client.project, 'testproject');
    });

    it('should handle missing environment variables gracefully', () => {
      const originalPAT = process.env.AZURE_DEVOPS_PAT;
      const originalOrg = process.env.AZURE_DEVOPS_ORG;
      const originalProject = process.env.AZURE_DEVOPS_PROJECT;

      delete process.env.AZURE_DEVOPS_PAT;
      delete process.env.AZURE_DEVOPS_ORG;
      delete process.env.AZURE_DEVOPS_PROJECT;

      assert.throws(() => {
        new AzureActiveWork({
          silent: true
        });
      }, /Missing required environment variables/);

      // Restore environment variables
      if (originalPAT) process.env.AZURE_DEVOPS_PAT = originalPAT;
      if (originalOrg) process.env.AZURE_DEVOPS_ORG = originalOrg;
      if (originalProject) process.env.AZURE_DEVOPS_PROJECT = originalProject;
    });
  });

  describe('Command Line Arguments', () => {
    it('should accept user filter options', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--user', 'me']);
      assert.strictEqual(options.user, 'me');
    });

    it('should accept email user filter', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--user', 'test@example.com']);
      assert.strictEqual(options.user, 'test@example.com');
    });

    it('should parse state filter', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--state', 'Active,In Progress']);
      assert.strictEqual(options.state, 'Active,In Progress');
    });

    it('should parse type filter', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--type', 'Task,Bug']);
      assert.strictEqual(options.type, 'Task,Bug');
    });

    it('should parse groupBy argument', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--group-by', 'priority']);
      assert.strictEqual(options.groupBy, 'priority');
    });

    it('should parse format argument', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--format', 'json']);
      assert.strictEqual(options.format, 'json');
    });

    it('should parse no-unassigned flag', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--no-unassigned']);
      assert.strictEqual(options.includeUnassigned, false);
    });

    it('should parse json flag', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--json']);
      assert.strictEqual(options.format, 'json');
    });

    it('should parse csv flag', () => {
      const options = AzureActiveWork.parseArguments(['node', 'script.js', '--csv']);
      assert.strictEqual(options.format, 'csv');
    });
  });

  describe('Work Item Processing', () => {
    beforeEach(() => {
      // Mock API calls for this test suite
      nock('https://dev.azure.com')
        .persist()
        .get(/.*/)
        .reply(200, {});
    });

    it('should process work items correctly', () => {
      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      const workItems = [
        {
          id: 1,
          fields: {
            'System.Title': 'Task 1',
            'System.WorkItemType': 'Task',
            'System.State': 'Active',
            'System.AssignedTo': { displayName: 'John Doe' },
            'Microsoft.VSTS.Scheduling.RemainingWork': 8,
            'Microsoft.VSTS.Common.Priority': 1,
            'System.ChangedDate': new Date().toISOString()
          }
        },
        {
          id: 2,
          fields: {
            'System.Title': 'Bug 1',
            'System.WorkItemType': 'Bug',
            'System.State': 'In Progress',
            'System.AssignedTo': { displayName: 'Jane Smith' },
            'Microsoft.VSTS.Scheduling.RemainingWork': 4,
            'Microsoft.VSTS.Common.Priority': 2,
            'System.ChangedDate': new Date().toISOString()
          }
        }
      ];

      const result = activeWork.processWorkItems(workItems, null);

      assert.strictEqual(result.summary.total, 2);
      assert.strictEqual(result.byState['Active'], 1);
      assert.strictEqual(result.byState['In Progress'], 1);
      assert.strictEqual(result.byType['Task'], 1);
      assert.strictEqual(result.byType['Bug'], 1);
      assert.ok(result.byAssignee['John Doe']);
      assert.ok(result.byAssignee['Jane Smith']);
    });

    it('should calculate total remaining work correctly', () => {
      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      const workItems = [
        {
          id: 1,
          fields: {
            'System.Title': 'Task 1',
            'Microsoft.VSTS.Scheduling.RemainingWork': 8,
            'System.ChangedDate': new Date().toISOString()
          }
        },
        {
          id: 2,
          fields: {
            'System.Title': 'Task 2',
            'Microsoft.VSTS.Scheduling.RemainingWork': 4,
            'System.ChangedDate': new Date().toISOString()
          }
        },
        {
          id: 3,
          fields: {
            'System.Title': 'Task 3',
            'Microsoft.VSTS.Scheduling.RemainingWork': null,
            'System.ChangedDate': new Date().toISOString()
          }
        }
      ];

      const result = activeWork.processWorkItems(workItems, null);
      assert.strictEqual(result.summary.totalRemaining, 12);
    });

    it('should identify blocked items correctly', () => {
      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      const workItems = [
        {
          id: 1,
          fields: {
            'System.Title': 'Blocked Task',
            'System.Tags': 'blocked; waiting for approval',
            'System.State': 'Active',
            'System.ChangedDate': new Date().toISOString()
          }
        },
        {
          id: 2,
          fields: {
            'System.Title': 'Normal Task',
            'System.Tags': 'urgent',
            'System.State': 'Active',
            'System.ChangedDate': new Date().toISOString()
          }
        }
      ];

      const result = activeWork.processWorkItems(workItems, null);
      assert.strictEqual(result.blockedItems.length, 1);
      assert.strictEqual(result.blockedItems[0].id, 1);
    });

    it('should handle unassigned work items', () => {
      const activeWork = new AzureActiveWork({
        silent: true,
        includeUnassigned: true
      });

      const workItems = [
        {
          id: 1,
          fields: {
            'System.Title': 'Unassigned Task',
            'System.WorkItemType': 'Task',
            'System.State': 'New',
            'System.ChangedDate': new Date().toISOString()
          }
        }
      ];

      const result = activeWork.processWorkItems(workItems, null);
      assert.ok(result.byAssignee['Unassigned']);
      assert.strictEqual(result.byAssignee['Unassigned'].length, 1);
    });

    it('should group items by priority', () => {
      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      const workItems = [
        {
          id: 1,
          fields: {
            'System.Title': 'High Priority',
            'Microsoft.VSTS.Common.Priority': 1,
            'System.ChangedDate': new Date().toISOString()
          }
        },
        {
          id: 2,
          fields: {
            'System.Title': 'Low Priority',
            'Microsoft.VSTS.Common.Priority': 3,
            'System.ChangedDate': new Date().toISOString()
          }
        }
      ];

      const result = activeWork.processWorkItems(workItems, null);
      assert.ok(result.byPriority[1]);
      assert.ok(result.byPriority[3]);
      assert.strictEqual(result.byPriority[1].length, 1);
      assert.strictEqual(result.byPriority[3].length, 1);
    });
  });

  describe('Azure DevOps API Integration', () => {
    it('should execute WIQL query successfully', async () => {
      // Mock WIQL query response
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .reply(200, {
          workItems: [
            { id: 123 },
            { id: 456 }
          ]
        });

      // Mock work item details
      nock('https://dev.azure.com')
        .get('/testorg/testproject/_apis/wit/workitems')
        .query(true)
        .reply(200, {
          value: [
            {
              id: 123,
              fields: {
                'System.Title': 'Test Task',
                'System.WorkItemType': 'Task',
                'System.State': 'Active',
                'System.AssignedTo': { displayName: 'John Doe' },
                'System.ChangedDate': new Date().toISOString(),
                'Microsoft.VSTS.Scheduling.RemainingWork': 8
              }
            },
            {
              id: 456,
              fields: {
                'System.Title': 'Test Bug',
                'System.WorkItemType': 'Bug',
                'System.State': 'In Progress',
                'System.AssignedTo': { displayName: 'Jane Smith' },
                'System.ChangedDate': new Date().toISOString(),
                'Microsoft.VSTS.Scheduling.RemainingWork': 4
              }
            }
          ]
        });

      // Mock current sprint
      nock('https://dev.azure.com')
        .get('/testorg/testproject/_apis/work/teamsettings/iterations')
        .query(true)
        .reply(200, {
          value: [
            {
              name: 'Sprint 2024.1',
              attributes: {
                startDate: new Date().toISOString(),
                finishDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          ]
        });

      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      const result = await activeWork.getActiveWork();

      assert.ok(result);
      assert.strictEqual(result.summary.total, 2);
      assert.ok(result.byAssignee['John Doe']);
      assert.ok(result.byAssignee['Jane Smith']);
    });

    it('should handle empty work items response', async () => {
      // Mock empty WIQL response
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .reply(200, {
          workItems: []
        });

      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      const result = await activeWork.getActiveWork();

      assert.ok(result);
      assert.strictEqual(result.summary.total, 0);
      assert.deepStrictEqual(result.items, []);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      nock('https://dev.azure.com')
        .post('/testorg/testproject/_apis/wit/wiql')
        .reply(401, { message: 'Unauthorized' });

      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      await assert.rejects(
        async () => {
          await activeWork.getActiveWork();
        },
        /Authentication failed/
      );
    });
  });

  describe('Output Formatting', () => {
    it('should support JSON format', () => {
      const activeWork = new AzureActiveWork({
        format: 'json',
        silent: true
      });

      assert.strictEqual(activeWork.format, 'json');
    });

    it('should support CSV format', () => {
      const activeWork = new AzureActiveWork({
        format: 'csv',
        silent: true
      });

      assert.strictEqual(activeWork.format, 'csv');
    });

    it('should default to table format', () => {
      const activeWork = new AzureActiveWork({
        silent: true,
        testMode: true
      });

      assert.strictEqual(activeWork.format, 'table');
    });

    it('should format CSV output correctly', () => {
      const activeWork = new AzureActiveWork({
        format: 'csv',
        silent: true
      });

      const data = {
        byAssignee: {
          'John Doe': [
            {
              id: 123,
              title: 'Test Task',
              type: 'Task',
              state: 'Active',
              priority: 1,
              daysInState: 2,
              remainingWork: 8
            }
          ]
        }
      };

      // Mock console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (msg) => { output += msg + '\n'; };

      activeWork.displayCSV(data);

      console.log = originalLog;

      assert.ok(output.includes('ID,Title,Type,State,Priority,Assigned To,Days in State,Remaining Work'));
      assert.ok(output.includes('123,"Test Task",Task,Active,1,"John Doe",2,8'));
    });
  });

  describe('Environment Configuration', () => {
    it('should load .env file from project directory', async () => {
      // Create .env file
      const envPath = path.join(testDir, '.env');
      await fs.writeFile(envPath, 'AZURE_DEVOPS_ORG=fileorg\nAZURE_DEVOPS_PROJECT=fileproject\nAZURE_DEVOPS_PAT=filepat');

      // Change to test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const activeWork = new AzureActiveWork({
          silent: true
        });

        assert.strictEqual(activeWork.client.organization, 'fileorg');
        assert.strictEqual(activeWork.client.project, 'fileproject');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should load .claude/.env file if exists', async () => {
      // Create .claude/.env file
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);
      const envPath = path.join(claudeDir, '.env');
      await fs.writeFile(envPath, 'AZURE_DEVOPS_ORG=claudeorg\nAZURE_DEVOPS_PROJECT=claudeproject\nAZURE_DEVOPS_PAT=claudepat');

      // Change to test directory
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const activeWork = new AzureActiveWork({
          silent: true
        });

        assert.strictEqual(activeWork.client.organization, 'claudeorg');
        assert.strictEqual(activeWork.client.project, 'claudeproject');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});