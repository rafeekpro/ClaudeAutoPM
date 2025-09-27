#!/usr/bin/env node

/**
 * Azure DevOps Validation Script
 * Migrated from autopm/.claude/scripts/azure/validate.sh to Node.js
 *
 * Features:
 * - Validates work items for completeness and quality
 * - Checks for missing fields, invalid states, etc.
 * - Supports sprint filtering and fix mode
 * - Provides validation reports and suggestions
 * - Cross-platform compatibility
 */

const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Import utilities
const Logger = require('../../lib/utils/logger');
const FileSystem = require('../../lib/utils/filesystem');
const Config = require('../../lib/utils/config');

class AzureValidate {
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
      sprintFilter: options.sprintFilter || null,
      fixMode: options.fixMode || false
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

    // Validation rules
    this.validationRules = {
      required_fields: {
        'Task': ['System.Title', 'System.AssignedTo', 'Microsoft.VSTS.Scheduling.RemainingWork'],
        'User Story': ['System.Title', 'System.Description', 'Microsoft.VSTS.Common.AcceptanceCriteria'],
        'Bug': ['System.Title', 'System.AssignedTo', 'Microsoft.VSTS.TCM.ReproSteps'],
        'Feature': ['System.Title', 'System.Description']
      },
      valid_states: {
        'Task': ['To Do', 'In Progress', 'Done'],
        'User Story': ['New', 'Active', 'Resolved', 'Closed'],
        'Bug': ['New', 'Active', 'Resolved', 'Closed'],
        'Feature': ['New', 'In Progress', 'Done']
      }
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
        this.logger.info('✅ Azure DevOps Work Item Validation');
        this.logger.info('====================================');
        this.logger.info('');
      }

      // Load environment variables
      await this.loadEnvironment();

      // Validate environment
      const envValidation = this.validateEnvironment();
      if (!envValidation.valid) {
        return {
          success: false,
          error: `Missing required environment variables: ${envValidation.errors.join(', ')}`
        };
      }

      // Fetch work items to validate
      const workItems = await this.fetchWorkItemsToValidate();

      if (workItems.length === 0) {
        const output = `${this.colors.green}✅ No work items found to validate.${this.colors.reset}`;
        if (!this.options.silent) {
          this.logger.info(output);
        }
        return {
          success: true,
          output,
          validation: { passed: 0, failed: 0, warnings: 0 }
        };
      }

      // Fetch detailed information and validate
      const validationResults = [];
      for (const item of workItems) {
        try {
          const details = await this.fetchWorkItem(item.id);
          if (details) {
            const validation = this.validateWorkItem(details);
            validationResults.push({
              item: details,
              validation: validation
            });
          }
        } catch (error) {
          if (this.options.verbose) {
            this.logger.warn(`Failed to validate item ${item.id}: ${error.message}`);
          }
        }
      }

      // Generate validation report
      const report = this.generateValidationReport(validationResults);
      const summary = this.calculateValidationSummary(validationResults);

      const outputSections = [];
      outputSections.push(report);
      outputSections.push(this.formatValidationSummary(summary));

      if (this.options.fixMode) {
        outputSections.push(this.formatFixSuggestions(validationResults));
      }

      outputSections.push(this.formatQuickActions());

      const fullOutput = outputSections.join('\n');

      if (!this.options.silent) {
        console.log(fullOutput);
      }

      return {
        success: true,
        output: fullOutput,
        validation: summary,
        results: validationResults
      };

    } catch (error) {
      this.logger.error('Work item validation failed', error);
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
   * Build WIQL query for work items to validate
   */
  buildValidationQuery() {
    let query = `SELECT [System.Id]
FROM workitems
WHERE [System.WorkItemType] IN ('Task', 'User Story', 'Bug', 'Feature')
AND [System.State] NOT IN ('Closed', 'Done', 'Removed')`;

    if (this.options.sprintFilter) {
      if (this.options.sprintFilter === 'current') {
        query += ' AND [System.IterationPath] = @CurrentIteration';
      } else {
        query += ` AND [System.IterationPath] CONTAINS '${this.options.sprintFilter}'`;
      }
    }

    query += ' ORDER BY [System.ChangedDate] DESC';

    return query;
  }

  /**
   * Fetch work items to validate
   */
  async fetchWorkItemsToValidate() {
    const query = this.buildValidationQuery();
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
      title: fields['System.Title'] || '',
      type: fields['System.WorkItemType'] || '',
      state: fields['System.State'] || '',
      assignedTo: fields['System.AssignedTo'] ?
        (fields['System.AssignedTo'].displayName || fields['System.AssignedTo']) : '',
      description: fields['System.Description'] || '',
      acceptanceCriteria: fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
      reproSteps: fields['Microsoft.VSTS.TCM.ReproSteps'] || '',
      remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
      priority: fields['Microsoft.VSTS.Common.Priority'] || null,
      tags: fields['System.Tags'] || '',
      sprint: fields['System.IterationPath'] ?
        fields['System.IterationPath'].split('\\').pop() : '',
      fields: fields
    };
  }

  /**
   * Validate a single work item
   */
  validateWorkItem(item) {
    const validation = {
      errors: [],
      warnings: [],
      passed: []
    };

    // Check required fields
    const requiredFields = this.validationRules.required_fields[item.type] || [];
    for (const field of requiredFields) {
      const value = item.fields[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        validation.errors.push(`Missing required field: ${field}`);
      } else {
        validation.passed.push(`Required field present: ${field}`);
      }
    }

    // Check valid states
    const validStates = this.validationRules.valid_states[item.type] || [];
    if (validStates.length > 0 && !validStates.includes(item.state)) {
      validation.errors.push(`Invalid state '${item.state}' for ${item.type}`);
    } else if (validStates.length > 0) {
      validation.passed.push(`Valid state: ${item.state}`);
    }

    // Type-specific validations
    this.validateTypeSpecific(item, validation);

    return validation;
  }

  /**
   * Perform type-specific validations
   */
  validateTypeSpecific(item, validation) {
    switch (item.type) {
      case 'Task':
        if (item.remainingWork === null || item.remainingWork === 0) {
          validation.warnings.push('Remaining work not specified');
        }
        if (item.state === 'In Progress' && !item.assignedTo) {
          validation.errors.push('In Progress tasks must be assigned');
        }
        break;

      case 'User Story':
        if (!item.acceptanceCriteria) {
          validation.errors.push('User Stories must have acceptance criteria');
        }
        if (item.description && item.description.length < 50) {
          validation.warnings.push('Description is very short');
        }
        break;

      case 'Bug':
        if (!item.reproSteps) {
          validation.errors.push('Bugs must have reproduction steps');
        }
        if (item.priority === null) {
          validation.warnings.push('Bug priority not set');
        }
        break;

      case 'Feature':
        if (item.description && item.description.length < 100) {
          validation.warnings.push('Feature description should be more detailed');
        }
        break;
    }
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
   * Generate validation report
   */
  generateValidationReport(results) {
    let output = '📋 Validation Report\n';
    output += '===================\n\n';

    const failed = results.filter(r => r.validation.errors.length > 0);
    const warnings = results.filter(r => r.validation.warnings.length > 0);

    if (failed.length > 0) {
      output += `${this.colors.red}❌ Failed Items (${failed.length})${this.colors.reset}\n`;
      output += '-------------------\n';
      for (const result of failed) {
        output += `• #${result.item.id} - ${result.item.title}\n`;
        for (const error of result.validation.errors) {
          output += `  ❌ ${error}\n`;
        }
        output += '\n';
      }
    }

    if (warnings.length > 0) {
      output += `${this.colors.yellow}⚠️  Items with Warnings (${warnings.length})${this.colors.reset}\n`;
      output += '-------------------------\n';
      for (const result of warnings) {
        if (result.validation.warnings.length > 0) {
          output += `• #${result.item.id} - ${result.item.title}\n`;
          for (const warning of result.validation.warnings) {
            output += `  ⚠️  ${warning}\n`;
          }
          output += '\n';
        }
      }
    }

    const passed = results.filter(r => r.validation.errors.length === 0);
    if (passed.length > 0) {
      output += `${this.colors.green}✅ Passed Items (${passed.length})${this.colors.reset}\n`;
      output += '----------------\n';
      for (const result of passed.slice(0, 5)) { // Show only first 5
        output += `• #${result.item.id} - ${result.item.title}\n`;
      }
      if (passed.length > 5) {
        output += `... and ${passed.length - 5} more\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Calculate validation summary
   */
  calculateValidationSummary(results) {
    const summary = {
      total: results.length,
      passed: 0,
      failed: 0,
      warnings: 0
    };

    for (const result of results) {
      if (result.validation.errors.length > 0) {
        summary.failed++;
      } else {
        summary.passed++;
      }

      if (result.validation.warnings.length > 0) {
        summary.warnings++;
      }
    }

    return summary;
  }

  /**
   * Format validation summary
   */
  formatValidationSummary(summary) {
    let output = '📊 Validation Summary\n';
    output += '====================\n';
    output += `Total Items Validated: ${summary.total}\n`;
    output += `${this.colors.green}✅ Passed: ${summary.passed}${this.colors.reset}\n`;
    output += `${this.colors.red}❌ Failed: ${summary.failed}${this.colors.reset}\n`;
    output += `${this.colors.yellow}⚠️  Warnings: ${summary.warnings}${this.colors.reset}\n`;

    const passRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;
    output += `\nPass Rate: ${passRate}%\n`;

    return output;
  }

  /**
   * Format fix suggestions
   */
  formatFixSuggestions(results) {
    let output = '\n🔧 Fix Suggestions\n';
    output += '==================\n';

    const commonIssues = {};
    for (const result of results) {
      for (const error of result.validation.errors) {
        commonIssues[error] = (commonIssues[error] || 0) + 1;
      }
    }

    const sortedIssues = Object.entries(commonIssues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    output += 'Most Common Issues:\n';
    for (const [issue, count] of sortedIssues) {
      output += `• ${issue} (${count} items)\n`;
    }

    output += '\nRecommended Actions:\n';
    output += '1. Review failed items and update missing fields\n';
    output += '2. Ensure all work items have proper assignees\n';
    output += '3. Add detailed descriptions and acceptance criteria\n';
    output += '4. Set appropriate priorities and remaining work estimates\n';
    output += '5. Schedule regular validation checks\n';

    return output;
  }

  /**
   * Format quick actions
   */
  formatQuickActions() {
    let output = '\n⚡ Quick Actions\n';
    output += '===============\n';
    output += '• View item details: /azure:task-show <id>\n';
    output += '• Update work item: /azure:task-edit <id>\n';
    output += '• Bulk update: /azure:bulk-update\n';
    output += '• Run validation again: /azure:validate\n';
    output += '• Generate detailed report: /azure:validate --verbose\n';

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
    .option('sprint', {
      alias: 's',
      describe: 'Filter by sprint (current or sprint name)',
      type: 'string'
    })
    .option('fix', {
      alias: 'f',
      describe: 'Show fix suggestions',
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
      describe: 'Silent mode',
      type: 'boolean',
      default: false
    })
    .help()
    .argv;

  const validate = new AzureValidate({
    projectPath: argv.path,
    sprintFilter: argv.sprint,
    fixMode: argv.fix,
    verbose: argv.verbose,
    silent: argv.silent
  });

  validate.run()
    .then((result) => {
      if (!result.success) {
        console.error('Azure work item validation failed:', result.error);
        process.exit(1);
      }
      // Exit with code 1 if validation found errors
      if (result.validation && result.validation.failed > 0) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Azure work item validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = AzureValidate;