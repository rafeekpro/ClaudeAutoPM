#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * GitHub Provider - Issue Show Implementation
 */
class GitHubIssueShow {
  /**
   * Execute issue show command for GitHub
   */
  async execute(options = {}, settings = {}) {
    if (!options.id) {
      throw new Error('Issue ID is required. Usage: issue:show <issue-id>');
    }

    const repository = settings.repository || this.detectRepository();
    if (!repository) {
      throw new Error('GitHub repository not configured');
    }

    // Mock implementation for testing
    if (!process.env.AUTOPM_USE_REAL_API) {
      console.log('📊 Using mock implementation');
      return this.mockShowIssue(options);
    }

    try {
      const issueId = options.id;

      // Get issue details
      const cmd = `gh issue view ${issueId} --repo ${repository} --json ` +
                  `number,title,body,state,assignees,labels,createdAt,updatedAt,url,milestone`;
      const output = execSync(cmd, { encoding: 'utf8' });
      const issue = JSON.parse(output);

      // Transform to unified format
      const result = {
        id: issue.number.toString(),
        title: issue.title,
        description: issue.body,
        status: issue.state.toLowerCase(),
        assignees: issue.assignees?.map(a => a.login) || [],
        labels: issue.labels?.map(l => l.name) || [],
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        url: issue.url,
        milestone: issue.milestone?.title || null
      };

      // Get comments if requested
      if (options.comments) {
        const commentsCmd = `gh issue view ${issueId} --repo ${repository} --comments`;
        const commentsOutput = execSync(commentsCmd, { encoding: 'utf8' });
        result.comments = this.parseComments(commentsOutput);
      }

      // Get related PRs if requested
      if (options.related) {
        result.relatedPRs = this.getRelatedPRs(repository, issueId);
      }

      return result;

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

  parseComments(output) {
    // Simple parsing - in real implementation would parse properly
    return ['Comment parsing would be implemented here'];
  }

  getRelatedPRs(repository, issueId) {
    try {
      const cmd = `gh pr list --repo ${repository} --search "${issueId} in:title,body" --json number,title,state`;
      const output = execSync(cmd, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (error) {
      return [];
    }
  }

  mockShowIssue(options) {
    const issueId = options.id;

    const mockIssue = {
      id: issueId,
      title: `Mock Issue #${issueId}: Authentication System`,
      description: 'Implement JWT-based authentication with refresh tokens',
      status: 'open',
      assignees: ['developer1', 'developer2'],
      labels: ['enhancement', 'backend', 'priority-high'],
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T15:30:00Z',
      url: `https://github.com/owner/repo/issues/${issueId}`,
      milestone: 'v2.0'
    };

    if (options.comments) {
      mockIssue.comments = [
        'Initial implementation plan approved',
        'Added refresh token functionality',
        'Security review requested'
      ];
    }

    if (options.related) {
      mockIssue.relatedPRs = [
        { number: 456, title: `feat: Add JWT auth (#${issueId})`, state: 'OPEN' }
      ];
    }

    // Display formatted output
    console.log(`\n📋 Issue #${mockIssue.id}: ${mockIssue.title}`);
    console.log(`\n📝 Description:\n${mockIssue.description}`);
    console.log(`\n📊 Details:`);
    console.log(`   Status: ${mockIssue.status}`);
    console.log(`   Assignees: ${mockIssue.assignees.join(', ')}`);
    console.log(`   Labels: ${mockIssue.labels.join(', ')}`);
    console.log(`   Milestone: ${mockIssue.milestone}`);
    console.log(`   Created: ${mockIssue.createdAt}`);
    console.log(`   Updated: ${mockIssue.updatedAt}`);
    console.log(`   URL: ${mockIssue.url}`);

    if (mockIssue.comments) {
      console.log(`\n💬 Comments:`);
      mockIssue.comments.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
    }

    if (mockIssue.relatedPRs) {
      console.log(`\n🔗 Related PRs:`);
      mockIssue.relatedPRs.forEach(pr =>
        console.log(`   PR #${pr.number}: ${pr.title} (${pr.state})`));
    }

    return mockIssue;
  }
}

// Export class and instance for testing
module.exports = {
  GitHubIssueShow,
  execute: (options, settings) => new GitHubIssueShow().execute(options, settings),
  detectRepository: () => new GitHubIssueShow().detectRepository(),
  parseComments: (output) => new GitHubIssueShow().parseComments(output),
  getRelatedPRs: (repository, issueId) => new GitHubIssueShow().getRelatedPRs(repository, issueId),
  mockShowIssue: (options) => new GitHubIssueShow().mockShowIssue(options)
};