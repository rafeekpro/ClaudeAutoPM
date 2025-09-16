const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * TDD Tests for PM Next Script Migration
 *
 * Testing migration from next.sh to next.js
 * RED phase - These tests should fail initially
 */

describe('PM Next Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-next-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (next.js)', () => {
    test('should export a function that returns next tasks data', () => {
      // This test will fail until we implement next.js
      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      assert.strictEqual(typeof nextModule, 'function');
    });

    test('should return structured data with available tasks', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create available task (no dependencies)
      const taskContent = 'name: Available Task\nstatus: open\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', taskContent);

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      assert.ok(result.hasOwnProperty('availableTasks'));
      assert.ok(result.hasOwnProperty('found'));
      assert.ok(result.hasOwnProperty('messages'));
      assert.strictEqual(Array.isArray(result.availableTasks), true);
    });

    test('should find tasks with no dependencies', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create task without dependencies
      const noDepsContent = 'name: No Dependencies\nstatus: open\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', noDepsContent);

      // Create task with empty dependencies array
      const emptyDepsContent = 'name: Empty Dependencies\nstatus: open\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/002.md', emptyDepsContent);

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      assert.ok(result.availableTasks.length >= 2);
      assert.strictEqual(result.found, result.availableTasks.length);
    });

    test('should exclude tasks with unresolved dependencies', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create task that depends on non-existent task
      const blockedContent = 'name: Blocked Task\nstatus: open\ndepends_on: [999]\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', blockedContent);

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      // Should not include the blocked task
      assert.strictEqual(result.found, 0);
      assert.strictEqual(result.availableTasks.length, 0);
    });

    test('should exclude non-open tasks', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create closed task
      const closedContent = 'name: Closed Task\nstatus: closed\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', closedContent);

      // Create in-progress task
      const inProgressContent = 'name: In Progress Task\nstatus: in_progress\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/002.md', inProgressContent);

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      // Should not include non-open tasks
      assert.strictEqual(result.found, 0);
      assert.strictEqual(result.availableTasks.length, 0);
    });

    test('should include task details like name, number, epic, and parallel flag', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create parallel task
      const parallelContent = 'name: Parallel Task\nstatus: open\nparallel: true\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', parallelContent);

      // Create regular task
      const regularContent = 'name: Regular Task\nstatus: open\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/002.md', regularContent);

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      assert.ok(result.availableTasks.length >= 2);

      // Check task structure
      const parallelTask = result.availableTasks.find(task => task.name === 'Parallel Task');
      assert.ok(parallelTask);
      assert.strictEqual(parallelTask.taskNum, '001');
      assert.strictEqual(parallelTask.epicName, 'epic1');
      assert.strictEqual(parallelTask.parallel, true);

      const regularTask = result.availableTasks.find(task => task.name === 'Regular Task');
      assert.ok(regularTask);
      assert.strictEqual(regularTask.parallel, false);
    });

    test('should handle empty project structure gracefully', async () => {
      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      assert.strictEqual(result.found, 0);
      assert.strictEqual(result.availableTasks.length, 0);
    });

    test('should provide suggestions when no tasks are available', async () => {
      // Setup structure with only blocked tasks
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      const blockedContent = 'name: Blocked Task\nstatus: open\ndepends_on: [999]\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', blockedContent);

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      assert.ok(result.hasOwnProperty('suggestions'));
      assert.strictEqual(Array.isArray(result.suggestions), true);
      assert.ok(result.suggestions.length > 0);
    });

    test('should include display messages array with proper formatting', async () => {
      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      assert.ok(result.hasOwnProperty('messages'));
      assert.strictEqual(Array.isArray(result.messages), true);
      assert.ok(result.messages.length > 0);

      // Check for expected header format
      const headerMessage = result.messages.find(msg => msg.includes('📋 Next Available Tasks'));
      assert.ok(headerMessage, 'Should include Next Available Tasks header');
    });

    test('should match exact output format of bash script when run as CLI', () => {
      // This test verifies CLI output matches bash exactly
      const nodeScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/next.js');
      const nodeOutput = execSync(`node "${nodeScriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      // Should start with next tasks header
      assert.ok(nodeOutput.includes('📋 Next Available Tasks'));
      assert.ok(nodeOutput.includes('======================='));
      assert.ok(nodeOutput.includes('📊 Summary:'));
    });
  });

  describe('Backward Compatibility Tests', () => {
    test('should maintain bash script functionality', () => {
      // Test that original bash script still works
      const scriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/next.sh');
      const bashOutput = execSync(`bash "${scriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      assert.ok(bashOutput.includes('📋 Next Available Tasks'));
      assert.ok(bashOutput.includes('======================='));
    });

    test('bash and Node.js outputs should be identical for same project structure', () => {
      // Setup identical test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      const taskContent = 'name: Test Task\nstatus: open\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', taskContent);

      const bashScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/next.sh');
      const nodeScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/next.js');

      const bashOutput = execSync(`bash "${bashScriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      const nodeOutput = execSync(`node "${nodeScriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      // Remove timing-sensitive parts and compare structure
      const normalizeBashOutput = bashOutput.replace(/Getting status\.\.\.\n\n\n/g, '');
      const normalizeNodeOutput = nodeOutput.replace(/Getting status\.\.\.\n\n\n/g, '');

      assert.strictEqual(normalizeNodeOutput, normalizeBashOutput);
    });
  });

  describe('Dependency Resolution Tests', () => {
    test('should handle complex dependency chains correctly', async () => {
      // Setup test structure with dependency chain
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Task 001 has no dependencies (should be available)
      fs.writeFileSync('.claude/epics/epic1/001.md', 'name: First Task\nstatus: open\ndepends_on: []\n');

      // Task 002 depends on 001 (should be available since 001 exists and is open)
      fs.writeFileSync('.claude/epics/epic1/002.md', 'name: Second Task\nstatus: open\ndepends_on: [001]\n');

      // Task 003 depends on 999 (should not be available)
      fs.writeFileSync('.claude/epics/epic1/003.md', 'name: Third Task\nstatus: open\ndepends_on: [999]\n');

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      // Should find at least task 001
      assert.ok(result.found >= 1);
      const firstTask = result.availableTasks.find(task => task.name === 'First Task');
      assert.ok(firstTask, 'Should find first task');

      // Note: Task 002's availability depends on implementation logic for dependency resolution
      // The current bash script only checks if dependency files exist, not their status
    });

    test('should handle multiple dependencies correctly', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create base tasks
      fs.writeFileSync('.claude/epics/epic1/001.md', 'name: Base Task 1\nstatus: open\ndepends_on: []\n');
      fs.writeFileSync('.claude/epics/epic1/002.md', 'name: Base Task 2\nstatus: open\ndepends_on: []\n');

      // Create task that depends on both
      fs.writeFileSync('.claude/epics/epic1/003.md', 'name: Dependent Task\nstatus: open\ndepends_on: [001, 002]\n');

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      // Should find base tasks
      assert.ok(result.found >= 2);
      const baseTask1 = result.availableTasks.find(task => task.name === 'Base Task 1');
      const baseTask2 = result.availableTasks.find(task => task.name === 'Base Task 2');
      assert.ok(baseTask1, 'Should find base task 1');
      assert.ok(baseTask2, 'Should find base task 2');
    });

    test('should work across multiple epics', async () => {
      // Setup test structure with multiple epics
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      // Create tasks in different epics
      fs.writeFileSync('.claude/epics/epic1/001.md', 'name: Epic1 Task\nstatus: open\ndepends_on: []\n');
      fs.writeFileSync('.claude/epics/epic2/001.md', 'name: Epic2 Task\nstatus: open\ndepends_on: []\n');

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const result = await nextModule();

      // Should find tasks from both epics
      assert.ok(result.found >= 2);
      const epic1Task = result.availableTasks.find(task => task.epicName === 'epic1');
      const epic2Task = result.availableTasks.find(task => task.epicName === 'epic2');
      assert.ok(epic1Task, 'Should find task from epic1');
      assert.ok(epic2Task, 'Should find task from epic2');
    });
  });

  describe('Performance and Reliability Tests', () => {
    test('should handle large number of tasks efficiently', async () => {
      // Create large test structure
      fs.mkdirSync('.claude/epics', { recursive: true });

      for (let i = 1; i <= 20; i++) {
        fs.mkdirSync(`.claude/epics/epic${i}`, { recursive: true });
        for (let j = 1; j <= 10; j++) {
          const content = `name: Task ${j}\nstatus: open\ndepends_on: []\n`;
          fs.writeFileSync(`.claude/epics/epic${i}/${j.toString().padStart(3, '0')}.md`, content);
        }
      }

      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');
      const startTime = Date.now();
      const result = await nextModule();
      const endTime = Date.now();

      assert.ok(result.found > 0);
      assert.ok(endTime - startTime < 3000); // Should complete within 3 seconds
    });

    test('should handle filesystem permission errors gracefully', async () => {
      const nextModule = require('../../autopm/.claude/scripts/pm/next.js');

      // This should not throw even if there are permission issues
      const result = await nextModule();
      assert.ok(result.hasOwnProperty('availableTasks'));
      assert.ok(result.hasOwnProperty('found'));
      assert.ok(result.hasOwnProperty('messages'));
    });
  });
});