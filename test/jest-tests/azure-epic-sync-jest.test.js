#!/usr/bin/env node

/**
 * Tests for Azure DevOps Epic Sync
 * TDD - Tests written before implementation
 */

const { describe, it, beforeEach, afterEach } = require('@jest/globals');
const { expect } = require('@jest/globals');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('Azure DevOps Epic Sync', () => {
  let EpicDecomposer;
  let EpicSyncer;
  let tempDir;
  let mockAzureClient;

  beforeEach(async () => {
    // Setup temp directory
    tempDir = path.join(os.tmpdir(), `autopm-azure-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    await fs.ensureDir(path.join(tempDir, '.claude', 'prds'));
    await fs.ensureDir(path.join(tempDir, '.claude', 'epics'));
    process.chdir(tempDir);

    // Mock Azure client
    mockAzureClient = {
      createWorkItem: jest.fn(),
      updateWorkItem: jest.fn(),
      getWorkItem: jest.fn()
    };

    // Setup mock responses
    let workItemId = 1000;
    mockAzureClient.createWorkItem.mockImplementation((data) => {
      const item = {
        id: workItemId++,
        fields: {
          'System.WorkItemType': data.type,
          'System.Title': data.fields['System.Title'],
          'System.Description': data.fields['System.Description'],
          'System.Parent': data.fields['System.Parent']
        },
        url: `https://dev.azure.com/org/project/_workitems/edit/${workItemId}`
      };
      return Promise.resolve(item);
    });

    // These will be our implementations
    EpicDecomposer = require('../../lib/pm/epic-decomposer');
    EpicSyncer = require('../../lib/pm/epic-syncer');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    jest.clearAllMocks();
  });

  describe('Epic Decomposition for Azure', () => {
    it('should decompose PRD into Azure hierarchy structure', async () => {
      // Arrange
      const prd = {
        title: 'User Authentication',
        content: `
# User Authentication System

## User Stories
- As a user, I want to register with email
- As a user, I want to login securely
- As an admin, I want to manage users

## Acceptance Criteria
- Email validation
- Password strength requirements
- JWT token generation
        `
      };
      await fs.writeFile(
        path.join(tempDir, '.claude/prds/user-auth.md'),
        prd.content
      );

      // Act
      const decomposer = new EpicDecomposer({ provider: 'azure' });
      const epic = await decomposer.decompose('user-auth');

      // Assert
      expect(epic.type).toBe('Epic');
      expect(epic.title).toBe('User Authentication System');
      expect(epic.userStories).toHaveLength(3);

      expect(epic.userStories[0].title).toBe('As a user, I want to register with email');
      expect(epic.userStories[0].tasks).toBeDefined();
      expect(epic.userStories[0].tasks.length).toBeGreaterThan(0);

      // Should generate tasks for each user story
      expect(epic.userStories[0].tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: expect.stringContaining('database') }),
          expect.objectContaining({ title: expect.stringContaining('API') }),
          expect.objectContaining({ title: expect.stringContaining('UI') }),
          expect.objectContaining({ title: expect.stringContaining('test') })
        ])
      );
    });

    it('should save decomposed epic to file', async () => {
      // Arrange
      const prd = {
        content: `
# Shopping Cart

## User Stories
- As a user, I want to add items to cart
        `
      };
      await fs.writeFile(
        path.join(tempDir, '.claude/prds/shopping-cart.md'),
        prd.content
      );

      // Act
      const decomposer = new EpicDecomposer({ provider: 'azure' });
      await decomposer.decompose('shopping-cart');

      // Assert
      const epicFile = path.join(tempDir, '.claude/epics/shopping-cart.md');
      expect(await fs.pathExists(epicFile)).toBe(true);

      const epicContent = await fs.readFile(epicFile, 'utf8');
      expect(epicContent).toContain('type: Epic');
      expect(epicContent).toContain('provider: azure');
      expect(epicContent).toContain('## User Stories');
      expect(epicContent).toContain('**Tasks:**');
    });
  });

  describe('Epic Sync to Azure DevOps', () => {
    it('should sync epic hierarchy to Azure DevOps', async () => {
      // Arrange
      const epicData = {
        title: 'User Authentication',
        description: 'Authentication system implementation',
        userStories: [
          {
            title: 'As a user, I want to register',
            acceptanceCriteria: ['Valid email', 'Strong password'],
            tasks: [
              { title: 'Create users table', remainingWork: 2 },
              { title: 'Build registration API', remainingWork: 4 }
            ]
          },
          {
            title: 'As a user, I want to login',
            acceptanceCriteria: ['JWT tokens', 'Session management'],
            tasks: [
              { title: 'Implement JWT generation', remainingWork: 3 },
              { title: 'Create login UI', remainingWork: 5 }
            ]
          }
        ]
      };

      await fs.writeJson(
        path.join(tempDir, '.claude/epics/user-auth.json'),
        epicData
      );

      // Act
      const syncer = new EpicSyncer({
        provider: 'azure',
        client: mockAzureClient
      });
      const result = await syncer.sync('user-auth');

      // Assert
      // Should create 1 Epic + 2 User Stories + 4 Tasks = 7 work items
      expect(mockAzureClient.createWorkItem).toHaveBeenCalledTimes(7);

      // Check Epic creation
      expect(mockAzureClient.createWorkItem).toHaveBeenCalledWith({
        type: 'Epic',
        fields: {
          'System.Title': 'User Authentication',
          'System.Description': 'Authentication system implementation',
          'System.Tags': 'ClaudeAutoPM;Epic'
        }
      });

      // Check User Story creation with parent link
      expect(mockAzureClient.createWorkItem).toHaveBeenCalledWith({
        type: 'User Story',
        fields: {
          'System.Title': 'As a user, I want to register',
          'System.Description': '',
          'System.Parent': 1000, // Epic ID
          'System.Tags': 'ClaudeAutoPM;UserStory',
          'Microsoft.VSTS.Common.AcceptanceCriteria': '<ul><li>Valid email</li><li>Strong password</li></ul>'
        }
      });

      // Check Task creation with parent link to User Story
      expect(mockAzureClient.createWorkItem).toHaveBeenCalledWith({
        type: 'Task',
        fields: {
          'System.Title': 'Create users table',
          'System.Description': '',
          'System.Parent': 1001, // User Story ID
          'System.Tags': 'ClaudeAutoPM;Task',
          'Microsoft.VSTS.Scheduling.RemainingWork': 2
        }
      });

      // Check result structure
      expect(result).toMatchObject({
        epic: { id: 1000 },
        userStories: [
          {
            id: 1001,
            tasks: [
              { id: 1002 },
              { id: 1003 }
            ]
          },
          {
            id: 1004,
            tasks: [
              { id: 1005 },
              { id: 1006 }
            ]
          }
        ]
      });
    });

    it('should update epic file with Azure DevOps IDs', async () => {
      // Arrange
      const epicData = {
        title: 'Shopping Cart',
        userStories: [
          {
            title: 'Add to cart',
            tasks: [{ title: 'Cart API' }]
          }
        ]
      };

      await fs.writeJson(
        path.join(tempDir, '.claude/epics/shopping-cart.json'),
        epicData
      );

      // Act
      const syncer = new EpicSyncer({
        provider: 'azure',
        client: mockAzureClient
      });
      await syncer.sync('shopping-cart');

      // Assert
      const updatedEpic = await fs.readJson(
        path.join(tempDir, '.claude/epics/shopping-cart.json')
      );

      expect(updatedEpic.azureDevOps).toBeDefined();
      expect(updatedEpic.azureDevOps.epicId).toBe(1000);
      expect(updatedEpic.azureDevOps.url).toContain('/_workitems/edit/');
      expect(updatedEpic.userStories[0].azureDevOps).toBeDefined();
      expect(updatedEpic.userStories[0].azureDevOps.storyId).toBe(1001);
      expect(updatedEpic.userStories[0].tasks[0].azureDevOps).toBeDefined();
      expect(updatedEpic.userStories[0].tasks[0].azureDevOps.taskId).toBe(1002);
    });

    it('should handle sync failures gracefully', async () => {
      // Arrange
      mockAzureClient.createWorkItem.mockRejectedValueOnce(
        new Error('Azure DevOps API error')
      );

      const epicData = {
        title: 'Failed Epic',
        userStories: []
      };

      await fs.writeJson(
        path.join(tempDir, '.claude/epics/failed-epic.json'),
        epicData
      );

      // Act & Assert
      const syncer = new EpicSyncer({
        provider: 'azure',
        client: mockAzureClient
      });

      await expect(syncer.sync('failed-epic'))
        .rejects.toThrow('Failed to sync epic: Azure DevOps API error');
    });
  });

  describe('Integration with PM commands', () => {
    it('should work with /pm:epic-decompose command', async () => {
      // This tests the full flow
      const prd = `
# Payment Processing

## User Stories
- As a customer, I want to pay with credit card
- As a merchant, I want to track payments
      `;

      await fs.writeFile(
        path.join(tempDir, '.claude/prds/payment.md'),
        prd
      );

      await fs.writeJson(
        path.join(tempDir, '.claude/config.json'),
        { provider: 'azure' }
      );

      // Simulate command execution
      const decomposer = new EpicDecomposer();
      const result = await decomposer.decompose('payment');

      expect(result.provider).toBe('azure');
      expect(result.userStories).toHaveLength(2);
      expect(result.userStories[0].tasks).toBeDefined();
    });
  });
});