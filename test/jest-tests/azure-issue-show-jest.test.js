const { AzureIssueShow } = require('../../autopm/.claude/providers/azure/issue-show');

// Mock azure-devops-node-api
jest.mock('azure-devops-node-api');

const azdev = require('azure-devops-node-api');

describe('AzureIssueShow', () => {
  let azureIssueShow;
  let mockConfig;
  let mockConnection;
  let mockWitApi;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock config
    mockConfig = {
      organization: 'test-org',
      project: 'test-project'
    };

    // Set environment variable
    process.env.AZURE_DEVOPS_TOKEN = 'fake-token';

    // Mock Work Item Tracking API
    mockWitApi = {
      getWorkItem: jest.fn()
    };

    // Mock connection
    mockConnection = {
      getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWitApi)
    };

    // Mock azure-devops-node-api
    azdev.getPersonalAccessTokenHandler = jest.fn().mockReturnValue('mock-auth-handler');
    azdev.WebApi = jest.fn().mockImplementation(() => mockConnection);

    // Create fresh instance
    azureIssueShow = new AzureIssueShow(mockConfig);
  });

  afterEach(() => {
    delete process.env.AZURE_DEVOPS_TOKEN;
  });

  describe('Constructor', () => {
    test('should initialize with correct configuration', () => {
      expect(azureIssueShow.organization).toBe('test-org');
      expect(azureIssueShow.project).toBe('test-project');
      expect(azureIssueShow.token).toBe('fake-token');
    });

    test('should create connection with correct URL and auth', () => {
      expect(azdev.getPersonalAccessTokenHandler).toHaveBeenCalledWith('fake-token');
      expect(azdev.WebApi).toHaveBeenCalledWith(
        'https://dev.azure.com/test-org',
        'mock-auth-handler'
      );
    });

    test('should throw error when AZURE_DEVOPS_TOKEN is missing', () => {
      delete process.env.AZURE_DEVOPS_TOKEN;

      expect(() => new AzureIssueShow(mockConfig))
        .toThrow('AZURE_DEVOPS_TOKEN environment variable is required');
    });
  });

  describe('execute()', () => {
    let mockWorkItem;

    beforeEach(() => {
      mockWorkItem = {
        id: 123,
        fields: {
          'System.WorkItemType': 'User Story',
          'System.Title': 'Test Work Item',
          'System.State': 'To Do',
          'System.AssignedTo': { displayName: 'John Doe' },
          'System.CreatedDate': '2023-01-01T10:00:00Z',
          'System.ChangedDate': '2023-01-02T15:30:00Z',
          'System.IterationPath': 'Project\\Sprint 1',
          'System.AreaPath': 'Project\\Feature A',
          'Microsoft.VSTS.Common.Priority': 2,
          'Microsoft.VSTS.Scheduling.StoryPoints': 5,
          'System.Description': '<div>Test description</div>',
          'Microsoft.VSTS.Common.AcceptanceCriteria': '<div>Test criteria</div>',
          'System.Tags': 'tag1; tag2; tag3'
        },
        relations: [
          {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/100'
          },
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/124'
          },
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/125'
          },
          {
            rel: 'AttachedFile',
            url: 'https://dev.azure.com/test-org/test-project/_apis/wit/attachments/file1.pdf'
          }
        ]
      };

      mockWitApi.getWorkItem.mockResolvedValue(mockWorkItem);
    });

    test('should execute successfully and format work item', async () => {
      const args = { id: '123' };

      const result = await azureIssueShow.execute(args);

      expect(mockWitApi.getWorkItem).toHaveBeenCalledWith(
        123,
        null,
        null,
        'All'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.formatted).toBeDefined();
      expect(result.data.id).toBe(123);
      expect(result.data.title).toBe('Test Work Item');
    });

    test('should throw error when work item ID is missing', async () => {
      const args = {};

      await expect(azureIssueShow.execute(args))
        .rejects
        .toThrow('Work Item ID is required');
    });

    test('should handle 404 error appropriately', async () => {
      const args = { id: '999' };
      const error = new Error('Not found');
      error.statusCode = 404;

      mockWitApi.getWorkItem.mockRejectedValue(error);

      await expect(azureIssueShow.execute(args))
        .rejects
        .toThrow('Work Item #999 not found in project test-project');
    });

    test('should handle general API errors', async () => {
      const args = { id: '123' };
      const error = new Error('API Error');

      mockWitApi.getWorkItem.mockRejectedValue(error);

      await expect(azureIssueShow.execute(args))
        .rejects
        .toThrow('Azure DevOps API error: API Error');
    });

    test('should handle string ID parameter', async () => {
      const args = { id: '456' };

      await azureIssueShow.execute(args);

      expect(mockWitApi.getWorkItem).toHaveBeenCalledWith(
        456,
        null,
        null,
        'All'
      );
    });
  });

  describe('formatWorkItem()', () => {
    test('should format work item with all fields', () => {
      const workItem = {
        id: 123,
        fields: {
          'System.WorkItemType': 'User Story',
          'System.Title': 'Test Work Item',
          'System.State': 'In Progress',
          'System.AssignedTo': { displayName: 'John Doe' },
          'System.CreatedDate': '2023-01-01T10:00:00Z',
          'System.ChangedDate': '2023-01-02T15:30:00Z',
          'System.IterationPath': 'Project\\Sprint 1',
          'System.AreaPath': 'Project\\Feature A',
          'Microsoft.VSTS.Common.Priority': 2,
          'Microsoft.VSTS.Scheduling.StoryPoints': 5,
          'System.Description': '<div>Test description</div>',
          'Microsoft.VSTS.Common.AcceptanceCriteria': '<div>Test criteria</div>',
          'System.Tags': 'tag1; tag2; tag3',
          'Microsoft.VSTS.Scheduling.Effort': 8,
          'Microsoft.VSTS.Scheduling.RemainingWork': 4,
          'Microsoft.VSTS.Scheduling.CompletedWork': 4
        },
        relations: [
          {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/100'
          },
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/124'
          },
          {
            rel: 'AttachedFile',
            url: 'https://dev.azure.com/test-org/test-project/_apis/wit/attachments/file1.pdf'
          }
        ]
      };

      const result = azureIssueShow.formatWorkItem(workItem);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 123,
        type: 'issue',
        title: 'Test Work Item',
        state: 'in_progress',
        assignee: 'John Doe',
        created: '2023-01-01T10:00:00Z',
        updated: '2023-01-02T15:30:00Z',
        workItemType: 'User Story',
        iterationPath: 'Project\\Sprint 1',
        areaPath: 'Project\\Feature A',
        priority: 2,
        storyPoints: 5,
        description: '<div>Test description</div>',
        acceptanceCriteria: '<div>Test criteria</div>',
        parent: 100,
        children: [124],
        attachmentCount: 1,
        tags: ['tag1', 'tag2', 'tag3'],
        url: 'https://dev.azure.com/test-org/test-project/_workitems/edit/123',
        metrics: {
          storyPoints: 5,
          effort: 8,
          remainingWork: 4,
          completedWork: 4
        }
      });
      expect(result.formatted).toBeDefined();
    });

    test('should handle work item with minimal fields', () => {
      const workItem = {
        id: 124,
        fields: {
          'System.WorkItemType': 'Task',
          'System.Title': 'Minimal Task',
          'System.State': 'New'
        },
        relations: []
      };

      const result = azureIssueShow.formatWorkItem(workItem);

      expect(result.data.id).toBe(124);
      expect(result.data.title).toBe('Minimal Task');
      expect(result.data.state).toBe('open');
      expect(result.data.assignee).toBeNull();
      expect(result.data.parent).toBeNull();
      expect(result.data.children).toEqual([]);
      expect(result.data.attachmentCount).toBe(0);
      expect(result.data.tags).toEqual([]);
      expect(result.data.metrics.storyPoints).toBe(0);
    });

    test('should handle work item without relations', () => {
      const workItem = {
        id: 125,
        fields: {
          'System.WorkItemType': 'Bug',
          'System.Title': 'Test Bug',
          'System.State': 'Active'
        }
        // No relations property
      };

      const result = azureIssueShow.formatWorkItem(workItem);

      expect(result.data.parent).toBeNull();
      expect(result.data.children).toEqual([]);
      expect(result.data.attachmentCount).toBe(0);
    });

    test('should map different work item types correctly', () => {
      const workItemTypes = [
        { type: 'Epic', expected: 'epic' },
        { type: 'Feature', expected: 'epic' },
        { type: 'User Story', expected: 'issue' },
        { type: 'Task', expected: 'issue' },
        { type: 'Bug', expected: 'issue' },
        { type: 'Custom Type', expected: 'issue' }
      ];

      workItemTypes.forEach(({ type, expected }) => {
        const workItem = {
          id: 1,
          fields: {
            'System.WorkItemType': type,
            'System.Title': 'Test',
            'System.State': 'New'
          },
          relations: []
        };

        const result = azureIssueShow.formatWorkItem(workItem);
        expect(result.data.type).toBe(expected);
      });
    });
  });

  describe('mapState()', () => {
    test('should map Azure DevOps states to unified states', () => {
      const stateMappings = [
        { azure: 'New', unified: 'open' },
        { azure: 'Active', unified: 'in_progress' },
        { azure: 'Resolved', unified: 'in_review' },
        { azure: 'Closed', unified: 'closed' },
        { azure: 'Removed', unified: 'cancelled' },
        { azure: 'To Do', unified: 'open' },
        { azure: 'In Progress', unified: 'in_progress' },
        { azure: 'Done', unified: 'closed' }
      ];

      stateMappings.forEach(({ azure, unified }) => {
        expect(azureIssueShow.mapState(azure)).toBe(unified);
      });
    });

    test('should default to open for unknown states', () => {
      expect(azureIssueShow.mapState('Unknown State')).toBe('open');
      expect(azureIssueShow.mapState('')).toBe('open');
      expect(azureIssueShow.mapState(null)).toBe('open');
      expect(azureIssueShow.mapState(undefined)).toBe('open');
    });
  });

  describe('extractIdFromUrl()', () => {
    test('should extract work item ID from URL', () => {
      const urls = [
        'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/123',
        'https://different.com/path/workItems/456',
        '/workItems/789'
      ];

      expect(azureIssueShow.extractIdFromUrl(urls[0])).toBe(123);
      expect(azureIssueShow.extractIdFromUrl(urls[1])).toBe(456);
      expect(azureIssueShow.extractIdFromUrl(urls[2])).toBe(789);
    });

    test('should return null for invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/no-work-items',
        'invalid-url',
        '',
        null,
        undefined
      ];

      invalidUrls.forEach(url => {
        expect(azureIssueShow.extractIdFromUrl(url)).toBeNull();
      });
    });
  });

  describe('formatForDisplay()', () => {
    test('should format work item for display with all sections', () => {
      const item = {
        id: 123,
        workItemType: 'User Story',
        title: 'Test Story',
        state: 'in_progress',
        assignee: 'John Doe',
        iterationPath: 'Project\\Sprint 1',
        areaPath: 'Project\\Feature A',
        storyPoints: 5,
        priority: 2,
        parent: 100,
        children: [124, 125],
        tags: ['important', 'frontend'],
        description: 'This is a test description',
        acceptanceCriteria: 'Given user is logged in\nWhen they click submit\nThen data is saved',
        metrics: {
          remainingWork: 8,
          completedWork: 2
        },
        url: 'https://dev.azure.com/test-org/test-project/_workitems/edit/123'
      };

      const result = azureIssueShow.formatForDisplay(item);

      expect(result).toContain('# User Story #123: Test Story');
      expect(result).toContain('**Status:** in_progress');
      expect(result).toContain('**Assignee:** John Doe');
      expect(result).toContain('**Iteration:** Project\\Sprint 1');
      expect(result).toContain('**Area:** Project\\Feature A');
      expect(result).toContain('**Story Points:** 5');
      expect(result).toContain('**Priority:** 2');
      expect(result).toContain('**Parent:** #100');
      expect(result).toContain('**Children:** #124, #125');
      expect(result).toContain('**Tags:** important, frontend');
      expect(result).toContain('## Description');
      expect(result).toContain('This is a test description');
      expect(result).toContain('## Acceptance Criteria');
      expect(result).toContain('Given user is logged in');
      expect(result).toContain('## Work Tracking');
      expect(result).toContain('- Remaining: 8h');
      expect(result).toContain('- Completed: 2h');
      expect(result).toContain('🔗 [View in Azure DevOps](https://dev.azure.com/test-org/test-project/_workitems/edit/123)');
    });

    test('should handle work item with minimal data', () => {
      const item = {
        id: 124,
        workItemType: 'Task',
        title: 'Simple Task',
        state: 'open',
        assignee: null,
        iterationPath: 'Project\\Sprint 1',
        areaPath: 'Project\\Area 1',
        parent: null,
        children: [],
        tags: [],
        description: '',
        acceptanceCriteria: '',
        metrics: {
          remainingWork: 0,
          completedWork: 0
        },
        url: 'https://dev.azure.com/test-org/test-project/_workitems/edit/124'
      };

      const result = azureIssueShow.formatForDisplay(item);

      expect(result).toContain('# Task #124: Simple Task');
      expect(result).toContain('**Assignee:** Unassigned');
      expect(result).not.toContain('**Story Points:**');
      expect(result).not.toContain('**Priority:**');
      expect(result).not.toContain('**Parent:**');
      expect(result).not.toContain('**Children:**');
      expect(result).not.toContain('**Tags:**');
      expect(result).toContain('_No description provided_');
      expect(result).not.toContain('## Acceptance Criteria');
      expect(result).not.toContain('## Work Tracking');
    });

    test('should handle empty description appropriately', () => {
      const item = {
        id: 125,
        workItemType: 'Bug',
        title: 'Test Bug',
        state: 'open',
        iterationPath: 'Project\\Sprint 1',
        areaPath: 'Project\\Area 1',
        parent: null,
        children: [],
        tags: [],
        description: null,
        metrics: { remainingWork: 0, completedWork: 0 },
        url: 'https://example.com'
      };

      const result = azureIssueShow.formatForDisplay(item);

      expect(result).toContain('## Description');
      expect(result).toContain('_No description provided_');
    });

    test('should include work tracking only when there is remaining work', () => {
      const itemWithWork = {
        id: 126,
        workItemType: 'Task',
        title: 'Task with Work',
        state: 'open',
        iterationPath: 'Sprint 1',
        areaPath: 'Area 1',
        parent: null,
        children: [],
        tags: [],
        description: 'Description',
        metrics: { remainingWork: 5, completedWork: 3 },
        url: 'https://example.com'
      };

      const itemWithoutWork = {
        ...itemWithWork,
        metrics: { remainingWork: 0, completedWork: 0 }
      };

      const resultWithWork = azureIssueShow.formatForDisplay(itemWithWork);
      const resultWithoutWork = azureIssueShow.formatForDisplay(itemWithoutWork);

      expect(resultWithWork).toContain('## Work Tracking');
      expect(resultWithWork).toContain('- Remaining: 5h');
      expect(resultWithWork).toContain('- Completed: 3h');

      expect(resultWithoutWork).not.toContain('## Work Tracking');
    });
  });

  describe('Integration Tests', () => {
    test('should maintain backward compatibility with direct module usage', () => {
      const issueShow = require('../../autopm/.claude/providers/azure/issue-show');

      expect(typeof issueShow.execute).toBe('function');
      expect(typeof issueShow.formatWorkItem).toBe('function');
      expect(typeof issueShow.mapState).toBe('function');
      expect(typeof issueShow.extractIdFromUrl).toBe('function');
      expect(typeof issueShow.formatForDisplay).toBe('function');
    });

    test('should handle edge cases in data processing', () => {
      // Test with empty/null values
      const emptyWorkItem = {
        id: 999,
        fields: {},
        relations: null
      };

      const result = azureIssueShow.formatWorkItem(emptyWorkItem);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(999);
      expect(result.data.tags).toEqual([]);
      expect(result.data.children).toEqual([]);
    });

    test('should handle tag parsing correctly', () => {
      const workItemWithTags = {
        id: 1000,
        fields: {
          'System.WorkItemType': 'Task',
          'System.Title': 'Test',
          'System.State': 'New',
          'System.Tags': '  tag1  ;  tag2  ;  tag3  '
        },
        relations: []
      };

      const workItemWithoutTags = {
        id: 1001,
        fields: {
          'System.WorkItemType': 'Task',
          'System.Title': 'Test',
          'System.State': 'New'
        },
        relations: []
      };

      const resultWithTags = azureIssueShow.formatWorkItem(workItemWithTags);
      const resultWithoutTags = azureIssueShow.formatWorkItem(workItemWithoutTags);

      expect(resultWithTags.data.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(resultWithoutTags.data.tags).toEqual([]);
    });
  });
});