/**
 * Azure DevOps Provider - List Work Items (OPTIMIZED)
 * Implements caching and performance improvements
 */

const AzureDevOpsClient = require('./lib/client');
const AzureFormatter = require('./lib/formatter');
const AzureCache = require('./lib/cache');

class AzureIssueListOptimized {
  constructor(config) {
    this.client = new AzureDevOpsClient(config);
    this.config = config;

    // Initialize cache with 2-minute TTL for list operations
    this.cache = new AzureCache({
      ttl: 120000,
      maxSize: 50
    });

    // Track performance metrics
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      totalTime: 0
    };
  }

  async execute(args = {}) {
    const startTime = Date.now();

    const {
      state = null,
      type = null,
      assignee = null,
      iteration = 'current',
      limit = 50,
      format = 'list',
      noCache = false // Allow cache bypass for fresh data
    } = args;

    try {
      // Generate cache key from parameters
      const cacheKey = AzureCache.generateKey('issue-list', {
        state,
        type,
        assignee,
        iteration,
        limit,
        project: this.client.project
      });

      // Check cache unless explicitly bypassed
      if (!noCache) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          this.metrics.totalTime += Date.now() - startTime;

          // Add cache indicator to response
          return {
            ...cached,
            cached: true,
            cacheStats: this.cache.getStats()
          };
        }
      }

      // Build WIQL query
      const query = this.buildQuery({
        state,
        type,
        assignee,
        iteration,
        limit
      });

      // Execute query with error handling
      this.metrics.apiCalls++;
      const queryResult = await this.executeWithRetry(
        () => this.client.executeWiql(query)
      );

      if (!queryResult.workItems || queryResult.workItems.length === 0) {
        const emptyResult = {
          success: true,
          data: [],
          formatted: 'No work items found matching the criteria.'
        };

        // Cache empty results for shorter time (30 seconds)
        this.cache.set(cacheKey, emptyResult, 30000);
        this.metrics.totalTime += Date.now() - startTime;

        return emptyResult;
      }

      // Batch work item retrieval for better performance
      const workItems = await this.batchGetWorkItems(queryResult.workItems);

      // Format results based on requested format
      const formatted = this.formatResults(workItems, format);

      const result = {
        success: true,
        data: workItems.map(wi => this.transformWorkItem(wi)),
        formatted,
        count: workItems.length,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      this.metrics.totalTime += Date.now() - startTime;

      return {
        ...result,
        cached: false,
        executionTime: Date.now() - startTime,
        metrics: this.getMetrics()
      };

    } catch (error) {
      this.metrics.totalTime += Date.now() - startTime;
      throw new Error(`Failed to list work items: ${error.message}`);
    }
  }

  /**
   * Batch retrieval of work items with optimal batch size
   */
  async batchGetWorkItems(workItemRefs) {
    const ids = workItemRefs.map(wi => wi.id);
    const batchSize = 50; // Azure DevOps optimal batch size

    if (ids.length <= batchSize) {
      this.metrics.apiCalls++;
      return await this.client.getWorkItems(ids);
    }

    // Split into batches and retrieve in parallel
    const batches = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    // Execute up to 3 batches in parallel to avoid rate limiting
    const results = [];
    for (let i = 0; i < batches.length; i += 3) {
      const batchPromises = batches
        .slice(i, i + 3)
        .map(batch => {
          this.metrics.apiCalls++;
          return this.executeWithRetry(() => this.client.getWorkItems(batch));
        });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
    }

    return results;
  }

  /**
   * Execute API call with retry logic
   */
  async executeWithRetry(fn, maxRetries = 2) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (error.statusCode === 429) {
          // Rate limited - wait before retry
          const delay = Math.pow(2, i) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (error.statusCode >= 500) {
          // Server error - retry with delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Non-retryable error
          throw error;
        }
      }
    }

    throw lastError;
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

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      apiCalls: this.metrics.apiCalls,
      cacheHits: this.metrics.cacheHits,
      avgTime: this.metrics.totalTime / (this.metrics.apiCalls + this.metrics.cacheHits),
      cacheStats: this.cache.getStats()
    };
  }

  /**
   * Clear cache (useful for testing or force refresh)
   */
  clearCache() {
    this.cache.clear();
    this.metrics.cacheHits = 0;
  }
}

module.exports = AzureIssueListOptimized;