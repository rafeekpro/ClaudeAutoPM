/**
 * TaskService Tests - TDD Approach
 * Tests for Task Management Service
 *
 * Following strict TDD methodology:
 * 1. Write failing tests FIRST
 * 2. Implement minimal code to pass
 * 3. Refactor while keeping tests green
 */

const TaskService = require('../../lib/services/TaskService');
const PRDService = require('../../lib/services/PRDService');

describe('TaskService - Status Management (4 methods)', () => {
  let service;

  beforeEach(() => {
    const prdService = new PRDService();
    service = new TaskService({ prdService });
  });

  describe('normalizeTaskStatus', () => {
    test('should normalize "closed" to "completed"', () => {
      expect(service.normalizeTaskStatus('closed')).toBe('completed');
    });

    test('should normalize "done" to "completed"', () => {
      expect(service.normalizeTaskStatus('done')).toBe('completed');
    });

    test('should normalize "finished" to "completed"', () => {
      expect(service.normalizeTaskStatus('finished')).toBe('completed');
    });

    test('should keep "completed" as is', () => {
      expect(service.normalizeTaskStatus('completed')).toBe('completed');
    });

    test('should keep "open" as is', () => {
      expect(service.normalizeTaskStatus('open')).toBe('open');
    });

    test('should keep "in_progress" as is', () => {
      expect(service.normalizeTaskStatus('in_progress')).toBe('in_progress');
    });

    test('should keep "blocked" as is', () => {
      expect(service.normalizeTaskStatus('blocked')).toBe('blocked');
    });

    test('should handle case insensitivity', () => {
      expect(service.normalizeTaskStatus('CLOSED')).toBe('completed');
      expect(service.normalizeTaskStatus('Done')).toBe('completed');
      expect(service.normalizeTaskStatus('OPEN')).toBe('open');
    });

    test('should default to "open" for unknown status', () => {
      expect(service.normalizeTaskStatus('unknown')).toBe('open');
      expect(service.normalizeTaskStatus('')).toBe('open');
      expect(service.normalizeTaskStatus(null)).toBe('open');
    });
  });

  describe('isTaskOpen', () => {
    test('should return true for "open" status', () => {
      const task = { status: 'open' };
      expect(service.isTaskOpen(task)).toBe(true);
    });

    test('should return true for "in_progress" status', () => {
      const task = { status: 'in_progress' };
      expect(service.isTaskOpen(task)).toBe(true);
    });

    test('should return true for "blocked" status', () => {
      const task = { status: 'blocked' };
      expect(service.isTaskOpen(task)).toBe(true);
    });

    test('should return false for "completed" status', () => {
      const task = { status: 'completed' };
      expect(service.isTaskOpen(task)).toBe(false);
    });

    test('should return false for "closed" status', () => {
      const task = { status: 'closed' };
      expect(service.isTaskOpen(task)).toBe(false);
    });

    test('should handle case insensitivity', () => {
      expect(service.isTaskOpen({ status: 'OPEN' })).toBe(true);
      expect(service.isTaskOpen({ status: 'COMPLETED' })).toBe(false);
    });

    test('should return true for missing status (default open)', () => {
      expect(service.isTaskOpen({})).toBe(true);
      expect(service.isTaskOpen({ status: null })).toBe(true);
    });
  });

  describe('isTaskClosed', () => {
    test('should return true for "completed" status', () => {
      const task = { status: 'completed' };
      expect(service.isTaskClosed(task)).toBe(true);
    });

    test('should return true for "closed" status', () => {
      const task = { status: 'closed' };
      expect(service.isTaskClosed(task)).toBe(true);
    });

    test('should return true for "done" status', () => {
      const task = { status: 'done' };
      expect(service.isTaskClosed(task)).toBe(true);
    });

    test('should return false for "open" status', () => {
      const task = { status: 'open' };
      expect(service.isTaskClosed(task)).toBe(false);
    });

    test('should return false for "in_progress" status', () => {
      const task = { status: 'in_progress' };
      expect(service.isTaskClosed(task)).toBe(false);
    });

    test('should return false for "blocked" status', () => {
      const task = { status: 'blocked' };
      expect(service.isTaskClosed(task)).toBe(false);
    });

    test('should handle case insensitivity', () => {
      expect(service.isTaskClosed({ status: 'COMPLETED' })).toBe(true);
      expect(service.isTaskClosed({ status: 'OPEN' })).toBe(false);
    });
  });

  describe('categorizeTaskStatus', () => {
    test('should categorize "open" as "todo"', () => {
      expect(service.categorizeTaskStatus('open')).toBe('todo');
    });

    test('should categorize "not_started" as "todo"', () => {
      expect(service.categorizeTaskStatus('not_started')).toBe('todo');
    });

    test('should categorize "in_progress" as "in_progress"', () => {
      expect(service.categorizeTaskStatus('in_progress')).toBe('in_progress');
    });

    test('should categorize "active" as "in_progress"', () => {
      expect(service.categorizeTaskStatus('active')).toBe('in_progress');
    });

    test('should categorize "completed" as "completed"', () => {
      expect(service.categorizeTaskStatus('completed')).toBe('completed');
    });

    test('should categorize "done" as "completed"', () => {
      expect(service.categorizeTaskStatus('done')).toBe('completed');
    });

    test('should categorize "closed" as "completed"', () => {
      expect(service.categorizeTaskStatus('closed')).toBe('completed');
    });

    test('should categorize "blocked" as "blocked"', () => {
      expect(service.categorizeTaskStatus('blocked')).toBe('blocked');
    });

    test('should handle case insensitivity', () => {
      expect(service.categorizeTaskStatus('OPEN')).toBe('todo');
      expect(service.categorizeTaskStatus('In_Progress')).toBe('in_progress');
    });

    test('should default to "todo" for unknown status', () => {
      expect(service.categorizeTaskStatus('unknown')).toBe('todo');
      expect(service.categorizeTaskStatus('')).toBe('todo');
      expect(service.categorizeTaskStatus(null)).toBe('todo');
    });
  });
});

describe('TaskService - Task Parsing & Validation (4 methods)', () => {
  let service;

  beforeEach(() => {
    const prdService = new PRDService();
    service = new TaskService({ prdService });
  });

  describe('parseTaskNumber', () => {
    test('should extract number from "TASK-123"', () => {
      expect(service.parseTaskNumber('TASK-123')).toBe(123);
    });

    test('should extract number from "task-456"', () => {
      expect(service.parseTaskNumber('task-456')).toBe(456);
    });

    test('should extract number from "TASK123" (no hyphen)', () => {
      expect(service.parseTaskNumber('TASK123')).toBe(123);
    });

    test('should handle single digit numbers', () => {
      expect(service.parseTaskNumber('TASK-1')).toBe(1);
    });

    test('should handle large numbers', () => {
      expect(service.parseTaskNumber('TASK-9999')).toBe(9999);
    });

    test('should return null for invalid format', () => {
      expect(service.parseTaskNumber('invalid')).toBeNull();
      expect(service.parseTaskNumber('')).toBeNull();
      expect(service.parseTaskNumber(null)).toBeNull();
    });

    test('should return null for numeric input', () => {
      expect(service.parseTaskNumber(123)).toBeNull();
    });
  });

  describe('parseTaskMetadata', () => {
    test('should parse valid task frontmatter', () => {
      const content = `---
id: TASK-123
title: Implement feature
type: backend
effort: 2d
status: open
priority: P1
dependencies: TASK-100, TASK-101
---

# Task Content`;

      const result = service.parseTaskMetadata(content);

      expect(result).toEqual({
        id: 'TASK-123',
        title: 'Implement feature',
        type: 'backend',
        effort: '2d',
        status: 'open',
        priority: 'P1',
        dependencies: 'TASK-100, TASK-101'
      });
    });

    test('should handle missing frontmatter', () => {
      const content = `# Task without frontmatter`;
      const result = service.parseTaskMetadata(content);
      expect(result).toBeNull();
    });

    test('should handle empty frontmatter', () => {
      const content = `---
---

# Content`;
      const result = service.parseTaskMetadata(content);
      expect(result).toEqual({});
    });

    test('should parse partial metadata', () => {
      const content = `---
id: TASK-123
title: Simple task
---

Content`;

      const result = service.parseTaskMetadata(content);
      expect(result.id).toBe('TASK-123');
      expect(result.title).toBe('Simple task');
    });
  });

  describe('validateTaskMetadata', () => {
    test('should validate complete metadata', () => {
      const metadata = {
        id: 'TASK-123',
        title: 'Valid task',
        type: 'backend',
        effort: '2d',
        status: 'open'
      };

      const result = service.validateTaskMetadata(metadata);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should require id field', () => {
      const metadata = {
        title: 'Task without ID',
        type: 'backend'
      };

      const result = service.validateTaskMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });

    test('should require title field', () => {
      const metadata = {
        id: 'TASK-123',
        type: 'backend'
      };

      const result = service.validateTaskMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: title');
    });

    test('should require type field', () => {
      const metadata = {
        id: 'TASK-123',
        title: 'Task without type'
      };

      const result = service.validateTaskMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: type');
    });

    test('should validate multiple missing fields', () => {
      const metadata = {};

      const result = service.validateTaskMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Missing required field: id');
      expect(result.errors).toContain('Missing required field: title');
      expect(result.errors).toContain('Missing required field: type');
    });

    test('should allow optional fields to be missing', () => {
      const metadata = {
        id: 'TASK-123',
        title: 'Minimal task',
        type: 'frontend'
      };

      const result = service.validateTaskMetadata(metadata);
      expect(result.valid).toBe(true);
    });

    test('should validate task ID format', () => {
      const metadata = {
        id: 'invalid-id',
        title: 'Task',
        type: 'backend'
      };

      const result = service.validateTaskMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid task ID format: invalid-id');
    });
  });

  describe('formatTaskId', () => {
    test('should format number to "TASK-N" format', () => {
      expect(service.formatTaskId(123)).toBe('TASK-123');
    });

    test('should handle single digit', () => {
      expect(service.formatTaskId(1)).toBe('TASK-1');
    });

    test('should handle large numbers', () => {
      expect(service.formatTaskId(9999)).toBe('TASK-9999');
    });

    test('should handle string numbers', () => {
      expect(service.formatTaskId('123')).toBe('TASK-123');
    });

    test('should throw error for invalid input', () => {
      expect(() => service.formatTaskId('invalid')).toThrow();
      expect(() => service.formatTaskId(null)).toThrow();
      expect(() => service.formatTaskId(undefined)).toThrow();
    });

    test('should throw error for negative numbers', () => {
      expect(() => service.formatTaskId(-1)).toThrow();
    });
  });
});

describe('TaskService - Dependencies (3 methods)', () => {
  let service;

  beforeEach(() => {
    const prdService = new PRDService();
    service = new TaskService({ prdService });
  });

  describe('parseDependencies', () => {
    test('should parse comma-separated dependencies', () => {
      const result = service.parseDependencies('TASK-1, TASK-2, TASK-3');
      expect(result).toEqual(['TASK-1', 'TASK-2', 'TASK-3']);
    });

    test('should parse array-formatted dependencies', () => {
      const result = service.parseDependencies('[TASK-1, TASK-2]');
      expect(result).toEqual(['TASK-1', 'TASK-2']);
    });

    test('should trim whitespace', () => {
      const result = service.parseDependencies('  TASK-1  ,  TASK-2  ');
      expect(result).toEqual(['TASK-1', 'TASK-2']);
    });

    test('should handle single dependency', () => {
      const result = service.parseDependencies('TASK-1');
      expect(result).toEqual(['TASK-1']);
    });

    test('should return empty array for empty string', () => {
      expect(service.parseDependencies('')).toEqual([]);
      expect(service.parseDependencies('  ')).toEqual([]);
    });

    test('should return empty array for null/undefined', () => {
      expect(service.parseDependencies(null)).toEqual([]);
      expect(service.parseDependencies(undefined)).toEqual([]);
    });

    test('should handle dependencies with spaces in format', () => {
      const result = service.parseDependencies('TASK-1 , TASK-2 , TASK-3');
      expect(result).toEqual(['TASK-1', 'TASK-2', 'TASK-3']);
    });
  });

  describe('hasBlockingDependencies', () => {
    test('should return false when task has no dependencies', () => {
      const task = { id: 'TASK-1', dependencies: '' };
      const allTasks = [];

      expect(service.hasBlockingDependencies(task, allTasks)).toBe(false);
    });

    test('should return false when all dependencies are completed', () => {
      const task = { id: 'TASK-3', dependencies: 'TASK-1, TASK-2' };
      const allTasks = [
        { id: 'TASK-1', status: 'completed' },
        { id: 'TASK-2', status: 'closed' }
      ];

      expect(service.hasBlockingDependencies(task, allTasks)).toBe(false);
    });

    test('should return true when any dependency is open', () => {
      const task = { id: 'TASK-3', dependencies: 'TASK-1, TASK-2' };
      const allTasks = [
        { id: 'TASK-1', status: 'completed' },
        { id: 'TASK-2', status: 'open' }
      ];

      expect(service.hasBlockingDependencies(task, allTasks)).toBe(true);
    });

    test('should return true when any dependency is in_progress', () => {
      const task = { id: 'TASK-3', dependencies: 'TASK-1, TASK-2' };
      const allTasks = [
        { id: 'TASK-1', status: 'completed' },
        { id: 'TASK-2', status: 'in_progress' }
      ];

      expect(service.hasBlockingDependencies(task, allTasks)).toBe(true);
    });

    test('should return true when dependency not found in allTasks', () => {
      const task = { id: 'TASK-3', dependencies: 'TASK-1, TASK-999' };
      const allTasks = [
        { id: 'TASK-1', status: 'completed' }
      ];

      expect(service.hasBlockingDependencies(task, allTasks)).toBe(true);
    });

    test('should handle empty allTasks array', () => {
      const task = { id: 'TASK-3', dependencies: 'TASK-1' };
      const allTasks = [];

      expect(service.hasBlockingDependencies(task, allTasks)).toBe(true);
    });
  });

  describe('validateDependencyFormat', () => {
    test('should validate correct format "TASK-N"', () => {
      expect(service.validateDependencyFormat('TASK-1')).toBe(true);
      expect(service.validateDependencyFormat('TASK-123')).toBe(true);
    });

    test('should validate comma-separated format', () => {
      expect(service.validateDependencyFormat('TASK-1, TASK-2')).toBe(true);
    });

    test('should validate array format', () => {
      expect(service.validateDependencyFormat('[TASK-1, TASK-2]')).toBe(true);
    });

    test('should reject invalid formats', () => {
      expect(service.validateDependencyFormat('invalid')).toBe(false);
      expect(service.validateDependencyFormat('task-1')).toBe(false);
      expect(service.validateDependencyFormat('123')).toBe(false);
    });

    test('should accept empty string as valid (no dependencies)', () => {
      expect(service.validateDependencyFormat('')).toBe(true);
    });

    test('should reject null/undefined', () => {
      expect(service.validateDependencyFormat(null)).toBe(false);
      expect(service.validateDependencyFormat(undefined)).toBe(false);
    });
  });
});

describe('TaskService - Analytics & Statistics (4 methods)', () => {
  let service;

  beforeEach(() => {
    const prdService = new PRDService();
    service = new TaskService({ prdService });
  });

  describe('calculateTaskCompletion', () => {
    test('should calculate completion percentage', () => {
      const tasks = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'open' },
        { status: 'open' }
      ];

      expect(service.calculateTaskCompletion(tasks)).toBe(50);
    });

    test('should return 100 for all completed tasks', () => {
      const tasks = [
        { status: 'completed' },
        { status: 'closed' },
        { status: 'done' }
      ];

      expect(service.calculateTaskCompletion(tasks)).toBe(100);
    });

    test('should return 0 for no completed tasks', () => {
      const tasks = [
        { status: 'open' },
        { status: 'in_progress' }
      ];

      expect(service.calculateTaskCompletion(tasks)).toBe(0);
    });

    test('should return 0 for empty task list', () => {
      expect(service.calculateTaskCompletion([])).toBe(0);
    });

    test('should round to nearest integer', () => {
      const tasks = [
        { status: 'completed' },
        { status: 'open' },
        { status: 'open' }
      ];

      // 1/3 = 33.333... should round to 33
      expect(service.calculateTaskCompletion(tasks)).toBe(33);
    });
  });

  describe('getTaskStatistics', () => {
    test('should calculate task statistics', () => {
      const tasks = [
        { status: 'open' },
        { status: 'in_progress' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'blocked' }
      ];

      const stats = service.getTaskStatistics(tasks);

      expect(stats.total).toBe(5);
      expect(stats.open).toBe(3); // open + in_progress + blocked
      expect(stats.closed).toBe(2); // completed
      expect(stats.blocked).toBe(1);
      expect(stats.completionPercentage).toBe(40); // 2/5 = 40%
    });

    test('should handle empty task list', () => {
      const stats = service.getTaskStatistics([]);

      expect(stats.total).toBe(0);
      expect(stats.open).toBe(0);
      expect(stats.closed).toBe(0);
      expect(stats.blocked).toBe(0);
      expect(stats.completionPercentage).toBe(0);
    });

    test('should handle all open tasks', () => {
      const tasks = [
        { status: 'open' },
        { status: 'open' }
      ];

      const stats = service.getTaskStatistics(tasks);

      expect(stats.total).toBe(2);
      expect(stats.open).toBe(2);
      expect(stats.closed).toBe(0);
      expect(stats.completionPercentage).toBe(0);
    });

    test('should handle all closed tasks', () => {
      const tasks = [
        { status: 'completed' },
        { status: 'closed' }
      ];

      const stats = service.getTaskStatistics(tasks);

      expect(stats.total).toBe(2);
      expect(stats.open).toBe(0);
      expect(stats.closed).toBe(2);
      expect(stats.completionPercentage).toBe(100);
    });
  });

  describe('sortTasksByPriority', () => {
    test('should sort tasks by priority (P1 > P2 > P3)', () => {
      const tasks = [
        { id: 'TASK-1', priority: 'P3' },
        { id: 'TASK-2', priority: 'P1' },
        { id: 'TASK-3', priority: 'P2' }
      ];

      const sorted = service.sortTasksByPriority(tasks);

      expect(sorted[0].id).toBe('TASK-2'); // P1
      expect(sorted[1].id).toBe('TASK-3'); // P2
      expect(sorted[2].id).toBe('TASK-1'); // P3
    });

    test('should handle missing priority (default to P3)', () => {
      const tasks = [
        { id: 'TASK-1', priority: 'P1' },
        { id: 'TASK-2' },
        { id: 'TASK-3', priority: 'P2' }
      ];

      const sorted = service.sortTasksByPriority(tasks);

      expect(sorted[0].id).toBe('TASK-1'); // P1
      expect(sorted[1].id).toBe('TASK-3'); // P2
      expect(sorted[2].id).toBe('TASK-2'); // default P3
    });

    test('should preserve order for same priority', () => {
      const tasks = [
        { id: 'TASK-1', priority: 'P2' },
        { id: 'TASK-2', priority: 'P2' },
        { id: 'TASK-3', priority: 'P2' }
      ];

      const sorted = service.sortTasksByPriority(tasks);

      // Should maintain original order for same priority
      expect(sorted[0].id).toBe('TASK-1');
      expect(sorted[1].id).toBe('TASK-2');
      expect(sorted[2].id).toBe('TASK-3');
    });

    test('should not mutate original array', () => {
      const tasks = [
        { id: 'TASK-1', priority: 'P3' },
        { id: 'TASK-2', priority: 'P1' }
      ];

      const original = [...tasks];
      const sorted = service.sortTasksByPriority(tasks);

      expect(tasks).toEqual(original);
      expect(sorted).not.toBe(tasks);
    });

    test('should handle empty array', () => {
      const sorted = service.sortTasksByPriority([]);
      expect(sorted).toEqual([]);
    });
  });

  describe('filterTasksByStatus', () => {
    test('should filter tasks by status', () => {
      const tasks = [
        { id: 'TASK-1', status: 'open' },
        { id: 'TASK-2', status: 'completed' },
        { id: 'TASK-3', status: 'open' }
      ];

      const openTasks = service.filterTasksByStatus(tasks, 'open');

      expect(openTasks).toHaveLength(2);
      expect(openTasks[0].id).toBe('TASK-1');
      expect(openTasks[1].id).toBe('TASK-3');
    });

    test('should handle case insensitivity', () => {
      const tasks = [
        { id: 'TASK-1', status: 'OPEN' },
        { id: 'TASK-2', status: 'open' }
      ];

      const openTasks = service.filterTasksByStatus(tasks, 'open');
      expect(openTasks).toHaveLength(2);
    });

    test('should return empty array when no matches', () => {
      const tasks = [
        { id: 'TASK-1', status: 'open' }
      ];

      const completed = service.filterTasksByStatus(tasks, 'completed');
      expect(completed).toEqual([]);
    });

    test('should handle empty task list', () => {
      const filtered = service.filterTasksByStatus([], 'open');
      expect(filtered).toEqual([]);
    });

    test('should not mutate original array', () => {
      const tasks = [
        { id: 'TASK-1', status: 'open' },
        { id: 'TASK-2', status: 'completed' }
      ];

      const original = [...tasks];
      service.filterTasksByStatus(tasks, 'open');

      expect(tasks).toEqual(original);
    });
  });
});

describe('TaskService - Task Generation (2 methods)', () => {
  let service;

  beforeEach(() => {
    const prdService = new PRDService();
    service = new TaskService({ prdService });
  });

  describe('generateTaskMetadata', () => {
    test('should generate task metadata with defaults', () => {
      const metadata = service.generateTaskMetadata('Implement feature');

      expect(metadata.title).toBe('Implement feature');
      expect(metadata.status).toBe('open');
      expect(metadata.priority).toBe('P2');
      expect(metadata.type).toBe('development');
      expect(metadata.effort).toBe('1d');
      expect(metadata.id).toMatch(/^TASK-\d+$/);
    });

    test('should generate task metadata with custom options', () => {
      const options = {
        type: 'backend',
        effort: '2d',
        priority: 'P1',
        status: 'in_progress',
        dependencies: 'TASK-1, TASK-2'
      };

      const metadata = service.generateTaskMetadata('Custom task', options);

      expect(metadata.title).toBe('Custom task');
      expect(metadata.type).toBe('backend');
      expect(metadata.effort).toBe('2d');
      expect(metadata.priority).toBe('P1');
      expect(metadata.status).toBe('in_progress');
      expect(metadata.dependencies).toBe('TASK-1, TASK-2');
    });

    test('should generate unique task IDs', () => {
      const metadata1 = service.generateTaskMetadata('Task 1');
      const metadata2 = service.generateTaskMetadata('Task 2');

      expect(metadata1.id).not.toBe(metadata2.id);
    });

    test('should throw error for missing title', () => {
      expect(() => service.generateTaskMetadata('')).toThrow();
      expect(() => service.generateTaskMetadata(null)).toThrow();
    });

    test('should include created timestamp', () => {
      const metadata = service.generateTaskMetadata('Task');

      expect(metadata.created).toBeDefined();
      expect(new Date(metadata.created)).toBeInstanceOf(Date);
    });
  });

  describe('generateTaskContent', () => {
    test('should generate complete task markdown', () => {
      const metadata = {
        id: 'TASK-123',
        title: 'Implement feature',
        type: 'backend',
        effort: '2d',
        status: 'open',
        priority: 'P1',
        created: '2025-01-01T00:00:00.000Z'
      };

      const description = 'Implement the user authentication feature.';
      const subtasks = [
        'Setup database models',
        'Create API endpoints',
        'Write tests'
      ];

      const content = service.generateTaskContent(metadata, description, subtasks);

      expect(content).toContain('---');
      expect(content).toContain('id: TASK-123');
      expect(content).toContain('title: Implement feature');
      expect(content).toContain('type: backend');
      expect(content).toContain('# TASK-123: Implement feature');
      expect(content).toContain('Implement the user authentication feature.');
      expect(content).toContain('- [ ] Setup database models');
      expect(content).toContain('- [ ] Create API endpoints');
      expect(content).toContain('- [ ] Write tests');
    });

    test('should handle task without subtasks', () => {
      const metadata = {
        id: 'TASK-123',
        title: 'Simple task',
        type: 'frontend',
        effort: '4h',
        status: 'open',
        priority: 'P2',
        created: '2025-01-01T00:00:00.000Z'
      };

      const content = service.generateTaskContent(metadata, 'Description');

      expect(content).toContain('# TASK-123: Simple task');
      expect(content).not.toContain('## Subtasks');
    });

    test('should handle task without description', () => {
      const metadata = {
        id: 'TASK-123',
        title: 'Task',
        type: 'testing',
        effort: '2h',
        status: 'open',
        priority: 'P3',
        created: '2025-01-01T00:00:00.000Z'
      };

      const content = service.generateTaskContent(metadata);

      expect(content).toContain('# TASK-123: Task');
      expect(content).not.toContain('## Description');
    });

    test('should include dependencies in frontmatter', () => {
      const metadata = {
        id: 'TASK-123',
        title: 'Task with dependencies',
        type: 'backend',
        effort: '1d',
        status: 'open',
        priority: 'P2',
        dependencies: 'TASK-100, TASK-101',
        created: '2025-01-01T00:00:00.000Z'
      };

      const content = service.generateTaskContent(metadata);

      expect(content).toContain('dependencies: TASK-100, TASK-101');
    });

    test('should generate valid YAML frontmatter', () => {
      const metadata = {
        id: 'TASK-123',
        title: 'Task',
        type: 'backend',
        effort: '1d',
        status: 'open',
        priority: 'P1',
        created: '2025-01-01T00:00:00.000Z'
      };

      const content = service.generateTaskContent(metadata);

      // Should have opening and closing ---
      expect(content).toMatch(/^---\n[\s\S]*?\n---\n/);
    });
  });
});

describe('TaskService - Constructor and Options', () => {
  test('should require PRDService instance', () => {
    expect(() => new TaskService()).toThrow('PRDService instance is required');
  });

  test('should require valid PRDService instance', () => {
    expect(() => new TaskService({ prdService: {} })).toThrow('prdService must be an instance of PRDService');
  });

  test('should create instance with valid PRDService', () => {
    const prdService = new PRDService();
    const service = new TaskService({ prdService });

    expect(service).toBeInstanceOf(TaskService);
    expect(service.prdService).toBe(prdService);
  });

  test('should accept additional options', () => {
    const prdService = new PRDService();
    const options = {
      prdService,
      defaultTaskType: 'backend',
      defaultEffort: '2d'
    };

    const service = new TaskService(options);

    expect(service.options.defaultTaskType).toBe('backend');
    expect(service.options.defaultEffort).toBe('2d');
  });
});

describe('TaskService - Error Handling', () => {
  let service;

  beforeEach(() => {
    const prdService = new PRDService();
    service = new TaskService({ prdService });
  });

  test('should handle null input gracefully', () => {
    expect(service.normalizeTaskStatus(null)).toBe('open');
    expect(service.parseDependencies(null)).toEqual([]);
    expect(service.calculateTaskCompletion(null)).toBe(0);
  });

  test('should handle undefined input gracefully', () => {
    expect(service.normalizeTaskStatus(undefined)).toBe('open');
    expect(service.parseDependencies(undefined)).toEqual([]);
  });

  test('should handle empty arrays', () => {
    expect(service.calculateTaskCompletion([])).toBe(0);
    expect(service.getTaskStatistics([])).toEqual({
      total: 0,
      open: 0,
      closed: 0,
      blocked: 0,
      completionPercentage: 0
    });
    expect(service.sortTasksByPriority([])).toEqual([]);
    expect(service.filterTasksByStatus([], 'open')).toEqual([]);
  });

  test('should handle malformed task objects', () => {
    const malformedTask = { id: 'TASK-1' }; // missing status

    expect(service.isTaskOpen(malformedTask)).toBe(true);
    expect(service.isTaskClosed(malformedTask)).toBe(false);
  });
});

describe('TaskService - Integration Tests', () => {
  let service;

  beforeEach(() => {
    const prdService = new PRDService();
    service = new TaskService({ prdService });
  });

  test('should process complete task workflow', () => {
    // 1. Generate task metadata
    const metadata = service.generateTaskMetadata('Implement auth', {
      type: 'backend',
      effort: '2d',
      priority: 'P1'
    });

    expect(metadata.id).toMatch(/^TASK-\d+$/);

    // 2. Validate metadata
    const validation = service.validateTaskMetadata(metadata);
    expect(validation.valid).toBe(true);

    // 3. Generate task content
    const content = service.generateTaskContent(
      metadata,
      'Implement user authentication',
      ['Setup JWT', 'Create middleware', 'Write tests']
    );

    expect(content).toContain('TASK-');
    expect(content).toContain('Implement auth');

    // 4. Parse metadata back from content
    const parsed = service.parseTaskMetadata(content);
    expect(parsed.id).toBe(metadata.id);
    expect(parsed.title).toBe(metadata.title);

    // 5. Extract task number
    const taskNumber = service.parseTaskNumber(parsed.id);
    expect(taskNumber).toBeGreaterThan(0);
  });

  test('should handle task status transitions', () => {
    const tasks = [
      { id: 'TASK-1', status: 'open' },
      { id: 'TASK-2', status: 'in_progress' },
      { id: 'TASK-3', status: 'completed' }
    ];

    // Initial statistics
    const stats = service.getTaskStatistics(tasks);
    expect(stats.open).toBe(2);
    expect(stats.closed).toBe(1);

    // Filter in progress
    const inProgress = service.filterTasksByStatus(tasks, 'in_progress');
    expect(inProgress).toHaveLength(1);

    // Check completion
    expect(service.calculateTaskCompletion(tasks)).toBe(33);
  });

  test('should handle dependencies workflow', () => {
    const tasks = [
      { id: 'TASK-1', status: 'completed', dependencies: '' },
      { id: 'TASK-2', status: 'completed', dependencies: 'TASK-1' },
      { id: 'TASK-3', status: 'open', dependencies: 'TASK-1, TASK-2' }
    ];

    // Parse dependencies
    const deps = service.parseDependencies(tasks[2].dependencies);
    expect(deps).toEqual(['TASK-1', 'TASK-2']);

    // Check if blocked
    const isBlocked = service.hasBlockingDependencies(tasks[2], tasks);
    expect(isBlocked).toBe(false); // All dependencies completed

    // Validate format
    const validFormat = service.validateDependencyFormat(tasks[2].dependencies);
    expect(validFormat).toBe(true);
  });

  test('should sort and prioritize tasks', () => {
    const tasks = [
      { id: 'TASK-1', priority: 'P3', status: 'open' },
      { id: 'TASK-2', priority: 'P1', status: 'in_progress' },
      { id: 'TASK-3', priority: 'P2', status: 'open' },
      { id: 'TASK-4', priority: 'P1', status: 'blocked' }
    ];

    // Sort by priority
    const sorted = service.sortTasksByPriority(tasks);
    expect(sorted[0].priority).toBe('P1');

    // Filter open tasks
    const openTasks = service.filterTasksByStatus(sorted, 'open');
    expect(openTasks).toHaveLength(2);

    // Get statistics
    const stats = service.getTaskStatistics(tasks);
    expect(stats.total).toBe(4);
    expect(stats.blocked).toBe(1);
  });
});
