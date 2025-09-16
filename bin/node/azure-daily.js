#!/usr/bin/env node

/**
 * Azure DevOps Daily Workflow Script
 * Migrated from autopm/.claude/scripts/azure/daily.sh to Node.js
 *
 * Features:
 * - Shows daily standup summary with completed tasks from yesterday
 * - Shows active work for current user (@Me)
 * - Checks for blocked items (items with 'blocked' tag)
 * - Shows current sprint status and name
 * - Suggests next highest priority task
 * - Provides quick action suggestions
 * - Uses multiple WIQL queries for different data sets
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

class AzureDaily {
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
      silent: options.silent || false
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
        this.logger.info('🌅 Starting Azure DevOps Daily Workflow');
        this.logger.info('========================================');
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

      const sections = [];

      // 1. Daily Standup Summary
      const yesterday = this.getYesterdayDate();
      const completedTasks = await this.fetchCompletedTasks(yesterday);
      sections.push(this.generateStandupSummary(completedTasks));

      // 2. Active Work
      const activeTasks = await this.fetchActiveTasks();
      sections.push(this.generateActiveWorkSummary(activeTasks));

      // 3. Check for Blockers
      const blockedItems = await this.fetchBlockedItems();
      sections.push(this.generateBlockersCheck(blockedItems));

      // 4. Sprint Status
      const currentIteration = await this.fetchCurrentIteration();
      sections.push(this.generateSprintStatus(currentIteration));

      // 5. Suggest Next Task
      const nextTask = await this.fetchNextTask();
      sections.push(this.generateNextTaskSuggestion(nextTask));

      // Generate complete output
      const fullOutput = this.formatDailyOutput(sections);

      if (!this.options.silent) {
        console.log(fullOutput);
      }

      return {
        success: true,
        output: fullOutput,
        summary: {
          completedTasks: completedTasks.length,
          activeTasks: activeTasks.length,
          blockedItems: blockedItems.length,
          currentIteration: currentIteration ? currentIteration.name : null,
          nextTask: nextTask.length > 0 ? nextTask[0].id : null
        }
      };

    } catch (error) {
      this.logger.error('Daily workflow failed', error);
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
   * Get yesterday's date in YYYY-MM-DD format
   */
  getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Build WIQL query for completed tasks from yesterday
   */
  buildCompletedTasksQuery(yesterday) {
    return `SELECT [System.Id], [System.Title]
FROM workitems
WHERE [System.WorkItemType] = 'Task'
AND [System.ChangedDate] >= '${yesterday}'
AND [System.State] = 'Done'
AND [System.AssignedTo] = @Me`;
  }

  /**
   * Build WIQL query for active tasks assigned to me
   */
  buildActiveTasksQuery() {
    return `SELECT [System.Id], [System.Title], [Microsoft.VSTS.Scheduling.RemainingWork]
FROM workitems
WHERE [System.WorkItemType] = 'Task'
AND [System.State] = 'In Progress'
AND [System.AssignedTo] = @Me`;
  }

  /**
   * Build WIQL query for blocked items
   */
  buildBlockedItemsQuery() {
    return `SELECT [System.Id], [System.Title]
FROM workitems
WHERE [System.Tags] CONTAINS 'blocked'
AND [System.State] != 'Closed'`;
  }

  /**
   * Build WIQL query for next highest priority task
   */
  buildNextTaskQuery() {
    return `SELECT TOP 1 [System.Id], [System.Title]
FROM workitems
WHERE [System.WorkItemType] = 'Task'
AND [System.State] = 'To Do'
AND ([System.AssignedTo] = '' OR [System.AssignedTo] = @Me)
ORDER BY [Microsoft.VSTS.Common.Priority] ASC`;
  }

  /**
   * Fetch completed tasks from yesterday
   */
  async fetchCompletedTasks(yesterday) {
    const query = this.buildCompletedTasksQuery(yesterday);
    return await this.executeWiqlQuery(query);
  }

  /**
   * Fetch active tasks for current user
   */
  async fetchActiveTasks() {
    const query = this.buildActiveTasksQuery();
    return await this.executeWiqlQuery(query);
  }

  /**
   * Fetch blocked items
   */
  async fetchBlockedItems() {
    const query = this.buildBlockedItemsQuery();
    return await this.executeWiqlQuery(query);
  }

  /**
   * Fetch next recommended task
   */
  async fetchNextTask() {
    const query = this.buildNextTaskQuery();
    return await this.executeWiqlQuery(query);
  }

  /**
   * Fetch current iteration/sprint
   */
  async fetchCurrentIteration() {
    try {
      const response = await this.callAzureApi('work/teamsettings/iterations?$timeframe=current');
      const data = JSON.parse(response);

      if (data.value && data.value.length > 0) {
        return {
          name: data.value[0].name,
          id: data.value[0].id,
          startDate: data.value[0].attributes ? data.value[0].attributes.startDate : null,
          finishDate: data.value[0].attributes ? data.value[0].attributes.finishDate : null
        };
      }

      return null;
    } catch (error) {
      if (this.options.verbose) {
        this.logger.warn(`Could not fetch current iteration: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Execute WIQL query and return work items
   */
  async executeWiqlQuery(query) {
    const queryData = { query: query };

    const response = await this.callAzureApi('wit/wiql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryData)
    });

    const data = JSON.parse(response);
    return data.workItems || [];
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
   * Generate standup summary section
   */
  generateStandupSummary(completedTasks) {
    let output = '📋 Daily Standup Summary\n';
    output += '------------------------\n';
    output += 'Fetching your completed tasks from yesterday...\n';
    output += `✅ Tasks completed yesterday: ${completedTasks.length}\n`;
    return output;
  }

  /**
   * Generate active work summary section
   */
  generateActiveWorkSummary(activeTasks) {
    let output = '\n🔄 Your Active Work\n';
    output += '-------------------\n';
    output += `Active tasks: ${activeTasks.length}\n`;
    return output;
  }

  /**
   * Generate blockers check section
   */
  generateBlockersCheck(blockedItems) {
    let output = '\n🚧 Checking for Blockers\n';
    output += '------------------------\n';

    if (blockedItems.length > 0) {
      output += `⚠️  Found ${blockedItems.length} blocked items!\n`;
    } else {
      output += '✅ No blockers found\n';
    }

    return output;
  }

  /**
   * Generate sprint status section
   */
  generateSprintStatus(currentIteration) {
    let output = '\n📊 Sprint Status\n';
    output += '----------------\n';

    if (currentIteration) {
      output += `Current Sprint: ${currentIteration.name}\n`;
    } else {
      output += 'Current Sprint: No active sprint\n';
    }

    return output;
  }

  /**
   * Generate next task suggestion section
   */
  generateNextTaskSuggestion(nextTask) {
    let output = '\n🎯 Suggested Next Task\n';
    output += '----------------------\n';
    output += 'Analyzing priorities and dependencies...\n';

    if (nextTask.length === 0) {
      output += 'No tasks available. Check backlog or blocked items.\n';
    } else {
      const taskId = nextTask[0].id;
      output += `Recommended: Task #${taskId}\n`;
      output += '\n';
      output += 'To start this task, run:\n';
      output += `  /azure:task-start ${taskId}\n`;
    }

    return output;
  }

  /**
   * Generate quick actions section
   */
  generateQuickActions() {
    let output = '\nQuick actions:\n';
    output += '  1. Start recommended task\n';
    output += '  2. View sprint dashboard (/azure:sprint-status)\n';
    output += '  3. Check blocked items (/azure:blocked-items)\n';
    output += '  4. View all your tasks (/azure:task-list --my-tasks)\n';
    return output;
  }

  /**
   * Format complete daily output
   */
  formatDailyOutput(sections) {
    let output = '🌅 Starting Azure DevOps Daily Workflow\n';
    output += '========================================\n';

    // Add all sections
    output += sections.join('');

    // Add completion message
    output += '\n========================================\n';
    output += '✅ Daily workflow complete!\n';

    // Add quick actions
    output += this.generateQuickActions();

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

  const daily = new AzureDaily({
    projectPath: argv.path,
    verbose: argv.verbose,
    silent: argv.silent
  });

  daily.run()
    .then((result) => {
      if (!result.success) {
        console.error('Azure daily workflow failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Azure daily workflow failed:', error.message);
      process.exit(1);
    });
}

module.exports = AzureDaily;