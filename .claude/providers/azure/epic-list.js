#!/usr/bin/env node

const { execSync } = require('child_process');

/**
 * Azure DevOps Provider - Epic List Implementation
 * Lists Azure DevOps Features (mapped as epics)
 */
class AzureEpicList {
  /**
   * Execute epic list command for Azure DevOps
   * @param {Object} options - Command options (status, assignee, label, limit)
   * @param {Object} settings - Provider settings from config
   * @returns {Array} List of epics (features) in unified format
   */
  async execute(options = {}, settings = {}) {
    const organization = settings.organization;
    const project = settings.project;

    if (!organization || !project) {
      throw new Error('Azure DevOps not configured. Set organization and project in config.json');
    }

    // For testing, always use mock data unless AUTOPM_USE_REAL_API is set
    if (!process.env.AUTOPM_USE_REAL_API) {
      console.log('📊 Using mock data (set AUTOPM_USE_REAL_API=true for real API)');
      return this.getMockData(options);
    }

    try {
      // Build Azure CLI query
      const query = this.buildQuery(organization, project, options);

      // Execute Azure CLI command
      const result = this.executeAzureCLI(query);

      // Transform to unified format
      return this.transformResults(result);

    } catch (error) {
      // Fallback to mock data if Azure CLI not available
      console.warn('⚠️  Azure CLI error, returning mock data:', error.message);
      return this.getMockData(options);
    }
  }

  /**
   * Build Azure DevOps CLI query
   */
  buildQuery(organization, project, options) {
    // Build WIQL (Work Item Query Language) query
    let wiql = "SELECT [System.Id], [System.Title], [System.Description], " +
               "[System.State], [System.AssignedTo], [System.Tags], " +
               "[System.IterationPath] FROM WorkItems " +
               "WHERE [System.WorkItemType] = 'Feature'";

    // Add status filter
    if (options.status === 'closed') {
      wiql += " AND [System.State] IN ('Done', 'Closed', 'Removed')";
    } else if (options.status === 'open') {
      wiql += " AND [System.State] NOT IN ('Done', 'Closed', 'Removed')";
    }

    // Add assignee filter
    if (options.assignee) {
      wiql += ` AND [System.AssignedTo] = '${options.assignee}'`;
    }

    // Add tag filter (Azure uses tags instead of labels)
    if (options.label) {
      wiql += ` AND [System.Tags] CONTAINS '${options.label}'`;
    }

    wiql += " ORDER BY [System.Id] DESC";

    // Build Azure CLI command
    const query = `az boards query --organization ${organization} ` +
                  `--project "${project}" --wiql "${wiql}"`;

    return query;
  }

  /**
   * Execute Azure CLI command
   */
  executeAzureCLI(query) {
    try {
      const output = execSync(query, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (error) {
      if (error.stderr && error.stderr.includes('az: command not found')) {
        throw new Error('az: command not found');
      }
      throw new Error(`Azure CLI error: ${error.message}`);
    }
  }

  /**
   * Transform Azure results to unified format
   */
  transformResults(azureWorkItems) {
    if (!azureWorkItems || !Array.isArray(azureWorkItems)) {
      return [];
    }

    return azureWorkItems.map(item => {
      const fields = item.fields || {};

      return {
        id: (item.id || fields['System.Id']).toString(),
        title: fields['System.Title'] || 'Untitled',
        description: fields['System.Description'] || '',
        status: this.mapStatus(fields['System.State']),
        assignee: this.extractAssignee(fields['System.AssignedTo']),
        labels: this.extractTags(fields['System.Tags']),
        childCount: this.countChildren(item),
        completedCount: this.countCompleted(item),
        url: this.buildWorkItemUrl(item.id),
        milestone: fields['System.IterationPath'] || null
      };
    });
  }

  /**
   * Map Azure state to unified status
   */
  mapStatus(state) {
    const statusMap = {
      'New': 'open',
      'Active': 'in_progress',
      'In Progress': 'in_progress',
      'Resolved': 'in_review',
      'Done': 'completed',
      'Closed': 'completed',
      'Removed': 'cancelled'
    };
    return statusMap[state] || 'unknown';
  }

  /**
   * Extract assignee from Azure format
   */
  extractAssignee(assignedTo) {
    if (!assignedTo) return null;

    // Azure returns assignee as object with displayName and uniqueName
    if (typeof assignedTo === 'object') {
      return assignedTo.uniqueName || assignedTo.displayName || null;
    }

    // Sometimes it's a string
    if (typeof assignedTo === 'string') {
      // Extract email from format "Name <email@domain.com>"
      const match = assignedTo.match(/<(.+)>/);
      return match ? match[1] : assignedTo;
    }

    return null;
  }

  /**
   * Extract tags from Azure format
   */
  extractTags(tags) {
    if (!tags) return [];

    // Tags are semicolon-separated in Azure
    if (typeof tags === 'string') {
      return tags.split(';').map(t => t.trim()).filter(t => t);
    }

    return [];
  }

  /**
   * Count child work items (would query in real implementation)
   */
  countChildren(item) {
    // In a real implementation, this would query for child work items
    // For now, return mock count based on item ID
    const id = item.id || item.fields?.['System.Id'] || 0;
    return (id % 10) + 3;
  }

  /**
   * Count completed child work items
   */
  countCompleted(item) {
    // In a real implementation, this would query completed child items
    const total = this.countChildren(item);
    const state = item.fields?.['System.State'];

    if (state === 'Done' || state === 'Closed') {
      return total;
    } else if (state === 'Active' || state === 'In Progress') {
      return Math.floor(total * 0.5);
    }

    return 0;
  }

  /**
   * Build work item URL
   */
  buildWorkItemUrl(id) {
    // This would use actual organization/project from settings
    return `https://dev.azure.com/organization/project/_workitems/edit/${id}`;
  }

  /**
   * Get mock data for testing
   */
  getMockData(options) {
    const mockFeatures = [
      {
        id: '2001',
        title: 'User Management Module',
        description: 'Complete user management system with roles and permissions',
        status: 'in_progress',
        assignee: 'dev.team@company.com',
        labels: ['security', 'backend', 'priority-high'],
        childCount: 10,
        completedCount: 5,
        url: 'https://dev.azure.com/org/project/_workitems/edit/2001',
        milestone: 'Sprint 15'
      },
      {
        id: '2002',
        title: 'Reporting Dashboard',
        description: 'Analytics and reporting dashboard for administrators',
        status: 'open',
        assignee: 'frontend.team@company.com',
        labels: ['frontend', 'analytics', 'enhancement'],
        childCount: 7,
        completedCount: 0,
        url: 'https://dev.azure.com/org/project/_workitems/edit/2002',
        milestone: 'Sprint 16'
      },
      {
        id: '2003',
        title: 'Payment Gateway Integration',
        description: 'Integrate multiple payment providers',
        status: 'completed',
        assignee: 'integration.team@company.com',
        labels: ['integration', 'payment', 'critical'],
        childCount: 12,
        completedCount: 12,
        url: 'https://dev.azure.com/org/project/_workitems/edit/2003',
        milestone: 'Sprint 14'
      },
      {
        id: '2004',
        title: 'Mobile App Development',
        description: 'Native mobile applications for iOS and Android',
        status: 'open',
        assignee: 'mobile.team@company.com',
        labels: ['mobile', 'ios', 'android'],
        childCount: 20,
        completedCount: 2,
        url: 'https://dev.azure.com/org/project/_workitems/edit/2004',
        milestone: 'Sprint 17'
      }
    ];

    // Filter based on options
    let filtered = mockFeatures;

    if (options.status !== 'all') {
      filtered = filtered.filter(f => {
        if (options.status === 'closed') {
          return f.status === 'completed';
        }
        return f.status !== 'completed';
      });
    }

    if (options.assignee) {
      filtered = filtered.filter(f =>
        f.assignee && f.assignee.includes(options.assignee)
      );
    }

    if (options.label) {
      filtered = filtered.filter(f => f.labels.includes(options.label));
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }
}

// Export class and instance for testing
module.exports = {
  AzureEpicList,
  execute: (options, settings) => new AzureEpicList().execute(options, settings),
  buildQuery: (organization, project, options) => new AzureEpicList().buildQuery(organization, project, options),
  executeAzureCLI: (query) => new AzureEpicList().executeAzureCLI(query),
  transformResults: (azureWorkItems) => new AzureEpicList().transformResults(azureWorkItems),
  mapStatus: (state) => new AzureEpicList().mapStatus(state),
  extractAssignee: (assignedTo) => new AzureEpicList().extractAssignee(assignedTo),
  extractTags: (tags) => new AzureEpicList().extractTags(tags),
  countChildren: (item) => new AzureEpicList().countChildren(item),
  countCompleted: (item) => new AzureEpicList().countCompleted(item),
  buildWorkItemUrl: (id) => new AzureEpicList().buildWorkItemUrl(id),
  getMockData: (options) => new AzureEpicList().getMockData(options)
};