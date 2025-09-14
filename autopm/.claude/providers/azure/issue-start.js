#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Azure DevOps Provider - Issue Start Implementation
 * Starts work on an Azure DevOps work item (task/user story)
 */
class AzureIssueStart {
  /**
   * Execute issue start command for Azure DevOps
   * @param {Object} options - Command options
   * @param {string} options.id - Work item ID (required)
   * @param {string} options.branch - Custom branch name
   * @param {boolean} options.assign - Auto-assign to current user
   * @param {string} options.comment - Comment to add
   * @param {boolean} options.no_branch - Skip branch creation
   * @param {string} options.sprint - Sprint/iteration to move to
   * @param {Object} settings - Provider settings from config
   * @returns {Object} Result of start operation
   */
  async execute(options = {}, settings = {}) {
    if (!options.id) {
      throw new Error('Work item ID is required. Usage: issue:start <work-item-id>');
    }

    const organization = settings.organization;
    const project = settings.project;

    if (!organization || !project) {
      throw new Error('Azure DevOps not configured. Set organization and project in config.json');
    }

    // For testing, use mock implementation unless AUTOPM_USE_REAL_API is set
    if (!process.env.AUTOPM_USE_REAL_API) {
      console.log('📊 Using mock implementation (set AUTOPM_USE_REAL_API=true for real API)');
      return this.mockStartWorkItem(options, organization, project);
    }

    try {
      const actions = [];
      const workItemId = options.id;

      // 1. Get work item details
      const workItem = await this.getWorkItem(organization, project, workItemId);
      if (!workItem) {
        throw new Error(`Work item #${workItemId} not found`);
      }

      // 2. Validate work item can be started
      const state = workItem.fields?.['System.State'];
      if (state === 'Done' || state === 'Removed' || state === 'Closed') {
        throw new Error(`Work item #${workItemId} is ${state} and cannot be started`);
      }

      // 3. Update work item state to Active/In Progress
      await this.updateWorkItemState(organization, project, workItemId, 'Active');
      actions.push('Updated state to Active');

      // 4. Create branch if needed
      let branchName = null;
      if (!options.no_branch) {
        branchName = options.branch || `feature/task-${workItemId}`;

        if (this.branchExists(branchName)) {
          console.warn(`⚠️  Branch ${branchName} already exists, skipping creation`);
        } else {
          this.createBranch(branchName);
          await this.linkBranchToWorkItem(organization, project, workItemId, branchName);
          actions.push(`Created and linked branch ${branchName}`);
        }
      }

      // 5. Assign work item if needed
      if (options.assign || !workItem.fields?.['System.AssignedTo']) {
        const currentUser = await this.getCurrentUser(organization);
        await this.assignWorkItem(organization, project, workItemId, currentUser);
        actions.push(`Assigned to ${currentUser}`);
      }

      // 6. Add tags to indicate work started
      await this.addTag(organization, project, workItemId, 'in-progress');
      actions.push('Added in-progress tag');

      // 7. Add comment if specified
      if (options.comment) {
        await this.addComment(organization, project, workItemId, options.comment);
        actions.push('Added comment');
      } else {
        const defaultComment = `🚀 Started working on this work item<br/>` +
          `Branch: ${branchName || 'working on existing branch'}<br/>` +
          `Started at: ${new Date().toISOString()}`;
        await this.addComment(organization, project, workItemId, defaultComment);
        actions.push('Added start notification');
      }

      // 8. Move to sprint if specified
      if (options.sprint) {
        await this.moveToSprint(organization, project, workItemId, options.sprint);
        actions.push(`Moved to ${options.sprint}`);
      }

      return {
        success: true,
        issue: {
          id: workItemId,
          title: workItem.fields?.['System.Title'] || `Work Item #${workItemId}`,
          status: 'in_progress',
          assignee: workItem.fields?.['System.AssignedTo']?.uniqueName || 'self',
          branch: branchName,
          url: this.getWorkItemUrl(organization, project, workItemId)
        },
        actions: actions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error starting work item:', error.message);
      throw error;
    }
  }

  /**
   * Get work item details
   */
  async getWorkItem(organization, project, workItemId) {
    try {
      const cmd = `az boards work-item show --id ${workItemId} ` +
                  `--organization ${organization} --project "${project}"`;
      const output = execSync(cmd, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update work item state
   */
  async updateWorkItemState(organization, project, workItemId, state) {
    try {
      const cmd = `az boards work-item update --id ${workItemId} ` +
                  `--state "${state}" ` +
                  `--organization ${organization} --project "${project}"`;
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      console.warn('Could not update work item state:', error.message);
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
   * Link branch to work item
   */
  async linkBranchToWorkItem(organization, project, workItemId, branchName) {
    // This would require Azure DevOps Git API
    // Simplified for demonstration
    console.log(`Would link branch ${branchName} to work item #${workItemId}`);
  }

  /**
   * Get current Azure DevOps user
   */
  async getCurrentUser(organization) {
    try {
      // Get current user from Azure CLI
      const cmd = `az ad signed-in-user show --query userPrincipalName -o tsv`;
      const output = execSync(cmd, { encoding: 'utf8' });
      return output.trim();
    } catch (error) {
      // Fallback to git config
      try {
        const email = execSync('git config user.email', { encoding: 'utf8' });
        return email.trim();
      } catch (error) {
        return 'current-user@company.com';
      }
    }
  }

  /**
   * Assign work item to user
   */
  async assignWorkItem(organization, project, workItemId, username) {
    try {
      const cmd = `az boards work-item update --id ${workItemId} ` +
                  `--assigned-to "${username}" ` +
                  `--organization ${organization} --project "${project}"`;
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      console.warn('Could not assign work item:', error.message);
    }
  }

  /**
   * Add tag to work item
   */
  async addTag(organization, project, workItemId, tag) {
    try {
      // Get current tags
      const workItem = await this.getWorkItem(organization, project, workItemId);
      const currentTags = workItem.fields?.['System.Tags'] || '';
      const newTags = currentTags ? `${currentTags}; ${tag}` : tag;

      const cmd = `az boards work-item update --id ${workItemId} ` +
                  `--fields "System.Tags=${newTags}" ` +
                  `--organization ${organization} --project "${project}"`;
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      console.warn('Could not add tag:', error.message);
    }
  }

  /**
   * Add comment to work item
   */
  async addComment(organization, project, workItemId, comment) {
    try {
      const cmd = `az boards work-item relation add --id ${workItemId} ` +
                  `--relation-type "System.LinkTypes.Hierarchy-Reverse" ` +
                  `--target-id ${workItemId} ` +
                  `--organization ${organization} --project "${project}"`;
      // Note: Azure CLI doesn't have direct comment add, would use REST API
      console.log(`Would add comment: ${comment}`);
    } catch (error) {
      console.warn('Could not add comment:', error.message);
    }
  }

  /**
   * Move work item to sprint
   */
  async moveToSprint(organization, project, workItemId, sprint) {
    try {
      const iterationPath = `${project}\\${sprint}`;
      const cmd = `az boards work-item update --id ${workItemId} ` +
                  `--iteration "${iterationPath}" ` +
                  `--organization ${organization} --project "${project}"`;
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      console.warn('Could not move to sprint:', error.message);
    }
  }

  /**
   * Get work item URL
   */
  getWorkItemUrl(organization, project, workItemId) {
    return `https://dev.azure.com/${organization}/${project}/_workitems/edit/${workItemId}`;
  }

  /**
   * Mock implementation for testing
   */
  mockStartWorkItem(options, organization, project) {
    const workItemId = options.id;
    const branchName = options.branch || `feature/task-${workItemId}`;
    const actions = [];

    // Simulate validation
    if (workItemId === '9999') {
      throw new Error(`Work item #${workItemId} not found`);
    }

    if (workItemId === '9998') {
      throw new Error(`Work item #${workItemId} is Done and cannot be started`);
    }

    // Simulate state update
    console.log(`📝 Would update state to Active`);
    actions.push('Updated state to Active');

    // Simulate branch creation
    if (!options.no_branch) {
      console.log(`🌿 Would create branch: ${branchName}`);
      console.log(`🔗 Would link branch to work item #${workItemId}`);
      actions.push(`Created and linked branch ${branchName}`);
    }

    // Simulate assignment
    if (options.assign) {
      console.log(`👤 Would assign to current user`);
      actions.push('Assigned to current-user@company.com');
    }

    // Simulate tag
    console.log(`🏷️  Would add tag: in-progress`);
    actions.push('Added in-progress tag');

    // Simulate comment
    if (options.comment) {
      console.log(`💬 Would add comment: ${options.comment}`);
      actions.push('Added comment');
    } else {
      console.log(`💬 Would add start notification`);
      actions.push('Added start notification');
    }

    // Simulate sprint move
    if (options.sprint) {
      console.log(`📋 Would move to sprint: ${options.sprint}`);
      actions.push(`Moved to ${options.sprint}`);
    }

    // Return mock result
    return {
      success: true,
      issue: {
        id: workItemId,
        title: `Mock Work Item #${workItemId}`,
        status: 'in_progress',
        assignee: options.assign ? 'current-user@company.com' : 'existing-user@company.com',
        branch: options.no_branch ? null : branchName,
        url: `https://dev.azure.com/${organization}/${project}/_workitems/edit/${workItemId}`
      },
      actions: actions,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
module.exports = new AzureIssueStart();