/**
 * Jest TDD Tests for PM Standup Script (standup.js)
 *
 * Comprehensive test suite covering all functionality of the standup.js script
 * Target: Improve coverage from ~77% to 85%+
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  standup,
  findRecentFiles,
  findInProgressTasks,
  findAvailableTasks,
  calculateTaskStats
} = require('../../autopm/.claude/scripts/pm/standup.js');

describe('PM Standup Script - Comprehensive Jest Tests', () => {
  let tempDir;
  let originalCwd;
  let originalDate;

  beforeEach(() => {
    // Create isolated test environment
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-standup-jest-'));
    process.chdir(tempDir);

    // Mock Date for consistent testing
    originalDate = Date;
    const mockDate = new Date('2024-01-15T10:00:00Z');
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Restore original Date
    global.Date = originalDate;
  });

  describe('Basic Functionality', () => {
    test('should export all required functions', () => {
      expect(typeof standup).toBe('function');
      expect(typeof findRecentFiles).toBe('function');
      expect(typeof findInProgressTasks).toBe('function');
      expect(typeof findAvailableTasks).toBe('function');
      expect(typeof calculateTaskStats).toBe('function');
    });

    test('should return structured standup data', async () => {
      const result = await standup();

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('activity');
      expect(result).toHaveProperty('inProgress');
      expect(result).toHaveProperty('nextTasks');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('messages');

      expect(result.date).toBe('2024-01-15');
      expect(Array.isArray(result.inProgress)).toBe(true);
      expect(Array.isArray(result.nextTasks)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
    });

    test('should include proper header messages', async () => {
      const result = await standup();

      expect(result.messages).toContain('📅 Daily Standup - 2024-01-15');
      expect(result.messages).toContain('================================');
      expect(result.messages).toContain('📝 Today\'s Activity:');
      expect(result.messages).toContain('🔄 Currently In Progress:');
      expect(result.messages).toContain('⏭️ Next Available Tasks:');
      expect(result.messages).toContain('📊 Quick Stats:');
    });

    test('should handle empty project structure', async () => {
      const result = await standup();

      expect(result.activity.prdCount).toBe(0);
      expect(result.activity.epicCount).toBe(0);
      expect(result.activity.taskCount).toBe(0);
      expect(result.activity.updateCount).toBe(0);
      expect(result.inProgress).toHaveLength(0);
      expect(result.nextTasks).toHaveLength(0);
      expect(result.stats.totalTasks).toBe(0);
      expect(result.stats.openTasks).toBe(0);
      expect(result.stats.closedTasks).toBe(0);
    });
  });

  describe('Recent Files Detection', () => {
    test('should find files modified within 24 hours', async () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      // Create a file and set its modification time to recent
      const recentFile = '.claude/prds/recent.md';
      fs.writeFileSync(recentFile, 'Recent content');

      // Set modification time to 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      fs.utimesSync(recentFile, oneHourAgo, oneHourAgo);

      const files = await findRecentFiles('.claude');

      expect(files.some(f => f.includes('recent.md'))).toBe(true);
    });

    test('should exclude files older than 24 hours', async () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      // Create a file and set its modification time to old
      const oldFile = '.claude/prds/old.md';
      fs.writeFileSync(oldFile, 'Old content');

      // Set modification time to 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      fs.utimesSync(oldFile, twoDaysAgo, twoDaysAgo);

      const files = await findRecentFiles('.claude');

      expect(files).not.toContain(path.resolve(oldFile));
    });

    test('should only include .md files', async () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      // Create various file types
      fs.writeFileSync('.claude/prds/markdown.md', 'Markdown content');
      fs.writeFileSync('.claude/prds/text.txt', 'Text content');
      fs.writeFileSync('.claude/prds/json.json', '{}');

      const files = await findRecentFiles('.claude');

      expect(files.some(f => f.endsWith('markdown.md'))).toBe(true);
      expect(files.some(f => f.endsWith('text.txt'))).toBe(false);
      expect(files.some(f => f.endsWith('json.json'))).toBe(false);
    });

    test('should scan directories recursively', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', 'Task 1');
      fs.writeFileSync('.claude/epics/epic2/2.md', 'Task 2');

      const files = await findRecentFiles('.claude');

      expect(files.some(f => f.includes('epic1/1.md'))).toBe(true);
      expect(files.some(f => f.includes('epic2/2.md'))).toBe(true);
    });

    test('should handle missing directory gracefully', async () => {
      const files = await findRecentFiles('.claude/nonexistent');

      expect(files).toHaveLength(0);
    });

    test('should handle permission errors gracefully', async () => {
      fs.mkdirSync('.claude/restricted', { recursive: true });
      fs.writeFileSync('.claude/restricted/file.md', 'content');

      // Make directory unreadable (skip on Windows)
      if (process.platform !== 'win32') {
        fs.chmodSync('.claude/restricted', 0o000);
      }

      const files = await findRecentFiles('.claude');

      // Should not crash and return what it can read
      expect(Array.isArray(files)).toBe(true);

      // Clean up permissions
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync('.claude/restricted', 0o755);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Activity Counting', () => {
    test('should count PRD modifications correctly', async () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/prd1.md', 'PRD 1');
      fs.writeFileSync('.claude/prds/prd2.md', 'PRD 2');

      const result = await standup();

      expect(result.activity.prdCount).toBe(2);
      expect(result.messages.some(m => m.includes('Modified 2 PRD(s)'))).toBe(true);
    });

    test('should count epic modifications correctly', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/epic.md', 'Epic 1');
      fs.writeFileSync('.claude/epics/epic2/epic.md', 'Epic 2');

      const result = await standup();

      expect(result.activity.epicCount).toBe(2);
      expect(result.messages.some(m => m.includes('Updated 2 epic(s)'))).toBe(true);
    });

    test('should count task modifications correctly', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', 'Task 1');
      fs.writeFileSync('.claude/epics/epic1/2.md', 'Task 2');
      fs.writeFileSync('.claude/epics/epic1/10.md', 'Task 10');

      const result = await standup();

      expect(result.activity.taskCount).toBe(3);
      expect(result.messages.some(m => m.includes('Worked on 3 task(s)'))).toBe(true);
    });

    test('should count update modifications correctly', async () => {
      fs.mkdirSync('.claude/epics/epic1/updates/issue1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/updates/issue1/update.md', 'Update 1');

      const result = await standup();

      expect(result.activity.updateCount).toBe(1);
      expect(result.messages.some(m => m.includes('Posted 1 progress update(s)'))).toBe(true);
    });

    test('should show no activity message when appropriate', async () => {
      // Create old files (older than 24 hours)
      fs.mkdirSync('.claude/prds', { recursive: true });
      const oldFile = '.claude/prds/old.md';
      fs.writeFileSync(oldFile, 'Old content');

      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      fs.utimesSync(oldFile, twoDaysAgo, twoDaysAgo);

      const result = await standup();

      expect(result.messages).toContain('  No activity recorded today');
    });
  });

  describe('In Progress Tasks Detection', () => {
    test('should find tasks with progress files', async () => {
      fs.mkdirSync('.claude/epics/epic1/updates/123', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/updates/123/progress.md', `completion: 75%
status: in-progress`);

      const tasks = await findInProgressTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].issueNum).toBe('123');
      expect(tasks[0].epicName).toBe('epic1');
      expect(tasks[0].completion).toBe('75%');
    });

    test('should handle multiple in-progress tasks', async () => {
      fs.mkdirSync('.claude/epics/epic1/updates/123', { recursive: true });
      fs.mkdirSync('.claude/epics/epic1/updates/456', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2/updates/789', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/updates/123/progress.md', 'completion: 25%');
      fs.writeFileSync('.claude/epics/epic1/updates/456/progress.md', 'completion: 50%');
      fs.writeFileSync('.claude/epics/epic2/updates/789/progress.md', 'completion: 100%');

      const tasks = await findInProgressTasks();

      expect(tasks).toHaveLength(3);
      expect(tasks.map(t => t.issueNum).sort()).toEqual(['123', '456', '789']);
    });

    test('should handle missing completion field', async () => {
      fs.mkdirSync('.claude/epics/epic1/updates/123', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/updates/123/progress.md', `status: in-progress
notes: Working on this task`);

      const tasks = await findInProgressTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].completion).toBe('0%');
    });

    test('should handle missing updates directory', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      const tasks = await findInProgressTasks();

      expect(tasks).toHaveLength(0);
    });

    test('should handle missing epics directory', async () => {
      const tasks = await findInProgressTasks();

      expect(tasks).toHaveLength(0);
    });

    test('should handle unreadable progress files gracefully', async () => {
      fs.mkdirSync('.claude/epics/epic1/updates/123', { recursive: true });
      fs.mkdirSync('.claude/epics/epic1/updates/456', { recursive: true });

      // Create readable file
      fs.writeFileSync('.claude/epics/epic1/updates/123/progress.md', 'completion: 50%');

      // Create unreadable file (skip on Windows)
      fs.writeFileSync('.claude/epics/epic1/updates/456/progress.md', 'completion: 75%');
      if (process.platform !== 'win32') {
        fs.chmodSync('.claude/epics/epic1/updates/456/progress.md', 0o000);
      }

      const tasks = await findInProgressTasks();

      // Should still find readable tasks
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].issueNum).toBe('123');

      // Clean up permissions
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync('.claude/epics/epic1/updates/456/progress.md', 0o644);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Available Tasks Detection', () => {
    test('should find available tasks with no dependencies', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Available Task
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskNum).toBe('1');
      expect(tasks[0].name).toBe('Available Task');
      expect(tasks[0].epicName).toBe('epic1');
    });

    test('should respect limit parameter', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      for (let i = 1; i <= 5; i++) {
        fs.writeFileSync(`.claude/epics/epic1/${i}.md`, `name: Task ${i}
status: open
depends_on: []`);
      }

      const tasks = await findAvailableTasks(2);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].taskNum).toBe('1');
      expect(tasks[1].taskNum).toBe('2');
    });

    test('should use default limit of 3', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      for (let i = 1; i <= 5; i++) {
        fs.writeFileSync(`.claude/epics/epic1/${i}.md`, `name: Task ${i}
status: open
depends_on: []`);
      }

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(3);
    });

    test('should exclude tasks with dependencies', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Available Task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/epic1/2.md', `name: Dependent Task
status: open
depends_on: [1]`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Available Task');
    });

    test('should exclude non-open tasks', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Open Task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/epic1/2.md', `name: Closed Task
status: closed
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Open Task');
    });

    test('should handle tasks without status as open', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: No Status Task
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('No Status Task');
    });

    test('should use filename as fallback for missing name', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Unnamed Task');
    });

    test('should break early when limit is reached across epics', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      // Epic1 has 2 available tasks
      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Epic1 Task1
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/epic1/2.md', `name: Epic1 Task2
status: open
depends_on: []`);

      // Epic2 has 2 available tasks
      fs.writeFileSync('.claude/epics/epic2/1.md', `name: Epic2 Task1
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/epic2/2.md', `name: Epic2 Task2
status: open
depends_on: []`);

      const tasks = await findAvailableTasks(3);

      expect(tasks).toHaveLength(3);
      // Should get all of epic1 plus first task of epic2
      expect(tasks.filter(t => t.epicName === 'epic1')).toHaveLength(2);
      expect(tasks.filter(t => t.epicName === 'epic2')).toHaveLength(1);
    });
  });

  describe('Task Statistics Calculation', () => {
    test('should calculate task statistics correctly', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Open Task 1
status: open`);

      fs.writeFileSync('.claude/epics/epic1/2.md', `name: Open Task 2
status: open`);

      fs.writeFileSync('.claude/epics/epic1/3.md', `name: Closed Task
status: closed`);

      const stats = await calculateTaskStats();

      expect(stats.totalTasks).toBe(3);
      expect(stats.openTasks).toBe(2);
      expect(stats.closedTasks).toBe(1);
    });

    test('should count tasks without status as open', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: No Status Task`);

      const stats = await calculateTaskStats();

      expect(stats.totalTasks).toBe(1);
      expect(stats.openTasks).toBe(1);
      expect(stats.closedTasks).toBe(0);
    });

    test('should handle unreadable task files', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', 'name: Readable Task\nstatus: open');
      fs.writeFileSync('.claude/epics/epic1/2.md', 'name: Unreadable Task\nstatus: closed');

      // Make second file unreadable (skip on Windows)
      if (process.platform !== 'win32') {
        fs.chmodSync('.claude/epics/epic1/2.md', 0o000);
      }

      const stats = await calculateTaskStats();

      expect(stats.totalTasks).toBe(2);
      expect(stats.openTasks).toBe(2); // Both readable and unreadable counted as open
      expect(stats.closedTasks).toBe(0);

      // Clean up permissions
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync('.claude/epics/epic1/2.md', 0o644);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    test('should handle missing epics directory', async () => {
      const stats = await calculateTaskStats();

      expect(stats.totalTasks).toBe(0);
      expect(stats.openTasks).toBe(0);
      expect(stats.closedTasks).toBe(0);
    });

    test('should only count numeric task files', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/epic1/epic.md', 'name: Epic Description');
      fs.writeFileSync('.claude/epics/epic1/readme.md', 'name: Readme');

      const stats = await calculateTaskStats();

      expect(stats.totalTasks).toBe(1);
      expect(stats.openTasks).toBe(1);
    });
  });

  describe('Standup Output Integration', () => {
    test('should include in-progress tasks in output', async () => {
      fs.mkdirSync('.claude/epics/epic1/updates/123', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/updates/123/progress.md', 'completion: 50%');

      const result = await standup();

      expect(result.inProgress).toHaveLength(1);
      expect(result.messages.some(m => m.includes('Issue #123 (epic1) - 50% complete'))).toBe(true);
    });

    test('should include next available tasks in output', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Available Task
status: open
depends_on: []`);

      const result = await standup();

      expect(result.nextTasks).toHaveLength(1);
      expect(result.messages.some(m => m.includes('#1 - Available Task'))).toBe(true);
    });

    test('should include task statistics in output', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', 'status: open');
      fs.writeFileSync('.claude/epics/epic1/2.md', 'status: closed');

      const result = await standup();

      expect(result.stats.totalTasks).toBe(2);
      expect(result.stats.openTasks).toBe(1);
      expect(result.stats.closedTasks).toBe(1);

      const statsMessage = result.messages.find(m => m.includes('Tasks:'));
      expect(statsMessage).toBeDefined();
      expect(statsMessage).toContain('1 open');
      expect(statsMessage).toContain('1 closed');
      expect(statsMessage).toContain('2 total');
    });

    test('should handle errors gracefully and show fallback stats', async () => {
      // Create unreadable epics directory (skip on Windows)
      if (process.platform !== 'win32') {
        fs.mkdirSync('.claude/epics', { recursive: true });
        fs.chmodSync('.claude/epics', 0o000);

        const result = await standup();

        expect(result.messages.some(m => m.includes('0 open,        0 closed,        0 total'))).toBe(true);

        // Clean up permissions
        try {
          fs.chmodSync('.claude/epics', 0o755);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle completely empty project', async () => {
      const result = await standup();

      expect(result.date).toBe('2024-01-15');
      expect(result.activity.prdCount).toBe(0);
      expect(result.inProgress).toHaveLength(0);
      expect(result.nextTasks).toHaveLength(0);
      expect(result.stats.totalTasks).toBe(0);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    test('should handle corrupted or binary files gracefully', async () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      // Create binary file
      fs.writeFileSync('.claude/prds/binary.md', Buffer.from([0x00, 0x01, 0x02]));
      fs.writeFileSync('.claude/prds/text.md', 'name: Valid PRD');

      expect(async () => await standup()).not.toThrow();

      const result = await standup();
      expect(result.activity.prdCount).toBeGreaterThan(0);
    });

    test('should handle very large directory structures efficiently', async () => {
      // Create 10 epics with 10 tasks each
      for (let epic = 1; epic <= 10; epic++) {
        fs.mkdirSync(`.claude/epics/epic-${epic}`, { recursive: true });
        for (let task = 1; task <= 10; task++) {
          fs.writeFileSync(`.claude/epics/epic-${epic}/${task}.md`, `name: Task ${task}\nstatus: open`);
        }
      }

      const startTime = Date.now();
      const result = await standup();
      const endTime = Date.now();

      expect(result.stats.totalTasks).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('Date and Time Handling', () => {
    test('should use current date in ISO format', async () => {
      const result = await standup();

      expect(result.date).toBe('2024-01-15');
      expect(result.messages[0]).toContain('2024-01-15');
    });

    test('should properly calculate 24-hour time window', async () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      // Create file with modification time exactly 24 hours ago
      const exactlyOneDayAgo = '.claude/prds/exactly-one-day.md';
      fs.writeFileSync(exactlyOneDayAgo, 'content');

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      fs.utimesSync(exactlyOneDayAgo, oneDayAgo, oneDayAgo);

      // Create file with modification time just under 24 hours ago
      const justUnderOneDay = '.claude/prds/just-under-day.md';
      fs.writeFileSync(justUnderOneDay, 'content');

      const justUnder = new Date(Date.now() - (24 * 60 * 60 * 1000 - 1000)); // 23h 59m 59s ago
      fs.utimesSync(justUnderOneDay, justUnder, justUnder);

      const files = await findRecentFiles('.claude');

      // File from just under 24 hours ago should be included
      expect(files.some(f => f.includes('just-under-day.md'))).toBe(true);

      // File from exactly 24 hours ago should be excluded
      expect(files.some(f => f.includes('exactly-one-day.md'))).toBe(false);
    });
  });

  describe('CLI Integration Simulation', () => {
    test('should work with CLI execution pattern', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: CLI Test Task\nstatus: open');

      const result = await standup();

      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages[0]).toContain('📅 Daily Standup');
    });

    test('should maintain module export structure for CLI', () => {
      const moduleExports = require('../../autopm/.claude/scripts/pm/standup.js');

      expect(typeof moduleExports.standup).toBe('function');
      expect(typeof moduleExports.findRecentFiles).toBe('function');
      expect(typeof moduleExports.findInProgressTasks).toBe('function');
      expect(typeof moduleExports.findAvailableTasks).toBe('function');
      expect(typeof moduleExports.calculateTaskStats).toBe('function');
    });
  });

  describe('Performance and Concurrency', () => {
    test('should handle concurrent standup calls gracefully', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Concurrent Task\nstatus: open');

      // Run multiple standup calls simultaneously
      const promises = Array(3).fill().map(() => standup());

      const results = await Promise.all(promises);

      // All results should be consistent
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.date).toBe('2024-01-15');
        expect(result.stats.totalTasks).toBe(1);
      });
    });

    test('should handle file system race conditions', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Race Test\nstatus: open');

      // Simulate concurrent access to the same data
      const taskPromises = Array(5).fill().map(() => calculateTaskStats());
      const recentPromises = Array(5).fill().map(() => findRecentFiles('.claude'));

      const [taskResults, recentResults] = await Promise.all([
        Promise.all(taskPromises),
        Promise.all(recentPromises)
      ]);

      // All should return consistent results
      taskResults.forEach(stats => {
        expect(stats.totalTasks).toBe(1);
      });

      recentResults.forEach(files => {
        expect(Array.isArray(files)).toBe(true);
      });
    });
  });
});