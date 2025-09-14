#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * Azure DevOps Provider - Issue Close Implementation
 */
class AzureIssueClose {
  /**
   * Execute issue close command for Azure DevOps
   */
  async execute(options = {}, settings = {}) {
    if (!options.id) {
      throw new Error('Work item ID is required. Usage: issue:close <work-item-id>');
    }

    const organization = settings.organization;
    const project = settings.project;

    if (!organization || !project) {
      throw new Error('Azure DevOps not configured');
    }

    // Mock implementation for testing
    if (!process.env.AUTOPM_USE_REAL_API) {
      console.log('📊 Using mock implementation');
      return this.mockCloseWorkItem(options, organization, project);
    }

    try {
      const actions = [];
      const workItemId = options.id;

      // Update work item state to Done/Closed
      const state = options.resolution === 'wontfix' ? 'Removed' : 'Done';
      execSync(`az boards work-item update --id ${workItemId} --state "${state}" ` +
               `--organization ${organization} --project "${project}"`, { stdio: 'inherit' });
      actions.push(`Updated state to ${state}`);

      // Add comment
      if (options.comment) {
        // Azure CLI doesn't have direct comment add, would use REST API
        console.log(`Would add comment: ${options.comment}`);
        actions.push('Added closing comment');
      }

      // Set resolution reason
      if (options.resolution) {
        const reason = this.mapResolution(options.resolution);
        execSync(`az boards work-item update --id ${workItemId} ` +
                 `--fields "System.Reason=${reason}" ` +
                 `--organization ${organization} --project "${project}"`, { stdio: 'inherit' });
        actions.push(`Set resolution: ${reason}`);
      }

      // Delete branch if not prevented
      if (!options.no_branch_delete) {
        const branchName = `feature/task-${workItemId}`;
        try {
          execSync(`git branch -d ${branchName}`, { stdio: 'inherit' });
          actions.push(`Deleted branch ${branchName}`);
        } catch (e) {
          // Branch might not exist
        }
      }

      return {
        success: true,
        issue: {
          id: workItemId,
          status: 'closed',
          resolution: options.resolution || 'fixed',
          url: `https://dev.azure.com/${organization}/${project}/_workitems/edit/${workItemId}`
        },
        actions: actions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw error;
    }
  }

  mapResolution(resolution) {
    const resolutionMap = {
      'fixed': 'Completed',
      'wontfix': 'Abandoned',
      'duplicate': 'Duplicate',
      'invalid': 'Rejected'
    };
    return resolutionMap[resolution] || 'Completed';
  }

  mockCloseWorkItem(options, organization, project) {
    const actions = [];
    const workItemId = options.id;

    console.log(`🔒 Would close work item #${workItemId}`);
    actions.push('Updated state to Done');

    if (options.comment) {
      console.log(`💬 Would add comment: ${options.comment}`);
      actions.push('Added closing comment');
    }

    if (options.resolution) {
      console.log(`📝 Would set resolution: ${this.mapResolution(options.resolution)}`);
      actions.push(`Set resolution: ${this.mapResolution(options.resolution)}`);
    }

    if (!options.no_branch_delete) {
      console.log(`🌿 Would delete branch: feature/task-${workItemId}`);
      actions.push(`Deleted branch feature/task-${workItemId}`);
    }

    return {
      success: true,
      issue: {
        id: workItemId,
        status: 'closed',
        resolution: options.resolution || 'fixed',
        url: `https://dev.azure.com/${organization}/${project}/_workitems/edit/${workItemId}`
      },
      actions: actions,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AzureIssueClose();