#!/usr/bin/env node

/**
 * Azure DevOps User Story Status
 * Shows status summary of all user stories
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const dotenv = require('dotenv');
const AzureDevOpsClient = require('../../providers/azure/lib/client');

class AzureUserStoryStatus {
  constructor(options = {}) {
    this.options = options;
    this.projectPath = options.projectPath || process.cwd();
    this.silent = options.silent || false;

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
      AZURE_DEVOPS_TEAM: process.env.AZURE_DEVOPS_TEAM,
      AZURE_DEVOPS_ITERATION_PATH: process.env.AZURE_DEVOPS_ITERATION_PATH
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

  renderProgressBar(percentage, width = 30) {
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    let color;
    if (percentage >= 80) color = this.colors.green;
    else if (percentage >= 50) color = this.colors.yellow;
    else color = this.colors.red;

    return color(bar) + ` ${percentage}%`;
  }

  async showStatus() {
    try {
      await this.initializeClient();

      // Query for current sprint stories
      let iterationFilter = '';
      if (this.envVars.AZURE_DEVOPS_ITERATION_PATH) {
        iterationFilter = ` AND [System.IterationPath] UNDER '${this.envVars.AZURE_DEVOPS_ITERATION_PATH}'`;
      }

      const wiql = `
        SELECT [System.Id], [System.Title], [System.State],
               [System.AssignedTo], [Microsoft.VSTS.Scheduling.StoryPoints],
               [System.IterationPath], [System.Tags]
        FROM WorkItems
        WHERE [System.WorkItemType] = 'User Story'${iterationFilter}
        ORDER BY [System.State], [Microsoft.VSTS.Common.Priority] ASC
      `;

      const result = await this.client.queryWorkItems(wiql);

      if (!result || !result.workItems || result.workItems.length === 0) {
        console.log(this.colors.yellow('No user stories found.'));
        return;
      }

      const stories = await Promise.all(
        result.workItems.map(wi => this.client.getWorkItem(wi.id))
      );

      this.displayStatus(stories);

    } catch (error) {
      console.error(this.colors.red('Error:'), error.message);
      process.exit(1);
    }
  }

  displayStatus(stories) {
    console.log('\n' + this.colors.bold('User Story Status Report'));
    console.log('='.repeat(80));

    // Calculate statistics
    const byState = {};
    let totalPoints = 0;
    let completedPoints = 0;
    let unestimated = 0;
    let unassigned = 0;

    stories.forEach(story => {
      const state = story.fields['System.State'];
      const points = story.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0;

      if (!byState[state]) byState[state] = { count: 0, points: 0 };
      byState[state].count++;
      byState[state].points += points;

      totalPoints += points;
      if (state === 'Done' || state === 'Closed') {
        completedPoints += points;
      }

      if (!points) unestimated++;
      if (!story.fields['System.AssignedTo']) unassigned++;
    });

    // Display state breakdown
    console.log('\n' + this.colors.bold('By State:'));
    const states = ['Done', 'Active', 'New', 'Proposed'];
    states.forEach(state => {
      if (byState[state]) {
        const pct = Math.round((byState[state].count / stories.length) * 100);
        const color = state === 'Done' ? this.colors.green :
                     state === 'Active' ? this.colors.blue :
                     this.colors.gray;
        console.log(`  ${color(state.padEnd(12))} ${byState[state].count} stories (${pct}%) | ${byState[state].points} points`);
      }
    });

    // Progress bar
    const completionPct = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    console.log('\n' + this.colors.bold('Sprint Progress:'));
    console.log(`  Stories: ${byState['Done']?.count || 0}/${stories.length} completed`);
    console.log(`  Points:  ${completedPoints}/${totalPoints} completed`);
    console.log(`  Progress: ${this.renderProgressBar(completionPct)}`);

    // Velocity
    if (totalPoints > 0) {
      const avgPoints = Math.round(totalPoints / stories.length * 10) / 10;
      console.log('\n' + this.colors.bold('Velocity Metrics:'));
      console.log(`  Average story size: ${avgPoints} points`);
      console.log(`  Completed velocity: ${completedPoints} points`);
      console.log(`  Remaining work: ${totalPoints - completedPoints} points`);
    }

    // Warnings
    if (unestimated > 0 || unassigned > 0) {
      console.log('\n' + this.colors.bold('Warnings:'));
      if (unestimated > 0) {
        console.log(this.colors.yellow(`  ⚠ ${unestimated} stories not estimated`));
      }
      if (unassigned > 0) {
        console.log(this.colors.yellow(`  ⚠ ${unassigned} stories unassigned`));
      }
    }

    // Summary
    console.log('\n' + '-'.repeat(80));
    console.log(`Total: ${stories.length} stories | ${totalPoints} points | ${completionPct}% complete`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = { projectPath: process.cwd() };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: azure-us-status [options]');
      console.log('\nShow user story status summary');
      console.log('\nOptions:');
      console.log('  -h, --help     Show this help message');
      console.log('  -s, --silent   Suppress color output');
      console.log('  --path <path>  Project path');
      process.exit(0);
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else if (arg === '--path' && i + 1 < args.length) {
      options.projectPath = args[++i];
    }
  }

  const usStatus = new AzureUserStoryStatus(options);
  await usStatus.showStatus();
}

module.exports = AzureUserStoryStatus;

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
