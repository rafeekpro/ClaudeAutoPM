/**
 * Service Interfaces for ClaudeAutoPM
 *
 * This module defines TypeScript-style interfaces using JSDoc for all service layers.
 * These interfaces provide:
 * - Type safety through JSDoc annotations
 * - Clear contracts for service implementations
 * - IDE autocomplete and IntelliSense support
 * - Documentation for API consumers
 *
 * @module services/interfaces
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * @typedef {Object} ConfigManager
 * @property {function(string, *): void} set - Set configuration value
 * @property {function(string): *} get - Get configuration value
 * @property {function(string): void} setMasterPassword - Set master password
 */

/**
 * @typedef {Object} AIProvider
 * @property {function(string, Object=): Promise<string>} complete - Complete a prompt
 * @property {function(string, Object=): AsyncGenerator<string>} stream - Stream completion
 */

/**
 * @typedef {Object} TaskObject
 * @property {string} id - Task identifier (e.g., "TASK-001")
 * @property {string} title - Task title
 * @property {string} description - Task description
 * @property {string} status - Task status (pending, in_progress, completed, blocked)
 * @property {string} type - Task type (development, testing, documentation, etc.)
 * @property {string} effort - Effort estimate (e.g., "2d", "8h")
 * @property {string[]} [dependencies] - Array of dependent task IDs
 * @property {number} [priority] - Priority level (1=highest)
 * @property {string} [assignee] - Assigned developer
 */

/**
 * @typedef {Object} MetadataObject
 * @property {string} id - Unique identifier
 * @property {string} title - Document title
 * @property {string} status - Current status
 * @property {string} created - Creation timestamp
 * @property {string} updated - Last update timestamp
 * @property {Object} [additionalFields] - Additional metadata fields
 */

/**
 * @typedef {Object} ProgressObject
 * @property {string} bar - Visual progress bar (e.g., "████████░░ 80%")
 * @property {number} percent - Completion percentage (0-100)
 * @property {number} filled - Number of filled characters
 * @property {number} empty - Number of empty characters
 */

/**
 * @typedef {Object} PRDSections
 * @property {string} vision - Product vision
 * @property {string} problem - Problem statement
 * @property {string} users - Target users
 * @property {string[]} features - List of features
 * @property {string[]} requirements - List of requirements
 * @property {string} metrics - Success metrics
 * @property {string} technical - Technical approach
 * @property {string} timeline - Project timeline
 * @property {Array<{raw: string}>} [userStories] - Parsed user stories
 */

/**
 * @typedef {Object} TaskStatistics
 * @property {number} total - Total number of tasks
 * @property {number} open - Number of open tasks
 * @property {number} closed - Number of closed tasks
 * @property {number} blocked - Number of blocked tasks
 * @property {number} completionPercentage - Overall completion (0-100)
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 */

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * PRD Service Interface
 *
 * Provides methods for parsing, analyzing, and managing Product Requirements Documents.
 * All methods are synchronous and pure (no side effects).
 *
 * @interface IPRDService
 * @example
 * const prdService = new PRDService({ defaultEffortHours: 8 });
 * const frontmatter = prdService.parseFrontmatter(content);
 * const sections = prdService.extractPrdContent(content);
 */
class IPRDService {
  /**
   * Create a new PRDService instance
   * @param {Object} [options] - Service options
   * @param {ConfigManager} [options.configManager] - Configuration manager
   * @param {AIProvider} [options.provider] - AI provider for advanced operations
   * @param {number} [options.defaultEffortHours=8] - Default effort in hours
   * @param {number} [options.hoursPerDay=8] - Working hours per day
   * @param {number} [options.hoursPerWeek=40] - Working hours per week
   */
  constructor(options = {}) {}

  // ========================================================================
  // TIER 1: Pure Parsing Methods
  // ========================================================================

  /**
   * Parse YAML frontmatter from markdown content
   * @param {string} content - Markdown content with frontmatter
   * @returns {Object|null} Parsed frontmatter object or null if none found
   * @example
   * const fm = service.parseFrontmatter('---\ntitle: My PRD\n---\nContent');
   * // Returns: { title: 'My PRD' }
   */
  parseFrontmatter(content) {}

  /**
   * Extract PRD sections from content
   * @param {string} content - PRD markdown content
   * @param {Object} [options] - Extraction options
   * @param {boolean} [options.useAdvancedParser=false] - Use advanced parser
   * @returns {PRDSections} Extracted sections
   * @example
   * const sections = service.extractPrdContent(prdContent);
   * console.log(sections.features); // Array of feature strings
   */
  extractPrdContent(content, options = {}) {}

  /**
   * Parse user stories from text
   * @param {string} text - Text containing user stories
   * @returns {Array<{raw: string}>} Array of parsed user stories
   * @example
   * const stories = service.parseUserStories('As a user, I want...');
   * // Returns: [{ raw: 'As a user, I want...' }]
   */
  parseUserStories(text) {}

  // ========================================================================
  // TIER 3: Utility Methods
  // ========================================================================

  /**
   * Parse effort string to hours
   * @param {string|number} effort - Effort string (e.g., "2d", "4h", "1w") or hours
   * @returns {number} Total hours
   * @example
   * service.parseEffort('2d'); // Returns: 16 (assuming 8h/day)
   * service.parseEffort('1w'); // Returns: 40 (assuming 40h/week)
   */
  parseEffort(effort) {}

  /**
   * Format hours to readable effort string
   * @param {number} hours - Hours to format
   * @returns {string} Formatted effort (e.g., "1w 2d 4h")
   * @example
   * service.formatEffort(44); // Returns: "1w 4h"
   */
  formatEffort(hours) {}

  /**
   * Calculate total effort across all tasks
   * @param {TaskObject[]} tasks - Array of tasks
   * @returns {string} Total effort formatted
   * @example
   * service.calculateTotalEffort([
   *   { effort: '2d' },
   *   { effort: '8h' }
   * ]); // Returns: "3d"
   */
  calculateTotalEffort(tasks) {}

  /**
   * Calculate effort for tasks of specific type
   * @param {TaskObject[]} tasks - Array of tasks
   * @param {string} type - Task type to filter by
   * @returns {string} Total effort formatted
   * @example
   * service.calculateEffortByType(tasks, 'development'); // Returns: "5d"
   */
  calculateEffortByType(tasks, type) {}

  /**
   * Generate epic ID from PRD ID
   * @param {string} prdId - PRD identifier (e.g., "prd-347")
   * @returns {string} Epic ID (e.g., "epic-347")
   * @example
   * service.generateEpicId('prd-347'); // Returns: "epic-347"
   */
  generateEpicId(prdId) {}

  /**
   * Slugify text for filesystem-safe names
   * @param {string} text - Text to slugify
   * @returns {string} Slugified text
   * @example
   * service.slugify('My Feature Name!'); // Returns: "my-feature-name"
   */
  slugify(text) {}

  /**
   * Determine if PRD is complex (needs splitting)
   * @param {string} technicalApproach - Technical approach text
   * @param {TaskObject[]} tasks - Array of tasks
   * @returns {boolean} True if complex (3+ components or 10+ tasks)
   * @example
   * const complex = service.isComplexPrd(approach, tasks);
   */
  isComplexPrd(technicalApproach, tasks) {}
}

/**
 * Epic Service Interface
 *
 * Provides methods for managing epics, including status tracking,
 * GitHub integration, and content generation.
 * Requires PRDService for dependency injection.
 *
 * @interface IEpicService
 * @example
 * const epicService = new EpicService({ prdService });
 * const progress = epicService.calculateProgress(tasks);
 */
class IEpicService {
  /**
   * Create a new EpicService instance
   * @param {Object} options - Service options (REQUIRED)
   * @param {IPRDService} options.prdService - PRD service instance (REQUIRED)
   * @param {ConfigManager} [options.configManager] - Configuration manager
   * @throws {Error} If prdService is missing or invalid
   */
  constructor(options) {}

  // ========================================================================
  // Status & Categorization
  // ========================================================================

  /**
   * Categorize status into standard buckets
   * @param {string} status - Raw status string
   * @returns {string} Categorized status: 'backlog'|'planning'|'in_progress'|'done'
   * @example
   * service.categorizeStatus('in-progress'); // Returns: "in_progress"
   */
  categorizeStatus(status) {}

  /**
   * Check if task is closed/completed
   * @param {TaskObject} task - Task to check
   * @returns {boolean} True if task is closed
   * @example
   * service.isTaskClosed({ status: 'completed' }); // Returns: true
   */
  isTaskClosed(task) {}

  /**
   * Calculate completion percentage
   * @param {TaskObject[]} tasks - Array of tasks
   * @returns {number} Completion percentage (0-100)
   * @example
   * service.calculateProgress([
   *   { status: 'completed' },
   *   { status: 'pending' }
   * ]); // Returns: 50
   */
  calculateProgress(tasks) {}

  /**
   * Generate visual progress bar
   * @param {number} percent - Percentage (0-100)
   * @param {number} [totalChars=20] - Total bar width
   * @returns {ProgressObject} Progress bar object
   * @example
   * const bar = service.generateProgressBar(75);
   * console.log(bar.bar); // "███████████████░░░░░ 75%"
   */
  generateProgressBar(percent, totalChars = 20) {}

  /**
   * Validate dependencies format
   * @param {string[]|string} dependencies - Dependencies to validate
   * @returns {boolean} True if valid
   * @example
   * service.hasValidDependencies(['TASK-001', 'TASK-002']); // Returns: true
   */
  hasValidDependencies(dependencies) {}

  // ========================================================================
  // GitHub Integration
  // ========================================================================

  /**
   * Extract issue number from GitHub URL
   * @param {string} githubUrl - GitHub issue URL
   * @returns {string|null} Issue number or null
   * @example
   * service.extractGitHubIssue('https://github.com/org/repo/issues/42');
   * // Returns: "42"
   */
  extractGitHubIssue(githubUrl) {}

  /**
   * Format GitHub issue URL
   * @param {string} repoOwner - Repository owner
   * @param {string} repoName - Repository name
   * @param {string|number} issueNumber - Issue number
   * @returns {string} Formatted GitHub URL
   * @throws {Error} If parameters are missing
   * @example
   * service.formatGitHubUrl('owner', 'repo', 42);
   * // Returns: "https://github.com/owner/repo/issues/42"
   */
  formatGitHubUrl(repoOwner, repoName, issueNumber) {}

  // ========================================================================
  // Content Analysis & Generation
  // ========================================================================

  /**
   * Analyze PRD content
   * @param {string} prdContent - PRD markdown content
   * @returns {Object} Analysis result with frontmatter and sections
   * @example
   * const analysis = service.analyzePRD(prdContent);
   * console.log(analysis.sections.features);
   */
  analyzePRD(prdContent) {}

  /**
   * Determine feature dependencies
   * @param {string[]} features - Array of feature descriptions
   * @returns {Object} Dependency map
   * @example
   * const deps = service.determineDependencies([
   *   'Authentication system',
   *   'User dashboard (requires authentication)'
   * ]);
   */
  determineDependencies(features) {}

  /**
   * Generate epic metadata/frontmatter
   * @param {string} name - Epic name (REQUIRED)
   * @param {string} prdId - PRD identifier (REQUIRED)
   * @param {Object} [options] - Additional options
   * @returns {MetadataObject} Epic metadata
   * @throws {Error} If name or prdId is missing
   * @example
   * const metadata = service.generateEpicMetadata('auth', 'prd-001');
   */
  generateEpicMetadata(name, prdId, options = {}) {}

  /**
   * Generate complete epic markdown content
   * @param {MetadataObject} metadata - Epic metadata
   * @param {PRDSections} sections - PRD sections
   * @param {TaskObject[]} tasks - Array of tasks
   * @returns {string} Complete epic markdown
   * @example
   * const markdown = service.generateEpicContent(metadata, sections, tasks);
   */
  generateEpicContent(metadata, sections, tasks) {}

  /**
   * Build task section as markdown list
   * @param {TaskObject[]} tasks - Array of tasks
   * @returns {string} Markdown formatted task list
   * @example
   * const taskMd = service.buildTaskSection(tasks);
   * // Returns: "- [x] Task 1\n- [ ] Task 2"
   */
  buildTaskSection(tasks) {}
}

/**
 * Task Service Interface
 *
 * Provides comprehensive task management including status tracking,
 * dependency validation, analytics, and task generation.
 * Requires PRDService for dependency injection.
 *
 * @interface ITaskService
 * @example
 * const taskService = new TaskService({ prdService });
 * const stats = taskService.getTaskStatistics(tasks);
 */
class ITaskService {
  /**
   * Create a new TaskService instance
   * @param {Object} options - Service options (REQUIRED)
   * @param {IPRDService} options.prdService - PRD service instance (REQUIRED)
   * @param {ConfigManager} [options.configManager] - Configuration manager
   * @param {string} [options.defaultTaskType='development'] - Default task type
   * @param {string} [options.defaultEffort='1d'] - Default effort estimate
   * @throws {Error} If prdService is missing or invalid
   */
  constructor(options) {}

  // ========================================================================
  // Status Management
  // ========================================================================

  /**
   * Normalize task status to standard values
   * @param {string} status - Raw status string
   * @returns {string} Normalized status
   * @example
   * service.normalizeTaskStatus('In Progress'); // Returns: "in_progress"
   */
  normalizeTaskStatus(status) {}

  /**
   * Check if task is open/active
   * @param {TaskObject} task - Task to check
   * @returns {boolean} True if task is open
   * @example
   * service.isTaskOpen({ status: 'pending' }); // Returns: true
   */
  isTaskOpen(task) {}

  /**
   * Check if task is closed/completed
   * @param {TaskObject} task - Task to check
   * @returns {boolean} True if task is closed
   * @example
   * service.isTaskClosed({ status: 'completed' }); // Returns: true
   */
  isTaskClosed(task) {}

  /**
   * Categorize task status into buckets
   * @param {string} status - Task status
   * @returns {string} Category: 'todo'|'in_progress'|'completed'|'blocked'
   * @example
   * service.categorizeTaskStatus('pending'); // Returns: "todo"
   */
  categorizeTaskStatus(status) {}

  // ========================================================================
  // Task Parsing & Validation
  // ========================================================================

  /**
   * Extract task number from ID
   * @param {string} taskId - Task ID (e.g., "TASK-042")
   * @returns {number|null} Task number or null
   * @example
   * service.parseTaskNumber('TASK-042'); // Returns: 42
   */
  parseTaskNumber(taskId) {}

  /**
   * Parse task frontmatter metadata
   * @param {string} content - Task markdown content
   * @returns {MetadataObject|null} Parsed metadata or null
   * @example
   * const metadata = service.parseTaskMetadata(taskContent);
   */
  parseTaskMetadata(content) {}

  /**
   * Validate task metadata completeness
   * @param {MetadataObject} metadata - Task metadata
   * @returns {ValidationResult} Validation result
   * @example
   * const result = service.validateTaskMetadata(metadata);
   * if (!result.valid) console.log(result.errors);
   */
  validateTaskMetadata(metadata) {}

  /**
   * Format task number to ID
   * @param {number} number - Task number
   * @returns {string} Formatted task ID (e.g., "TASK-001")
   * @throws {Error} If number is invalid
   * @example
   * service.formatTaskId(42); // Returns: "TASK-042"
   */
  formatTaskId(number) {}

  // ========================================================================
  // Dependencies
  // ========================================================================

  /**
   * Parse dependency string to array
   * @param {string} dependencyString - Comma-separated dependencies
   * @returns {string[]} Array of task IDs
   * @example
   * service.parseDependencies('TASK-001, TASK-002');
   * // Returns: ['TASK-001', 'TASK-002']
   */
  parseDependencies(dependencyString) {}

  /**
   * Check if task has blocking dependencies
   * @param {TaskObject} task - Task to check
   * @param {TaskObject[]} allTasks - All tasks for lookup
   * @returns {boolean} True if blocked by uncompleted dependencies
   * @example
   * const blocked = service.hasBlockingDependencies(task, allTasks);
   */
  hasBlockingDependencies(task, allTasks) {}

  /**
   * Validate dependency format
   * @param {string} depString - Dependency string
   * @returns {boolean} True if valid format
   * @example
   * service.validateDependencyFormat('TASK-001'); // Returns: true
   */
  validateDependencyFormat(depString) {}

  // ========================================================================
  // Analytics & Statistics
  // ========================================================================

  /**
   * Calculate task completion percentage
   * @param {TaskObject[]} tasks - Array of tasks
   * @returns {number} Completion percentage (0-100)
   * @example
   * const completion = service.calculateTaskCompletion(tasks);
   */
  calculateTaskCompletion(tasks) {}

  /**
   * Get comprehensive task statistics
   * @param {TaskObject[]} tasks - Array of tasks
   * @returns {TaskStatistics} Complete statistics
   * @example
   * const stats = service.getTaskStatistics(tasks);
   * console.log(`${stats.completionPercentage}% complete`);
   */
  getTaskStatistics(tasks) {}

  /**
   * Sort tasks by priority
   * @param {TaskObject[]} tasks - Tasks to sort
   * @returns {TaskObject[]} New sorted array (does not mutate original)
   * @example
   * const sorted = service.sortTasksByPriority(tasks);
   */
  sortTasksByPriority(tasks) {}

  /**
   * Filter tasks by status
   * @param {TaskObject[]} tasks - Tasks to filter
   * @param {string} status - Status to filter by
   * @returns {TaskObject[]} New filtered array
   * @example
   * const pending = service.filterTasksByStatus(tasks, 'pending');
   */
  filterTasksByStatus(tasks, status) {}

  // ========================================================================
  // Task Generation
  // ========================================================================

  /**
   * Generate task metadata/frontmatter
   * @param {string} title - Task title (REQUIRED)
   * @param {Object} [options] - Additional options
   * @param {string} [options.type] - Task type
   * @param {string} [options.effort] - Effort estimate
   * @param {string} [options.status] - Initial status
   * @param {string[]} [options.dependencies] - Dependent tasks
   * @returns {MetadataObject} Task metadata
   * @throws {Error} If title is missing
   * @example
   * const metadata = service.generateTaskMetadata('Implement auth', {
   *   type: 'development',
   *   effort: '3d'
   * });
   */
  generateTaskMetadata(title, options = {}) {}

  /**
   * Generate complete task markdown content
   * @param {MetadataObject} metadata - Task metadata
   * @param {string} [description=''] - Task description
   * @param {string[]} [subtasks=[]] - Array of subtask strings
   * @returns {string} Complete task markdown
   * @example
   * const taskMd = service.generateTaskContent(metadata, 'Description', [
   *   'Subtask 1',
   *   'Subtask 2'
   * ]);
   */
  generateTaskContent(metadata, description = '', subtasks = []) {}
}

/**
 * Agent Service Interface
 *
 * Provides methods for loading, parsing, and invoking AI agents for standalone mode.
 * Agents are defined in markdown files with specialization, Context7 queries, and methodologies.
 *
 * @interface IAgentService
 * @example
 * const agentService = new AgentService(aiProvider);
 * const agents = await agentService.listAgents();
 * const response = await agentService.invoke('aws-cloud-architect', task, context);
 */
class IAgentService {
  /**
   * Create a new AgentService instance
   * @param {AIProvider} aiProvider - AI provider instance (REQUIRED)
   * @param {Object} [options] - Service options
   * @param {string} [options.agentsBaseDir] - Base directory for agents
   * @throws {Error} If aiProvider is missing or invalid
   */
  constructor(aiProvider, options = {}) {}

  // ========================================================================
  // Agent Loading & Parsing
  // ========================================================================

  /**
   * Load agent metadata from .md file
   * @param {string} agentName - Agent name (e.g., 'aws-cloud-architect')
   * @returns {Promise<AgentMetadata>} Parsed agent metadata with category
   * @throws {Error} If agent not found or file is malformed
   * @example
   * const agent = await service.loadAgent('aws-cloud-architect');
   * console.log(agent.title, agent.specialization);
   */
  loadAgent(agentName) {}

  /**
   * Parse agent markdown file content
   * @param {string} markdownContent - Agent .md file content
   * @returns {AgentMetadata} Parsed agent metadata
   * @example
   * const metadata = service.parseAgent(fileContent);
   * console.log(metadata.documentationQueries);
   */
  parseAgent(markdownContent) {}

  // ========================================================================
  // Agent Invocation
  // ========================================================================

  /**
   * Invoke agent with task and context
   * @param {string} agentName - Agent name to invoke
   * @param {string} task - Task description
   * @param {Object} [context={}] - Additional context (tech stack, requirements)
   * @param {Object} [options={}] - Invocation options
   * @param {string} [options.conversationId] - For multi-turn conversations
   * @returns {Promise<string>} Agent response
   * @throws {Error} If agent not found or AI provider fails
   * @example
   * const response = await service.invoke(
   *   'nodejs-backend-engineer',
   *   'Review authentication module',
   *   { techStack: 'Node.js, PostgreSQL' }
   * );
   */
  invoke(agentName, task, context, options) {}

  /**
   * Invoke agent with streaming response
   * @param {string} agentName - Agent name to invoke
   * @param {string} task - Task description
   * @param {Object} [context={}] - Additional context
   * @param {Object} [options={}] - Invocation options
   * @returns {AsyncGenerator<string>} Stream of response chunks
   * @example
   * for await (const chunk of service.invokeStream('test-agent', 'task', {})) {
   *   process.stdout.write(chunk);
   * }
   */
  invokeStream(agentName, task, context, options) {}

  // ========================================================================
  // Agent Discovery
  // ========================================================================

  /**
   * List all available agents
   * @param {Object} [options={}] - List options
   * @param {boolean} [options.grouped=false] - Group by category
   * @returns {Promise<Array<AgentSummary>|Object>} Array of agents or grouped object
   * @example
   * const agents = await service.listAgents();
   * const grouped = await service.listAgents({ grouped: true });
   * console.log(grouped.core, grouped.cloud);
   */
  listAgents(options) {}

  /**
   * Search agents by keyword
   * @param {string} query - Search query (case-insensitive)
   * @returns {Promise<Array<AgentSummary>>} Matching agents
   * @example
   * const awsAgents = await service.searchAgents('aws');
   * const dbExperts = await service.searchAgents('database');
   */
  searchAgents(query) {}
}

/**
 * Agent Metadata
 * @typedef {Object} AgentMetadata
 * @property {string} name - Agent name (e.g., 'aws-cloud-architect')
 * @property {string} title - Agent title from markdown
 * @property {string} specialization - Agent specialization description
 * @property {string[]} documentationQueries - Context7 mcp:// queries
 * @property {string[]} methodologies - Methodologies used by agent
 * @property {string[]} tools - Available tools (Read, Write, Bash, etc.)
 * @property {string} category - Agent category (core, cloud, devops, etc.)
 */

/**
 * Agent Summary (for listing)
 * @typedef {Object} AgentSummary
 * @property {string} name - Agent name
 * @property {string} title - Agent title
 * @property {string} specialization - Brief specialization
 * @property {string} category - Agent category
 */

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Interfaces (for documentation)
  IPRDService,
  IEpicService,
  ITaskService,
  IAgentService,

  // TypeDefs are defined above for JSDoc @type references only.
  // They are NOT exported at runtime and cannot be imported.
};
