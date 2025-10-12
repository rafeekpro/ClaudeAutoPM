/**
 * Tests for GitHub Issue Dependency Validator
 * Following TDD methodology - tests written first
 */

const { describe, test, expect, beforeEach, jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

// Mock DependencyTracker
jest.mock('../../autopm/.claude/scripts/github/dependency-tracker.js', () => {
  return jest.fn().mockImplementation(() => ({
    getDependencies: jest.fn(),
    getBlockedIssues: jest.fn(),
    octokit: {
      rest: {
        issues: {
          get: jest.fn()
        }
      }
    }
  }));
});

describe('DependencyValidator', () => {
  let DependencyValidator;
  let validator;
  let mockTracker;

  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve('../../autopm/.claude/scripts/github/dependency-validator.js')];

    const DependencyTracker = require('../../autopm/.claude/scripts/github/dependency-tracker.js');

    DependencyValidator = require('../../autopm/.claude/scripts/github/dependency-validator.js');
    validator = new DependencyValidator({
      owner: 'test-owner',
      repo: 'test-repo',
      token: 'test-token'
    });

    mockTracker = validator.tracker;
  });

  describe('Constructor', () => {
    test('should initialize with DependencyTracker', () => {
      expect(validator.tracker).toBeDefined();
    });

    test('should support local mode', () => {
      const localValidator = new DependencyValidator({ localMode: true });
      expect(localValidator.localMode).toBe(true);
    });
  });

  describe('validateDependencies', () => {
    test('should return valid when all dependencies are closed', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([123, 456]);
      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({ data: { number: 123, state: 'closed' } })
        .mockResolvedValueOnce({ data: { number: 456, state: 'closed' } });

      const result = await validator.validateDependencies(789);

      expect(result.valid).toBe(true);
      expect(result.unresolvedDependencies).toEqual([]);
      expect(result.message).toContain('All dependencies resolved');
    });

    test('should return invalid when dependencies are open', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([123, 456]);
      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({ data: { number: 123, state: 'open', title: 'Open Issue 1' } })
        .mockResolvedValueOnce({ data: { number: 456, state: 'closed' } });

      const result = await validator.validateDependencies(789);

      expect(result.valid).toBe(false);
      expect(result.unresolvedDependencies).toHaveLength(1);
      expect(result.unresolvedDependencies[0]).toMatchObject({
        number: 123,
        state: 'open',
        title: 'Open Issue 1'
      });
    });

    test('should handle issues with no dependencies', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);

      const result = await validator.validateDependencies(789);

      expect(result.valid).toBe(true);
      expect(result.unresolvedDependencies).toEqual([]);
      expect(result.message).toContain('No dependencies');
    });

    test('should validate nested dependencies', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([123]) // 789 depends on 123
        .mockResolvedValueOnce([456]); // 123 depends on 456

      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({ data: { number: 123, state: 'open' } })
        .mockResolvedValueOnce({ data: { number: 456, state: 'open' } });

      const result = await validator.validateDependencies(789, { recursive: true });

      expect(result.valid).toBe(false);
      expect(result.unresolvedDependencies.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle API errors gracefully', async () => {
      mockTracker.getDependencies.mockRejectedValueOnce(
        new Error('API Error')
      );

      const result = await validator.validateDependencies(789);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('detectCircularDependencies', () => {
    test('should detect direct circular dependency', async () => {
      // Issue 123 depends on 456, and 456 depends on 123
      mockTracker.getDependencies
        .mockResolvedValueOnce([456]) // 123 -> 456
        .mockResolvedValueOnce([123]); // 456 -> 123

      const result = await validator.detectCircularDependencies(123);

      expect(result.hasCircular).toBe(true);
      expect(result.cycles).toHaveLength(1);
      expect(result.cycles[0]).toEqual([123, 456, 123]);
    });

    test('should detect indirect circular dependency', async () => {
      // 123 -> 456 -> 789 -> 123
      mockTracker.getDependencies
        .mockResolvedValueOnce([456]) // 123 -> 456
        .mockResolvedValueOnce([789]) // 456 -> 789
        .mockResolvedValueOnce([123]); // 789 -> 123

      const result = await validator.detectCircularDependencies(123);

      expect(result.hasCircular).toBe(true);
      expect(result.cycles[0]).toContain(123);
      expect(result.cycles[0]).toContain(456);
      expect(result.cycles[0]).toContain(789);
    });

    test('should return no cycles when dependencies are valid', async () => {
      // Linear dependency: 123 -> 456 -> 789
      mockTracker.getDependencies
        .mockResolvedValueOnce([456]) // 123 -> 456
        .mockResolvedValueOnce([789]) // 456 -> 789
        .mockResolvedValueOnce([]); // 789 -> nothing

      const result = await validator.detectCircularDependencies(123);

      expect(result.hasCircular).toBe(false);
      expect(result.cycles).toEqual([]);
    });

    test('should handle complex dependency graphs', async () => {
      // Diamond pattern: 100 -> [200, 300] -> 400
      mockTracker.getDependencies
        .mockResolvedValueOnce([200, 300]) // 100 -> 200, 300
        .mockResolvedValueOnce([400]) // 200 -> 400
        .mockResolvedValueOnce([400]) // 300 -> 400
        .mockResolvedValueOnce([]); // 400 -> nothing

      const result = await validator.detectCircularDependencies(100);

      expect(result.hasCircular).toBe(false);
    });

    test('should detect multiple cycles', async () => {
      // Multiple cycles in dependency graph
      mockTracker.getDependencies
        .mockResolvedValueOnce([200, 300]) // 100 -> 200, 300
        .mockResolvedValueOnce([100]) // 200 -> 100 (cycle 1)
        .mockResolvedValueOnce([400]) // 300 -> 400
        .mockResolvedValueOnce([300]); // 400 -> 300 (cycle 2)

      const result = await validator.detectCircularDependencies(100);

      expect(result.hasCircular).toBe(true);
      expect(result.cycles.length).toBeGreaterThanOrEqual(1);
    });

    test('should limit depth to prevent infinite loops', async () => {
      // Ensure maximum depth is enforced
      mockTracker.getDependencies.mockResolvedValue([999]);

      const result = await validator.detectCircularDependencies(123, { maxDepth: 5 });

      expect(result).toBeDefined();
      // Should not hang or crash
    });
  });

  describe('canClose', () => {
    test('should allow closing when no dependencies exist', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.getBlockedIssues.mockResolvedValueOnce([]);

      const result = await validator.canClose(123);

      expect(result.canClose).toBe(true);
      expect(result.reason).toContain('No dependencies');
    });

    test('should allow closing when all dependencies are resolved', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([456]);
      mockTracker.getBlockedIssues.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 456, state: 'closed' }
      });

      const result = await validator.canClose(123);

      expect(result.canClose).toBe(true);
      expect(result.reason).toContain('All dependencies resolved');
    });

    test('should prevent closing when dependencies are unresolved', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([456]);
      mockTracker.getBlockedIssues.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 456, state: 'open', title: 'Blocking Issue' }
      });

      const result = await validator.canClose(123);

      expect(result.canClose).toBe(false);
      expect(result.reason).toContain('has unresolved dependencies');
      expect(result.blockingIssues).toHaveLength(1);
    });

    test('should warn when closing would block other issues', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.getBlockedIssues.mockResolvedValueOnce([789, 999]);
      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({ data: { number: 789, state: 'open', title: 'Issue 789' } })
        .mockResolvedValueOnce({ data: { number: 999, state: 'open', title: 'Issue 999' } });

      const result = await validator.canClose(123);

      expect(result.canClose).toBe(true);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('will block 2 open issues');
      expect(result.affectedIssues).toHaveLength(2);
    });

    test('should handle circular dependencies', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([456]);
      mockTracker.getBlockedIssues.mockResolvedValueOnce([]);

      // Mock circular dependency detection
      validator.detectCircularDependencies = jest.fn().mockResolvedValueOnce({
        hasCircular: true,
        cycles: [[123, 456, 123]]
      });

      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 456, state: 'open' }
      });

      const result = await validator.canClose(123);

      expect(result.warning).toContain('circular');
    });
  });

  describe('getBlockerStatus', () => {
    test('should return status of all blocking issues', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([123, 456, 789]);
      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 123, state: 'closed', title: 'Done Issue' }
        })
        .mockResolvedValueOnce({
          data: { number: 456, state: 'open', title: 'In Progress' }
        })
        .mockResolvedValueOnce({
          data: { number: 789, state: 'open', title: 'Blocked Issue' }
        });

      const result = await validator.getBlockerStatus(999);

      expect(result.total).toBe(3);
      expect(result.resolved).toBe(1);
      expect(result.unresolved).toBe(2);
      expect(result.blockers).toHaveLength(3);
      expect(result.progress).toBeCloseTo(33.33, 1);
    });

    test('should include detailed information for each blocker', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([123]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: 123,
          state: 'open',
          title: 'Blocking Issue',
          assignees: [{ login: 'developer1' }],
          labels: [{ name: 'bug' }]
        }
      });

      const result = await validator.getBlockerStatus(456);

      expect(result.blockers[0]).toMatchObject({
        number: 123,
        state: 'open',
        title: 'Blocking Issue',
        assignees: [{ login: 'developer1' }],
        labels: [{ name: 'bug' }]
      });
    });

    test('should handle no blockers', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);

      const result = await validator.getBlockerStatus(456);

      expect(result.total).toBe(0);
      expect(result.resolved).toBe(0);
      expect(result.unresolved).toBe(0);
      expect(result.blockers).toEqual([]);
      expect(result.progress).toBe(100);
    });

    test('should calculate progress correctly', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([100, 200, 300, 400]);
      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({ data: { number: 100, state: 'closed' } })
        .mockResolvedValueOnce({ data: { number: 200, state: 'closed' } })
        .mockResolvedValueOnce({ data: { number: 300, state: 'closed' } })
        .mockResolvedValueOnce({ data: { number: 400, state: 'open' } });

      const result = await validator.getBlockerStatus(500);

      expect(result.total).toBe(4);
      expect(result.resolved).toBe(3);
      expect(result.unresolved).toBe(1);
      expect(result.progress).toBe(75);
    });
  });

  describe('Local Mode', () => {
    let localValidator;
    let tempDir;

    beforeEach(() => {
      tempDir = path.join(__dirname, '.test-validator-cache');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      localValidator = new DependencyValidator({
        localMode: true,
        cacheDir: tempDir
      });
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('should work in local mode with cached data', async () => {
      // Setup cache
      const depsFile = path.join(tempDir, 'dependencies.json');
      fs.writeFileSync(
        depsFile,
        JSON.stringify({ '456': [123] }),
        'utf8'
      );

      const statesFile = path.join(tempDir, 'issue-states.json');
      fs.writeFileSync(
        statesFile,
        JSON.stringify({ '123': 'closed', '456': 'open' }),
        'utf8'
      );

      const result = await localValidator.validateDependencies(456);

      expect(result.valid).toBe(true);
    });

    test('should update local cache with validation results', async () => {
      const validationFile = path.join(tempDir, 'validations.json');

      await localValidator.validateDependencies(456);

      expect(fs.existsSync(validationFile)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should cache validation results', async () => {
      mockTracker.getDependencies.mockResolvedValue([]);
      mockTracker.getBlockedIssues.mockResolvedValue([]);

      await validator.validateDependencies(123);
      await validator.validateDependencies(123); // Second call

      // Should use cached result
      expect(mockTracker.getDependencies).toHaveBeenCalledTimes(1);
    });

    test('should invalidate cache after timeout', async () => {
      validator.cacheTimeout = 100; // 100ms timeout

      mockTracker.getDependencies.mockResolvedValue([]);
      mockTracker.getBlockedIssues.mockResolvedValue([]);

      await validator.validateDependencies(123);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      await validator.validateDependencies(123);

      // Should make new API call
      expect(mockTracker.getDependencies).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing issues gracefully', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([999]);
      mockTracker.octokit.rest.issues.get.mockRejectedValueOnce({
        status: 404,
        message: 'Not Found'
      });

      const result = await validator.validateDependencies(123);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle network errors', async () => {
      mockTracker.getDependencies.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await validator.validateDependencies(123);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});
