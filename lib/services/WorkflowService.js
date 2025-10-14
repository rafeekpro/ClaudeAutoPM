/**
 * WorkflowService - Project Management and Workflow Service
 *
 * Pure service layer for workflow operations following ClaudeAutoPM patterns.
 * Follows 3-layer architecture: Service (logic) -> No direct I/O
 *
 * Provides comprehensive workflow management:
 *
 * 1. Task Prioritization & Selection (2 methods):
 *    - getNextTask: Get next priority task based on dependencies, priorities, status
 *    - getWhatNext: AI-powered suggestions for next steps
 *
 * 2. Project Reporting (3 methods):
 *    - generateStandup: Generate daily standup report
 *    - getProjectStatus: Overall project health and metrics
 *    - getInProgressTasks: All currently active tasks
 *
 * 3. Bottleneck Analysis (2 methods):
 *    - getBlockedTasks: All blocked tasks with reasons
 *    - analyzeBottlenecks: Identify workflow bottlenecks
 *
 * 4. Metrics & Analysis (3 methods):
 *    - calculateVelocity: Calculate team/project velocity
 *    - prioritizeTasks: Task prioritization logic
 *    - resolveDependencies: Check and resolve task dependencies
 *
 * Documentation Queries:
 * - mcp://context7/agile/workflow-management - Agile workflow patterns
 * - mcp://context7/agile/velocity-tracking - Velocity and metrics
 * - mcp://context7/project-management/standup - Daily standup best practices
 * - mcp://context7/project-management/bottlenecks - Bottleneck identification
 */

class WorkflowService {
  /**
   * Create a new WorkflowService instance
   *
   * @param {Object} options - Configuration options
   * @param {Object} options.issueService - IssueService instance (required)
   * @param {Object} options.epicService - EpicService instance (required)
   * @param {Object} [options.prdService] - PRDService instance (optional)
   */
  constructor(options = {}) {
    if (!options.issueService) {
      throw new Error('IssueService is required');
    }
    if (!options.epicService) {
      throw new Error('EpicService is required');
    }

    this.issueService = options.issueService;
    this.epicService = options.epicService;
    this.prdService = options.prdService;

    // Priority order: P0 (highest) -> P1 -> P2 -> P3 (lowest)
    this.priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
  }

  // ==========================================
  // 1. TASK PRIORITIZATION & SELECTION
  // ==========================================

  /**
   * Get next priority task based on dependencies, priorities, status
   *
   * Algorithm:
   * 1. Filter open tasks only
   * 2. Check dependencies (skip if any are open)
   * 3. Sort by priority (P0 > P1 > P2 > P3)
   * 4. Within same priority, oldest first
   * 5. Return top task with reasoning
   *
   * @returns {Promise<Object|null>} Next task with reasoning, or null if none available
   */
  async getNextTask() {
    try {
      // Get all issues
      const allIssues = await this.issueService.listIssues();
      if (!allIssues || allIssues.length === 0) {
        return null;
      }

      // Filter open tasks
      const openTasks = allIssues.filter(issue => {
        const status = this.issueService.categorizeStatus(issue.status);
        return status === 'open';
      });

      if (openTasks.length === 0) {
        return null;
      }

      // Check dependencies for each task
      const availableTasks = [];
      for (const task of openTasks) {
        const deps = await this.resolveDependencies(task.id);
        if (deps.resolved) {
          availableTasks.push(task);
        }
      }

      if (availableTasks.length === 0) {
        return null;
      }

      // Sort by priority
      const prioritized = this.prioritizeTasks(availableTasks);

      // Get first task
      const nextTask = prioritized[0];

      // Generate reasoning
      const reasoning = this._generateTaskReasoning(nextTask, availableTasks);

      return {
        id: nextTask.id,
        title: nextTask.title,
        status: nextTask.status,
        priority: nextTask.priority,
        epic: nextTask.epic,
        effort: nextTask.effort,
        reasoning
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate reasoning for why a task is recommended
   * @private
   */
  _generateTaskReasoning(task, allAvailable) {
    const reasons = [];

    // Priority reasoning
    const priority = task.priority || 'P2';
    if (priority === 'P0') {
      reasons.push('Highest priority (P0) - critical task');
    } else if (priority === 'P1') {
      reasons.push('High priority (P1) - important task');
    }

    // Dependencies resolved
    reasons.push('All dependencies completed');

    // Unblocked
    reasons.push('No blocking issues');

    // Count of available alternatives
    if (allAvailable.length > 1) {
      reasons.push(`${allAvailable.length - 1} other tasks also available`);
    }

    return reasons.join('. ') + '.';
  }

  /**
   * AI-powered suggestions for next steps (what to work on)
   *
   * Analyzes project state and suggests contextual next actions:
   * - No PRDs: Create first PRD
   * - No epics: Parse PRD into epic
   * - No tasks: Decompose epic
   * - Tasks available: Start working
   * - Tasks in progress: Continue work
   *
   * @returns {Promise<Object>} Suggestions with project state
   */
  async getWhatNext() {
    const projectState = await this._analyzeProjectState();
    const suggestions = this._generateSuggestions(projectState);

    return {
      projectState,
      suggestions
    };
  }

  /**
   * Analyze current project state
   * @private
   */
  async _analyzeProjectState() {
    const state = {
      prdCount: 0,
      epicCount: 0,
      issueCount: 0,
      openIssues: 0,
      inProgressIssues: 0,
      blockedIssues: 0
    };

    try {
      // Count PRDs
      if (this.prdService && this.prdService.listPRDs) {
        const prds = await this.prdService.listPRDs();
        state.prdCount = prds.length;
      }

      // Count epics
      const epics = await this.epicService.listEpics();
      state.epicCount = epics.length;

      // Count issues
      const issues = await this.issueService.listIssues();
      state.issueCount = issues.length;
      state.openIssues = issues.filter(i => this.issueService.categorizeStatus(i.status) === 'open').length;
      state.inProgressIssues = issues.filter(i => this.issueService.categorizeStatus(i.status) === 'in_progress').length;
      state.blockedIssues = issues.filter(i => (i.status || '').toLowerCase() === 'blocked').length;
    } catch (error) {
      // Errors handled gracefully
    }

    return state;
  }

  /**
   * Generate contextual suggestions
   * @private
   */
  _generateSuggestions(state) {
    const suggestions = [];

    // Scenario 1: No PRDs
    if (state.prdCount === 0) {
      suggestions.push({
        priority: 'high',
        recommended: true,
        title: 'Create Your First PRD',
        description: 'Start by defining what you want to build',
        commands: ['autopm prd create my-feature'],
        why: 'PRDs define requirements and guide development'
      });
      return suggestions;
    }

    // Scenario 2: No epics
    if (state.epicCount === 0) {
      suggestions.push({
        priority: 'high',
        recommended: true,
        title: 'Parse PRD into Epic',
        description: 'Convert requirements into executable epic',
        commands: ['autopm prd parse <prd-name>'],
        why: 'Creates epic structure needed for task breakdown'
      });
      return suggestions;
    }

    // Scenario 3: Open tasks available
    if (state.openIssues > 0) {
      suggestions.push({
        priority: 'high',
        recommended: true,
        title: 'Start Working on Tasks',
        description: `You have ${state.openIssues} tasks ready to work on`,
        commands: ['autopm pm next', 'autopm issue start <number>'],
        why: 'Begin implementation with TDD approach'
      });
    }

    // Scenario 4: Tasks in progress
    if (state.inProgressIssues > 0) {
      suggestions.push({
        priority: 'medium',
        recommended: state.openIssues === 0,
        title: 'Continue In-Progress Work',
        description: `You have ${state.inProgressIssues} tasks currently in progress`,
        commands: ['autopm pm in-progress'],
        why: 'Finish what you started before starting new work'
      });
    }

    // Scenario 5: Blocked tasks
    if (state.blockedIssues > 0) {
      suggestions.push({
        priority: 'high',
        recommended: true,
        title: 'Unblock Tasks',
        description: `${state.blockedIssues} tasks are blocked`,
        commands: ['autopm pm blocked'],
        why: 'Blocked tasks prevent progress'
      });
    }

    return suggestions;
  }

  // ==========================================
  // 2. PROJECT REPORTING
  // ==========================================

  /**
   * Generate daily standup report
   *
   * Includes:
   * - Yesterday: tasks closed in last 24h
   * - Today: tasks currently in-progress
   * - Blockers: tasks blocked and why
   * - Velocity: recent completion rate
   * - Sprint progress: overall completion
   *
   * @returns {Promise<Object>} Standup report data
   */
  async generateStandup() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const report = {
      date: now.toISOString().split('T')[0],
      yesterday: [],
      today: [],
      blockers: [],
      velocity: 0,
      sprintProgress: {
        completed: 0,
        total: 0,
        percentage: 0
      }
    };

    try {
      // Yesterday: completed tasks in last 24h
      const allIssues = await this.issueService.listIssues();
      const yesterdayTasks = allIssues.filter(issue => {
        if (!issue.completed) return false;
        const completedDate = new Date(issue.completed);
        return completedDate >= yesterday;
      });
      report.yesterday = yesterdayTasks;

      // Today: in-progress tasks
      const inProgressTasks = await this.getInProgressTasks();
      report.today = inProgressTasks;

      // Blockers: blocked tasks
      const blockedTasks = await this.getBlockedTasks();
      report.blockers = blockedTasks;

      // Velocity: 7-day average
      report.velocity = await this.calculateVelocity(7);

      // Sprint progress
      const closedCount = allIssues.filter(i => this.issueService.categorizeStatus(i.status) === 'closed').length;
      report.sprintProgress = {
        completed: closedCount,
        total: allIssues.length,
        percentage: allIssues.length > 0 ? Math.round((closedCount * 100) / allIssues.length) : 0
      };
    } catch (error) {
      // Errors handled gracefully
    }

    return report;
  }

  /**
   * Overall project health and metrics
   *
   * @returns {Promise<Object>} Project status with health indicators
   */
  async getProjectStatus() {
    const status = {
      epics: {
        backlog: 0,
        planning: 0,
        inProgress: 0,
        completed: 0,
        total: 0
      },
      issues: {
        open: 0,
        inProgress: 0,
        blocked: 0,
        closed: 0,
        total: 0
      },
      progress: {
        overall: 0,
        velocity: 0
      },
      health: 'ON_TRACK',
      recommendations: []
    };

    try {
      // Epics
      const epics = await this.epicService.listEpics();
      status.epics.total = epics.length;
      epics.forEach(epic => {
        const category = this.epicService.categorizeStatus(epic.status);
        if (category === 'backlog') status.epics.backlog++;
        else if (category === 'planning') status.epics.planning++;
        else if (category === 'in_progress') status.epics.inProgress++;
        else if (category === 'done') status.epics.completed++;
      });

      // Issues
      const issues = await this.issueService.listIssues();
      status.issues.total = issues.length;
      issues.forEach(issue => {
        const category = this.issueService.categorizeStatus(issue.status);
        if (category === 'open') status.issues.open++;
        else if (category === 'in_progress') status.issues.inProgress++;
        else if (category === 'closed') status.issues.closed++;

        if ((issue.status || '').toLowerCase() === 'blocked') {
          status.issues.blocked++;
        }
      });

      // Progress
      if (status.issues.total > 0) {
        status.progress.overall = Math.round((status.issues.closed * 100) / status.issues.total);
      }
      status.progress.velocity = await this.calculateVelocity(7);

      // Health check
      const { health, recommendations } = this._assessProjectHealth(status);
      status.health = health;
      status.recommendations = recommendations;
    } catch (error) {
      // Errors handled gracefully
    }

    return status;
  }

  /**
   * Assess project health based on metrics
   * @private
   */
  _assessProjectHealth(status) {
    let health = 'ON_TRACK';
    const recommendations = [];

    // Check for blocked tasks >2 days
    if (status.issues.blocked >= 2) {
      health = 'AT_RISK';
      recommendations.push('Unblock multiple blocked tasks preventing progress');
    }

    // Check for no velocity (only if we have tasks)
    if (status.progress.velocity === 0 && status.issues.closed === 0 && status.issues.total > 0) {
      health = 'AT_RISK';
      recommendations.push('No tasks completed recently - team may be blocked');
    }

    // Check for high WIP
    if (status.issues.inProgress > status.issues.total * 0.5 && status.issues.total >= 5) {
      recommendations.push('High work-in-progress ratio - consider finishing tasks before starting new ones');
    }

    return { health, recommendations };
  }

  /**
   * Get all currently active tasks across epics
   *
   * @returns {Promise<Array>} Array of in-progress tasks with metadata
   */
  async getInProgressTasks() {
    try {
      const allIssues = await this.issueService.listIssues();
      const inProgress = allIssues.filter(issue => {
        const category = this.issueService.categorizeStatus(issue.status);
        return category === 'in_progress';
      });

      // Mark stale tasks (>3 days)
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      return inProgress.map(task => {
        const started = task.started ? new Date(task.started).getTime() : Date.now();
        const stale = started < threeDaysAgo;

        return {
          ...task,
          stale
        };
      });
    } catch (error) {
      return [];
    }
  }

  // ==========================================
  // 3. BOTTLENECK ANALYSIS
  // ==========================================

  /**
   * Get all blocked tasks with reasons
   *
   * @returns {Promise<Array>} Array of blocked tasks with analysis
   */
  async getBlockedTasks() {
    try {
      const allIssues = await this.issueService.listIssues();
      const blocked = allIssues.filter(issue => {
        return (issue.status || '').toLowerCase() === 'blocked';
      });

      return blocked.map(task => {
        // Calculate days blocked
        const blockedSince = task.blocked_since ? new Date(task.blocked_since) : new Date();
        const daysBlocked = Math.floor((Date.now() - blockedSince.getTime()) / (24 * 60 * 60 * 1000));

        // Suggest action
        let suggestedAction = 'Review blocking dependencies';
        if (task.dependencies && task.dependencies.length > 0) {
          suggestedAction = `Complete dependencies: ${task.dependencies.join(', ')}`;
        }

        return {
          id: task.id,
          title: task.title,
          reason: task.blocked_reason || 'Unknown',
          daysBlocked,
          suggestedAction
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Identify workflow bottlenecks
   *
   * Analyzes:
   * - Blocked tasks
   * - Stale in-progress tasks
   * - High WIP ratio
   *
   * @returns {Promise<Array>} Array of bottleneck objects
   */
  async analyzeBottlenecks() {
    const bottlenecks = [];

    try {
      const allIssues = await this.issueService.listIssues();

      // Check for blocked tasks
      const blocked = allIssues.filter(i => (i.status || '').toLowerCase() === 'blocked');
      if (blocked.length > 0) {
        bottlenecks.push({
          type: 'BLOCKED_TASKS',
          count: blocked.length,
          severity: blocked.length >= 3 ? 'HIGH' : 'MEDIUM',
          description: `${blocked.length} tasks are blocked`
        });
      }

      // Check for stale in-progress tasks
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const stale = allIssues.filter(issue => {
        const category = this.issueService.categorizeStatus(issue.status);
        if (category !== 'in_progress') return false;
        const started = issue.started ? new Date(issue.started).getTime() : Date.now();
        return started < threeDaysAgo;
      });

      if (stale.length > 0) {
        bottlenecks.push({
          type: 'STALE_TASKS',
          count: stale.length,
          severity: 'MEDIUM',
          description: `${stale.length} tasks in progress for >3 days`
        });
      }
    } catch (error) {
      // Errors handled gracefully
    }

    return bottlenecks;
  }

  // ==========================================
  // 4. METRICS & ANALYSIS
  // ==========================================

  /**
   * Calculate team/project velocity
   *
   * Velocity = tasks completed / time period (days)
   *
   * @param {number} days - Number of days to calculate over (default: 7)
   * @returns {Promise<number>} Tasks per day
   */
  async calculateVelocity(days = 7) {
    try {
      const allIssues = await this.issueService.listIssues();
      const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

      const recentCompletions = allIssues.filter(issue => {
        if (!issue.completed) return false;
        const completedDate = new Date(issue.completed).getTime();
        return completedDate >= cutoffDate;
      });

      const velocity = recentCompletions.length / days;
      return Math.round(velocity * 10) / 10; // Round to 1 decimal
    } catch (error) {
      return 0;
    }
  }

  /**
   * Task prioritization logic
   *
   * Sorts by:
   * 1. Priority (P0 > P1 > P2 > P3)
   * 2. Creation date (oldest first within same priority)
   *
   * @param {Array} tasks - Array of task objects
   * @returns {Array} Sorted tasks
   */
  prioritizeTasks(tasks) {
    if (!Array.isArray(tasks)) {
      return [];
    }

    return [...tasks].sort((a, b) => {
      // Priority first
      const aPriority = this.priorityOrder[a.priority] ?? this.priorityOrder['P2'];
      const bPriority = this.priorityOrder[b.priority] ?? this.priorityOrder['P2'];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Creation date second (older first)
      const aCreated = a.created ? new Date(a.created).getTime() : 0;
      const bCreated = b.created ? new Date(b.created).getTime() : 0;
      return aCreated - bCreated;
    });
  }

  /**
   * Check and resolve task dependencies
   *
   * @param {string|number} issueNumber - Issue number to check
   * @returns {Promise<Object>} { resolved: boolean, blocking: Array }
   */
  async resolveDependencies(issueNumber) {
    try {
      const dependencies = await this.issueService.getDependencies(issueNumber);

      if (!dependencies || dependencies.length === 0) {
        return { resolved: true, blocking: [] };
      }

      const blocking = [];
      for (const depId of dependencies) {
        try {
          const dep = await this.issueService.getLocalIssue(depId);
          const category = this.issueService.categorizeStatus(dep.status);
          if (category !== 'closed') {
            blocking.push(depId);
          }
        } catch (error) {
          // If we can't read dependency, consider it blocking
          blocking.push(depId);
        }
      }

      return {
        resolved: blocking.length === 0,
        blocking
      };
    } catch (error) {
      return { resolved: true, blocking: [] };
    }
  }
}

module.exports = WorkflowService;
