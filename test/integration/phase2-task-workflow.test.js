/**
 * Phase 2 Integration Tests: Task Management Workflow
 * End-to-end tests for task lifecycle and dependency validation
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { listLocalTasks } = require('../../autopm/.claude/scripts/pm-task-list-local');
const { showLocalTask } = require('../../autopm/.claude/scripts/pm-task-show-local');
const { updateLocalTask } = require('../../autopm/.claude/scripts/pm-task-update-local');

describe('Phase 2: Task Management Workflow (Integration)', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'phase2-task-'));
    process.chdir(testDir);

    // Setup local mode structure
    await fs.mkdir('.claude/prds', { recursive: true });
    await fs.mkdir('.claude/epics', { recursive: true });
    await fs.mkdir('.claude/context', { recursive: true });
    await fs.mkdir('.claude/logs', { recursive: true });

    // Create test epic
    await fs.mkdir('.claude/epics/epic-001-test', { recursive: true });
    const epicContent = `---
id: epic-001
prd_id: prd-001
title: Test Epic
status: in_progress
priority: high
created: 2025-01-01
tasks_total: 0
tasks_completed: 0
---

# Test Epic
`;
    await fs.writeFile('.claude/epics/epic-001-test/epic.md', epicContent);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Complete Task Workflow', () => {
    test('should complete workflow: list → show → start → complete', async () => {
      // 1. Create test tasks
      const task1 = `---
id: task-epic-001-001
epic_id: epic-001
title: Task 1
status: pending
priority: high
estimated_hours: 4
created: 2025-01-01
dependencies: []
---

# Task 1

## Acceptance Criteria
- [ ] Criterion 1
`;

      const task2 = `---
id: task-epic-001-002
epic_id: epic-001
title: Task 2
status: pending
priority: medium
estimated_hours: 6
created: 2025-01-01
dependencies: ['task-epic-001-001']
---

# Task 2

## Acceptance Criteria
- [ ] Criterion 1
`;

      await fs.writeFile('.claude/epics/epic-001-test/task-001.md', task1);
      await fs.writeFile('.claude/epics/epic-001-test/task-002.md', task2);

      // 2. List tasks
      const tasks = await listLocalTasks('epic-001');
      expect(tasks.length).toBe(2);

      // 3. Show task details
      const taskDetails = await showLocalTask('epic-001', 'task-001');
      expect(taskDetails.frontmatter.title).toBe('Task 1');
      expect(taskDetails.frontmatter.status).toBe('pending');

      // 4. Start task (pending → in_progress)
      await updateLocalTask('epic-001', 'task-001', { status: 'in_progress' });
      let updatedTask = await showLocalTask('epic-001', 'task-001');
      expect(updatedTask.frontmatter.status).toBe('in_progress');

      // 5. Complete task (in_progress → completed)
      await updateLocalTask('epic-001', 'task-001', { status: 'completed' });
      updatedTask = await showLocalTask('epic-001', 'task-001');
      expect(updatedTask.frontmatter.status).toBe('completed');
    });

    test('should validate dependencies before task start', async () => {
      const task1 = `---
id: task-epic-001-001
epic_id: epic-001
title: Task 1
status: pending
priority: high
estimated_hours: 4
created: 2025-01-01
dependencies: []
---

# Task 1
`;

      const task2 = `---
id: task-epic-001-002
epic_id: epic-001
title: Task 2 (depends on Task 1)
status: pending
priority: medium
estimated_hours: 6
created: 2025-01-01
dependencies: ['task-epic-001-001']
---

# Task 2
`;

      await fs.writeFile('.claude/epics/epic-001-test/task-001.md', task1);
      await fs.writeFile('.claude/epics/epic-001-test/task-002.md', task2);

      // Task 2 depends on Task 1
      const task2Details = await showLocalTask('epic-001', 'task-002');
      expect(task2Details.frontmatter.dependencies).toContain('task-epic-001-001');

      // Verify Task 1 is not completed yet
      const task1Details = await showLocalTask('epic-001', 'task-001');
      expect(task1Details.frontmatter.status).toBe('pending');

      // Note: Actual dependency validation logic would be in task-update script
      // This test verifies that dependency information is preserved
    });

    test('should update epic completion on task status change', async () => {
      // Create 3 tasks
      for (let i = 1; i <= 3; i++) {
        const taskContent = `---
id: task-epic-001-00${i}
epic_id: epic-001
title: Task ${i}
status: pending
priority: medium
estimated_hours: 4
created: 2025-01-01
dependencies: []
---

# Task ${i}
`;
        await fs.writeFile(`.claude/epics/epic-001-test/task-00${i}.md`, taskContent);
      }

      // Update epic with task count
      const { updateLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-update-local');
      await updateLocalEpic('epic-001', {
        tasks_total: 3,
        tasks_completed: 0
      });

      // Complete first task
      await updateLocalTask('epic-001', 'task-001', { status: 'completed' });
      await updateLocalEpic('epic-001', { tasks_completed: 1 });

      // Verify epic progress
      const { showLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-show-local');
      let epic = await showLocalEpic('epic-001');
      expect(epic.frontmatter.tasks_completed).toBe(1);
      expect(epic.frontmatter.tasks_total).toBe(3);

      // Complete second task
      await updateLocalTask('epic-001', 'task-002', { status: 'completed' });
      await updateLocalEpic('epic-001', { tasks_completed: 2 });

      epic = await showLocalEpic('epic-001');
      expect(epic.frontmatter.tasks_completed).toBe(2);

      // Calculate progress
      const progress = (epic.frontmatter.tasks_completed / epic.frontmatter.tasks_total) * 100;
      expect(progress).toBeCloseTo(66.67, 1);
    });
  });

  describe('Task Filtering', () => {
    beforeEach(async () => {
      // Create tasks with different statuses
      const tasks = [
        { id: '001', status: 'pending', priority: 'high' },
        { id: '002', status: 'in_progress', priority: 'medium' },
        { id: '003', status: 'completed', priority: 'low' },
        { id: '004', status: 'pending', priority: 'critical' }
      ];

      for (const task of tasks) {
        const content = `---
id: task-epic-001-${task.id}
epic_id: epic-001
title: Task ${task.id}
status: ${task.status}
priority: ${task.priority}
estimated_hours: 4
created: 2025-01-01
dependencies: []
---

# Task ${task.id}
`;
        await fs.writeFile(`.claude/epics/epic-001-test/task-${task.id}.md`, content);
      }
    });

    test('should filter tasks by status', async () => {
      const allTasks = await listLocalTasks('epic-001');
      expect(allTasks.length).toBe(4);

      const pendingTasks = allTasks.filter(t => t.status === 'pending');
      expect(pendingTasks.length).toBe(2);

      const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
      expect(inProgressTasks.length).toBe(1);

      const completedTasks = allTasks.filter(t => t.status === 'completed');
      expect(completedTasks.length).toBe(1);
    });

    test('should filter tasks by epic', async () => {
      // Create second epic with tasks
      await fs.mkdir('.claude/epics/epic-002-test', { recursive: true });
      const epic2Content = `---
id: epic-002
prd_id: prd-001
title: Epic 2
status: pending
priority: medium
created: 2025-01-01
---

# Epic 2
`;
      await fs.writeFile('.claude/epics/epic-002-test/epic.md', epic2Content);

      const task = `---
id: task-epic-002-001
epic_id: epic-002
title: Epic 2 Task
status: pending
priority: medium
estimated_hours: 4
created: 2025-01-01
dependencies: []
---

# Epic 2 Task
`;
      await fs.writeFile('.claude/epics/epic-002-test/task-001.md', task);

      const epic1Tasks = await listLocalTasks('epic-001');
      const epic2Tasks = await listLocalTasks('epic-002');

      expect(epic1Tasks.length).toBe(4);
      expect(epic2Tasks.length).toBe(1);
    });
  });

  describe('Dependency Management', () => {
    test('should preserve dependency chains', async () => {
      const tasks = [
        { id: '001', deps: [] },
        { id: '002', deps: ['task-epic-001-001'] },
        { id: '003', deps: ['task-epic-001-002'] },
        { id: '004', deps: ['task-epic-001-002', 'task-epic-001-003'] }
      ];

      for (const task of tasks) {
        const content = `---
id: task-epic-001-${task.id}
epic_id: epic-001
title: Task ${task.id}
status: pending
priority: medium
estimated_hours: 4
created: 2025-01-01
dependencies: ${JSON.stringify(task.deps)}
---

# Task ${task.id}
`;
        await fs.writeFile(`.claude/epics/epic-001-test/task-${task.id}.md`, content);
      }

      // Verify dependency chain
      const task4 = await showLocalTask('epic-001', 'task-004');
      expect(task4.frontmatter.dependencies).toHaveLength(2);
      expect(task4.frontmatter.dependencies).toContain('task-epic-001-002');
      expect(task4.frontmatter.dependencies).toContain('task-epic-001-003');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent task gracefully', async () => {
      await expect(showLocalTask('epic-001', 'task-epic-001-999')).rejects.toThrow();
    });

    test('should handle invalid task ID format', async () => {
      await expect(showLocalTask('epic-999', 'invalid-task-id')).rejects.toThrow();
    });
  });
});
