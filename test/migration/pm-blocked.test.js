const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM Blocked Script Migration
 *
 * Testing migration from blocked.sh to blocked.js
 * RED phase - These tests should fail initially
 */

describe('PM Blocked Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-blocked-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (blocked.js)', () => {
    test('should export a function that returns blocked tasks data', () => {
      // This test will fail until we implement blocked.js
      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      assert.strictEqual(typeof getBlockedTasks, 'function');
    });

    test('should return structured data with blocked tasks', () => {
      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.hasOwnProperty('blockedTasks'), 'Should have blockedTasks array');
      assert.ok(result.hasOwnProperty('totalBlocked'), 'Should have totalBlocked count');
    });

    test('should find tasks blocked by dependencies', () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md',
        'name: First task\nstatus: completed');
      fs.writeFileSync('.claude/epics/test-epic/2.md',
        'name: Dependent task\nstatus: open\ndepends_on: [1]');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      // Task 2 should not be blocked since task 1 is completed
      assert.strictEqual(result.blockedTasks.length, 0, 'Should not find blocked tasks when dependencies are met');
    });

    test('should identify blocked tasks with open dependencies', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md',
        'name: First task\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/2.md',
        'name: Dependent task\nstatus: open\ndepends_on: [1]');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.ok(result.blockedTasks.length > 0, 'Should find blocked tasks');
      assert.strictEqual(result.blockedTasks[0].taskNum, '2', 'Should identify correct task number');
      assert.strictEqual(result.blockedTasks[0].taskName, 'Dependent task', 'Should capture task name');
      assert.strictEqual(result.blockedTasks[0].epicName, 'test-epic', 'Should capture epic name');
    });

    test('should parse dependencies from depends_on field', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'name: Task 2\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/3.md',
        'name: Multi-dependent task\nstatus: open\ndepends_on: [1, 2]');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.ok(result.blockedTasks.length > 0, 'Should find blocked task');
      assert.ok(Array.isArray(result.blockedTasks[0].dependencies), 'Should parse dependencies as array');
      assert.ok(result.blockedTasks[0].dependencies.includes('1'), 'Should include dependency 1');
      assert.ok(result.blockedTasks[0].dependencies.includes('2'), 'Should include dependency 2');
    });

    test('should identify which dependencies are still open', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Task 1\nstatus: completed');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'name: Task 2\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/3.md',
        'name: Multi-dependent task\nstatus: open\ndepends_on: [1, 2]');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.ok(result.blockedTasks.length > 0, 'Should find blocked task');
      assert.ok(Array.isArray(result.blockedTasks[0].openDependencies), 'Should identify open dependencies');
      assert.ok(result.blockedTasks[0].openDependencies.includes('2'), 'Should include open dependency 2');
      assert.ok(!result.blockedTasks[0].openDependencies.includes('1'), 'Should not include completed dependency 1');
    });

    test('should skip tasks without dependencies', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md',
        'name: Independent task\nstatus: open');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.strictEqual(result.blockedTasks.length, 0, 'Should skip tasks without dependencies');
    });

    test('should skip completed or closed tasks', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/2.md',
        'name: Completed dependent task\nstatus: completed\ndepends_on: [1]');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.strictEqual(result.blockedTasks.length, 0, 'Should skip completed tasks even with dependencies');
    });

    test('should handle malformed dependency syntax', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md',
        'name: Malformed deps\nstatus: open\ndepends_on: invalid_format');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      // Should handle gracefully and not crash
      assert.strictEqual(result.blockedTasks.length, 0, 'Should handle malformed dependencies gracefully');
    });

    test('should count total blocked tasks correctly', () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/epic1/2.md', 'name: Task 2\nstatus: open\ndepends_on: [1]');
      fs.writeFileSync('.claude/epics/epic2/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/epic2/2.md', 'name: Task 2\nstatus: open\ndepends_on: [1]');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.strictEqual(result.totalBlocked, 2, 'Should count blocked tasks from multiple epics');
    });

    test('should handle dependencies referencing non-existent tasks', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/2.md',
        'name: Orphaned dependency\nstatus: open\ndepends_on: [999]');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      // Should still identify as blocked even if dependency file doesn't exist
      assert.ok(result.blockedTasks.length > 0, 'Should handle non-existent dependency references');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing .claude/epics directory', () => {
      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.strictEqual(result.totalBlocked, 0, 'Should handle missing epics directory');
      assert.strictEqual(result.blockedTasks.length, 0, 'Should return empty blocked tasks');
    });

    test('should handle empty epics directories', () => {
      fs.mkdirSync('.claude/epics/empty-epic', { recursive: true });

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.strictEqual(result.totalBlocked, 0, 'Should handle empty epic directories');
    });

    test('should handle malformed task files', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'invalid yaml content');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      // Should not crash on malformed files
      assert.strictEqual(result.totalBlocked, 0, 'Should handle malformed task files');
    });

    test('should handle various dependency formats', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      // Test different dependency formats
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/2.md',
        'name: Format 1\nstatus: open\ndepends_on: [1]');
      fs.writeFileSync('.claude/epics/test-epic/3.md',
        'name: Format 2\nstatus: open\ndepends_on: [ 1, 2 ]');

      const getBlockedTasks = require('../../autopm/.claude/scripts/pm/blocked.js');
      const result = getBlockedTasks();

      assert.ok(result.blockedTasks.length >= 2, 'Should handle various dependency formats');
    });
  });
});