/**
 * Azure DevOps API Client
 * Wrapper for azure-devops-node-api with caching and error handling
 */

const azdev = require('azure-devops-node-api');
const AzureCache = require('./cache');

class AzureDevOpsClient {
  constructor(config = {}) {
    this.organization = config.organization || process.env.AZURE_DEVOPS_ORG;
    this.project = config.project || process.env.AZURE_DEVOPS_PROJECT;
    this.pat = config.pat || process.env.AZURE_DEVOPS_PAT;
    this.team = config.team || process.env.AZURE_DEVOPS_TEAM || `${this.project} Team`;

    this.cache = new AzureCache({
      ttl: config.cacheTTL || 5 * 60 * 1000, // 5 minutes default
      maxSize: config.cacheSize || 100
    });

    this.validateConfig();
    this.initConnection();
  }

  validateConfig() {
    const missing = [];
    if (!this.organization) missing.push('AZURE_DEVOPS_ORG');
    if (!this.project) missing.push('AZURE_DEVOPS_PROJECT');
    if (!this.pat) missing.push('AZURE_DEVOPS_PAT');

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  initConnection() {
    const authHandler = azdev.getPersonalAccessTokenHandler(this.pat);
    const serverUrl = `https://dev.azure.com/${this.organization}`;
    this.connection = new azdev.WebApi(serverUrl, authHandler);
  }

  async getWorkItems(ids) {
    if (!ids || ids.length === 0) return [];

    const cacheKey = `workitems:${ids.join(',')}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const witApi = await this.connection.getWorkItemTrackingApi();
      const items = await witApi.getWorkItems(ids);
      this.cache.set(cacheKey, items);
      return items;
    } catch (error) {
      this.handleError(error, 'getWorkItems');
    }
  }

  async executeWiql(query) {
    const cacheKey = `wiql:${this.hashQuery(query)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const witApi = await this.connection.getWorkItemTrackingApi();
      const result = await witApi.queryByWiql(
        { query },
        { project: this.project, team: this.team }
      );
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      this.handleError(error, 'executeWiql');
    }
  }

  async getCurrentSprint() {
    const cacheKey = 'sprint:current';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const workApi = await this.connection.getWorkApi();
      const iterations = await workApi.getTeamIterations(
        { project: this.project, team: this.team },
        '$timeframe=current'
      );

      if (iterations && iterations.length > 0) {
        this.cache.set(cacheKey, iterations[0]);
        return iterations[0];
      }
      return null;
    } catch (error) {
      this.handleError(error, 'getCurrentSprint');
    }
  }

  async getSprintWorkItems(sprintPath) {
    // Escape single quotes to prevent WIQL injection
    const safeSprintPath = String(sprintPath).replace(/'/g, "''");
    const query = `
      SELECT [System.Id], [System.Title], [System.State],
             [System.WorkItemType], [System.AssignedTo],
             [Microsoft.VSTS.Scheduling.RemainingWork]
      FROM workitems
      WHERE [System.IterationPath] = '${safeSprintPath}'
      AND [System.WorkItemType] IN ('Task', 'Bug', 'User Story')
      ORDER BY [Microsoft.VSTS.Common.Priority] ASC
    `;

    const result = await this.executeWiql(query);
    if (!result || !result.workItems) return [];

    const ids = result.workItems.map(item => item.id);
    return this.getWorkItems(ids);
  }

  async getMyWorkItems(userEmail) {
    const assignedTo = userEmail || this.getCurrentUserEmail();
    const query = `
      SELECT [System.Id], [System.Title], [System.State],
             [System.WorkItemType], [Microsoft.VSTS.Scheduling.RemainingWork]
      FROM workitems
      WHERE [System.AssignedTo] = '${assignedTo}'
      AND [System.State] IN ('Active', 'In Progress', 'New')
      ORDER BY [Microsoft.VSTS.Common.Priority] ASC
    `;

    const result = await this.executeWiql(query);
    if (!result || !result.workItems) return [];

    const ids = result.workItems.map(item => item.id);
    return this.getWorkItems(ids);
  }

  getCurrentUserEmail() {
    // Try to get from environment or use @Me as fallback
    return process.env.AZURE_DEVOPS_USER_EMAIL || '@Me';
  }

  hashQuery(query) {
    // Simple hash for cache key
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  handleError(error, operation) {
    console.error(`Azure DevOps API Error in ${operation}:`, error.message);
    if (error.statusCode === 401) {
      throw new Error('Authentication failed. Check your Personal Access Token.');
    } else if (error.statusCode === 404) {
      throw new Error(`Resource not found. Check organization: ${this.organization} and project: ${this.project}`);
    } else {
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }
}

module.exports = AzureDevOpsClient;