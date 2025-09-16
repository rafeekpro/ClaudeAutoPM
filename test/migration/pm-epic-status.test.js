const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM Epic Status Script Migration
 *
 * Testing migration from epic-status.sh to epic-status.js
 * RED phase - These tests should fail initially
 */

describe('PM Epic Status Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-epic-status-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (epic-status.js)', () => {
    test('should export a function', () => {
      // This test will fail until we implement epic-status.js
      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      assert.strictEqual(typeof epicStatusModule, 'function');
    });

    test('should throw error for missing epic name parameter', () => {
      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');

      assert.throws(() => {
        epicStatusModule();
      }, /Please specify an epic name/);

      assert.throws(() => {
        epicStatusModule('');
      }, /Please specify an epic name/);
    });

    test('should return epic status data for valid epic', () => {
      // Setup test epic
      fs.mkdirSync('.claude/epics/status-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/status-epic/epic.md', `---
name: Status Epic
status: in-progress
progress: 60%
github: https://github.com/test/repo/issues/123
---
`);

      // Create tasks with various statuses
      fs.writeFileSync('.claude/epics/status-epic/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/status-epic/2.md', 'name: Task 2\nstatus: closed');
      fs.writeFileSync('.claude/epics/status-epic/3.md', 'name: Task 3\nstatus: completed');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('status-epic');

      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.hasOwnProperty('epic'), 'Should have epic section');
      assert.ok(result.hasOwnProperty('taskBreakdown'), 'Should have taskBreakdown section');
      assert.ok(result.hasOwnProperty('progressBar'), 'Should have progressBar section');
    });

    test('should parse epic metadata correctly', () => {
      fs.mkdirSync('.claude/epics/meta-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/meta-epic/epic.md', `---
name: Meta Epic
status: planning
progress: 25%
github: https://github.com/user/repo/issues/456
---
`);

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('meta-epic');

      assert.strictEqual(result.epic.name, 'Meta Epic');
      assert.strictEqual(result.epic.status, 'planning');
      assert.strictEqual(result.epic.progress, '25%');
      assert.strictEqual(result.epic.github, 'https://github.com/user/repo/issues/456');
    });

    test('should calculate task breakdown correctly', () => {
      fs.mkdirSync('.claude/epics/breakdown-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/breakdown-epic/epic.md', 'name: Breakdown Epic\nstatus: in-progress');

      // Create tasks with various statuses
      fs.writeFileSync('.claude/epics/breakdown-epic/1.md', 'name: Open Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/breakdown-epic/2.md', 'name: Open Task 2\nstatus: open');
      fs.writeFileSync('.claude/epics/breakdown-epic/3.md', 'name: Closed Task 1\nstatus: closed');
      fs.writeFileSync('.claude/epics/breakdown-epic/4.md', 'name: Completed Task 1\nstatus: completed');
      fs.writeFileSync('.claude/epics/breakdown-epic/5.md', 'name: Open Task 3\nstatus: open');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('breakdown-epic');

      assert.strictEqual(result.taskBreakdown.totalTasks, 5);
      assert.strictEqual(result.taskBreakdown.openTasks, 3);
      assert.strictEqual(result.taskBreakdown.closedTasks, 2); // closed + completed
      assert.strictEqual(result.taskBreakdown.blockedTasks, 0);
    });

    test('should identify blocked tasks based on dependencies', () => {
      fs.mkdirSync('.claude/epics/blocked-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/blocked-epic/epic.md', 'name: Blocked Epic\nstatus: in-progress');

      // Create tasks with dependencies
      fs.writeFileSync('.claude/epics/blocked-epic/1.md', 'name: Independent Task\nstatus: open');
      fs.writeFileSync('.claude/epics/blocked-epic/2.md', 'name: Blocked Task\nstatus: open\ndepends_on: [1, 3]');
      fs.writeFileSync('.claude/epics/blocked-epic/3.md', 'name: Another Blocked Task\nstatus: open\ndepends_on: [1]');
      fs.writeFileSync('.claude/epics/blocked-epic/4.md', 'name: Completed Task\nstatus: completed');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('blocked-epic');

      assert.strictEqual(result.taskBreakdown.totalTasks, 4);
      assert.strictEqual(result.taskBreakdown.openTasks, 1); // Only task 1 is truly open
      assert.strictEqual(result.taskBreakdown.closedTasks, 1); // Task 4
      assert.strictEqual(result.taskBreakdown.blockedTasks, 2); // Tasks 2 and 3
    });

    test('should generate progress bar correctly', () => {
      fs.mkdirSync('.claude/epics/progress-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/progress-epic/epic.md', 'name: Progress Epic');

      // Create 10 tasks: 6 closed, 4 open (60% completion)
      for (let i = 1; i <= 6; i++) {
        fs.writeFileSync(`.claude/epics/progress-epic/${i}.md`, `name: Closed Task ${i}\nstatus: closed`);
      }
      for (let i = 7; i <= 10; i++) {
        fs.writeFileSync(`.claude/epics/progress-epic/${i}.md`, `name: Open Task ${i}\nstatus: open`);
      }

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('progress-epic');

      assert.strictEqual(result.progressBar.percent, 60);
      assert.strictEqual(result.progressBar.filled, 12); // 60% of 20 chars
      assert.strictEqual(result.progressBar.empty, 8);   // remaining chars
      assert.ok(result.progressBar.bar.includes('█'), 'Should contain filled characters');
      assert.ok(result.progressBar.bar.includes('░'), 'Should contain empty characters');
    });

    test('should handle epic with no tasks', () => {
      fs.mkdirSync('.claude/epics/empty-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/empty-epic/epic.md', 'name: Empty Epic\nstatus: planning');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('empty-epic');

      assert.strictEqual(result.taskBreakdown.totalTasks, 0);
      assert.strictEqual(result.taskBreakdown.openTasks, 0);
      assert.strictEqual(result.taskBreakdown.closedTasks, 0);
      assert.strictEqual(result.taskBreakdown.blockedTasks, 0);
      assert.strictEqual(result.progressBar.percent, 0);
      assert.ok(result.progressBar.message.includes('No tasks created'), 'Should indicate no tasks');
    });

    test('should handle epic not found error', () => {
      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');

      assert.throws(() => {
        epicStatusModule('nonexistent-epic');
      }, /Epic not found: nonexistent-epic/);
    });

    test('should list available epics when epic not found', () => {
      // Create some epics
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });
      fs.mkdirSync('.claude/epics/epic3', { recursive: true });

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');

      try {
        epicStatusModule('nonexistent');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('epic1'), 'Error should list available epics');
        assert.ok(error.message.includes('epic2'), 'Error should list available epics');
        assert.ok(error.message.includes('epic3'), 'Error should list available epics');
      }
    });

    test('should handle various dependency formats', () => {
      fs.mkdirSync('.claude/epics/deps-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/deps-epic/epic.md', 'name: Dependencies Epic');

      // Test different dependency formats
      fs.writeFileSync('.claude/epics/deps-epic/1.md', 'name: No Deps\nstatus: open');
      fs.writeFileSync('.claude/epics/deps-epic/2.md', 'name: Array Deps\nstatus: open\ndepends_on: [1]');
      fs.writeFileSync('.claude/epics/deps-epic/3.md', 'name: String Deps\nstatus: open\ndepends_on: 1, 2');
      fs.writeFileSync('.claude/epics/deps-epic/4.md', 'name: Empty Deps\nstatus: open\ndepends_on: []');
      fs.writeFileSync('.claude/epics/deps-epic/5.md', 'name: Malformed Deps\nstatus: open\ndepends_on: depends_on:');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('deps-epic');

      // Tasks 2 and 3 should be considered blocked (have non-empty dependencies)
      assert.strictEqual(result.taskBreakdown.blockedTasks, 2);
      assert.strictEqual(result.taskBreakdown.openTasks, 3); // Tasks 1, 4, 5
    });

    test('should handle tasks without metadata', () => {
      fs.mkdirSync('.claude/epics/minimal-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/minimal-epic/epic.md', 'name: Minimal Epic');

      // Create task files without frontmatter
      fs.writeFileSync('.claude/epics/minimal-epic/1.md', '# Task 1\nSome content');
      fs.writeFileSync('.claude/epics/minimal-epic/2.md', '# Task 2\nMore content');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('minimal-epic');

      // Should default to open status with no dependencies
      assert.strictEqual(result.taskBreakdown.totalTasks, 2);
      assert.strictEqual(result.taskBreakdown.openTasks, 2);
      assert.strictEqual(result.taskBreakdown.closedTasks, 0);
      assert.strictEqual(result.taskBreakdown.blockedTasks, 0);
    });

    test('should calculate progress percentage correctly for edge cases', () => {
      // Test 100% completion
      fs.mkdirSync('.claude/epics/complete-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/complete-epic/epic.md', 'name: Complete Epic');
      fs.writeFileSync('.claude/epics/complete-epic/1.md', 'name: Done Task\nstatus: completed');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result1 = epicStatusModule('complete-epic');

      assert.strictEqual(result1.progressBar.percent, 100);
      assert.strictEqual(result1.progressBar.filled, 20); // Full bar
      assert.strictEqual(result1.progressBar.empty, 0);

      // Test 0% completion
      fs.mkdirSync('.claude/epics/zero-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/zero-epic/epic.md', 'name: Zero Epic');
      fs.writeFileSync('.claude/epics/zero-epic/1.md', 'name: Open Task\nstatus: open');

      const result2 = epicStatusModule('zero-epic');

      assert.strictEqual(result2.progressBar.percent, 0);
      assert.strictEqual(result2.progressBar.filled, 0);
      assert.strictEqual(result2.progressBar.empty, 20); // Empty bar
    });

    test('should include GitHub link when available', () => {
      fs.mkdirSync('.claude/epics/github-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/github-epic/epic.md', `name: GitHub Epic
status: in-progress
github: https://github.com/test/repo/issues/789`);

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('github-epic');

      assert.strictEqual(result.epic.github, 'https://github.com/test/repo/issues/789');
    });
  });

  describe('Output Format Tests', () => {
    test('should format output similar to bash version when used as CLI', () => {
      fs.mkdirSync('.claude/epics/cli-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/cli-epic/epic.md', 'name: CLI Epic\nstatus: planning');
      fs.writeFileSync('.claude/epics/cli-epic/1.md', 'name: Task 1\nstatus: open');

      // Test CLI usage
      process.argv = ['node', 'epic-status.js', 'cli-epic'];
      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');

      // Should work both as function and CLI
      const result = epicStatusModule('cli-epic');
      assert.ok(typeof result === 'object', 'Should return object when used as function');
    });

    test('should include all required output sections', () => {
      fs.mkdirSync('.claude/epics/format-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/format-epic/epic.md', 'name: Format Epic\nstatus: planning');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('format-epic');

      // Check that result has all required sections
      const requiredSections = ['epic', 'taskBreakdown', 'progressBar'];
      requiredSections.forEach(section => {
        assert.ok(result.hasOwnProperty(section), `Should have ${section} section`);
      });
    });

    test('should generate progress bar with correct format', () => {
      fs.mkdirSync('.claude/epics/bar-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/bar-epic/epic.md', 'name: Bar Epic');
      fs.writeFileSync('.claude/epics/bar-epic/1.md', 'name: Closed Task\nstatus: closed');
      fs.writeFileSync('.claude/epics/bar-epic/2.md', 'name: Open Task\nstatus: open');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('bar-epic');

      // Should have 50% completion (1 of 2 tasks)
      assert.strictEqual(result.progressBar.percent, 50);
      assert.strictEqual(result.progressBar.bar.length, 22); // 20 chars + 2 brackets
      assert.ok(result.progressBar.bar.startsWith('['), 'Progress bar should start with [');
      assert.ok(result.progressBar.bar.endsWith(']'), 'Progress bar should end with ]');
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle corrupted epic.md files', () => {
      fs.mkdirSync('.claude/epics/corrupted-epic', { recursive: true });
      // Create a file that can't be read properly
      fs.writeFileSync('.claude/epics/corrupted-epic/epic.md', '\x00\x01\x02invalid');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');

      // Should not throw when reading corrupted epic file
      assert.doesNotThrow(() => {
        const result = epicStatusModule('corrupted-epic');
        assert.ok(typeof result === 'object');
      });
    });

    test('should handle corrupted task files', () => {
      fs.mkdirSync('.claude/epics/corrupted-tasks-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/corrupted-tasks-epic/epic.md', 'name: Corrupted Tasks Epic');
      fs.writeFileSync('.claude/epics/corrupted-tasks-epic/1.md', '\x00\x01\x02invalid task');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');

      assert.doesNotThrow(() => {
        const result = epicStatusModule('corrupted-tasks-epic');
        // Should either skip corrupted tasks or handle with defaults
        assert.ok(typeof result === 'object');
      });
    });
  });

  describe('Compatibility Tests', () => {
    test('should match bash script behavior for dependency detection', () => {
      fs.mkdirSync('.claude/epics/compat-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/compat-epic/epic.md', 'name: Compatibility Epic');

      // Replicate bash script dependency detection logic
      fs.writeFileSync('.claude/epics/compat-epic/1.md', 'name: Task 1\nstatus: open'); // No deps
      fs.writeFileSync('.claude/epics/compat-epic/2.md', 'name: Task 2\nstatus: open\ndepends_on: [1]'); // Has deps
      fs.writeFileSync('.claude/epics/compat-epic/3.md', 'name: Task 3\nstatus: closed\ndepends_on: [1]'); // Closed with deps

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('compat-epic');

      // Bash script counts task 2 as blocked (open + has deps)
      // Task 3 is closed so not counted as blocked
      assert.strictEqual(result.taskBreakdown.openTasks, 1); // Task 1
      assert.strictEqual(result.taskBreakdown.closedTasks, 1); // Task 3
      assert.strictEqual(result.taskBreakdown.blockedTasks, 1); // Task 2
    });

    test('should match bash script progress calculation', () => {
      fs.mkdirSync('.claude/epics/calc-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/calc-epic/epic.md', 'name: Calculation Epic');

      // Create specific scenario to match bash calculation
      fs.writeFileSync('.claude/epics/calc-epic/1.md', 'name: Open 1\nstatus: open');
      fs.writeFileSync('.claude/epics/calc-epic/2.md', 'name: Closed 1\nstatus: closed');
      fs.writeFileSync('.claude/epics/calc-epic/3.md', 'name: Completed 1\nstatus: completed');

      const epicStatusModule = require('../../autopm/.claude/scripts/pm/epic-status.js');
      const result = epicStatusModule('calc-epic');

      // Bash: percent=$((closed * 100 / total)) where closed includes both 'closed' and 'completed'
      // 2 closed out of 3 total = 66% (integer division)
      assert.strictEqual(result.progressBar.percent, 67); // Rounded from 66.67
    });
  });
});