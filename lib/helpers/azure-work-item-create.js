#!/usr/bin/env node

/**
 * Azure DevOps Work Item Creation Helper
 * Provides methods to create work items with JSON responses
 */

const fs = require('fs-extra');
const path = require('path');

class AzureWorkItemCreator {
  constructor() {
    this.client = null;
  }

  /**
   * Set Azure DevOps client
   */
  _setClient(client) {
    this.client = client;
  }

  /**
   * Validate that client is configured
   */
  _validateClient() {
    if (!this.client) {
      throw new Error('Azure DevOps client not configured. Call _setClient() first.');
    }
  }

  /**
   * Validate required options
   */
  _validateOptions(options, requiredFields = ['title']) {
    for (const field of requiredFields) {
      if (!options[field]) {
        throw new Error(`${field} is required`);
      }
    }
  }

  /**
   * Build work item fields from options
   */
  async _buildFields(options) {
    const fields = {};

    // Title
    if (options.title) {
      fields['System.Title'] = options.title;
    }

    // Description
    if (options.description) {
      fields['System.Description'] = options.description;
    } else if (options.descriptionFile) {
      fields['System.Description'] = await fs.readFile(options.descriptionFile, 'utf8');
    }

    // Tags
    if (options.tags && options.tags.length > 0) {
      fields['System.Tags'] = options.tags.join('; ');
    }

    // Priority
    if (options.priority !== undefined) {
      fields['Microsoft.VSTS.Common.Priority'] = options.priority;
    }

    // Severity (for bugs)
    if (options.severity) {
      fields['Microsoft.VSTS.Common.Severity'] = options.severity;
    }

    // Iteration Path
    if (options.iterationPath) {
      fields['System.IterationPath'] = options.iterationPath;
    }

    // Area Path
    if (options.areaPath) {
      fields['System.AreaPath'] = options.areaPath;
    }

    // Assigned To
    if (options.assignedTo) {
      fields['System.AssignedTo'] = options.assignedTo;
    }

    // Acceptance Criteria (for stories)
    if (options.acceptanceCriteria) {
      if (typeof options.acceptanceCriteria === 'string') {
        fields['Microsoft.VSTS.Common.AcceptanceCriteria'] = options.acceptanceCriteria;
      } else if (Array.isArray(options.acceptanceCriteria)) {
        fields['Microsoft.VSTS.Common.AcceptanceCriteria'] =
          options.acceptanceCriteria.map(c => `- ${c}`).join('\n');
      }
    }

    // Story Points (for stories)
    if (options.storyPoints !== undefined) {
      fields['Microsoft.VSTS.Scheduling.StoryPoints'] = options.storyPoints;
    }

    // Remaining Work (for tasks)
    if (options.remainingWork !== undefined) {
      fields['Microsoft.VSTS.Scheduling.RemainingWork'] = options.remainingWork;
    }

    // Parent link
    if (options.parentId) {
      fields['System.Parent'] = options.parentId;
    }

    return fields;
  }

  /**
   * Format work item response
   */
  _formatResponse(workItem) {
    return {
      id: workItem.id,
      type: workItem.fields['System.WorkItemType'],
      title: workItem.fields['System.Title'],
      state: workItem.fields['System.State'],
      url: workItem._links?.html?.href || `https://dev.azure.com/_workitems/edit/${workItem.id}`,
      fields: workItem.fields
    };
  }

  /**
   * Create a work item
   */
  async createWorkItem(options) {
    this._validateClient();
    this._validateOptions(options, ['title']);

    try {
      const fields = await this._buildFields(options);
      const workItem = await this.client.createWorkItem(options.type, fields);

      return this._formatResponse(workItem);
    } catch (error) {
      if (error.message && error.message.includes('Unauthorized')) {
        throw new Error('Azure DevOps API Error: Unauthorized. Check your PAT token.');
      }
      throw error;
    }
  }

  /**
   * Create an Epic
   */
  async createEpic(options) {
    const epicName = options.epicName || options.title?.replace(/^Epic:\s*/, '');

    if (!epicName && !options.title) {
      throw new Error('epicName or title is required for epic creation');
    }

    // Prepare epic options
    const epicOptions = {
      type: 'Epic',
      title: options.title || `Epic: ${epicName}`,
      description: options.description || this._generateEpicDescription(options),
      tags: ['epic', `epic:${epicName}`],
      priority: options.priority
    };

    // Add additional fields
    if (options.acceptanceCriteria) {
      epicOptions.acceptanceCriteria = options.acceptanceCriteria;
    }

    return await this.createWorkItem(epicOptions);
  }

  /**
   * Generate epic description from options
   */
  _generateEpicDescription(options) {
    let description = '## Epic Description\n\n';

    if (options.description) {
      description += `${options.description}\n\n`;
    }

    if (options.acceptanceCriteria && options.acceptanceCriteria.length > 0) {
      description += '## Acceptance Criteria\n\n';
      options.acceptanceCriteria.forEach(criteria => {
        description += `- ${criteria}\n`;
      });
      description += '\n';
    }

    if (options.tasks && options.tasks.length > 0) {
      description += '## Tasks\n\n';
      options.tasks.forEach(task => {
        description += `- ${task}\n`;
      });
    }

    return description;
  }

  /**
   * Create a User Story
   */
  async createUserStory(options) {
    this._validateOptions(options, ['title']);

    const storyOptions = {
      type: 'User Story',
      ...options
    };

    return await this.createWorkItem(storyOptions);
  }

  /**
   * Create a Task
   */
  async createTask(options) {
    this._validateOptions(options, ['title']);

    const taskOptions = {
      type: 'Task',
      ...options
    };

    return await this.createWorkItem(taskOptions);
  }

  /**
   * Create multiple work items in batch
   */
  async createBatch(items) {
    const results = [];

    for (const item of items) {
      try {
        const result = await this.createWorkItem(item);
        results.push(result);
      } catch (error) {
        results.push({
          error: error.message,
          item
        });
      }
    }

    return results;
  }

  /**
   * Helper method for PM commands - create epic and return just the ID
   */
  async createEpicAndGetId(options) {
    const result = await this.createEpic(options);
    return result.id;
  }
}

// Create singleton instance
const creator = new AzureWorkItemCreator();

// Export methods bound to instance
module.exports = {
  createWorkItem: creator.createWorkItem.bind(creator),
  createEpic: creator.createEpic.bind(creator),
  createUserStory: creator.createUserStory.bind(creator),
  createTask: creator.createTask.bind(creator),
  createBatch: creator.createBatch.bind(creator),
  createEpicAndGetId: creator.createEpicAndGetId.bind(creator),
  _setClient: creator._setClient.bind(creator)
};