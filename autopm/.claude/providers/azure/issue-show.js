/**
 * Azure DevOps Provider - Show Work Item
 * Implements the unified issue:show command for Azure DevOps
 */

const azdev = require('azure-devops-node-api');

class AzureIssueShow {
  constructor(config) {
    this.organization = config.organization;
    this.project = config.project;
    this.token = process.env.AZURE_DEVOPS_TOKEN;

    if (!this.token) {
      throw new Error('AZURE_DEVOPS_TOKEN environment variable is required');
    }

    const authHandler = azdev.getPersonalAccessTokenHandler(this.token);
    this.connection = new azdev.WebApi(
      `https://dev.azure.com/${this.organization}`,
      authHandler
    );
  }

  async execute(args) {
    const { id } = args;

    if (!id) {
      throw new Error('Work Item ID is required');
    }

    try {
      const witApi = await this.connection.getWorkItemTrackingApi();

      // Pobierz Work Item z wszystkimi polami
      const workItem = await witApi.getWorkItem(
        parseInt(id),
        null, // wszystkie pola
        null,
        'All' // rozwiń wszystkie relacje
      );

      return this.formatWorkItem(workItem);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Work Item #${id} not found in project ${this.project}`);
      }
      throw new Error(`Azure DevOps API error: ${error.message}`);
    }
  }

  formatWorkItem(workItem) {
    const fields = workItem.fields;
    const relations = workItem.relations || [];

    // Mapowanie typów Work Item na zunifikowane typy
    const typeMapping = {
      'Epic': 'epic',
      'Feature': 'epic',
      'User Story': 'issue',
      'Task': 'issue',
      'Bug': 'issue'
    };

    // Znajdź relacje parent/child
    const parent = relations.find(r => r.rel === 'System.LinkTypes.Hierarchy-Reverse');
    const children = relations.filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward');
    const attachments = relations.filter(r => r.rel === 'AttachedFile');

    // Przygotuj ustrukturyzowane dane
    const result = {
      id: workItem.id,
      type: typeMapping[fields['System.WorkItemType']] || 'issue',
      title: fields['System.Title'],
      state: this.mapState(fields['System.State']),
      assignee: fields['System.AssignedTo']?.displayName || null,
      created: fields['System.CreatedDate'],
      updated: fields['System.ChangedDate'],

      // Azure DevOps specific
      workItemType: fields['System.WorkItemType'],
      iterationPath: fields['System.IterationPath'],
      areaPath: fields['System.AreaPath'],
      priority: fields['Microsoft.VSTS.Common.Priority'],
      storyPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'],

      // Opis i kryteria akceptacji
      description: fields['System.Description'] || '',
      acceptanceCriteria: fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',

      // Relacje
      parent: parent ? this.extractIdFromUrl(parent.url) : null,
      children: children.map(c => this.extractIdFromUrl(c.url)),
      attachmentCount: attachments.length,

      // Tagi
      tags: fields['System.Tags'] ? fields['System.Tags'].split(';').map(t => t.trim()) : [],

      // URL do Azure DevOps
      url: `https://dev.azure.com/${this.organization}/${this.project}/_workitems/edit/${workItem.id}`,

      // Metryki
      metrics: {
        storyPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0,
        effort: fields['Microsoft.VSTS.Scheduling.Effort'] || 0,
        remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0,
        completedWork: fields['Microsoft.VSTS.Scheduling.CompletedWork'] || 0
      }
    };

    // Formatuj dla wyświetlenia
    return {
      success: true,
      data: result,
      formatted: this.formatForDisplay(result)
    };
  }

  mapState(azureState) {
    // Mapowanie stanów Azure DevOps na zunifikowane
    const stateMap = {
      'New': 'open',
      'Active': 'in_progress',
      'Resolved': 'in_review',
      'Closed': 'closed',
      'Removed': 'cancelled',
      // User Story states
      'To Do': 'open',
      'In Progress': 'in_progress',
      'Done': 'closed'
    };

    return stateMap[azureState] || 'open';
  }

  extractIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/workItems\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  formatForDisplay(item) {
    const output = [];

    output.push(`# ${item.workItemType} #${item.id}: ${item.title}`);
    output.push('');
    output.push(`**Status:** ${item.state}`);
    output.push(`**Assignee:** ${item.assignee || 'Unassigned'}`);
    output.push(`**Iteration:** ${item.iterationPath}`);
    output.push(`**Area:** ${item.areaPath}`);

    if (item.storyPoints) {
      output.push(`**Story Points:** ${item.storyPoints}`);
    }

    if (item.priority) {
      output.push(`**Priority:** ${item.priority}`);
    }

    if (item.parent) {
      output.push(`**Parent:** #${item.parent}`);
    }

    if (item.children.length > 0) {
      output.push(`**Children:** ${item.children.map(c => `#${c}`).join(', ')}`);
    }

    if (item.tags.length > 0) {
      output.push(`**Tags:** ${item.tags.join(', ')}`);
    }

    output.push('');
    output.push('## Description');
    output.push(item.description || '_No description provided_');

    if (item.acceptanceCriteria) {
      output.push('');
      output.push('## Acceptance Criteria');
      output.push(item.acceptanceCriteria);
    }

    if (item.metrics.remainingWork > 0) {
      output.push('');
      output.push('## Work Tracking');
      output.push(`- Remaining: ${item.metrics.remainingWork}h`);
      output.push(`- Completed: ${item.metrics.completedWork}h`);
    }

    output.push('');
    output.push(`🔗 [View in Azure DevOps](${item.url})`);

    return output.join('\n');
  }
}

// Export class and instance for testing
module.exports = {
  AzureIssueShow,
  execute: (args) => new AzureIssueShow({ organization: 'test-org', project: 'test-project' }).execute(args),
  formatWorkItem: (workItem) => new AzureIssueShow({ organization: 'test-org', project: 'test-project' }).formatWorkItem(workItem),
  mapState: (azureState) => new AzureIssueShow({ organization: 'test-org', project: 'test-project' }).mapState(azureState),
  extractIdFromUrl: (url) => new AzureIssueShow({ organization: 'test-org', project: 'test-project' }).extractIdFromUrl(url),
  formatForDisplay: (item) => new AzureIssueShow({ organization: 'test-org', project: 'test-project' }).formatForDisplay(item)
};