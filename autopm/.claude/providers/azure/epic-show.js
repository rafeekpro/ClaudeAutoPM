/**
 * Azure DevOps Epic Show Command
 * Display detailed information about an epic/feature
 */

const AzureDevOpsClient = require('./lib/client');
const AzureFormatter = require('./lib/formatter');

class AzureEpicShow {
  constructor(settings) {
    this.client = new AzureDevOpsClient(settings);
    this.formatter = AzureFormatter;
  }

  /**
   * Execute the epic show command
   */
  async execute(options, settings) {
    try {
      const { id } = options;

      if (!id) {
        throw new Error('Epic/Feature ID is required');
      }

      // Get the epic/feature work item
      const workItem = await this.client.getWorkItem(id);

      // Verify it's an epic or feature type
      const workItemType = workItem.fields['System.WorkItemType'];
      if (!['Epic', 'Feature'].includes(workItemType)) {
        console.warn(`⚠️ Work item #${id} is a ${workItemType}, not an Epic or Feature`);
      }

      // Get child work items if any
      let children = [];
      if (workItem.relations && workItem.relations.length > 0) {
        const childIds = workItem.relations
          .filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward')
          .map(r => {
            const parts = r.url.split('/');
            return parseInt(parts[parts.length - 1]);
          });

        if (childIds.length > 0) {
          children = await this.client.getWorkItems(childIds);
        }
      }

      // Format the output
      const output = this.formatEpicDetails(workItem, children);

      console.log(output);

      return {
        success: true,
        epic: {
          id: workItem.id,
          title: workItem.fields['System.Title'],
          type: workItemType,
          state: workItem.fields['System.State'],
          url: workItem.url
        }
      };

    } catch (error) {
      console.error(`❌ Failed to show epic: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format epic details for display
   */
  formatEpicDetails(workItem, children) {
    const fields = workItem.fields;
    const output = [];

    // Header
    const type = fields['System.WorkItemType'];
    const id = workItem.id;
    const title = fields['System.Title'];
    output.push(`# ${type} #${id}: ${title}`);
    output.push('');

    // Status and metadata
    output.push(`**Status:** ${fields['System.State']}`);
    output.push(`**Assignee:** ${fields['System.AssignedTo']?.displayName || 'Unassigned'}`);

    if (fields['System.IterationPath']) {
      output.push(`**Iteration:** ${fields['System.IterationPath']}`);
    }

    if (fields['System.AreaPath']) {
      output.push(`**Area:** ${fields['System.AreaPath']}`);
    }

    // Priority and business value
    if (fields['Microsoft.VSTS.Common.Priority']) {
      output.push(`**Priority:** ${fields['Microsoft.VSTS.Common.Priority']}`);
    }

    if (fields['Microsoft.VSTS.Common.BusinessValue']) {
      output.push(`**Business Value:** ${fields['Microsoft.VSTS.Common.BusinessValue']}`);
    }

    // Effort/Story Points
    if (fields['Microsoft.VSTS.Scheduling.StoryPoints']) {
      output.push(`**Story Points:** ${fields['Microsoft.VSTS.Scheduling.StoryPoints']}`);
    }

    if (fields['Microsoft.VSTS.Scheduling.Effort']) {
      output.push(`**Effort:** ${fields['Microsoft.VSTS.Scheduling.Effort']}`);
    }

    // Tags
    if (fields['System.Tags']) {
      const tags = fields['System.Tags'].split(';').map(t => t.trim());
      output.push(`**Tags:** ${tags.join(', ')}`);
    }

    // Description
    if (fields['System.Description']) {
      output.push('');
      output.push('## Description');
      output.push(this.formatter.convertHtmlToMarkdown(fields['System.Description']));
    }

    // Acceptance Criteria
    if (fields['Microsoft.VSTS.Common.AcceptanceCriteria']) {
      output.push('');
      output.push('## Acceptance Criteria');
      output.push(this.formatter.convertHtmlToMarkdown(fields['Microsoft.VSTS.Common.AcceptanceCriteria']));
    }

    // Child Work Items
    if (children && children.length > 0) {
      output.push('');
      output.push(`## Child Work Items (${children.length})`);
      output.push('');

      // Group by state
      const byState = {};
      children.forEach(child => {
        const state = child.fields['System.State'];
        if (!byState[state]) byState[state] = [];
        byState[state].push(child);
      });

      // Display grouped children
      Object.entries(byState).forEach(([state, items]) => {
        output.push(`### ${state} (${items.length})`);
        items.forEach(item => {
          const childType = item.fields['System.WorkItemType'];
          const childTitle = item.fields['System.Title'];
          const assignee = item.fields['System.AssignedTo']?.displayName || 'Unassigned';
          const icon = this.formatter.getStateIcon(state);
          output.push(`${icon} #${item.id} [${childType}] ${childTitle} (${assignee})`);
        });
        output.push('');
      });

      // Progress summary
      const completedStates = ['Done', 'Closed', 'Resolved'];
      const completedCount = children.filter(c =>
        completedStates.includes(c.fields['System.State'])
      ).length;

      const percentage = Math.round((completedCount / children.length) * 100);
      output.push(`**Progress:** ${completedCount}/${children.length} items completed (${percentage}%)`);

      // Story points progress if available
      let totalPoints = 0;
      let completedPoints = 0;
      children.forEach(child => {
        const points = child.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0;
        totalPoints += points;
        if (completedStates.includes(child.fields['System.State'])) {
          completedPoints += points;
        }
      });

      if (totalPoints > 0) {
        const pointsPercentage = Math.round((completedPoints / totalPoints) * 100);
        output.push(`**Story Points:** ${completedPoints}/${totalPoints} points completed (${pointsPercentage}%)`);
      }
    }

    // Dates
    output.push('');
    output.push('## Timeline');
    if (fields['Microsoft.VSTS.Scheduling.StartDate']) {
      output.push(`**Start Date:** ${new Date(fields['Microsoft.VSTS.Scheduling.StartDate']).toLocaleDateString()}`);
    }
    if (fields['Microsoft.VSTS.Scheduling.TargetDate']) {
      output.push(`**Target Date:** ${new Date(fields['Microsoft.VSTS.Scheduling.TargetDate']).toLocaleDateString()}`);
    }
    output.push(`**Created:** ${new Date(fields['System.CreatedDate']).toLocaleDateString()}`);
    output.push(`**Last Updated:** ${new Date(fields['System.ChangedDate']).toLocaleDateString()}`);

    // Link to Azure DevOps
    output.push('');
    const url = `https://dev.azure.com/${this.client.organization}/${this.client.project}/_workitems/edit/${id}`;
    output.push(`🔗 [View in Azure DevOps](${url})`);

    return output.join('\n');
  }
}

// Export class and instance for testing
module.exports = {
  AzureEpicShow,
  execute: (options, settings) => new AzureEpicShow(settings).execute(options, settings),
  formatEpicDetails: (workItem, children) => new AzureEpicShow().formatEpicDetails(workItem, children)
};