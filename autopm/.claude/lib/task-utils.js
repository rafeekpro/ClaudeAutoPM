/**
 * Task Utilities
 *
 * Shared utilities for task ID generation and formatting.
 * Ensures consistency across all task-related operations.
 *
 * Usage:
 *   const { generateTaskId, generateTaskNumber, generateTaskFilename } = require('./task-utils');
 *
 *   const taskId = generateTaskId('epic-001', 5);  // 'task-epic-001-005'
 *   const taskNum = generateTaskNumber(5);          // '005'
 *   const filename = generateTaskFilename(5);       // 'task-005.md'
 */

/**
 * Generate zero-padded task number (001, 002, etc.)
 *
 * @param {number} index - Task index (1-based)
 * @returns {string} Zero-padded task number
 */
function generateTaskNumber(index) {
  return String(index).padStart(3, '0');
}

/**
 * Generate full task ID with epic prefix
 *
 * @param {string} epicId - Epic ID (e.g., 'epic-001')
 * @param {number} index - Task index (1-based)
 * @returns {string} Full task ID (e.g., 'task-epic-001-005')
 */
function generateTaskId(epicId, index) {
  const taskNum = generateTaskNumber(index);
  return `task-${epicId}-${taskNum}`;
}

/**
 * Generate short task ID without epic prefix (for dependency analyzer)
 *
 * @param {number} index - Task index (1-based)
 * @returns {string} Short task ID (e.g., 'task-005')
 */
function generateShortTaskId(index) {
  const taskNum = generateTaskNumber(index);
  return `task-${taskNum}`;
}

/**
 * Generate task filename
 *
 * @param {number} index - Task index (1-based)
 * @returns {string} Task filename (e.g., 'task-005.md')
 */
function generateTaskFilename(index) {
  const taskNum = generateTaskNumber(index);
  return `task-${taskNum}.md`;
}

module.exports = {
  generateTaskNumber,
  generateTaskId,
  generateShortTaskId,
  generateTaskFilename
};
