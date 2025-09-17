#!/usr/bin/env node

/**
 * Azure DevOps Next Task Selector
 * Intelligently selects the next task to work on based on priorities and dependencies
 * STUB IMPLEMENTATION - Returns mock data
 */

const path = require('path');
const fs = require('fs');

// Simple chalk replacement for stub
const chalk = {
  red: (str) => str,
  green: (str) => str,
  blue: (str) => str,
  yellow: (str) => str,
  cyan: (str) => str,
  magenta: (str) => str,
  gray: (str) => str,
  white: (str) => str,
  bold: (str) => str,
  dim: (str) => str
};
chalk.red.bold = (str) => str;
chalk.green.bold = (str) => str;
chalk.blue.bold = (str) => str;
chalk.blue.underline = (str) => str;
chalk.yellow.bold = (str) => str;
chalk.cyan.bold = (str) => str;
chalk.magenta.bold = (str) => str;
chalk.gray.bold = (str) => str;

class AzureNextTask {
  constructor(options = {}) {
    this.silent = options.silent || false;
    this.format = options.format || 'table'; // table, json, brief
    this.assignedTo = options.assignedTo || '@me';
    this.includeBlocked = options.includeBlocked === true;

    try {
      // Load environment variables from .env file if it exists
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        // Stub: Skip dotenv loading({ path: envPath });
      }

      // Also check .claude/.env
      const claudeEnvPath = path.join(process.cwd(), '.claude', '.env');
      if (fs.existsSync(claudeEnvPath)) {
        // Stub: Skip dotenv loading({ path: claudeEnvPath });
      }

      // Stub: Skip client initialization
      this.client = { getCacheStats: () => ({}) };
    } catch (error) {
      this.handleInitError(error);
    }
  }

  handleInitError(error) {
    if (error.message.includes('Missing required environment variables')) {
      console.error('❌ Azure DevOps configuration missing!\n');
      console.error('Please set the following environment variables:');
      console.error('  - AZURE_DEVOPS_ORG: Your Azure DevOps organization');
      console.error('  - AZURE_DEVOPS_PROJECT: Your project name');
      console.error('  - AZURE_DEVOPS_PAT: Your Personal Access Token\n');
      console.error('You can set these in .env or .claude/.env file\n');
      process.exit(1);
    }
    throw error;
  }

  async findNextTask() {
    try {
      if (!this.silent && this.format !== "json") {
        console.log(chalk.cyan.bold('\n🎯 Finding Next Task\n'));
        console.log(chalk.yellow('Note: This is a stub implementation returning mock data\n'));
      }

      // Return mock next task data
      const mockNextTask = {
        task: {
          id: 2001,
          title: 'Implement user authentication module',
          type: 'Task',
          state: 'New',
          priority: 1,
          assignedTo: 'Current User',
          estimatedHours: 8,
          tags: ['backend', 'security'],
          iterationPath: 'Sprint 2024.1',
          areaPath: 'Backend/Authentication',
          url: 'https://dev.azure.com/org/project/_workitems/edit/2001'
        },
        reasoning: {
          score: 95,
          factors: [
            { factor: 'High Priority', weight: 40, score: 40 },
            { factor: 'No blockers', weight: 30, score: 30 },
            { factor: 'Sprint commitment', weight: 20, score: 20 },
            { factor: 'Skills match', weight: 10, score: 5 }
          ]
        },
        alternatives: [
          {
            id: 2002,
            title: 'Fix login page CSS issues',
            priority: 2,
            score: 75,
            reason: 'Lower priority'
          },
          {
            id: 2003,
            title: 'Update API documentation',
            priority: 3,
            score: 60,
            reason: 'Can wait until after core features'
          }
        ],
        blockedTasks: this.includeBlocked ? [
          {
            id: 2004,
            title: 'Deploy to staging environment',
            blockedBy: 'Waiting for infrastructure setup',
            priority: 1
          }
        ] : []
      };

      if (!this.silent && this.format !== "json") {
        this.displayNextTask(mockNextTask);
      }

      return mockNextTask;
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  displayNextTask(data) {
    switch (this.format) {
      case 'json':
        console.log(JSON.stringify(data, null, 2));
        break;
      case 'brief':
        this.displayBrief(data);
        break;
      default:
        this.displayTable(data);
    }
  }

  displayTable(data) {
    const task = data.task;

    console.log(chalk.green.bold('✅ Recommended Next Task:'));
    console.log('');
    console.log(chalk.cyan.bold(`[${task.id}] ${task.title}`));
    console.log(`Type: ${task.type} | State: ${task.state} | Priority: P${task.priority}`);
    console.log(`Assigned To: ${task.assignedTo}`);
    console.log(`Estimated: ${task.estimatedHours} hours`);
    console.log(`Sprint: ${task.iterationPath}`);
    console.log(`Area: ${task.areaPath}`);
    if (task.tags && task.tags.length > 0) {
      console.log(`Tags: ${task.tags.join(', ')}`);
    }
    console.log(`URL: ${chalk.blue.underline(task.url)}`);
    console.log('');

    if (data.reasoning) {
      console.log(chalk.yellow.bold('📊 Selection Reasoning:'));
      console.log(`Overall Score: ${data.reasoning.score}/100`);
      console.log('');
      data.reasoning.factors.forEach(f => {
        const bar = this.createProgressBar(f.score, f.weight);
        console.log(`  ${f.factor}: ${bar} ${f.score}/${f.weight}`);
      });
      console.log('');
    }

    if (data.alternatives && data.alternatives.length > 0) {
      console.log(chalk.gray.bold('🔄 Alternative Tasks:'));
      data.alternatives.forEach(alt => {
        console.log(`  [${alt.id}] ${alt.title}`);
        console.log(`    Priority: P${alt.priority} | Score: ${alt.score} | ${alt.reason}`);
      });
      console.log('');
    }

    if (data.blockedTasks && data.blockedTasks.length > 0) {
      console.log(chalk.red.bold('🚫 Blocked High-Priority Tasks:'));
      data.blockedTasks.forEach(blocked => {
        console.log(`  [${blocked.id}] ${blocked.title}`);
        console.log(`    Blocked by: ${blocked.blockedBy}`);
      });
      console.log('');
    }
  }

  displayBrief(data) {
    const task = data.task;
    console.log(chalk.green(`Next: [${task.id}] ${task.title} (P${task.priority}, ${task.estimatedHours}h)`));
    if (data.reasoning) {
      console.log(`Score: ${data.reasoning.score}/100`);
    }
  }

  createProgressBar(score, max) {
    const percentage = (score / max) * 100;
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return chalk.green('█').repeat(filled) + chalk.gray('░').repeat(empty);
  }

  static parseArguments(args = process.argv) {
    const options = {};

    args.forEach((arg, index) => {
      if (arg === '--assigned-to' && args[index + 1]) {
        options.assignedTo = args[index + 1];
      } else if (arg === '--format' && args[index + 1]) {
        options.format = args[index + 1];
      } else if (arg === '--include-blocked') {
        options.includeBlocked = true;
      } else if (arg === '--json') {
        options.format = 'json';
      } else if (arg === '--brief') {
        options.format = 'brief';
      } else if (arg === '--silent' || arg === '-s') {
        options.silent = true;
      } else if (arg.startsWith('--user=')) {
        options.userFilter = arg.substring(7);
      } else if (arg === '--user' && args[index + 1]) {
        options.userFilter = args[index + 1];
      }
    });

    // Set defaults if not provided
    if (!options.format) {
      options.format = 'detailed';
    }
    if (!options.userFilter) {
      options.userFilter = '@me';
    }

    return options;
  }
}

// Run if called directly
if (require.main === module) {
  const options = AzureNextTask.parseArguments();
  const nextTask = new AzureNextTask(options);

  nextTask.findNextTask()
    .then(() => {
      if (nextTask.client) {
        const stats = nextTask.client.getCacheStats();
        if (!options.silent && process.env.DEBUG) {
          console.log(chalk.dim(`\nCache stats: ${JSON.stringify(stats)}`));
        }
      }
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = AzureNextTask;