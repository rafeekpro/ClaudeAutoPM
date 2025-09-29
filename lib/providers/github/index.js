#!/usr/bin/env node

/**
 * GitHub Provider Implementation
 * Maps ClaudeAutoPM concepts to GitHub Issues
 */

const ProviderInterface = require('../interface');

class GitHubProvider extends ProviderInterface {
  constructor(client) {
    super(client);
  }

  /**
   * Create Epic as a GitHub Issue with 'epic' label
   */
  async createEpic(prd) {
    const issue = await this.client.createIssue({
      title: `Epic: ${prd.title}`,
      body: this._formatEpicBody(prd),
      labels: ['epic']
    });

    return {
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      provider: 'github'
    };
  }

  /**
   * Create Task as GitHub Issue linked to Epic
   */
  async createTask(epic, task) {
    const body = `${task.description || task.title}\n\nPart of #${epic.number}`;

    const issue = await this.client.createIssue({
      title: task.title,
      body: body,
      labels: ['task']
    });

    return {
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      epicNumber: epic.number
    };
  }

  /**
   * GitHub doesn't have User Stories, so tasks link directly to Epic
   */
  async createUserStory(epic, story) {
    // In GitHub, we treat user stories as labeled issues
    const body = this._formatStoryBody(story, epic);

    const issue = await this.client.createIssue({
      title: story.title,
      body: body,
      labels: ['user-story', 'epic']
    });

    return {
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      epicNumber: epic.number
    };
  }

  /**
   * Link hierarchy via issue references in GitHub
   */
  async linkHierarchy(parent, child) {
    // GitHub uses issue references in body text
    const currentBody = await this.client.getIssue(child.number);
    const updatedBody = `${currentBody.body}\n\nParent: #${parent.number}`;

    await this.client.updateIssue(child.number, {
      body: updatedBody
    });
  }

  /**
   * Sync complete Epic structure to GitHub
   */
  async syncEpic(epicData) {
    const results = {
      epic: null,
      userStories: [],
      tasks: [],
      hierarchy: {}
    };

    // Create Epic
    results.epic = await this.createEpic({
      title: epicData.title,
      description: epicData.description
    });

    // Create User Stories and Tasks
    if (epicData.userStories && epicData.userStories.length > 0) {
      for (const story of epicData.userStories) {
        const createdStory = await this.createUserStory(results.epic, story);
        results.userStories.push(createdStory);

        // Create tasks for this story
        if (story.tasks && story.tasks.length > 0) {
          const storyTasks = [];
          for (const task of story.tasks) {
            const createdTask = await this.createTask(createdStory, task);
            storyTasks.push(createdTask);
          }
          createdStory.tasks = storyTasks;
        }
      }
    } else if (epicData.issues) {
      // Direct issues without user stories
      for (const issue of epicData.issues) {
        const createdTask = await this.createTask(results.epic, issue);
        results.tasks.push(createdTask);
      }
    }

    // Build hierarchy for response
    results.hierarchy = {
      epic: results.epic,
      userStories: results.userStories.map(story => ({
        id: story.number,
        tasks: story.tasks || []
      }))
    };

    return results;
  }

  /**
   * Get work item (issue) by ID
   */
  async getWorkItem(id) {
    const issue = await this.client.getIssue(id);
    return {
      id: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels
    };
  }

  /**
   * Update work item (issue)
   */
  async updateWorkItem(id, updates) {
    return await this.client.updateIssue(id, updates);
  }

  /**
   * Format Epic body for GitHub
   */
  _formatEpicBody(prd) {
    let body = `# ${prd.title}\n\n`;
    body += `${prd.description || ''}\n\n`;

    if (prd.userStories && prd.userStories.length > 0) {
      body += '## User Stories\n\n';
      prd.userStories.forEach(story => {
        body += `- [ ] ${story}\n`;
      });
      body += '\n';
    }

    if (prd.acceptanceCriteria && prd.acceptanceCriteria.length > 0) {
      body += '## Acceptance Criteria\n\n';
      prd.acceptanceCriteria.forEach(criteria => {
        body += `- ${criteria}\n`;
      });
    }

    return body;
  }

  /**
   * Format User Story body
   */
  _formatStoryBody(story, epic) {
    let body = story.description || story.title;
    body += `\n\nPart of Epic #${epic.number}\n\n`;

    if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
      body += '## Acceptance Criteria\n\n';
      story.acceptanceCriteria.forEach(criteria => {
        body += `- ${criteria}\n`;
      });
    }

    return body;
  }
}

module.exports = GitHubProvider;