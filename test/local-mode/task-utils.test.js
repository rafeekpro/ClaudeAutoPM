/**
 * Task Utilities Tests
 * Tests for shared task ID generation and formatting utilities
 */

const {
  generateTaskNumber,
  generateTaskId,
  generateShortTaskId,
  generateTaskFilename
} = require('../../autopm/.claude/lib/task-utils');

describe('Task Utilities', () => {
  describe('generateTaskNumber', () => {
    test('should generate zero-padded task numbers', () => {
      expect(generateTaskNumber(1)).toBe('001');
      expect(generateTaskNumber(5)).toBe('005');
      expect(generateTaskNumber(42)).toBe('042');
      expect(generateTaskNumber(999)).toBe('999');
    });

    test('should handle numbers > 999', () => {
      expect(generateTaskNumber(1000)).toBe('1000');
      expect(generateTaskNumber(9999)).toBe('9999');
    });
  });

  describe('generateTaskId', () => {
    test('should generate full task IDs with epic prefix', () => {
      expect(generateTaskId('epic-001', 1)).toBe('task-epic-001-001');
      expect(generateTaskId('epic-001', 5)).toBe('task-epic-001-005');
      expect(generateTaskId('epic-042', 15)).toBe('task-epic-042-015');
    });

    test('should handle different epic ID formats', () => {
      expect(generateTaskId('epic-abc', 1)).toBe('task-epic-abc-001');
      expect(generateTaskId('epic-xyz-123', 5)).toBe('task-epic-xyz-123-005');
    });
  });

  describe('generateShortTaskId', () => {
    test('should generate short task IDs without epic prefix', () => {
      expect(generateShortTaskId(1)).toBe('task-001');
      expect(generateShortTaskId(5)).toBe('task-005');
      expect(generateShortTaskId(42)).toBe('task-042');
    });
  });

  describe('generateTaskFilename', () => {
    test('should generate task filenames with .md extension', () => {
      expect(generateTaskFilename(1)).toBe('task-001.md');
      expect(generateTaskFilename(5)).toBe('task-005.md');
      expect(generateTaskFilename(42)).toBe('task-042.md');
    });
  });

  describe('consistency across functions', () => {
    test('should use same task number format across all functions', () => {
      const index = 7;
      const epicId = 'epic-001';

      const taskNum = generateTaskNumber(index);
      const taskId = generateTaskId(epicId, index);
      const shortId = generateShortTaskId(index);
      const filename = generateTaskFilename(index);

      expect(taskNum).toBe('007');
      expect(taskId).toContain(taskNum);
      expect(shortId).toContain(taskNum);
      expect(filename).toContain(taskNum);
    });
  });
});
