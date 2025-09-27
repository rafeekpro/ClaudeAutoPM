#!/usr/bin/env node

/**
 * Azure DevOps Search
 * Search for work items across the project
 * Full implementation with TDD approach
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const dotenv = require('dotenv');
const AzureDevOpsClient = require('../../lib/azure/client');

class AzureSearch {
  constructor(options = {}) {
    this.options = options;
    this.projectPath = options.projectPath || process.cwd();
    this.silent = options.silent || false;
    this.format = options.format || 'table';
    this.limit = options.limit || 10;
    this.filters = {
      type: options.type,
      state: options.state,
      assignee: options.assignee,
      area: options.area,
      iteration: options.iteration
    };

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

    // Environment variables container
    this.envVars = {};
    this.client = null;
  }

  async loadEnvironment() {
    // Start with process.env values
    this.envVars = {
      AZURE_DEVOPS_PAT: process.env.AZURE_DEVOPS_PAT,
      AZURE_DEVOPS_ORG: process.env.AZURE_DEVOPS_ORG,
      AZURE_DEVOPS_PROJECT: process.env.AZURE_DEVOPS_PROJECT,
      AZURE_DEVOPS_TEAM: process.env.AZURE_DEVOPS_TEAM,
      AZURE_DEVOPS_AREA_PATH: process.env.AZURE_DEVOPS_AREA_PATH,
      AZURE_DEVOPS_ITERATION_PATH: process.env.AZURE_DEVOPS_ITERATION_PATH
    };

    // Try to load from .env file
    const envPath = path.join(this.projectPath, '.env');
    try {
      await fs.access(envPath);
      const envConfig = dotenv.parse(await fs.readFile(envPath, 'utf8'));

      // Override with values from .env file if they exist
      Object.keys(envConfig).forEach(key => {
        if (key.startsWith('AZURE_DEVOPS_')) {
          this.envVars[key] = envConfig[key];
        }
      });
    } catch (err) {
      // File doesn't exist, ignore
    }

    // Validate required configuration
    if (!this.envVars.AZURE_DEVOPS_PAT) {
      throw new Error('AZURE_DEVOPS_PAT not configured. Run "pm azure-setup" first.');
    }
    if (!this.envVars.AZURE_DEVOPS_ORG) {
      throw new Error('AZURE_DEVOPS_ORG not configured. Run "pm azure-setup" first.');
    }
    if (!this.envVars.AZURE_DEVOPS_PROJECT) {
      throw new Error('AZURE_DEVOPS_PROJECT not configured. Run "pm azure-setup" first.');
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

  formatUser(userField) {
    if (!userField) return 'Unassigned';
    if (typeof userField === 'string') return userField;
    return userField.displayName || userField.uniqueName || 'Unknown';
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  highlightMatch(text, query) {
    if (this.silent) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, this.colors.yellow('$1'));
  }

  async searchWorkItems(query) {
    // Build search conditions
    let conditions = [];

    // Add text search across title, description, and comments
    const searchFields = [
      `[System.Title] CONTAINS '${query}'`,
      `[System.Description] CONTAINS '${query}'`,
      `[System.History] CONTAINS '${query}'`
    ];
    conditions.push(`(${searchFields.join(' OR ')})`);

    // Add filters
    if (this.filters.type) {
      conditions.push(`[System.WorkItemType] = '${this.filters.type}'`);
    }

    if (this.filters.state) {
      conditions.push(`[System.State] = '${this.filters.state}'`);
    }

    if (this.filters.assignee) {
      if (this.filters.assignee.toLowerCase() === 'me') {
        conditions.push(`[System.AssignedTo] = @Me`);
      } else {
        conditions.push(`[System.AssignedTo] = '${this.filters.assignee}'`);
      }
    }

    if (this.filters.area) {
      conditions.push(`[System.AreaPath] UNDER '${this.filters.area}'`);
    }

    if (this.filters.iteration) {
      conditions.push(`[System.IterationPath] UNDER '${this.filters.iteration}'`);
    }

    const wiql = `
      SELECT [System.Id], [System.Title], [System.WorkItemType],
             [System.State], [System.AssignedTo], [System.ChangedDate],
             [System.AreaPath], [System.Tags]
      FROM WorkItems
      WHERE ${conditions.join(' AND ')}
      ORDER BY [System.ChangedDate] DESC
    `;

    const result = await this.client.queryWorkItems(wiql);

    if (!result || !result.workItems || result.workItems.length === 0) {
      return [];
    }

    // Get full work item details (limited by limit option)
    const itemsToFetch = result.workItems.slice(0, this.limit);
    const workItems = await Promise.all(
      itemsToFetch.map(wi => this.client.getWorkItem(wi.id))
    );

    return workItems;
  }

  getWorkItemIcon(type) {
    const icons = {
      'Epic': '🎯',
      'Feature': '📦',
      'User Story': '📖',
      'Task': '✓',
      'Bug': '🐛',
      'Issue': '⚠'
    };
    return icons[type] || '•';
  }

  getStateColor(state) {
    switch(state) {
      case 'Done':
      case 'Closed':
      case 'Resolved':
        return this.colors.green;
      case 'Active':
      case 'In Progress':
      case 'Committed':
        return this.colors.blue;
      case 'New':
      case 'Proposed':
      case 'To Do':
        return this.colors.cyan;
      default:
        return this.colors.gray;
    }
  }

  displayTableFormat(workItems, query) {
    console.log('\n' + this.colors.bold(`Search Results for "${query}"`));
    console.log('=' + '='.repeat(90));

    if (workItems.length === 0) {
      console.log(this.colors.yellow('No work items found matching your search criteria.'));
      return;
    }

    console.log(`Found ${workItems.length} items${this.limit < workItems.length ? ` (showing first ${this.limit})` : ''}:\n`);

    workItems.forEach(item => {
      const id = item.id;
      const type = item.fields['System.WorkItemType'];
      const title = this.highlightMatch(item.fields['System.Title'], query);
      const state = item.fields['System.State'];
      const assignee = this.formatUser(item.fields['System.AssignedTo']);
      const modified = this.formatDate(item.fields['System.ChangedDate']);
      const icon = this.getWorkItemIcon(type);
      const stateColor = this.getStateColor(state);

      console.log(`${icon} ${this.colors.bold(`#${id}`)} ${this.colors.dim(`[${type}]`)}`);
      console.log(`  ${title}`);
      console.log(`  ${stateColor(state)} • ${assignee} • ${this.colors.dim(modified)}`);

      // Show tags if present
      if (item.fields['System.Tags']) {
        const tags = item.fields['System.Tags'].split(';').map(t => t.trim()).filter(t => t);
        if (tags.length > 0) {
          console.log(`  ${this.colors.cyan('Tags:')} ${tags.join(', ')}`);
        }
      }

      console.log();
    });

    console.log('-'.repeat(91));
    console.log(this.colors.dim(`Tip: Use --limit to see more results, --type to filter by type`));
  }

  displayJsonFormat(workItems) {
    const output = workItems.map(item => ({
      id: item.id,
      type: item.fields['System.WorkItemType'],
      title: item.fields['System.Title'],
      state: item.fields['System.State'],
      assignee: this.formatUser(item.fields['System.AssignedTo']),
      modifiedDate: item.fields['System.ChangedDate'],
      areaPath: item.fields['System.AreaPath'],
      tags: item.fields['System.Tags'] ? item.fields['System.Tags'].split(';').map(t => t.trim()).filter(t => t) : []
    }));

    console.log(JSON.stringify(output, null, 2));
  }

  displayDetailedFormat(workItems, query) {
    console.log('\n' + this.colors.bold(`Detailed Search Results for "${query}"`));
    console.log('=' + '='.repeat(90));

    if (workItems.length === 0) {
      console.log(this.colors.yellow('No work items found matching your search criteria.'));
      return;
    }

    workItems.forEach((item, index) => {
      if (index > 0) console.log('\n' + '-'.repeat(91));

      const id = item.id;
      const type = item.fields['System.WorkItemType'];
      const title = this.highlightMatch(item.fields['System.Title'], query);
      const state = item.fields['System.State'];
      const icon = this.getWorkItemIcon(type);
      const stateColor = this.getStateColor(state);

      console.log(`\n${icon} ${this.colors.bold(`${type} #${id}`)}`);
      console.log(this.colors.bold(title));
      console.log(`State: ${stateColor(state)}`);

      // Details
      console.log(`\nAssigned To: ${this.formatUser(item.fields['System.AssignedTo'])}`);
      console.log(`Area Path: ${item.fields['System.AreaPath']}`);

      if (item.fields['System.IterationPath']) {
        console.log(`Iteration: ${item.fields['System.IterationPath']}`);
      }

      console.log(`Modified: ${this.formatDate(item.fields['System.ChangedDate'])}`);
      console.log(`Created: ${this.formatDate(item.fields['System.CreatedDate'])}`);

      // Tags
      if (item.fields['System.Tags']) {
        const tags = item.fields['System.Tags'].split(';').map(t => t.trim()).filter(t => t);
        if (tags.length > 0) {
          console.log(`Tags: ${this.colors.cyan(tags.join(', '))}`);
        }
      }

      // Description preview
      if (item.fields['System.Description']) {
        const description = item.fields['System.Description']
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .trim();

        if (description) {
          const preview = description.substring(0, 200);
          const highlighted = this.highlightMatch(preview, query);
          console.log(`\nDescription Preview:`);
          console.log(this.colors.dim(highlighted + (description.length > 200 ? '...' : '')));
        }
      }
    });

    console.log('\n' + '='.repeat(91));
  }

  async search(query) {
    try {
      await this.initializeClient();

      // Search for work items
      const workItems = await this.searchWorkItems(query);

      // Display results in requested format
      switch (this.format) {
        case 'json':
          this.displayJsonFormat(workItems);
          break;
        case 'detailed':
          this.displayDetailedFormat(workItems, query);
          break;
        case 'table':
        default:
          this.displayTableFormat(workItems, query);
          break;
      }

    } catch (error) {
      if (error.message.includes('not configured')) {
        console.error(this.colors.red(`Configuration Error: ${error.message}`));
      } else {
        console.error(this.colors.red('Error searching work items:'), error.message);
        if (this.options.verbose) {
          console.error(error.stack);
        }
      }
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let query = null;
  const options = {
    verbose: false,
    silent: false,
    projectPath: process.cwd()
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: azure-search <query> [options]');
      console.log('\nSearch for work items in Azure DevOps');
      console.log('\nOptions:');
      console.log('  -h, --help              Show this help message');
      console.log('  -v, --verbose           Show detailed error information');
      console.log('  -s, --silent            Suppress color output');
      console.log('  --type <type>           Filter by work item type (Bug, Task, User Story, Feature)');
      console.log('  --state <state>         Filter by state (New, Active, Done, etc.)');
      console.log('  --assignee <name>       Filter by assignee (use "me" for current user)');
      console.log('  --area <path>           Filter by area path');
      console.log('  --iteration <path>      Filter by iteration path');
      console.log('  --limit <number>        Limit results (default: 10)');
      console.log('  --json                  Output in JSON format');
      console.log('  --detailed              Show detailed view');
      console.log('  --path <path>           Project path (default: current directory)');
      console.log('\nExamples:');
      console.log('  azure-search "login bug"');
      console.log('  azure-search "performance" --type Bug --state Active');
      console.log('  azure-search "feature" --assignee me --limit 20');
      process.exit(0);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else if (arg === '--json') {
      options.format = 'json';
    } else if (arg === '--detailed') {
      options.format = 'detailed';
    } else if (arg === '--type' && i + 1 < args.length) {
      options.type = args[++i];
    } else if (arg === '--state' && i + 1 < args.length) {
      options.state = args[++i];
    } else if (arg === '--assignee' && i + 1 < args.length) {
      options.assignee = args[++i];
    } else if (arg === '--area' && i + 1 < args.length) {
      options.area = args[++i];
    } else if (arg === '--iteration' && i + 1 < args.length) {
      options.iteration = args[++i];
    } else if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--path' && i + 1 < args.length) {
      options.projectPath = args[++i];
    } else if (!arg.startsWith('-') && !query) {
      // Handle multi-word queries
      const remainingArgs = args.slice(i).filter(a => !a.startsWith('-'));
      if (remainingArgs.length > 0) {
        query = remainingArgs.join(' ');
        break;
      }
    }
  }

  if (!query) {
    console.error('Error: Search query is required');
    console.log('Usage: azure-search <query> [options]');
    console.log('Try: azure-search --help');
    process.exit(1);
  }

  const search = new AzureSearch(options);
  await search.search(query);
}

// Export for testing
module.exports = AzureSearch;

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}