#!/usr/bin/env node

/**
 * Azure DevOps User Story List
 * Lists user stories with optional feature filtering
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const dotenv = require('dotenv');
const AzureDevOpsClient = require('../../providers/azure/lib/client');

class AzureUserStoryList {
  constructor(options = {}) {
    this.options = options;
    this.projectPath = options.projectPath || process.cwd();
    this.silent = options.silent || false;
    this.format = options.format || 'table';

    // Initialize colors
    this.colors = this.silent ? {
      green: (str) => str,
      blue: (str) => str,
      yellow: (str) => str,
      red: (str) => str,
      cyan: (str) => str,
      gray: (str) => str,
      bold: (str) => str
    } : {
      green: chalk.green || ((str) => str),
      blue: chalk.blue || ((str) => str),
      yellow: chalk.yellow || ((str) => str),
      red: chalk.red || ((str) => str),
      cyan: chalk.cyan || ((str) => str),
      gray: chalk.gray || ((str) => str),
      bold: chalk.bold || ((str) => str)
    };

    this.envVars = {};
    this.client = null;
  }

  async loadEnvironment() {
    this.envVars = {
      AZURE_DEVOPS_PAT: process.env.AZURE_DEVOPS_PAT,
      AZURE_DEVOPS_ORG: process.env.AZURE_DEVOPS_ORG,
      AZURE_DEVOPS_PROJECT: process.env.AZURE_DEVOPS_PROJECT,
      AZURE_DEVOPS_TEAM: process.env.AZURE_DEVOPS_TEAM
    };

    const envPath = path.join(this.projectPath, '.env');
    try {
      await fs.access(envPath);
      const envConfig = dotenv.parse(await fs.readFile(envPath, 'utf8'));
      Object.keys(envConfig).forEach(key => {
        if (key.startsWith('AZURE_DEVOPS_')) {
          this.envVars[key] = envConfig[key];
        }
      });
    } catch (err) {
      // File doesn't exist, ignore
    }

    if (!this.envVars.AZURE_DEVOPS_PAT || !this.envVars.AZURE_DEVOPS_ORG || !this.envVars.AZURE_DEVOPS_PROJECT) {
      throw new Error('Azure DevOps configuration missing. Run "pm azure-setup" first.');
    }
  }

  async initializeClient() {
    await this.loadEnvironment();
    this.client = new AzureDevOpsClient({
      pat: this.envVars.AZURE_DEVOPS_PAT,
      organization: this.envVars.AZURE_DEVOPS_ORG,
      project: this.envVars.AZURE_DEVOPS_PROJECT,
      team: this.envVars.AZURE_DEVOPS_TEAM
    });
  }

  async listUserStories(featureId = null) {
    try {
      await this.initializeClient();

      let wiql;
      if (featureId) {
        // Get stories for specific feature
        wiql = `
          SELECT [System.Id], [System.Title], [System.State],
                 [System.AssignedTo], [Microsoft.VSTS.Scheduling.StoryPoints]
          FROM WorkItemLinks
          WHERE [Source].[System.Id] = ${featureId}
            AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
            AND [Target].[System.WorkItemType] = 'User Story'
          MODE (Recursive)
        `;
      } else {
        // Get all user stories
        wiql = `
          SELECT [System.Id], [System.Title], [System.State],
                 [System.AssignedTo], [Microsoft.VSTS.Scheduling.StoryPoints]
          FROM WorkItems
          WHERE [System.WorkItemType] = 'User Story'
          ORDER BY [System.State], [System.Id] DESC
        `;
      }

      const result = await this.client.queryWorkItems(wiql);

      if (!result || (!result.workItems && !result.workItemRelations)) {
        console.log(this.colors.yellow('No user stories found.'));
        return;
      }

      const ids = featureId 
        ? result.workItemRelations.filter(r => r.target).map(r => r.target.id)
        : result.workItems.map(wi => wi.id);

      const stories = await Promise.all(ids.map(id => this.client.getWorkItem(id)));

      this.displayStories(stories, featureId);

    } catch (error) {
      console.error(this.colors.red('Error:'), error.message);
      process.exit(1);
    }
  }

  displayStories(stories, featureId) {
    if (stories.length === 0) {
      console.log(this.colors.yellow('No user stories found.'));
      return;
    }

    console.log('\n' + this.colors.bold(featureId ? `User Stories for Feature #${featureId}` : 'User Stories'));
    console.log('='.repeat(80));

    // Group by state
    const byState = {};
    stories.forEach(story => {
      const state = story.fields['System.State'];
      if (!byState[state]) byState[state] = [];
      byState[state].push(story);
    });

    ['Done', 'Active', 'New'].forEach(state => {
      if (byState[state]) {
        console.log('\n' + this.colors.bold(state + ':'));
        byState[state].forEach(story => {
          const id = story.id;
          const title = story.fields['System.Title'];
          const points = story.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || '-';
          const assignee = story.fields['System.AssignedTo']?.displayName || 'Unassigned';

          const icon = state === 'Done' ? this.colors.green('✓') :
                      state === 'Active' ? this.colors.blue('●') :
                      this.colors.gray('○');

          console.log(`  ${icon} #${id}: ${title}`);
          console.log(`     Points: ${points} | Assigned: ${assignee}`);
        });
      }
    });

    // Summary
    const total = stories.length;
    const done = stories.filter(s => s.fields['System.State'] === 'Done').length;
    const totalPoints = stories.reduce((sum, s) => sum + (s.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0), 0);

    console.log('\n' + '-'.repeat(80));
    console.log(`Total: ${total} stories | Done: ${done} | Total Points: ${totalPoints}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  let featureId = null;
  const options = { projectPath: process.cwd() };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: azure-us-list [feature-id] [options]');
      console.log('\nList user stories');
      console.log('\nOptions:');
      console.log('  -h, --help     Show this help message');
      console.log('  -s, --silent   Suppress color output');
      console.log('  --path <path>  Project path');
      process.exit(0);
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else if (arg === '--path' && i + 1 < args.length) {
      options.projectPath = args[++i];
    } else if (!arg.startsWith('-')) {
      featureId = arg;
    }
  }

  const usList = new AzureUserStoryList(options);
  await usList.listUserStories(featureId);
}

module.exports = AzureUserStoryList;

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
