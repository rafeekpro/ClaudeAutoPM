/**
 * Integration tests for Azure DevOps pr-create command
 * Tests the pull request creation functionality with mocked API responses
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const nock = require('nock');

// Mock environment variables
process.env.AZURE_DEVOPS_ORG = 'test-org';
process.env.AZURE_DEVOPS_PROJECT = 'test-project';
process.env.AZURE_DEVOPS_TOKEN = 'test-token';
process.env.AZURE_DEVOPS_PAT = 'test-token'; // Backwards compatibility

describe('Azure DevOps pr-create Command', () => {
  let AzurePRCreate;
  let prCreate;
  const baseUrl = 'https://dev.azure.com';

  beforeEach(() => {
    // Clean require cache to ensure fresh module load
    delete require.cache[require.resolve('../../../autopm/.claude/providers/azure/pr-create.js')];
    AzurePRCreate = require('../../../autopm/.claude/providers/azure/pr-create.js');

    // Create instance with test config
    prCreate = new AzurePRCreate({
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
    it('should create a pull request successfully', async () => {
      const prData = {
        title: 'Test PR',
        description: 'This is a test pull request',
        sourceBranch: 'feature/test-branch',
        targetBranch: 'main'
      };

      const mockCreatedPR = {
        pullRequestId: 42,
        title: prData.title,
        description: prData.description,
        sourceRefName: `refs/heads/${prData.sourceBranch}`,
        targetRefName: `refs/heads/${prData.targetBranch}`,
        status: 'active',
        createdBy: {
          displayName: 'Test User',
          uniqueName: 'test.user@example.com'
        },
        creationDate: '2025-01-10T10:00:00Z',
        url: 'https://dev.azure.com/test-org/test-project/_apis/git/pullrequests/42',
        repository: {
          id: 'repo-id',
          name: 'test-repo'
        }
      };

      // Mock repository lookup
      const repoScope = nock(baseUrl)
        .get('/test-org/test-project/_apis/git/repositories')
        .query({ 'api-version': '7.0' })
        .matchHeader('authorization', /Basic .+/)
        .reply(200, {
          value: [{
            id: 'repo-id',
            name: 'test-repo',
            defaultBranch: 'refs/heads/main'
          }]
        });

      // Mock PR creation
      const prScope = nock(baseUrl)
        .post('/test-org/test-project/_apis/git/repositories/repo-id/pullrequests', {
          sourceRefName: `refs/heads/${prData.sourceBranch}`,
          targetRefName: `refs/heads/${prData.targetBranch}`,
          title: prData.title,
          description: prData.description
        })
        .query({ 'api-version': '7.0' })
        .matchHeader('authorization', /Basic .+/)
        .reply(201, mockCreatedPR);

      // Mock console.log to capture output
      const outputs = [];
      const originalLog = console.log;
      console.log = (...args) => outputs.push(args.join(' '));

      try {
        await prCreate.execute(prData);

        const output = outputs.join('\n');
        assert.ok(output.includes('Pull request created successfully'), 'Success message should be shown');
        assert.ok(output.includes('#42'), 'PR number should be shown');
        assert.ok(output.includes(prData.title), 'PR title should be shown');
        assert.ok(output.includes('Test User'), 'Creator should be shown');

        assert.ok(repoScope.isDone(), 'Repository API call should have been made');
        assert.ok(prScope.isDone(), 'PR creation API call should have been made');
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle optional reviewers parameter', async () => {
      const prData = {
        title: 'PR with Reviewers',
        description: 'Testing reviewer assignment',
        sourceBranch: 'feature/reviewers',
        targetBranch: 'main',
        reviewers: ['user1@example.com', 'user2@example.com']
      };

      const mockCreatedPR = {
        pullRequestId: 43,
        title: prData.title,
        description: prData.description,
        sourceRefName: `refs/heads/${prData.sourceBranch}`,
        targetRefName: `refs/heads/${prData.targetBranch}`,
        status: 'active',
        reviewers: [
          {
            displayName: 'User One',
            uniqueName: 'user1@example.com',
            vote: 0
          },
          {
            displayName: 'User Two',
            uniqueName: 'user2@example.com',
            vote: 0
          }
        ]
      };

      // Mock repository lookup
      nock(baseUrl)
        .get('/test-org/test-project/_apis/git/repositories')
        .query({ 'api-version': '7.0' })
        .reply(200, {
          value: [{
            id: 'repo-id',
            name: 'test-repo'
          }]
        });

      // Mock PR creation with reviewers
      const prScope = nock(baseUrl)
        .post('/test-org/test-project/_apis/git/repositories/repo-id/pullrequests', (body) => {
          // Verify reviewers are included in request
          return body.reviewers && body.reviewers.length === 2;
        })
        .query({ 'api-version': '7.0' })
        .reply(201, mockCreatedPR);

      const outputs = [];
      const originalLog = console.log;
      console.log = (...args) => outputs.push(args.join(' '));

      try {
        await prCreate.execute(prData);

        const output = outputs.join('\n');
        assert.ok(output.includes('User One') || output.includes('Reviewers assigned'),
          'Reviewers should be mentioned');

        assert.ok(prScope.isDone(), 'PR creation with reviewers should have been called');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required parameters', async () => {
      const invalidData = {
        title: 'Missing source branch',
        targetBranch: 'main'
        // Missing sourceBranch
      };

      await assert.rejects(
        async () => {
          await prCreate.execute(invalidData);
        },
        (err) => {
          assert.ok(
            err.message.includes('sourceBranch') ||
            err.message.includes('required'),
            'Error should indicate missing source branch'
          );
          return true;
        }
      );
    });

    it('should handle branch not found errors', async () => {
      const prData = {
        title: 'Test PR',
        description: 'Testing branch not found',
        sourceBranch: 'non-existent-branch',
        targetBranch: 'main'
      };

      // Mock repository lookup
      nock(baseUrl)
        .get('/test-org/test-project/_apis/git/repositories')
        .query({ 'api-version': '7.0' })
        .reply(200, {
          value: [{
            id: 'repo-id',
            name: 'test-repo'
          }]
        });

      // Mock PR creation failure
      nock(baseUrl)
        .post('/test-org/test-project/_apis/git/repositories/repo-id/pullrequests')
        .query({ 'api-version': '7.0' })
        .reply(400, {
          message: 'TF401179: The source branch non-existent-branch does not exist'
        });

      await assert.rejects(
        async () => {
          await prCreate.execute(prData);
        },
        (err) => {
          assert.ok(
            err.message.includes('branch') && err.message.includes('not exist'),
            'Error should indicate branch not found'
          );
          return true;
        }
      );
    });

    it('should handle duplicate PR errors', async () => {
      const prData = {
        title: 'Duplicate PR',
        description: 'Testing duplicate PR',
        sourceBranch: 'feature/existing',
        targetBranch: 'main'
      };

      // Mock repository lookup
      nock(baseUrl)
        .get('/test-org/test-project/_apis/git/repositories')
        .query({ 'api-version': '7.0' })
        .reply(200, {
          value: [{
            id: 'repo-id',
            name: 'test-repo'
          }]
        });

      // Mock PR creation failure due to existing PR
      nock(baseUrl)
        .post('/test-org/test-project/_apis/git/repositories/repo-id/pullrequests')
        .query({ 'api-version': '7.0' })
        .reply(409, {
          message: 'A pull request already exists between these branches'
        });

      await assert.rejects(
        async () => {
          await prCreate.execute(prData);
        },
        (err) => {
          assert.ok(
            err.message.includes('already exists') || err.message.includes('409'),
            'Error should indicate duplicate PR'
          );
          return true;
        }
      );
    });

    it('should handle repository not found', async () => {
      const prData = {
        title: 'Test PR',
        description: 'Testing repo not found',
        sourceBranch: 'feature/test',
        targetBranch: 'main'
      };

      // Mock repository lookup failure
      nock(baseUrl)
        .get('/test-org/test-project/_apis/git/repositories')
        .query({ 'api-version': '7.0' })
        .reply(200, {
          value: [] // Empty repository list
        });

      await assert.rejects(
        async () => {
          await prCreate.execute(prData);
        },
        (err) => {
          assert.ok(
            err.message.includes('repository') || err.message.includes('not found'),
            'Error should indicate repository not found'
          );
          return true;
        }
      );
    });
  });

  describe('Auto-Complete and Work Item Linking', () => {
    it('should set auto-complete when requested', async () => {
      const prData = {
        title: 'Auto-complete PR',
        description: 'Testing auto-complete',
        sourceBranch: 'feature/auto',
        targetBranch: 'main',
        autoComplete: true
      };

      const mockCreatedPR = {
        pullRequestId: 44,
        title: prData.title,
        sourceRefName: `refs/heads/${prData.sourceBranch}`,
        targetRefName: `refs/heads/${prData.targetBranch}`,
        status: 'active'
      };

      // Mock repository lookup
      nock(baseUrl)
        .get('/test-org/test-project/_apis/git/repositories')
        .query({ 'api-version': '7.0' })
        .reply(200, {
          value: [{
            id: 'repo-id',
            name: 'test-repo'
          }]
        });

      // Mock PR creation
      nock(baseUrl)
        .post('/test-org/test-project/_apis/git/repositories/repo-id/pullrequests')
        .query({ 'api-version': '7.0' })
        .reply(201, mockCreatedPR);

      // Mock auto-complete setting
      const autoCompleteScope = nock(baseUrl)
        .patch(`/test-org/test-project/_apis/git/repositories/repo-id/pullrequests/44`)
        .query({ 'api-version': '7.0' })
        .reply(200, {
          ...mockCreatedPR,
          autoCompleteSetBy: {
            displayName: 'Test User'
          }
        });

      const outputs = [];
      const originalLog = console.log;
      console.log = (...args) => outputs.push(args.join(' '));

      try {
        await prCreate.execute(prData);

        const output = outputs.join('\n');
        assert.ok(
          output.includes('auto-complete') || output.includes('Auto-complete'),
          'Auto-complete should be mentioned'
        );

        assert.ok(autoCompleteScope.isDone(), 'Auto-complete API call should have been made');
      } finally {
        console.log = originalLog;
      }
    });

    it('should link work items when provided', async () => {
      const prData = {
        title: 'PR with Work Items',
        description: 'Testing work item linking',
        sourceBranch: 'feature/work-items',
        targetBranch: 'main',
        workItems: [123, 456]
      };

      const mockCreatedPR = {
        pullRequestId: 45,
        title: prData.title,
        sourceRefName: `refs/heads/${prData.sourceBranch}`,
        targetRefName: `refs/heads/${prData.targetBranch}`,
        status: 'active'
      };

      // Mock repository lookup
      nock(baseUrl)
        .get('/test-org/test-project/_apis/git/repositories')
        .query({ 'api-version': '7.0' })
        .reply(200, {
          value: [{
            id: 'repo-id',
            name: 'test-repo'
          }]
        });

      // Mock PR creation with work items
      const prScope = nock(baseUrl)
        .post('/test-org/test-project/_apis/git/repositories/repo-id/pullrequests', (body) => {
          // Verify work items are included
          return body.workItemRefs && body.workItemRefs.length === 2;
        })
        .query({ 'api-version': '7.0' })
        .reply(201, {
          ...mockCreatedPR,
          workItemRefs: [
            { id: '123', url: 'https://dev.azure.com/test-org/test-project/_workitems/edit/123' },
            { id: '456', url: 'https://dev.azure.com/test-org/test-project/_workitems/edit/456' }
          ]
        });

      const outputs = [];
      const originalLog = console.log;
      console.log = (...args) => outputs.push(args.join(' '));

      try {
        await prCreate.execute(prData);

        const output = outputs.join('\n');
        assert.ok(
          output.includes('123') || output.includes('work items linked'),
          'Work items should be mentioned'
        );

        assert.ok(prScope.isDone(), 'PR creation with work items should have been called');
      } finally {
        console.log = originalLog;
      }
    });
  });
});