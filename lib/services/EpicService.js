/**
 * EpicService - Epic Management Service
 *
 * Pure service layer for epic operations without any I/O operations.
 * Follows 3-layer architecture: Service (logic) -> No direct I/O
 *
 * Provides 12 pure business logic methods:
 *
 * 1. Status & Categorization (5 methods):
 *    - categorizeStatus: Categorize epic status
 *    - isTaskClosed: Check if task is completed
 *    - calculateProgress: Calculate completion percentage
 *    - generateProgressBar: Generate visual progress bar
 *    - hasValidDependencies: Validate dependency format
 *
 * 2. GitHub Integration (2 methods):
 *    - extractGitHubIssue: Extract issue number from URL
 *    - formatGitHubUrl: Build GitHub URL
 *
 * 3. Content Analysis (3 methods):
 *    - analyzePRD: Analyze PRD using PRDService
 *    - determineDependencies: Determine feature dependencies
 *    - generateEpicMetadata: Generate epic frontmatter
 *
 * 4. Content Generation (2 methods):
 *    - generateEpicContent: Build complete epic markdown
 *    - buildTaskSection: Format tasks as markdown list
 *
 * Documentation Queries:
 * - mcp://context7/agile/epic-management - Epic management best practices
 * - mcp://context7/agile/task-breakdown - Task breakdown patterns
 * - mcp://context7/project-management/dependencies - Dependency management
 * - mcp://context7/markdown/frontmatter - YAML frontmatter patterns
 */

const PRDService = require('./PRDService');

class EpicService {
  /**
   * Create a new EpicService instance
   *
   * @param {Object} options - Configuration options
   * @param {PRDService} options.prdService - PRDService instance for parsing
   */
  constructor(options = {}) {
    if (!options.prdService) {
      throw new Error('PRDService instance is required');
    }

    if (!(options.prdService instanceof PRDService)) {
      throw new Error('prdService must be an instance of PRDService');
    }

    this.prdService = options.prdService;
  }

  // ==========================================
  // 1. STATUS & CATEGORIZATION (5 METHODS)
  // ==========================================

  /**
   * Categorize epic status into standard buckets
   *
   * Maps various status strings to standardized categories:
   * - backlog: Not started, awaiting prioritization
   * - planning: Planning/draft phase
   * - in_progress: Active development
   * - done: Completed/closed
   *
   * @param {string} status - Raw status string
   * @returns {string} Categorized status (backlog|planning|in_progress|done)
   *
   * @example
   * categorizeStatus('in-progress')  // Returns 'in_progress'
   * categorizeStatus('completed')    // Returns 'done'
   * categorizeStatus('unknown')      // Returns 'planning' (default)
   */
  categorizeStatus(status) {
    const lowerStatus = (status || '').toLowerCase();

    // Backlog statuses
    if (lowerStatus === 'backlog') {
      return 'backlog';
    }

    // Planning statuses
    if (['planning', 'draft', ''].includes(lowerStatus)) {
      return 'planning';
    }

    // In-progress statuses
    if (['in-progress', 'in_progress', 'active', 'started'].includes(lowerStatus)) {
      return 'in_progress';
    }

    // Completed statuses
    if (['completed', 'complete', 'done', 'closed', 'finished'].includes(lowerStatus)) {
      return 'done';
    }

    // Default to planning for unknown statuses
    return 'planning';
  }

  /**
   * Check if task is in closed/completed state
   *
   * @param {Object} task - Task object with status field
   * @returns {boolean} True if task is closed/completed
   *
   * @example
   * isTaskClosed({ status: 'closed' })     // Returns true
   * isTaskClosed({ status: 'open' })       // Returns false
   */
  isTaskClosed(task) {
    const status = (task?.status || '').toLowerCase();
    return ['closed', 'completed'].includes(status);
  }

  /**
   * Calculate progress percentage from task array
   *
   * Calculates completion percentage based on closed vs total tasks.
   * Returns 0 for empty or null arrays.
   *
   * @param {Array<Object>} tasks - Array of task objects with status
   * @returns {number} Progress percentage (0-100), rounded to nearest integer
   *
   * @example
   * calculateProgress([
   *   { status: 'closed' },
   *   { status: 'open' }
   * ])  // Returns 50
   */
  calculateProgress(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return 0;
    }

    const closedCount = tasks.filter(task => this.isTaskClosed(task)).length;
    const percent = Math.round((closedCount * 100) / tasks.length);

    return percent;
  }

  /**
   * Generate visual progress bar
   *
   * Creates ASCII progress bar with filled/empty characters.
   *
   * @param {number} percent - Progress percentage (0-100)
   * @param {number} totalChars - Total bar length in characters (default: 20)
   * @returns {Object} Progress bar data:
   *   - bar: String representation of progress bar
   *   - percent: Input percentage
   *   - filled: Number of filled characters
   *   - empty: Number of empty characters
   *
   * @example
   * generateProgressBar(50, 20)
   * // Returns: {
   * //   bar: '[██████████░░░░░░░░░░]',
   * //   percent: 50,
   * //   filled: 10,
   * //   empty: 10
   * // }
   */
  generateProgressBar(percent, totalChars = 20) {
    const filled = Math.round((percent * totalChars) / 100);
    const empty = totalChars - filled;

    let bar = '[';
    bar += '█'.repeat(filled);
    bar += '░'.repeat(empty);
    bar += ']';

    return {
      bar,
      percent,
      filled,
      empty
    };
  }

  /**
   * Validate if dependency string has valid content
   *
   * Checks if dependency string contains actual dependency data
   * after cleaning up formatting (brackets, whitespace, etc).
   *
   * @param {string} dependencies - Dependency string to validate
   * @returns {boolean} True if dependencies are present and valid
   *
   * @example
   * hasValidDependencies('epic-123')        // Returns true
   * hasValidDependencies('[epic-1, epic-2]') // Returns true
   * hasValidDependencies('[]')              // Returns false
   * hasValidDependencies('depends_on:')     // Returns false
   */
  hasValidDependencies(dependencies) {
    if (!dependencies || typeof dependencies !== 'string') {
      return false;
    }

    // Handle malformed dependency strings
    if (dependencies === 'depends_on:') {
      return false;
    }

    // Clean up the dependency string
    let cleanDeps = dependencies.trim();

    // Remove array brackets if present
    cleanDeps = cleanDeps.replace(/^\[|\]$/g, '');

    // Check if there's actual content after cleaning
    cleanDeps = cleanDeps.trim();

    return cleanDeps.length > 0;
  }

  // ==========================================
  // 2. GITHUB INTEGRATION (2 METHODS)
  // ==========================================

  /**
   * Extract GitHub issue number from URL
   *
   * Extracts numeric issue/PR number from GitHub URL.
   * Supports both issues and pull requests.
   *
   * @param {string} githubUrl - GitHub issue or PR URL
   * @returns {string|null} Issue number or null if not found
   *
   * @example
   * extractGitHubIssue('https://github.com/user/repo/issues/123')
   * // Returns '123'
   *
   * extractGitHubIssue('https://github.com/user/repo/pull/456')
   * // Returns '456'
   */
  extractGitHubIssue(githubUrl) {
    if (!githubUrl) {
      return null;
    }

    // Match issue/PR number at end of URL (before optional trailing slash or query params)
    const match = githubUrl.match(/\/(\d+)(?:\/|\?|$)/);
    return match ? match[1] : null;
  }

  /**
   * Format GitHub issue URL from components
   *
   * Builds standard GitHub issue URL from owner, repo, and issue number.
   *
   * @param {string} repoOwner - GitHub repository owner
   * @param {string} repoName - GitHub repository name
   * @param {number|string} issueNumber - Issue number
   * @returns {string} Formatted GitHub URL
   * @throws {Error} If required parameters are missing
   *
   * @example
   * formatGitHubUrl('user', 'repo', 123)
   * // Returns 'https://github.com/user/repo/issues/123'
   */
  formatGitHubUrl(repoOwner, repoName, issueNumber) {
    if (!repoOwner || repoOwner.trim() === '') {
      throw new Error('Repository owner is required');
    }

    if (!repoName || repoName.trim() === '') {
      throw new Error('Repository name is required');
    }

    if (!issueNumber) {
      throw new Error('Issue number is required');
    }

    return `https://github.com/${repoOwner}/${repoName}/issues/${issueNumber}`;
  }

  // ==========================================
  // 3. CONTENT ANALYSIS (3 METHODS)
  // ==========================================

  /**
   * Analyze PRD content using PRDService
   *
   * Parses PRD markdown to extract frontmatter and sections.
   * Uses injected PRDService for parsing logic.
   *
   * @param {string} prdContent - PRD markdown content
   * @returns {Object} Analysis result:
   *   - frontmatter: Parsed YAML frontmatter
   *   - sections: Extracted PRD sections (vision, features, etc)
   *
   * @example
   * analyzePRD(prdMarkdown)
   * // Returns:
   * // {
   * //   frontmatter: { title: 'Feature', priority: 'P1' },
   * //   sections: { vision: '...', features: [...] }
   * // }
   */
  analyzePRD(prdContent) {
    const frontmatter = this.prdService.parseFrontmatter(prdContent);
    const sections = this.prdService.extractPrdContent(prdContent);

    return {
      frontmatter,
      sections
    };
  }

  /**
   * Determine dependencies between features
   *
   * Analyzes feature types to determine natural dependencies:
   * - Frontend depends on Backend
   * - Backend depends on Data
   * - Integration depends on all others
   *
   * @param {Array<Object>} features - Array of feature objects with type
   * @returns {Object} Dependency map: { featureName: [dependency1, dependency2] }
   *
   * @example
   * determineDependencies([
   *   { name: 'UI', type: 'frontend' },
   *   { name: 'API', type: 'backend' }
   * ])
   * // Returns: { 'UI': ['API'] }
   */
  determineDependencies(features) {
    if (!Array.isArray(features) || features.length === 0) {
      return {};
    }

    const dependencies = {};

    // Find features by type
    const backendFeatures = features.filter(f => f.type === 'backend');
    const dataFeatures = features.filter(f => f.type === 'data');
    const frontendFeatures = features.filter(f => f.type === 'frontend');

    // Frontend depends on Backend
    frontendFeatures.forEach(frontend => {
      if (backendFeatures.length > 0) {
        dependencies[frontend.name] = backendFeatures.map(b => b.name);
      }
    });

    // Backend depends on Data
    backendFeatures.forEach(backend => {
      if (dataFeatures.length > 0) {
        dependencies[backend.name] = dataFeatures.map(d => d.name);
      }
    });

    return dependencies;
  }

  /**
   * Generate epic metadata (frontmatter)
   *
   * Creates standardized epic frontmatter with required and optional fields.
   *
   * @param {string} name - Epic name
   * @param {string} prdId - PRD identifier
   * @param {Object} options - Optional metadata overrides
   * @param {string} options.status - Epic status (default: 'backlog')
   * @param {string} options.priority - Priority level (default: 'P2')
   * @returns {Object} Epic metadata object
   * @throws {Error} If required parameters are missing
   *
   * @example
   * generateEpicMetadata('user-auth', 'prd-123', { priority: 'P1' })
   * // Returns:
   * // {
   * //   name: 'user-auth',
   * //   status: 'backlog',
   * //   prd_id: 'prd-123',
   * //   priority: 'P1',
   * //   created: '2025-01-01T00:00:00.000Z',
   * //   progress: '0%',
   * //   prd: '.claude/prds/user-auth.md',
   * //   github: '[Will be updated when synced to GitHub]'
   * // }
   */
  generateEpicMetadata(name, prdId, options = {}) {
    if (!name || name.trim() === '') {
      throw new Error('Epic name is required');
    }

    if (!prdId || prdId.trim() === '') {
      throw new Error('PRD ID is required');
    }

    const now = new Date().toISOString();

    return {
      name,
      status: options.status || 'backlog',
      prd_id: prdId,
      priority: options.priority || 'P2',
      created: now,
      progress: '0%',
      prd: `.claude/prds/${name}.md`,
      github: '[Will be updated when synced to GitHub]'
    };
  }

  // ==========================================
  // 4. CONTENT GENERATION (2 METHODS)
  // ==========================================

  /**
   * Generate complete epic markdown content
   *
   * Builds full epic document with frontmatter, sections, and tasks.
   * Follows standard epic template format.
   *
   * @param {Object} metadata - Epic metadata (frontmatter)
   * @param {Object} sections - PRD sections (vision, problem, features, etc)
   * @param {Array<Object>} tasks - Array of task objects
   * @returns {string} Complete epic markdown content
   *
   * @example
   * generateEpicContent(metadata, sections, tasks)
   * // Returns multiline markdown string with:
   * // - YAML frontmatter
   * // - Epic title and overview
   * // - Vision and other sections
   * // - Task breakdown
   */
  generateEpicContent(metadata, sections, tasks) {
    // Build frontmatter
    const frontmatter = `---
name: ${metadata.name}
status: ${metadata.status}
created: ${metadata.created}
progress: ${metadata.progress}
prd: ${metadata.prd}
github: ${metadata.github}
priority: ${metadata.priority}
---`;

    // Build overview section
    let content = frontmatter + '\n\n';
    content += `# Epic: ${metadata.name}\n\n`;
    content += '## Overview\n';

    if (sections.vision) {
      content += sections.vision + '\n\n';
      content += `### Vision\n${sections.vision}\n\n`;
    }

    if (sections.problem) {
      content += `### Problem\n${sections.problem}\n\n`;
    }

    // Build task breakdown
    content += '## Task Breakdown\n\n';
    const taskSection = this.buildTaskSection(tasks);
    content += taskSection;

    return content;
  }

  /**
   * Build task section markdown
   *
   * Formats task array as markdown list with details.
   * Each task includes: ID, title, type, effort, status.
   *
   * @param {Array<Object>} tasks - Array of task objects
   * @returns {string} Markdown formatted task list
   *
   * @example
   * buildTaskSection([
   *   { id: 'TASK-1', title: 'Setup', type: 'setup', effort: '2h', status: 'open' }
   * ])
   * // Returns:
   * // ### TASK-1: Setup
   * // - **Type**: setup
   * // - **Effort**: 2h
   * // - **Status**: open
   */
  buildTaskSection(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return '';
    }

    return tasks.map(task => {
      const status = task.status || 'Not Started';
      return `### ${task.id}: ${task.title}
- **Type**: ${task.type}
- **Effort**: ${task.effort}
- **Status**: ${status}`;
    }).join('\n\n');
  }
}

module.exports = EpicService;
