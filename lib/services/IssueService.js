/**
 * IssueService - Issue Management Service
 *
 * Pure service layer for issue operations following ClaudeAutoPM patterns.
 * Follows 3-layer architecture: Service (logic) -> Provider (I/O) -> CLI (presentation)
 *
 * Provides comprehensive issue lifecycle management:
 *
 * 1. Issue Metadata & Parsing (4 methods):
 *    - parseIssueMetadata: Parse YAML frontmatter from issue content
 *    - getLocalIssue: Read local issue file with metadata
 *    - getIssueStatus: Get current status of an issue
 *    - validateIssue: Validate issue structure and required fields
 *
 * 2. Issue Lifecycle Management (2 methods):
 *    - updateIssueStatus: Update status with automatic timestamps
 *    - listIssues: List all issues with optional filtering
 *
 * 3. Issue Relationships (3 methods):
 *    - getIssueFiles: Find all files related to an issue
 *    - getSubIssues: Get child issues
 *    - getDependencies: Get blocking issues
 *
 * 4. Provider Integration (2 methods):
 *    - syncIssueToProvider: Push local changes to GitHub/Azure
 *    - syncIssueFromProvider: Pull updates from provider
 *
 * 5. Utility Methods (4 methods):
 *    - categorizeStatus: Categorize status into standard buckets
 *    - isIssueClosed: Check if issue is closed
 *    - getIssuePath: Get file path for issue
 *    - formatIssueDuration: Format time duration
 *
 * Documentation Queries:
 * - GitHub Issues API v3 best practices (2025)
 * - Azure DevOps work items REST API patterns
 * - Agile issue tracking workflow best practices
 * - mcp://context7/project-management/issue-tracking - Issue lifecycle management
 * - mcp://context7/markdown/frontmatter - YAML frontmatter patterns
 */

class IssueService {
  /**
   * Create a new IssueService instance
   *
   * @param {Object} options - Configuration options
   * @param {Object} options.provider - Provider instance for GitHub/Azure (optional)
   * @param {string} [options.issuesDir] - Path to issues directory (default: .claude/issues)
   * @param {string} [options.defaultStatus] - Default issue status (default: open)
   */
  constructor(options = {}) {
    // Provider for GitHub/Azure integration (optional)
    this.provider = options.provider || null;

    // CLI operation options
    this.options = {
      issuesDir: options.issuesDir || '.claude/issues',
      defaultStatus: options.defaultStatus || 'open',
      ...options
    };
  }

  // ==========================================
  // 1. ISSUE METADATA & PARSING (4 METHODS)
  // ==========================================

  /**
   * Parse YAML frontmatter from issue content
   *
   * Extracts key-value pairs from YAML frontmatter block.
   * Returns null if frontmatter is missing or malformed.
   *
   * @param {string} content - Issue markdown content with frontmatter
   * @returns {Object|null} Parsed frontmatter object or null
   *
   * @example
   * parseIssueMetadata(`---
   * id: 123
   * title: Fix bug
   * status: open
   * ---
   * # Issue Details`)
   * // Returns: { id: '123', title: 'Fix bug', status: 'open' }
   */
  parseIssueMetadata(content) {
    if (!content || typeof content !== 'string') {
      return null;
    }

    // Match frontmatter block: ---\n...\n--- or ---\n---
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/) ||
                             content.match(/^---\n---/);

    if (!frontmatterMatch) {
      return null;
    }

    // Empty frontmatter (---\n---)
    if (!frontmatterMatch[1] && content.startsWith('---\n---')) {
      return {};
    }

    const metadata = {};
    const lines = (frontmatterMatch[1] || '').split('\n');

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) {
        continue;
      }

      // Find first colon to split key and value
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        continue; // Skip lines without colons
      }

      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (key) {
        metadata[key] = value;
      }
    }

    return metadata;
  }

  /**
   * Read local issue file with metadata
   *
   * @param {number|string} issueNumber - Issue number
   * @returns {Promise<Object>} Issue data with metadata and content
   * @throws {Error} If issue not found
   *
   * @example
   * await getLocalIssue(123)
   * // Returns: { id: '123', title: '...', status: '...', content: '...' }
   */
  async getLocalIssue(issueNumber) {
    const fs = require('fs-extra');

    const issuePath = this.getIssuePath(issueNumber);

    // Check if issue exists
    const exists = await fs.pathExists(issuePath);
    if (!exists) {
      throw new Error(`Issue not found: ${issueNumber}`);
    }

    // Read issue content
    const content = await fs.readFile(issuePath, 'utf8');
    const metadata = this.parseIssueMetadata(content);

    return {
      ...metadata,
      content,
      path: issuePath
    };
  }

  /**
   * Get current status of an issue
   *
   * @param {number|string} issueNumber - Issue number
   * @returns {Promise<string>} Current status
   * @throws {Error} If issue not found
   */
  async getIssueStatus(issueNumber) {
    try {
      const issue = await this.getLocalIssue(issueNumber);
      return issue.status || this.options.defaultStatus;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new Error(`Issue not found: ${issueNumber}`);
      }
      throw error;
    }
  }

  /**
   * Validate issue structure and completeness
   *
   * @param {number|string} issueNumber - Issue number
   * @returns {Promise<Object>} Validation result: { valid: boolean, issues: string[] }
   * @throws {Error} If issue not found
   */
  async validateIssue(issueNumber) {
    const fs = require('fs-extra');

    const issuePath = this.getIssuePath(issueNumber);

    // Check if issue exists
    const exists = await fs.pathExists(issuePath);
    if (!exists) {
      throw new Error(`Issue not found: ${issueNumber}`);
    }

    const issues = [];

    // Read issue content
    const content = await fs.readFile(issuePath, 'utf8');

    // Check for frontmatter
    const metadata = this.parseIssueMetadata(content);
    if (!metadata) {
      issues.push('Missing frontmatter');
    } else {
      // Check for required fields
      if (!metadata.id) {
        issues.push('Missing id in frontmatter');
      }
      if (!metadata.title) {
        issues.push('Missing title in frontmatter');
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // ==========================================
  // 2. ISSUE LIFECYCLE MANAGEMENT (2 METHODS)
  // ==========================================

  /**
   * Update issue status with automatic timestamps
   *
   * @param {number|string} issueNumber - Issue number
   * @param {string} newStatus - New status to set
   * @returns {Promise<void>}
   * @throws {Error} If issue not found
   */
  async updateIssueStatus(issueNumber, newStatus) {
    const fs = require('fs-extra');

    const issuePath = this.getIssuePath(issueNumber);

    // Check if issue exists
    const exists = await fs.pathExists(issuePath);
    if (!exists) {
      throw new Error(`Issue not found: ${issueNumber}`);
    }

    // Read current content
    let content = await fs.readFile(issuePath, 'utf8');

    // Update status
    content = content.replace(/^status:\s*.+$/m, `status: ${newStatus}`);

    const now = new Date().toISOString();

    // Add started timestamp when moving to in-progress
    if (newStatus === 'in-progress' && !content.includes('started:')) {
      // Try to add after created: field, or after status: if no created: field
      if (content.includes('created:')) {
        content = content.replace(/^(created:.+)$/m, `$1\nstarted: ${now}`);
      } else {
        content = content.replace(/^(status:.+)$/m, `$1\nstarted: ${now}`);
      }
    }

    // Add completed timestamp when closing
    if (['closed', 'completed', 'done', 'resolved'].includes(newStatus.toLowerCase()) &&
        !content.includes('completed:')) {
      // Try to add after created: field, or after status: if no created: field
      if (content.includes('created:')) {
        content = content.replace(/^(created:.+)$/m, `$1\ncompleted: ${now}`);
      } else {
        content = content.replace(/^(status:.+)$/m, `$1\ncompleted: ${now}`);
      }
    }

    // Write updated content
    await fs.writeFile(issuePath, content);
  }

  /**
   * List all issues with optional filtering
   *
   * @param {Object} [options] - Filter options
   * @param {string} [options.status] - Filter by status
   * @returns {Promise<Array<Object>>} Array of issue objects with metadata
   */
  async listIssues(options = {}) {
    const fs = require('fs-extra');
    const path = require('path');

    const issuesDir = path.join(process.cwd(), this.options.issuesDir);

    // Check if issues directory exists
    const dirExists = await fs.pathExists(issuesDir);
    if (!dirExists) {
      return [];
    }

    // Read all issue files
    let files;
    try {
      files = await fs.readdir(issuesDir);
      // Only process .md files with numeric names
      files = files.filter(file => /^\d+\.md$/.test(file));
    } catch (error) {
      return [];
    }

    const issues = [];

    for (const file of files) {
      const filePath = path.join(issuesDir, file);

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const metadata = this.parseIssueMetadata(content);

        if (metadata) {
          // Apply default status if missing
          metadata.status = metadata.status || this.options.defaultStatus;

          // Filter by status if specified
          if (options.status && metadata.status !== options.status) {
            continue;
          }

          issues.push({
            ...metadata,
            path: filePath
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return issues;
  }

  // ==========================================
  // 3. ISSUE RELATIONSHIPS (3 METHODS)
  // ==========================================

  /**
   * Find all files related to an issue
   *
   * @param {number|string} issueNumber - Issue number
   * @returns {Promise<Array<string>>} Array of related file names
   */
  async getIssueFiles(issueNumber) {
    const fs = require('fs-extra');
    const path = require('path');

    const issuesDir = path.join(process.cwd(), this.options.issuesDir);

    // Check if issues directory exists
    const dirExists = await fs.pathExists(issuesDir);
    if (!dirExists) {
      return [];
    }

    // Read all files
    try {
      const files = await fs.readdir(issuesDir);

      // Filter files that start with issue number
      const issueStr = String(issueNumber);
      const relatedFiles = files.filter(file => {
        return file.startsWith(`${issueStr}.md`) ||
               file.startsWith(`${issueStr}-`);
      });

      return relatedFiles;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get child issues of a parent issue
   *
   * @param {number|string} issueNumber - Parent issue number
   * @returns {Promise<Array<string>>} Array of child issue numbers
   */
  async getSubIssues(issueNumber) {
    try {
      const issue = await this.getLocalIssue(issueNumber);
      const children = issue.children;

      if (!children) {
        return [];
      }

      // Parse children (can be array [101, 102] or string "101, 102")
      if (typeof children === 'string') {
        // Remove brackets and split by comma
        const cleaned = children.replace(/[\[\]]/g, '');
        return cleaned.split(',').map(c => c.trim()).filter(c => c);
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get blocking issues (dependencies)
   *
   * @param {number|string} issueNumber - Issue number
   * @returns {Promise<Array<string>>} Array of blocking issue numbers
   */
  async getDependencies(issueNumber) {
    try {
      const issue = await this.getLocalIssue(issueNumber);
      const dependencies = issue.dependencies || issue.blocked_by;

      if (!dependencies) {
        return [];
      }

      // Parse dependencies (can be array [120, 121] or string "120, 121")
      if (typeof dependencies === 'string') {
        // Remove brackets and split by comma
        const cleaned = dependencies.replace(/[\[\]]/g, '');
        return cleaned.split(',').map(d => d.trim()).filter(d => d);
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  // ==========================================
  // 4. PROVIDER INTEGRATION (2 METHODS)
  // ==========================================

  /**
   * Push local issue changes to GitHub/Azure
   *
   * @param {number|string} issueNumber - Issue number
   * @returns {Promise<Object>} Sync result
   * @throws {Error} If no provider configured
   */
  async syncIssueToProvider(issueNumber) {
    if (!this.provider || !this.provider.updateIssue) {
      throw new Error('No provider configured for syncing');
    }

    // Read local issue
    const issue = await this.getLocalIssue(issueNumber);

    // Push to provider
    const result = await this.provider.updateIssue(issue);

    return result;
  }

  /**
   * Pull issue updates from GitHub/Azure
   *
   * @param {number|string} issueNumber - Issue number
   * @returns {Promise<Object>} Updated issue data
   * @throws {Error} If no provider configured
   */
  async syncIssueFromProvider(issueNumber) {
    const fs = require('fs-extra');

    if (!this.provider || !this.provider.getIssue) {
      throw new Error('No provider configured for syncing');
    }

    // Fetch from provider
    const issueData = await this.provider.getIssue(String(issueNumber));

    // Build issue content with frontmatter
    const frontmatter = `---
id: ${issueData.id}
title: ${issueData.title}
status: ${issueData.status}
${issueData.assignees && issueData.assignees.length > 0 ? `assignee: ${issueData.assignees[0]}` : ''}
${issueData.labels && issueData.labels.length > 0 ? `labels: ${issueData.labels.join(', ')}` : ''}
created: ${issueData.createdAt}
updated: ${issueData.updatedAt}
${issueData.url ? `url: ${issueData.url}` : ''}
---

# ${issueData.title}

${issueData.description || ''}
`;

    // Write to local file
    const issuePath = this.getIssuePath(issueNumber);
    await fs.writeFile(issuePath, frontmatter);

    return issueData;
  }

  // ==========================================
  // 5. UTILITY METHODS (4 METHODS)
  // ==========================================

  /**
   * Categorize issue status into standard buckets
   *
   * Maps various status strings to standardized categories:
   * - open: Not started, awaiting work
   * - in_progress: Active development
   * - closed: Completed/resolved
   *
   * @param {string} status - Raw status string
   * @returns {string} Categorized status (open|in_progress|closed)
   */
  categorizeStatus(status) {
    const lowerStatus = (status || '').toLowerCase();

    // Open statuses
    if (['open', 'todo', 'new', ''].includes(lowerStatus)) {
      return 'open';
    }

    // In-progress statuses
    if (['in-progress', 'in_progress', 'active', 'started'].includes(lowerStatus)) {
      return 'in_progress';
    }

    // Closed statuses
    if (['closed', 'completed', 'done', 'resolved'].includes(lowerStatus)) {
      return 'closed';
    }

    // Default to open for unknown statuses
    return 'open';
  }

  /**
   * Check if issue is in closed/completed state
   *
   * @param {Object} issue - Issue object with status field
   * @returns {boolean} True if issue is closed
   */
  isIssueClosed(issue) {
    if (!issue || !issue.status) {
      return false;
    }

    const status = (issue.status || '').toLowerCase();
    return ['closed', 'completed', 'done', 'resolved'].includes(status);
  }

  /**
   * Get file path for issue
   *
   * @param {number|string} issueNumber - Issue number
   * @returns {string} Full path to issue file
   */
  getIssuePath(issueNumber) {
    const path = require('path');
    return path.join(process.cwd(), this.options.issuesDir, `${issueNumber}.md`);
  }

  /**
   * Format time duration between two timestamps
   *
   * @param {string} startTime - ISO timestamp for start
   * @param {string} [endTime] - ISO timestamp for end (defaults to now)
   * @returns {string} Formatted duration (e.g., "2h 30m", "3 days 4h")
   */
  formatIssueDuration(startTime, endTime = null) {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end - start;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }
}

module.exports = IssueService;
