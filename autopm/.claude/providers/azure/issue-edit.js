/**
 * Azure DevOps Provider - Edit Work Item
 * Implements the unified issue:edit command for Azure DevOps
 */

const AzureDevOpsClient = require('./lib/client');
const AzureFormatter = require('./lib/formatter');

class AzureIssueEdit {
  constructor(config) {
    this.client = new AzureDevOpsClient(config);
    this.config = config;
  }

  async execute(args) {
    const { id, updates = {} } = args;

    if (!id) {
      throw new Error('Work Item ID is required');
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    try {
      // Get current work item to show before state
      const beforeItem = await this.client.getWorkItem(id);

      // Map unified fields to Azure DevOps fields
      const azureUpdates = this.mapUpdates(updates, beforeItem);

      // Perform the update
      const updatedItem = await this.client.updateWorkItem(id, azureUpdates);

      // Add comment if provided
      if (updates.comment) {
        await this.client.addComment(id, updates.comment);
      }

      // Format the response
      return {
        success: true,
        data: {
          before: this.transformWorkItem(beforeItem),
          after: this.transformWorkItem(updatedItem),
          changes: this.getChanges(beforeItem, updatedItem)
        },
        formatted: this.formatResult(beforeItem, updatedItem, updates)
      };
    } catch (error) {
      throw new Error(`Failed to update work item: ${error.message}`);
    }
  }

  mapUpdates(updates, currentItem) {
    const azureUpdates = {};
    const fields = currentItem.fields;

    // Title
    if (updates.title) {
      azureUpdates['System.Title'] = updates.title;
    }

    // Description
    if (updates.description !== undefined) {
      azureUpdates['System.Description'] = this.convertMarkdownToHtml(updates.description);
    }

    // State
    if (updates.state) {
      azureUpdates['System.State'] = this.mapStateToAzure(
        updates.state,
        fields['System.WorkItemType']
      );
    }

    // Assignee
    if (updates.assignee !== undefined) {
      if (updates.assignee === 'unassigned' || updates.assignee === null) {
        azureUpdates['System.AssignedTo'] = '';
      } else if (updates.assignee === '@me') {
        // This will be handled by Azure DevOps API
        azureUpdates['System.AssignedTo'] = '@Me';
      } else {
        azureUpdates['System.AssignedTo'] = updates.assignee;
      }
    }

    // Priority
    if (updates.priority !== undefined) {
      azureUpdates['Microsoft.VSTS.Common.Priority'] = updates.priority;
    }

    // Story Points
    if (updates.storyPoints !== undefined) {
      azureUpdates['Microsoft.VSTS.Scheduling.StoryPoints'] = updates.storyPoints;
    }

    // Effort
    if (updates.effort !== undefined) {
      azureUpdates['Microsoft.VSTS.Scheduling.Effort'] = updates.effort;
    }

    // Remaining Work
    if (updates.remainingWork !== undefined) {
      azureUpdates['Microsoft.VSTS.Scheduling.RemainingWork'] = updates.remainingWork;
    }

    // Completed Work
    if (updates.completedWork !== undefined) {
      azureUpdates['Microsoft.VSTS.Scheduling.CompletedWork'] = updates.completedWork;
    }

    // Acceptance Criteria (for User Stories)
    if (updates.acceptanceCriteria !== undefined) {
      azureUpdates['Microsoft.VSTS.Common.AcceptanceCriteria'] =
        this.convertMarkdownToHtml(updates.acceptanceCriteria);
    }

    // Repro Steps (for Bugs)
    if (updates.reproSteps !== undefined) {
      azureUpdates['Microsoft.VSTS.TCM.ReproSteps'] =
        this.convertMarkdownToHtml(updates.reproSteps);
    }

    // Tags
    if (updates.tags !== undefined) {
      if (Array.isArray(updates.tags)) {
        azureUpdates['System.Tags'] = updates.tags.join('; ');
      } else {
        azureUpdates['System.Tags'] = updates.tags;
      }
    }

    // Iteration Path
    if (updates.iteration) {
      azureUpdates['System.IterationPath'] = updates.iteration;
    }

    // Area Path
    if (updates.area) {
      azureUpdates['System.AreaPath'] = updates.area;
    }

    return azureUpdates;
  }

  mapStateToAzure(unifiedState, workItemType) {
    // Map unified state to Azure DevOps state based on work item type
    const stateMap = {
      'User Story': {
        'open': 'To Do',
        'in_progress': 'In Progress',
        'in_review': 'In Progress',
        'closed': 'Done',
        'cancelled': 'Removed'
      },
      'Task': {
        'open': 'To Do',
        'in_progress': 'In Progress',
        'in_review': 'In Progress',
        'closed': 'Done',
        'cancelled': 'Removed'
      },
      'Bug': {
        'open': 'Active',
        'in_progress': 'Active',
        'in_review': 'Resolved',
        'closed': 'Closed',
        'cancelled': 'Closed'
      },
      'Epic': {
        'open': 'In Planning',
        'in_progress': 'In Development',
        'in_review': 'In Development',
        'closed': 'Done',
        'cancelled': 'Removed'
      },
      'Feature': {
        'open': 'In Planning',
        'in_progress': 'In Development',
        'in_review': 'In Development',
        'closed': 'Done',
        'cancelled': 'Removed'
      }
    };

    const typeMap = stateMap[workItemType] || stateMap['User Story'];
    return typeMap[unifiedState] || unifiedState;
  }

  convertMarkdownToHtml(markdown) {
    if (!markdown) return '';

    // Basic markdown to HTML conversion
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br/>')
      // Lists
      .replace(/^\* (.+)$/gim, '<li>$1</li>')
      .replace(/^- (.+)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    return html;
  }

  transformWorkItem(workItem) {
    const fields = workItem.fields;

    return {
      id: workItem.id,
      type: AzureFormatter.mapWorkItemType(fields['System.WorkItemType']),
      title: fields['System.Title'],
      state: AzureFormatter.mapState(fields['System.State']),
      assignee: fields['System.AssignedTo']?.displayName || null,
      priority: fields['Microsoft.VSTS.Common.Priority'],
      storyPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'],
      iteration: fields['System.IterationPath'],
      area: fields['System.AreaPath'],
      tags: fields['System.Tags'] ? fields['System.Tags'].split(';').map(t => t.trim()) : [],
      workItemType: fields['System.WorkItemType'],
      azureState: fields['System.State']
    };
  }

  getChanges(beforeItem, afterItem) {
    const changes = [];
    const beforeFields = beforeItem.fields;
    const afterFields = afterItem.fields;

    const fieldsToCheck = [
      { field: 'System.Title', label: 'Title' },
      { field: 'System.State', label: 'State' },
      { field: 'System.AssignedTo', label: 'Assignee', getValue: f => f?.displayName || 'Unassigned' },
      { field: 'Microsoft.VSTS.Common.Priority', label: 'Priority' },
      { field: 'Microsoft.VSTS.Scheduling.StoryPoints', label: 'Story Points' },
      { field: 'System.IterationPath', label: 'Iteration' },
      { field: 'System.AreaPath', label: 'Area' },
      { field: 'System.Tags', label: 'Tags' }
    ];

    fieldsToCheck.forEach(({ field, label, getValue }) => {
      const beforeValue = getValue ? getValue(beforeFields[field]) : beforeFields[field];
      const afterValue = getValue ? getValue(afterFields[field]) : afterFields[field];

      if (beforeValue !== afterValue) {
        changes.push({
          field: label,
          before: beforeValue || '(empty)',
          after: afterValue || '(empty)'
        });
      }
    });

    return changes;
  }

  formatResult(beforeItem, afterItem, requestedUpdates) {
    const output = [];
    const fields = afterItem.fields;

    output.push(`# Work Item Updated: #${afterItem.id}`);
    output.push('');
    output.push(`**Type:** ${fields['System.WorkItemType']}`);
    output.push(`**Title:** ${fields['System.Title']}`);
    output.push('');

    // Show changes
    const changes = this.getChanges(beforeItem, afterItem);
    if (changes.length > 0) {
      output.push('## Changes Applied:');
      changes.forEach(change => {
        output.push(`- **${change.field}:** ${change.before} → ${change.after}`);
      });
      output.push('');
    }

    // Show current state
    output.push('## Current State:');
    output.push(`- **Status:** ${fields['System.State']}`);
    output.push(`- **Assignee:** ${fields['System.AssignedTo']?.displayName || 'Unassigned'}`);

    if (fields['Microsoft.VSTS.Common.Priority']) {
      output.push(`- **Priority:** ${fields['Microsoft.VSTS.Common.Priority']}`);
    }

    if (fields['Microsoft.VSTS.Scheduling.StoryPoints']) {
      output.push(`- **Story Points:** ${fields['Microsoft.VSTS.Scheduling.StoryPoints']}`);
    }

    if (fields['System.IterationPath']) {
      output.push(`- **Iteration:** ${fields['System.IterationPath']}`);
    }

    // Add comment notification
    if (requestedUpdates.comment) {
      output.push('');
      output.push('## Comment Added:');
      output.push(`"${requestedUpdates.comment}"`);
    }

    // Link to Azure DevOps
    output.push('');
    const url = `https://dev.azure.com/${this.config.organization}/${this.config.project}/_workitems/edit/${afterItem.id}`;
    output.push(`🔗 [View in Azure DevOps](${url})`);

    return output.join('\n');
  }
}

// Export class and instance for testing
module.exports = {
  AzureIssueEdit,
  execute: (args) => new AzureIssueEdit().execute(args),
  mapUpdates: (updates, currentItem) => new AzureIssueEdit().mapUpdates(updates, currentItem),
  mapStateToAzure: (unifiedState, workItemType) => new AzureIssueEdit().mapStateToAzure(unifiedState, workItemType),
  convertMarkdownToHtml: (markdown) => new AzureIssueEdit().convertMarkdownToHtml(markdown),
  transformWorkItem: (workItem) => new AzureIssueEdit().transformWorkItem(workItem),
  getChanges: (beforeItem, afterItem) => new AzureIssueEdit().getChanges(beforeItem, afterItem),
  formatResult: (beforeItem, afterItem, requestedUpdates) => new AzureIssueEdit({}).formatResult(beforeItem, afterItem, requestedUpdates)
};