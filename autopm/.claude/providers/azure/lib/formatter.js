/**
 * Azure DevOps Formatter
 * Utilities for formatting Azure DevOps work items for display
 */

class AzureFormatter {
  /**
   * Map Azure DevOps work item type to unified type
   */
  static mapWorkItemType(azureType) {
    const typeMapping = {
      'Epic': 'epic',
      'Feature': 'epic',
      'User Story': 'issue',
      'Task': 'issue',
      'Bug': 'issue',
      'Issue': 'issue',
      'Requirement': 'issue',
      'Test Case': 'test',
      'Test Plan': 'test',
      'Test Suite': 'test'
    };

    return typeMapping[azureType] || 'issue';
  }

  /**
   * Map Azure DevOps state to unified state
   */
  static mapState(azureState) {
    const stateMap = {
      // Common states
      'New': 'open',
      'Active': 'in_progress',
      'Resolved': 'in_review',
      'Closed': 'closed',
      'Removed': 'cancelled',
      // User Story states
      'To Do': 'open',
      'In Progress': 'in_progress',
      'Done': 'closed',
      // Task states
      'Doing': 'in_progress',
      // Bug states
      'Proposed': 'open',
      'Committed': 'open',
      // Epic/Feature states
      'In Planning': 'open',
      'Ready': 'open',
      'In Development': 'in_progress'
    };

    return stateMap[azureState] || 'open';
  }

  /**
   * Format work item for CLI display
   */
  static formatWorkItem(workItem, organization, project) {
    const fields = workItem.fields;
    const output = [];

    // Header
    const type = fields['System.WorkItemType'];
    const id = workItem.id;
    const title = fields['System.Title'];
    output.push(`# ${type} #${id}: ${title}`);
    output.push('');

    // Metadata
    output.push(`**Status:** ${fields['System.State']}`);
    output.push(`**Assignee:** ${fields['System.AssignedTo']?.displayName || 'Unassigned'}`);

    if (fields['System.IterationPath']) {
      output.push(`**Iteration:** ${fields['System.IterationPath']}`);
    }

    if (fields['System.AreaPath']) {
      output.push(`**Area:** ${fields['System.AreaPath']}`);
    }

    // Priority and estimates
    if (fields['Microsoft.VSTS.Common.Priority']) {
      output.push(`**Priority:** ${fields['Microsoft.VSTS.Common.Priority']}`);
    }

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
      output.push(this.convertHtmlToMarkdown(fields['System.Description']));
    }

    // Acceptance Criteria (for User Stories)
    if (fields['Microsoft.VSTS.Common.AcceptanceCriteria']) {
      output.push('');
      output.push('## Acceptance Criteria');
      output.push(this.convertHtmlToMarkdown(fields['Microsoft.VSTS.Common.AcceptanceCriteria']));
    }

    // Repro Steps (for Bugs)
    if (fields['Microsoft.VSTS.TCM.ReproSteps']) {
      output.push('');
      output.push('## Repro Steps');
      output.push(this.convertHtmlToMarkdown(fields['Microsoft.VSTS.TCM.ReproSteps']));
    }

    // Work tracking
    const remaining = fields['Microsoft.VSTS.Scheduling.RemainingWork'];
    const completed = fields['Microsoft.VSTS.Scheduling.CompletedWork'];
    if (remaining || completed) {
      output.push('');
      output.push('## Work Tracking');
      if (remaining) output.push(`- Remaining: ${remaining}h`);
      if (completed) output.push(`- Completed: ${completed}h`);
    }

    // Link to Azure DevOps
    output.push('');
    const url = `https://dev.azure.com/${organization}/${project}/_workitems/edit/${id}`;
    output.push(`🔗 [View in Azure DevOps](${url})`);

    return output.join('\n');
  }

  /**
   * Format work item list for CLI display
   */
  static formatWorkItemList(workItems, showDetails = false) {
    const output = [];

    workItems.forEach(item => {
      const fields = item.fields;
      const id = item.id;
      const type = fields['System.WorkItemType'];
      const title = fields['System.Title'];
      const state = fields['System.State'];
      const assignee = fields['System.AssignedTo']?.displayName || 'Unassigned';

      if (showDetails) {
        output.push(`## ${type} #${id}: ${title}`);
        output.push(`   Status: ${state} | Assignee: ${assignee}`);

        if (fields['Microsoft.VSTS.Scheduling.StoryPoints']) {
          output.push(`   Story Points: ${fields['Microsoft.VSTS.Scheduling.StoryPoints']}`);
        }

        output.push('');
      } else {
        const stateIcon = this.getStateIcon(state);
        output.push(`${stateIcon} #${id} [${type}] ${title} (${assignee})`);
      }
    });

    return output.join('\n');
  }

  /**
   * Get icon for state
   */
  static getStateIcon(state) {
    const icons = {
      'New': '○',
      'To Do': '○',
      'Active': '◐',
      'In Progress': '◐',
      'Doing': '◐',
      'Resolved': '◑',
      'Done': '●',
      'Closed': '●',
      'Removed': '✗'
    };

    return icons[state] || '○';
  }

  /**
   * Convert HTML to Markdown (basic)
   */
  static convertHtmlToMarkdown(html) {
    if (!html) return '';

    // Remove HTML tags but preserve line breaks
    let markdown = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<li>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/?[^>]+(>|$)/g, '');

    // Decode HTML entities
    markdown = markdown
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Clean up excessive whitespace
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return markdown;
  }

  /**
   * Format sprint/iteration summary
   */
  static formatSprintSummary(iteration, workItems) {
    const output = [];

    output.push(`# Sprint: ${iteration.name}`);
    output.push(`**Dates:** ${new Date(iteration.attributes.startDate).toLocaleDateString()} - ${new Date(iteration.attributes.finishDate).toLocaleDateString()}`);
    output.push('');

    // Group work items by state
    const byState = {};
    workItems.forEach(item => {
      const state = item.fields['System.State'];
      if (!byState[state]) byState[state] = [];
      byState[state].push(item);
    });

    // Summary stats
    output.push('## Summary');
    Object.entries(byState).forEach(([state, items]) => {
      output.push(`- ${state}: ${items.length} items`);
    });

    // Calculate story points
    let totalPoints = 0;
    let completedPoints = 0;
    workItems.forEach(item => {
      const points = item.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0;
      totalPoints += points;
      if (['Done', 'Closed'].includes(item.fields['System.State'])) {
        completedPoints += points;
      }
    });

    if (totalPoints > 0) {
      output.push('');
      output.push(`**Story Points:** ${completedPoints} / ${totalPoints} completed`);
      output.push(`**Progress:** ${Math.round((completedPoints / totalPoints) * 100)}%`);
    }

    return output.join('\n');
  }
}

module.exports = AzureFormatter;