#!/usr/bin/env node

/**
 * Azure DevOps Blocked Items Script
 * Migrated from autopm/.claude/scripts/azure/blocked.sh to Node.js
 *
 * Features:
 * - Shows all blocked work items and their resolution status
 * - Supports resolve mode to help unblock items
 * - Groups items by urgency and type
 * - Provides resolution suggestions
 * - Cross-platform compatibility
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

class AzureBlocked {
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
      resolveMode: options.resolveMode || false
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
        this.logger.info('🚧 Azure DevOps Blocked Items');
        this.logger.info('==============================');
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

      // Fetch blocked items
      const blockedItems = await this.fetchBlockedItems();

      if (blockedItems.length === 0) {
        const output = `${this.colors.green}✅ No blocked items found!${this.colors.reset}\nAll work items are flowing smoothly.`;
        if (!this.options.silent) {
          this.logger.info(output);
        }
        return {
          success: true,
          output,
          summary: { blockedCount: 0 }
        };
      }

      // Fetch detailed information for each blocked item
      const detailedItems = [];
      for (const item of blockedItems) {
        try {
          const details = await this.fetchWorkItem(item.id);
          if (details) {
            detailedItems.push(details);
          }
        } catch (error) {
          if (this.options.verbose) {
            this.logger.warn(`Failed to fetch details for item ${item.id}: ${error.message}`);
          }
        }
      }

      // Group and format output
      const grouped = this.groupBlockedItems(detailedItems);
      const outputSections = [];

      // Critical items
      if (grouped.critical.length > 0) {
        outputSections.push(this.formatCriticalItems(grouped.critical));
      }

      // High priority items
      if (grouped.high.length > 0) {
        outputSections.push(this.formatHighPriorityItems(grouped.high));
      }

      // Normal priority items
      if (grouped.normal.length > 0) {
        outputSections.push(this.formatNormalItems(grouped.normal));
      }

      // Summary
      outputSections.push(this.formatSummary(detailedItems));

      // Resolution suggestions
      if (this.options.resolveMode) {
        outputSections.push(this.formatResolutionSuggestions(detailedItems));
      }

      // Actions
      outputSections.push(this.formatQuickActions());

      const fullOutput = outputSections.join('\n');

      if (!this.options.silent) {
        console.log(fullOutput);
      }

      return {
        success: true,
        output: fullOutput,
        summary: {
          blockedCount: detailedItems.length,
          critical: grouped.critical.length,
          high: grouped.high.length,
          normal: grouped.normal.length
        }
      };

    } catch (error) {
      this.logger.error('Blocked items query failed', error);
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
   * Build WIQL query for blocked items
   */
  buildBlockedItemsQuery() {
    return `SELECT [System.Id], [System.Title], [System.WorkItemType],
       [System.State], [System.AssignedTo], [System.Tags],
       [Microsoft.VSTS.Common.Priority], [System.CreatedDate],
       [System.ChangedDate], [System.IterationPath]
FROM workitems
WHERE [System.Tags] CONTAINS 'blocked'
AND [System.State] NOT IN ('Closed', 'Done', 'Removed')
ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.CreatedDate] ASC`;
  }

  /**
   * Fetch blocked work items
   */
  async fetchBlockedItems() {
    const query = this.buildBlockedItemsQuery();
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
   * Fetch detailed work item information
   */
  async fetchWorkItem(id) {
    const response = await this.callAzureApi(`wit/workitems/${id}`);
    const data = JSON.parse(response);

    const fields = data.fields || {};

    return {
      id: data.id,
      title: (fields['System.Title'] || '').substring(0, 60),
      type: fields['System.WorkItemType'] || '',
      state: fields['System.State'] || '',
      assignedTo: fields['System.AssignedTo'] ?
        (fields['System.AssignedTo'].displayName || fields['System.AssignedTo']) : 'Unassigned',
      priority: fields['Microsoft.VSTS.Common.Priority'] || 3,
      tags: fields['System.Tags'] || '',
      createdDate: fields['System.CreatedDate'] ?
        fields['System.CreatedDate'].split('T')[0] : '',
      changedDate: fields['System.ChangedDate'] ?
        fields['System.ChangedDate'].split('T')[0] : '',
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
   * Group blocked items by priority
   */
  groupBlockedItems(items) {
    const grouped = {
      critical: [],
      high: [],
      normal: []
    };

    for (const item of items) {
      if (item.priority === 1) {
        grouped.critical.push(item);
      } else if (item.priority === 2) {
        grouped.high.push(item);
      } else {
        grouped.normal.push(item);
      }
    }

    return grouped;
  }

  /**
   * Format critical items section
   */
  formatCriticalItems(items) {
    let output = `${this.colors.red}🚨 Critical Blocked Items${this.colors.reset}\n`;
    output += '========================\n';

    for (const item of items) {
      output += `• #${item.id} - ${item.title}\n`;
      output += `  Type: ${item.type} | Assigned: ${item.assignedTo}\n`;
      output += `  Blocked since: ${item.createdDate} | Sprint: ${item.sprint}\n\n`;
    }

    return output;
  }

  /**
   * Format high priority items section
   */
  formatHighPriorityItems(items) {
    let output = `${this.colors.yellow}⚠️  High Priority Blocked Items${this.colors.reset}\n`;
    output += '==============================\n';

    for (const item of items) {
      output += `• #${item.id} - ${item.title}\n`;
      output += `  Type: ${item.type} | Assigned: ${item.assignedTo}\n`;
      output += `  Blocked since: ${item.createdDate} | Sprint: ${item.sprint}\n\n`;
    }

    return output;
  }

  /**
   * Format normal priority items section
   */
  formatNormalItems(items) {
    let output = `${this.colors.blue}📋 Blocked Items${this.colors.reset}\n`;
    output += '===============\n';

    for (const item of items) {
      output += `• #${item.id} - ${item.title}\n`;
      output += `  Type: ${item.type} | Assigned: ${item.assignedTo}\n`;
      output += `  Blocked since: ${item.createdDate} | Sprint: ${item.sprint}\n\n`;
    }

    return output;
  }

  /**
   * Format summary
   */
  formatSummary(items) {
    let output = '📊 Blocked Items Summary\n';
    output += '=======================\n';
    output += `Total Blocked Items: ${items.length}\n`;

    const byType = {};
    const byAssignee = {};

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byAssignee[item.assignedTo] = (byAssignee[item.assignedTo] || 0) + 1;
    }

    output += '\nBy Type:\n';
    for (const [type, count] of Object.entries(byType)) {
      output += `  ${type}: ${count}\n`;
    }

    output += '\nBy Assignee:\n';
    for (const [assignee, count] of Object.entries(byAssignee)) {
      output += `  ${assignee}: ${count}\n`;
    }

    return output;
  }

  /**
   * Format resolution suggestions
   */
  formatResolutionSuggestions(items) {
    let output = '\n🔧 Resolution Suggestions\n';
    output += '========================\n';

    output += '1. Review blocking dependencies and external factors\n';
    output += '2. Escalate critical items to management\n';
    output += '3. Consider alternative approaches or workarounds\n';
    output += '4. Update item descriptions with current blocking reason\n';
    output += '5. Set up regular review meetings for blocked items\n';

    return output;
  }

  /**
   * Format quick actions
   */
  formatQuickActions() {
    let output = '\n⚡ Quick Actions\n';
    output += '===============\n';
    output += '• View item details: /azure:task-show <id>\n';
    output += '• Update blocking reason: /azure:task-edit <id>\n';
    output += '• Remove blocked tag: /azure:task-unblock <id>\n';
    output += '• Escalate to manager: /azure:escalate <id>\n';
    output += '• Schedule review meeting: /azure:schedule-review\n';

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
    .option('resolve', {
      alias: 'r',
      describe: 'Show resolution suggestions',
      type: 'boolean',
      default: false
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

  const blocked = new AzureBlocked({
    projectPath: argv.path,
    resolveMode: argv.resolve,
    verbose: argv.verbose,
    silent: argv.silent
  });

  blocked.run()
    .then((result) => {
      if (!result.success) {
        console.error('Azure blocked items query failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Azure blocked items query failed:', error.message);
      process.exit(1);
    });
}

module.exports = AzureBlocked;