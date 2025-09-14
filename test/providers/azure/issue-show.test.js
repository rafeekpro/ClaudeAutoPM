/**
 * Integration tests for Azure DevOps issue-show command
 * Tests the work item display functionality with mocked API responses
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const nock = require('nock');
const path = require('path');
const fs = require('fs');

// Mock environment variables
process.env.AZURE_DEVOPS_ORG = 'test-org';
process.env.AZURE_DEVOPS_PROJECT = 'test-project';
process.env.AZURE_DEVOPS_TOKEN = 'test-token';
process.env.AZURE_DEVOPS_PAT = 'test-token'; // Backwards compatibility

describe('Azure DevOps issue-show Command', () => {
  let AzureIssueShow;
  let issueShow;
  const baseUrl = 'https://dev.azure.com';

  beforeEach(() => {
    // Clean require cache to ensure fresh module load
    delete require.cache[require.resolve('../../../autopm/.claude/providers/azure/issue-show.js')];
    AzureIssueShow = require('../../../autopm/.claude/providers/azure/issue-show.js');

    // Create instance with test config
    issueShow = new AzureIssueShow({
      organization: 'test-org',
      project: 'test-project'
    });

    // Clean all nock interceptors
    nock.cleanAll();
  });

  afterEach(() => {
    // Verify all nock interceptors were used
    assert.ok(nock.isDone(), 'Not all nock interceptors were used');
  });

  describe('Happy Path', () => {
    it('should fetch and display a work item correctly', async () => {
      const workItemId = 123;
      const mockWorkItem = {
        id: workItemId,
        fields: {
          'System.Title': 'Test Work Item',
          'System.Description': 'This is a test description',
          'System.WorkItemType': 'User Story',
          'System.State': 'Active',
          'System.AssignedTo': {
            displayName: 'John Doe',
            uniqueName: 'john.doe@example.com'
          },
          'System.Tags': 'frontend; bug-fix',
          'System.IterationPath': 'Sprint 1',
          'System.AreaPath': 'Frontend',
          'Microsoft.VSTS.Common.Priority': 2,
          'Microsoft.VSTS.Scheduling.StoryPoints': 5,
          'System.CreatedDate': '2025-01-01T10:00:00Z',
          'System.ChangedDate': '2025-01-02T15:30:00Z'
        },
        _links: {
          html: { href: 'https://dev.azure.com/test-org/test-project/_workitems/edit/123' }
        }
      };

      // Mock the API call
      const scope = nock(baseUrl)
        .get(`/test-org/test-project/_apis/wit/workitems/${workItemId}`)
        .query({ '$expand': 'all', 'api-version': '7.0' })
        .matchHeader('authorization', /Basic .+/)
        .reply(200, mockWorkItem);

      // Mock console.log to capture output
      const outputs = [];
      const originalLog = console.log;
      console.log = (...args) => outputs.push(args.join(' '));

      try {
        // Execute the command
        await issueShow.execute({ id: workItemId });

        // Verify the output contains expected information
        const output = outputs.join('\n');
        assert.ok(output.includes('Test Work Item'), 'Title should be in output');
        assert.ok(output.includes('User Story'), 'Work item type should be in output');
        assert.ok(output.includes('Active'), 'State should be in output');
        assert.ok(output.includes('John Doe'), 'Assignee should be in output');
        assert.ok(output.includes('frontend'), 'Tags should be in output');
        assert.ok(output.includes('Sprint 1'), 'Iteration should be in output');
        assert.ok(output.includes('5'), 'Story points should be in output');

        // Verify API was called correctly
        assert.ok(scope.isDone(), 'API call should have been made');
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle work items with minimal fields', async () => {
      const workItemId = 456;
      const mockWorkItem = {
        id: workItemId,
        fields: {
          'System.Title': 'Minimal Work Item',
          'System.State': 'New',
          'System.WorkItemType': 'Task'
        },
        _links: {
          html: { href: `https://dev.azure.com/test-org/test-project/_workitems/edit/${workItemId}` }
        }
      };

      const scope = nock(baseUrl)
        .get(`/test-org/test-project/_apis/wit/workitems/${workItemId}`)
        .query({ '$expand': 'all', 'api-version': '7.0' })
        .matchHeader('authorization', /Basic .+/)
        .reply(200, mockWorkItem);

      const outputs = [];
      const originalLog = console.log;
      console.log = (...args) => outputs.push(args.join(' '));

      try {
        await issueShow.execute({ id: workItemId });

        const output = outputs.join('\n');
        assert.ok(output.includes('Minimal Work Item'), 'Title should be in output');
        assert.ok(output.includes('Task'), 'Work item type should be in output');
        assert.ok(output.includes('New'), 'State should be in output');
        assert.ok(output.includes('Unassigned') || !output.includes('Assigned to'),
          'Should handle unassigned items');

        assert.ok(scope.isDone(), 'API call should have been made');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 - Work Item not found', async () => {
      const workItemId = 999;

      const scope = nock(baseUrl)
        .get(`/test-org/test-project/_apis/wit/workitems/${workItemId}`)
        .query({ '$expand': 'all', 'api-version': '7.0' })
        .matchHeader('authorization', /Basic .+/)
        .reply(404, {
          message: 'Work item does not exist or you do not have permissions to read it.'
        });

      await assert.rejects(
        async () => {
          await issueShow.execute({ id: workItemId });
        },
        (err) => {
          assert.ok(err.message.includes('not found') || err.message.includes('404'),
            'Error should indicate work item not found');
          return true;
        }
      );

      assert.ok(scope.isDone(), 'API call should have been made');
    });

    it('should handle 401 - Unauthorized access', async () => {
      const workItemId = 123;

      const scope = nock(baseUrl)
        .get(`/test-org/test-project/_apis/wit/workitems/${workItemId}`)
        .query({ '$expand': 'all', 'api-version': '7.0' })
        .matchHeader('authorization', /Basic .+/)
        .reply(401, {
          message: 'Unauthorized'
        });

      await assert.rejects(
        async () => {
          await issueShow.execute({ id: workItemId });
        },
        (err) => {
          assert.ok(err.message.includes('Unauthorized') || err.message.includes('401'),
            'Error should indicate authorization failure');
          return true;
        }
      );

      assert.ok(scope.isDone(), 'API call should have been made');
    });

    it('should handle network errors', async () => {
      const workItemId = 123;

      const scope = nock(baseUrl)
        .get(`/test-org/test-project/_apis/wit/workitems/${workItemId}`)
        .query({ '$expand': 'all', 'api-version': '7.0' })
        .matchHeader('authorization', /Basic .+/)
        .replyWithError('Network timeout');

      await assert.rejects(
        async () => {
          await issueShow.execute({ id: workItemId });
        },
        (err) => {
          assert.ok(err.message.includes('Network') || err.message.includes('timeout'),
            'Error should indicate network issue');
          return true;
        }
      );

      assert.ok(scope.isDone(), 'API call should have been attempted');
    });

    it('should validate required parameters', async () => {
      await assert.rejects(
        async () => {
          await issueShow.execute({}); // Missing id parameter
        },
        (err) => {
          assert.ok(err.message.includes('id') || err.message.includes('required'),
            'Error should indicate missing id parameter');
          return true;
        }
      );
    });
  });

  describe('Field Mapping', () => {
    it('should correctly map Azure DevOps fields to internal format', async () => {
      const workItemId = 789;
      const mockWorkItem = {
        id: workItemId,
        fields: {
          'System.Title': 'Field Mapping Test',
          'System.State': 'Resolved',
          'System.Reason': 'Fixed',
          'System.WorkItemType': 'Bug',
          'System.AssignedTo': {
            displayName: 'Jane Smith'
          },
          'Microsoft.VSTS.Common.Priority': 1,
          'Microsoft.VSTS.Common.Severity': '2 - High',
          'System.Tags': 'critical; production',
          'System.CommentCount': 5
        },
        _links: {
          html: { href: `https://dev.azure.com/test-org/test-project/_workitems/edit/${workItemId}` }
        }
      };

      const scope = nock(baseUrl)
        .get(`/test-org/test-project/_apis/wit/workitems/${workItemId}`)
        .query({ '$expand': 'all', 'api-version': '7.0' })
        .matchHeader('authorization', /Basic .+/)
        .reply(200, mockWorkItem);

      const outputs = [];
      const originalLog = console.log;
      console.log = (...args) => outputs.push(args.join(' '));

      try {
        await issueShow.execute({ id: workItemId });

        const output = outputs.join('\n');

        // Verify field mappings
        assert.ok(output.includes('Bug'), 'Bug type should be displayed');
        assert.ok(output.includes('Resolved'), 'Resolved state should be displayed');
        assert.ok(output.includes('Fixed'), 'Reason should be displayed');
        assert.ok(output.includes('Priority: 1') || output.includes('P1'),
          'Priority should be displayed');
        assert.ok(output.includes('High') || output.includes('Severity'),
          'Severity should be displayed');
        assert.ok(output.includes('critical'), 'Tags should be displayed');
        assert.ok(output.includes('5') || output.includes('Comments'),
          'Comment count should be displayed');

        assert.ok(scope.isDone(), 'API call should have been made');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should fail gracefully when environment variables are missing', async () => {
      // Temporarily remove environment variables
      const originalOrg = process.env.AZURE_DEVOPS_ORG;
      const originalProject = process.env.AZURE_DEVOPS_PROJECT;
      const originalToken = process.env.AZURE_DEVOPS_TOKEN;
      const originalPat = process.env.AZURE_DEVOPS_PAT;

      delete process.env.AZURE_DEVOPS_ORG;
      delete process.env.AZURE_DEVOPS_PROJECT;
      delete process.env.AZURE_DEVOPS_TOKEN;
      delete process.env.AZURE_DEVOPS_PAT;

      // Reload module to pick up missing env vars
      delete require.cache[require.resolve('../../../autopm/.claude/providers/azure/issue-show.js')];
      const AzureIssueShowNoEnv = require('../../../autopm/.claude/providers/azure/issue-show.js');

      try {
        assert.throws(
          () => {
            new AzureIssueShowNoEnv({
              organization: 'test-org',
              project: 'test-project'
            });
          },
          (err) => {
            assert.ok(
              err.message.includes('AZURE_DEVOPS_TOKEN') ||
              err.message.includes('environment') ||
              err.message.includes('required'),
              'Error should indicate missing token'
            );
            return true;
          }
        );
      } finally {
        // Restore environment variables
        process.env.AZURE_DEVOPS_ORG = originalOrg;
        process.env.AZURE_DEVOPS_PROJECT = originalProject;
        process.env.AZURE_DEVOPS_TOKEN = originalToken;
        process.env.AZURE_DEVOPS_PAT = originalPat;
      }
    });
  });
});