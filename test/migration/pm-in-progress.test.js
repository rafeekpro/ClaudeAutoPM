const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM In-Progress Script Migration
 *
 * Testing migration from in-progress.sh to in-progress.js
 * RED phase - These tests should fail initially
 */

describe('PM In-Progress Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-in-progress-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (in-progress.js)', () => {
    test('should export a function that returns in-progress data', () => {
      // This test will fail until we implement in-progress.js
      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      assert.strictEqual(typeof inProgressModule, 'function');
    });

    test('should return structured data with active work items', () => {
      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.hasOwnProperty('activeIssues'), 'Should have activeIssues array');
      assert.ok(result.hasOwnProperty('activeEpics'), 'Should have activeEpics array');
      assert.ok(result.hasOwnProperty('totalActive'), 'Should have totalActive count');
    });

    test('should find active work items in updates directories', () => {
      // Setup test structure with active work
      fs.mkdirSync('.claude/epics/test-epic/updates/123', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/123.md', 'name: Test task\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/updates/123/progress.md', 'completion: 50%\nlast_sync: 2024-01-01');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.ok(result.activeIssues.length > 0, 'Should find active issues');
      assert.strictEqual(result.activeIssues[0].issueNum, '123', 'Should capture issue number');
      assert.strictEqual(result.activeIssues[0].epicName, 'test-epic', 'Should capture epic name');
      assert.strictEqual(result.activeIssues[0].completion, '50%', 'Should capture completion');
    });

    test('should find active epics with in-progress status', () => {
      fs.mkdirSync('.claude/epics/active-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/active-epic/epic.md',
        'name: Active Epic\nstatus: in-progress\nprogress: 75%');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.ok(result.activeEpics.length > 0, 'Should find active epics');
      assert.strictEqual(result.activeEpics[0].name, 'Active Epic', 'Should capture epic name');
      assert.strictEqual(result.activeEpics[0].progress, '75%', 'Should capture progress');
    });

    test('should handle epics with active status', () => {
      fs.mkdirSync('.claude/epics/active-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/active-epic/epic.md',
        'name: Active Epic\nstatus: active\nprogress: 25%');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.ok(result.activeEpics.length > 0, 'Should find epics with active status');
      assert.strictEqual(result.activeEpics[0].status, 'active', 'Should capture active status');
    });

    test('should extract task names from task files', () => {
      fs.mkdirSync('.claude/epics/test-epic/updates/456', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/456.md', 'name: Authentication Implementation\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/updates/456/progress.md', 'completion: 30%');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.strictEqual(result.activeIssues[0].taskName, 'Authentication Implementation',
        'Should extract task name from task file');
    });

    test('should default to "Unknown task" when task file missing', () => {
      fs.mkdirSync('.claude/epics/test-epic/updates/789', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/updates/789/progress.md', 'completion: 10%');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.strictEqual(result.activeIssues[0].taskName, 'Unknown task',
        'Should default to "Unknown task" when task file missing');
    });

    test('should default completion to 0% when not specified', () => {
      fs.mkdirSync('.claude/epics/test-epic/updates/101', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/101.md', 'name: Test task');
      fs.writeFileSync('.claude/epics/test-epic/updates/101/progress.md', 'last_sync: 2024-01-01');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.strictEqual(result.activeIssues[0].completion, '0%',
        'Should default to 0% completion when not specified');
    });

    test('should handle epics without explicit progress', () => {
      fs.mkdirSync('.claude/epics/no-progress-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/no-progress-epic/epic.md',
        'name: No Progress Epic\nstatus: in-progress');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.strictEqual(result.activeEpics[0].progress, '0%',
        'Should default to 0% for epics without progress');
    });

    test('should count total active items correctly', () => {
      // Setup multiple active items
      fs.mkdirSync('.claude/epics/epic1/updates/1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2/updates/2', { recursive: true });
      fs.mkdirSync('.claude/epics/epic3', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', 'name: Task 1');
      fs.writeFileSync('.claude/epics/epic1/updates/1/progress.md', 'completion: 50%');
      fs.writeFileSync('.claude/epics/epic2/2.md', 'name: Task 2');
      fs.writeFileSync('.claude/epics/epic2/updates/2/progress.md', 'completion: 25%');
      fs.writeFileSync('.claude/epics/epic3/epic.md', 'name: Epic 3\nstatus: active');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.strictEqual(result.totalActive, 2, 'Should count active issues correctly');
      assert.strictEqual(result.activeEpics.length, 1, 'Should count active epics correctly');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing .claude/epics directory', () => {
      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.strictEqual(result.totalActive, 0, 'Should handle missing epics directory');
      assert.strictEqual(result.activeIssues.length, 0, 'Should return empty active issues');
      assert.strictEqual(result.activeEpics.length, 0, 'Should return empty active epics');
    });

    test('should handle epics without epic.md files', () => {
      fs.mkdirSync('.claude/epics/broken-epic', { recursive: true });
      // No epic.md file

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.strictEqual(result.activeEpics.length, 0, 'Should skip epics without epic.md');
    });

    test('should handle malformed progress files', () => {
      fs.mkdirSync('.claude/epics/test-epic/updates/999', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/999.md', 'name: Test task');
      fs.writeFileSync('.claude/epics/test-epic/updates/999/progress.md', 'invalid content');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      // Should still find the active issue but with defaults
      assert.ok(result.activeIssues.length > 0, 'Should handle malformed progress files');
      assert.strictEqual(result.activeIssues[0].completion, '0%', 'Should default completion');
    });

    test('should skip epics with completed or closed status', () => {
      fs.mkdirSync('.claude/epics/completed-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/completed-epic/epic.md',
        'name: Completed Epic\nstatus: completed\nprogress: 100%');

      const inProgressModule = require('../../autopm/.claude/scripts/pm/in-progress.js');
      const result = inProgressModule();

      assert.strictEqual(result.activeEpics.length, 0, 'Should skip completed epics');
    });
  });
});