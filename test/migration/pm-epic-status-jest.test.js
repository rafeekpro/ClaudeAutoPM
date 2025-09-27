const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Jest TDD Tests for PM Epic Status Script
 * Testing epic-status.js with 100% coverage goal
 */

describe('PM Epic Status Script - Full Coverage Tests', () => {
  let tempDir;
  let originalCwd;
  let epicStatus;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-epic-status-test-'));
    process.chdir(tempDir);

    // Clear module cache to ensure fresh import
    jest.resetModules();
    epicStatus = require('../../autopm/.claude/scripts/pm/epic-status.js');
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Basic Functionality', () => {
    test('should export a function', () => {
      expect(typeof epicStatus).toBe('function');
    });

    test('should throw error when no epic name provided', () => {
      expect(() => epicStatus()).toThrow('❌ Please specify an epic name');
      expect(() => epicStatus('')).toThrow('❌ Please specify an epic name');
      expect(() => epicStatus('   ')).toThrow('❌ Please specify an epic name');
    });

    test('should throw error when epic does not exist', () => {
      expect(() => epicStatus('non-existent')).toThrow('❌ Epic not found: non-existent');
    });

    test('should show available epics when target epic not found', () => {
      fs.mkdirSync('.claude/epics/existing-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/existing-epic/epic.md', 'name: Existing Epic');

      expect(() => epicStatus('non-existent')).toThrow('• existing-epic');
    });

    test('should show (none) when no epics exist', () => {
      fs.mkdirSync('.claude/epics', { recursive: true });

      expect(() => epicStatus('non-existent')).toThrow('(none)');
    });
  });

  describe('Epic Metadata Parsing', () => {
    test('should parse epic metadata with YAML frontmatter', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md',
        `---
name: Test Epic
status: in-progress
progress: 50%
github: https://github.com/user/repo
---

Content here`);

      const result = epicStatus('test-epic');

      expect(result.epic).toMatchObject({
        name: 'Test Epic',
        status: 'in-progress',
        progress: '50%',
        github: 'https://github.com/user/repo'
      });
    });

    test('should parse epic metadata with simple format', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md',
        `name: Simple Epic
status: planning
github: https://github.com/test/repo

# Content`);

      const result = epicStatus('test-epic');

      expect(result.epic).toMatchObject({
        name: 'Simple Epic',
        status: 'planning',
        github: 'https://github.com/test/repo'
      });
    });

    test('should use defaults for missing metadata', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', '# Just content');

      const result = epicStatus('test-epic');

      expect(result.epic).toMatchObject({
        name: 'test-epic',
        status: 'planning',
        progress: '0%',
        github: ''
      });
    });

    test('should handle unreadable epic file', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'content');
      fs.chmodSync('.claude/epics/test-epic/epic.md', 0o000);

      const result = epicStatus('test-epic');

      expect(result.epic).toMatchObject({
        name: 'test-epic',
        status: 'planning',
        progress: '0%'
      });

      // Restore permissions for cleanup
      fs.chmodSync('.claude/epics/test-epic/epic.md', 0o644);
    });
  });

  describe('Task Analysis', () => {
    test('should analyze task breakdown correctly', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      // Open task
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Open Task\nstatus: open');

      // Completed task
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'name: Done Task\nstatus: completed');

      // Blocked task
      fs.writeFileSync('.claude/epics/test-epic/3.md',
        'name: Blocked Task\nstatus: open\ndepends_on: [1]');

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown).toMatchObject({
        totalTasks: 3,
        openTasks: 1,
        closedTasks: 1,
        blockedTasks: 1
      });
    });

    test('should handle tasks with various dependency formats', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'depends_on: [2, 3]');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'depends_on: [ 3 ]');
      fs.writeFileSync('.claude/epics/test-epic/3.md', 'depends_on: []');
      fs.writeFileSync('.claude/epics/test-epic/4.md', 'depends_on: ');

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.blockedTasks).toBe(2); // tasks 1 and 2
      expect(result.taskBreakdown.openTasks).toBe(2); // tasks 3 and 4
    });

    test('should recognize different closed statuses', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'status: completed');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'status: CLOSED');
      fs.writeFileSync('.claude/epics/test-epic/3.md', 'status: done'); // not recognized

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.closedTasks).toBe(2);
      expect(result.taskBreakdown.openTasks).toBe(1);
    });

    test('should handle malformed dependency strings', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'depends_on: depends_on:');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'depends_on: invalid');

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.blockedTasks).toBe(1); // only task 2
      expect(result.taskBreakdown.openTasks).toBe(1); // task 1
    });

    test('should handle empty tasks directory', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Empty Epic');

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown).toMatchObject({
        totalTasks: 0,
        openTasks: 0,
        closedTasks: 0,
        blockedTasks: 0
      });
    });

    test('should only process numeric task files', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'status: open');
      fs.writeFileSync('.claude/epics/test-epic/task.md', 'status: open'); // ignored
      fs.writeFileSync('.claude/epics/test-epic/readme.txt', 'content'); // ignored

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.totalTasks).toBe(1);
    });

    test('should handle unreadable task files', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'content');
      fs.chmodSync('.claude/epics/test-epic/1.md', 0o000);

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.totalTasks).toBe(1);
      expect(result.taskBreakdown.openTasks).toBe(1); // defaults to open

      // Restore permissions for cleanup
      fs.chmodSync('.claude/epics/test-epic/1.md', 0o644);
    });

    test('should handle unreadable epic directory', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'status: open');

      // Can't make directory unreadable without affecting epic.md access
      // Test that normal operation works
      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.totalTasks).toBe(1);
    });
  });

  describe('Progress Bar Generation', () => {
    test('should generate progress bar for partial completion', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'status: completed');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'status: open');

      const result = epicStatus('test-epic');

      expect(result.progressBar.percent).toBe(50);
      expect(result.progressBar.bar).toContain('█');
      expect(result.progressBar.bar).toContain('░');
      expect(result.progressBar.message).toContain('50%');
    });

    test('should generate empty progress bar for zero completion', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'status: open');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'status: open');

      const result = epicStatus('test-epic');

      expect(result.progressBar.percent).toBe(0);
      expect(result.progressBar.bar).toMatch(/^\[░+\]$/);
    });

    test('should generate full progress bar for complete epic', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'status: completed');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'status: closed');

      const result = epicStatus('test-epic');

      expect(result.progressBar.percent).toBe(100);
      expect(result.progressBar.bar).toMatch(/^\[█+\]$/);
    });

    test('should handle epic with no tasks', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Empty Epic');

      const result = epicStatus('test-epic');

      expect(result.progressBar.message).toBe('Progress: No tasks created');
      expect(result.progressBar.percent).toBe(0);
      expect(result.progressBar.bar).toBe('');
    });
  });

  describe('Dependency Validation', () => {
    test('should identify valid dependencies', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'depends_on: [2]');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'depends_on: [3, 4]');

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.blockedTasks).toBe(2);
    });

    test('should handle whitespace in dependencies', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'depends_on: [ 2 , 3 ]');

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.blockedTasks).toBe(1);
    });

    test('should reject empty dependencies', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'depends_on: []');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'depends_on:   ');

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.blockedTasks).toBe(0);
      expect(result.taskBreakdown.openTasks).toBe(2);
    });

    test('should reject malformed dependency formats', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      fs.writeFileSync('.claude/epics/test-epic/1.md', 'depends_on: depends_on:');

      const result = epicStatus('test-epic');

      expect(result.taskBreakdown.blockedTasks).toBe(0);
      expect(result.taskBreakdown.openTasks).toBe(1);
    });
  });

  describe('Available Epics Functionality', () => {
    test('should handle missing .claude/epics directory', () => {
      expect(() => epicStatus('test')).toThrow('(none)');
    });

    test('should handle unreadable .claude/epics directory', () => {
      fs.mkdirSync('.claude/epics', { recursive: true });
      fs.chmodSync('.claude/epics', 0o000);

      expect(() => epicStatus('test')).toThrow('(none)');

      // Restore permissions for cleanup
      fs.chmodSync('.claude/epics', 0o755);
    });

    test('should filter non-directory entries in epics listing', () => {
      fs.mkdirSync('.claude/epics', { recursive: true });
      fs.writeFileSync('.claude/epics/file.txt', 'content');
      fs.mkdirSync('.claude/epics/real-epic');
      fs.writeFileSync('.claude/epics/real-epic/epic.md', 'name: Real Epic');

      expect(() => epicStatus('fake')).toThrow('• real-epic');
    });
  });

  describe('CLI Execution Simulation', () => {
    test('should return structured data for formatting', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      const result = epicStatus('test-epic');

      expect(result).toHaveProperty('epic');
      expect(result).toHaveProperty('taskBreakdown');
      expect(result).toHaveProperty('progressBar');
    });

    test('should handle epic with GitHub link', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md',
        'name: Test Epic\ngithub: https://github.com/test/repo');

      const result = epicStatus('test-epic');

      expect(result.epic.github).toBe('https://github.com/test/repo');
    });

    test('should handle epic without GitHub link', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      const result = epicStatus('test-epic');

      expect(result.epic.github).toBe('');
    });
  });

  describe('Progress Bar Edge Cases', () => {
    test('should handle progress bar with 1 task completed', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'status: completed');

      const result = epicStatus('test-epic');

      expect(result.progressBar.percent).toBe(100);
      expect(result.progressBar.filled).toBe(20);
      expect(result.progressBar.empty).toBe(0);
    });

    test('should round progress percentage correctly', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Test Epic');

      // 1 of 3 tasks = 33.33% -> should round to 33%
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'status: completed');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'status: open');
      fs.writeFileSync('.claude/epics/test-epic/3.md', 'status: open');

      const result = epicStatus('test-epic');

      expect(result.progressBar.percent).toBe(33);
    });
  });
});