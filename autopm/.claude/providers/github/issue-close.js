#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * GitHub Provider - Issue Close Implementation
 */
class GitHubIssueClose {
  /**
   * Execute issue close command for GitHub
   */
  async execute(options = {}, settings = {}) {
    if (!options.id) {
      throw new Error('Issue ID is required. Usage: issue:close <issue-id>');
    }

    const repository = settings.repository || this.detectRepository();
    if (!repository) {
      throw new Error('GitHub repository not configured');
    }

    // Mock implementation for testing
    if (!process.env.AUTOPM_USE_REAL_API) {
      console.log('📊 Using mock implementation');
      return this.mockCloseIssue(options, repository);
    }

    try {
      const actions = [];
      const issueId = options.id;

      // Close the issue
      execSync(`gh issue close ${issueId} --repo ${repository}`, { stdio: 'inherit' });
      actions.push('Closed issue');

      // Add comment if specified
      if (options.comment) {
        execSync(`gh issue comment ${issueId} --repo ${repository} --body "${options.comment}"`, {
          stdio: 'inherit'
        });
        actions.push('Added closing comment');
      }

      // Add resolution label
      if (options.resolution) {
        execSync(`gh issue edit ${issueId} --repo ${repository} --add-label "resolution:${options.resolution}"`, {
          stdio: 'inherit'
        });
        actions.push(`Added resolution: ${options.resolution}`);
      }

      // Delete branch if not prevented
      if (!options.no_branch_delete) {
        const branchName = `feature/issue-${issueId}`;
        try {
          execSync(`git branch -d ${branchName}`, { stdio: 'inherit' });
          actions.push(`Deleted branch ${branchName}`);
        } catch (e) {
          // Branch might not exist or not merged
        }
      }

      return {
        success: true,
        issue: {
          id: issueId,
          status: 'closed',
          resolution: options.resolution || 'fixed',
          url: `https://github.com/${repository}/issues/${issueId}`
        },
        actions: actions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw error;
    }
  }

  detectRepository() {
    try {
      const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const match = remote.match(/github\.com[:/]([^/]+\/[^.]+)/);
      if (match) return match[1];
    } catch (error) {}
    return null;
  }

  mockCloseIssue(options, repository) {
    const actions = [];
    const issueId = options.id;

    console.log(`🔒 Would close issue #${issueId}`);
    actions.push('Closed issue');

    if (options.comment) {
      console.log(`💬 Would add comment: ${options.comment}`);
      actions.push('Added closing comment');
    }

    if (options.resolution) {
      console.log(`🏷️  Would add resolution: ${options.resolution}`);
      actions.push(`Added resolution: ${options.resolution}`);
    }

    if (!options.no_branch_delete) {
      console.log(`🌿 Would delete branch: feature/issue-${issueId}`);
      actions.push(`Deleted branch feature/issue-${issueId}`);
    }

    return {
      success: true,
      issue: {
        id: issueId,
        status: 'closed',
        resolution: options.resolution || 'fixed',
        url: `https://github.com/${repository}/issues/${issueId}`
      },
      actions: actions,
      timestamp: new Date().toISOString()
    };
  }
}

// Export class and instance for testing
module.exports = {
  GitHubIssueClose,
  execute: (options, settings) => new GitHubIssueClose().execute(options, settings),
  detectRepository: () => new GitHubIssueClose().detectRepository(),
  mockCloseIssue: (options, repository) => new GitHubIssueClose().mockCloseIssue(options, repository)
};