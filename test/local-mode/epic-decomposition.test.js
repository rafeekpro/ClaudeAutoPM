/**
 * TASK-008: Epic Decomposition Tests (TDD Approach)
 *
 * Tests AI-powered epic decomposition into right-sized tasks.
 * Following strict TDD: Write failing tests FIRST, then implement.
 *
 * Test Coverage Target: >85%
 */

const fs = require('fs').promises;
const path = require('path');
const { decomposeLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-decompose-local');
const { showLocalEpic } = require('../../autopm/.claude/scripts/pm-epic-show-local');
const { stringifyFrontmatter } = require('../../autopm/.claude/lib/frontmatter');
const { MockAIProvider, MockErrorProvider, MockEmptyProvider } = require('../mocks/ai-provider.mock');

describe('TASK-008: Epic Decomposition', () => {
  const testDir = path.join(__dirname, 'test-workspace-decompose');
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

  describe('decomposeLocalEpic() - Main Flow', () => {
    test('should generate tasks from epic content using AI', async () => {
      // Create test epic
      await createTestEpic('epic-001-auth', {
        id: 'epic-001',
        title: 'User Authentication',
        prd_id: 'prd-001',
        status: 'planning',
        tasks_total: 0,
        tasks_completed: 0
      }, `# User Authentication Epic

## Goals
- Implement secure user authentication
- JWT token management
- Password hashing

## User Stories
As a user, I want to register with email and password
As a user, I want to login securely
As an admin, I want to manage user sessions`);

      // Use mock AI provider
      const mockProvider = new MockAIProvider();
      const result = await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      expect(result.tasksCreated).toBeGreaterThan(0);
      expect(result.epicId).toBe('epic-001');
      expect(mockProvider.callCount).toBe(1);
    });

    test('should create task-NNN.md files in epic directory', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning',
        tasks_total: 0
      });

      const mockProvider = new MockAIProvider();
      await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      const epicDir = path.join(epicsDir, 'epic-001-test');
      const files = await fs.readdir(epicDir);
      const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.md'));

      expect(taskFiles.length).toBeGreaterThan(0);
      expect(taskFiles[0]).toMatch(/^task-\d{3}\.md$/);
    });

    test('should update epic tasks_total in frontmatter', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning',
        tasks_total: 0,
        tasks_completed: 0
      });

      const mockProvider = new MockAIProvider();
      const result = await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      const epic = await showLocalEpic('epic-001');

      expect(epic.frontmatter.tasks_total).toBe(result.tasksCreated);
      expect(epic.frontmatter.tasks_total).toBeGreaterThan(0);
    });

    test('should validate epic exists before decomposition', async () => {
      const mockProvider = new MockAIProvider();

      await expect(
        decomposeLocalEpic('epic-999', { aiProvider: mockProvider })
      ).rejects.toThrow(/not found/i);
    });

    test('should handle AI API errors gracefully', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      const errorProvider = new MockErrorProvider();

      await expect(
        decomposeLocalEpic('epic-001', { aiProvider: errorProvider })
      ).rejects.toThrow(/API Error/i);
    });
  });

  describe('Task Generation', () => {
    test('should populate task frontmatter correctly', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      const mockProvider = new MockAIProvider();
      await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      const epicDir = path.join(epicsDir, 'epic-001-test');
      const taskPath = path.join(epicDir, 'task-001.md');
      const taskContent = await fs.readFile(taskPath, 'utf8');

      expect(taskContent).toContain('id: task-epic-001-001');
      expect(taskContent).toContain('epic_id: epic-001');
      expect(taskContent).toContain('status: pending');
      expect(taskContent).toContain('estimated_hours:');
    });

    test('should generate unique task IDs (task-<epic-id>-NNN)', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      const mockProvider = new MockAIProvider();
      await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      const epicDir = path.join(epicsDir, 'epic-001-test');
      const files = await fs.readdir(epicDir);
      const taskFiles = files.filter(f => f.startsWith('task-'));

      for (let i = 0; i < taskFiles.length; i++) {
        const content = await fs.readFile(path.join(epicDir, taskFiles[i]), 'utf8');
        const expectedId = `task-epic-001-${String(i + 1).padStart(3, '0')}`;
        expect(content).toContain(`id: ${expectedId}`);
      }
    });

    test('should include acceptance criteria in each task', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      const mockProvider = new MockAIProvider();
      await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      const epicDir = path.join(epicsDir, 'epic-001-test');
      const taskPath = path.join(epicDir, 'task-001.md');
      const taskContent = await fs.readFile(taskPath, 'utf8');

      expect(taskContent).toContain('## Acceptance Criteria');
      expect(taskContent).toMatch(/- \[.\]/); // Checklist item
    });

    test('should estimate effort for each task (4-8 hours optimal)', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      const mockProvider = new MockAIProvider();
      await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      const epicDir = path.join(epicsDir, 'epic-001-test');
      const files = await fs.readdir(epicDir);
      const taskFiles = files.filter(f => f.startsWith('task-'));

      for (const taskFile of taskFiles) {
        const content = await fs.readFile(path.join(epicDir, taskFile), 'utf8');
        const hoursMatch = content.match(/estimated_hours:\s*(\d+)/);

        expect(hoursMatch).not.toBeNull();
        const hours = parseInt(hoursMatch[1]);
        expect(hours).toBeGreaterThanOrEqual(1);
        expect(hours).toBeLessThanOrEqual(8);
      }
    });

    test('should identify dependencies between tasks', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      const mockProvider = new MockAIProvider();
      await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      const epicDir = path.join(epicsDir, 'epic-001-test');
      const task2Path = path.join(epicDir, 'task-002.md');
      const task2Content = await fs.readFile(task2Path, 'utf8');

      // Task 2 should depend on Task 1 (from mock data)
      expect(task2Content).toContain('dependencies:');
      expect(task2Content).toContain('task-001');
    });

    test('should handle empty AI response (no tasks generated)', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      const emptyProvider = new MockEmptyProvider();
      const result = await decomposeLocalEpic('epic-001', { aiProvider: emptyProvider });

      expect(result.tasksCreated).toBe(0);
      expect(result.warning).toMatch(/No tasks generated/i);
    });
  });

  describe('CCPM Compliance', () => {
    test('should assign priority based on dependencies (critical chain)', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      const mockProvider = new MockAIProvider();
      await decomposeLocalEpic('epic-001', { aiProvider: mockProvider });

      const epicDir = path.join(epicsDir, 'epic-001-test');
      const task1Path = path.join(epicDir, 'task-001.md');
      const task1Content = await fs.readFile(task1Path, 'utf8');

      // Task 1 has no dependencies, should be high priority
      expect(task1Content).toContain('priority: high');
    });

    test('should validate dependency graph (no circular dependencies)', async () => {
      await createTestEpic('epic-001-test', {
        id: 'epic-001',
        status: 'planning'
      });

      // Mock provider with circular dependency should fail validation
      const circularProvider = new MockAIProvider({
        default: [
          {
            title: "Task A",
            estimated_hours: 4,
            dependencies: ["task-002"],
            priority: 'high'
          },
          {
            title: "Task B",
            estimated_hours: 4,
            dependencies: ["task-001"],
            priority: 'high'
          }
        ]
      });

      await expect(
        decomposeLocalEpic('epic-001', { aiProvider: circularProvider, validateDependencies: true })
      ).rejects.toThrow(/circular dependency/i);
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
