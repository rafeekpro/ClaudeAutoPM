/**
 * TaskService - Task Management Service
 *
 * Pure service layer for task operations without any I/O operations.
 * Follows 3-layer architecture: Service (logic) -> No direct I/O
 *
 * Provides 15 pure business logic methods organized into 5 categories:
 *
 * 1. Status Management (4 methods):
 *    - normalizeTaskStatus: Normalize status values to standard format
 *    - isTaskOpen: Check if task is in open state
 *    - isTaskClosed: Check if task is in closed state
 *    - categorizeTaskStatus: Categorize status into buckets
 *
 * 2. Task Parsing & Validation (4 methods):
 *    - parseTaskNumber: Extract task number from ID
 *    - parseTaskMetadata: Parse task frontmatter
 *    - validateTaskMetadata: Validate required fields
 *    - formatTaskId: Format number to task ID
 *
 * 3. Dependencies (3 methods):
 *    - parseDependencies: Parse dependency string to array
 *    - hasBlockingDependencies: Check if dependencies block task
 *    - validateDependencyFormat: Validate dependency format
 *
 * 4. Analytics & Statistics (4 methods):
 *    - calculateTaskCompletion: Calculate completion percentage
 *    - getTaskStatistics: Get comprehensive task statistics
 *    - sortTasksByPriority: Sort tasks by priority level
 *    - filterTasksByStatus: Filter tasks by status
 *
 * 5. Task Generation (2 methods):
 *    - generateTaskMetadata: Generate task frontmatter
 *    - generateTaskContent: Build complete task markdown
 *
 * Documentation Queries:
 * - mcp://context7/agile/task-management - Task management best practices
 * - mcp://context7/agile/task-tracking - Task tracking patterns
 * - mcp://context7/agile/task-dependencies - Dependency management
 * - mcp://context7/project-management/task-breakdown - Task breakdown patterns
 * - mcp://context7/markdown/frontmatter - YAML frontmatter patterns
 */

const PRDService = require('./PRDService');

class TaskService {
  /**
   * Create a new TaskService instance
   *
   * @param {Object} options - Configuration options
   * @param {PRDService} options.prdService - PRDService instance for parsing
   * @param {ConfigManager} options.configManager - Optional ConfigManager instance
   * @param {string} options.defaultTaskType - Default task type (default: 'development')
   * @param {string} options.defaultEffort - Default effort (default: '1d')
   * @throws {Error} If PRDService is not provided or invalid
   */
  constructor(options = {}) {
    if (!options.prdService) {
      throw new Error('PRDService instance is required');
    }

    if (!(options.prdService instanceof PRDService)) {
      throw new Error('prdService must be an instance of PRDService');
    }

    this.prdService = options.prdService;

    // Store ConfigManager if provided (for future use)
    this.configManager = options.configManager || undefined;

    this.options = {
      defaultTaskType: 'development',
      defaultEffort: '1d',
      ...options
    };

    // Task ID counter for generation
    this._taskIdCounter = Date.now() % 10000;
  }

  // ==========================================
  // 1. STATUS MANAGEMENT (4 METHODS)
  // ==========================================

  /**
   * Normalize task status to standard values
   *
   * Maps various status strings to standardized values:
   * - "closed", "done", "finished" -> "completed"
   * - Other statuses remain unchanged
   * - Defaults to "open" for unknown/null values
   *
   * @param {string} status - Raw status string
   * @returns {string} Normalized status
   *
   * @example
   * normalizeTaskStatus('closed')  // Returns 'completed'
   * normalizeTaskStatus('done')    // Returns 'completed'
   * normalizeTaskStatus('open')    // Returns 'open'
   */
  normalizeTaskStatus(status) {
    const lowerStatus = (status || '').toLowerCase();

    // Map closed variants to completed
    if (['closed', 'done', 'finished'].includes(lowerStatus)) {
      return 'completed';
    }

    // Keep known statuses
    if (['completed', 'open', 'in_progress', 'blocked'].includes(lowerStatus)) {
      return lowerStatus;
    }

    // Default to open for unknown
    return 'open';
  }

  /**
   * Check if task is in open/active state
   *
   * Returns true for: open, in_progress, blocked
   * Returns false for: completed, closed, done
   *
   * @param {Object} task - Task object with status field
   * @returns {boolean} True if task is open/active
   *
   * @example
   * isTaskOpen({ status: 'open' })        // Returns true
   * isTaskOpen({ status: 'in_progress' }) // Returns true
   * isTaskOpen({ status: 'completed' })   // Returns false
   */
  isTaskOpen(task) {
    const status = (task?.status || '').toLowerCase();
    const normalizedStatus = this.normalizeTaskStatus(status);

    // Open states: open, in_progress, blocked
    return ['open', 'in_progress', 'blocked'].includes(normalizedStatus);
  }

  /**
   * Check if task is in closed/completed state
   *
   * Returns true for: completed, closed, done
   * Returns false for: open, in_progress, blocked
   *
   * @param {Object} task - Task object with status field
   * @returns {boolean} True if task is closed/completed
   *
   * @example
   * isTaskClosed({ status: 'completed' }) // Returns true
   * isTaskClosed({ status: 'closed' })    // Returns true
   * isTaskClosed({ status: 'open' })      // Returns false
   */
  isTaskClosed(task) {
    const status = (task?.status || '').toLowerCase();
    const normalizedStatus = this.normalizeTaskStatus(status);

    // Closed state: completed
    return normalizedStatus === 'completed';
  }

  /**
   * Categorize task status into standard buckets
   *
   * Maps various status strings to standardized categories:
   * - todo: open, not_started
   * - in_progress: in_progress, active
   * - completed: completed, done, closed
   * - blocked: blocked
   *
   * @param {string} status - Raw status string
   * @returns {string} Categorized status (todo|in_progress|completed|blocked)
   *
   * @example
   * categorizeTaskStatus('open')        // Returns 'todo'
   * categorizeTaskStatus('in_progress') // Returns 'in_progress'
   * categorizeTaskStatus('done')        // Returns 'completed'
   * categorizeTaskStatus('blocked')     // Returns 'blocked'
   */
  categorizeTaskStatus(status) {
    const lowerStatus = (status || '').toLowerCase();

    // Todo statuses
    if (['open', 'not_started', ''].includes(lowerStatus)) {
      return 'todo';
    }

    // In progress statuses
    if (['in_progress', 'active'].includes(lowerStatus)) {
      return 'in_progress';
    }

    // Completed statuses
    if (['completed', 'done', 'closed', 'finished'].includes(lowerStatus)) {
      return 'completed';
    }

    // Blocked status
    if (lowerStatus === 'blocked') {
      return 'blocked';
    }

    // Default to todo for unknown
    return 'todo';
  }

  // ==========================================
  // 2. TASK PARSING & VALIDATION (4 METHODS)
  // ==========================================

  /**
   * Extract task number from task ID
   *
   * Extracts numeric portion from task IDs:
   * - "TASK-123" -> 123
   * - "task-456" -> 456
   * - "TASK123" -> 123
   *
   * @param {string} taskId - Task identifier
   * @returns {number|null} Task number or null if invalid
   *
   * @example
   * parseTaskNumber('TASK-123')  // Returns 123
   * parseTaskNumber('task-456')  // Returns 456
   * parseTaskNumber('invalid')   // Returns null
   */
  parseTaskNumber(taskId) {
    if (!taskId || typeof taskId !== 'string') {
      return null;
    }

    // Match TASK-N or TASKN format (case insensitive)
    const match = taskId.match(/task-?(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }

    return null;
  }

  /**
   * Parse task metadata from markdown content
   *
   * Extracts YAML frontmatter from task markdown.
   * Uses PRDService for frontmatter parsing.
   *
   * @param {string} content - Task markdown content
   * @returns {Object|null} Parsed metadata or null
   *
   * @example
   * parseTaskMetadata(`---
   * id: TASK-123
   * title: My Task
   * ---`)
   * // Returns: { id: 'TASK-123', title: 'My Task' }
   */
  parseTaskMetadata(content) {
    return this.prdService.parseFrontmatter(content);
  }

  /**
   * Validate task metadata
   *
   * Checks for required fields:
   * - id: Task identifier (must be TASK-N format)
   * - title: Task title
   * - type: Task type
   *
   * @param {Object} metadata - Task metadata object
   * @returns {Object} Validation result:
   *   - valid: Boolean indicating if metadata is valid
   *   - errors: Array of error messages
   *
   * @example
   * validateTaskMetadata({ id: 'TASK-123', title: 'Task', type: 'backend' })
   * // Returns: { valid: true, errors: [] }
   */
  validateTaskMetadata(metadata) {
    const errors = [];

    // Required fields
    if (!metadata.id) {
      errors.push('Missing required field: id');
    } else {
      // Validate ID format
      if (!metadata.id.match(/^TASK-\d+$/i)) {
        errors.push(`Invalid task ID format: ${metadata.id}`);
      }
    }

    if (!metadata.title) {
      errors.push('Missing required field: title');
    }

    if (!metadata.type) {
      errors.push('Missing required field: type');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format number to task ID
   *
   * Converts numeric task number to standard TASK-N format.
   *
   * @param {number|string} number - Task number
   * @returns {string} Formatted task ID (TASK-N)
   * @throws {Error} If number is invalid
   *
   * @example
   * formatTaskId(123)   // Returns 'TASK-123'
   * formatTaskId('456') // Returns 'TASK-456'
   */
  formatTaskId(number) {
    const num = parseInt(number, 10);

    if (isNaN(num) || num < 0) {
      throw new Error(`Invalid task number: ${number}`);
    }

    return `TASK-${num}`;
  }

  // ==========================================
  // 3. DEPENDENCIES (3 METHODS)
  // ==========================================

  /**
   * Parse dependency string to array
   *
   * Handles multiple formats:
   * - Comma-separated: "TASK-1, TASK-2"
   * - Array format: "[TASK-1, TASK-2]"
   * - Single: "TASK-1"
   *
   * @param {string} dependencyString - Dependency string
   * @returns {Array<string>} Array of task IDs
   *
   * @example
   * parseDependencies('TASK-1, TASK-2')   // Returns ['TASK-1', 'TASK-2']
   * parseDependencies('[TASK-1, TASK-2]') // Returns ['TASK-1', 'TASK-2']
   * parseDependencies('')                 // Returns []
   */
  parseDependencies(dependencyString) {
    if (!dependencyString || typeof dependencyString !== 'string') {
      return [];
    }

    // Remove array brackets if present
    let cleaned = dependencyString.trim();
    cleaned = cleaned.replace(/^\[|\]$/g, '');

    // Split by comma and trim
    const deps = cleaned.split(',')
      .map(dep => dep.trim())
      .filter(dep => dep.length > 0);

    return deps;
  }

  /**
   * Check if task has blocking dependencies
   *
   * A task is blocked if any of its dependencies are:
   * - Not completed/closed
   * - Not found in allTasks array
   *
   * @param {Object} task - Task object with dependencies field
   * @param {Array<Object>} allTasks - Array of all tasks
   * @returns {boolean} True if task has blocking dependencies
   *
   * @example
   * hasBlockingDependencies(
   *   { id: 'TASK-3', dependencies: 'TASK-1, TASK-2' },
   *   [
   *     { id: 'TASK-1', status: 'completed' },
   *     { id: 'TASK-2', status: 'open' }
   *   ]
   * )
   * // Returns true (TASK-2 is still open)
   */
  hasBlockingDependencies(task, allTasks) {
    if (!task.dependencies) {
      return false;
    }

    const deps = this.parseDependencies(task.dependencies);

    if (deps.length === 0) {
      return false;
    }

    // Check each dependency
    for (const depId of deps) {
      const depTask = allTasks.find(t => t.id === depId);

      // Blocked if dependency not found
      if (!depTask) {
        return true;
      }

      // Blocked if dependency not closed
      if (!this.isTaskClosed(depTask)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate dependency format
   *
   * Checks if dependency string follows valid formats:
   * - Empty string (no dependencies)
   * - TASK-N format
   * - Comma-separated TASK-N
   * - Array format [TASK-N, ...]
   *
   * @param {string} depString - Dependency string
   * @returns {boolean} True if format is valid
   *
   * @example
   * validateDependencyFormat('TASK-1')           // Returns true
   * validateDependencyFormat('TASK-1, TASK-2')   // Returns true
   * validateDependencyFormat('[TASK-1, TASK-2]') // Returns true
   * validateDependencyFormat('invalid')          // Returns false
   */
  validateDependencyFormat(depString) {
    // Null/undefined is invalid
    if (depString === null || depString === undefined) {
      return false;
    }

    // Empty string is valid (no dependencies)
    if (depString === '') {
      return true;
    }

    if (typeof depString !== 'string') {
      return false;
    }

    // Remove array brackets
    let cleaned = depString.trim();
    cleaned = cleaned.replace(/^\[|\]$/g, '').trim();

    // Empty after cleaning is valid
    if (cleaned === '') {
      return true;
    }

    // Split and check each dependency
    const deps = cleaned.split(',').map(d => d.trim());

    for (const dep of deps) {
      // Must match TASK-N format (case sensitive - uppercase TASK only)
      if (!dep.match(/^TASK-\d+$/)) {
        return false;
      }
    }

    return true;
  }

  // ==========================================
  // 4. ANALYTICS & STATISTICS (4 METHODS)
  // ==========================================

  /**
   * Calculate task completion percentage
   *
   * Calculates percentage of closed tasks vs total tasks.
   * Returns 0 for empty array.
   *
   * @param {Array<Object>} tasks - Array of task objects
   * @returns {number} Completion percentage (0-100)
   *
   * @example
   * calculateTaskCompletion([
   *   { status: 'completed' },
   *   { status: 'completed' },
   *   { status: 'open' },
   *   { status: 'open' }
   * ])
   * // Returns 50
   */
  calculateTaskCompletion(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return 0;
    }

    const closedCount = tasks.filter(task => this.isTaskClosed(task)).length;
    const percent = Math.round((closedCount * 100) / tasks.length);

    return percent;
  }

  /**
   * Get comprehensive task statistics
   *
   * Calculates multiple metrics:
   * - total: Total number of tasks
   * - open: Number of open/active tasks
   * - closed: Number of closed/completed tasks
   * - blocked: Number of blocked tasks
   * - completionPercentage: Completion percentage
   *
   * @param {Array<Object>} tasks - Array of task objects
   * @returns {Object} Statistics object
   *
   * @example
   * getTaskStatistics([
   *   { status: 'open' },
   *   { status: 'completed' },
   *   { status: 'blocked' }
   * ])
   * // Returns:
   * // {
   * //   total: 3,
   * //   open: 2,
   * //   closed: 1,
   * //   blocked: 1,
   * //   completionPercentage: 33
   * // }
   */
  getTaskStatistics(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        total: 0,
        open: 0,
        closed: 0,
        blocked: 0,
        completionPercentage: 0
      };
    }

    const total = tasks.length;
    const closed = tasks.filter(task => this.isTaskClosed(task)).length;
    const open = tasks.filter(task => this.isTaskOpen(task)).length;
    const blocked = tasks.filter(task => {
      const status = (task?.status || '').toLowerCase();
      return status === 'blocked';
    }).length;

    const completionPercentage = Math.round((closed * 100) / total);

    return {
      total,
      open,
      closed,
      blocked,
      completionPercentage
    };
  }

  /**
   * Sort tasks by priority
   *
   * Sorts tasks in priority order:
   * - P1 (highest)
   * - P2 (medium)
   * - P3 (lowest)
   *
   * Tasks without priority default to P3.
   * Does not mutate original array.
   *
   * @param {Array<Object>} tasks - Array of task objects
   * @returns {Array<Object>} Sorted array (new array)
   *
   * @example
   * sortTasksByPriority([
   *   { id: 'TASK-1', priority: 'P3' },
   *   { id: 'TASK-2', priority: 'P1' },
   *   { id: 'TASK-3', priority: 'P2' }
   * ])
   * // Returns tasks in order: TASK-2 (P1), TASK-3 (P2), TASK-1 (P3)
   */
  sortTasksByPriority(tasks) {
    if (!Array.isArray(tasks)) {
      return [];
    }

    // Priority order map
    const priorityOrder = {
      'P1': 1,
      'P2': 2,
      'P3': 3
    };

    // Create copy and sort
    return [...tasks].sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 3; // Default to P3
      const priorityB = priorityOrder[b.priority] || 3;

      return priorityA - priorityB;
    });
  }

  /**
   * Filter tasks by status
   *
   * Returns tasks matching the specified status.
   * Case insensitive.
   * Does not mutate original array.
   *
   * @param {Array<Object>} tasks - Array of task objects
   * @param {string} status - Status to filter by
   * @returns {Array<Object>} Filtered array (new array)
   *
   * @example
   * filterTasksByStatus([
   *   { id: 'TASK-1', status: 'open' },
   *   { id: 'TASK-2', status: 'completed' },
   *   { id: 'TASK-3', status: 'open' }
   * ], 'open')
   * // Returns [TASK-1, TASK-3]
   */
  filterTasksByStatus(tasks, status) {
    if (!Array.isArray(tasks)) {
      return [];
    }

    const targetStatus = (status || '').toLowerCase();

    return tasks.filter(task => {
      const taskStatus = (task?.status || '').toLowerCase();
      return taskStatus === targetStatus;
    });
  }

  // ==========================================
  // 5. TASK GENERATION (2 METHODS)
  // ==========================================

  /**
   * Generate task metadata
   *
   * Creates standardized task metadata with required and optional fields.
   * Generates unique task ID if not provided.
   *
   * @param {string} title - Task title
   * @param {Object} options - Optional metadata overrides
   * @param {string} options.type - Task type (default: 'development')
   * @param {string} options.effort - Effort estimate (default: '1d')
   * @param {string} options.priority - Priority level (default: 'P2')
   * @param {string} options.status - Task status (default: 'open')
   * @param {string} options.dependencies - Dependencies
   * @returns {Object} Task metadata object
   * @throws {Error} If title is missing
   *
   * @example
   * generateTaskMetadata('Implement feature', {
   *   type: 'backend',
   *   effort: '2d',
   *   priority: 'P1'
   * })
   * // Returns:
   * // {
   * //   id: 'TASK-1234',
   * //   title: 'Implement feature',
   * //   type: 'backend',
   * //   effort: '2d',
   * //   status: 'open',
   * //   priority: 'P1',
   * //   created: '2025-01-01T00:00:00.000Z'
   * // }
   */
  generateTaskMetadata(title, options = {}) {
    if (!title || (typeof title === 'string' && title.trim() === '')) {
      throw new Error('Task title is required');
    }

    // Generate unique task ID
    this._taskIdCounter++;
    const taskId = this.formatTaskId(this._taskIdCounter);

    const metadata = {
      id: taskId,
      title,
      type: options.type || this.options.defaultTaskType,
      effort: options.effort || this.options.defaultEffort,
      status: options.status || 'open',
      priority: options.priority || 'P2',
      created: new Date().toISOString()
    };

    // Add optional fields
    if (options.dependencies) {
      metadata.dependencies = options.dependencies;
    }

    return metadata;
  }

  /**
   * Generate complete task markdown content
   *
   * Builds full task document with:
   * - YAML frontmatter
   * - Task title and description
   * - Subtasks checklist
   *
   * @param {Object} metadata - Task metadata (frontmatter)
   * @param {string} description - Task description (optional)
   * @param {Array<string>} subtasks - Array of subtask strings (optional)
   * @returns {string} Complete task markdown content
   *
   * @example
   * generateTaskContent(
   *   { id: 'TASK-123', title: 'My Task', type: 'backend', ... },
   *   'Task description',
   *   ['Subtask 1', 'Subtask 2']
   * )
   * // Returns multiline markdown with frontmatter, description, and subtasks
   */
  generateTaskContent(metadata, description = '', subtasks = []) {
    // Build frontmatter
    let frontmatter = `---
id: ${metadata.id}
title: ${metadata.title}
type: ${metadata.type}
effort: ${metadata.effort}
status: ${metadata.status}
priority: ${metadata.priority}
created: ${metadata.created}`;

    // Add optional fields
    if (metadata.dependencies) {
      frontmatter += `\ndependencies: ${metadata.dependencies}`;
    }

    frontmatter += '\n---';

    // Build content
    let content = frontmatter + '\n\n';
    content += `# ${metadata.id}: ${metadata.title}\n\n`;

    // Add description
    if (description && description.trim()) {
      content += `## Description\n\n${description}\n\n`;
    }

    // Add subtasks
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      content += '## Subtasks\n\n';
      subtasks.forEach(subtask => {
        content += `- [ ] ${subtask}\n`;
      });
    }

    return content;
  }
}

module.exports = TaskService;
