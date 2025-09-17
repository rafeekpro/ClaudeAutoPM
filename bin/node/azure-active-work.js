#!/usr/bin/env node

/**
 * Azure DevOps Active Work Viewer
 * Shows all active work items across the team
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

class AzureActiveWork {
  constructor(options = {}) {
    this.silent = options.silent || false;
    this.format = options.format || 'table'; // table, json, csv
    this.groupBy = options.groupBy || 'assignee'; // assignee, state, type, priority
    this.includeUnassigned = options.includeUnassigned !== false;

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

  async getActiveWork() {
    try {
      if (!this.silent && this.format !== "json") {
        console.log(chalk.cyan.bold('\n💼 Active Work Items\n'));
        console.log(chalk.yellow('Note: This is a stub implementation returning mock data\n'));
      }

      // Return mock active work data
      const mockActiveWork = {
        summary: {
          total: 12,
          inProgress: 5,
          active: 4,
          new: 3,
          avgDaysInProgress: 3.5,
          sprint: 'Sprint 2024.1'
        },
        byAssignee: {
          'John Doe': [
            {
              id: 3001,
              title: 'Implement OAuth2 authentication',
              type: 'User Story',
              state: 'Active',
              priority: 1,
              daysInState: 2,
              remainingWork: 4
            },
            {
              id: 3002,
              title: 'Fix database connection pooling',
              type: 'Bug',
              state: 'In Progress',
              priority: 2,
              daysInState: 1,
              remainingWork: 2
            }
          ],
          'Jane Smith': [
            {
              id: 3003,
              title: 'Create user dashboard UI',
              type: 'Task',
              state: 'Active',
              priority: 2,
              daysInState: 3,
              remainingWork: 6
            }
          ],
          'Bob Johnson': [
            {
              id: 3004,
              title: 'Setup CI/CD pipeline',
              type: 'Task',
              state: 'In Progress',
              priority: 1,
              daysInState: 4,
              remainingWork: 3
            },
            {
              id: 3005,
              title: 'Write API documentation',
              type: 'Task',
              state: 'New',
              priority: 3,
              daysInState: 0,
              remainingWork: 8
            }
          ],
          'Unassigned': this.includeUnassigned ? [
            {
              id: 3006,
              title: 'Performance testing',
              type: 'Task',
              state: 'New',
              priority: 2,
              daysInState: 5,
              remainingWork: 12
            }
          ] : []
        },
        byState: {
          'In Progress': 5,
          'Active': 4,
          'New': 3
        },
        byType: {
          'Task': 5,
          'User Story': 4,
          'Bug': 3
        },
        blockedItems: [
          {
            id: 3007,
            title: 'Deploy to production',
            blockedBy: 'Waiting for security review',
            assignedTo: 'John Doe',
            dayBlocked: 2
          }
        ]
      };

      if (!this.silent && this.format !== "json") {
        this.displayActiveWork(mockActiveWork);
      }

      return mockActiveWork;
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  displayActiveWork(data) {
    switch (this.format) {
      case 'json':
        console.log(JSON.stringify(data, null, 2));
        break;
      case 'csv':
        this.displayCSV(data);
        break;
      default:
        this.displayTable(data);
    }
  }

  displayTable(data) {
    // Display summary
    console.log(chalk.cyan.bold('📊 Summary'));
    const summary = data.summary;
    console.log(`Sprint: ${summary.sprint}`);
    console.log(`Total Active Items: ${summary.total}`);
    console.log(`In Progress: ${summary.inProgress} | Active: ${summary.active} | New: ${summary.new}`);
    console.log(`Average Days in Progress: ${summary.avgDaysInProgress}\n`);

    // Display by group
    if (this.groupBy === 'assignee') {
      this.displayByAssignee(data.byAssignee);
    } else if (this.groupBy === 'state') {
      this.displayByState(data.byState, data.byAssignee);
    } else if (this.groupBy === 'type') {
      this.displayByType(data.byType, data.byAssignee);
    } else if (this.groupBy === 'priority') {
      this.displayByPriority(data.byAssignee);
    }

    // Display blocked items
    if (data.blockedItems && data.blockedItems.length > 0) {
      console.log(chalk.red.bold('\n🚫 Blocked Items'));
      data.blockedItems.forEach(item => {
        console.log(`  [${item.id}] ${item.title}`);
        console.log(`    Assigned to: ${item.assignedTo} | Blocked by: ${item.blockedBy}`);
        console.log(`    Days blocked: ${item.dayBlocked}`);
      });
    }
  }

  displayByAssignee(byAssignee) {
    console.log(chalk.green.bold('👥 Work by Assignee\n'));

    Object.entries(byAssignee).forEach(([assignee, items]) => {
      if (items.length === 0) return;

      console.log(chalk.yellow.bold(`${assignee} (${items.length} items):`));
      items.forEach(item => {
        const stateColor = this.getStateColor(item.state);
        console.log(`  [${item.id}] ${item.title}`);
        console.log(`    Type: ${item.type} | State: ${stateColor} | Priority: P${item.priority}`);
        console.log(`    Days in state: ${item.daysInState} | Remaining: ${item.remainingWork}h`);
      });
      console.log('');
    });
  }

  displayByState(byState, byAssignee) {
    console.log(chalk.green.bold('📋 Work by State\n'));

    Object.entries(byState).forEach(([state, count]) => {
      const stateColor = this.getStateColor(state);
      console.log(`${stateColor}: ${count} items`);
    });
  }

  displayByType(byType) {
    console.log(chalk.green.bold('📝 Work by Type\n'));

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`${type}: ${count} items`);
    });
  }

  displayByPriority(byAssignee) {
    console.log(chalk.green.bold('⚡ Work by Priority\n'));

    const allItems = [];
    Object.values(byAssignee).forEach(items => {
      allItems.push(...items);
    });

    allItems.sort((a, b) => a.priority - b.priority);

    let currentPriority = null;
    allItems.forEach(item => {
      if (item.priority !== currentPriority) {
        currentPriority = item.priority;
        console.log(chalk.yellow.bold(`\nPriority ${currentPriority}:`));
      }
      console.log(`  [${item.id}] ${item.title} (${item.state})`);
    });
  }

  displayCSV(data) {
    console.log('ID,Title,Type,State,Priority,Assigned To,Days in State,Remaining Work');

    Object.entries(data.byAssignee).forEach(([assignee, items]) => {
      items.forEach(item => {
        console.log(`${item.id},"${item.title}",${item.type},${item.state},${item.priority},"${assignee}",${item.daysInState},${item.remainingWork}`);
      });
    });
  }

  getStateColor(state) {
    const colors = {
      'New': chalk.blue(state),
      'Active': chalk.yellow(state),
      'In Progress': chalk.cyan(state),
      'Resolved': chalk.green(state),
      'Closed': chalk.gray(state),
      'Done': chalk.green(state)
    };
    return colors[state] || chalk.white(state);
  }

  static parseArguments(args = process.argv) {
    const options = {};

    args.forEach((arg, index) => {
      if (arg === '--group-by' && args[index + 1]) {
        options.groupBy = args[index + 1];
      } else if (arg === '--format' && args[index + 1]) {
        options.format = args[index + 1];
      } else if (arg === '--no-unassigned') {
        options.includeUnassigned = false;
      } else if (arg === '--json') {
        options.format = 'json';
      } else if (arg === '--csv') {
        options.format = 'csv';
      } else if (arg === '--silent' || arg === '-s') {
        options.silent = true;
      }
    });

    return options;
  }
}

// Run if called directly
if (require.main === module) {
  const options = AzureActiveWork.parseArguments();
  const activeWork = new AzureActiveWork(options);

  activeWork.getActiveWork()
    .then(() => {
      if (activeWork.client) {
        const stats = activeWork.client.getCacheStats();
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

module.exports = AzureActiveWork;