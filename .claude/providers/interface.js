/**
 * Provider Interface Definition
 *
 * All providers must implement these methods with consistent signatures
 * and return data in the unified format.
 */

/**
 * Base Provider Interface
 * @abstract
 */
class ProviderInterface {
  /**
   * List epics/features
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status (open, closed, all)
   * @param {string} options.assignee - Filter by assignee
   * @param {string} options.label - Filter by label/tag
   * @param {number} options.limit - Limit number of results
   * @param {Object} settings - Provider-specific settings from config
   * @returns {Promise<Array<Epic>>} List of epics in unified format
   * @abstract
   */
  async listEpics(options, settings) {
    throw new Error('listEpics must be implemented by provider');
  }

  /**
   * Get single epic/feature by ID
   * @param {string} id - Epic/feature ID
   * @param {Object} settings - Provider-specific settings
   * @returns {Promise<Epic>} Epic in unified format
   * @abstract
   */
  async getEpic(id, settings) {
    throw new Error('getEpic must be implemented by provider');
  }

  /**
   * Create new epic/feature
   * @param {Object} data - Epic data
   * @param {Object} settings - Provider-specific settings
   * @returns {Promise<Epic>} Created epic in unified format
   * @abstract
   */
  async createEpic(data, settings) {
    throw new Error('createEpic must be implemented by provider');
  }

  /**
   * Update existing epic/feature
   * @param {string} id - Epic ID
   * @param {Object} updates - Fields to update
   * @param {Object} settings - Provider-specific settings
   * @returns {Promise<Epic>} Updated epic in unified format
   * @abstract
   */
  async updateEpic(id, updates, settings) {
    throw new Error('updateEpic must be implemented by provider');
  }

  /**
   * List tasks/issues for an epic
   * @param {string} epicId - Epic ID
   * @param {Object} options - Query options
   * @param {Object} settings - Provider-specific settings
   * @returns {Promise<Array<Task>>} List of tasks in unified format
   * @abstract
   */
  async listTasks(epicId, options, settings) {
    throw new Error('listTasks must be implemented by provider');
  }

  /**
   * Create pull request
   * @param {Object} data - PR data
   * @param {Object} settings - Provider-specific settings
   * @returns {Promise<PullRequest>} Created PR in unified format
   * @abstract
   */
  async createPullRequest(data, settings) {
    throw new Error('createPullRequest must be implemented by provider');
  }

  /**
   * Start work on an issue/task
   * @param {Object} options - Start options
   * @param {string} options.id - Issue/task ID
   * @param {string} options.branch - Custom branch name
   * @param {boolean} options.assign - Auto-assign to current user
   * @param {string} options.comment - Comment to add
   * @param {boolean} options.no_branch - Skip branch creation
   * @param {Object} settings - Provider-specific settings
   * @returns {Promise<StartResult>} Result of start operation
   * @abstract
   */
  async startIssue(options, settings) {
    throw new Error('startIssue must be implemented by provider');
  }

  /**
   * Complete work on an issue/task
   * @param {Object} options - Complete options
   * @param {string} options.id - Issue/task ID
   * @param {string} options.comment - Completion comment
   * @param {boolean} options.close - Close the issue
   * @param {Object} settings - Provider-specific settings
   * @returns {Promise<CompleteResult>} Result of complete operation
   * @abstract
   */
  async completeIssue(options, settings) {
    throw new Error('completeIssue must be implemented by provider');
  }
}

/**
 * Unified Epic data structure
 * @typedef {Object} Epic
 * @property {string} id - Unique identifier
 * @property {string} title - Epic title
 * @property {string} description - Epic description
 * @property {string} status - Status (open, in_progress, in_review, completed, cancelled)
 * @property {string|null} assignee - Assignee identifier
 * @property {Array<string>} labels - Labels/tags
 * @property {number} childCount - Number of child items
 * @property {number} completedCount - Number of completed child items
 * @property {string} url - Web URL to epic
 * @property {string|null} milestone - Associated milestone/sprint
 * @property {Date|null} createdAt - Creation date
 * @property {Date|null} updatedAt - Last update date
 * @property {Date|null} dueDate - Due date if set
 * @property {Object} metadata - Provider-specific metadata
 */

/**
 * Unified Task data structure
 * @typedef {Object} Task
 * @property {string} id - Unique identifier
 * @property {string} epicId - Parent epic ID
 * @property {string} title - Task title
 * @property {string} description - Task description
 * @property {string} status - Status (todo, in_progress, done, blocked)
 * @property {string|null} assignee - Assignee identifier
 * @property {Array<string>} labels - Labels/tags
 * @property {string} url - Web URL to task
 * @property {number} priority - Priority (1-5, 1 being highest)
 * @property {Date|null} createdAt - Creation date
 * @property {Date|null} updatedAt - Last update date
 * @property {Date|null} completedAt - Completion date
 * @property {Object} metadata - Provider-specific metadata
 */

/**
 * Unified Pull Request data structure
 * @typedef {Object} PullRequest
 * @property {string} id - PR identifier
 * @property {string} title - PR title
 * @property {string} description - PR description
 * @property {string} status - Status (open, merged, closed)
 * @property {string} sourceBranch - Source branch name
 * @property {string} targetBranch - Target branch name
 * @property {string|null} author - Author identifier
 * @property {Array<string>} reviewers - List of reviewer identifiers
 * @property {string} url - Web URL to PR
 * @property {Date} createdAt - Creation date
 * @property {Date|null} mergedAt - Merge date
 * @property {Object} metadata - Provider-specific metadata
 */

/**
 * Unified Start Result data structure
 * @typedef {Object} StartResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {Object} issue - Issue details after starting
 * @property {string} issue.id - Issue identifier
 * @property {string} issue.title - Issue title
 * @property {string} issue.status - New status
 * @property {string} issue.assignee - Assignee
 * @property {string|null} issue.branch - Created branch name
 * @property {string} issue.url - Web URL
 * @property {Array<string>} actions - List of actions performed
 * @property {string} timestamp - Operation timestamp
 * @property {Object} metadata - Provider-specific metadata
 */

/**
 * Unified Complete Result data structure
 * @typedef {Object} CompleteResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {Object} issue - Issue details after completion
 * @property {string} issue.id - Issue identifier
 * @property {string} issue.title - Issue title
 * @property {string} issue.status - New status (completed/closed)
 * @property {string} issue.resolution - Resolution type
 * @property {Array<string>} actions - List of actions performed
 * @property {string} timestamp - Operation timestamp
 * @property {Object} metadata - Provider-specific metadata
 */

/**
 * Status mappings for consistency
 */
const StatusMappings = {
  Epic: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    IN_REVIEW: 'in_review',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  Task: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    DONE: 'done',
    BLOCKED: 'blocked'
  },
  PullRequest: {
    OPEN: 'open',
    MERGED: 'merged',
    CLOSED: 'closed'
  }
};

/**
 * Provider validation helper
 * Validates that a provider implementation conforms to the interface
 */
class ProviderValidator {
  /**
   * Validate epic data structure
   * @param {Object} epic - Epic object to validate
   * @returns {boolean} True if valid
   */
  static validateEpic(epic) {
    const required = ['id', 'title', 'status', 'labels', 'childCount', 'completedCount', 'url'];
    const hasRequired = required.every(field => epic.hasOwnProperty(field));

    if (!hasRequired) {
      console.error('Epic missing required fields:', required.filter(f => !epic.hasOwnProperty(f)));
      return false;
    }

    // Validate status is in allowed values
    const validStatuses = Object.values(StatusMappings.Epic);
    if (!validStatuses.includes(epic.status)) {
      console.error(`Invalid epic status: ${epic.status}. Must be one of: ${validStatuses.join(', ')}`);
      return false;
    }

    // Validate types
    if (typeof epic.id !== 'string' || typeof epic.title !== 'string') {
      console.error('Epic id and title must be strings');
      return false;
    }

    if (!Array.isArray(epic.labels)) {
      console.error('Epic labels must be an array');
      return false;
    }

    return true;
  }

  /**
   * Validate task data structure
   * @param {Object} task - Task object to validate
   * @returns {boolean} True if valid
   */
  static validateTask(task) {
    const required = ['id', 'epicId', 'title', 'status', 'labels', 'url', 'priority'];
    const hasRequired = required.every(field => task.hasOwnProperty(field));

    if (!hasRequired) {
      console.error('Task missing required fields:', required.filter(f => !task.hasOwnProperty(f)));
      return false;
    }

    // Validate status
    const validStatuses = Object.values(StatusMappings.Task);
    if (!validStatuses.includes(task.status)) {
      console.error(`Invalid task status: ${task.status}`);
      return false;
    }

    // Validate priority
    if (typeof task.priority !== 'number' || task.priority < 1 || task.priority > 5) {
      console.error('Task priority must be a number between 1 and 5');
      return false;
    }

    return true;
  }

  /**
   * Validate provider implementation
   * @param {Object} provider - Provider instance to validate
   * @returns {boolean} True if valid
   */
  static validateProvider(provider) {
    const requiredMethods = [
      'listEpics',
      'getEpic',
      'createEpic',
      'updateEpic',
      'listTasks',
      'createPullRequest'
    ];

    const hasAllMethods = requiredMethods.every(method => {
      const hasMethod = typeof provider[method] === 'function';
      if (!hasMethod) {
        console.error(`Provider missing required method: ${method}`);
      }
      return hasMethod;
    });

    return hasAllMethods;
  }
}

module.exports = {
  ProviderInterface,
  StatusMappings,
  ProviderValidator
};