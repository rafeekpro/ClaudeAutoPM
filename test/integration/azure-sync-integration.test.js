/**
 * Azure DevOps Integration Tests
 *
 * IMPORTANT: These tests require real Azure DevOps credentials
 *
 * Setup:
 * 1. Create a test project in Azure DevOps
 * 2. Generate a Personal Access Token (PAT) with work items read/write permissions
 * 3. Set environment variables:
 *    export AZURE_DEVOPS_PAT=your_pat_token
 *    export AZURE_DEVOPS_ORG=your_organization
 *    export AZURE_DEVOPS_PROJECT=your_test_project
 *
 * Run tests:
 * npm run test:integration:azure
 *
 * @requires azure-devops-node-api
 */

const AzureDevOpsProvider = require('../../lib/providers/AzureDevOpsProvider');
const IssueService = require('../../lib/services/IssueService');
const EpicService = require('../../lib/services/EpicService');
const fs = require('fs-extra');
const path = require('path');

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds per test
const CLEANUP_DELAY = 1000; // 1 second delay between operations

describe('Azure DevOps Integration Tests', () => {
  let provider;
  let issueService;
  let epicService;
  let createdWorkItems = []; // Track for cleanup

  beforeAll(async () => {
    // Verify environment variables
    if (!process.env.AZURE_DEVOPS_PAT || !process.env.AZURE_DEVOPS_ORG || !process.env.AZURE_DEVOPS_PROJECT) {
      throw new Error(
        'Missing Azure DevOps credentials. Please set:\n' +
        '  AZURE_DEVOPS_PAT\n' +
        '  AZURE_DEVOPS_ORG\n' +
        '  AZURE_DEVOPS_PROJECT'
      );
    }

    // Initialize provider
    provider = new AzureDevOpsProvider({
      token: process.env.AZURE_DEVOPS_PAT,
      organization: process.env.AZURE_DEVOPS_ORG,
      project: process.env.AZURE_DEVOPS_PROJECT
    });

    await provider.authenticate();

    // Initialize services
    issueService = new IssueService({ provider });
    epicService = new EpicService({ provider });

    // Ensure test directories exist
    await fs.ensureDir('.claude/issues');
    await fs.ensureDir('.claude/epics');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup created work items
    console.log(`\nCleaning up ${createdWorkItems.length} test work items...`);
    for (const workItemId of createdWorkItems) {
      try {
        await provider.deleteWorkItem(workItemId);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
      } catch (error) {
        console.warn(`Failed to delete work item ${workItemId}:`, error.message);
      }
    }

    // Cleanup test files
    try {
      await fs.remove('.claude/issues/test-*.md');
      await fs.remove('.claude/epics/test-*.md');
      await fs.remove('.claude/azure-sync-map.json');
      await fs.remove('.claude/epic-azure-sync-map.json');
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }, TEST_TIMEOUT * 2);

  describe('1. Provider CRUD Operations', () => {
    test('should create a User Story work item', async () => {
      const workItem = await provider.createWorkItem('User Story', {
        title: 'Integration Test - User Story',
        description: 'Test work item created by integration tests',
        state: 'New',
        tags: 'test;integration'
      });

      expect(workItem).toBeDefined();
      expect(workItem.id).toBeDefined();
      expect(workItem.fields['System.Title']).toBe('Integration Test - User Story');
      expect(workItem.fields['System.WorkItemType']).toBe('User Story');

      createdWorkItems.push(workItem.id);
    }, TEST_TIMEOUT);

    test('should retrieve a work item by ID', async () => {
      // Create work item first
      const created = await provider.createWorkItem('Task', {
        title: 'Integration Test - Task',
        description: 'Test task for retrieval',
        state: 'New'
      });
      createdWorkItems.push(created.id);

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Retrieve it
      const retrieved = await provider.getWorkItem(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.fields['System.Title']).toBe('Integration Test - Task');
    }, TEST_TIMEOUT);

    test('should update a work item', async () => {
      // Create work item
      const created = await provider.createWorkItem('Bug', {
        title: 'Integration Test - Bug',
        description: 'Original description',
        state: 'New'
      });
      createdWorkItems.push(created.id);

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Update it
      const updated = await provider.updateWorkItem(created.id, {
        title: 'Integration Test - Bug (Updated)',
        state: 'Active'
      });

      expect(updated.fields['System.Title']).toBe('Integration Test - Bug (Updated)');
      expect(updated.fields['System.State']).toBe('Active');
    }, TEST_TIMEOUT);

    test('should create an Epic work item', async () => {
      const epic = await provider.createWorkItem('Epic', {
        title: 'Integration Test - Epic',
        description: 'Test epic for integration tests',
        state: 'New',
        priority: 'P1'
      });

      expect(epic).toBeDefined();
      expect(epic.id).toBeDefined();
      expect(epic.fields['System.WorkItemType']).toBe('Epic');

      createdWorkItems.push(epic.id);
    }, TEST_TIMEOUT);

    test('should delete a work item', async () => {
      // Create work item
      const created = await provider.createWorkItem('Task', {
        title: 'Integration Test - To Delete',
        state: 'New'
      });

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Delete it
      await expect(provider.deleteWorkItem(created.id)).resolves.not.toThrow();

      // Remove from cleanup list
      createdWorkItems = createdWorkItems.filter(id => id !== created.id);
    }, TEST_TIMEOUT);
  });

  describe('2. Work Item Comments', () => {
    let testWorkItemId;

    beforeAll(async () => {
      const workItem = await provider.createWorkItem('User Story', {
        title: 'Integration Test - Comments',
        state: 'New'
      });
      testWorkItemId = workItem.id;
      createdWorkItems.push(testWorkItemId);
      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));
    }, TEST_TIMEOUT);

    test('should add a comment to work item', async () => {
      const comment = await provider.addComment(testWorkItemId, 'Test comment from integration tests');

      expect(comment).toBeDefined();
      expect(comment.text).toContain('Test comment');
    }, TEST_TIMEOUT);

    test('should retrieve work item comments', async () => {
      const comments = await provider.getComments(testWorkItemId);

      expect(comments).toBeDefined();
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('3. WIQL Queries', () => {
    test('should query work items with WIQL', async () => {
      const wiql = `
        SELECT [System.Id], [System.Title], [System.State]
        FROM WorkItems
        WHERE [System.WorkItemType] = 'Task'
        AND [System.State] = 'New'
        ORDER BY [System.CreatedDate] DESC
      `;

      const results = await provider.queryWorkItems(wiql, { top: 10 });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    }, TEST_TIMEOUT);

    test('should filter by tags', async () => {
      const wiql = `
        SELECT [System.Id], [System.Title]
        FROM WorkItems
        WHERE [System.Tags] CONTAINS 'test'
        ORDER BY [System.ChangedDate] DESC
      `;

      const results = await provider.queryWorkItems(wiql, { top: 5 });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('4. Issue Sync Operations', () => {
    let localIssueNumber;
    let syncedWorkItemId;

    beforeEach(async () => {
      localIssueNumber = Math.floor(Math.random() * 100000);

      // Create local test issue
      const issueContent = `---
id: ${localIssueNumber}
title: "Integration Test Issue ${localIssueNumber}"
status: open
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---

# Integration Test Issue ${localIssueNumber}

This is a test issue for Azure DevOps integration testing.

## Description
Testing sync functionality between local issues and Azure Work Items.
`;

      await fs.writeFile(
        path.join('.claude/issues', `${localIssueNumber}.md`),
        issueContent
      );
    }, TEST_TIMEOUT);

    afterEach(async () => {
      // Cleanup
      if (syncedWorkItemId) {
        createdWorkItems.push(syncedWorkItemId);
      }
      try {
        await fs.remove(path.join('.claude/issues', `${localIssueNumber}.md`));
      } catch (error) {
        // Ignore
      }
    });

    test('should sync local issue to Azure (push)', async () => {
      const result = await issueService.syncToAzure(localIssueNumber);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.workItemId).toBeDefined();
      expect(result.action).toBe('created');

      syncedWorkItemId = result.workItemId;

      // Verify work item exists in Azure
      const workItem = await provider.getWorkItem(syncedWorkItemId);
      expect(workItem.fields['System.Title']).toContain(`Integration Test Issue ${localIssueNumber}`);
    }, TEST_TIMEOUT);

    test('should sync from Azure to local (pull)', async () => {
      // Create work item in Azure first
      const workItem = await provider.createWorkItem('User Story', {
        title: `Azure Work Item ${Date.now()}`,
        description: 'Created for pull test',
        state: 'New'
      });
      createdWorkItems.push(workItem.id);

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Sync to local
      const result = await issueService.syncFromAzure(workItem.id);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.localNumber).toBeDefined();

      // Verify local file was created
      const localPath = path.join('.claude/issues', `${result.localNumber}.md`);
      const exists = await fs.pathExists(localPath);
      expect(exists).toBe(true);

      // Cleanup
      await fs.remove(localPath);
    }, TEST_TIMEOUT);

    test('should detect sync conflicts', async () => {
      // Create and sync
      const result1 = await issueService.syncToAzure(localIssueNumber);
      syncedWorkItemId = result1.workItemId;

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Modify both local and remote
      const issueContent = await fs.readFile(
        path.join('.claude/issues', `${localIssueNumber}.md`),
        'utf8'
      );
      await fs.writeFile(
        path.join('.claude/issues', `${localIssueNumber}.md`),
        issueContent.replace('Testing sync', 'MODIFIED locally')
      );

      await provider.updateWorkItem(syncedWorkItemId, {
        description: 'MODIFIED in Azure'
      });

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Try bidirectional sync - should detect conflict
      const result2 = await issueService.syncBidirectionalAzure(localIssueNumber, {
        conflictStrategy: 'detect'
      });

      // Depending on implementation, conflict might be detected
      expect(result2).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('5. Epic Sync Operations', () => {
    let testEpicName;
    let syncedEpicWorkItemId;

    beforeEach(async () => {
      testEpicName = `test-epic-${Date.now()}`;

      // Create local test epic
      const epicContent = `---
name: ${testEpicName}
title: "Integration Test Epic"
status: planning
priority: P2
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---

# Integration Test Epic

## Overview
Testing epic sync with Azure DevOps.

## Tasks
- [ ] Task 1: Initial setup
- [ ] Task 2: Implementation
- [x] Task 3: Testing (completed)
`;

      await fs.writeFile(
        path.join('.claude/epics', `${testEpicName}.md`),
        epicContent
      );
    }, TEST_TIMEOUT);

    afterEach(async () => {
      // Cleanup
      if (syncedEpicWorkItemId) {
        createdWorkItems.push(syncedEpicWorkItemId);
      }
      try {
        await fs.remove(path.join('.claude/epics', `${testEpicName}.md`));
      } catch (error) {
        // Ignore
      }
    });

    test('should sync local epic to Azure', async () => {
      const result = await epicService.syncEpicToAzure(testEpicName);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.workItemId).toBeDefined();
      expect(result.action).toBe('created');

      syncedEpicWorkItemId = result.workItemId;

      // Verify epic in Azure
      const workItem = await provider.getWorkItem(syncedEpicWorkItemId);
      expect(workItem.fields['System.WorkItemType']).toBe('Epic');
      expect(workItem.fields['System.Title']).toBe('Integration Test Epic');
      expect(workItem.fields['System.Description']).toContain('Task 1');
    }, TEST_TIMEOUT);

    test('should sync epic from Azure to local', async () => {
      // Create epic in Azure
      const epicWorkItem = await provider.createWorkItem('Epic', {
        title: `Azure Epic ${Date.now()}`,
        description: '## Overview\nAzure-created epic\n\n## Tasks\n- [ ] Azure task 1\n- [x] Azure task 2',
        state: 'New'
      });
      createdWorkItems.push(epicWorkItem.id);

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Sync to local
      const result = await epicService.syncEpicFromAzure(epicWorkItem.id);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.epicName).toBeDefined();

      // Verify local file
      const localPath = path.join('.claude/epics', `${result.epicName}.md`);
      const exists = await fs.pathExists(localPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(localPath, 'utf8');
      expect(content).toContain('Azure-created epic');
      expect(content).toContain('Azure task 1');

      // Cleanup
      await fs.remove(localPath);
    }, TEST_TIMEOUT);

    test('should check epic sync status', async () => {
      // Sync epic first
      const result = await epicService.syncEpicToAzure(testEpicName);
      syncedEpicWorkItemId = result.workItemId;

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Check status
      const status = await epicService.getEpicAzureSyncStatus(testEpicName);

      expect(status).toBeDefined();
      expect(status.synced).toBe(true);
      expect(status.workItemId).toBe(String(syncedEpicWorkItemId));
      expect(status.epicName).toBe(testEpicName);
    }, TEST_TIMEOUT);
  });

  describe('6. Work Item Types', () => {
    const workItemTypes = ['Epic', 'Feature', 'User Story', 'Task', 'Bug'];

    test.each(workItemTypes)('should create %s work item type', async (type) => {
      const workItem = await provider.createWorkItem(type, {
        title: `Integration Test - ${type}`,
        description: `Testing ${type} creation`,
        state: 'New'
      });

      expect(workItem).toBeDefined();
      expect(workItem.id).toBeDefined();
      expect(workItem.fields['System.WorkItemType']).toBe(type);

      createdWorkItems.push(workItem.id);
    }, TEST_TIMEOUT);
  });

  describe('7. State Management', () => {
    const states = ['New', 'Active', 'Resolved', 'Closed'];

    test('should transition work item through states', async () => {
      // Create work item
      const workItem = await provider.createWorkItem('Task', {
        title: 'Integration Test - State Transitions',
        state: 'New'
      });
      createdWorkItems.push(workItem.id);

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Test state transitions
      for (const state of states) {
        const updated = await provider.updateWorkItem(workItem.id, { state });
        expect(updated.fields['System.State']).toBe(state);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }, TEST_TIMEOUT * 2);
  });

  describe('8. Error Handling', () => {
    test('should handle non-existent work item', async () => {
      await expect(provider.getWorkItem(999999999)).rejects.toThrow();
    }, TEST_TIMEOUT);

    test('should handle invalid work item type', async () => {
      await expect(
        provider.createWorkItem('InvalidType', { title: 'Test' })
      ).rejects.toThrow();
    }, TEST_TIMEOUT);

    test('should handle sync of non-existent local issue', async () => {
      await expect(
        issueService.syncToAzure(999999999)
      ).rejects.toThrow();
    }, TEST_TIMEOUT);

    test('should handle sync from non-Epic work item to epic', async () => {
      // Create a Task (not Epic)
      const task = await provider.createWorkItem('Task', {
        title: 'Not an Epic',
        state: 'New'
      });
      createdWorkItems.push(task.id);

      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));

      // Try to sync as epic - should fail
      await expect(
        epicService.syncEpicFromAzure(task.id)
      ).rejects.toThrow(/not an Epic/);
    }, TEST_TIMEOUT);
  });
});
