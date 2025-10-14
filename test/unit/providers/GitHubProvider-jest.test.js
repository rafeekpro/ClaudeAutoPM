/**
 * GitHubProvider Test Suite
 *
 * Comprehensive TDD test suite for GitHub integration provider
 * Following 2025 best practices with full coverage
 *
 * Test Coverage:
 * - Constructor and initialization
 * - Authentication
 * - Issue operations (CRUD)
 * - Comment operations
 * - Label operations
 * - Search functionality
 * - Rate limiting
 * - Error handling
 * - Edge cases
 */

// Mock Octokit before requiring any modules
jest.mock('@octokit/rest');

const GitHubProvider = require('../../../lib/providers/GitHubProvider');

describe('GitHubProvider', () => {
  let provider;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Clear environment variables
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;
  });

  describe('Constructor', () => {
    test('should initialize with provided options', () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      expect(provider.token).toBe('test-token');
      expect(provider.owner).toBe('test-owner');
      expect(provider.repo).toBe('test-repo');
      expect(provider.octokit).toBeNull();
      expect(provider.rateLimitRemaining).toBeNull();
    });

    test('should use environment variables as fallback', () => {
      process.env.GITHUB_TOKEN = 'env-token';
      process.env.GITHUB_OWNER = 'env-owner';
      process.env.GITHUB_REPO = 'env-repo';

      provider = new GitHubProvider();

      expect(provider.token).toBe('env-token');
      expect(provider.owner).toBe('env-owner');
      expect(provider.repo).toBe('env-repo');
    });

    test('should support custom base URL for GitHub Enterprise', () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo',
        baseUrl: 'https://github.enterprise.com/api/v3'
      });

      expect(provider.baseUrl).toBe('https://github.enterprise.com/api/v3');
    });

    test('should set default timeout', () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      expect(provider.timeout).toBe(30000); // 30 seconds default
    });

    test('should allow custom timeout', () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo',
        timeout: 60000
      });

      expect(provider.timeout).toBe(60000);
    });
  });

  describe('authenticate()', () => {
    test('should throw error if token is missing', async () => {
      provider = new GitHubProvider({
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await expect(provider.authenticate()).rejects.toThrow(
        'GitHub token is required'
      );
    });

    test('should create Octokit instance', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      // Mock the getAuthenticated call
      const mockGetAuth = jest.fn().mockResolvedValue({
        data: { login: 'testuser' }
      });

      await provider.authenticate();

      provider.octokit.users.getAuthenticated = mockGetAuth;

      expect(provider.octokit).toBeDefined();
      expect(provider.octokit.auth).toBe('test-token');
    });
  });

  describe('getIssue()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      // Manually set up octokit with proper mocks
      await provider.authenticate();

      // Mock the getAuthenticated response
      provider.octokit.users.getAuthenticated.mockResolvedValue({
        data: { login: 'testuser' }
      });

      // Mock rate limit check
      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      });
    });

    test('should fetch single issue by number', async () => {
      const mockIssue = {
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        state: 'open'
      };

      provider.octokit.rest.issues.get.mockResolvedValue({ data: mockIssue });

      const issue = await provider.getIssue(1);

      expect(provider.octokit.rest.issues.get).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1
      });
      expect(issue).toEqual(mockIssue);
    });

    test('should check rate limit before fetching issue', async () => {
      provider.octokit.rest.issues.get.mockResolvedValue({
        data: { number: 1 }
      });

      await provider.getIssue(1);

      expect(provider.octokit.rest.rateLimit.get).toHaveBeenCalled();
    });
  });

  describe('listIssues()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      });
    });

    test('should list all issues without filters', async () => {
      const mockIssues = [
        { number: 1, title: 'Issue 1' },
        { number: 2, title: 'Issue 2' }
      ];

      provider.octokit.rest.issues.list.mockResolvedValue({ data: mockIssues });

      const issues = await provider.listIssues();

      expect(provider.octokit.rest.issues.list).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        per_page: 100
      });
      expect(issues).toEqual(mockIssues);
    });

    test('should filter issues by state', async () => {
      provider.octokit.rest.issues.list.mockResolvedValue({ data: [] });

      await provider.listIssues({ state: 'closed' });

      expect(provider.octokit.rest.issues.list).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        state: 'closed',
        per_page: 100
      });
    });

    test('should filter issues by labels', async () => {
      provider.octokit.rest.issues.list.mockResolvedValue({ data: [] });

      await provider.listIssues({ labels: ['bug', 'critical'] });

      expect(provider.octokit.rest.issues.list).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        labels: 'bug,critical',
        per_page: 100
      });
    });
  });

  describe('createIssue()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      });
    });

    test('should create new issue with title and body', async () => {
      const mockIssue = {
        number: 10,
        title: 'New Issue',
        body: 'Issue body'
      };

      provider.octokit.rest.issues.create.mockResolvedValue({ data: mockIssue });

      const issue = await provider.createIssue({
        title: 'New Issue',
        body: 'Issue body'
      });

      expect(provider.octokit.rest.issues.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'New Issue',
        body: 'Issue body'
      });
      expect(issue).toEqual(mockIssue);
    });

    test('should throw error if title is missing', async () => {
      await expect(provider.createIssue({ body: 'Body only' }))
        .rejects.toThrow('Issue title is required');
    });
  });

  describe('updateIssue()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      });
    });

    test('should update issue title', async () => {
      const mockIssue = { number: 1, title: 'Updated Title' };

      provider.octokit.rest.issues.update.mockResolvedValue({ data: mockIssue });

      const issue = await provider.updateIssue(1, { title: 'Updated Title' });

      expect(provider.octokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        title: 'Updated Title'
      });
      expect(issue).toEqual(mockIssue);
    });
  });

  describe('closeIssue()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      });
    });

    test('should close issue', async () => {
      const mockIssue = { number: 1, state: 'closed' };

      provider.octokit.rest.issues.update.mockResolvedValue({ data: mockIssue });

      const issue = await provider.closeIssue(1);

      expect(provider.octokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        state: 'closed'
      });
      expect(issue.state).toBe('closed');
    });

    test('should close issue with comment', async () => {
      provider.octokit.rest.issues.update.mockResolvedValue({
        data: { number: 1, state: 'closed' }
      });
      provider.octokit.rest.issues.createComment.mockResolvedValue({
        data: { id: 1 }
      });

      await provider.closeIssue(1, 'Closing: issue resolved');

      expect(provider.octokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        body: 'Closing: issue resolved'
      });
      expect(provider.octokit.rest.issues.update).toHaveBeenCalled();
    });
  });

  describe('createComment()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      });
    });

    test('should create comment on issue', async () => {
      const mockComment = {
        id: 123,
        body: 'Test comment',
        user: { login: 'testuser' }
      };

      provider.octokit.rest.issues.createComment.mockResolvedValue({
        data: mockComment
      });

      const comment = await provider.createComment(1, 'Test comment');

      expect(provider.octokit.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        body: 'Test comment'
      });
      expect(comment).toEqual(mockComment);
    });

    test('should throw error if body is empty', async () => {
      await expect(provider.createComment(1, ''))
        .rejects.toThrow('Comment body is required');
    });
  });

  describe('addLabels()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      });
    });

    test('should add labels to issue', async () => {
      const mockLabels = [
        { name: 'bug' },
        { name: 'priority:high' }
      ];

      provider.octokit.rest.issues.addLabels.mockResolvedValue({
        data: mockLabels
      });

      const labels = await provider.addLabels(1, ['bug', 'priority:high']);

      expect(provider.octokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        labels: ['bug', 'priority:high']
      });
      expect(labels).toEqual(mockLabels);
    });

    test('should handle empty labels array', async () => {
      await expect(provider.addLabels(1, []))
        .rejects.toThrow('At least one label is required');
    });
  });

  describe('searchIssues()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 5000 }
          }
        }
      });
    });

    test('should search issues with query', async () => {
      const mockResults = {
        total_count: 2,
        items: [
          { number: 1, title: 'Bug in login' },
          { number: 5, title: 'Bug in signup' }
        ]
      };

      provider.octokit.rest.search.issuesAndPullRequests.mockResolvedValue({
        data: mockResults
      });

      const results = await provider.searchIssues('bug in:title');

      expect(provider.octokit.rest.search.issuesAndPullRequests).toHaveBeenCalledWith({
        q: 'bug in:title repo:test-owner/test-repo',
        per_page: 100
      });
      expect(results.items).toHaveLength(2);
    });
  });

  describe('checkRateLimit()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();
    });

    test('should fetch current rate limit status', async () => {
      const mockRateLimit = {
        resources: {
          core: {
            limit: 5000,
            remaining: 4999,
            reset: 1640000000
          }
        }
      };

      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: mockRateLimit
      });

      const rateLimit = await provider.checkRateLimit();

      expect(provider.octokit.rest.rateLimit.get).toHaveBeenCalled();
      expect(rateLimit.core.remaining).toBe(4999);
    });

    test('should update internal rate limit counter', async () => {
      provider.octokit.rest.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { remaining: 3000 }
          }
        }
      });

      await provider.checkRateLimit();

      expect(provider.rateLimitRemaining).toBe(3000);
    });
  });

  describe('handleRateLimitError()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();
    });

    test('should implement exponential backoff', async () => {
      const rateLimitError = {
        status: 403,
        message: 'API rate limit exceeded',
        response: {
          headers: {
            'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60)
          }
        }
      };

      const waitTime = await provider.handleRateLimitError(rateLimitError, 1);

      expect(waitTime).toBeGreaterThanOrEqual(2000); // 2^1 * 1000
      expect(waitTime).toBeLessThanOrEqual(60000);
    });

    test('should throw after max retries', async () => {
      const rateLimitError = {
        status: 403,
        message: 'API rate limit exceeded'
      };

      await expect(
        provider.handleRateLimitError(rateLimitError, 5)
      ).rejects.toThrow('Maximum retry attempts exceeded');
    });
  });

  describe('_makeRequest()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();
    });

    test('should make request and return data', async () => {
      const mockData = { result: 'success' };
      const mockRequest = jest.fn().mockResolvedValue({ data: mockData });

      const result = await provider._makeRequest(mockRequest);

      expect(mockRequest).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test('should retry on transient errors', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce({ status: 502, message: 'Bad Gateway' })
        .mockResolvedValueOnce({ data: { result: 'success' } });

      const result = await provider._makeRequest(mockRequest);

      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(result.result).toBe('success');
    });

    test('should throw on non-retryable errors', async () => {
      const mockRequest = jest.fn().mockRejectedValue({
        status: 404,
        message: 'Not Found'
      });

      await expect(provider._makeRequest(mockRequest))
        .rejects.toMatchObject({ status: 404 });

      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test('should handle rate limit errors and retry', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce({
          status: 403,
          message: 'API rate limit exceeded',
          response: {
            headers: {
              'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 1)
            }
          }
        })
        .mockResolvedValueOnce({ data: { result: 'success' } });

      jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

      const result = await provider._makeRequest(mockRequest, { maxRetries: 1 });

      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(result.result).toBe('success');

      global.setTimeout.mockRestore();
    });

    test('should retry on 500 errors', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce({ status: 500, message: 'Internal Server Error' })
        .mockResolvedValueOnce({ data: { result: 'success' } });

      jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

      const result = await provider._makeRequest(mockRequest);

      expect(mockRequest).toHaveBeenCalledTimes(2);

      global.setTimeout.mockRestore();
    });

    test('should retry on 503 errors', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
        .mockResolvedValueOnce({ data: { result: 'success' } });

      jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

      const result = await provider._makeRequest(mockRequest);

      expect(mockRequest).toHaveBeenCalledTimes(2);

      global.setTimeout.mockRestore();
    });

    test('should throw after exhausting retries on 5xx errors', async () => {
      const mockRequest = jest.fn().mockRejectedValue({
        status: 502,
        message: 'Bad Gateway'
      });

      jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

      await expect(provider._makeRequest(mockRequest, { maxRetries: 1 }))
        .rejects.toMatchObject({ status: 502 });

      expect(mockRequest).toHaveBeenCalledTimes(2); // Initial + 1 retry

      global.setTimeout.mockRestore();
    });
  });

  describe('_checkRateLimit()', () => {
    beforeEach(async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();
    });

    test('should check rate limit if not previously checked', async () => {
      provider.rateLimitRemaining = null;

      await provider._checkRateLimit();

      expect(provider.octokit.rest.rateLimit.get).toHaveBeenCalled();
      expect(provider.rateLimitRemaining).toBe(5000);
    });

    test('should warn when rate limit is low', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      provider.rateLimitRemaining = 50;

      await provider._checkRateLimit();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('GitHub API rate limit low: 50')
      );

      consoleWarnSpy.mockRestore();
    });

    test('should throw if not authenticated', async () => {
      provider.octokit = null;

      await expect(provider._checkRateLimit())
        .rejects.toThrow('Not authenticated. Call authenticate() first.');
    });
  });

  describe('Additional Edge Cases', () => {
    test('should handle baseUrl in authentication', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo',
        baseUrl: 'https://github.enterprise.com/api/v3'
      });

      await provider.authenticate();

      expect(provider.octokit).toBeDefined();
      expect(provider.octokit.baseUrl).toBe('https://github.enterprise.com/api/v3');
    });

    test('should handle list issues with all filters', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.issues.list.mockResolvedValue({ data: [] });

      await provider.listIssues({
        state: 'open',
        labels: ['bug', 'critical'],
        assignee: 'john',
        page: 2,
        perPage: 50
      });

      expect(provider.octokit.rest.issues.list).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        state: 'open',
        labels: 'bug,critical',
        assignee: 'john',
        page: 2,
        per_page: 50
      });
    });

    test('should handle createIssue with all options', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.issues.create.mockResolvedValue({
        data: { number: 10 }
      });

      await provider.createIssue({
        title: 'New Issue',
        body: 'Issue body',
        labels: ['bug', 'priority:high'],
        assignees: ['john', 'jane']
      });

      expect(provider.octokit.rest.issues.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'New Issue',
        body: 'Issue body',
        labels: ['bug', 'priority:high'],
        assignees: ['john', 'jane']
      });
    });

    test('should handle searchIssues with all filters', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.search.issuesAndPullRequests.mockResolvedValue({
        data: { total_count: 0, items: [] }
      });

      await provider.searchIssues('bug', {
        labels: ['critical'],
        state: 'open',
        page: 2,
        perPage: 50
      });

      expect(provider.octokit.rest.search.issuesAndPullRequests).toHaveBeenCalledWith({
        q: 'bug label:critical state:open repo:test-owner/test-repo',
        page: 2,
        per_page: 50
      });
    });

    test('should handle listComments with all options', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.issues.listComments.mockResolvedValue({ data: [] });

      await provider.listComments(1, { page: 2, perPage: 50 });

      expect(provider.octokit.rest.issues.listComments).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        page: 2,
        per_page: 50
      });
    });

    test('should handle updateIssue with body only', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.issues.update.mockResolvedValue({
        data: { number: 1 }
      });

      await provider.updateIssue(1, { body: 'Updated body' });

      expect(provider.octokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        body: 'Updated body'
      });
    });

    test('should handle createIssue without optional fields', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      provider.octokit.rest.issues.create.mockResolvedValue({
        data: { number: 10 }
      });

      await provider.createIssue({ title: 'Title Only' });

      expect(provider.octokit.rest.issues.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'Title Only'
      });
    });

    test('should handle handleRateLimitError without reset header', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      const error = {
        status: 403,
        message: 'Rate limit exceeded'
      };

      const waitTime = await provider.handleRateLimitError(error, 0);

      expect(waitTime).toBe(1000); // 2^0 * 1000
    });

    test('should handle handleRateLimitError with retry count 2', async () => {
      provider = new GitHubProvider({
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      await provider.authenticate();

      const error = {
        status: 403,
        message: 'Rate limit exceeded'
      };

      const waitTime = await provider.handleRateLimitError(error, 2);

      expect(waitTime).toBe(4000); // 2^2 * 1000
    });
  });
});
