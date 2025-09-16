#!/usr/bin/env node

/**
 * Azure DevOps Active Work Script
 * Migrated from autopm/.claude/scripts/azure/active-work.sh to Node.js
 *
 * Features:
 * - Shows all work items currently in progress
 * - Supports user filtering (--user=email or --user=me)
 * - Groups items by type (Task, User Story, Bug)
 * - Displays formatted tables with item details
 * - Shows summary statistics and recent activity
 * - Provides quick action suggestions
 * - Uses WIQL queries to fetch data from Azure DevOps API
 * - Cross-platform date handling
 */

const path = require('path');
const fs = require('fs-extra');
const https = require('https');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Import utilities
const Logger = require('../../lib/utils/logger');
const FileSystem = require('../../lib/utils/filesystem');
const Config = require('../../lib/utils/config');

class AzureActiveWork {
  constructor(options = {}) {
    // Initialize utilities
    const loggerOptions = {
      verbose: options.verbose || false,
      silent: options.silent || false
    };

    this.logger = new Logger(loggerOptions);
    this.fs = new FileSystem(this.logger);
    this.config = new Config(this.logger);

    // Set options
    this.options = {
      projectPath: options.projectPath || process.cwd(),
      verbose: options.verbose || false,
      silent: options.silent || false,
      args: options.args || []
    };

    // Set paths
    this.envPath = path.join(this.options.projectPath, '.claude', '.env');

    // Environment variables
    this.envVars = {};

    // Colors (disabled in silent mode)
    this.colors = this.options.silent ? {
      green: '',
      yellow: '',
      red: '',
      blue: '',
      cyan: '',
      reset: ''
    } : {
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m'
    };

    // For testing - allow dependency injection
    this.https = options.https || https;
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      if (!this.options.silent) {
        this.logger.info('🔄 Azure DevOps Active Work Items');
        this.logger.info('==================================');
        this.logger.info('');
      }

      // Load environment variables
      await this.loadEnvironment();

      // Validate environment
      const validation = this.validateEnvironment();
      if (!validation.valid) {
        return {
          success: false,
          error: `Missing required environment variables: ${validation.errors.join(', ')}`
        };
      }

      // Parse user filter from arguments
      const userFilter = this.parseUserFilter();

      // Build and execute WIQL query
      const workItemIds = await this.fetchWorkItemIds(userFilter);

      if (workItemIds.length === 0) {
        const output = 'No active work items found.';
        if (!this.options.silent) {
          this.logger.info(output);
        }
        return {
          success: true,
          output
        };
      }

      // Fetch detailed work item information
      if (!this.options.silent) {
        this.logger.info('Processing work items...');
        this.logger.info('');
      }

      const workItems = [];
      for (const id of workItemIds) {
        try {
          const item = await this.fetchWorkItem(id);
          if (item) {
            workItems.push(item);
          }
        } catch (error) {
          if (!this.options.silent) {
            this.logger.warn(`Failed to fetch work item ${id}: ${error.message}`);
          }
        }
      }

      // Group work items by type
      const grouped = this.groupWorkItemsByType(workItems);

      // Generate output sections
      const outputSections = [];

      // Format tables for each type
      if (grouped.tasks.length > 0) {
        outputSections.push(this.formatTasksTable(grouped.tasks));
      }

      if (grouped.stories.length > 0) {
        outputSections.push(this.formatStoriesTable(grouped.stories));
      }

      if (grouped.bugs.length > 0) {
        outputSections.push(this.formatBugsTable(grouped.bugs));
      }

      // Generate summary
      const summary = {
        tasks: grouped.tasks.length,
        stories: grouped.stories.length,
        bugs: grouped.bugs.length,
        total: workItems.length,
        totalRemainingWork: this.calculateTotalRemainingWork(workItems)
      };

      outputSections.push(this.formatSummary(summary));

      // Recent activity
      const recentItems = this.filterRecentActivity(workItems);
      outputSections.push(this.formatRecentActivity(recentItems));

      // Quick actions and filters
      outputSections.push(this.formatQuickActions());
      outputSections.push(this.formatFilterHelp());

      const fullOutput = outputSections.join('\n');

      if (!this.options.silent) {
        console.log(fullOutput);
      }

      return {
        success: true,
        output: fullOutput,
        summary
      };

    } catch (error) {
      this.logger.error('Active work query failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load environment variables from .env file and process.env
   */
  async loadEnvironment() {
    // Load from process.env first
    this.envVars = {
      AZURE_DEVOPS_PAT: process.env.AZURE_DEVOPS_PAT || '',
      AZURE_DEVOPS_ORG: process.env.AZURE_DEVOPS_ORG || '',
      AZURE_DEVOPS_PROJECT: process.env.AZURE_DEVOPS_PROJECT || ''
    };

    // Override with .env file if exists
    try {
      if (await this.fs.exists(this.envPath)) {
        const content = await fs.readFile(this.envPath, 'utf8');
        const lines = content.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && value && this.envVars.hasOwnProperty(key)) {
              this.envVars[key] = value;
            }
          }
        }
      }
    } catch (error) {
      // Non-critical error, continue with process.env values
      if (this.options.verbose) {
        this.logger.warn(`Could not load .env file: ${error.message}`);
      }
    }
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    const required = ['AZURE_DEVOPS_PAT', 'AZURE_DEVOPS_ORG', 'AZURE_DEVOPS_PROJECT'];
    const missing = required.filter(key => !this.envVars[key]);

    return {
      valid: missing.length === 0,
      errors: missing
    };
  }

  /**
   * Parse user filter from command line arguments
   */
  parseUserFilter() {
    const userArg = this.options.args.find(arg => arg.startsWith('--user='));

    if (!userArg) {
      return { type: 'none', email: null };
    }

    const userValue = userArg.split('=')[1];

    if (!userValue || userValue.trim() === '') {
      return { type: 'none', email: null };
    }

    if (userValue === 'me') {
      return { type: 'me', email: null };
    }

    // Validate email format (basic check)
    if (userValue.includes('@')) {
      return { type: 'email', email: userValue };
    }

    return { type: 'none', email: null };
  }

  /**
   * Build WIQL query for active work items
   */
  buildWiqlQuery(userFilter) {
    let query = `SELECT [System.Id], [System.Title], [System.WorkItemType],
       [System.State], [System.AssignedTo], [System.ChangedDate],
       [Microsoft.VSTS.Scheduling.RemainingWork], [System.IterationPath]
FROM workitems
WHERE [System.State] IN ('Active', 'In Progress')
AND [System.WorkItemType] IN ('Task', 'Bug', 'User Story')`;

    // Add user filter if specified
    if (userFilter.type === 'me') {
      query += ' AND [System.AssignedTo] = @Me';
    } else if (userFilter.type === 'email') {
      query += ` AND [System.AssignedTo] = '${userFilter.email}'`;
    }

    query += ' ORDER BY [System.ChangedDate] DESC';

    return query;
  }

  /**
   * Fetch work item IDs using WIQL query
   */
  async fetchWorkItemIds(userFilter) {
    const query = this.buildWiqlQuery(userFilter);

    const queryData = {
      query: query
    };

    const response = await this.callAzureApi('wit/wiql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryData)
    });

    const data = JSON.parse(response);
    return (data.workItems || []).map(item => item.id);
  }

  /**
   * Fetch detailed work item information
   */
  async fetchWorkItem(id) {
    const response = await this.callAzureApi(`wit/workitems/${id}`);
    const data = JSON.parse(response);

    const fields = data.fields || {};

    return {
      id: data.id,
      title: (fields['System.Title'] || '').substring(0, 50),
      type: fields['System.WorkItemType'] || '',
      state: fields['System.State'] || '',
      assignedTo: fields['System.AssignedTo'] ?
        (fields['System.AssignedTo'].displayName || fields['System.AssignedTo']) : 'Unassigned',
      changedDate: fields['System.ChangedDate'] ?
        fields['System.ChangedDate'].split('T')[0] : '',
      remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0,
      sprint: fields['System.IterationPath'] ?
        fields['System.IterationPath'].split('\\').pop() : ''
    };
  }

  /**
   * Call Azure DevOps REST API
   */
  async callAzureApi(endpoint, options = {}) {
    const { AZURE_DEVOPS_PAT, AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT } = this.envVars;

    const auth = Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64');
    const url = `https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0`;

    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'ClaudeAutoPM/1.0',
        ...options.headers
      }
    };

    return new Promise((resolve, reject) => {
      const req = this.https.request(url, requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Group work items by type
   */
  groupWorkItemsByType(workItems) {
    const grouped = {
      tasks: [],
      stories: [],
      bugs: []
    };

    for (const item of workItems) {
      switch (item.type) {
        case 'Task':
          grouped.tasks.push(item);
          break;
        case 'User Story':
          grouped.stories.push(item);
          break;
        case 'Bug':
          grouped.bugs.push(item);
          break;
      }
    }

    return grouped;
  }

  /**
   * Calculate total remaining work
   */
  calculateTotalRemainingWork(workItems) {
    return workItems.reduce((total, item) => {
      return total + (item.remainingWork || 0);
    }, 0);
  }

  /**
   * Filter work items modified in the last 24 hours
   */
  filterRecentActivity(workItems) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];

    return workItems.filter(item => {
      return item.changedDate >= oneDayAgoStr;
    });
  }

  /**
   * Format tasks table
   */
  formatTasksTable(tasks) {
    let output = `${this.colors.blue}📋 Active Tasks${this.colors.reset}\n`;
    output += '---------------\n';
    output += this.formatTableHeader([
      'ID', 'Title', 'Assigned', 'Remain', 'Modified', 'Sprint'
    ], [7, 40, 15, 8, 10, 15]);

    for (const task of tasks) {
      output += this.formatTableRow([
        `#${task.id}`,
        task.title.padEnd(40).substring(0, 40),
        task.assignedTo.substring(0, 15),
        `${task.remainingWork}h`,
        task.changedDate,
        task.sprint.substring(0, 15)
      ], [7, 40, 15, 8, 10, 15]);
    }

    return output + '\n';
  }

  /**
   * Format user stories table
   */
  formatStoriesTable(stories) {
    let output = `${this.colors.green}📖 Active User Stories${this.colors.reset}\n`;
    output += '----------------------\n';
    output += this.formatTableHeader([
      'ID', 'Title', 'Assigned', 'Modified', 'Sprint'
    ], [7, 40, 15, 10, 15]);

    for (const story of stories) {
      output += this.formatTableRow([
        `#${story.id}`,
        story.title.padEnd(40).substring(0, 40),
        story.assignedTo.substring(0, 15),
        story.changedDate,
        story.sprint.substring(0, 15)
      ], [7, 40, 15, 10, 15]);
    }

    return output + '\n';
  }

  /**
   * Format bugs table
   */
  formatBugsTable(bugs) {
    let output = `${this.colors.yellow}🐛 Active Bugs${this.colors.reset}\n`;
    output += '--------------\n';
    output += this.formatTableHeader([
      'ID', 'Title', 'Assigned', 'Modified', 'Sprint'
    ], [7, 40, 15, 10, 15]);

    for (const bug of bugs) {
      output += this.formatTableRow([
        `#${bug.id}`,
        bug.title.padEnd(40).substring(0, 40),
        bug.assignedTo.substring(0, 15),
        bug.changedDate,
        bug.sprint.substring(0, 15)
      ], [7, 40, 15, 10, 15]);
    }

    return output + '\n';
  }

  /**
   * Format table header
   */
  formatTableHeader(headers, widths) {
    let output = '';

    // Header row
    for (let i = 0; i < headers.length; i++) {
      output += headers[i].padEnd(widths[i]);
      if (i < headers.length - 1) output += ' | ';
    }
    output += '\n';

    // Separator row
    for (let i = 0; i < headers.length; i++) {
      output += '-'.repeat(widths[i]);
      if (i < headers.length - 1) output += '-|-';
    }
    output += '\n';

    return output;
  }

  /**
   * Format table row
   */
  formatTableRow(cells, widths) {
    let output = '';

    for (let i = 0; i < cells.length; i++) {
      output += cells[i].padEnd(widths[i]);
      if (i < cells.length - 1) output += ' | ';
    }
    output += '\n';

    return output;
  }

  /**
   * Format summary statistics
   */
  formatSummary(summary) {
    let output = '📊 Summary\n';
    output += '----------\n';
    output += `Active Tasks: ${summary.tasks}\n`;
    output += `Active Stories: ${summary.stories}\n`;
    output += `Active Bugs: ${summary.bugs}\n`;
    output += `Total Active Items: ${summary.total}\n`;
    output += `Total Remaining Work: ${summary.totalRemainingWork}h\n`;

    return output;
  }

  /**
   * Format recent activity section
   */
  formatRecentActivity(recentItems) {
    let output = '\n📅 Recent Activity (Last 24h)\n';
    output += '-----------------------------\n';

    if (recentItems.length === 0) {
      output += '  No items modified in the last 24 hours\n';
    } else {
      for (const item of recentItems) {
        output += `  • #${item.id}: ${item.title} (modified ${item.changedDate})\n`;
      }
    }

    return output;
  }

  /**
   * Format quick actions section
   */
  formatQuickActions() {
    let output = '\n🔧 Quick Actions\n';
    output += '----------------\n';
    output += '• View specific item: /azure:task-show <id>\n';
    output += '• Update task status: /azure:task-edit <id>\n';
    output += '• Close completed task: /azure:task-close <id>\n';
    output += '• Check sprint status: /azure:sprint-status\n';
    output += '• Get next task: /azure:next-task\n';

    return output;
  }

  /**
   * Format filter help section
   */
  formatFilterHelp() {
    let output = '\nAvailable Filters:\n';
    output += '------------------\n';
    output += '• Show only your items: ./active-work.sh --user=me\n';
    output += '• Show specific user: ./active-work.sh --user=email@example.com\n';

    return output;
  }
}

// CLI interface
if (require.main === module) {
  const argv = yargs(hideBin(process.argv))
    .option('path', {
      alias: 'p',
      describe: 'Project path',
      type: 'string',
      default: process.cwd()
    })
    .option('user', {
      alias: 'u',
      describe: 'Filter by user (me or email@example.com)',
      type: 'string'
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Verbose output',
      type: 'boolean',
      default: false
    })
    .option('silent', {
      alias: 's',
      describe: 'Silent mode',
      type: 'boolean',
      default: false
    })
    .help()
    .argv;

  // Convert user option to args format for compatibility
  const args = [];
  if (argv.user) {
    args.push(`--user=${argv.user}`);
  }

  const activeWork = new AzureActiveWork({
    projectPath: argv.path,
    verbose: argv.verbose,
    silent: argv.silent,
    args
  });

  activeWork.run()
    .then((result) => {
      if (!result.success) {
        console.error('Azure active work query failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Azure active work query failed:', error.message);
      process.exit(1);
    });
}

module.exports = AzureActiveWork;