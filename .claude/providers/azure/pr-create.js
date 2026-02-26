/**
 * Azure DevOps Pull Request Create Command
 * Create pull requests in Azure Repos
 */

const { execSync } = require('child_process');
const AzureDevOpsClient = require('./lib/client');

class AzurePRCreate {
  constructor(settings) {
    this.client = new AzureDevOpsClient(settings);
    this.organization = settings.organization;
    this.project = settings.project;
    this.repository = settings.repository || settings.project;
  }

  /**
   * Execute PR creation
   */
  async execute(options, settings) {
    try {
      // Get current branch
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

      if (currentBranch === 'main' || currentBranch === 'master') {
        throw new Error('Cannot create PR from main/master branch. Please create a feature branch first.');
      }

      // Get Git API
      const gitApi = await this.client.connection.getGitApi();

      // Get repository
      const repo = await gitApi.getRepository(this.repository, this.project);

      // Get target branch (default to main)
      const targetBranch = options.target || options.base || 'main';

      // Parse work item IDs from branch name or commit messages
      const workItemIds = await this.extractWorkItemIds(currentBranch);

      // Create pull request
      const pullRequest = {
        sourceRefName: `refs/heads/${currentBranch}`,
        targetRefName: `refs/heads/${targetBranch}`,
        title: options.title || this.generateTitle(currentBranch),
        description: options.body || options.description || '',
        workItemRefs: workItemIds.map(id => ({ id: id.toString() })),
        isDraft: options.draft === true
      };

      // Add reviewers if specified
      if (options.reviewers) {
        pullRequest.reviewers = await this.resolveReviewers(options.reviewers);
      }

      // Add auto-complete options if requested
      if (options.auto_complete || options.auto_merge) {
        const identity = await this.getCurrentIdentity();
        pullRequest.autoCompleteSetBy = identity;
        pullRequest.completionOptions = {
          deleteSourceBranch: options.delete_branch !== false,
          mergeCommitMessage: options.merge_message || `Merged PR: ${pullRequest.title}`,
          mergeStrategy: options.squash ? 'squash' : 'noFastForward'
        };
      }

      // Create the PR
      const createdPR = await gitApi.createPullRequest(pullRequest, repo.id, this.project);

      // Add labels if specified
      if (options.labels) {
        await this.addLabels(createdPR.pullRequestId, options.labels);
      }

      // Format output
      const prUrl = `https://dev.azure.com/${this.organization}/${this.project}/_git/${this.repository}/pullrequest/${createdPR.pullRequestId}`;

      console.log(`\n✅ Pull Request created successfully!\n`);
      console.log(`📋 PR #${createdPR.pullRequestId}: ${createdPR.title}`);
      console.log(`🔗 URL: ${prUrl}`);
      console.log(`📂 ${currentBranch} → ${targetBranch}`);

      if (workItemIds.length > 0) {
        console.log(`🔗 Linked Work Items: ${workItemIds.join(', ')}`);
      }

      if (pullRequest.reviewers && pullRequest.reviewers.length > 0) {
        console.log(`👥 Reviewers: ${pullRequest.reviewers.map(r => r.displayName).join(', ')}`);
      }

      return {
        success: true,
        pullRequest: {
          id: createdPR.pullRequestId,
          title: createdPR.title,
          url: prUrl,
          source: currentBranch,
          target: targetBranch,
          isDraft: createdPR.isDraft,
          workItems: workItemIds
        }
      };

    } catch (error) {
      console.error(`❌ Failed to create pull request: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract work item IDs from branch name and recent commits
   */
  async extractWorkItemIds(branch) {
    const ids = new Set();

    // Extract from branch name (e.g., feature/123-add-auth or bug-456)
    const branchMatch = branch.match(/\d+/g);
    if (branchMatch) {
      branchMatch.forEach(id => ids.add(parseInt(id)));
    }

    // Extract from recent commit messages
    try {
      const commits = execSync('git log --oneline -10', { encoding: 'utf8' });
      const commitMatches = commits.match(/#\d+/g);
      if (commitMatches) {
        commitMatches.forEach(match => {
          ids.add(parseInt(match.substring(1)));
        });
      }
    } catch (e) {
      // Ignore errors in commit parsing
    }

    return Array.from(ids);
  }

  /**
   * Generate PR title from branch name
   */
  generateTitle(branch) {
    // Remove prefixes like feature/, bugfix/, etc.
    let title = branch.replace(/^(feature|bugfix|hotfix|release|bug|fix|chore)\//, '');

    // Replace hyphens and underscores with spaces
    title = title.replace(/[-_]/g, ' ');

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return title;
  }

  /**
   * Resolve reviewer identities
   */
  async resolveReviewers(reviewerList) {
    const reviewers = [];
    const identityApi = await this.client.connection.getCoreApi();

    const reviewerNames = reviewerList.split(',').map(r => r.trim());

    for (const name of reviewerNames) {
      try {
        // Search for identity
        const identities = await identityApi.getIdentities({
          searchFilter: 'General',
          filterValue: name
        });

        if (identities && identities.length > 0) {
          reviewers.push({
            id: identities[0].id,
            displayName: identities[0].displayName,
            isRequired: false
          });
        }
      } catch (e) {
        console.warn(`⚠️ Could not find reviewer: ${name}`);
      }
    }

    return reviewers;
  }

  /**
   * Get current user identity
   */
  async getCurrentIdentity() {
    const identityApi = await this.client.connection.getCoreApi();
    const connection = await identityApi.getConnectedServices();
    return connection.authenticatedUser;
  }

  /**
   * Add labels to PR (via work item tags)
   */
  async addLabels(prId, labels) {
    try {
      const gitApi = await this.client.connection.getGitApi();
      const labelList = labels.split(',').map(l => l.trim());

      // Azure DevOps uses a different label system than GitHub
      // We'll add them as PR tags
      await gitApi.updatePullRequest(
        {
          labels: labelList.map(label => ({ name: label }))
        },
        this.repository,
        prId,
        this.project
      );
    } catch (e) {
      console.warn(`⚠️ Could not add labels: ${e.message}`);
    }
  }
}

// Export the class directly - tests create their own instances
module.exports = AzurePRCreate;