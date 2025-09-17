#!/usr/bin/env node

/**
 * Azure DevOps Daily Report
 * Generates a daily stand-up report with yesterday's progress and today's plans
 * Full implementation with TDD approach
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const dotenv = require('dotenv');
const AzureDevOpsClient = require('../../lib/azure/client');

class AzureDaily {
  constructor(options = {}) {
    this.options = options;
    this.projectPath = options.projectPath || process.cwd();
    this.silent = options.silent || false;
    this.format = options.format || 'table';

    // Initialize colors based on silent mode
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

    // Environment variables container
    this.envVars = {};
    this.client = null;
  }

  async loadEnvironment() {
    // Start with process.env values
    this.envVars = {
      AZURE_DEVOPS_PAT: process.env.AZURE_DEVOPS_PAT,
      AZURE_DEVOPS_ORG: process.env.AZURE_DEVOPS_ORG,
      AZURE_DEVOPS_PROJECT: process.env.AZURE_DEVOPS_PROJECT
    };

    // Try to load from .claude/.env first (override process.env)
    const claudeEnvPath = path.join(this.projectPath, '.claude', '.env');
    const envPath = path.join(this.projectPath, '.env');

    let envFromFile = {};
    if (await fs.pathExists(claudeEnvPath)) {
      envFromFile = dotenv.parse(await fs.readFile(claudeEnvPath, 'utf8'));
    } else if (await fs.pathExists(envPath)) {
      envFromFile = dotenv.parse(await fs.readFile(envPath, 'utf8'));
    }

    // Override with file values where they exist
    if (envFromFile.AZURE_DEVOPS_PAT) this.envVars.AZURE_DEVOPS_PAT = envFromFile.AZURE_DEVOPS_PAT;
    if (envFromFile.AZURE_DEVOPS_ORG) this.envVars.AZURE_DEVOPS_ORG = envFromFile.AZURE_DEVOPS_ORG;
    if (envFromFile.AZURE_DEVOPS_PROJECT) this.envVars.AZURE_DEVOPS_PROJECT = envFromFile.AZURE_DEVOPS_PROJECT;

    // Initialize client if environment is valid
    const validation = this.validateEnvironment();
    if (validation.valid) {
      this.client = new AzureDevOpsClient({
        organization: this.envVars.AZURE_DEVOPS_ORG,
        project: this.envVars.AZURE_DEVOPS_PROJECT,
        pat: this.envVars.AZURE_DEVOPS_PAT
      });
    }
  }

  validateEnvironment() {
    const errors = [];

    if (!this.envVars.AZURE_DEVOPS_PAT) {
      errors.push('AZURE_DEVOPS_PAT is not set');
    }
    if (!this.envVars.AZURE_DEVOPS_ORG) {
      errors.push('AZURE_DEVOPS_ORG is not set');
    }
    if (!this.envVars.AZURE_DEVOPS_PROJECT) {
      errors.push('AZURE_DEVOPS_PROJECT is not set');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  getYesterdayDate() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  }

  buildCompletedTasksQuery(yesterday) {
    return `
      SELECT [System.Id], [System.Title], [System.WorkItemType],
             [System.State], [System.AssignedTo], [System.ChangedDate]
      FROM workitems
      WHERE [System.WorkItemType] = 'Task'
      AND [System.State] = 'Done'
      AND [System.AssignedTo] = @Me
      AND [System.ChangedDate] >= '${yesterday}'
      ORDER BY [System.ChangedDate] DESC
    `;
  }

  buildActiveTasksQuery() {
    return `
      SELECT [System.Id], [System.Title], [System.WorkItemType],
             [System.State], [System.AssignedTo],
             [Microsoft.VSTS.Scheduling.RemainingWork]
      FROM workitems
      WHERE [System.WorkItemType] = 'Task'
      AND [System.State] = 'In Progress'
      AND [System.AssignedTo] = @Me
      ORDER BY [Microsoft.VSTS.Common.Priority] ASC
    `;
  }

  buildBlockedItemsQuery() {
    return `
      SELECT [System.Id], [System.Title], [System.Tags], [System.State]
      FROM workitems
      WHERE [System.Tags] CONTAINS 'blocked'
      AND [System.State] != 'Closed'
      ORDER BY [Microsoft.VSTS.Common.Priority] ASC
    `;
  }

  buildNextTaskQuery() {
    return `
      SELECT TOP 1 [System.Id], [System.Title], [System.WorkItemType],
             [System.State], [System.AssignedTo],
             [Microsoft.VSTS.Common.Priority]
      FROM workitems
      WHERE [System.WorkItemType] = 'Task'
      AND [System.State] = 'To Do'
      AND ([System.AssignedTo] = '' OR [System.AssignedTo] = @Me)
      ORDER BY [Microsoft.VSTS.Common.Priority] ASC
    `;
  }

  async fetchCompletedTasks(yesterday) {
    if (!this.client) {
      throw new Error('Azure DevOps client not initialized');
    }

    try {
      const query = this.buildCompletedTasksQuery(yesterday);
      const result = await this.client.executeWiql(query);

      if (result && result.workItems) {
        return result.workItems.map(item => ({ id: item.id }));
      }
      return [];
    } catch (error) {
      if (error.message.includes('500')) {
        throw new Error('Azure DevOps API returned 500 error');
      }
      throw error;
    }
  }

  async fetchActiveTasks() {
    if (!this.client) {
      throw new Error('Azure DevOps client not initialized');
    }

    try {
      const query = this.buildActiveTasksQuery();
      const result = await this.client.executeWiql(query);

      if (result && result.workItems) {
        return result.workItems.map(item => ({ id: item.id }));
      }
      return [];
    } catch (error) {
      if (error.message.includes('401')) {
        throw new Error('Authentication failed');
      }
      throw error;
    }
  }

  async fetchBlockedItems() {
    if (!this.client) {
      throw new Error('Azure DevOps client not initialized');
    }

    try {
      const query = this.buildBlockedItemsQuery();
      const result = await this.client.executeWiql(query);

      if (result && result.workItems) {
        return result.workItems.map(item => ({ id: item.id }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async fetchCurrentIteration() {
    if (!this.client) {
      throw new Error('Azure DevOps client not initialized');
    }

    try {
      const sprint = await this.client.getCurrentSprint();
      if (sprint) {
        return {
          name: sprint.name,
          id: sprint.id
        };
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async fetchNextTask() {
    if (!this.client) {
      throw new Error('Azure DevOps client not initialized');
    }

    try {
      const query = this.buildNextTaskQuery();
      const result = await this.client.executeWiql(query);

      if (result && result.workItems) {
        return result.workItems.map(item => ({ id: item.id }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  generateStandupSummary(completedTasks) {
    let summary = this.colors.cyan(this.colors.bold('📋 Daily Standup Summary\n'));
    summary += '='.repeat(40) + '\n\n';

    const count = completedTasks.length;
    if (count > 0) {
      summary += this.colors.green(`✅ Tasks completed yesterday: ${count}\n`);
      completedTasks.forEach(task => {
        summary += `  - Task #${task.id}\n`;
      });
    } else {
      summary += this.colors.yellow('✅ Tasks completed yesterday: 0\n');
      summary += this.colors.gray('  No tasks completed yesterday\n');
    }

    return summary;
  }

  generateActiveWorkSummary(activeTasks) {
    let summary = '\n' + this.colors.blue(this.colors.bold('🔄 Your Active Work\n'));
    summary += '-'.repeat(40) + '\n\n';

    const count = activeTasks.length;
    if (count > 0) {
      summary += this.colors.blue(`Active tasks: ${count}\n`);
      activeTasks.forEach(task => {
        summary += `  - Task #${task.id}\n`;
      });
    } else {
      summary += this.colors.yellow('Active tasks: 0\n');
      summary += this.colors.gray('  No active tasks\n');
    }

    return summary;
  }

  generateBlockersCheck(blockedItems) {
    let summary = '\n' + this.colors.yellow(this.colors.bold('🚧 Checking for Blockers\n'));
    summary += '-'.repeat(40) + '\n\n';

    const count = blockedItems.length;
    if (count > 0) {
      summary += this.colors.red(`⚠️  Found ${count} blocked items!\n`);
      blockedItems.forEach(item => {
        summary += `  - Item #${item.id}\n`;
      });
    } else {
      summary += this.colors.green('✅ No blockers found\n');
    }

    return summary;
  }

  generateSprintStatus(iteration) {
    let summary = '\n' + this.colors.blue(this.colors.bold('📊 Sprint Status\n'));
    summary += '-'.repeat(40) + '\n\n';

    if (iteration) {
      summary += `Current Sprint: ${iteration.name}\n`;
      summary += `Sprint ID: ${iteration.id}\n`;
    } else {
      summary += this.colors.gray('No active sprint\n');
    }

    return summary;
  }

  generateNextTaskSuggestion(nextTask) {
    let summary = '\n' + this.colors.green(this.colors.bold('🎯 Suggested Next Task\n'));
    summary += '-'.repeat(40) + '\n\n';

    if (nextTask && nextTask.length > 0) {
      const task = nextTask[0];
      summary += this.colors.green(`Recommended: Task #${task.id}\n`);
      summary += `To start, run: /azure:task-start ${task.id}\n`;
    } else {
      summary += this.colors.yellow('No tasks available. Check backlog or blocked items.\n');
    }

    return summary;
  }

  generateTimeTrackingSummary(completedTasks) {
    let summary = '\n' + this.colors.cyan(this.colors.bold('⏱️  Time Tracking Summary\n'));
    summary += '-'.repeat(40) + '\n\n';

    let totalCompleted = 0;
    let totalEstimate = 0;
    let hasTimeData = false;

    completedTasks.forEach(task => {
      if (task.completedWork !== undefined) {
        totalCompleted += task.completedWork;
        hasTimeData = true;
      }
      if (task.originalEstimate !== undefined) {
        totalEstimate += task.originalEstimate;
      }
    });

    if (hasTimeData) {
      summary += `Total hours logged yesterday: ${totalCompleted}\n`;
      if (totalEstimate > 0) {
        summary += `Original estimate: ${totalEstimate} hours\n`;
        const accuracy = Math.round((totalCompleted / totalEstimate) * 100);
        summary += `Accuracy: ${accuracy}%\n`;
      }
    } else {
      summary += this.colors.gray('No time tracking data available\n');
    }

    return summary;
  }

  generateVelocityMetrics(activeTasks) {
    let summary = '\n' + this.colors.blue(this.colors.bold('📈 Velocity Metrics\n'));
    summary += '-'.repeat(40) + '\n\n';

    let totalRemaining = 0;
    let tasksWithEstimates = 0;

    activeTasks.forEach(task => {
      if (task.remainingWork !== undefined) {
        totalRemaining += task.remainingWork;
        tasksWithEstimates++;
      }
    });

    if (tasksWithEstimates > 0) {
      summary += `Remaining work: ${totalRemaining} hours\n`;
      summary += `Tasks with estimates: ${tasksWithEstimates}/${activeTasks.length}\n`;
    } else {
      summary += this.colors.gray('No velocity data available\n');
    }

    return summary;
  }

  generateQuickActions() {
    let summary = '\n' + this.colors.cyan(this.colors.bold('⚡ Quick Actions\n'));
    summary += '-'.repeat(40) + '\n\n';

    summary += 'Quick actions:\n';
    summary += '1. Start recommended task\n';
    summary += '2. View sprint dashboard (/azure:sprint-status)\n';
    summary += '3. Check blocked items (/azure:blocked-items)\n';
    summary += '4. View all your tasks (/azure:task-list --my-tasks)\n';

    return summary;
  }

  formatDailyOutput(sections) {
    let output = '\n';
    output += this.colors.cyan(this.colors.bold('🌅 Starting Azure DevOps Daily Workflow\n'));
    output += '='.repeat(50) + '\n';

    sections.forEach(section => {
      output += section;
    });

    output += '\n' + '='.repeat(50) + '\n';
    output += this.colors.green(this.colors.bold('✅ Daily workflow complete!\n'));

    return output;
  }

  async run() {
    try {
      // Load environment
      await this.loadEnvironment();

      // Validate environment
      const validation = this.validateEnvironment();
      if (!validation.valid) {
        return {
          success: false,
          error: `Environment validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Get yesterday's date
      const yesterday = this.getYesterdayDate();

      // Fetch all data
      const [completedTasks, activeTasks, blockedItems, iteration, nextTask] = await Promise.all([
        this.fetchCompletedTasks(yesterday).catch(() => []),
        this.fetchActiveTasks().catch(() => []),
        this.fetchBlockedItems().catch(() => []),
        this.fetchCurrentIteration().catch(() => null),
        this.fetchNextTask().catch(() => [])
      ]);

      // Generate all sections
      const sections = [
        this.generateStandupSummary(completedTasks),
        this.generateTimeTrackingSummary(completedTasks),
        this.generateActiveWorkSummary(activeTasks),
        this.generateVelocityMetrics(activeTasks),
        this.generateBlockersCheck(blockedItems),
        this.generateSprintStatus(iteration),
        this.generateNextTaskSuggestion(nextTask),
        this.generateQuickActions()
      ];

      // Format and return output
      const output = this.formatDailyOutput(sections);

      return {
        success: true,
        output: output
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // For testing - allow injection of HTTP client
  _setHttpClient(client) {
    this.httpClient = client;
    // Mock the Azure client
    if (client) {
      this.client = {
        executeWiql: async (query) => {
          try {
            const response = await client.post('/wit/wiql', { query });
            return response.data;
          } catch (error) {
            if (error.status === 500) {
              throw new Error('Azure DevOps API returned 500 error');
            }
            if (error.status === 401) {
              throw new Error('Authentication failed');
            }
            throw error;
          }
        },
        getCurrentSprint: async () => {
          try {
            const response = await client.get('/iterations?$timeframe=current');
            if (response.data && response.data.value && response.data.value.length > 0) {
              return response.data.value[0];
            }
            return null;
          } catch (error) {
            throw error;
          }
        }
      };
    }
  }
}

// Export the class
module.exports = AzureDaily;

// Run if called directly
if (require.main === module) {
  const daily = new AzureDaily({
    silent: process.argv.includes('--silent')
  });

  daily.run().then(result => {
    if (result.success) {
      console.log(result.output);
      process.exit(0);
    } else {
      console.error('Error:', result.error);
      process.exit(1);
    }
  });
}