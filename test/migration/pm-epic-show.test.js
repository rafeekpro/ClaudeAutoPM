const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM Epic Show Script Migration
 *
 * Testing migration from epic-show.sh to epic-show.js
 * RED phase - These tests should fail initially
 */

describe('PM Epic Show Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-epic-show-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (epic-show.js)', () => {
    test('should export a function', () => {
      // This test will fail until we implement epic-show.js
      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      assert.strictEqual(typeof epicShowModule, 'function');
    });

    test('should throw error for missing epic name parameter', () => {
      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');

      assert.throws(() => {
        epicShowModule();
      }, /Please provide an epic name/);

      assert.throws(() => {
        epicShowModule('');
      }, /Please provide an epic name/);
    });

    test('should return epic details for valid epic', () => {
      // Setup test epic
      fs.mkdirSync('.claude/epics/auth-system', { recursive: true });
      fs.writeFileSync('.claude/epics/auth-system/epic.md', `---
name: Authentication System
status: in-progress
progress: 75%
github: https://github.com/test/repo/issues/123
created: 2024-01-01
---

# Authentication System Epic
Complete user authentication system implementation
`);

      // Create some tasks
      fs.writeFileSync('.claude/epics/auth-system/1.md', `---
name: Setup authentication middleware
status: open
parallel: false
---
`);

      fs.writeFileSync('.claude/epics/auth-system/2.md', `---
name: Create login form
status: closed
parallel: true
---
`);

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('auth-system');

      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.hasOwnProperty('epic'), 'Should have epic section');
      assert.ok(result.hasOwnProperty('tasks'), 'Should have tasks section');
      assert.ok(result.hasOwnProperty('statistics'), 'Should have statistics section');
      assert.ok(result.hasOwnProperty('actions'), 'Should have actions section');
    });

    test('should parse epic metadata correctly', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', `---
name: Test Epic
status: planning
progress: 25%
github: https://github.com/user/repo/issues/456
created: 2024-02-01
---
`);

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('test-epic');

      assert.strictEqual(result.epic.name, 'Test Epic');
      assert.strictEqual(result.epic.status, 'planning');
      assert.strictEqual(result.epic.progress, '25%');
      assert.strictEqual(result.epic.github, 'https://github.com/user/repo/issues/456');
      assert.strictEqual(result.epic.created, '2024-02-01');
    });

    test('should handle epic without metadata', () => {
      fs.mkdirSync('.claude/epics/minimal-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/minimal-epic/epic.md', '# Minimal Epic\nBasic content only');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('minimal-epic');

      assert.strictEqual(result.epic.status, 'planning', 'Should default status to planning');
      assert.strictEqual(result.epic.progress, '0%', 'Should default progress to 0%');
      assert.strictEqual(result.epic.created, 'unknown', 'Should default created to unknown');
    });

    test('should list and categorize tasks correctly', () => {
      fs.mkdirSync('.claude/epics/task-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/task-epic/epic.md', 'name: Task Epic\nstatus: in-progress');

      // Create various task files
      fs.writeFileSync('.claude/epics/task-epic/1.md', `name: Open Task
status: open
parallel: false`);

      fs.writeFileSync('.claude/epics/task-epic/2.md', `name: Closed Task
status: closed
parallel: true`);

      fs.writeFileSync('.claude/epics/task-epic/3.md', `name: Completed Task
status: completed
parallel: false`);

      fs.writeFileSync('.claude/epics/task-epic/10.md', `name: Another Open Task
status: open`);

      // Create non-task files (should be ignored)
      fs.writeFileSync('.claude/epics/task-epic/notes.md', 'Notes file');
      fs.writeFileSync('.claude/epics/task-epic/readme.txt', 'Readme file');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('task-epic');

      // Check task parsing
      assert.strictEqual(result.tasks.length, 4, 'Should find 4 numbered task files');

      // Check specific tasks
      const task1 = result.tasks.find(t => t.taskNum === '1');
      assert.ok(task1, 'Should find task 1');
      assert.strictEqual(task1.name, 'Open Task');
      assert.strictEqual(task1.status, 'open');
      assert.strictEqual(task1.parallel, 'false');

      const task2 = result.tasks.find(t => t.taskNum === '2');
      assert.ok(task2, 'Should find task 2');
      assert.strictEqual(task2.name, 'Closed Task');
      assert.strictEqual(task2.status, 'closed');
      assert.strictEqual(task2.parallel, 'true');
    });

    test('should calculate statistics correctly', () => {
      fs.mkdirSync('.claude/epics/stats-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/stats-epic/epic.md', 'name: Stats Epic');

      // Create tasks with various statuses
      fs.writeFileSync('.claude/epics/stats-epic/1.md', 'name: Open 1\nstatus: open');
      fs.writeFileSync('.claude/epics/stats-epic/2.md', 'name: Open 2\nstatus: open');
      fs.writeFileSync('.claude/epics/stats-epic/3.md', 'name: Closed 1\nstatus: closed');
      fs.writeFileSync('.claude/epics/stats-epic/4.md', 'name: Completed 1\nstatus: completed');
      fs.writeFileSync('.claude/epics/stats-epic/5.md', 'name: Completed 2\nstatus: completed');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('stats-epic');

      assert.strictEqual(result.statistics.totalTasks, 5);
      assert.strictEqual(result.statistics.openTasks, 2);
      assert.strictEqual(result.statistics.closedTasks, 3); // closed + completed
      assert.strictEqual(result.statistics.completion, 60); // 3/5 * 100
    });

    test('should suggest appropriate actions', () => {
      fs.mkdirSync('.claude/epics/action-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/action-epic/epic.md', `name: Action Epic
status: planning
progress: 0%`);

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('action-epic');

      // For epic with no tasks, should suggest decomposition
      assert.ok(result.actions.some(action => action.includes('epic-decompose')), 'Should suggest decomposition');
    });

    test('should suggest GitHub sync for epics with tasks but no GitHub link', () => {
      fs.mkdirSync('.claude/epics/sync-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/sync-epic/epic.md', `name: Sync Epic
status: planning`);

      fs.writeFileSync('.claude/epics/sync-epic/1.md', 'name: Task 1\nstatus: open');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('sync-epic');

      assert.ok(result.actions.some(action => action.includes('epic-sync')), 'Should suggest GitHub sync');
    });

    test('should suggest starting work for epics with GitHub link', () => {
      fs.mkdirSync('.claude/epics/start-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/start-epic/epic.md', `name: Start Epic
status: planning
github: https://github.com/test/repo/issues/123`);

      fs.writeFileSync('.claude/epics/start-epic/1.md', 'name: Task 1\nstatus: open');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('start-epic');

      assert.ok(result.actions.some(action => action.includes('epic-start')), 'Should suggest starting work');
    });

    test('should handle epic not found error', () => {
      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');

      assert.throws(() => {
        epicShowModule('nonexistent-epic');
      }, /Epic not found: nonexistent-epic/);
    });

    test('should list available epics when epic not found', () => {
      // Create some epics
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });
      fs.mkdirSync('.claude/epics/epic3', { recursive: true });

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');

      try {
        epicShowModule('nonexistent');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('epic1'), 'Error should list available epics');
        assert.ok(error.message.includes('epic2'), 'Error should list available epics');
        assert.ok(error.message.includes('epic3'), 'Error should list available epics');
      }
    });

    test('should handle empty tasks directory', () => {
      fs.mkdirSync('.claude/epics/empty-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/empty-epic/epic.md', 'name: Empty Epic\nstatus: planning');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('empty-epic');

      assert.strictEqual(result.tasks.length, 0);
      assert.strictEqual(result.statistics.totalTasks, 0);
      assert.strictEqual(result.statistics.openTasks, 0);
      assert.strictEqual(result.statistics.closedTasks, 0);
      assert.strictEqual(result.statistics.completion, 0);
    });

    test('should handle tasks without metadata', () => {
      fs.mkdirSync('.claude/epics/minimal-tasks-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/minimal-tasks-epic/epic.md', 'name: Minimal Tasks Epic');

      // Create task files without frontmatter
      fs.writeFileSync('.claude/epics/minimal-tasks-epic/1.md', '# Task 1\nSome content');
      fs.writeFileSync('.claude/epics/minimal-tasks-epic/2.md', '# Task 2\nMore content');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('minimal-tasks-epic');

      assert.strictEqual(result.tasks.length, 2);
      assert.strictEqual(result.tasks[0].taskNum, '1');
      assert.strictEqual(result.tasks[0].name, '1'); // Should default to task number
      assert.strictEqual(result.tasks[0].status, 'open'); // Should default to open
      assert.strictEqual(result.tasks[0].parallel, 'false'); // Should default to false
    });

    test('should parse YAML frontmatter in tasks', () => {
      fs.mkdirSync('.claude/epics/yaml-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/yaml-epic/epic.md', 'name: YAML Epic');

      fs.writeFileSync('.claude/epics/yaml-epic/1.md', `---
name: YAML Task
status: closed
parallel: true
depends_on: []
---

# Task Content
This task uses YAML frontmatter.
`);

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('yaml-epic');

      const task = result.tasks[0];
      assert.strictEqual(task.name, 'YAML Task');
      assert.strictEqual(task.status, 'closed');
      assert.strictEqual(task.parallel, 'true');
    });
  });

  describe('Output Format Tests', () => {
    test('should format output similar to bash version when used as CLI', () => {
      fs.mkdirSync('.claude/epics/cli-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/cli-epic/epic.md', 'name: CLI Epic\nstatus: planning');
      fs.writeFileSync('.claude/epics/cli-epic/1.md', 'name: Task 1\nstatus: open');

      // Test CLI usage
      process.argv = ['node', 'epic-show.js', 'cli-epic'];
      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');

      // Should work both as function and CLI
      const result = epicShowModule('cli-epic');
      assert.ok(typeof result === 'object', 'Should return object when used as function');
    });

    test('should include all required output sections', () => {
      fs.mkdirSync('.claude/epics/complete-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/complete-epic/epic.md', 'name: Complete Epic\nstatus: planning');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('complete-epic');

      // Check that result has all required sections
      const requiredSections = ['epic', 'tasks', 'statistics', 'actions'];
      requiredSections.forEach(section => {
        assert.ok(result.hasOwnProperty(section), `Should have ${section} section`);
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle corrupted epic.md files', () => {
      fs.mkdirSync('.claude/epics/corrupted-epic', { recursive: true });
      // Create a file that can't be read properly
      fs.writeFileSync('.claude/epics/corrupted-epic/epic.md', '\x00\x01\x02invalid');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');

      // Should not throw when reading corrupted epic file
      assert.doesNotThrow(() => {
        const result = epicShowModule('corrupted-epic');
        assert.ok(typeof result === 'object');
      });
    });

    test('should handle corrupted task files', () => {
      fs.mkdirSync('.claude/epics/corrupted-tasks-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/corrupted-tasks-epic/epic.md', 'name: Corrupted Tasks Epic');
      fs.writeFileSync('.claude/epics/corrupted-tasks-epic/1.md', '\x00\x01\x02invalid task');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');

      assert.doesNotThrow(() => {
        const result = epicShowModule('corrupted-tasks-epic');
        // Should either skip corrupted tasks or handle with defaults
        assert.ok(typeof result === 'object');
      });
    });
  });

  describe('Compatibility Tests', () => {
    test('should match bash script behavior for task status classification', () => {
      fs.mkdirSync('.claude/epics/compat-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/compat-epic/epic.md', 'name: Compatibility Epic');

      // Test both closed and completed statuses (bash treats both as closed)
      fs.writeFileSync('.claude/epics/compat-epic/1.md', 'name: Closed Task\nstatus: closed');
      fs.writeFileSync('.claude/epics/compat-epic/2.md', 'name: Completed Task\nstatus: completed');
      fs.writeFileSync('.claude/epics/compat-epic/3.md', 'name: Open Task\nstatus: open');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result = epicShowModule('compat-epic');

      // Both closed and completed should count as closed in statistics
      assert.strictEqual(result.statistics.closedTasks, 2);
      assert.strictEqual(result.statistics.openTasks, 1);
      assert.strictEqual(result.statistics.completion, 67); // 2/3 * 100 rounded
    });

    test('should match bash script action suggestions', () => {
      // Test epic with no tasks
      fs.mkdirSync('.claude/epics/no-tasks-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/no-tasks-epic/epic.md', 'name: No Tasks Epic\nstatus: planning');

      const epicShowModule = require('../../autopm/.claude/scripts/pm/epic-show.js');
      const result1 = epicShowModule('no-tasks-epic');

      assert.ok(result1.actions.some(action => action.includes('epic-decompose')));

      // Test epic with tasks but no GitHub
      fs.mkdirSync('.claude/epics/no-github-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/no-github-epic/epic.md', 'name: No GitHub Epic\nstatus: planning');
      fs.writeFileSync('.claude/epics/no-github-epic/1.md', 'name: Task 1\nstatus: open');

      const result2 = epicShowModule('no-github-epic');
      assert.ok(result2.actions.some(action => action.includes('epic-sync')));

      // Test epic with GitHub and not completed
      fs.mkdirSync('.claude/epics/github-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/github-epic/epic.md', `name: GitHub Epic
status: planning
github: https://github.com/test/repo/issues/123`);
      fs.writeFileSync('.claude/epics/github-epic/1.md', 'name: Task 1\nstatus: open');

      const result3 = epicShowModule('github-epic');
      assert.ok(result3.actions.some(action => action.includes('epic-start')));
    });
  });
});