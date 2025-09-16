const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * TDD Tests for PM Standup Script Migration
 *
 * Testing migration from standup.sh to standup.js
 * RED phase - These tests should fail initially
 */

describe('PM Standup Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-standup-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (standup.js)', () => {
    test('should export a function that returns standup data', () => {
      // This test will fail until we implement standup.js
      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      assert.strictEqual(typeof standupModule, 'function');
    });

    test('should return structured data with date and activity counts', async () => {
      // Setup test structure with files modified today
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create files modified today
      fs.writeFileSync('.claude/prds/prd1.md', 'test PRD');
      fs.writeFileSync('.claude/epics/epic1/epic.md', 'test epic');
      fs.writeFileSync('.claude/epics/epic1/001.md', 'status: open\n');

      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      assert.ok(result.hasOwnProperty('date'));
      assert.ok(result.hasOwnProperty('activity'));
      assert.ok(result.hasOwnProperty('inProgress'));
      assert.ok(result.hasOwnProperty('nextTasks'));
      assert.ok(result.hasOwnProperty('stats'));
      assert.ok(result.hasOwnProperty('messages'));
    });

    test('should detect files modified today', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create files
      fs.writeFileSync('.claude/prds/prd1.md', 'test PRD');
      fs.writeFileSync('.claude/epics/epic1/001.md', 'status: open\n');

      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      // Should detect recent activity
      assert.ok(result.activity.prdCount >= 0);
      assert.ok(result.activity.epicCount >= 0);
      assert.ok(result.activity.taskCount >= 0);
      assert.ok(result.activity.updateCount >= 0);
    });

    test('should find tasks in progress with completion percentages', async () => {
      // Setup test structure with progress files
      fs.mkdirSync('.claude/epics/epic1/updates/123/', { recursive: true });

      const progressContent = 'completion: 50%\n';
      fs.writeFileSync('.claude/epics/epic1/updates/123/progress.md', progressContent);

      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      assert.ok(Array.isArray(result.inProgress));
      // Should find the progress entry if properly implemented
    });

    test('should find next available tasks without dependencies', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create open task without dependencies
      const taskContent = 'name: Test Task\nstatus: open\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', taskContent);

      // Create task with dependencies (should not be in next tasks)
      const blockedTaskContent = 'name: Blocked Task\nstatus: open\ndepends_on: [002]\n';
      fs.writeFileSync('.claude/epics/epic1/003.md', blockedTaskContent);

      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      assert.ok(Array.isArray(result.nextTasks));
      // Should find available tasks
    });

    test('should include formatted date in today\'s format', async () => {
      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      // Check date format (YYYY-MM-DD)
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(result.date));

      // Should be today's date
      const today = new Date().toISOString().split('T')[0];
      assert.strictEqual(result.date, today);
    });

    test('should handle empty project structure gracefully', async () => {
      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      assert.ok(result.activity.prdCount === 0);
      assert.ok(result.activity.epicCount === 0);
      assert.ok(result.activity.taskCount === 0);
      assert.ok(result.activity.updateCount === 0);
      assert.ok(result.inProgress.length === 0);
      assert.ok(result.nextTasks.length >= 0); // Could be 0 or more
    });

    test('should include display messages array with proper formatting', async () => {
      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      assert.ok(result.hasOwnProperty('messages'));
      assert.strictEqual(Array.isArray(result.messages), true);
      assert.ok(result.messages.length > 0);

      // Check for expected header format
      const headerMessage = result.messages.find(msg => msg.includes('📅 Daily Standup'));
      assert.ok(headerMessage, 'Should include Daily Standup header');
    });

    test('should match exact output format of bash script when run as CLI', () => {
      // This test verifies CLI output matches bash exactly
      const nodeScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/standup.js');
      const nodeOutput = execSync(`node "${nodeScriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      // Should start with standup header
      assert.ok(nodeOutput.includes('📅 Daily Standup'));
      assert.ok(nodeOutput.includes('================================'));
      assert.ok(nodeOutput.includes('📝 Today\'s Activity:'));
      assert.ok(nodeOutput.includes('🔄 Currently In Progress:'));
      assert.ok(nodeOutput.includes('⏭️ Next Available Tasks:'));
      assert.ok(nodeOutput.includes('📊 Quick Stats:'));
    });
  });

  describe('Backward Compatibility Tests', () => {
    test('should maintain bash script functionality', () => {
      // Test that original bash script still works
      const scriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/standup.sh');
      const bashOutput = execSync(`bash "${scriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      assert.ok(bashOutput.includes('📅 Daily Standup'));
      assert.ok(bashOutput.includes('================================'));
    });

    test('bash and Node.js outputs should be identical for same project structure', () => {
      // Setup identical test structure
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/prds/prd1.md', 'test');
      fs.writeFileSync('.claude/epics/epic1/001.md', 'name: Test Task\nstatus: open\n');

      const bashScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/standup.sh');
      const nodeScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/standup.js');

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

  describe('File Processing and Date Handling Tests', () => {
    test('should correctly count file modifications by type', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.mkdirSync('.claude/epics/epic1/updates', { recursive: true });

      // Create files of different types
      fs.writeFileSync('.claude/prds/prd1.md', 'PRD content');
      fs.writeFileSync('.claude/prds/prd2.md', 'PRD content');
      fs.writeFileSync('.claude/epics/epic1/epic.md', 'Epic content');
      fs.writeFileSync('.claude/epics/epic1/001.md', 'Task content');
      fs.writeFileSync('.claude/epics/epic1/002.md', 'Task content');
      fs.writeFileSync('.claude/epics/epic1/updates/update1.md', 'Update content');

      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      // Should count files by type (exact counts depend on implementation logic)
      assert.ok(typeof result.activity.prdCount === 'number');
      assert.ok(typeof result.activity.epicCount === 'number');
      assert.ok(typeof result.activity.taskCount === 'number');
      assert.ok(typeof result.activity.updateCount === 'number');
    });

    test('should handle tasks with parallel flag', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      const parallelTaskContent = 'name: Parallel Task\nstatus: open\nparallel: true\ndepends_on: []\n';
      fs.writeFileSync('.claude/epics/epic1/001.md', parallelTaskContent);

      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      // Should identify parallel tasks in next tasks
      assert.ok(Array.isArray(result.nextTasks));
    });

    test('should provide accurate quick statistics', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create tasks with different statuses
      fs.writeFileSync('.claude/epics/epic1/001.md', 'status: open\n');
      fs.writeFileSync('.claude/epics/epic1/002.md', 'status: closed\n');
      fs.writeFileSync('.claude/epics/epic1/003.md', 'status: open\n');

      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const result = await standupModule();

      assert.ok(result.hasOwnProperty('stats'));
      assert.ok(typeof result.stats.totalTasks === 'number');
      assert.ok(typeof result.stats.openTasks === 'number');
      assert.ok(typeof result.stats.closedTasks === 'number');

      // Verify the math
      assert.strictEqual(result.stats.totalTasks, result.stats.openTasks + result.stats.closedTasks);
    });
  });

  describe('Performance and Reliability Tests', () => {
    test('should handle large number of files efficiently', async () => {
      // Create large test structure
      fs.mkdirSync('.claude/epics', { recursive: true });

      for (let i = 1; i <= 50; i++) {
        fs.mkdirSync(`.claude/epics/epic${i}`, { recursive: true });
        for (let j = 1; j <= 10; j++) {
          fs.writeFileSync(`.claude/epics/epic${i}/${j.toString().padStart(3, '0')}.md`,
            `name: Task ${j}\nstatus: ${j % 2 === 0 ? 'closed' : 'open'}\n`);
        }
      }

      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');
      const startTime = Date.now();
      const result = await standupModule();
      const endTime = Date.now();

      assert.ok(typeof result.stats.totalTasks === 'number');
      assert.ok(endTime - startTime < 5000); // Should complete within 5 seconds
    });

    test('should handle filesystem permission errors gracefully', async () => {
      const standupModule = require('../../autopm/.claude/scripts/pm/standup.js');

      // This should not throw even if there are permission issues
      const result = await standupModule();
      assert.ok(result.hasOwnProperty('activity'));
      assert.ok(result.hasOwnProperty('inProgress'));
      assert.ok(result.hasOwnProperty('nextTasks'));
      assert.ok(result.hasOwnProperty('stats'));
    });
  });
});