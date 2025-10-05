/**
 * TASK-009: Task Management Tests (TDD Approach)
 *
 * Tests local task management operations (list, show, update).
 * Following strict TDD: Write failing tests FIRST, then implement.
 *
 * Test Coverage Target: >85%
 */

const fs = require('fs').promises;
const path = require('path');
const { listLocalTasks } = require('../../autopm/.claude/scripts/pm-task-list-local');
const { showLocalTask } = require('../../autopm/.claude/scripts/pm-task-show-local');
const { updateLocalTask } = require('../../autopm/.claude/scripts/pm-task-update-local');
const { stringifyFrontmatter } = require('../../autopm/.claude/lib/frontmatter');

describe('TASK-009: Task Management', () => {
  const testDir = path.join(__dirname, 'test-workspace-task-mgmt');
  const epicsDir = path.join(testDir, '.claude', 'epics');

  beforeEach(async () => {
    // Setup test directory structure
    await fs.mkdir(epicsDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Cleanup
    process.chdir(__dirname);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('listLocalTasks()', () => {
    test('should list all tasks for an epic', async () => {
      // Create epic with tasks
      await createTestEpic('epic-001-auth', {
        id: 'epic-001',
        tasks_total: 3
      });

      await createTestTask('epic-001-auth', 'task-001.md', {
        id: 'task-epic-001-001',
        epic_id: 'epic-001',
        title: 'Setup database',
        status: 'completed'
      });

      await createTestTask('epic-001-auth', 'task-002.md', {
        id: 'task-epic-001-002',
        epic_id: 'epic-001',
        title: 'Create API endpoint',
        status: 'in_progress'
      });

      await createTestTask('epic-001-auth', 'task-003.md', {
        id: 'task-epic-001-003',
        epic_id: 'epic-001',
        title: 'Write tests',
        status: 'pending'
      });

      const tasks = await listLocalTasks('epic-001');

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks).toHaveLength(3);
      expect(tasks[0].id).toBe('task-epic-001-001');
      expect(tasks[1].id).toBe('task-epic-001-002');
      expect(tasks[2].id).toBe('task-epic-001-003');
    });

    test('should filter tasks by status', async () => {
      await createTestEpic('epic-001-test', { id: 'epic-001' });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-001',
        status: 'completed'
      });

      await createTestTask('epic-001-test', 'task-002.md', {
        id: 'task-002',
        status: 'in_progress'
      });

      await createTestTask('epic-001-test', 'task-003.md', {
        id: 'task-003',
        status: 'in_progress'
      });

      const inProgress = await listLocalTasks('epic-001', { status: 'in_progress' });
      const completed = await listLocalTasks('epic-001', { status: 'completed' });

      expect(inProgress).toHaveLength(2);
      expect(completed).toHaveLength(1);
    });

    test('should return empty array when epic has no tasks', async () => {
      await createTestEpic('epic-001-empty', { id: 'epic-001' });

      const tasks = await listLocalTasks('epic-001');

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks).toHaveLength(0);
    });

    test('should throw error for non-existent epic', async () => {
      await expect(
        listLocalTasks('epic-999')
      ).rejects.toThrow(/not found/i);
    });

    test('should show dependency information', async () => {
      await createTestEpic('epic-001-test', { id: 'epic-001' });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-001',
        dependencies: []
      });

      await createTestTask('epic-001-test', 'task-002.md', {
        id: 'task-002',
        dependencies: ['task-001']
      });

      const tasks = await listLocalTasks('epic-001');

      expect(tasks[0].dependencies).toEqual([]);
      expect(tasks[1].dependencies).toEqual(['task-001']);
    });
  });

  describe('showLocalTask()', () => {
    test('should display task details with epic context', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        title: 'Authentication Epic'
      });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-epic-001-001',
        epic_id: 'epic-001',
        title: 'Setup database schema',
        status: 'in_progress',
        estimated_hours: 6
      }, '# Setup database schema\n\n## Description\nCreate tables for authentication');

      const task = await showLocalTask('epic-001', 'task-001');

      expect(task.frontmatter.id).toBe('task-epic-001-001');
      expect(task.frontmatter.epic_id).toBe('epic-001');
      expect(task.frontmatter.title).toBe('Setup database schema');
      expect(task.body).toContain('Create tables for authentication');
      expect(task.epicTitle).toBe('Authentication Epic');
    });

    test('should show blocking/blocked tasks', async () => {
      await createTestEpic('epic-001-test', { id: 'epic-001' });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-001',
        dependencies: []
      });

      await createTestTask('epic-001-test', 'task-002.md', {
        id: 'task-002',
        dependencies: ['task-001']
      });

      await createTestTask('epic-001-test', 'task-003.md', {
        id: 'task-003',
        dependencies: ['task-001']
      });

      const task1 = await showLocalTask('epic-001', 'task-001');

      // Task 1 blocks task 2 and 3
      expect(task1.blocking).toEqual(['task-002', 'task-003']);
      expect(task1.blockedBy).toEqual([]);

      const task2 = await showLocalTask('epic-001', 'task-002');

      // Task 2 is blocked by task 1
      expect(task2.blockedBy).toEqual(['task-001']);
    });

    test('should throw error for non-existent task', async () => {
      await createTestEpic('epic-001-test', { id: 'epic-001' });

      await expect(
        showLocalTask('epic-001', 'task-999')
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('updateLocalTask()', () => {
    test('should update task status', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        tasks_total: 1,
        tasks_completed: 0
      });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-001',
        epic_id: 'epic-001',
        status: 'pending'
      });

      await updateLocalTask('epic-001', 'task-001', { status: 'completed' });

      const task = await showLocalTask('epic-001', 'task-001');

      expect(task.frontmatter.status).toBe('completed');
    });

    test('should update epic tasks_completed counter when task completed', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        tasks_total: 2,
        tasks_completed: 0
      });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-001',
        epic_id: 'epic-001',
        status: 'pending'
      });

      await updateLocalTask('epic-001', 'task-001', { status: 'completed' });

      // Read epic to verify counter updated
      const epicPath = path.join(epicsDir, 'epic-001-test', 'epic.md');
      const epicContent = await fs.readFile(epicPath, 'utf8');

      expect(epicContent).toContain('tasks_completed: 1');
    });

    test('should validate dependency constraints', async () => {
      await createTestEpic('epic-001-test', { id: 'epic-001' });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-001',
        status: 'pending',
        dependencies: []
      });

      await createTestTask('epic-001-test', 'task-002.md', {
        id: 'task-002',
        status: 'pending',
        dependencies: ['task-001']
      });

      // Should fail: cannot complete task-002 when task-001 is pending
      await expect(
        updateLocalTask('epic-001', 'task-002', {
          status: 'completed',
          validateDependencies: true
        })
      ).rejects.toThrow(/dependencies not met/i);
    });

    test('should allow updates when dependencies are met', async () => {
      await createTestEpic('epic-001-test', { id: 'epic-001' });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-001',
        status: 'completed',
        dependencies: []
      });

      await createTestTask('epic-001-test', 'task-002.md', {
        id: 'task-002',
        status: 'pending',
        dependencies: ['task-001']
      });

      // Should succeed: task-001 is completed
      await expect(
        updateLocalTask('epic-001', 'task-002', {
          status: 'completed',
          validateDependencies: true
        })
      ).resolves.not.toThrow();
    });

    test('should update multiple fields at once', async () => {
      await createTestEpic('epic-001-test', { id: 'epic-001' });

      await createTestTask('epic-001-test', 'task-001.md', {
        id: 'task-001',
        status: 'pending',
        assignee: null,
        priority: 'medium'
      });

      await updateLocalTask('epic-001', 'task-001', {
        status: 'in_progress',
        assignee: 'john-doe',
        priority: 'high'
      });

      const task = await showLocalTask('epic-001', 'task-001');

      expect(task.frontmatter.status).toBe('in_progress');
      expect(task.frontmatter.assignee).toBe('john-doe');
      expect(task.frontmatter.priority).toBe('high');
    });
  });

  // Helper functions
  async function createTestEpic(dirName, frontmatter, body = '# Epic Content') {
    const epicDir = path.join(epicsDir, dirName);
    await fs.mkdir(epicDir, { recursive: true });

    const epicContent = stringifyFrontmatter(frontmatter, body);
    const epicPath = path.join(epicDir, 'epic.md');

    await fs.writeFile(epicPath, epicContent, 'utf8');
  }

  async function createTestTask(epicDirName, taskFilename, frontmatter, body = '# Task Content') {
    const taskDir = path.join(epicsDir, epicDirName);
    const taskContent = stringifyFrontmatter(frontmatter, body);
    const taskPath = path.join(taskDir, taskFilename);

    await fs.writeFile(taskPath, taskContent, 'utf8');
  }
});
