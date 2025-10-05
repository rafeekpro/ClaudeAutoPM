/**
 * TASK-007: Epic Management Tests (TDD Approach)
 *
 * Following strict TDD methodology:
 * 1. RED: Write failing tests first
 * 2. GREEN: Implement minimal code to pass
 * 3. REFACTOR: Optimize while keeping tests green
 *
 * Test Coverage Target: >85%
 */

const fs = require('fs').promises;
const path = require('path');
const { listLocalEpics } = require('../../autopm/.claude/scripts/pm-epic-list-local');
const { showLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-show-local');
const { updateLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-update-local');
const { parseFrontmatter, stringifyFrontmatter } = require('../../autopm/.claude/lib/frontmatter');

describe('TASK-007: Epic Management', () => {
  const testDir = path.join(__dirname, 'test-workspace-epic-mgmt');
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

  describe('listLocalEpics()', () => {
    test('should list all epics from .claude/epics/', async () => {
      // Create test epics
      await createTestEpic('epic-001-authentication', {
        id: 'epic-001',
        prd_id: 'prd-001',
        title: 'User Authentication',
        status: 'in_progress',
        tasks_total: 5,
        tasks_completed: 2,
        created: '2025-10-05'
      });

      await createTestEpic('epic-002-dashboard', {
        id: 'epic-002',
        prd_id: 'prd-001',
        title: 'Admin Dashboard',
        status: 'planning',
        tasks_total: 3,
        tasks_completed: 0,
        created: '2025-10-04'
      });

      const epics = await listLocalEpics();

      expect(Array.isArray(epics)).toBe(true);
      expect(epics).toHaveLength(2);
      expect(epics[0].id).toBe('epic-001'); // Newest first
      expect(epics[1].id).toBe('epic-002');
    });

    test('should return empty array when no epics exist', async () => {
      const epics = await listLocalEpics();

      expect(Array.isArray(epics)).toBe(true);
      expect(epics).toHaveLength(0);
    });

    test('should filter epics by status', async () => {
      await createTestEpic('epic-001-auth', {
        id: 'epic-001',
        status: 'in_progress',
        created: '2025-10-05'
      });

      await createTestEpic('epic-002-dash', {
        id: 'epic-002',
        status: 'completed',
        created: '2025-10-04'
      });

      const inProgress = await listLocalEpics({ status: 'in_progress' });
      const completed = await listLocalEpics({ status: 'completed' });

      expect(inProgress).toHaveLength(1);
      expect(inProgress[0].id).toBe('epic-001');

      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('epic-002');
    });

    test('should filter epics by PRD ID', async () => {
      await createTestEpic('epic-001-auth', {
        id: 'epic-001',
        prd_id: 'prd-001',
        created: '2025-10-05'
      });

      await createTestEpic('epic-002-dashboard', {
        id: 'epic-002',
        prd_id: 'prd-002',
        created: '2025-10-04'
      });

      const prd001Epics = await listLocalEpics({ prd_id: 'prd-001' });

      expect(prd001Epics).toHaveLength(1);
      expect(prd001Epics[0].id).toBe('epic-001');
    });

    test('should sort epics by creation date (newest first)', async () => {
      await createTestEpic('epic-001-old', {
        id: 'epic-001',
        created: '2025-10-01'
      });

      await createTestEpic('epic-002-new', {
        id: 'epic-002',
        created: '2025-10-05'
      });

      await createTestEpic('epic-003-mid', {
        id: 'epic-003',
        created: '2025-10-03'
      });

      const epics = await listLocalEpics();

      expect(epics[0].id).toBe('epic-002'); // 2025-10-05
      expect(epics[1].id).toBe('epic-003'); // 2025-10-03
      expect(epics[2].id).toBe('epic-001'); // 2025-10-01
    });

    test('should skip invalid epic directories', async () => {
      // Create valid epic
      await createTestEpic('epic-001-valid', {
        id: 'epic-001',
        created: '2025-10-05'
      });

      // Create invalid epic (missing epic.md)
      await fs.mkdir(path.join(epicsDir, 'epic-002-invalid'), { recursive: true });

      const epics = await listLocalEpics();

      expect(epics).toHaveLength(1);
      expect(epics[0].id).toBe('epic-001');
    });
  });

  describe('showLocalEpic()', () => {
    test('should return epic frontmatter and body', async () => {
      const epicBody = `# Epic Overview

This is the epic content.

## Goals
- Goal 1
- Goal 2`;

      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        title: 'Test Epic',
        status: 'planning'
      }, epicBody);

      const epic = await showLocalEpic('epic-001');

      expect(epic.frontmatter.id).toBe('epic-001');
      expect(epic.frontmatter.title).toBe('Test Epic');
      expect(epic.body).toContain('Epic Overview');
      expect(epic.body).toContain('Goal 1');
    });

    test('should throw error for non-existent epic', async () => {
      await expect(
        showLocalEpic('epic-999')
      ).rejects.toThrow(/not found/i);
    });

    test('should include epic directory path', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        created: '2025-10-05'
      });

      const epic = await showLocalEpic('epic-001');

      expect(epic.directory).toMatch(/epic-001-test$/);
    });
  });

  describe('updateLocalEpic()', () => {
    test('should update epic frontmatter fields', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        title: 'Original Title',
        status: 'planning',
        tasks_total: 0
      });

      await updateLocalEpic('epic-001', {
        title: 'Updated Title',
        status: 'in_progress',
        tasks_total: 5
      });

      const epic = await showLocalEpic('epic-001');

      expect(epic.frontmatter.title).toBe('Updated Title');
      expect(epic.frontmatter.status).toBe('in_progress');
      expect(epic.frontmatter.tasks_total).toBe(5);
    });

    test('should preserve body content when updating', async () => {
      const originalBody = `# Epic Content

This should not change.`;

      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      }, originalBody);

      await updateLocalEpic('epic-001', {
        status: 'in_progress'
      });

      const epic = await showLocalEpic('epic-001');

      expect(epic.body.trim()).toBe(originalBody.trim());
      expect(epic.frontmatter.status).toBe('in_progress');
    });

    test('should update tasks_completed count', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        tasks_total: 5,
        tasks_completed: 2
      });

      await updateLocalEpic('epic-001', {
        tasks_completed: 3
      });

      const epic = await showLocalEpic('epic-001');

      expect(epic.frontmatter.tasks_completed).toBe(3);
    });

    test('should throw error for non-existent epic', async () => {
      await expect(
        updateLocalEpic('epic-999', { status: 'completed' })
      ).rejects.toThrow(/not found/i);
    });
  });

  // Helper function to create test epics
  async function createTestEpic(dirName, frontmatter, body = '# Epic Content') {
    const epicDir = path.join(epicsDir, dirName);
    await fs.mkdir(epicDir, { recursive: true });

    const epicContent = stringifyFrontmatter(frontmatter, body);
    const epicPath = path.join(epicDir, 'epic.md');

    await fs.writeFile(epicPath, epicContent, 'utf8');
  }
});
