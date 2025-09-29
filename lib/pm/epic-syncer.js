#!/usr/bin/env node

/**
 * Epic Syncer
 * Syncs Epic structure to provider (GitHub/Azure DevOps)
 */

const fs = require('fs-extra');
const path = require('path');
const ProviderFactory = require('../providers/factory');

class EpicSyncer {
  constructor(options = {}) {
    this.provider = options.provider || this.detectProvider();
    this.client = options.client || this.getDefaultClient();
    this.providerInstance = this.getProviderInstance();
  }

  /**
   * Detect provider from config
   */
  detectProvider() {
    try {
      const configPath = path.join(process.cwd(), '.claude', 'config.json');
      if (fs.existsSync(configPath)) {
        const config = fs.readJsonSync(configPath);
        return config.provider || 'github';
      }
    } catch (error) {
      console.error(`Error detecting provider: ${error.message}`);
    }
    return 'github';
  }

  /**
   * Get default client for provider
   */
  getDefaultClient() {
    if (this.provider === 'azure') {
      return require('../../lib/azure/client').getClient();
    } else {
      // Mock GitHub client for now
      return {
        createIssue: async (data) => ({ number: Date.now(), ...data }),
        updateIssue: async (number, data) => ({ number, ...data }),
        getIssue: async (number) => ({ number, body: 'Issue body' })
      };
    }
  }

  /**
   * Get provider instance
   */
  getProviderInstance() {
    if (this.client) {
      return ProviderFactory.create(this.provider, this.client);
    }
    return ProviderFactory.autoDetect();
  }

  /**
   * Sync epic to provider
   */
  async sync(epicName) {
    const epicJsonPath = path.join(process.cwd(), '.claude', 'epics', `${epicName}.json`);

    if (!await fs.pathExists(epicJsonPath)) {
      throw new Error(`Epic not found: ${epicName}`);
    }

    const epicData = await fs.readJson(epicJsonPath);

    let result;
    if (this.provider === 'azure') {
      result = await this.syncToAzure(epicData);
    } else {
      result = await this.syncToGitHub(epicData);
    }

    // Update epic file with provider IDs
    await this.updateEpicFile(epicName, epicData, result);

    return result;
  }

  /**
   * Sync to Azure DevOps
   */
  async syncToAzure(epicData) {
    try {
      const result = await this.providerInstance.syncEpic(epicData);

      // Add Azure-specific URLs and IDs
      if (result.hierarchy) {
        result.epic = result.hierarchy.epic;
        result.userStories = result.hierarchy.userStories;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to sync epic: ${error.message}`);
    }
  }

  /**
   * Sync to GitHub
   */
  async syncToGitHub(epicData) {
    try {
      const result = await this.providerInstance.syncEpic(epicData);

      // GitHub returns a simpler structure
      return result;
    } catch (error) {
      throw new Error(`Failed to sync epic: ${error.message}`);
    }
  }

  /**
   * Update epic file with provider IDs
   */
  async updateEpicFile(epicName, epicData, syncResult) {
    const epicJsonPath = path.join(process.cwd(), '.claude', 'epics', `${epicName}.json`);

    // Add provider sync information
    if (this.provider === 'azure') {
      epicData.azureDevOps = {
        epicId: syncResult.epic.id,
        url: syncResult.epic.url,
        syncedAt: new Date().toISOString()
      };

      // Add IDs to user stories
      if (epicData.userStories && syncResult.userStories) {
        epicData.userStories.forEach((story, index) => {
          const syncedStory = syncResult.userStories[index];
          if (syncedStory) {
            story.azureDevOps = {
              storyId: syncedStory.id,
              url: syncedStory.url
            };

            // Add IDs to tasks
            if (story.tasks && syncedStory.tasks) {
              story.tasks.forEach((task, taskIndex) => {
                const syncedTask = syncedStory.tasks[taskIndex];
                if (syncedTask) {
                  task.azureDevOps = {
                    taskId: syncedTask.id,
                    url: syncedTask.url
                  };
                }
              });
            }
          }
        });
      }
    } else if (this.provider === 'github') {
      epicData.github = {
        epicNumber: syncResult.epic.number,
        url: syncResult.epic.url,
        syncedAt: new Date().toISOString()
      };

      // Add issue numbers
      if (epicData.issues && syncResult.tasks) {
        epicData.issues.forEach((issue, index) => {
          const syncedIssue = syncResult.tasks[index];
          if (syncedIssue) {
            issue.github = {
              issueNumber: syncedIssue.number,
              url: syncedIssue.url
            };
          }
        });
      }
    }

    // Save updated epic
    await fs.writeJson(epicJsonPath, epicData, { spaces: 2 });

    // Also update markdown file
    await this.updateEpicMarkdown(epicName, epicData);
  }

  /**
   * Update epic markdown file
   */
  async updateEpicMarkdown(epicName, epicData) {
    const epicMdPath = path.join(process.cwd(), '.claude', 'epics', `${epicName}.md`);

    if (!await fs.pathExists(epicMdPath)) {
      return;
    }

    let markdown = await fs.readFile(epicMdPath, 'utf8');

    // Add sync status to frontmatter
    const frontmatterEnd = markdown.indexOf('---', 3);
    if (frontmatterEnd > 0) {
      const frontmatter = markdown.substring(0, frontmatterEnd);
      const content = markdown.substring(frontmatterEnd);

      let syncInfo = '';
      if (this.provider === 'azure' && epicData.azureDevOps) {
        syncInfo = `\nazure_epic_id: ${epicData.azureDevOps.epicId}`;
        syncInfo += `\nazure_url: ${epicData.azureDevOps.url}`;
      } else if (this.provider === 'github' && epicData.github) {
        syncInfo = `\ngithub_epic_number: ${epicData.github.epicNumber}`;
        syncInfo += `\ngithub_url: ${epicData.github.url}`;
      }

      if (syncInfo) {
        markdown = frontmatter + syncInfo + '\nsynced: true' + content;
        await fs.writeFile(epicMdPath, markdown);
      }
    }
  }
}

module.exports = EpicSyncer;