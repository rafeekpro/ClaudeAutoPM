#!/usr/bin/env node

/**
 * Azure DevOps Issue Show Command
 * Retrieves and displays work item details
 */

class AzureIssueShow {
  constructor(options = {}) {
    this.config = options;
    this.api = options.api || null;
    this.connection = options.connection || null;
  }

  /**
   * Execute the issue show command
   * @param {Object} params - Command parameters
   * @param {string|number} params.id - Work item ID
   * @returns {Promise<Object>} Result object with success, data, and formatted output
   */
  async execute(params) {
    if (!params || !params.id) {
      throw new Error('Work Item ID is required');
    }

    const workItemId = parseInt(params.id);
    if (isNaN(workItemId)) {
      throw new Error('Invalid work item ID');
    }

    // Check for Azure DevOps token
    if (!process.env.AZURE_DEVOPS_TOKEN && !this.config.token) {
      throw new Error('Azure DevOps personal access token is required. Set AZURE_DEVOPS_TOKEN environment variable.');
    }

    // Get work item from API
    let workItem;
    try {
      // Support both api and connection patterns
      if (this.api && this.api.getWorkItem) {
        workItem = await this.api.getWorkItem(workItemId);
      } else if (this.connection && this.connection.getWorkItemTrackingApi) {
        const witApi = await this.connection.getWorkItemTrackingApi();
        workItem = await witApi.getWorkItem(workItemId);
      } else {
        const project = this.config.project || 'project';
        throw new Error(`Work Item #${workItemId} not found in ${project}`);
      }
    } catch (error) {
      const project = this.config.project || 'project';

      // Handle specific error codes
      if (error.statusCode === 404 || error.message.includes('not found')) {
        throw new Error(`Work Item #${workItemId} not found in ${project}`);
      }
      if (error.statusCode === 403) {
        throw new Error(`Access denied: Insufficient permissions to view Work Item #${workItemId} in ${project}`);
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout: Failed to retrieve Work Item #${workItemId} from Azure DevOps`);
      }

      // Re-throw original error if not handled
      throw error;
    }

    // Validate work item structure
    if (!workItem || typeof workItem !== 'object') {
      throw new Error(`Invalid response: Unable to parse Work Item #${workItemId} data`);
    }

    // Check for required fields
    if (!workItem.fields) {
      throw new Error(`Azure DevOps API error: Invalid work item structure for #${workItemId}`);
    }

    // Map Azure DevOps work item to common format
    const data = this.mapWorkItem(workItem);

    // Format for display
    const formatted = this.formatWorkItem(data);

    return {
      success: true,
      data: data,
      formatted: formatted
    };
  }

  /**
   * Extract work item ID from relation URL
   */
  extractWorkItemId(url) {
    if (!url) return null;
    const match = url.match(/workItems\/(\d+)$/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Map Azure DevOps work item to common format
   */
  mapWorkItem(workItem) {
    const fields = workItem.fields || {};
    const relations = workItem.relations || [];

    // Map work item type
    const typeMap = {
      'User Story': 'issue',
      'Bug': 'bug',
      'Task': 'task',
      'Epic': 'epic',
      'Feature': 'feature'
    };

    // Map state
    const stateMap = {
      'New': 'open',
      'Active': 'in_progress',
      'In Progress': 'in_progress',
      'Resolved': 'in_review',  // Changed from 'resolved' to match test
      'Closed': 'closed',
      'Done': 'closed',
      'Removed': 'cancelled'  // Added for Bug work items
    };

    // Extract parent/children relationships and attachments from relations
    let parent = null;
    const children = [];
    let attachmentCount = 0;

    relations.forEach(relation => {
      if (relation.rel === 'System.LinkTypes.Hierarchy-Reverse') {
        // Parent relationship
        parent = this.extractWorkItemId(relation.url);
      } else if (relation.rel === 'System.LinkTypes.Hierarchy-Forward') {
        // Child relationship
        const childId = this.extractWorkItemId(relation.url);
        if (childId) children.push(childId);
      } else if (relation.rel === 'AttachedFile') {
        // Attachment
        attachmentCount++;
      }
    });

    return {
      id: workItem.id,
      type: typeMap[fields['System.WorkItemType']] || 'issue',
      title: fields['System.Title'] || '',
      description: fields['System.Description'] || '',
      state: stateMap[fields['System.State']] || 'open',
      assignee: fields['System.AssignedTo']?.displayName || fields['System.AssignedTo'] || null,
      creator: fields['System.CreatedBy']?.displayName || fields['System.CreatedBy'] || null,
      created_at: fields['System.CreatedDate'] || null,
      updated_at: fields['System.ChangedDate'] || null,
      priority: fields['Microsoft.VSTS.Common.Priority'] || null,
      tags: fields['System.Tags'] ? fields['System.Tags'].split(';').map(t => t.trim()) : [],
      project: fields['System.TeamProject'] || null,
      area: fields['System.AreaPath'] || null,
      iteration: fields['System.IterationPath'] || null,
      url: workItem._links?.html?.href || null,
      // Additional fields expected by tests
      workItemType: fields['System.WorkItemType'],
      areaPath: fields['System.AreaPath'] || null,
      iterationPath: fields['System.IterationPath'] || null,
      storyPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
      parent: parent,
      children: children,
      attachmentCount: attachmentCount,
      acceptanceCriteria: fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || null,
      originalType: fields['System.WorkItemType'],
      originalState: fields['System.State'],
      // Metrics object
      metrics: {
        storyPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0,
        effort: fields['Microsoft.VSTS.Scheduling.Effort'] || 0,
        remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0,
        completedWork: fields['Microsoft.VSTS.Scheduling.CompletedWork'] || 0,
        originalEstimate: fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || 0
      }
    };
  }

  /**
   * Format work item for display
   */
  formatWorkItem(data) {
    const lines = [];
    lines.push('═'.repeat(60));
    lines.push(`${data.originalType || 'Work Item'} #${data.id}: ${data.title}`);
    lines.push('═'.repeat(60));
    lines.push('');
    lines.push(`**Status:** ${data.state}`);
    lines.push(`**Assignee:** ${data.assignee || 'Unassigned'}`);
    lines.push(`**Priority:** ${data.priority || 'Not set'}`);
    lines.push(`**Iteration:** ${data.iterationPath || data.iteration || 'Not set'}`);

    // Add story points if present
    if (data.metrics && data.metrics.storyPoints) {
      lines.push(`**Story Points:** ${data.metrics.storyPoints}`);
    }

    // Add parent/children relationships
    if (data.parent) {
      lines.push(`**Parent:** #${data.parent}`);
    }

    if (data.children && data.children.length > 0) {
      lines.push(`**Children:** ${data.children.map(c => `#${c}`).join(', ')}`);
    }

    // Add tags
    if (data.tags && data.tags.length > 0) {
      lines.push(`**Tags:** ${data.tags.join(', ')}`);
    }

    // Add work metrics
    if (data.metrics) {
      if (data.metrics.remainingWork > 0) {
        lines.push(`**Remaining:** ${data.metrics.remainingWork}h`);
      }
      if (data.metrics.completedWork > 0) {
        lines.push(`**Completed:** ${data.metrics.completedWork}h`);
      }
    }

    if (data.created_at) {
      lines.push(`**Created:** ${new Date(data.created_at).toLocaleString()}`);
    }

    if (data.updated_at) {
      lines.push(`**Updated:** ${new Date(data.updated_at).toLocaleString()}`);
    }

    if (data.description) {
      lines.push('');
      lines.push('Description:');
      lines.push('-'.repeat(60));
      lines.push(data.description.substring(0, 500));
      if (data.description.length > 500) {
        lines.push('... (truncated)');
      }
    } else {
      lines.push('');
      lines.push('Description:');
      lines.push('-'.repeat(60));
      lines.push('_No description provided_');
    }

    // Generate Azure DevOps URL if not provided
    if (data.url) {
      lines.push('');
      lines.push(`View Online: ${data.url}`);
    } else if (this.config.organization && this.config.project) {
      lines.push('');
      lines.push('View in Azure DevOps:');
      lines.push(`https://dev.azure.com/${this.config.organization}/${this.config.project}/_workitems/edit/${data.id}`);
    }

    lines.push('═'.repeat(60));

    return lines.join('\n');
  }

  /**
   * Run as CLI command
   */
  async run(args) {
    const workItemId = args[0];

    if (!workItemId) {
      console.error('Error: Work Item ID is required');
      console.error('Usage: azure-issue-show <work-item-id>');
      process.exit(1);
    }

    try {
      const result = await this.execute({ id: workItemId });
      console.log(result.formatted);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
}

// Export for testing and module usage
module.exports = AzureIssueShow;

// Run if called directly
if (require.main === module) {
  const issueShow = new AzureIssueShow();
  issueShow.run(process.argv.slice(2));
}