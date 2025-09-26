#!/usr/bin/env node

/**
 * Azure DevOps Feature List
 * Lists all features in the current project
 */

const AzureDevOpsClient = require('../../lib/azure/client');
const AzureFormatter = require('../../lib/azure/formatter');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

class AzureFeatureList {
  constructor(options = {}) {
    this.silent = options.silent || false;
    this.format = options.format || 'table'; // table, json, csv
    this.includeChildren = options.includeChildren !== false;
    this.stateFilter = options.state || null;

    try {
      // Load environment variables from .env file if it exists
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
      }

      // Also check .claude/.env
      const claudeEnvPath = path.join(process.cwd(), '.claude', '.env');
      if (fs.existsSync(claudeEnvPath)) {
        require('dotenv').config({ path: claudeEnvPath });
      }

      this.client = new AzureDevOpsClient(options);
    } catch (error) {
      this.handleInitError(error);
    }
  }

  handleInitError(error) {
    if (error.message.includes('Missing required environment variables')) {
      console.error(chalk.red('\n❌ Azure DevOps configuration missing!\n'));
      console.error('Please set the following environment variables:');
      console.error('  - AZURE_DEVOPS_ORG: Your Azure DevOps organization');
      console.error('  - AZURE_DEVOPS_PROJECT: Your project name');
      console.error('  - AZURE_DEVOPS_PAT: Your Personal Access Token\n');
      console.error('You can set these in .env or .claude/.env file\n');
      process.exit(1);
    }
    throw error;
  }

  async listFeatures() {
    try {
      const query = this.buildQuery();
      const result = await this.client.executeWiql(query);

      if (!result || !result.workItems || result.workItems.length === 0) {
        if (!this.silent) {
          console.log(chalk.yellow('\nNo features found in the project.\n'));
        }
        return [];
      }

      const ids = result.workItems.map(item => item.id);
      const features = await this.client.getWorkItems(ids);

      if (!this.silent) {
        this.displayFeatures(features);
      }

      return features;
    } catch (error) {
      console.error(AzureFormatter.formatError(error));
      process.exit(1);
    }
  }

  buildQuery() {
    let query = `
      SELECT [System.Id], [System.Title], [System.State],
             [System.WorkItemType], [System.AssignedTo],
             [System.Tags], [System.IterationPath],
             [Microsoft.VSTS.Common.Priority]
      FROM workitems
      WHERE [System.WorkItemType] = 'Feature'
    `;

    if (this.stateFilter) {
      query += ` AND [System.State] = '${this.stateFilter}'`;
    }

    query += ` ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.CreatedDate] DESC`;

    return query;
  }

  displayFeatures(features) {
    switch (this.format) {
      case 'json':
        console.log(JSON.stringify(features, null, 2));
        break;
      case 'csv':
        this.displayCSV(features);
        break;
      default:
        this.displayTable(features);
    }
  }

  displayTable(features) {
    console.log(chalk.cyan.bold('\n🎯 Features in Project\n'));

    const formatted = AzureFormatter.formatWorkItems(features, {
      showPriority: true,
      showRemaining: false
    });

    console.log(formatted);
    console.log(AzureFormatter.formatSummary(features));

    if (this.includeChildren) {
      this.displayProgress(features);
    }
  }

  displayCSV(features) {
    const headers = ['ID', 'Title', 'State', 'Assigned To', 'Priority'];
    console.log(headers.join(','));

    features.forEach(feature => {
      const fields = feature.fields || {};
      const row = [
        feature.id,
        `"${fields['System.Title']}"`,
        fields['System.State'],
        fields['System.AssignedTo']?.displayName || 'Unassigned',
        fields['Microsoft.VSTS.Common.Priority'] || ''
      ];
      console.log(row.join(','));
    });
  }

  async displayProgress(features) {
    console.log(chalk.cyan.bold('\n📈 Feature Progress:\n'));

    for (const feature of features) {
      const progress = await this.getFeatureProgress(feature.id);
      const fields = feature.fields || {};
      const title = fields['System.Title'];
      const state = fields['System.State'];

      console.log(`${chalk.bold(title)}`);
      console.log(`  State: ${AzureFormatter.getStateColor(state)}`);
      console.log(`  Progress: ${this.formatProgress(progress)}`);
      console.log('');
    }
  }

  async getFeatureProgress(featureId) {
    try {
      const query = `
        SELECT [System.Id], [System.State], [System.WorkItemType]
        FROM workitemLinks
        WHERE (
          [Source].[System.Id] = ${featureId}
        ) AND (
          [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
        ) AND (
          [Target].[System.WorkItemType] IN ('User Story', 'Task', 'Bug')
        )
        MODE (Recursive)
      `;

      const result = await this.client.executeWiql(query);
      if (!result || !result.workItemRelations) {
        return { total: 0, completed: 0, percentage: 0 };
      }

      const children = result.workItemRelations.filter(r => r.target);
      const total = children.length;
      const completed = children.filter(r => {
        const state = r.target?.fields?.['System.State'];
        return state === 'Done' || state === 'Closed' || state === 'Resolved';
      }).length;

      return {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    } catch (error) {
      // If we can't get progress, return empty
      return { total: 0, completed: 0, percentage: 0 };
    }
  }

  formatProgress(progress) {
    const { total, completed, percentage } = progress;
    if (total === 0) return chalk.gray('No child items');

    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;

    const bar = chalk.green('█').repeat(filled) + chalk.gray('░').repeat(empty);

    return `${bar} ${percentage}% (${completed}/${total})`;
  }

  static parseArguments(args = process.argv) {
    const options = {};

    args.forEach((arg, index) => {
      if (arg === '--state' && args[index + 1]) {
        options.state = args[index + 1];
      } else if (arg === '--format' && args[index + 1]) {
        options.format = args[index + 1];
      } else if (arg === '--no-children') {
        options.includeChildren = false;
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
  const options = AzureFeatureList.parseArguments();
  const featureList = new AzureFeatureList(options);

  featureList.listFeatures()
    .then(() => {
      if (featureList.client) {
        const stats = featureList.client.getCacheStats();
        if (!options.silent && process.env.DEBUG) {
          console.log(chalk.dim(`\nCache stats: ${JSON.stringify(stats)}`));
        }
      }
    })
    .catch(error => {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    });
}

module.exports = AzureFeatureList;