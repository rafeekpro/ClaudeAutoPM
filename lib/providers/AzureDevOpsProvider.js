/**
 * Azure DevOps Provider for ClaudeAutoPM
 *
 * Provides bidirectional synchronization with Azure DevOps Work Items
 * following 2025 best practices
 *
 * Features:
 * - Full CRUD operations for work items (Epic, Feature, User Story, Task, Bug)
 * - Comment management
 * - Area Path and Iteration Path management
 * - WIQL queries for advanced filtering
 * - Relation management (Parent/Child links)
 * - State mapping (Azure DevOps <-> Local)
 * - Error handling with meaningful messages
 *
 * @module lib/providers/AzureDevOpsProvider
 */

const azdev = require('azure-devops-node-api');

/**
 * Azure DevOps Provider Class
 *
 * Manages integration with Azure DevOps Work Item Tracking API
 *
 * @class AzureDevOpsProvider
 */
class AzureDevOpsProvider {
  /**
   * Creates a new Azure DevOps provider instance
   *
   * @param {Object} options - Configuration options
   * @param {string} [options.token] - Personal Access Token (PAT)
   * @param {string} [options.organization] - Azure DevOps organization name
   * @param {string} [options.project] - Project name
   */
  constructor(options = {}) {
    this.token = options.token || process.env.AZURE_DEVOPS_PAT;
    this.organization = options.organization || process.env.AZURE_DEVOPS_ORG;
    this.project = options.project || process.env.AZURE_DEVOPS_PROJECT;

    this.connection = null;
    this.witApi = null;
  }

  /**
   * Authenticates with Azure DevOps API
   *
   * Creates connection using PAT and verifies project access
   *
   * @async
   * @returns {Promise<Object>} Project object
   * @throws {Error} If token, organization, or project is missing
   * @throws {Error} If project not found or access denied
   */
  async authenticate() {
    if (!this.token) {
      throw new Error('Azure DevOps PAT token is required');
    }

    if (!this.organization) {
      throw new Error('Azure DevOps organization is required');
    }

    if (!this.project) {
      throw new Error('Azure DevOps project is required');
    }

    // Create organization URL
    const orgUrl = `https://dev.azure.com/${this.organization}`;

    // Create auth handler
    const authHandler = azdev.getPersonalAccessTokenHandler(this.token);

    // Create connection
    this.connection = new azdev.WebApi(orgUrl, authHandler);

    // Get Work Item Tracking API
    this.witApi = await this.connection.getWorkItemTrackingApi();

    // Verify project access
    const project = await this.witApi.getProject(this.project);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return project;
  }

  /**
   * Fetches a single work item by ID
   *
   * @async
   * @param {number} id - Work item ID
   * @param {string} [expand] - Expand option (None, Relations, Fields, Links, All)
   * @returns {Promise<Object>} Work item object
   * @throws {Error} If work item is not found
   */
  async getWorkItem(id, expand) {
    try {
      return await this._makeRequest(async () => {
        return await this.witApi.getWorkItem(id, expand);
      });
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Work item not found: ${id}`);
      }
      throw error;
    }
  }

  /**
   * Lists work items with optional filtering
   *
   * @async
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.type] - Work item type (Epic, Feature, User Story, Task, Bug)
   * @param {string} [filters.state] - Work item state (New, Active, Resolved, Closed)
   * @param {string} [filters.areaPath] - Area path filter
   * @param {string} [filters.iterationPath] - Iteration path filter
   * @returns {Promise<Array>} Array of work item objects
   */
  async listWorkItems(filters = {}) {
    // Build WIQL query
    let wiql = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${this.project}'`;

    if (filters.type) {
      wiql += ` AND [System.WorkItemType] = '${filters.type}'`;
    }

    if (filters.state) {
      wiql += ` AND [System.State] = '${filters.state}'`;
    }

    if (filters.areaPath) {
      wiql += ` AND [System.AreaPath] = '${filters.areaPath}'`;
    }

    if (filters.iterationPath) {
      wiql += ` AND [System.IterationPath] = '${filters.iterationPath}'`;
    }

    // Execute query
    const queryResult = await this.witApi.queryByWiql(
      { query: wiql },
      this.project
    );

    // Get work item IDs
    const ids = queryResult.workItems ? queryResult.workItems.map(wi => wi.id) : [];

    if (ids.length === 0) {
      return [];
    }

    // Fetch full work items
    const workItems = await this.witApi.getWorkItems(
      ids,
      undefined,
      undefined,
      'None'
    );

    return workItems;
  }

  /**
   * Creates a new work item
   *
   * @async
   * @param {string} type - Work item type (Epic, Feature, User Story, Task, Bug)
   * @param {Object} data - Work item data
   * @param {string} data.title - Work item title (required)
   * @param {string} [data.description] - Work item description
   * @param {string} [data.state] - Work item state
   * @param {string} [data.areaPath] - Area path
   * @param {string} [data.iterationPath] - Iteration path
   * @returns {Promise<Object>} Created work item object
   * @throws {Error} If title is missing
   */
  async createWorkItem(type, data) {
    if (!data.title) {
      throw new Error('Work item title is required');
    }

    // Build JSON Patch Document
    const patchDoc = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: data.title
      }
    ];

    if (data.description) {
      patchDoc.push({
        op: 'add',
        path: '/fields/System.Description',
        value: data.description
      });
    }

    if (data.state) {
      patchDoc.push({
        op: 'add',
        path: '/fields/System.State',
        value: data.state
      });
    }

    if (data.areaPath) {
      patchDoc.push({
        op: 'add',
        path: '/fields/System.AreaPath',
        value: data.areaPath
      });
    }

    if (data.iterationPath) {
      patchDoc.push({
        op: 'add',
        path: '/fields/System.IterationPath',
        value: data.iterationPath
      });
    }

    return await this.witApi.createWorkItem(
      null,
      patchDoc,
      this.project,
      type
    );
  }

  /**
   * Updates an existing work item
   *
   * @async
   * @param {number} id - Work item ID
   * @param {Object} data - Fields to update
   * @param {string} [data.title] - New title
   * @param {string} [data.description] - New description
   * @param {string} [data.state] - New state
   * @param {string} [data.areaPath] - New area path
   * @param {string} [data.iterationPath] - New iteration path
   * @returns {Promise<Object>} Updated work item object
   */
  async updateWorkItem(id, data) {
    // Build JSON Patch Document
    const patchDoc = [];

    if (data.title) {
      patchDoc.push({
        op: 'replace',
        path: '/fields/System.Title',
        value: data.title
      });
    }

    if (data.description) {
      patchDoc.push({
        op: 'replace',
        path: '/fields/System.Description',
        value: data.description
      });
    }

    if (data.state) {
      patchDoc.push({
        op: 'replace',
        path: '/fields/System.State',
        value: data.state
      });
    }

    if (data.areaPath) {
      patchDoc.push({
        op: 'replace',
        path: '/fields/System.AreaPath',
        value: data.areaPath
      });
    }

    if (data.iterationPath) {
      patchDoc.push({
        op: 'replace',
        path: '/fields/System.IterationPath',
        value: data.iterationPath
      });
    }

    return await this.witApi.updateWorkItem(null, patchDoc, id);
  }

  /**
   * Deletes a work item
   *
   * @async
   * @param {number} id - Work item ID
   * @returns {Promise<Object>} Delete result
   * @throws {Error} If work item not found
   */
  async deleteWorkItem(id) {
    try {
      return await this._makeRequest(async () => {
        return await this.witApi.deleteWorkItem(id);
      }, { id });
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Work item not found: ${id}`);
      }
      throw error;
    }
  }

  /**
   * Adds a comment to a work item
   *
   * @async
   * @param {number} workItemId - Work item ID
   * @param {string} text - Comment text
   * @returns {Promise<Object>} Created comment object
   * @throws {Error} If text is empty
   */
  async addComment(workItemId, text) {
    if (!text || text.trim() === '') {
      throw new Error('Comment text is required');
    }

    return await this.witApi.addComment(
      { text },
      this.project,
      workItemId
    );
  }

  /**
   * Gets all comments for a work item
   *
   * @async
   * @param {number} workItemId - Work item ID
   * @returns {Promise<Object>} Comments object with comments array
   */
  async getComments(workItemId) {
    return await this.witApi.getComments(this.project, workItemId);
  }

  /**
   * Updates a comment
   *
   * @async
   * @param {number} workItemId - Work item ID
   * @param {number} commentId - Comment ID
   * @param {string} text - New comment text
   * @returns {Promise<Object>} Updated comment object
   */
  async updateComment(workItemId, commentId, text) {
    return await this.witApi.updateComment(
      { text },
      this.project,
      workItemId,
      commentId
    );
  }

  /**
   * Deletes a comment
   *
   * @async
   * @param {number} workItemId - Work item ID
   * @param {number} commentId - Comment ID
   * @returns {Promise<void>}
   */
  async deleteComment(workItemId, commentId) {
    return await this.witApi.deleteComment(
      this.project,
      workItemId,
      commentId
    );
  }

  /**
   * Sets the area path for a work item
   *
   * @async
   * @param {number} workItemId - Work item ID
   * @param {string} path - Area path (e.g., "project\\Team A")
   * @returns {Promise<Object>} Updated work item object
   */
  async setAreaPath(workItemId, path) {
    const patchDoc = [
      {
        op: 'replace',
        path: '/fields/System.AreaPath',
        value: path
      }
    ];

    return await this.witApi.updateWorkItem(null, patchDoc, workItemId);
  }

  /**
   * Sets the iteration path for a work item
   *
   * @async
   * @param {number} workItemId - Work item ID
   * @param {string} path - Iteration path (e.g., "project\\Sprint 1")
   * @returns {Promise<Object>} Updated work item object
   */
  async setIterationPath(workItemId, path) {
    const patchDoc = [
      {
        op: 'replace',
        path: '/fields/System.IterationPath',
        value: path
      }
    ];

    return await this.witApi.updateWorkItem(null, patchDoc, workItemId);
  }

  /**
   * Executes a WIQL query
   *
   * @async
   * @param {string} wiql - WIQL query string
   * @param {Object} [options={}] - Query options
   * @param {string} [options.expand] - Expand option for work items
   * @returns {Promise<Array>} Array of work item objects
   */
  async queryWorkItems(wiql, options = {}) {
    // Execute query
    const queryResult = await this.witApi.queryByWiql(
      { query: wiql },
      this.project
    );

    // Get work item IDs
    const ids = queryResult.workItems ? queryResult.workItems.map(wi => wi.id) : [];

    if (ids.length === 0 || !ids.length) {
      return [];
    }

    // Fetch full work items
    const expand = options.expand || 'None';
    const workItems = await this.witApi.getWorkItems(
      ids,
      undefined,
      undefined,
      expand
    );

    return workItems;
  }

  /**
   * Adds a relation to a work item
   *
   * @async
   * @param {number} workItemId - Work item ID
   * @param {Object} relation - Relation object
   * @param {string} relation.rel - Relation type (e.g., "System.LinkTypes.Hierarchy-Reverse")
   * @param {string} relation.url - Related work item URL
   * @returns {Promise<Object>} Updated work item object
   */
  async addRelation(workItemId, relation) {
    const patchDoc = [
      {
        op: 'add',
        path: '/relations/-',
        value: relation
      }
    ];

    return await this.witApi.updateWorkItem(null, patchDoc, workItemId);
  }

  /**
   * Gets all relations for a work item
   *
   * @async
   * @param {number} workItemId - Work item ID
   * @returns {Promise<Array>} Array of relation objects
   */
  async getRelations(workItemId) {
    const workItem = await this.witApi.getWorkItem(workItemId, 'Relations');

    return workItem.relations || [];
  }

  /**
   * Checks rate limit status
   *
   * Azure DevOps does not expose rate limit information via API
   *
   * @async
   * @returns {Promise<Object>} Rate limit information (not available)
   */
  async checkRateLimit() {
    return {
      available: false,
      message: 'Azure DevOps does not expose rate limit information via API'
    };
  }

  /**
   * Maps Azure DevOps state to local status
   *
   * @param {string} azureState - Azure DevOps state
   * @returns {string} Local status
   */
  _mapStateToLocal(azureState) {
    const stateMap = {
      'New': 'open',
      'Active': 'in-progress',
      'Resolved': 'done',
      'Closed': 'closed',
      'Removed': 'closed'
    };

    return stateMap[azureState] || azureState;
  }

  /**
   * Maps local status to Azure DevOps state
   *
   * @param {string} localStatus - Local status
   * @returns {string} Azure DevOps state
   */
  _mapLocalStatusToState(localStatus) {
    const statusMap = {
      'open': 'New',
      'in-progress': 'Active',
      'done': 'Resolved',
      'closed': 'Closed'
    };

    return statusMap[localStatus] || localStatus;
  }

  /**
   * Makes a request with error handling
   *
   * @async
   * @param {Function} requestFn - Function that makes the request
   * @param {Object} [context={}] - Context for error messages
   * @returns {Promise<*>} Response data
   * @throws {Error} If request fails with meaningful error message
   * @private
   */
  async _makeRequest(requestFn, context = {}) {
    try {
      return await requestFn();
    } catch (error) {
      // Handle specific error codes
      if (error.statusCode === 401) {
        throw new Error('Authentication failed - check AZURE_DEVOPS_PAT');
      }

      if (error.statusCode === 403) {
        throw new Error('Access denied - check PAT permissions');
      }

      if (error.statusCode === 404 && context.id) {
        throw new Error(`Work item not found: ${context.id}`);
      }

      // Rethrow other errors
      throw error;
    }
  }
}

module.exports = AzureDevOpsProvider;
