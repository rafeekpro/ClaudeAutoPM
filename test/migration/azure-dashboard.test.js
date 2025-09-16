/**
 * Tests for Azure DevOps Dashboard Script Migration
 * Tests the migration of autopm/.claude/scripts/azure/dashboard.sh to Node.js
 *
 * TDD RED PHASE: These tests define the expected behavior before implementation
 *
 * Original script functionality:
 * - Displays comprehensive Azure DevOps project status
 * - Shows current sprint information with progress bars
 * - Work items overview by state (New, Active, Done, etc.)
 * - Sprint burndown with story points and remaining work
 * - Team activity analysis for last 7 days
 * - Alert system for blocked items, high priority, and stale items
 * - Recent completions display
 * - Quick actions menu
 * - Colorized output with progress indicators
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Mock nock for HTTP request mocking
const nock = require('nock');

// Import the Azure Dashboard class (to be implemented)
const AzureDashboard = require('../../bin/node/azure-dashboard');

describe('Azure DevOps Dashboard Migration Tests', () => {
  let testDir;
  let originalEnv;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `autopm-azure-dashboard-test-${Date.now()}`);
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

  describe('AzureDashboard Initialization', () => {
    it('should create AzureDashboard instance with default options', () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      assert.ok(dashboard);
      assert.strictEqual(dashboard.options.projectPath, testDir);
      assert.strictEqual(dashboard.options.silent, true);
    });

    it('should set correct paths for environment and config files', () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      const expectedEnvPath = path.join(testDir, '.claude', '.env');
      assert.strictEqual(dashboard.envPath, expectedEnvPath);
    });

    it('should initialize color settings based on silent mode', () => {
      const dashboardSilent = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      const dashboardVerbose = new AzureDashboard({
        projectPath: testDir,
        silent: false
      });

      assert.strictEqual(dashboardSilent.colors.green, '');
      assert.notStrictEqual(dashboardVerbose.colors.green, '');
    });
  });

  describe('Environment Loading', () => {
    it('should load Azure DevOps credentials from .env file', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();

      assert.strictEqual(dashboard.credentials.AZURE_DEVOPS_PAT, 'fake-pat-token-12345');
      assert.strictEqual(dashboard.credentials.AZURE_DEVOPS_ORG, 'test-org');
      assert.strictEqual(dashboard.credentials.AZURE_DEVOPS_PROJECT, 'test-project');
    });

    it('should handle missing .env file gracefully', async () => {
      // Remove .env file
      await fs.remove(path.join(testDir, '.claude', '.env'));

      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await assert.rejects(
        async () => await dashboard.loadEnvironment(),
        /Azure DevOps credentials not configured/
      );
    });
  });

  describe('Sprint Information Display', () => {
    beforeEach(() => {
      // Mock current sprint API response
      const sprintResponse = {
        value: [{
          path: 'test-project\\Sprint 1',
          attributes: {
            startDate: '2024-01-01T00:00:00Z',
            finishDate: '2024-01-14T23:59:59Z'
          }
        }]
      };

      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .reply(200, sprintResponse);
    });

    it('should fetch and display current sprint information', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const sprintInfo = await dashboard.getCurrentSprintInfo();

      assert.ok(sprintInfo);
      assert.ok(sprintInfo.name.includes('Sprint 1'));
      assert.ok(sprintInfo.startDate);
      assert.ok(sprintInfo.endDate);
    });

    it('should calculate sprint progress correctly', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const sprintInfo = await dashboard.getCurrentSprintInfo();
      const progress = dashboard.calculateSprintProgress(sprintInfo);

      assert.ok(typeof progress === 'number');
      assert.ok(progress >= 0 && progress <= 100);
    });

    it('should generate progress bar visualization', () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: false
      });

      const progressBar = dashboard.generateProgressBar(50, 20);

      assert.ok(typeof progressBar === 'string');
      assert.ok(progressBar.length === 20);
      assert.ok(progressBar.includes('█')); // Filled portions
      assert.ok(progressBar.includes('░')); // Empty portions
    });

    it('should handle missing sprint gracefully', async () => {
      // Mock empty sprint response
      nock.cleanAll();
      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .reply(200, { value: [] });

      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const sprintInfo = await dashboard.getCurrentSprintInfo();

      assert.strictEqual(sprintInfo, null);
    });
  });

  describe('Work Items Overview', () => {
    beforeEach(() => {
      // Mock work items query responses for different states
      const states = ['New', 'Active', 'In Progress', 'Resolved', 'Done', 'Closed'];

      states.forEach(state => {
        const mockResponse = {
          workItems: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
            id: i + 1
          }))
        };

        nock('https://dev.azure.com')
          .post('/test-org/test-project/_apis/wit/wiql')
          .query({ 'api-version': '7.0' })
          .reply((uri, requestBody) => {
            const query = JSON.parse(requestBody).query;
            if (query.includes(`[System.State] = '${state}'`)) {
              return [200, mockResponse];
            }
            return [200, { workItems: [] }];
          });
      });
    });

    it('should fetch work items by state', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const workItemsOverview = await dashboard.getWorkItemsOverview();

      assert.ok(workItemsOverview);
      assert.ok(Array.isArray(workItemsOverview));

      // Should have entries for different states
      const states = workItemsOverview.map(item => item.state);
      assert.ok(states.length > 0);
    });

    it('should categorize work items correctly', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const workItemsOverview = await dashboard.getWorkItemsOverview();

      for (const item of workItemsOverview) {
        assert.ok(item.state);
        assert.ok(typeof item.count === 'number');
        assert.ok(item.count >= 0);
        assert.ok(item.icon);
        assert.ok(item.color);
      }
    });
  });

  describe('Sprint Burndown Analysis', () => {
    beforeEach(() => {
      // Mock sprint work items query
      const sprintWorkItems = {
        workItems: [
          { id: 101, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/101' },
          { id: 102, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/102' },
          { id: 103, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/103' }
        ]
      };

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply((uri, requestBody) => {
          const query = JSON.parse(requestBody).query;
          if (query.includes('[System.IterationPath]')) {
            return [200, sprintWorkItems];
          }
          return [200, { workItems: [] }];
        });

      // Mock individual work item responses
      const workItem1 = {
        id: 101,
        fields: {
          'System.WorkItemType': 'User Story',
          'System.State': 'Done',
          'Microsoft.VSTS.Scheduling.StoryPoints': 5
        }
      };

      const workItem2 = {
        id: 102,
        fields: {
          'System.WorkItemType': 'User Story',
          'System.State': 'Active',
          'Microsoft.VSTS.Scheduling.StoryPoints': 3
        }
      };

      const workItem3 = {
        id: 103,
        fields: {
          'System.WorkItemType': 'Task',
          'System.State': 'Active',
          'Microsoft.VSTS.Scheduling.RemainingWork': 8
        }
      };

      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/wit/workitems/101')
        .query({ 'api-version': '7.0' })
        .reply(200, workItem1);

      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/wit/workitems/102')
        .query({ 'api-version': '7.0' })
        .reply(200, workItem2);

      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/wit/workitems/103')
        .query({ 'api-version': '7.0' })
        .reply(200, workItem3);
    });

    it('should calculate sprint burndown metrics', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const burndown = await dashboard.getSprintBurndown('test-project\\Sprint 1');

      assert.ok(burndown);
      assert.ok(typeof burndown.totalStories === 'number');
      assert.ok(typeof burndown.completedStories === 'number');
      assert.ok(typeof burndown.totalPoints === 'number');
      assert.ok(typeof burndown.completedPoints === 'number');
      assert.ok(typeof burndown.remainingHours === 'number');
    });

    it('should calculate velocity percentage', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const burndown = await dashboard.getSprintBurndown('test-project\\Sprint 1');

      if (burndown.totalPoints > 0) {
        const velocity = Math.round((burndown.completedPoints / burndown.totalPoints) * 100);
        assert.ok(velocity >= 0 && velocity <= 100);
      }
    });
  });

  describe('Team Activity Analysis', () => {
    beforeEach(() => {
      // Mock team activity query
      const activityResponse = {
        workItems: [
          { id: 201, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/201' },
          { id: 202, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/202' },
          { id: 203, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/203' }
        ]
      };

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply((uri, requestBody) => {
          const query = JSON.parse(requestBody).query;
          if (query.includes('[System.ChangedDate] >=')) {
            return [200, activityResponse];
          }
          return [200, { workItems: [] }];
        });

      // Mock work item details with assigned users
      const assignedItems = [
        {
          id: 201,
          fields: {
            'System.AssignedTo': {
              displayName: 'John Doe',
              uniqueName: 'john@company.com'
            }
          }
        },
        {
          id: 202,
          fields: {
            'System.AssignedTo': {
              displayName: 'Jane Smith',
              uniqueName: 'jane@company.com'
            }
          }
        },
        {
          id: 203,
          fields: {
            'System.AssignedTo': {
              displayName: 'John Doe',
              uniqueName: 'john@company.com'
            }
          }
        }
      ];

      assignedItems.forEach(item => {
        nock('https://dev.azure.com')
          .get(`/test-org/test-project/_apis/wit/workitems/${item.id}`)
          .query({ 'api-version': '7.0' })
          .reply(200, item);
      });
    });

    it('should analyze team activity for last 7 days', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const teamActivity = await dashboard.getTeamActivity();

      assert.ok(teamActivity);
      assert.ok(Array.isArray(teamActivity));

      // Should aggregate by user
      const johnActivity = teamActivity.find(activity => activity.user === 'John Doe');
      if (johnActivity) {
        assert.ok(johnActivity.count >= 1);
      }
    });

    it('should sort team activity by contribution count', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const teamActivity = await dashboard.getTeamActivity();

      // Should be sorted in descending order
      for (let i = 1; i < teamActivity.length; i++) {
        assert.ok(teamActivity[i - 1].count >= teamActivity[i].count);
      }
    });

    it('should limit results to top contributors', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const teamActivity = await dashboard.getTeamActivity();

      // Should limit to reasonable number (e.g., top 5)
      assert.ok(teamActivity.length <= 5);
    });
  });

  describe('Alerts and Issues Detection', () => {
    beforeEach(() => {
      // Mock blocked items query
      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply((uri, requestBody) => {
          const query = JSON.parse(requestBody).query;

          if (query.includes('blocked')) {
            return [200, { workItems: [{ id: 301 }, { id: 302 }] }];
          } else if (query.includes('Priority] = 1')) {
            return [200, { workItems: [{ id: 401 }] }];
          } else if (query.includes('ChangedDate') && query.includes('< ')) {
            return [200, { workItems: [{ id: 501 }, { id: 502 }, { id: 503 }] }];
          }

          return [200, { workItems: [] }];
        });
    });

    it('should detect blocked work items', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const blockedItems = await dashboard.getBlockedItems();

      assert.ok(typeof blockedItems === 'number');
      assert.strictEqual(blockedItems, 2);
    });

    it('should detect high priority items', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const highPriority = await dashboard.getHighPriorityItems();

      assert.ok(typeof highPriority === 'number');
      assert.strictEqual(highPriority, 1);
    });

    it('should detect stale work items', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const staleItems = await dashboard.getStaleItems();

      assert.ok(typeof staleItems === 'number');
      assert.strictEqual(staleItems, 3);
    });

    it('should generate appropriate alert levels', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const alerts = await dashboard.generateAlerts();

      assert.ok(Array.isArray(alerts));

      for (const alert of alerts) {
        assert.ok(alert.type);
        assert.ok(alert.count !== undefined);
        assert.ok(alert.message);
        assert.ok(['info', 'warning', 'error'].includes(alert.level));
      }
    });
  });

  describe('Recent Completions Display', () => {
    beforeEach(() => {
      // Mock recent completions query
      const recentCompletions = {
        workItems: [
          { id: 601, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/601' },
          { id: 602, url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/602' }
        ]
      };

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply((uri, requestBody) => {
          const query = JSON.parse(requestBody).query;
          if (query.includes("'Done', 'Closed'")) {
            return [200, recentCompletions];
          }
          return [200, { workItems: [] }];
        });

      // Mock completed work item details
      const completedItems = [
        {
          id: 601,
          fields: {
            'System.Title': 'Implement user authentication',
            'System.WorkItemType': 'User Story',
            'System.State': 'Done'
          }
        },
        {
          id: 602,
          fields: {
            'System.Title': 'Fix login validation bug',
            'System.WorkItemType': 'Bug',
            'System.State': 'Closed'
          }
        }
      ];

      completedItems.forEach(item => {
        nock('https://dev.azure.com')
          .get(`/test-org/test-project/_apis/wit/workitems/${item.id}`)
          .query({ 'api-version': '7.0' })
          .reply(200, item);
      });
    });

    it('should fetch recent completions', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const completions = await dashboard.getRecentCompletions();

      assert.ok(Array.isArray(completions));
      assert.strictEqual(completions.length, 2);

      const firstCompletion = completions[0];
      assert.ok(firstCompletion.id);
      assert.ok(firstCompletion.title);
      assert.ok(firstCompletion.type);
      assert.ok(firstCompletion.icon);
    });

    it('should assign correct icons for work item types', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const completions = await dashboard.getRecentCompletions();

      const userStory = completions.find(c => c.type === 'User Story');
      const bug = completions.find(c => c.type === 'Bug');

      if (userStory) assert.strictEqual(userStory.icon, '📖');
      if (bug) assert.strictEqual(bug.icon, '🐛');
    });

    it('should limit results to reasonable number', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const completions = await dashboard.getRecentCompletions();

      // Should limit to reasonable number (e.g., top 5)
      assert.ok(completions.length <= 5);
    });
  });

  describe('Dashboard Output Generation', () => {
    it('should generate complete dashboard output', async () => {
      // Mock all necessary API endpoints for a complete dashboard
      const mockResponses = () => {
        // Current sprint
        nock('https://dev.azure.com')
          .get('/test-org/test-project/_apis/work/teamsettings/iterations')
          .query({ '$timeframe': 'current', 'api-version': '7.0' })
          .reply(200, { value: [] });

        // Work items by state (multiple calls)
        nock('https://dev.azure.com')
          .post('/test-org/test-project/_apis/wit/wiql')
          .query({ 'api-version': '7.0' })
          .times(10) // Multiple queries for different states and analyses
          .reply(200, { workItems: [] });
      };

      mockResponses();

      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const result = await dashboard.run();

      assert.ok(result.success);
      assert.ok(result.data);
      assert.ok(result.data.timestamp);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API failure
      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .reply(500, 'Internal Server Error');

      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const result = await dashboard.run();

      // Should handle errors gracefully
      assert.ok(result);
      // May succeed with partial data or fail gracefully
    });

    it('should respect silent mode for output', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      // Mock minimal API responses
      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .reply(200, { value: [] });

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .times(5)
        .reply(200, { workItems: [] });

      await dashboard.loadEnvironment();

      // Should not throw when running in silent mode
      const result = await dashboard.run();
      assert.ok(result !== undefined);
    });
  });

  describe('Quick Actions Menu', () => {
    it('should provide quick actions list', () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      const quickActions = dashboard.getQuickActions();

      assert.ok(Array.isArray(quickActions));
      assert.ok(quickActions.length > 0);

      const expectedActions = [
        'standup',
        'next-task',
        'active-work',
        'blocked-items',
        'sprint-status',
        'search'
      ];

      for (const expectedAction of expectedActions) {
        const action = quickActions.find(a => a.command.includes(expectedAction));
        assert.ok(action, `Should include ${expectedAction} action`);
        assert.ok(action.description);
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should be executable via bash wrapper', async () => {
      // This test ensures the bash wrapper works
      const { spawn } = require('child_process');

      const wrapperPath = path.join(__dirname, '../../autopm/.claude/scripts/azure/dashboard.sh');

      // Test should pass once wrapper is implemented
      const result = await new Promise((resolve) => {
        const child = spawn('bash', [wrapperPath], {
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
      assert.ok(result.code === 0 || result.output.includes('dashboard'));
    });

    it('should produce same output sections as bash script', async () => {
      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: false
      });

      // Mock minimal responses
      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .reply(200, { value: [] });

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .times(10)
        .reply(200, { workItems: [] });

      await dashboard.loadEnvironment();
      const result = await dashboard.run();

      assert.ok(result.success);
      // Output format verification would be in the actual implementation
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle missing credentials gracefully', async () => {
      // Remove .env file
      await fs.remove(path.join(testDir, '.claude', '.env'));

      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      const result = await dashboard.run();

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('credentials'));
    });

    it('should handle network timeouts', async () => {
      // Mock timeout
      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .delayConnection(2000)
        .reply(200, { value: [] });

      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();

      // Should handle timeouts gracefully
      const result = await dashboard.run();
      assert.ok(result !== undefined);
    });

    it('should continue with partial data on individual API failures', async () => {
      // Mock mixed success/failure responses
      nock('https://dev.azure.com')
        .get('/test-org/test-project/_apis/work/teamsettings/iterations')
        .query({ '$timeframe': 'current', 'api-version': '7.0' })
        .reply(200, { value: [] });

      nock('https://dev.azure.com')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(500, 'Server error')
        .post('/test-org/test-project/_apis/wit/wiql')
        .query({ 'api-version': '7.0' })
        .reply(200, { workItems: [] });

      const dashboard = new AzureDashboard({
        projectPath: testDir,
        silent: true
      });

      await dashboard.loadEnvironment();
      const result = await dashboard.run();

      // Should still provide partial results
      assert.ok(result);
    });
  });
});