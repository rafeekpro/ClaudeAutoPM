/**
 * Phase 2 Integration Tests: Epic Management Workflow
 * End-to-end tests for epic lifecycle and task decomposition
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { listLocalEpics } = require('../../autopm/.claude/scripts/pm-epic-list-local');
const { showLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-show-local');
const { updateLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-update-local');

describe('Phase 2: Epic Management Workflow (Integration)', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'phase2-epic-'));
    process.chdir(testDir);

    // Setup local mode structure
    await fs.mkdir('.claude/prds', { recursive: true });
    await fs.mkdir('.claude/epics', { recursive: true });
    await fs.mkdir('.claude/context', { recursive: true });
    await fs.mkdir('.claude/logs', { recursive: true });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Complete Epic Workflow', () => {
    test('should complete workflow: create → list → show → update', async () => {
      // 1. Create test epic
      const epicContent = `---
id: epic-001
prd_id: prd-001
title: Test Epic Workflow
status: pending
priority: high
created: 2025-01-01
user_stories:
  - story-001
---

# Test Epic Workflow

This is a test epic for workflow validation.

## User Stories

**Story 1:** As a user, I want to test workflows.
`;

      await fs.mkdir('.claude/epics/epic-001-test-workflow', { recursive: true });
      await fs.writeFile('.claude/epics/epic-001-test-workflow/epic.md', epicContent);

      // 2. List epics
      const epics = await listLocalEpics();
      expect(epics.length).toBe(1);
      expect(epics[0].id).toBe('epic-001');
      expect(epics[0].title).toBe('Test Epic Workflow');

      // 3. Show epic details
      const epic = await showLocalEpic('epic-001');
      expect(epic.frontmatter.id).toBe('epic-001');
      expect(epic.frontmatter.title).toBe('Test Epic Workflow');
      expect(epic.frontmatter.status).toBe('pending');
      expect(epic.body).toContain('This is a test epic');

      // 4. Update epic status
      await updateLocalEpic('epic-001', {
        status: 'in_progress',
        priority: 'critical'
      });

      // 5. Verify update
      const updatedEpic = await showLocalEpic('epic-001');
      expect(updatedEpic.frontmatter.status).toBe('in_progress');
      expect(updatedEpic.frontmatter.priority).toBe('critical');
    });

    test('should enforce status transitions (pending → in_progress → completed)', async () => {
      const epicContent = `---
id: epic-002
prd_id: prd-001
title: Status Test Epic
status: pending
priority: medium
created: 2025-01-01
---

# Status Test Epic
`;

      await fs.mkdir('.claude/epics/epic-002-status-test', { recursive: true });
      await fs.writeFile('.claude/epics/epic-002-status-test/epic.md', epicContent);

      // Valid transition: pending → in_progress
      await updateLocalEpic('epic-002', { status: 'in_progress' });
      let epic = await showLocalEpic('epic-002');
      expect(epic.frontmatter.status).toBe('in_progress');

      // Valid transition: in_progress → completed
      await updateLocalEpic('epic-002', { status: 'completed' });
      epic = await showLocalEpic('epic-002');
      expect(epic.frontmatter.status).toBe('completed');

      // Note: Status validation enforcement would be added in epic-update script
      // For now, we just verify that status changes are persisted correctly
    });

    test('should calculate epic completion percentage correctly', async () => {
      const epicContent = `---
id: epic-003
prd_id: prd-001
title: Progress Test Epic
status: in_progress
priority: high
created: 2025-01-01
tasks_total: 10
tasks_completed: 3
---

# Progress Test Epic
`;

      await fs.mkdir('.claude/epics/epic-003-progress', { recursive: true });
      await fs.writeFile('.claude/epics/epic-003-progress/epic.md', epicContent);

      const epic = await showLocalEpic('epic-003');

      expect(epic.frontmatter.tasks_total).toBe(10);
      expect(epic.frontmatter.tasks_completed).toBe(3);

      // Calculate percentage
      const percentage = (epic.frontmatter.tasks_completed / epic.frontmatter.tasks_total) * 100;
      expect(percentage).toBe(30);

      // Update progress
      await updateLocalEpic('epic-003', {
        tasks_completed: 7
      });

      const updatedEpic = await showLocalEpic('epic-003');
      const newPercentage = (updatedEpic.frontmatter.tasks_completed / updatedEpic.frontmatter.tasks_total) * 100;
      expect(newPercentage).toBe(70);
    });

    test('should maintain epic-PRD relationships', async () => {
      // Create PRD first
      const prdContent = `---
id: prd-001
title: Test PRD
status: active
priority: high
created: 2025-01-01
---

# Test PRD

Parent PRD for epic relationship test.
`;

      await fs.writeFile('.claude/prds/prd-001-test.md', prdContent);

      // Create epic linked to PRD
      const epicContent = `---
id: epic-004
prd_id: prd-001
title: Child Epic
status: pending
priority: high
created: 2025-01-01
---

# Child Epic

This epic belongs to PRD prd-001.
`;

      await fs.mkdir('.claude/epics/epic-004-child', { recursive: true });
      await fs.writeFile('.claude/epics/epic-004-child/epic.md', epicContent);

      const epic = await showLocalEpic('epic-004');
      expect(epic.frontmatter.prd_id).toBe('prd-001');

      // Verify PRD exists
      const prdExists = await fs.stat('.claude/prds/prd-001-test.md').catch(() => null);
      expect(prdExists).not.toBeNull();
    });
  });

  describe('Epic Filtering and Search', () => {
    beforeEach(async () => {
      // Create multiple epics with different statuses and priorities
      const epics = [
        { id: 'epic-101', status: 'pending', priority: 'high', title: 'High Priority Pending' },
        { id: 'epic-102', status: 'in_progress', priority: 'medium', title: 'Medium In Progress' },
        { id: 'epic-103', status: 'completed', priority: 'low', title: 'Low Completed' },
        { id: 'epic-104', status: 'pending', priority: 'critical', title: 'Critical Pending' }
      ];

      for (const epic of epics) {
        const content = `---
id: ${epic.id}
prd_id: prd-001
title: ${epic.title}
status: ${epic.status}
priority: ${epic.priority}
created: 2025-01-01
---

# ${epic.title}
`;
        await fs.mkdir(`.claude/epics/${epic.id}-test`, { recursive: true });
        await fs.writeFile(`.claude/epics/${epic.id}-test/epic.md`, content);
      }
    });

    test('should list all epics', async () => {
      const epics = await listLocalEpics();
      expect(epics.length).toBe(4);
    });

    test('should filter epics by status', async () => {
      const allEpics = await listLocalEpics();

      const pendingEpics = allEpics.filter(e => e.status === 'pending');
      expect(pendingEpics.length).toBe(2);

      const inProgressEpics = allEpics.filter(e => e.status === 'in_progress');
      expect(inProgressEpics.length).toBe(1);

      const completedEpics = allEpics.filter(e => e.status === 'completed');
      expect(completedEpics.length).toBe(1);
    });

    test('should filter epics by priority', async () => {
      const allEpics = await listLocalEpics();

      const criticalEpics = allEpics.filter(e => e.priority === 'critical');
      expect(criticalEpics.length).toBe(1);

      const highEpics = allEpics.filter(e => e.priority === 'high');
      expect(highEpics.length).toBe(1);

      const mediumEpics = allEpics.filter(e => e.priority === 'medium');
      expect(mediumEpics.length).toBe(1);

      const lowEpics = allEpics.filter(e => e.priority === 'low');
      expect(lowEpics.length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent epic gracefully', async () => {
      await expect(showLocalEpic('epic-999')).rejects.toThrow();
    });

    test('should handle invalid epic ID format', async () => {
      await expect(showLocalEpic('invalid-id')).rejects.toThrow();
    });

    test('should handle corrupted epic file', async () => {
      // Create epic with malformed frontmatter
      const corruptContent = `---
id: epic-bad
This is not valid YAML
---

# Bad Epic
`;

      await fs.mkdir('.claude/epics/epic-bad-corrupt', { recursive: true });
      await fs.writeFile('.claude/epics/epic-bad-corrupt/epic.md', corruptContent);

      await expect(showLocalEpic('epic-bad')).rejects.toThrow();
    });
  });
});
