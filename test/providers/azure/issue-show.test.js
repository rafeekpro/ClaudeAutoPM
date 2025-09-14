/**
 * Azure DevOps Provider - Issue Show Command Integration Tests
 * Tests for the /issue:show command implementation
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const AzureIssueShow = require('../../../autopm/.claude/providers/azure/issue-show');

describe('Azure DevOps Issue Show Command', () => {
  const testConfig = {
    organization: 'testorg',
    project: 'testproject'
  };

  const testToken = 'test-personal-access-token';

  let issueShow;
  let mockWitApi;

  beforeEach(() => {
    // Set the environment variable for the token
    process.env.AZURE_DEVOPS_TOKEN = testToken;

    // Create a fresh instance
    issueShow = new AzureIssueShow(testConfig);

    // Create mock Work Item Tracking API
    mockWitApi = {
      getWorkItem: async (id, fields, asOf, expand) => {
        throw new Error(`Mock not configured for work item ${id}`);
      }
    };

    // Override the connection to return our mock API
    issueShow.connection = {
      getWorkItemTrackingApi: async () => mockWitApi
    };
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.AZURE_DEVOPS_TOKEN;
  });

  describe('Success Scenarios', () => {
    it('should successfully retrieve and format a User Story work item', async () => {
      const workItemId = 123;
      const mockWorkItem = {
        id: workItemId,
        fields: {
          'System.WorkItemType': 'User Story',
          'System.Title': 'Implement user authentication',
          'System.State': 'In Progress',
          'System.AssignedTo': {
            displayName: 'John Doe',
            uniqueName: 'john.doe@testorg.com'
          },
          'System.CreatedDate': '2024-01-15T10:00:00.000Z',
          'System.ChangedDate': '2024-01-16T14:30:00.000Z',
          'System.IterationPath': 'TestProject\\Sprint 3',
          'System.AreaPath': 'TestProject\\Backend',
          'Microsoft.VSTS.Common.Priority': 2,
          'Microsoft.VSTS.Scheduling.StoryPoints': 5,
          'System.Description': '<div>As a user, I want to be able to log in securely.</div>',
          'Microsoft.VSTS.Common.AcceptanceCriteria': '<ul><li>User can login with email</li><li>Password is encrypted</li></ul>',
          'System.Tags': 'security; authentication; backend',
          'Microsoft.VSTS.Scheduling.RemainingWork': 8,
          'Microsoft.VSTS.Scheduling.CompletedWork': 4,
          'Microsoft.VSTS.Scheduling.Effort': 12
        },
        relations: [
          {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: `https://dev.azure.com/testorg/_apis/wit/workItems/100`
          },
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: `https://dev.azure.com/testorg/_apis/wit/workItems/124`
          },
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: `https://dev.azure.com/testorg/_apis/wit/workItems/125`
          },
          {
            rel: 'AttachedFile',
            url: `https://dev.azure.com/testorg/_apis/wit/attachments/abc123`
          }
        ]
      };

      // Mock the API call
      mockWitApi.getWorkItem = async (id) => {
        if (id === workItemId) {
          return mockWorkItem;
        }
        throw new Error(`Work item ${id} not found`);
      };

      // Execute
      const result = await issueShow.execute({ id: workItemId });

      // Verify success
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.ok(result.formatted);

      // Verify data mapping
      const data = result.data;
      assert.strictEqual(data.id, workItemId);
      assert.strictEqual(data.type, 'issue'); // User Story maps to 'issue'
      assert.strictEqual(data.title, 'Implement user authentication');
      assert.strictEqual(data.state, 'in_progress'); // 'In Progress' maps to 'in_progress'
      assert.strictEqual(data.assignee, 'John Doe');
      assert.strictEqual(data.workItemType, 'User Story');
      assert.strictEqual(data.iterationPath, 'TestProject\\Sprint 3');
      assert.strictEqual(data.areaPath, 'TestProject\\Backend');
      assert.strictEqual(data.priority, 2);
      assert.strictEqual(data.storyPoints, 5);

      // Verify parent/children extraction
      assert.strictEqual(data.parent, 100);
      assert.deepStrictEqual(data.children, [124, 125]);
      assert.strictEqual(data.attachmentCount, 1);

      // Verify tags parsing
      assert.deepStrictEqual(data.tags, ['security', 'authentication', 'backend']);

      // Verify metrics
      assert.strictEqual(data.metrics.storyPoints, 5);
      assert.strictEqual(data.metrics.effort, 12);
      assert.strictEqual(data.metrics.remainingWork, 8);
      assert.strictEqual(data.metrics.completedWork, 4);

      // Verify formatted output contains key information
      assert.ok(result.formatted.includes('User Story #123'));
      assert.ok(result.formatted.includes('Implement user authentication'));
      assert.ok(result.formatted.includes('Status:** in_progress'));
      assert.ok(result.formatted.includes('Assignee:** John Doe'));
      assert.ok(result.formatted.includes('Story Points:** 5'));
      assert.ok(result.formatted.includes('Parent:** #100'));
      assert.ok(result.formatted.includes('Children:** #124, #125'));
      assert.ok(result.formatted.includes('Tags:** security, authentication, backend'));
      assert.ok(result.formatted.includes('Remaining: 8h'));
      assert.ok(result.formatted.includes('Completed: 4h'));
    });

    it('should handle Epic work item type correctly', async () => {
      const workItemId = 200;
      const mockEpic = {
        id: workItemId,
        fields: {
          'System.WorkItemType': 'Epic',
          'System.Title': 'Q1 Authentication System',
          'System.State': 'Active',
          'System.AssignedTo': null, // Test unassigned case
          'System.CreatedDate': '2024-01-01T10:00:00.000Z',
          'System.ChangedDate': '2024-01-20T14:30:00.000Z',
          'System.IterationPath': 'TestProject',
          'System.AreaPath': 'TestProject',
          'Microsoft.VSTS.Common.Priority': 1,
          'System.Description': 'Complete authentication system implementation',
          'System.Tags': '' // Test empty tags
        },
        relations: [] // Test no relations
      };

      // Mock the API call
      mockWitApi.getWorkItem = async (id) => {
        if (id === workItemId) {
          return mockEpic;
        }
        throw new Error(`Work item ${id} not found`);
      };

      const result = await issueShow.execute({ id: workItemId });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.type, 'epic'); // Epic maps to 'epic'
      assert.strictEqual(result.data.state, 'in_progress'); // 'Active' maps to 'in_progress'
      assert.strictEqual(result.data.assignee, null);
      assert.strictEqual(result.data.parent, null);
      assert.deepStrictEqual(result.data.children, []);
      assert.deepStrictEqual(result.data.tags, []);
      assert.ok(result.formatted.includes('Unassigned'));
    });

    it('should handle Bug work item with all states correctly', async () => {
      const testStates = [
        { azure: 'New', unified: 'open' },
        { azure: 'Active', unified: 'in_progress' },
        { azure: 'Resolved', unified: 'in_review' },
        { azure: 'Closed', unified: 'closed' },
        { azure: 'Removed', unified: 'cancelled' }
      ];

      for (const stateTest of testStates) {
        const workItemId = 300 + testStates.indexOf(stateTest);
        const mockBug = {
          id: workItemId,
          fields: {
            'System.WorkItemType': 'Bug',
            'System.Title': `Test bug in ${stateTest.azure} state`,
            'System.State': stateTest.azure,
            'System.CreatedDate': '2024-01-01T10:00:00.000Z',
            'System.ChangedDate': '2024-01-20T14:30:00.000Z'
          },
          relations: []
        };

        // Create a new instance for each iteration
        const localIssueShow = new AzureIssueShow(testConfig);
        const localMockWitApi = {
          getWorkItem: async (id) => {
            if (id === workItemId) {
              return mockBug;
            }
            throw new Error(`Work item ${id} not found`);
          }
        };

        localIssueShow.connection = {
          getWorkItemTrackingApi: async () => localMockWitApi
        };

        const result = await localIssueShow.execute({ id: workItemId });

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.state, stateTest.unified,
          `State ${stateTest.azure} should map to ${stateTest.unified}`);
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle 404 Not Found error gracefully', async () => {
      const workItemId = 999;

      // Mock 404 response
      mockWitApi.getWorkItem = async (id) => {
        const error = new Error('Work Item not found');
        error.statusCode = 404;
        throw error;
      };

      await assert.rejects(
        async () => await issueShow.execute({ id: workItemId }),
        (error) => {
          assert.ok(error.message.includes(`Work Item #${workItemId} not found`));
          assert.ok(error.message.includes(testConfig.project));
          return true;
        }
      );
    });

    it('should handle 403 Forbidden error for insufficient permissions', async () => {
      const workItemId = 456;

      // Mock 403 response
      mockWitApi.getWorkItem = async (id) => {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
      };

      await assert.rejects(
        async () => await issueShow.execute({ id: workItemId }),
        (error) => {
          // The error should be propagated as an Azure DevOps API error
          assert.ok(error.message.includes('Azure DevOps API error') || error.message.includes('Access denied'));
          return true;
        }
      );
    });

    it('should handle missing AZURE_DEVOPS_TOKEN environment variable', async () => {
      delete process.env.AZURE_DEVOPS_TOKEN;

      assert.throws(
        () => new AzureIssueShow(testConfig),
        (error) => {
          assert.ok(error.message.includes('AZURE_DEVOPS_TOKEN environment variable is required'));
          return true;
        }
      );
    });

    it('should handle missing work item ID parameter', async () => {
      await assert.rejects(
        async () => await issueShow.execute({}),
        (error) => {
          assert.ok(error.message.includes('Work Item ID is required'));
          return true;
        }
      );
    });

    it('should handle API timeout errors', async () => {
      const workItemId = 789;

      // Mock timeout error
      mockWitApi.getWorkItem = async (id) => {
        const error = new Error('Request timeout');
        error.code = 'ETIMEDOUT';
        throw error;
      };

      await assert.rejects(
        async () => await issueShow.execute({ id: workItemId }),
        (error) => {
          assert.ok(error.message.includes('Azure DevOps API error') || error.message.includes('timeout'));
          return true;
        }
      );
    });

    it('should handle malformed API responses', async () => {
      const workItemId = 555;

      // Mock malformed response (missing required fields)
      mockWitApi.getWorkItem = async (id) => {
        if (id === workItemId) {
          return {
            id: workItemId
            // Missing 'fields' property
          };
        }
        throw new Error(`Work item ${id} not found`);
      };

      // This should throw an error as the implementation expects fields
      await assert.rejects(
        async () => await issueShow.execute({ id: workItemId }),
        (error) => {
          assert.ok(error.message.includes('Azure DevOps API error') || error.message.includes('Cannot read'));
          return true;
        }
      );
    });
  });

  describe('URL Extraction', () => {
    it('should correctly extract work item IDs from relation URLs', async () => {
      const workItemId = 666;
      const mockWorkItem = {
        id: workItemId,
        fields: {
          'System.WorkItemType': 'Task',
          'System.Title': 'Test URL extraction',
          'System.State': 'New'
        },
        relations: [
          {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: 'https://dev.azure.com/testorg/_apis/wit/workItems/1234'
          },
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: 'https://dev.azure.com/testorg/testproject/_apis/wit/workItems/5678'
          },
          {
            rel: 'System.LinkTypes.Hierarchy-Forward',
            url: 'https://dev.azure.com/testorg/_apis/wit/workItems/90'
          },
          {
            rel: 'System.LinkTypes.Related',
            url: 'https://dev.azure.com/testorg/_apis/wit/workItems/invalid-url' // Test invalid ID
          }
        ]
      };

      mockWitApi.getWorkItem = async (id) => {
        if (id === workItemId) {
          return mockWorkItem;
        }
        throw new Error(`Work item ${id} not found`);
      };

      const result = await issueShow.execute({ id: workItemId });

      assert.strictEqual(result.data.parent, 1234);
      assert.deepStrictEqual(result.data.children, [5678, 90]);
    });
  });

  describe('Formatting', () => {
    it('should properly format work item with minimal fields', async () => {
      const workItemId = 777;
      const mockWorkItem = {
        id: workItemId,
        fields: {
          'System.WorkItemType': 'Task',
          'System.Title': 'Minimal task',
          'System.State': 'New',
          'System.CreatedDate': '2024-01-01T10:00:00.000Z',
          'System.ChangedDate': '2024-01-01T10:00:00.000Z'
        },
        relations: []
      };

      mockWitApi.getWorkItem = async (id) => {
        if (id === workItemId) {
          return mockWorkItem;
        }
        throw new Error(`Work item ${id} not found`);
      };

      const result = await issueShow.execute({ id: workItemId });

      // Verify formatted output structure
      assert.ok(result.formatted.includes('Task #777'));
      assert.ok(result.formatted.includes('Minimal task'));
      assert.ok(result.formatted.includes('_No description provided_'));
      assert.ok(result.formatted.includes('View in Azure DevOps'));
      assert.ok(result.formatted.includes(`https://dev.azure.com/${testConfig.organization}/${testConfig.project}/_workitems/edit/${workItemId}`));
    });

    it('should handle special characters in tags correctly', async () => {
      const workItemId = 888;
      const mockWorkItem = {
        id: workItemId,
        fields: {
          'System.WorkItemType': 'User Story',
          'System.Title': 'Test special characters',
          'System.State': 'New',
          'System.Tags': 'C#; ASP.NET Core; Entity Framework; SQL Server; Azure DevOps',
          'System.CreatedDate': '2024-01-01T10:00:00.000Z',
          'System.ChangedDate': '2024-01-01T10:00:00.000Z'
        },
        relations: []
      };

      mockWitApi.getWorkItem = async (id) => {
        if (id === workItemId) {
          return mockWorkItem;
        }
        throw new Error(`Work item ${id} not found`);
      };

      const result = await issueShow.execute({ id: workItemId });

      assert.deepStrictEqual(result.data.tags, [
        'C#',
        'ASP.NET Core',
        'Entity Framework',
        'SQL Server',
        'Azure DevOps'
      ]);
      assert.ok(result.formatted.includes('Tags:** C#, ASP.NET Core, Entity Framework, SQL Server, Azure DevOps'));
    });
  });
});