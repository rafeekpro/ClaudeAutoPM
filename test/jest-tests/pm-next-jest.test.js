/**
 * Jest TDD Tests for PM Next Script (next.js)
 *
 * Comprehensive test suite covering all functionality of the next.js script
 * Target: Improve coverage from ~78% to 85%+
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { next, findAvailableTasks } = require('../../autopm/.claude/scripts/pm/next.js');

describe('PM Next Script - Comprehensive Jest Tests', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create isolated test environment
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-next-jest-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Basic Functionality', () => {
    test('should export required functions', () => {
      expect(typeof next).toBe('function');
      expect(typeof findAvailableTasks).toBe('function');
    });

    test('should return structured data with all required properties', async () => {
      const result = await next();

      expect(result).toHaveProperty('availableTasks');
      expect(result).toHaveProperty('found');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('messages');
      expect(Array.isArray(result.availableTasks)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(typeof result.found).toBe('number');
    });

    test('should return empty results when no epics directory exists', async () => {
      const result = await next();

      expect(result.availableTasks).toHaveLength(0);
      expect(result.found).toBe(0);
      expect(result.suggestions).toHaveLength(2);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    test('should include proper header messages', async () => {
      const result = await next();

      expect(result.messages).toContain('Getting status...');
      expect(result.messages).toContain('📋 Next Available Tasks');
      expect(result.messages).toContain('=======================');
    });

    test('should include summary message with task count', async () => {
      const result = await next();

      const summaryMessage = result.messages.find(msg => msg.includes('📊 Summary:'));
      expect(summaryMessage).toBeDefined();
      expect(summaryMessage).toContain(`${result.found} tasks ready to start`);
    });
  });

  describe('Task Discovery', () => {
    test('should find tasks with no dependencies', async () => {
      // Create epic structure
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: First Task
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].taskNum).toBe('1');
      expect(tasks[0].name).toBe('First Task');
      expect(tasks[0].epicName).toBe('test-epic');
      expect(tasks[0].parallel).toBe(false);
    });

    test('should find tasks with empty dependencies string', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/2.md', `name: Second Task
status: open
depends_on: [ ]`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Second Task');
    });

    test('should find tasks without status field (defaulting to open)', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/3.md', `name: Default Status Task
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Default Status Task');
    });

    test('should find tasks without depends_on field', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/4.md', `name: No Dependencies Task
status: open`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('No Dependencies Task');
    });

    test('should extract parallel flag correctly', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/5.md', `name: Parallel Task
status: open
parallel: true
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/6.md', `name: Sequential Task
status: open
parallel: false
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(2);

      const parallelTask = tasks.find(t => t.name === 'Parallel Task');
      const sequentialTask = tasks.find(t => t.name === 'Sequential Task');

      expect(parallelTask.parallel).toBe(true);
      expect(sequentialTask.parallel).toBe(false);
    });

    test('should use filename as fallback for missing name', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/7.md', `status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Unnamed Task');
    });

    test('should only process .md files with numeric prefixes', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      // Valid files
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/10.md', 'name: Task 10\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/100-feature.md', 'name: Task 100\nstatus: open');

      // Invalid files
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'name: Epic Description');
      fs.writeFileSync('.claude/epics/test-epic/readme.md', 'name: Readme');
      fs.writeFileSync('.claude/epics/test-epic/task.txt', 'name: Text Task');

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(3);
      expect(tasks.map(t => t.taskNum).sort()).toEqual(['1', '10', '100-feature']);
    });

    test('should sort task files correctly', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      // Create tasks in random order
      fs.writeFileSync('.claude/epics/test-epic/3.md', 'name: Task 3\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/1.md', 'name: Task 1\nstatus: open');
      fs.writeFileSync('.claude/epics/test-epic/2.md', 'name: Task 2\nstatus: open');

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(3);
      expect(tasks.map(t => t.taskNum)).toEqual(['1', '2', '3']);
    });
  });

  describe('Task Filtering', () => {
    test('should exclude closed tasks', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Open Task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/2.md', `name: Closed Task
status: closed
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Open Task');
    });

    test('should exclude tasks with different statuses', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Open Task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/2.md', `name: In Progress Task
status: in-progress
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/3.md', `name: Done Task
status: done
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/4.md', `name: Blocked Task
status: blocked
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Open Task');
    });

    test('should exclude tasks with dependencies', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Available Task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/2.md', `name: Dependent Task
status: open
depends_on: [1]`);

      fs.writeFileSync('.claude/epics/test-epic/3.md', `name: Multi Dependent Task
status: open
depends_on: [1, 2]`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Available Task');
    });

    test('should exclude tasks with non-empty dependency strings', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Available Task
status: open
depends_on: [ ]`);

      fs.writeFileSync('.claude/epics/test-epic/2.md', `name: Dependent Task
status: open
depends_on: [ 1 ]`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Available Task');
    });
  });

  describe('Multiple Epics Support', () => {
    test('should find tasks across multiple epics', async () => {
      // Create multiple epics
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Epic1 Task1
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/epic2/1.md', `name: Epic2 Task1
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.epicName).sort()).toEqual(['epic1', 'epic2']);
      expect(tasks.map(t => t.name).sort()).toEqual(['Epic1 Task1', 'Epic2 Task1']);
    });

    test('should find tasks in nested multi-epic structure (1 level deep)', async () => {
      // Create multi-epic structure with parent directory
      fs.mkdirSync('.claude/epics/ecommerce-platform/01-infrastructure', { recursive: true });
      fs.mkdirSync('.claude/epics/ecommerce-platform/02-auth-backend', { recursive: true });

      // Add epic.md to identify as epic directories
      fs.writeFileSync('.claude/epics/ecommerce-platform/01-infrastructure/epic.md', 'Epic: Infrastructure');
      fs.writeFileSync('.claude/epics/ecommerce-platform/02-auth-backend/epic.md', 'Epic: Auth Backend');

      // Add tasks
      fs.writeFileSync('.claude/epics/ecommerce-platform/01-infrastructure/1.md', `name: Setup VPC
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/ecommerce-platform/02-auth-backend/1.md', `name: Create user model
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.epicName).sort()).toEqual([
        'ecommerce-platform/01-infrastructure',
        'ecommerce-platform/02-auth-backend'
      ]);
      expect(tasks.map(t => t.name).sort()).toEqual(['Create user model', 'Setup VPC']);
    });

    test('should find tasks in nested multi-epic structure (2 levels deep)', async () => {
      // Create deeper nested structure
      fs.mkdirSync('.claude/epics/platform/backend/auth', { recursive: true });
      fs.mkdirSync('.claude/epics/platform/backend/api', { recursive: true });

      // Add epic.md to identify as epic directories
      fs.writeFileSync('.claude/epics/platform/backend/auth/epic.md', 'Epic: Auth');
      fs.writeFileSync('.claude/epics/platform/backend/api/epic.md', 'Epic: API');

      // Add tasks
      fs.writeFileSync('.claude/epics/platform/backend/auth/1.md', `name: Auth task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/platform/backend/api/1.md', `name: API task
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.epicName).sort()).toEqual([
        'platform/backend/api',
        'platform/backend/auth'
      ]);
    });

    test('should handle mixed flat and nested epic structures', async () => {
      // Flat epic
      fs.mkdirSync('.claude/epics/simple-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/simple-epic/1.md', `name: Simple task
status: open
depends_on: []`);

      // Nested epic
      fs.mkdirSync('.claude/epics/complex/sub-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/complex/sub-epic/epic.md', 'Epic: Sub Epic');
      fs.writeFileSync('.claude/epics/complex/sub-epic/1.md', `name: Nested task
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.epicName).sort()).toEqual([
        'complex/sub-epic',
        'simple-epic'
      ]);
    });

    test('should respect depth limit to prevent infinite recursion', async () => {
      // Create very deep nesting (5 levels: a/b/c/d/e - exceeds max depth of 3)
      fs.mkdirSync('.claude/epics/a/b/c/d/e', { recursive: true });
      fs.writeFileSync('.claude/epics/a/b/c/d/e/epic.md', 'Epic: Too Deep');
      fs.writeFileSync('.claude/epics/a/b/c/d/e/1.md', `name: Deep task
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      // Should not find tasks beyond depth limit (3 levels from first non-epic parent)
      expect(tasks).toHaveLength(0);
    });

    test('should handle case-insensitive status matching', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Open Task
status: Open
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/2.md', `name: OPEN Task
status: OPEN
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/3.md', `name: open Task
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(3);
      expect(tasks.map(t => t.name).sort()).toEqual(['OPEN Task', 'Open Task', 'open Task']);
    });

    test('should handle mix of available and unavailable tasks across epics', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      // Epic1: one available, one blocked
      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Epic1 Available
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/epic1/2.md', `name: Epic1 Blocked
status: open
depends_on: [1]`);

      // Epic2: one available
      fs.writeFileSync('.claude/epics/epic2/1.md', `name: Epic2 Available
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.name).sort()).toEqual(['Epic1 Available', 'Epic2 Available']);
    });

    test('should handle epics with no valid tasks', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/empty-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: Available Task
status: open
depends_on: []`);

      // Empty epic or epic with non-task files
      fs.writeFileSync('.claude/epics/empty-epic/readme.md', 'Epic description');

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].epicName).toBe('epic1');
    });
  });

  describe('Output Generation', () => {
    test('should include task details in messages when tasks are found', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Test Task
status: open
parallel: true
depends_on: []`);

      const result = await next();

      expect(result.found).toBe(1);
      expect(result.suggestions).toHaveLength(0);

      // Check for task details in messages
      const taskMessage = result.messages.find(msg => msg.includes('✅ Ready: #1 - Test Task'));
      expect(taskMessage).toBeDefined();

      const epicMessage = result.messages.find(msg => msg.includes('Epic: test-epic'));
      expect(epicMessage).toBeDefined();

      const parallelMessage = result.messages.find(msg => msg.includes('🔄 Can run in parallel'));
      expect(parallelMessage).toBeDefined();
    });

    test('should show suggestions when no tasks are found', async () => {
      const result = await next();

      expect(result.found).toBe(0);
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions).toContain('Check blocked tasks: /pm:blocked');
      expect(result.suggestions).toContain('View all tasks: /pm:epic-list');

      const noTasksMessage = result.messages.find(msg => msg.includes('No available tasks found'));
      expect(noTasksMessage).toBeDefined();

      const suggestionsHeader = result.messages.find(msg => msg.includes('💡 Suggestions:'));
      expect(suggestionsHeader).toBeDefined();
    });

    test('should not show parallel flag for sequential tasks', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Sequential Task
status: open
parallel: false
depends_on: []`);

      const result = await next();

      const parallelMessage = result.messages.find(msg => msg.includes('🔄 Can run in parallel'));
      expect(parallelMessage).toBeUndefined();
    });

    test('should format multiple tasks correctly', async () => {
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      fs.writeFileSync('.claude/epics/epic1/1.md', `name: First Task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/epic2/2.md', `name: Second Task
status: open
parallel: true
depends_on: []`);

      const result = await next();

      expect(result.found).toBe(2);

      // Check both tasks are mentioned
      const task1Message = result.messages.find(msg => msg.includes('✅ Ready: #1 - First Task'));
      const task2Message = result.messages.find(msg => msg.includes('✅ Ready: #2 - Second Task'));
      expect(task1Message).toBeDefined();
      expect(task2Message).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing epics directory gracefully', async () => {
      // Don't create .claude/epics directory
      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(0);
    });

    test('should handle unreadable epic directories gracefully', async () => {
      fs.mkdirSync('.claude/epics/readable-epic', { recursive: true });
      fs.mkdirSync('.claude/epics/unreadable-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/readable-epic/1.md', `name: Readable Task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/unreadable-epic/1.md', `name: Unreadable Task
status: open
depends_on: []`);

      // Make epic directory unreadable (skip on Windows)
      if (process.platform !== 'win32') {
        fs.chmodSync('.claude/epics/unreadable-epic', 0o000);
      }

      const tasks = await findAvailableTasks();

      // Should still find readable tasks
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].name).toBe('Readable Task');

      // Clean up permissions
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync('.claude/epics/unreadable-epic', 0o755);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    test('should handle unreadable task files gracefully', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Readable Task
status: open
depends_on: []`);

      fs.writeFileSync('.claude/epics/test-epic/2.md', 'name: Unreadable Task');

      // Make task file unreadable (skip on Windows)
      if (process.platform !== 'win32') {
        fs.chmodSync('.claude/epics/test-epic/2.md', 0o000);
      }

      const tasks = await findAvailableTasks();

      // Should still find readable tasks
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].name).toBe('Readable Task');

      // Clean up permissions
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync('.claude/epics/test-epic/2.md', 0o644);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    test('should handle corrupted task files gracefully', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      // Valid task
      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Valid Task
status: open
depends_on: []`);

      // Corrupted binary file
      fs.writeFileSync('.claude/epics/test-epic/2.md', Buffer.from([0x00, 0x01, 0x02]));

      const tasks = await findAvailableTasks();

      // Should still find valid tasks
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].name).toBe('Valid Task');
    });

    test('should handle errors in next() function gracefully', async () => {
      // This should not throw even with no epics
      expect(async () => await next()).not.toThrow();

      const result = await next();
      expect(result).toBeDefined();
      expect(result.found).toBe(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should handle non-directory files in epics folder', async () => {
      fs.mkdirSync('.claude/epics', { recursive: true });

      // Create a file instead of directory
      fs.writeFileSync('.claude/epics/not-a-directory.txt', 'This is not an epic directory');

      // Create a valid epic
      fs.mkdirSync('.claude/epics/valid-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/valid-epic/1.md', `name: Valid Task
status: open
depends_on: []`);

      const tasks = await findAvailableTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Valid Task');
    });
  });

  describe('Integration Tests', () => {
    test('should handle realistic epic structure', async () => {
      // Create a realistic project structure
      fs.mkdirSync('.claude/epics/user-auth', { recursive: true });
      fs.mkdirSync('.claude/epics/api-development', { recursive: true });

      // User auth epic
      fs.writeFileSync('.claude/epics/user-auth/1.md', `name: Setup authentication framework
status: open
parallel: false
depends_on: []`);

      fs.writeFileSync('.claude/epics/user-auth/2.md', `name: Implement login API
status: open
parallel: false
depends_on: [1]`);

      fs.writeFileSync('.claude/epics/user-auth/3.md', `name: Add password reset
status: open
parallel: true
depends_on: [1]`);

      // API development epic
      fs.writeFileSync('.claude/epics/api-development/1.md', `name: Design API schema
status: open
parallel: false
depends_on: []`);

      fs.writeFileSync('.claude/epics/api-development/2.md', `name: Implement user endpoints
status: open
parallel: false
depends_on: [1]`);

      const result = await next();

      expect(result.found).toBe(2); // Tasks 1 from both epics only (task 3 has dependency)
      expect(result.availableTasks.map(t => t.name).sort()).toEqual([
        'Design API schema',
        'Setup authentication framework'
      ]);
    });

    test('should maintain consistent results across multiple calls', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Consistent Task
status: open
depends_on: []`);

      const result1 = await next();
      const result2 = await next();

      expect(result1.found).toBe(result2.found);
      expect(result1.availableTasks).toEqual(result2.availableTasks);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of epics efficiently', async () => {
      // Create 20 epics with 5 tasks each
      for (let epic = 1; epic <= 20; epic++) {
        fs.mkdirSync(`.claude/epics/epic-${epic}`, { recursive: true });

        for (let task = 1; task <= 5; task++) {
          const isAvailable = task === 1; // Only first task is available
          fs.writeFileSync(`.claude/epics/epic-${epic}/${task}.md`, `name: Epic${epic} Task${task}
status: open
depends_on: ${isAvailable ? '[]' : '[' + (task - 1) + ']'}`);
        }
      }

      const startTime = Date.now();
      const result = await next();
      const endTime = Date.now();

      expect(result.found).toBe(20); // One available task per epic
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });

    test('should handle concurrent access gracefully', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: Concurrent Task
status: open
depends_on: []`);

      // Run multiple next() calls simultaneously
      const promises = Array(5).fill().map(() => next());

      const results = await Promise.all(promises);

      // All results should be consistent
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.found).toBe(1);
        expect(result.availableTasks[0].name).toBe('Concurrent Task');
      });
    });
  });

  describe('CLI Integration Simulation', () => {
    test('should work with CLI execution pattern', async () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
      fs.writeFileSync('.claude/epics/test-epic/1.md', `name: CLI Test Task
status: open
depends_on: []`);

      const result = await next();

      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages[0]).toBe('Getting status...');
    });

    test('should maintain module export structure for CLI', () => {
      const moduleExports = require('../../autopm/.claude/scripts/pm/next.js');

      expect(typeof moduleExports.next).toBe('function');
      expect(typeof moduleExports.findAvailableTasks).toBe('function');
    });
  });
});