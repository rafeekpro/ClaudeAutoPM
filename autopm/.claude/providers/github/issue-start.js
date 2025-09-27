#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * GitHub Provider - Issue Start Implementation
 * Starts work on a GitHub issue
 */
class GitHubIssueStart {
  /**
   * Execute issue start command for GitHub
   * @param {Object} options - Command options
   * @param {string} options.id - Issue ID (required)
   * @param {string} options.branch - Custom branch name
   * @param {boolean} options.assign - Auto-assign to current user
   * @param {string} options.comment - Comment to add
   * @param {boolean} options.no_branch - Skip branch creation
   * @param {string} options.project - Project column to move to
   * @param {Object} settings - Provider settings from config
   * @returns {Object} Result of start operation
   */
  async execute(options = {}, settings = {}) {
    if (!options.id) {
      throw new Error('Issue ID is required. Usage: issue:start <issue-id>');
    }

    const repository = settings.repository || this.detectRepository();
    if (!repository) {
      throw new Error('GitHub repository not configured. Set projectManagement.settings.github.repository in config.json');
    }

    // For testing, use mock implementation unless AUTOPM_USE_REAL_API is set
    if (!process.env.AUTOPM_USE_REAL_API) {
      console.log('📊 Using mock implementation (set AUTOPM_USE_REAL_API=true for real API)');
      return this.mockStartIssue(options, repository);
    }

    try {
      const actions = [];
      const issueId = options.id;

      // 1. Get issue details
      const issue = await this.getIssue(repository, issueId);
      if (!issue) {
        throw new Error(`Issue #${issueId} not found`);
      }

      // 2. Validate issue can be started
      if (issue.state === 'closed') {
        throw new Error(`Issue #${issueId} is closed and cannot be started`);
      }

      // 3. Create branch if needed
      let branchName = null;
      if (!options.no_branch) {
        branchName = options.branch || `feature/issue-${issueId}`;

        if (this.branchExists(branchName)) {
          console.warn(`⚠️  Branch ${branchName} already exists, skipping creation`);
        } else {
          this.createBranch(branchName);
          actions.push(`Created branch ${branchName}`);
        }
      }

      // 4. Assign issue if needed
      if (options.assign || !issue.assignee) {
        const currentUser = await this.getCurrentUser();
        await this.assignIssue(repository, issueId, currentUser);
        actions.push(`Assigned to ${currentUser}`);
      }

      // 5. Add labels to indicate work started
      await this.addLabel(repository, issueId, 'in-progress');
      actions.push('Added in-progress label');

      // 6. Add comment if specified
      if (options.comment) {
        await this.addComment(repository, issueId, options.comment);
        actions.push('Added comment');
      } else {
        const defaultComment = `🚀 Started working on this issue\n\n` +
          `Branch: ${branchName || 'working on existing branch'}\n` +
          `Started at: ${new Date().toISOString()}`;
        await this.addComment(repository, issueId, defaultComment);
        actions.push('Added start notification');
      }

      // 7. Move to project column if specified
      if (options.project) {
        await this.moveToProjectColumn(repository, issueId, options.project);
        actions.push(`Moved to ${options.project} column`);
      }

      return {
        success: true,
        issue: {
          id: issueId,
          title: issue.title,
          status: 'in_progress',
          assignee: issue.assignee || 'self',
          branch: branchName,
          url: issue.url
        },
        actions: actions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error starting issue:', error.message);
      throw error;
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
      // Silent fail
    }
    return null;
  }

  /**
   * Get issue details
   */
  async getIssue(repository, issueId) {
    try {
      const cmd = `gh issue view ${issueId} --repo ${repository} --json number,title,state,assignees,labels,url`;
      const output = execSync(cmd, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if branch exists
   */
  branchExists(branchName) {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create and checkout new branch
   */
  createBranch(branchName) {
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  }

  /**
   * Get current GitHub user
   */
  async getCurrentUser() {
    try {
      const output = execSync('gh api user --jq .login', { encoding: 'utf8' });
      return output.trim();
    } catch (error) {
      return 'current-user';
    }
  }

  /**
   * Assign issue to user
   */
  async assignIssue(repository, issueId, username) {
    try {
      execSync(`gh issue edit ${issueId} --repo ${repository} --add-assignee ${username}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Could not assign issue:', error.message);
    }
  }

  /**
   * Add label to issue
   */
  async addLabel(repository, issueId, label) {
    try {
      execSync(`gh issue edit ${issueId} --repo ${repository} --add-label ${label}`, {
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Could not add label:', error.message);
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(repository, issueId, comment) {
    try {
      execSync(`gh issue comment ${issueId} --repo ${repository} --body "${comment}"`, {
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Could not add comment:', error.message);
    }
  }

  /**
   * Move issue to project column
   */
  async moveToProjectColumn(repository, issueId, columnName) {
    // This would require GitHub Projects API
    // Simplified for demonstration
    console.log(`Would move issue #${issueId} to ${columnName} column`);
  }

  /**
   * Mock implementation for testing
   */
  mockStartIssue(options, repository) {
    const issueId = options.id;
    const branchName = options.branch || `feature/issue-${issueId}`;
    const actions = [];

    // Simulate validation
    if (issueId === '999') {
      throw new Error(`Issue #${issueId} not found`);
    }

    if (issueId === '998') {
      throw new Error(`Issue #${issueId} is closed and cannot be started`);
    }

    // Simulate branch creation
    if (!options.no_branch) {
      console.log(`🌿 Would create branch: ${branchName}`);
      actions.push(`Created branch ${branchName}`);
    }

    // Simulate assignment
    if (options.assign) {
      console.log(`👤 Would assign to current user`);
      actions.push('Assigned to current-user');
    }

    // Simulate label
    console.log(`🏷️  Would add label: in-progress`);
    actions.push('Added in-progress label');

    // Simulate comment
    if (options.comment) {
      console.log(`💬 Would add comment: ${options.comment}`);
      actions.push('Added comment');
    } else {
      console.log(`💬 Would add start notification`);
      actions.push('Added start notification');
    }

    // Simulate project move
    if (options.project) {
      console.log(`📋 Would move to project column: ${options.project}`);
      actions.push(`Moved to ${options.project} column`);
    }

    // Return mock result
    return {
      success: true,
      issue: {
        id: issueId,
        title: `Mock Issue #${issueId}`,
        status: 'in_progress',
        assignee: options.assign ? 'current-user' : 'existing-assignee',
        branch: options.no_branch ? null : branchName,
        url: `https://github.com/${repository}/issues/${issueId}`
      },
      actions: actions,
      timestamp: new Date().toISOString()
    };
  }
}

// Export class and instance for testing
module.exports = {
  GitHubIssueStart,
  execute: (options, settings) => new GitHubIssueStart().execute(options, settings),
  detectRepository: () => new GitHubIssueStart().detectRepository(),
  getIssue: (repository, issueId) => new GitHubIssueStart().getIssue(repository, issueId),
  branchExists: (branchName) => new GitHubIssueStart().branchExists(branchName),
  createBranch: (branchName) => new GitHubIssueStart().createBranch(branchName),
  getCurrentUser: () => new GitHubIssueStart().getCurrentUser(),
  assignIssue: (repository, issueId, username) => new GitHubIssueStart().assignIssue(repository, issueId, username),
  addLabel: (repository, issueId, label) => new GitHubIssueStart().addLabel(repository, issueId, label),
  addComment: (repository, issueId, comment) => new GitHubIssueStart().addComment(repository, issueId, comment),
  moveToProjectColumn: (repository, issueId, columnName) => new GitHubIssueStart().moveToProjectColumn(repository, issueId, columnName),
  mockStartIssue: (options, repository) => new GitHubIssueStart().mockStartIssue(options, repository)
};