#!/usr/bin/env node

/**
 * Azure DevOps Provider Implementation
 * Maps ClaudeAutoPM concepts to Azure DevOps Work Items
 */

const ProviderInterface = require('../interface');

class AzureProvider extends ProviderInterface {
  constructor(client) {
    super(client);
  }

  /**
   * Create Epic Work Item
   */
  async createEpic(prd) {
    const workItem = await this.client.createWorkItem({
      type: 'Epic',
      fields: {
        'System.Title': prd.title,
        'System.Description': prd.description || '',
        'System.Tags': 'ClaudeAutoPM;Epic'
      }
    });

    return {
      id: workItem.id,
      title: workItem.fields['System.Title'],
      url: workItem.url || this._getWorkItemUrl(workItem.id),
      provider: 'azure',
      workItemType: 'Epic'
    };
  }

  /**
   * Create User Story Work Item linked to Epic
   */
  async createUserStory(epic, story) {
    const fields = {
      'System.Title': story.title,
      'System.Description': story.description || '',
      'System.Parent': epic.id,
      'System.Tags': 'ClaudeAutoPM;UserStory'
    };

    // Add acceptance criteria if present
    if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
      fields['Microsoft.VSTS.Common.AcceptanceCriteria'] =
        '<ul>' + story.acceptanceCriteria.map(c => `<li>${c}</li>`).join('') + '</ul>';
    }

    const workItem = await this.client.createWorkItem({
      type: 'User Story',
      fields: fields
    });

    return {
      id: workItem.id,
      title: workItem.fields['System.Title'],
      url: workItem.url || this._getWorkItemUrl(workItem.id),
      parentId: epic.id,
      workItemType: 'User Story'
    };
  }

  /**
   * Create Task Work Item linked to User Story
   */
  async createTask(parent, task) {
    const fields = {
      'System.Title': task.title,
      'System.Description': task.description || '',
      'System.Parent': parent.id,
      'System.Tags': 'ClaudeAutoPM;Task'
    };

    // Add remaining work if specified
    if (task.remainingWork) {
      fields['Microsoft.VSTS.Scheduling.RemainingWork'] = task.remainingWork;
    }

    // Add assigned to if specified
    if (task.assignedTo) {
      fields['System.AssignedTo'] = task.assignedTo;
    }

    const workItem = await this.client.createWorkItem({
      type: 'Task',
      fields: fields
    });

    return {
      id: workItem.id,
      title: workItem.fields['System.Title'],
      url: workItem.url || this._getWorkItemUrl(workItem.id),
      parentId: parent.id,
      workItemType: 'Task'
    };
  }

  /**
   * Link work items in parent-child hierarchy
   */
  async linkHierarchy(parent, child) {
    // Azure DevOps uses the System.Parent field for hierarchy
    await this.client.updateWorkItem({
      id: child.id,
      fields: {
        'System.Parent': parent.id
      }
    });
  }

  /**
   * Sync complete Epic structure to Azure DevOps
   */
  async syncEpic(epicData) {
    const results = {
      epic: null,
      userStories: [],
      hierarchy: {}
    };

    try {
      // Create Epic
      results.epic = await this.createEpic({
        title: epicData.title,
        description: epicData.description
      });

      // Create User Stories with Tasks
      if (epicData.userStories && epicData.userStories.length > 0) {
        for (const story of epicData.userStories) {
          const createdStory = await this.createUserStory(results.epic, story);

          // Track tasks for this story
          const storyTasks = [];

          // Create tasks for this user story
          if (story.tasks && story.tasks.length > 0) {
            for (const task of story.tasks) {
              const createdTask = await this.createTask(createdStory, task);
              storyTasks.push(createdTask);
            }
          }

          results.userStories.push({
            ...createdStory,
            tasks: storyTasks
          });
        }
      }

      // Build hierarchy response
      results.hierarchy = {
        epic: {
          id: results.epic.id,
          title: results.epic.title,
          url: results.epic.url
        },
        userStories: results.userStories.map(story => ({
          id: story.id,
          title: story.title,
          url: story.url,
          tasks: story.tasks.map(task => ({
            id: task.id,
            title: task.title,
            url: task.url
          }))
        }))
      };

      return results;

    } catch (error) {
      throw new Error(`Failed to sync epic: ${error.message}`);
    }
  }

  /**
   * Get work item by ID
   */
  async getWorkItem(id) {
    const workItem = await this.client.getWorkItem({ id });
    return {
      id: workItem.id,
      title: workItem.fields['System.Title'],
      description: workItem.fields['System.Description'],
      state: workItem.fields['System.State'],
      workItemType: workItem.fields['System.WorkItemType'],
      parent: workItem.fields['System.Parent']
    };
  }

  /**
   * Update work item
   */
  async updateWorkItem(id, updates) {
    const fields = {};

    // Map common updates to Azure fields
    if (updates.title) {
      fields['System.Title'] = updates.title;
    }
    if (updates.description) {
      fields['System.Description'] = updates.description;
    }
    if (updates.state) {
      fields['System.State'] = updates.state;
    }
    if (updates.assignedTo) {
      fields['System.AssignedTo'] = updates.assignedTo;
    }

    return await this.client.updateWorkItem({
      id: id,
      fields: fields
    });
  }

  /**
   * Get work item URL
   */
  _getWorkItemUrl(id) {
    // This would need to be configured with actual org/project
    const org = process.env.AZURE_DEVOPS_ORG || 'organization';
    const project = process.env.AZURE_DEVOPS_PROJECT || 'project';
    return `https://dev.azure.com/${org}/${project}/_workitems/edit/${id}`;
  }
}

module.exports = AzureProvider;