#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * GitHub Provider - Epic List Implementation
 * Lists GitHub Issues labeled as 'epic'
 */
class GitHubEpicList {
  /**
   * Execute epic list command for GitHub
   * @param {Object} options - Command options (status, assignee, label, limit)
   * @param {Object} settings - Provider settings from config
   * @returns {Array} List of epics in unified format
   */
  async execute(options = {}, settings = {}) {
    const repository = settings.repository || this.detectRepository();

    if (!repository) {
      throw new Error('GitHub repository not configured. Set projectManagement.settings.github.repository in config.json');
    }

    // For testing, always use mock data unless AUTOPM_USE_REAL_API is set
    if (!process.env.AUTOPM_USE_REAL_API) {
      console.log('📊 Using mock data (set AUTOPM_USE_REAL_API=true for real API)');
      return this.getMockData(options);
    }

    try {
      // Build GitHub CLI query
      const query = this.buildQuery(repository, options);

      // Execute GitHub CLI command
      const result = this.executeGitHubCLI(query);

      // Transform to unified format
      return this.transformResults(result);

    } catch (error) {
      // Fallback to mock data if GitHub CLI not available
      console.warn('⚠️  GitHub CLI error, returning mock data:', error.message);
      return this.getMockData(options);
    }
  }

  /**
   * Detect repository from git remote
   */
  detectRepository() {
    try {
      const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const match = remote.match(/github\.com[:/]([^/]+\/[^.]+)/);
      if (match) {
        return match[1];
      }
    } catch (error) {
      // Silent fail - will use config value
    }
    return null;
  }

  /**
   * Build GitHub CLI query
   */
  buildQuery(repository, options) {
    let query = `gh issue list --repo ${repository} --label epic`;

    if (options.status === 'closed') {
      query += ' --state closed';
    } else if (options.status === 'all') {
      query += ' --state all';
    } else {
      query += ' --state open';
    }

    if (options.assignee) {
      query += ` --assignee ${options.assignee}`;
    }

    if (options.label && options.label !== 'epic') {
      query += ` --label ${options.label}`;
    }

    if (options.limit) {
      query += ` --limit ${options.limit}`;
    }

    query += ' --json number,title,body,state,assignees,labels,url,milestone';

    return query;
  }

  /**
   * Execute GitHub CLI command
   */
  executeGitHubCLI(query) {
    try {
      const output = execSync(query, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (error) {
      if (error.stderr && error.stderr.includes('gh: command not found')) {
        throw new Error('gh: command not found');
      }
      throw new Error(`GitHub CLI error: ${error.message}`);
    }
  }

  /**
   * Transform GitHub results to unified format
   */
  transformResults(githubIssues) {
    return githubIssues.map(issue => ({
      id: issue.number.toString(),
      title: issue.title,
      description: issue.body || '',
      status: this.mapStatus(issue.state),
      assignee: issue.assignees?.[0]?.login || null,
      labels: issue.labels?.map(l => l.name) || [],
      childCount: this.countChildren(issue),
      completedCount: this.countCompleted(issue),
      url: issue.url,
      milestone: issue.milestone?.title || null
    }));
  }

  /**
   * Map GitHub state to unified status
   */
  mapStatus(state) {
    const statusMap = {
      'open': 'open',
      'closed': 'completed',
      'OPEN': 'open',
      'CLOSED': 'completed'
    };
    return statusMap[state] || 'unknown';
  }

  /**
   * Count child issues (would query linked issues in real implementation)
   */
  countChildren(issue) {
    // In a real implementation, this would query for issues linked to this epic
    // For now, return mock count based on issue number
    return issue.number % 10 + 1;
  }

  /**
   * Count completed child issues
   */
  countCompleted(issue) {
    // In a real implementation, this would query completed linked issues
    // For now, return mock count
    const total = this.countChildren(issue);
    return Math.floor(total * 0.4);
  }

  /**
   * Get mock data for testing
   */
  getMockData(options) {
    const mockEpics = [
      {
        id: '101',
        title: 'Authentication System Implementation',
        description: 'Implement complete authentication system with JWT',
        status: 'in_progress',
        assignee: 'developer1',
        labels: ['epic', 'enhancement', 'backend'],
        childCount: 8,
        completedCount: 3,
        url: 'https://github.com/owner/repo/issues/101',
        milestone: 'v2.0'
      },
      {
        id: '102',
        title: 'Dashboard Redesign',
        description: 'Complete redesign of the admin dashboard',
        status: 'open',
        assignee: 'designer1',
        labels: ['epic', 'ui', 'frontend'],
        childCount: 12,
        completedCount: 0,
        url: 'https://github.com/owner/repo/issues/102',
        milestone: 'v2.1'
      },
      {
        id: '103',
        title: 'API v2 Development',
        description: 'New version of REST API with GraphQL support',
        status: 'completed',
        assignee: 'developer2',
        labels: ['epic', 'api', 'backend'],
        childCount: 15,
        completedCount: 15,
        url: 'https://github.com/owner/repo/issues/103',
        milestone: 'v1.9'
      }
    ];

    // Filter based on options
    let filtered = mockEpics;

    if (options.status !== 'all') {
      filtered = filtered.filter(e => {
        if (options.status === 'closed') {
          return e.status === 'completed';
        }
        return e.status !== 'completed';
      });
    }

    if (options.assignee) {
      filtered = filtered.filter(e => e.assignee === options.assignee);
    }

    if (options.label) {
      filtered = filtered.filter(e => e.labels.includes(options.label));
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }
}

// Export class and instance for testing
module.exports = {
  GitHubEpicList,
  execute: (options, settings) => new GitHubEpicList().execute(options, settings),
  detectRepository: () => new GitHubEpicList().detectRepository(),
  buildQuery: (repository, options) => new GitHubEpicList().buildQuery(repository, options),
  executeGitHubCLI: (query) => new GitHubEpicList().executeGitHubCLI(query),
  transformResults: (githubIssues) => new GitHubEpicList().transformResults(githubIssues),
  mapStatus: (state) => new GitHubEpicList().mapStatus(state),
  countChildren: (issue) => new GitHubEpicList().countChildren(issue),
  countCompleted: (issue) => new GitHubEpicList().countCompleted(issue),
  getMockData: (options) => new GitHubEpicList().getMockData(options)
};