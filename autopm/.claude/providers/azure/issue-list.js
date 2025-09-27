/**
 * Azure DevOps Provider - List Work Items
 * Implements the unified issue:list command for Azure DevOps
 */

const AzureDevOpsClient = require('./lib/client');
const AzureFormatter = require('./lib/formatter');

class AzureIssueList {
  constructor(config) {
    this.client = new AzureDevOpsClient(config);
    this.config = config;
  }

  async execute(args = {}) {
    const {
      state = null,
      type = null,
      assignee = null,
      iteration = 'current',
      limit = 50,
      format = 'list'
    } = args;

    try {
      // Build WIQL query
      const query = this.buildQuery({
        state,
        type,
        assignee,
        iteration,
        limit
      });

      // Execute query
      const queryResult = await this.client.executeWiql(query);

      if (!queryResult.workItems || queryResult.workItems.length === 0) {
        return {
          success: true,
          data: [],
          formatted: 'No work items found matching the criteria.'
        };
      }

      // Get full work item details
      const ids = queryResult.workItems.map(wi => wi.id);
      const workItems = await this.client.getWorkItems(ids);

      // Format results based on requested format
      const formatted = this.formatResults(workItems, format);

      return {
        success: true,
        data: workItems.map(wi => this.transformWorkItem(wi)),
        formatted
      };
    } catch (error) {
      throw new Error(`Failed to list work items: ${error.message}`);
    }
  }

  buildQuery(filters) {
    let conditions = [`[System.TeamProject] = '${this.client.project}'`];

    // State filter
    if (filters.state) {
      const stateMap = {
        'open': ['New', 'To Do', 'Active'],
        'in_progress': ['In Progress', 'Active', 'Doing'],
        'closed': ['Done', 'Closed', 'Resolved'],
        'all': null
      };

      const states = stateMap[filters.state] || [filters.state];
      if (states) {
        conditions.push(`[System.State] IN (${states.map(s => `'${s}'`).join(', ')})`);
      }
    }

    // Type filter
    if (filters.type) {
      const typeMap = {
        'epic': ['Epic', 'Feature'],
        'issue': ['User Story', 'Task', 'Bug'],
        'story': ['User Story'],
        'task': ['Task'],
        'bug': ['Bug']
      };

      const types = typeMap[filters.type] || [filters.type];
      conditions.push(`[System.WorkItemType] IN (${types.map(t => `'${t}'`).join(', ')})`);
    }

    // Assignee filter
    if (filters.assignee) {
      if (filters.assignee === '@me') {
        conditions.push(`[System.AssignedTo] = @Me`);
      } else if (filters.assignee === 'unassigned') {
        conditions.push(`[System.AssignedTo] = ''`);
      } else {
        conditions.push(`[System.AssignedTo] = '${filters.assignee}'`);
      }
    }

    // Iteration filter
    if (filters.iteration === 'current') {
      conditions.push(`[System.IterationPath] UNDER '${this.client.project}'`);
      conditions.push(`[System.Iteration.StartDate] <= @Today`);
      conditions.push(`[System.Iteration.EndDate] >= @Today`);
    } else if (filters.iteration) {
      conditions.push(`[System.IterationPath] = '${filters.iteration}'`);
    }

    // Build final query
    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT
        [System.Id],
        [System.Title],
        [System.State],
        [System.AssignedTo],
        [System.WorkItemType],
        [System.IterationPath],
        [Microsoft.VSTS.Scheduling.StoryPoints],
        [Microsoft.VSTS.Common.Priority]
      FROM WorkItems
      WHERE ${whereClause}
      ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.CreatedDate] DESC
    `;

    // Apply limit if specified
    if (filters.limit) {
      return query + ` TOP ${filters.limit}`;
    }

    return query;
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
      workItemType: fields['System.WorkItemType'],
      azureState: fields['System.State'],
      url: `https://dev.azure.com/${this.config.organization}/${this.config.project}/_workitems/edit/${workItem.id}`
    };
  }

  formatResults(workItems, format) {
    const output = [];

    switch (format) {
      case 'table':
        return this.formatAsTable(workItems);

      case 'detailed':
        return this.formatDetailed(workItems);

      case 'board':
        return this.formatAsBoard(workItems);

      case 'list':
      default:
        return this.formatAsList(workItems);
    }
  }

  formatAsList(workItems) {
    const output = [];

    workItems.forEach(item => {
      const fields = item.fields;
      const id = item.id;
      const type = fields['System.WorkItemType'];
      const title = fields['System.Title'];
      const state = fields['System.State'];
      const assignee = fields['System.AssignedTo']?.displayName || 'Unassigned';
      const icon = AzureFormatter.getStateIcon(state);

      output.push(`${icon} #${id} [${type}] ${title}`);
      output.push(`   Status: ${state} | Assignee: ${assignee}`);

      if (fields['Microsoft.VSTS.Scheduling.StoryPoints']) {
        output.push(`   Story Points: ${fields['Microsoft.VSTS.Scheduling.StoryPoints']}`);
      }

      output.push('');
    });

    return output.join('\n').trim();
  }

  formatAsTable(workItems) {
    const output = [];

    // Header
    output.push('| ID | Type | Title | State | Assignee | Points |');
    output.push('|----|------|-------|-------|----------|--------|');

    workItems.forEach(item => {
      const fields = item.fields;
      const id = `#${item.id}`;
      const type = fields['System.WorkItemType'];
      const title = fields['System.Title'].substring(0, 40) +
                    (fields['System.Title'].length > 40 ? '...' : '');
      const state = fields['System.State'];
      const assignee = fields['System.AssignedTo']?.displayName || 'Unassigned';
      const points = fields['Microsoft.VSTS.Scheduling.StoryPoints'] || '-';

      output.push(`| ${id} | ${type} | ${title} | ${state} | ${assignee} | ${points} |`);
    });

    return output.join('\n');
  }

  formatDetailed(workItems) {
    const output = [];

    workItems.forEach((item, index) => {
      if (index > 0) output.push('\n---\n');
      output.push(AzureFormatter.formatWorkItem(
        item,
        this.config.organization,
        this.config.project
      ));
    });

    return output.join('\n');
  }

  formatAsBoard(workItems) {
    const output = [];
    const board = {
      'To Do': [],
      'In Progress': [],
      'Done': []
    };

    // Categorize work items
    workItems.forEach(item => {
      const state = item.fields['System.State'];
      let column = 'To Do';

      if (['Done', 'Closed', 'Resolved'].includes(state)) {
        column = 'Done';
      } else if (['In Progress', 'Active', 'Doing'].includes(state)) {
        column = 'In Progress';
      }

      board[column].push(item);
    });

    // Format board
    output.push('## 📋 Work Items Board\n');

    Object.entries(board).forEach(([column, items]) => {
      output.push(`### ${column} (${items.length})`);
      output.push('');

      if (items.length === 0) {
        output.push('_No items_');
      } else {
        items.forEach(item => {
          const fields = item.fields;
          const id = item.id;
          const type = fields['System.WorkItemType'];
          const title = fields['System.Title'];
          const assignee = fields['System.AssignedTo']?.displayName || 'Unassigned';
          const points = fields['Microsoft.VSTS.Scheduling.StoryPoints'];

          output.push(`- #${id} [${type}] ${title}`);
          output.push(`  👤 ${assignee}${points ? ` | ${points} pts` : ''}`);
        });
      }

      output.push('');
    });

    // Summary
    const totalItems = workItems.length;
    const totalPoints = workItems.reduce((sum, item) =>
      sum + (item.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0), 0);

    output.push('---');
    output.push(`**Total:** ${totalItems} items | ${totalPoints} story points`);

    return output.join('\n');
  }
}

// Export class and instance for testing
module.exports = {
  AzureIssueList,
  execute: (args) => new AzureIssueList().execute(args),
  buildQuery: (filters) => new AzureIssueList({ client: { project: 'test-project' } }).buildQuery(filters),
  transformWorkItem: (workItem) => new AzureIssueList({ organization: 'test-org', project: 'test-project' }).transformWorkItem(workItem),
  formatResults: (workItems, format) => new AzureIssueList().formatResults(workItems, format),
  formatAsList: (workItems) => new AzureIssueList().formatAsList(workItems),
  formatAsTable: (workItems) => new AzureIssueList().formatAsTable(workItems),
  formatDetailed: (workItems) => new AzureIssueList().formatDetailed(workItems),
  formatAsBoard: (workItems) => new AzureIssueList().formatAsBoard(workItems)
};