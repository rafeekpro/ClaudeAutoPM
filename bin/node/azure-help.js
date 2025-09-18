#!/usr/bin/env node

/**
 * Azure DevOps Help Command
 * Displays help information for all Azure DevOps PM commands
 * Full implementation with TDD approach
 */

const chalk = require('chalk');

class AzureHelp {
  constructor(options = {}) {
    this.options = options;
    this.silent = options.silent || false;

    // Initialize colors based on silent mode
    this.colors = this.silent ? {
      green: (str) => str,
      blue: (str) => str,
      yellow: (str) => str,
      red: (str) => str,
      cyan: (str) => str,
      gray: (str) => str,
      bold: (str) => str,
      dim: (str) => str
    } : {
      green: chalk.green || ((str) => str),
      blue: chalk.blue || ((str) => str),
      yellow: chalk.yellow || ((str) => str),
      red: chalk.red || ((str) => str),
      cyan: chalk.cyan || ((str) => str),
      gray: chalk.gray || ((str) => str),
      bold: chalk.bold || ((str) => str),
      dim: chalk.dim || ((str) => str)
    };

    this.commands = {
      'setup': {
        name: 'azure-setup',
        description: 'Configure Azure DevOps connection and settings',
        usage: 'pm azure-setup',
        category: 'Setup & Configuration'
      },
      'validate': {
        name: 'azure-validate',
        description: 'Validate Azure DevOps configuration',
        usage: 'pm azure-validate',
        category: 'Setup & Configuration'
      },
      'sync': {
        name: 'azure-sync',
        description: 'Sync work items with Azure DevOps',
        usage: 'pm azure-sync',
        category: 'Setup & Configuration'
      },
      'daily': {
        name: 'azure-daily',
        description: 'Generate daily stand-up report',
        usage: 'pm azure-daily',
        category: 'Daily Workflows'
      },
      'active-work': {
        name: 'azure-active-work',
        description: 'Show all active work items',
        usage: 'pm azure-active-work',
        category: 'Daily Workflows'
      },
      'next-task': {
        name: 'azure-next-task',
        description: 'Get next recommended task',
        usage: 'pm azure-next-task',
        category: 'Daily Workflows'
      },
      'blocked': {
        name: 'azure-blocked',
        description: 'Show blocked work items',
        usage: 'pm azure-blocked',
        category: 'Daily Workflows'
      },
      'feature-list': {
        name: 'azure-feature-list',
        description: 'List all features',
        usage: 'pm azure-feature-list',
        category: 'Feature Management'
      },
      'feature-show': {
        name: 'azure-feature-show',
        description: 'Show feature details',
        usage: 'pm azure-feature-show <feature-id>',
        category: 'Feature Management'
      },
      'feature-status': {
        name: 'azure-feature-status',
        description: 'Show feature status with progress',
        usage: 'pm azure-feature-status',
        category: 'Feature Management'
      },
      'us-list': {
        name: 'azure-us-list',
        description: 'List user stories',
        usage: 'pm azure-us-list [feature-id]',
        category: 'User Story Management'
      },
      'us-status': {
        name: 'azure-us-status',
        description: 'Show user story status',
        usage: 'pm azure-us-status',
        category: 'User Story Management'
      },
      'sprint-report': {
        name: 'azure-sprint-report',
        description: 'Generate sprint report',
        usage: 'pm azure-sprint-report',
        category: 'Sprint Management'
      },
      'dashboard': {
        name: 'azure-dashboard',
        description: 'Display project dashboard',
        usage: 'pm azure-dashboard',
        category: 'Sprint Management'
      },
      'search': {
        name: 'azure-search',
        description: 'Search work items',
        usage: 'pm azure-search <query>',
        category: 'Search & Reporting'
      }
    };
  }

  displayHeader() {
    console.log('\n' + this.colors.bold('Azure DevOps PM Commands'));
    console.log('=' + '='.repeat(60));
    console.log('Project Management tools for Azure DevOps integration\n');
  }

  displayCommandsByCategory() {
    const categories = {};

    // Group commands by category
    Object.values(this.commands).forEach(cmd => {
      if (!categories[cmd.category]) {
        categories[cmd.category] = [];
      }
      categories[cmd.category].push(cmd);
    });

    // Display each category
    const categoryOrder = [
      'Setup & Configuration',
      'Daily Workflows',
      'Feature Management',
      'User Story Management',
      'Sprint Management',
      'Search & Reporting'
    ];

    categoryOrder.forEach(category => {
      if (categories[category]) {
        console.log(this.colors.bold(this.colors.cyan(category + ':')));
        categories[category].forEach(cmd => {
          const nameCol = cmd.name.padEnd(25);
          console.log(`  ${this.colors.green(nameCol)} ${cmd.description}`);
        });
        console.log();
      }
    });
  }

  displayCommandHelp(commandName) {
    // Find command by name or alias
    let command = null;
    Object.entries(this.commands).forEach(([key, cmd]) => {
      if (key === commandName ||
          cmd.name === commandName ||
          cmd.name === `azure-${commandName}`) {
        command = cmd;
      }
    });

    if (!command) {
      console.log(this.colors.red(`Unknown command: ${commandName}`));
      console.log('Use "pm azure-help" to see all available commands.');
      return;
    }

    console.log('\n' + this.colors.bold(command.name));
    console.log('-'.repeat(40));
    console.log(`Description: ${command.description}`);
    console.log(`Category: ${command.category}`);
    console.log(`Usage: ${this.colors.cyan(command.usage)}`);

    // Add specific examples for some commands
    if (command.name === 'azure-daily') {
      console.log('\nOptions:');
      console.log('  --verbose    Show detailed information');
      console.log('  --silent     Suppress color output');
      console.log('\nExample:');
      console.log('  pm azure-daily --verbose');
    } else if (command.name === 'azure-feature-show') {
      console.log('\nOptions:');
      console.log('  --verbose    Show detailed error information');
      console.log('  --silent     Suppress color output');
      console.log('\nExample:');
      console.log('  pm azure-feature-show 12345');
    } else if (command.name === 'azure-search') {
      console.log('\nOptions:');
      console.log('  --type       Filter by work item type');
      console.log('  --state      Filter by state');
      console.log('  --limit      Limit results (default: 10)');
      console.log('\nExamples:');
      console.log('  pm azure-search "login bug"');
      console.log('  pm azure-search "performance" --type Bug');
    }
  }

  displayExamples() {
    console.log(this.colors.bold('Common Workflows:'));
    console.log('-'.repeat(60));

    const workflows = [
      {
        title: 'Initial Setup',
        commands: [
          'pm azure-setup           # Configure Azure DevOps connection',
          'pm azure-validate        # Verify configuration',
          'pm azure-sync            # Sync work items'
        ]
      },
      {
        title: 'Daily Stand-up',
        commands: [
          'pm azure-daily           # Generate stand-up report',
          'pm azure-active-work     # View active work',
          'pm azure-blocked         # Check blocked items'
        ]
      },
      {
        title: 'Feature Management',
        commands: [
          'pm azure-feature-list    # List all features',
          'pm azure-feature-show 123 # View feature details',
          'pm azure-feature-status  # Check feature progress'
        ]
      },
      {
        title: 'Sprint Planning',
        commands: [
          'pm azure-sprint-report   # View sprint status',
          'pm azure-next-task       # Get recommended task',
          'pm azure-dashboard       # View project dashboard'
        ]
      }
    ];

    workflows.forEach(workflow => {
      console.log('\n' + this.colors.cyan(workflow.title + ':'));
      workflow.commands.forEach(cmd => {
        console.log('  ' + cmd);
      });
    });
  }

  displayQuickStart() {
    console.log('\n' + this.colors.bold('Quick Start:'));
    console.log('-'.repeat(60));
    console.log('1. Run ' + this.colors.cyan('pm azure-setup') + ' to configure your connection');
    console.log('2. Use ' + this.colors.cyan('pm azure-daily') + ' for daily stand-ups');
    console.log('3. Track features with ' + this.colors.cyan('pm azure-feature-status'));
    console.log('4. Find work with ' + this.colors.cyan('pm azure-next-task'));
  }

  displayTips() {
    console.log('\n' + this.colors.bold('Tips:'));
    console.log('-'.repeat(60));
    console.log('• Most commands support ' + this.colors.cyan('--help') + ' for detailed usage');
    console.log('• Use ' + this.colors.cyan('--verbose') + ' for detailed output');
    console.log('• Use ' + this.colors.cyan('--silent') + ' to suppress colors');
    console.log('• Commands use .env file for configuration');
  }

  showHelp(commandName = null) {
    if (commandName) {
      this.displayCommandHelp(commandName);
    } else {
      this.displayHeader();
      this.displayCommandsByCategory();
      this.displayExamples();
      this.displayQuickStart();
      this.displayTips();
      console.log('\n' + '='.repeat(61) + '\n');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = {
    silent: false
  };

  let commandName = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      // Just show help for azure-help itself
      console.log('Usage: azure-help [command]');
      console.log('\nShow help information for Azure DevOps commands');
      console.log('\nOptions:');
      console.log('  -h, --help     Show this help message');
      console.log('  -s, --silent   Suppress color output');
      console.log('\nExamples:');
      console.log('  azure-help              # Show all commands');
      console.log('  azure-help daily        # Show help for azure-daily');
      console.log('  azure-help feature-show # Show help for azure-feature-show');
      process.exit(0);
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else if (!arg.startsWith('-')) {
      commandName = arg;
    }
  }

  const help = new AzureHelp(options);
  help.showHelp(commandName);
}

// Export for testing
module.exports = AzureHelp;

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}