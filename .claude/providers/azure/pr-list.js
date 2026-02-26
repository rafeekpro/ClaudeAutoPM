/**
 * Azure DevOps Pull Request List Command
 * List pull requests in Azure Repos
 */

const AzureDevOpsClient = require('./lib/client');
const AzureFormatter = require('./lib/formatter');

class AzurePRList {
  constructor(settings) {
    this.client = new AzureDevOpsClient(settings);
    this.organization = settings.organization;
    this.project = settings.project;
    this.repository = settings.repository || settings.project;
  }

  /**
   * Execute PR list command
   */
  async execute(options, settings) {
    try {
      const gitApi = await this.client.connection.getGitApi();

      // Build search criteria
      const searchCriteria = {
        status: this.mapStatus(options.state || options.status || 'open'),
        includeLinks: true
      };

      // Add creator filter
      if (options.author || options.creator) {
        const identity = await this.resolveIdentity(options.author || options.creator);
        if (identity) {
          searchCriteria.creatorId = identity.id;
        }
      }

      // Add reviewer filter
      if (options.reviewer) {
        const identity = await this.resolveIdentity(options.reviewer);
        if (identity) {
          searchCriteria.reviewerId = identity.id;
        }
      }

      // Add target branch filter
      if (options.base || options.target) {
        searchCriteria.targetRefName = `refs/heads/${options.base || options.target}`;
      }

      // Get pull requests
      const pullRequests = await gitApi.getPullRequests(
        this.repository,
        searchCriteria,
        this.project,
        null,
        0,
        options.limit || 50
      );

      if (pullRequests.length === 0) {
        console.log('📋 No pull requests found matching criteria');
        return [];
      }

      // Format output
      console.log(`\n📋 Found ${pullRequests.length} pull request(s):\n`);

      for (const pr of pullRequests) {
        this.formatPullRequest(pr);
      }

      return pullRequests.map(pr => ({
        id: pr.pullRequestId,
        title: pr.title,
        author: pr.createdBy.displayName,
        status: pr.status,
        isDraft: pr.isDraft,
        source: pr.sourceRefName.replace('refs/heads/', ''),
        target: pr.targetRefName.replace('refs/heads/', ''),
        created: pr.creationDate,
        url: this.getPRUrl(pr.pullRequestId)
      }));

    } catch (error) {
      console.error(`❌ Failed to list pull requests: ${error.message}`);
      return [];
    }
  }

  /**
   * Format PR for display
   */
  formatPullRequest(pr) {
    const statusIcon = this.getStatusIcon(pr.status);
    const draftLabel = pr.isDraft ? ' [DRAFT]' : '';

    console.log(`${statusIcon} PR #${pr.pullRequestId}${draftLabel}: ${pr.title}`);
    console.log(`   Author: ${pr.createdBy.displayName}`);
    console.log(`   Branch: ${pr.sourceRefName.replace('refs/heads/', '')} → ${pr.targetRefName.replace('refs/heads/', '')}`);

    // Show reviewers
    if (pr.reviewers && pr.reviewers.length > 0) {
      const reviewerInfo = pr.reviewers.map(r => {
        const vote = this.getVoteSymbol(r.vote);
        return `${r.displayName}${vote}`;
      }).join(', ');
      console.log(`   Reviewers: ${reviewerInfo}`);
    }

    // Show work items
    if (pr.workItemRefs && pr.workItemRefs.length > 0) {
      const workItems = pr.workItemRefs.map(w => `#${w.id}`).join(', ');
      console.log(`   Work Items: ${workItems}`);
    }

    // Show merge status
    if (pr.mergeStatus) {
      console.log(`   Merge Status: ${pr.mergeStatus}`);
    }

    console.log(`   Created: ${new Date(pr.creationDate).toLocaleDateString()}`);
    console.log(`   🔗 ${this.getPRUrl(pr.pullRequestId)}`);
    console.log('');
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    const icons = {
      'active': '🟢',
      'abandoned': '🔴',
      'completed': '✅',
      'all': '📋'
    };
    return icons[status] || '○';
  }

  /**
   * Get vote symbol
   */
  getVoteSymbol(vote) {
    const symbols = {
      '10': ' ✅',    // Approved
      '5': ' ✅',     // Approved with suggestions
      '0': '',        // No vote
      '-5': ' ⚠️',    // Waiting for author
      '-10': ' ❌'    // Rejected
    };
    return symbols[vote] || '';
  }

  /**
   * Map status string to Azure DevOps status
   */
  mapStatus(status) {
    const statusMap = {
      'open': 'active',
      'closed': 'completed',
      'merged': 'completed',
      'abandoned': 'abandoned',
      'all': 'all'
    };
    return statusMap[status.toLowerCase()] || 'active';
  }

  /**
   * Resolve identity by name or email
   */
  async resolveIdentity(nameOrEmail) {
    try {
      const identityApi = await this.client.connection.getCoreApi();
      const identities = await identityApi.getIdentities({
        searchFilter: 'General',
        filterValue: nameOrEmail
      });

      return identities && identities.length > 0 ? identities[0] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get PR URL
   */
  getPRUrl(prId) {
    return `https://dev.azure.com/${this.organization}/${this.project}/_git/${this.repository}/pullrequest/${prId}`;
  }
}

module.exports = new AzurePRList();