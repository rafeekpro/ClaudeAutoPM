const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM Epic List Script Migration
 *
 * Testing migration from epic-list.sh to epic-list.js
 * RED phase - These tests should fail initially
 */

describe('PM Epic List Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-epic-list-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (epic-list.js)', () => {
    test('should export a function', () => {
      // This test will fail until we implement epic-list.js
      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      assert.strictEqual(typeof epicListModule, 'function');
    });

    test('should return structured epic data', () => {
      // Setup test data
      fs.mkdirSync('.claude/epics/auth-system', { recursive: true });
      fs.mkdirSync('.claude/epics/payment-flow', { recursive: true });

      fs.writeFileSync('.claude/epics/auth-system/epic.md', `---
name: Authentication System
status: planning
progress: 25%
github: https://github.com/test/repo/issues/123
created: 2024-01-01
---

# Authentication System Epic
Implement user authentication system
`);

      fs.writeFileSync('.claude/epics/payment-flow/epic.md', `---
name: Payment Flow
status: in-progress
progress: 75%
created: 2024-01-02
---

# Payment Flow Epic
Implement payment processing
`);

      // Create some task files
      fs.writeFileSync('.claude/epics/auth-system/1.md', 'Task 1');
      fs.writeFileSync('.claude/epics/auth-system/2.md', 'Task 2');
      fs.writeFileSync('.claude/epics/payment-flow/1.md', 'Task 1');

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.hasOwnProperty('planning'), 'Should have planning section');
      assert.ok(result.hasOwnProperty('inProgress'), 'Should have inProgress section');
      assert.ok(result.hasOwnProperty('completed'), 'Should have completed section');
      assert.ok(result.hasOwnProperty('summary'), 'Should have summary section');
    });

    test('should categorize epics by status correctly', () => {
      fs.mkdirSync('.claude/epics/planning-epic', { recursive: true });
      fs.mkdirSync('.claude/epics/active-epic', { recursive: true });
      fs.mkdirSync('.claude/epics/done-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/planning-epic/epic.md', `---
name: Planning Epic
status: planning
progress: 0%
---
`);

      fs.writeFileSync('.claude/epics/active-epic/epic.md', `---
name: Active Epic
status: in-progress
progress: 50%
---
`);

      fs.writeFileSync('.claude/epics/done-epic/epic.md', `---
name: Done Epic
status: completed
progress: 100%
---
`);

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      assert.strictEqual(result.planning.length, 1, 'Should have one planning epic');
      assert.strictEqual(result.inProgress.length, 1, 'Should have one in-progress epic');
      assert.strictEqual(result.completed.length, 1, 'Should have one completed epic');

      assert.strictEqual(result.planning[0].name, 'Planning Epic');
      assert.strictEqual(result.inProgress[0].name, 'Active Epic');
      assert.strictEqual(result.completed[0].name, 'Done Epic');
    });

    test('should handle various status formats', () => {
      const statuses = [
        { dir: 'draft-epic', status: 'draft', expectedCategory: 'planning' },
        { dir: 'planning-epic', status: 'planning', expectedCategory: 'planning' },
        { dir: 'empty-status-epic', status: '', expectedCategory: 'planning' },
        { dir: 'active-epic', status: 'active', expectedCategory: 'inProgress' },
        { dir: 'started-epic', status: 'started', expectedCategory: 'inProgress' },
        { dir: 'in_progress-epic', status: 'in_progress', expectedCategory: 'inProgress' },
        { dir: 'complete-epic', status: 'complete', expectedCategory: 'completed' },
        { dir: 'done-epic', status: 'done', expectedCategory: 'completed' },
        { dir: 'finished-epic', status: 'finished', expectedCategory: 'completed' },
        { dir: 'closed-epic', status: 'closed', expectedCategory: 'completed' }
      ];

      statuses.forEach(({ dir, status }) => {
        fs.mkdirSync(`.claude/epics/${dir}`, { recursive: true });
        fs.writeFileSync(`.claude/epics/${dir}/epic.md`, `---
name: ${dir}
status: ${status}
progress: 50%
---
`);
      });

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      assert.strictEqual(result.planning.length, 3, 'Should categorize planning statuses correctly');
      assert.strictEqual(result.inProgress.length, 3, 'Should categorize in-progress statuses correctly');
      assert.strictEqual(result.completed.length, 4, 'Should categorize completed statuses correctly');
    });

    test('should count tasks correctly', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', `---
name: Test Epic
status: planning
progress: 25%
---
`);

      // Create numbered task files
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'Task 1');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'Task 2');
      fs.writeFileSync('.claude/epics/test-epic/10.md', 'Task 10');
      // Create non-task files (should be ignored)
      fs.writeFileSync('.claude/epics/test-epic/notes.md', 'Notes');
      fs.writeFileSync('.claude/epics/test-epic/readme.txt', 'Readme');

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      assert.strictEqual(result.planning[0].taskCount, 3, 'Should count only numbered task files');
    });

    test('should extract GitHub issue numbers', () => {
      fs.mkdirSync('.claude/epics/github-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/github-epic/epic.md', `---
name: GitHub Epic
status: planning
progress: 0%
github: https://github.com/user/repo/issues/456
---
`);

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      assert.strictEqual(result.planning[0].githubIssue, '456', 'Should extract GitHub issue number');
    });

    test('should handle missing epic.md files', () => {
      fs.mkdirSync('.claude/epics/no-epic-file', { recursive: true });
      fs.writeFileSync('.claude/epics/no-epic-file/1.md', 'Task 1');

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      // Should not include epics without epic.md
      assert.strictEqual(result.planning.length, 0, 'Should skip directories without epic.md');
      assert.strictEqual(result.inProgress.length, 0, 'Should skip directories without epic.md');
      assert.strictEqual(result.completed.length, 0, 'Should skip directories without epic.md');
    });

    test('should provide default values for missing metadata', () => {
      fs.mkdirSync('.claude/epics/minimal-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/minimal-epic/epic.md', '# Minimal Epic\nBasic content');

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      const epic = result.planning[0];
      assert.strictEqual(epic.name, 'minimal-epic', 'Should use directory name as default');
      assert.strictEqual(epic.progress, '0%', 'Should default progress to 0%');
      assert.strictEqual(epic.status, 'planning', 'Should default status to planning');
    });

    test('should generate correct summary statistics', () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/epic.md', 'name: Epic 1\nstatus: planning');
      fs.writeFileSync('.claude/epics/epic2/epic.md', 'name: Epic 2\nstatus: completed');

      // Create tasks
      fs.writeFileSync('.claude/epics/epic1/1.md', 'Task 1');
      fs.writeFileSync('.claude/epics/epic1/2.md', 'Task 2');
      fs.writeFileSync('.claude/epics/epic2/1.md', 'Task 1');

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      assert.strictEqual(result.summary.totalEpics, 2, 'Should count total epics correctly');
      assert.strictEqual(result.summary.totalTasks, 3, 'Should count total tasks correctly');
    });

    test('should handle empty epics directory', () => {
      fs.mkdirSync('.claude/epics', { recursive: true });

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      assert.strictEqual(result.planning.length, 0, 'Should handle empty directory');
      assert.strictEqual(result.inProgress.length, 0, 'Should handle empty directory');
      assert.strictEqual(result.completed.length, 0, 'Should handle empty directory');
      assert.strictEqual(result.summary.totalEpics, 0, 'Should report zero epics');
      assert.strictEqual(result.summary.totalTasks, 0, 'Should report zero tasks');
    });

    test('should handle missing epics directory', () => {
      // No .claude/epics directory exists
      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      assert.strictEqual(result.planning.length, 0, 'Should handle missing directory');
      assert.strictEqual(result.inProgress.length, 0, 'Should handle missing directory');
      assert.strictEqual(result.completed.length, 0, 'Should handle missing directory');
      assert.strictEqual(result.summary.totalEpics, 0, 'Should report zero epics');
      assert.strictEqual(result.summary.totalTasks, 0, 'Should report zero tasks');
    });
  });

  describe('Output Format Tests', () => {
    test('should format output similar to bash version when used as CLI', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', `---
name: Test Epic
status: planning
progress: 50%
---
`);
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'Task 1');

      // Test CLI usage
      process.argv = ['node', 'epic-list.js'];
      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');

      // Should work both as function and CLI
      const result = epicListModule();
      assert.ok(typeof result === 'object', 'Should return object when used as function');
    });

    test('should include all required output sections', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test\nstatus: planning');

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      // Check that result has all required sections
      const requiredSections = ['planning', 'inProgress', 'completed', 'summary'];
      requiredSections.forEach(section => {
        assert.ok(result.hasOwnProperty(section), `Should have ${section} section`);
      });
    });
  });

  describe('Frontmatter Parsing Tests', () => {
    test('should parse YAML frontmatter correctly', () => {
      fs.mkdirSync('.claude/epics/yaml-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/yaml-epic/epic.md', `---
name: YAML Epic
status: in-progress
progress: 60%
github: https://github.com/test/repo/issues/789
created: 2024-01-15
---

# Epic Content
This is the epic description.
`);

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      const epic = result.inProgress[0];
      assert.strictEqual(epic.name, 'YAML Epic');
      assert.strictEqual(epic.progress, '60%');
      assert.strictEqual(epic.githubIssue, '789');
    });

    test('should parse simple key-value frontmatter', () => {
      fs.mkdirSync('.claude/epics/simple-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/simple-epic/epic.md', `name: Simple Epic
status: completed
progress: 100%
github: https://github.com/test/repo/issues/999

# Epic Content
Simple format epic.
`);

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      const epic = result.completed[0];
      assert.strictEqual(epic.name, 'Simple Epic');
      assert.strictEqual(epic.progress, '100%');
      assert.strictEqual(epic.githubIssue, '999');
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle corrupted epic.md files', () => {
      fs.mkdirSync('.claude/epics/corrupted-epic', { recursive: true });
      // Create a file that can't be read properly
      fs.writeFileSync('.claude/epics/corrupted-epic/epic.md', '\x00\x01\x02invalid');

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');

      // Should not throw, should handle gracefully
      assert.doesNotThrow(() => {
        const result = epicListModule();
        // Should either skip the corrupted file or use defaults
        assert.ok(typeof result === 'object');
      });
    });

    test('should handle permission errors gracefully', () => {
      fs.mkdirSync('.claude/epics/perm-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/perm-epic/epic.md', 'name: Perm Epic\nstatus: planning');

      // Can't easily test permission errors in all environments, but ensure no crashes
      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');

      assert.doesNotThrow(() => {
        const result = epicListModule();
        assert.ok(typeof result === 'object');
      });
    });
  });

  describe('Compatibility Tests', () => {
    test('should match bash script behavior for epic counting', () => {
      // Create test data that matches bash script expectations
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/epic.md', 'name: Epic 1\nstatus: planning\nprogress: 25%');
      fs.writeFileSync('.claude/epics/epic2/epic.md', 'name: Epic 2\nstatus: in-progress\nprogress: 75%');

      // Create numbered task files (matching bash: ls "$dir"[0-9]*.md)
      fs.writeFileSync('.claude/epics/epic1/1.md', 'Task 1');
      fs.writeFileSync('.claude/epics/epic1/2.md', 'Task 2');
      fs.writeFileSync('.claude/epics/epic2/1.md', 'Task 1');
      fs.writeFileSync('.claude/epics/epic2/10.md', 'Task 10');

      const epicListModule = require('../../autopm/.claude/scripts/pm/epic-list.js');
      const result = epicListModule();

      // Should match bash behavior exactly
      assert.strictEqual(result.planning.length, 1);
      assert.strictEqual(result.inProgress.length, 1);
      assert.strictEqual(result.planning[0].taskCount, 2);
      assert.strictEqual(result.inProgress[0].taskCount, 2);
      assert.strictEqual(result.summary.totalEpics, 2);
      assert.strictEqual(result.summary.totalTasks, 4);
    });
  });
});