/**
 * AzureDevOpsProvider Test Suite
 *
 * Comprehensive TDD test suite for Azure DevOps integration provider
 * Following 2025 best practices with full coverage
 *
 * Test Coverage:
 * - Constructor and initialization
 * - Authentication with PAT
 * - Work Item operations (CRUD)
 * - Comment operations
 * - Area Path and Iteration Path
 * - WIQL queries
 * - Relations (Parent/Child links)
 * - State mapping (bidirectional)
 * - Error handling
 * - Edge cases
 */

// Mock azure-devops-node-api before requiring any modules
jest.mock('azure-devops-node-api');

const AzureDevOpsProvider = require('../../../lib/providers/AzureDevOpsProvider');
const azdev = require('azure-devops-node-api');

describe('AzureDevOpsProvider', () => {
  let provider;
  let mockWitApi;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Clear environment variables
    delete process.env.AZURE_DEVOPS_PAT;
    delete process.env.AZURE_DEVOPS_ORG;
    delete process.env.AZURE_DEVOPS_PROJECT;

    // Get reference to mock WIT API
    mockWitApi = azdev.__mockWorkItemTrackingApi;

    // Restore default mock implementations
    azdev.__resetMocks();
  });

  describe('Constructor', () => {
    test('should initialize with provided options', () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat-token',
        organization: 'test-org',
        project: 'test-project'
      });

      expect(provider.token).toBe('test-pat-token');
      expect(provider.organization).toBe('test-org');
      expect(provider.project).toBe('test-project');
      expect(provider.connection).toBeNull();
      expect(provider.witApi).toBeNull();
    });

    test('should use environment variables as fallback', () => {
      process.env.AZURE_DEVOPS_PAT = 'env-pat';
      process.env.AZURE_DEVOPS_ORG = 'env-org';
      process.env.AZURE_DEVOPS_PROJECT = 'env-project';

      provider = new AzureDevOpsProvider();

      expect(provider.token).toBe('env-pat');
      expect(provider.organization).toBe('env-org');
      expect(provider.project).toBe('env-project');
    });

    test('should initialize with null connection and witApi', () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      expect(provider.connection).toBeNull();
      expect(provider.witApi).toBeNull();
    });
  });

  describe('authenticate()', () => {
    test('should throw error if token is missing', async () => {
      provider = new AzureDevOpsProvider({
        organization: 'test-org',
        project: 'test-project'
      });

      await expect(provider.authenticate()).rejects.toThrow(
        'Azure DevOps PAT token is required'
      );
    });

    test('should throw error if organization is missing', async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        project: 'test-project'
      });

      await expect(provider.authenticate()).rejects.toThrow(
        'Azure DevOps organization is required'
      );
    });

    test('should throw error if project is missing', async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org'
      });

      await expect(provider.authenticate()).rejects.toThrow(
        'Azure DevOps project is required'
      );
    });

    test('should create connection and WIT API', async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();

      expect(azdev.getPersonalAccessTokenHandler).toHaveBeenCalledWith('test-pat');
      expect(azdev.WebApi).toHaveBeenCalledWith(
        'https://dev.azure.com/test-org',
        expect.any(Object)
      );
      expect(provider.connection).toBeDefined();
      expect(provider.witApi).toBeDefined();
    });

    test('should verify project access during authentication', async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();

      expect(mockWitApi.getProject).toHaveBeenCalledWith('test-project');
    });

    test('should throw error if project not found', async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'nonexistent-project'
      });

      mockWitApi.getProject.mockResolvedValue(null);

      await expect(provider.authenticate()).rejects.toThrow(
        'Project not found or access denied'
      );
    });
  });

  describe('getWorkItem()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should fetch single work item by ID', async () => {
      const mockWorkItem = {
        id: 1,
        fields: {
          'System.Title': 'Test Work Item',
          'System.State': 'Active',
          'System.WorkItemType': 'Task'
        }
      };

      mockWitApi.getWorkItem.mockResolvedValue(mockWorkItem);

      const workItem = await provider.getWorkItem(1);

      expect(mockWitApi.getWorkItem).toHaveBeenCalledWith(1, undefined);
      expect(workItem).toEqual(mockWorkItem);
    });

    test('should fetch work item with expand option', async () => {
      const mockWorkItem = {
        id: 1,
        fields: {
          'System.Title': 'Test Work Item'
        },
        relations: []
      };

      mockWitApi.getWorkItem.mockResolvedValue(mockWorkItem);

      await provider.getWorkItem(1, 'Relations');

      expect(mockWitApi.getWorkItem).toHaveBeenCalledWith(1, 'Relations');
    });

    test('should throw error if work item not found', async () => {
      mockWitApi.getWorkItem.mockRejectedValue({
        statusCode: 404,
        message: 'Work item not found'
      });

      await expect(provider.getWorkItem(999)).rejects.toThrow(
        'Work item not found: 999'
      );
    });
  });

  describe('listWorkItems()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should list work items without filters', async () => {
      const mockWorkItems = [
        { id: 1, fields: { 'System.Title': 'Item 1' } },
        { id: 2, fields: { 'System.Title': 'Item 2' } }
      ];

      mockWitApi.queryByWiql.mockResolvedValue({
        workItems: [{ id: 1 }, { id: 2 }]
      });

      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItems);

      const items = await provider.listWorkItems();

      expect(mockWitApi.queryByWiql).toHaveBeenCalled();
      expect(mockWitApi.getWorkItems).toHaveBeenCalledWith(
        [1, 2],
        undefined,
        undefined,
        'None'
      );
      expect(items).toEqual(mockWorkItems);
    });

    test('should filter by work item type', async () => {
      mockWitApi.queryByWiql.mockResolvedValue({
        workItems: [{ id: 1 }]
      });

      mockWitApi.getWorkItems.mockResolvedValue([
        { id: 1, fields: { 'System.WorkItemType': 'Epic' } }
      ]);

      await provider.listWorkItems({ type: 'Epic' });

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('[System.WorkItemType] = \'Epic\'')
        }),
        'test-project'
      );
    });

    test('should filter by state', async () => {
      mockWitApi.queryByWiql.mockResolvedValue({
        workItems: []
      });

      await provider.listWorkItems({ state: 'Active' });

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('[System.State] = \'Active\'')
        }),
        'test-project'
      );
    });

    test('should return empty array if no work items found', async () => {
      mockWitApi.queryByWiql.mockResolvedValue({
        workItems: []
      });

      const items = await provider.listWorkItems();

      expect(items).toEqual([]);
    });
  });

  describe('createWorkItem()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should create work item with title', async () => {
      const mockWorkItem = {
        id: 10,
        fields: {
          'System.Title': 'New Task',
          'System.State': 'New'
        }
      };

      mockWitApi.createWorkItem.mockResolvedValue(mockWorkItem);

      const workItem = await provider.createWorkItem('Task', {
        title: 'New Task'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'add',
            path: '/fields/System.Title',
            value: 'New Task'
          })
        ]),
        'test-project',
        'Task'
      );
      expect(workItem).toEqual(mockWorkItem);
    });

    test('should throw error if title is missing', async () => {
      await expect(provider.createWorkItem('Task', {}))
        .rejects.toThrow('Work item title is required');
    });

    test('should create work item with description', async () => {
      mockWitApi.createWorkItem.mockResolvedValue({ id: 10 });

      await provider.createWorkItem('Task', {
        title: 'New Task',
        description: 'Task description'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'add',
            path: '/fields/System.Description',
            value: 'Task description'
          })
        ]),
        'test-project',
        'Task'
      );
    });

    test('should create work item with area path', async () => {
      mockWitApi.createWorkItem.mockResolvedValue({ id: 10 });

      await provider.createWorkItem('Task', {
        title: 'New Task',
        areaPath: 'test-project\\Team A'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'add',
            path: '/fields/System.AreaPath',
            value: 'test-project\\Team A'
          })
        ]),
        'test-project',
        'Task'
      );
    });

    test('should create work item with iteration path', async () => {
      mockWitApi.createWorkItem.mockResolvedValue({ id: 10 });

      await provider.createWorkItem('Task', {
        title: 'New Task',
        iterationPath: 'test-project\\Sprint 1'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'add',
            path: '/fields/System.IterationPath',
            value: 'test-project\\Sprint 1'
          })
        ]),
        'test-project',
        'Task'
      );
    });

    test('should create Epic work item', async () => {
      mockWitApi.createWorkItem.mockResolvedValue({ id: 5 });

      await provider.createWorkItem('Epic', {
        title: 'New Epic'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.any(Array),
        'test-project',
        'Epic'
      );
    });

    test('should create Feature work item', async () => {
      mockWitApi.createWorkItem.mockResolvedValue({ id: 6 });

      await provider.createWorkItem('Feature', {
        title: 'New Feature'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.any(Array),
        'test-project',
        'Feature'
      );
    });

    test('should create User Story work item', async () => {
      mockWitApi.createWorkItem.mockResolvedValue({ id: 7 });

      await provider.createWorkItem('User Story', {
        title: 'New User Story'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.any(Array),
        'test-project',
        'User Story'
      );
    });

    test('should create Bug work item', async () => {
      mockWitApi.createWorkItem.mockResolvedValue({ id: 8 });

      await provider.createWorkItem('Bug', {
        title: 'New Bug'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.any(Array),
        'test-project',
        'Bug'
      );
    });
  });

  describe('updateWorkItem()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should update work item title', async () => {
      const mockWorkItem = {
        id: 1,
        fields: {
          'System.Title': 'Updated Title'
        }
      };

      mockWitApi.updateWorkItem.mockResolvedValue(mockWorkItem);

      const workItem = await provider.updateWorkItem(1, {
        title: 'Updated Title'
      });

      expect(mockWitApi.updateWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'replace',
            path: '/fields/System.Title',
            value: 'Updated Title'
          })
        ]),
        1
      );
      expect(workItem).toEqual(mockWorkItem);
    });

    test('should update work item state', async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 1 });

      await provider.updateWorkItem(1, {
        state: 'Active'
      });

      expect(mockWitApi.updateWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'replace',
            path: '/fields/System.State',
            value: 'Active'
          })
        ]),
        1
      );
    });

    test('should update multiple fields', async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 1 });

      await provider.updateWorkItem(1, {
        title: 'New Title',
        description: 'New Description',
        state: 'Active'
      });

      expect(mockWitApi.updateWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({ path: '/fields/System.Title' }),
          expect.objectContaining({ path: '/fields/System.Description' }),
          expect.objectContaining({ path: '/fields/System.State' })
        ]),
        1
      );
    });
  });

  describe('deleteWorkItem()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should delete work item by ID', async () => {
      mockWitApi.deleteWorkItem.mockResolvedValue({
        id: 1,
        code: 200
      });

      const result = await provider.deleteWorkItem(1);

      expect(mockWitApi.deleteWorkItem).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    test('should handle delete errors', async () => {
      mockWitApi.deleteWorkItem.mockRejectedValue({
        statusCode: 404,
        message: 'Work item not found'
      });

      await expect(provider.deleteWorkItem(999)).rejects.toThrow(
        'Work item not found: 999'
      );
    });
  });

  describe('addComment()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should add comment to work item', async () => {
      const mockComment = {
        id: 1,
        text: 'Test comment',
        createdBy: { displayName: 'Test User' }
      };

      mockWitApi.addComment.mockResolvedValue(mockComment);

      const comment = await provider.addComment(1, 'Test comment');

      expect(mockWitApi.addComment).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Test comment'
        }),
        'test-project',
        1
      );
      expect(comment).toEqual(mockComment);
    });

    test('should throw error if comment text is empty', async () => {
      await expect(provider.addComment(1, ''))
        .rejects.toThrow('Comment text is required');
    });

    test('should throw error if comment text is whitespace only', async () => {
      await expect(provider.addComment(1, '   '))
        .rejects.toThrow('Comment text is required');
    });
  });

  describe('getComments()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should get all comments for work item', async () => {
      const mockComments = {
        comments: [
          { id: 1, text: 'Comment 1' },
          { id: 2, text: 'Comment 2' }
        ],
        count: 2
      };

      mockWitApi.getComments.mockResolvedValue(mockComments);

      const comments = await provider.getComments(1);

      expect(mockWitApi.getComments).toHaveBeenCalledWith('test-project', 1);
      expect(comments.comments).toHaveLength(2);
    });

    test('should return empty array if no comments', async () => {
      mockWitApi.getComments.mockResolvedValue({
        comments: [],
        count: 0
      });

      const comments = await provider.getComments(1);

      expect(comments.comments).toEqual([]);
    });
  });

  describe('updateComment()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should update comment text', async () => {
      const mockComment = {
        id: 1,
        text: 'Updated comment'
      };

      mockWitApi.updateComment.mockResolvedValue(mockComment);

      const comment = await provider.updateComment(1, 10, 'Updated comment');

      expect(mockWitApi.updateComment).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Updated comment'
        }),
        'test-project',
        1,
        10
      );
      expect(comment.text).toBe('Updated comment');
    });
  });

  describe('deleteComment()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should delete comment by ID', async () => {
      mockWitApi.deleteComment.mockResolvedValue({});

      await provider.deleteComment(1, 10);

      expect(mockWitApi.deleteComment).toHaveBeenCalledWith(
        'test-project',
        1,
        10
      );
    });
  });

  describe('setAreaPath()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should set area path for work item', async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 1 });

      await provider.setAreaPath(1, 'test-project\\Team A');

      expect(mockWitApi.updateWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'replace',
            path: '/fields/System.AreaPath',
            value: 'test-project\\Team A'
          })
        ]),
        1
      );
    });
  });

  describe('setIterationPath()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should set iteration path for work item', async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 1 });

      await provider.setIterationPath(1, 'test-project\\Sprint 1');

      expect(mockWitApi.updateWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'replace',
            path: '/fields/System.IterationPath',
            value: 'test-project\\Sprint 1'
          })
        ]),
        1
      );
    });
  });

  describe('queryWorkItems()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should execute WIQL query', async () => {
      const mockResult = {
        workItems: [{ id: 1 }, { id: 2 }]
      };

      const mockWorkItems = [
        { id: 1, fields: { 'System.Title': 'Item 1' } },
        { id: 2, fields: { 'System.Title': 'Item 2' } }
      ];

      mockWitApi.queryByWiql.mockResolvedValue(mockResult);
      mockWitApi.getWorkItems.mockResolvedValue(mockWorkItems);

      const wiql = 'SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = \'Task\'';
      const items = await provider.queryWorkItems(wiql);

      expect(mockWitApi.queryByWiql).toHaveBeenCalledWith(
        { query: wiql },
        'test-project'
      );
      expect(mockWitApi.getWorkItems).toHaveBeenCalledWith(
        [1, 2],
        undefined,
        undefined,
        'None'
      );
      expect(items).toEqual(mockWorkItems);
    });

    test('should return empty array if no results', async () => {
      mockWitApi.queryByWiql.mockResolvedValue({
        workItems: []
      });

      const items = await provider.queryWorkItems('SELECT [System.Id] FROM WorkItems');

      expect(items).toEqual([]);
    });

    test('should support expand option in query', async () => {
      mockWitApi.queryByWiql.mockResolvedValue({
        workItems: [{ id: 1 }]
      });

      mockWitApi.getWorkItems.mockResolvedValue([{ id: 1 }]);

      await provider.queryWorkItems('SELECT [System.Id] FROM WorkItems', {
        expand: 'Relations'
      });

      expect(mockWitApi.getWorkItems).toHaveBeenCalledWith(
        [1],
        undefined,
        undefined,
        'Relations'
      );
    });
  });

  describe('addRelation()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should add parent relation to work item', async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 1 });

      await provider.addRelation(1, {
        rel: 'System.LinkTypes.Hierarchy-Reverse',
        url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/5'
      });

      expect(mockWitApi.updateWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'add',
            path: '/relations/-',
            value: expect.objectContaining({
              rel: 'System.LinkTypes.Hierarchy-Reverse'
            })
          })
        ]),
        1
      );
    });

    test('should add child relation to work item', async () => {
      mockWitApi.updateWorkItem.mockResolvedValue({ id: 5 });

      await provider.addRelation(5, {
        rel: 'System.LinkTypes.Hierarchy-Forward',
        url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/10'
      });

      expect(mockWitApi.updateWorkItem).toHaveBeenCalled();
    });
  });

  describe('getRelations()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should get all relations for work item', async () => {
      const mockWorkItem = {
        id: 1,
        relations: [
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: 'https://dev.azure.com/test-org/_apis/wit/workItems/2'
          },
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: 'https://dev.azure.com/test-org/_apis/wit/workItems/3'
          }
        ]
      };

      mockWitApi.getWorkItem.mockResolvedValue(mockWorkItem);

      const relations = await provider.getRelations(1);

      expect(mockWitApi.getWorkItem).toHaveBeenCalledWith(1, 'Relations');
      expect(relations).toHaveLength(2);
    });

    test('should return empty array if no relations', async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 1,
        relations: []
      });

      const relations = await provider.getRelations(1);

      expect(relations).toEqual([]);
    });

    test('should return empty array if relations property missing', async () => {
      mockWitApi.getWorkItem.mockResolvedValue({
        id: 1
      });

      const relations = await provider.getRelations(1);

      expect(relations).toEqual([]);
    });
  });

  describe('checkRateLimit()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should return not available message for Azure DevOps', async () => {
      const result = await provider.checkRateLimit();

      expect(result).toEqual({
        available: false,
        message: 'Azure DevOps does not expose rate limit information via API'
      });
    });
  });

  describe('_mapStateToLocal()', () => {
    beforeEach(() => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });
    });

    test('should map New to open', () => {
      expect(provider._mapStateToLocal('New')).toBe('open');
    });

    test('should map Active to in-progress', () => {
      expect(provider._mapStateToLocal('Active')).toBe('in-progress');
    });

    test('should map Resolved to done', () => {
      expect(provider._mapStateToLocal('Resolved')).toBe('done');
    });

    test('should map Closed to closed', () => {
      expect(provider._mapStateToLocal('Closed')).toBe('closed');
    });

    test('should map Removed to closed', () => {
      expect(provider._mapStateToLocal('Removed')).toBe('closed');
    });

    test('should return original state if unknown', () => {
      expect(provider._mapStateToLocal('CustomState')).toBe('CustomState');
    });
  });

  describe('_mapLocalStatusToState()', () => {
    beforeEach(() => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });
    });

    test('should map open to New', () => {
      expect(provider._mapLocalStatusToState('open')).toBe('New');
    });

    test('should map in-progress to Active', () => {
      expect(provider._mapLocalStatusToState('in-progress')).toBe('Active');
    });

    test('should map done to Resolved', () => {
      expect(provider._mapLocalStatusToState('done')).toBe('Resolved');
    });

    test('should map closed to Closed', () => {
      expect(provider._mapLocalStatusToState('closed')).toBe('Closed');
    });

    test('should return original status if unknown', () => {
      expect(provider._mapLocalStatusToState('custom')).toBe('custom');
    });
  });

  describe('_makeRequest()', () => {
    beforeEach(async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();
    });

    test('should execute request function successfully', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue({ result: 'success' });

      const result = await provider._makeRequest(mockRequestFn);

      expect(mockRequestFn).toHaveBeenCalled();
      expect(result).toEqual({ result: 'success' });
    });

    test('should handle authentication errors', async () => {
      const mockRequestFn = jest.fn().mockRejectedValue({
        statusCode: 401,
        message: 'Unauthorized'
      });

      await expect(provider._makeRequest(mockRequestFn))
        .rejects.toThrow('Authentication failed - check AZURE_DEVOPS_PAT');
    });

    test('should handle not found errors', async () => {
      const mockRequestFn = jest.fn().mockRejectedValue({
        statusCode: 404,
        message: 'Not found'
      });

      await expect(provider._makeRequest(mockRequestFn, { id: 999 }))
        .rejects.toThrow('Work item not found: 999');
    });

    test('should handle access denied errors', async () => {
      const mockRequestFn = jest.fn().mockRejectedValue({
        statusCode: 403,
        message: 'Forbidden'
      });

      await expect(provider._makeRequest(mockRequestFn))
        .rejects.toThrow('Access denied - check PAT permissions');
    });

    test('should rethrow unknown errors', async () => {
      const mockRequestFn = jest.fn().mockRejectedValue({
        statusCode: 500,
        message: 'Internal Server Error'
      });

      await expect(provider._makeRequest(mockRequestFn))
        .rejects.toMatchObject({ statusCode: 500 });
    });
  });

  describe('Edge Cases', () => {
    test('should handle work item creation with all optional fields', async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();

      mockWitApi.createWorkItem.mockResolvedValue({ id: 10 });

      await provider.createWorkItem('Task', {
        title: 'Complete Task',
        description: 'Task description',
        state: 'Active',
        areaPath: 'test-project\\Team A',
        iterationPath: 'test-project\\Sprint 1'
      });

      expect(mockWitApi.createWorkItem).toHaveBeenCalledWith(
        null,
        expect.arrayContaining([
          expect.objectContaining({ path: '/fields/System.Title' }),
          expect.objectContaining({ path: '/fields/System.Description' }),
          expect.objectContaining({ path: '/fields/System.State' }),
          expect.objectContaining({ path: '/fields/System.AreaPath' }),
          expect.objectContaining({ path: '/fields/System.IterationPath' })
        ]),
        'test-project',
        'Task'
      );
    });

    test('should handle empty WIQL query results gracefully', async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      await provider.authenticate();

      mockWitApi.queryByWiql.mockResolvedValue({
        workItems: null
      });

      const items = await provider.queryWorkItems('SELECT [System.Id] FROM WorkItems');

      expect(items).toEqual([]);
    });

    test('should handle authentication without throwing when not authenticated', async () => {
      provider = new AzureDevOpsProvider({
        token: 'test-pat',
        organization: 'test-org',
        project: 'test-project'
      });

      expect(provider.witApi).toBeNull();
    });
  });
});
