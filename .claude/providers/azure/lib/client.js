/**
 * Azure DevOps API Client
 * Shared client library for all Azure DevOps provider implementations
 */

const azdev = require('azure-devops-node-api');

class AzureDevOpsClient {
  constructor(config) {
    this.organization = config.organization;
    this.project = config.project;
    this.team = config.team || `${config.project} Team`;
    this.token = process.env.AZURE_DEVOPS_TOKEN;

    if (!this.token) {
      throw new Error('AZURE_DEVOPS_TOKEN environment variable is required');
    }

    if (!this.organization || !this.project) {
      throw new Error('Azure DevOps organization and project are required in config');
    }

    const authHandler = azdev.getPersonalAccessTokenHandler(this.token);
    this.connection = new azdev.WebApi(
      `https://dev.azure.com/${this.organization}`,
      authHandler
    );
  }

  async getWorkItemTrackingApi() {
    return await this.connection.getWorkItemTrackingApi();
  }

  async getCoreApi() {
    return await this.connection.getCoreApi();
  }

  async getWorkApi() {
    return await this.connection.getWorkApi();
  }

  /**
   * Execute a WIQL (Work Item Query Language) query
   */
  async executeWiql(query) {
    const wit = await this.getWorkItemTrackingApi();
    const result = await wit.queryByWiql(
      { query },
      { project: this.project }
    );
    return result;
  }

  /**
   * Get work item with all fields and relations
   */
  async getWorkItem(id, expand = 'All') {
    const wit = await this.getWorkItemTrackingApi();
    return await wit.getWorkItem(
      parseInt(id),
      null, // all fields
      null,
      expand
    );
  }

  /**
   * Get multiple work items
   */
  async getWorkItems(ids, expand = 'All') {
    const wit = await this.getWorkItemTrackingApi();
    return await wit.getWorkItems(
      ids.map(id => parseInt(id)),
      null, // all fields
      null,
      expand
    );
  }

  /**
   * Update work item fields
   */
  async updateWorkItem(id, updates) {
    const wit = await this.getWorkItemTrackingApi();
    const patchDocument = [];

    for (const [field, value] of Object.entries(updates)) {
      patchDocument.push({
        op: 'add',
        path: `/fields/${field}`,
        value: value
      });
    }

    return await wit.updateWorkItem(
      null,
      patchDocument,
      parseInt(id),
      this.project
    );
  }

  /**
   * Create a new work item
   */
  async createWorkItem(workItemType, fields) {
    const wit = await this.getWorkItemTrackingApi();
    const patchDocument = [];

    for (const [field, value] of Object.entries(fields)) {
      patchDocument.push({
        op: 'add',
        path: `/fields/${field}`,
        value: value
      });
    }

    return await wit.createWorkItem(
      null,
      patchDocument,
      this.project,
      workItemType
    );
  }

  /**
   * Add a comment to work item
   */
  async addComment(id, text) {
    const wit = await this.getWorkItemTrackingApi();
    return await wit.addComment(
      { text },
      this.project,
      parseInt(id)
    );
  }

  /**
   * Get current iteration
   */
  async getCurrentIteration() {
    const work = await this.getWorkApi();
    const teamContext = {
      project: this.project,
      team: this.team
    };

    const iterations = await work.getTeamIterations(teamContext, 'current');
    return iterations[0] || null;
  }

  /**
   * Get team capacity for current iteration
   */
  async getTeamCapacity() {
    const work = await this.getWorkApi();
    const iteration = await this.getCurrentIteration();

    if (!iteration) {
      return null;
    }

    const teamContext = {
      project: this.project,
      team: this.team
    };

    return await work.getCapacities(
      teamContext,
      iteration.id
    );
  }

  /**
   * Get iteration work items
   */
  async getIterationWorkItems(iterationPath) {
    const query = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.TeamProject] = '${this.project}'
        AND [System.IterationPath] = '${iterationPath}'
      ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.CreatedDate] DESC
    `;

    return await this.executeWiql(query);
  }

  /**
   * Get work items by type
   */
  async getWorkItemsByType(workItemType, state = null) {
    let query = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.TeamProject] = '${this.project}'
        AND [System.WorkItemType] = '${workItemType}'
    `;

    if (state) {
      query += ` AND [System.State] = '${state}'`;
    }

    query += ` ORDER BY [System.CreatedDate] DESC`;

    return await this.executeWiql(query);
  }

  /**
   * Get child work items
   */
  async getChildWorkItems(parentId) {
    const query = `
      SELECT [System.Id], [System.Title], [System.State]
      FROM WorkItemLinks
      WHERE [Source].[System.Id] = ${parentId}
        AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
      MODE (Recursive)
    `;

    return await this.executeWiql(query);
  }
}

module.exports = AzureDevOpsClient;