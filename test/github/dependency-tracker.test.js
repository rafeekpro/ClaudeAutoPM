/**
 * Tests for GitHub Issue Dependency Tracker
 * Following TDD methodology - tests written first
 */

const { describe, test, expect, beforeEach, jest } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Mock @octokit/rest
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        issues: {
          create: jest.fn().mockResolvedValue({
            data: {
              number: 456,
              title: 'Test Issue',
              labels: [{ name: 'depends-on:#123' }]
            }
          }),
          update: jest.fn().mockResolvedValue({
            data: {
              number: 456,
              labels: [{ name: 'depends-on:#123' }, { name: 'depends-on:#789' }]
            }
          }),
          get: jest.fn().mockResolvedValue({
            data: {
              number: 123,
              title: 'Dependency Issue',
              state: 'open',
              labels: [{ name: 'enhancement' }]
            }
          }),
          listForRepo: jest.fn().mockResolvedValue({
            data: [
              {
                number: 123,
                title: 'Issue 1',
                state: 'open',
                labels: [{ name: 'depends-on:#456' }]
              },
              {
                number: 456,
                title: 'Issue 2',
                state: 'closed',
                labels: []
              }
            ]
          })
        }
      },
      paginate: jest.fn().mockImplementation((fn, params) => {
        return Promise.resolve([
          {
            number: 123,
            title: 'Issue 1',
            state: 'open',
            labels: [{ name: 'depends-on:#456' }]
          }
        ]);
      }),
      request: jest.fn().mockResolvedValue({
        data: { success: true }
      })
    }))
  };
});

describe('DependencyTracker', () => {
  let DependencyTracker;
  let tracker;
  let mockOctokit;

  beforeEach(() => {
    // Clear module cache to get fresh instance
    jest.clearAllMocks();
    delete require.cache[require.resolve('../../autopm/.claude/scripts/github/dependency-tracker.js')];

    // Mock environment variables
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPO = 'test-repo';

    DependencyTracker = require('../../autopm/.claude/scripts/github/dependency-tracker.js');
    tracker = new DependencyTracker({
      owner: 'test-owner',
      repo: 'test-repo',
      token: 'test-token'
    });

    mockOctokit = tracker.octokit;
  });

  describe('Constructor', () => {
    test('should initialize with config parameters', () => {
      expect(tracker.owner).toBe('test-owner');
      expect(tracker.repo).toBe('test-repo');
      expect(tracker.octokit).toBeDefined();
    });

    test('should load config from environment variables if not provided', () => {
      const defaultTracker = new DependencyTracker();
      expect(defaultTracker.owner).toBe('test-owner');
      expect(defaultTracker.repo).toBe('test-repo');
    });

    test('should support local mode without GitHub token', () => {
      delete process.env.GITHUB_TOKEN;
      const localTracker = new DependencyTracker({ localMode: true });
      expect(localTracker.localMode).toBe(true);
      expect(localTracker.octokit).toBeUndefined();
    });

    test('should throw error if required config is missing', () => {
      delete process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_OWNER;
      delete process.env.GITHUB_REPO;

      expect(() => {
        new DependencyTracker();
      }).toThrow('GitHub configuration missing');
    });
  });

  describe('addDependency', () => {
    test('should add dependency using label format', async () => {
      const result = await tracker.addDependency(456, 123);

      expect(result.success).toBe(true);
      expect(result.method).toBe('label');
      expect(mockOctokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 456,
        labels: expect.arrayContaining(['depends-on:#123'])
      });
    });

    test('should add multiple dependencies', async () => {
      const result = await tracker.addDependency(456, [123, 789]);

      expect(result.success).toBe(true);
      expect(mockOctokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 456,
        labels: expect.arrayContaining(['depends-on:#123', 'depends-on:#789'])
      });
    });

    test('should use GitHub dependency API if available', async () => {
      const result = await tracker.addDependency(456, 123, { useNativeAPI: true });

      expect(mockOctokit.request).toHaveBeenCalledWith(
        'POST /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by',
        expect.objectContaining({
          owner: 'test-owner',
          repo: 'test-repo',
          issue_number: 456
        })
      );
    });

    test('should validate dependency exists before adding', async () => {
      mockOctokit.rest.issues.get.mockRejectedValueOnce({
        status: 404,
        message: 'Not Found'
      });

      const result = await tracker.addDependency(456, 999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Dependency issue #999 not found');
    });

    test('should prevent self-dependency', async () => {
      const result = await tracker.addDependency(123, 123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot depend on itself');
    });

    test('should work in local mode by updating local cache', async () => {
      const localTracker = new DependencyTracker({ localMode: true });
      const result = await localTracker.addDependency(456, 123);

      expect(result.success).toBe(true);
      expect(result.method).toBe('local');
    });

    test('should handle API errors gracefully', async () => {
      mockOctokit.rest.issues.update.mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      );

      const result = await tracker.addDependency(456, 123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });
  });

  describe('removeDependency', () => {
    test('should remove dependency label', async () => {
      mockOctokit.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: 456,
          labels: [{ name: 'depends-on:#123' }, { name: 'bug' }]
        }
      });

      const result = await tracker.removeDependency(456, 123);

      expect(result.success).toBe(true);
      expect(mockOctokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 456,
        labels: ['bug']
      });
    });

    test('should handle removing non-existent dependency', async () => {
      mockOctokit.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: 456,
          labels: [{ name: 'bug' }]
        }
      });

      const result = await tracker.removeDependency(456, 123);

      expect(result.success).toBe(true);
      expect(result.message).toContain('not found');
    });

    test('should remove multiple dependencies', async () => {
      mockOctokit.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: 456,
          labels: [
            { name: 'depends-on:#123' },
            { name: 'depends-on:#789' },
            { name: 'bug' }
          ]
        }
      });

      const result = await tracker.removeDependency(456, [123, 789]);

      expect(result.success).toBe(true);
      expect(mockOctokit.rest.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 456,
        labels: ['bug']
      });
    });
  });

  describe('getDependencies', () => {
    test('should get all dependencies for an issue', async () => {
      mockOctokit.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: 456,
          labels: [
            { name: 'depends-on:#123' },
            { name: 'depends-on:#789' },
            { name: 'bug' }
          ]
        }
      });

      const dependencies = await tracker.getDependencies(456);

      expect(dependencies).toEqual([123, 789]);
    });

    test('should return empty array if no dependencies', async () => {
      mockOctokit.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: 456,
          labels: [{ name: 'bug' }]
        }
      });

      const dependencies = await tracker.getDependencies(456);

      expect(dependencies).toEqual([]);
    });

    test('should fetch detailed dependency information if requested', async () => {
      mockOctokit.rest.issues.get
        .mockResolvedValueOnce({
          data: {
            number: 456,
            labels: [{ name: 'depends-on:#123' }]
          }
        })
        .mockResolvedValueOnce({
          data: {
            number: 123,
            title: 'Dependency Issue',
            state: 'open'
          }
        });

      const dependencies = await tracker.getDependencies(456, { detailed: true });

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toMatchObject({
        number: 123,
        title: 'Dependency Issue',
        state: 'open'
      });
    });

    test('should parse native GitHub dependency API response', async () => {
      mockOctokit.request.mockResolvedValueOnce({
        data: {
          dependencies: [
            { number: 123, type: 'blocks' },
            { number: 789, type: 'blocks' }
          ]
        }
      });

      const dependencies = await tracker.getDependencies(456, { useNativeAPI: true });

      expect(dependencies).toEqual([123, 789]);
    });
  });

  describe('getBlockedIssues', () => {
    test('should find issues blocked by given issue', async () => {
      mockOctokit.paginate.mockResolvedValueOnce([
        {
          number: 100,
          labels: [{ name: 'depends-on:#123' }]
        },
        {
          number: 200,
          labels: [{ name: 'depends-on:#123' }]
        },
        {
          number: 300,
          labels: [{ name: 'depends-on:#456' }]
        }
      ]);

      const blocked = await tracker.getBlockedIssues(123);

      expect(blocked).toEqual([100, 200]);
    });

    test('should return empty array if no issues are blocked', async () => {
      mockOctokit.paginate.mockResolvedValueOnce([
        {
          number: 100,
          labels: [{ name: 'bug' }]
        }
      ]);

      const blocked = await tracker.getBlockedIssues(123);

      expect(blocked).toEqual([]);
    });

    test('should return detailed information if requested', async () => {
      mockOctokit.paginate.mockResolvedValueOnce([
        {
          number: 100,
          title: 'Blocked Issue 1',
          state: 'open',
          labels: [{ name: 'depends-on:#123' }]
        },
        {
          number: 200,
          title: 'Blocked Issue 2',
          state: 'open',
          labels: [{ name: 'depends-on:#123' }]
        }
      ]);

      const blocked = await tracker.getBlockedIssues(123, { detailed: true });

      expect(blocked).toHaveLength(2);
      expect(blocked[0]).toMatchObject({
        number: 100,
        title: 'Blocked Issue 1',
        state: 'open'
      });
    });
  });

  describe('Local Mode', () => {
    let localTracker;
    let tempDir;

    beforeEach(() => {
      tempDir = path.join(__dirname, '.test-cache');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      localTracker = new DependencyTracker({
        localMode: true,
        cacheDir: tempDir
      });
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('should store dependencies in local cache', async () => {
      await localTracker.addDependency(456, 123);

      const cacheFile = path.join(tempDir, 'dependencies.json');
      expect(fs.existsSync(cacheFile)).toBe(true);

      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      expect(cache['456']).toContain(123);
    });

    test('should read dependencies from local cache', async () => {
      const cacheFile = path.join(tempDir, 'dependencies.json');
      fs.writeFileSync(
        cacheFile,
        JSON.stringify({ '456': [123, 789] }),
        'utf8'
      );

      const dependencies = await localTracker.getDependencies(456);
      expect(dependencies).toEqual([123, 789]);
    });

    test('should update local cache when removing dependencies', async () => {
      await localTracker.addDependency(456, [123, 789]);
      await localTracker.removeDependency(456, 123);

      const dependencies = await localTracker.getDependencies(456);
      expect(dependencies).toEqual([789]);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      mockOctokit.rest.issues.get.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await tracker.addDependency(456, 123);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle invalid issue numbers', async () => {
      const result = await tracker.addDependency('invalid', 123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid issue number');
    });

    test('should handle malformed label data', async () => {
      mockOctokit.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: 456,
          labels: null
        }
      });

      const dependencies = await tracker.getDependencies(456);
      expect(dependencies).toEqual([]);
    });
  });

  describe('Integration with Config', () => {
    test('should load GitHub config from .claude/.env', async () => {
      const configPath = path.join(process.cwd(), '.claude', '.env');
      const envExists = fs.existsSync(configPath);

      if (envExists) {
        const tracker = new DependencyTracker();
        expect(tracker.owner).toBeDefined();
        expect(tracker.repo).toBeDefined();
      } else {
        expect(() => new DependencyTracker()).toThrow();
      }
    });
  });
});
