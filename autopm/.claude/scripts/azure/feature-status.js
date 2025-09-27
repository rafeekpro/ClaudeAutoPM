#!/usr/bin/env node

/**
 * Azure DevOps Feature Status
 * Shows the status of all features with progress tracking
 * Full implementation with TDD approach
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const dotenv = require('dotenv');
const AzureDevOpsClient = require('../../lib/azure/client');

class AzureFeatureStatus {
  constructor(options = {}) {
    this.options = options;
    this.projectPath = options.projectPath || process.cwd();
    this.silent = options.silent || false;
    this.format = options.format || 'table';
    this.filters = {
      state: options.state,
      iteration: options.iteration,
      area: options.area,
      unassigned: options.unassigned || false,
      atRisk: options.atRisk || false
    };
    this.sortBy = options.sortBy || 'targetDate';

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

  formatDate(dateStr) {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatUser(userField) {
    if (!userField) return 'Unassigned';
    if (typeof userField === 'string') return userField;
    return userField.displayName || userField.uniqueName || 'Unknown';
  }

  calculateDaysRemaining(targetDate) {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  assessRisk(feature, progress) {
    const risks = [];

    // Check target date
    const daysRemaining = this.calculateDaysRemaining(feature.fields['Microsoft.VSTS.Scheduling.TargetDate']);
    if (daysRemaining !== null) {
      if (daysRemaining < 0) {
        risks.push('Overdue');
      } else if (daysRemaining < 7 && progress < 80) {
        risks.push('At risk');
      }
    }

    // Check progress
    if (feature.fields['System.State'] === 'Active' && progress === 0) {
      risks.push('No progress');
    }

    // Check assignment
    if (!feature.fields['System.AssignedTo']) {
      risks.push('Unassigned');
    }

    // Check decomposition
    if (!feature.childCount || feature.childCount === 0) {
      risks.push('Not decomposed');
    }

    return risks;
  }

  async getFeatureProgress(featureId) {
    try {
      // Get linked user stories
      const wiql = `
        SELECT [System.Id]
        FROM WorkItemLinks
        WHERE [Source].[System.Id] = ${featureId}
          AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
          AND [Target].[System.WorkItemType] = 'User Story'
        MODE (Recursive)
      `;

      const result = await this.client.queryWorkItems(wiql);

      if (!result || !result.workItemRelations) {
        return { completed: 0, total: 0, percentage: 0 };
      }

      const storyIds = result.workItemRelations
        .filter(r => r.target)
        .map(r => r.target.id);

      if (storyIds.length === 0) {
        return { completed: 0, total: 0, percentage: 0 };
      }

      // Get story details
      const stories = await Promise.all(
        storyIds.map(id => this.client.getWorkItem(id))
      );

      const total = stories.length;
      const completed = stories.filter(s =>
        s.fields['System.State'] === 'Done' ||
        s.fields['System.State'] === 'Closed'
      ).length;

      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completed, total, percentage, childCount: total };
    } catch (error) {
      return { completed: 0, total: 0, percentage: 0, childCount: 0 };
    }
  }

  async getAllFeatures() {
    // Build WIQL query with filters
    let conditions = ["[System.WorkItemType] = 'Feature'"];

    if (this.filters.state) {
      conditions.push(`[System.State] = '${this.filters.state}'`);
    }

    if (this.filters.iteration) {
      conditions.push(`[System.IterationPath] UNDER '${this.filters.iteration}'`);
    }

    if (this.filters.area) {
      conditions.push(`[System.AreaPath] UNDER '${this.filters.area}'`);
    }

    if (this.filters.unassigned) {
      conditions.push("[System.AssignedTo] = ''");
    }

    const wiql = `
      SELECT [System.Id], [System.Title], [System.State],
             [System.AssignedTo], [Microsoft.VSTS.Scheduling.TargetDate],
             [System.IterationPath], [System.AreaPath],
             [Microsoft.VSTS.Common.BusinessValue]
      FROM WorkItems
      WHERE ${conditions.join(' AND ')}
      ORDER BY [Microsoft.VSTS.Scheduling.TargetDate] ASC
    `;

    const result = await this.client.queryWorkItems(wiql);

    if (!result || !result.workItems || result.workItems.length === 0) {
      return [];
    }

    // Get full work item details
    const features = await Promise.all(
      result.workItems.map(wi => this.client.getWorkItem(wi.id))
    );

    // Get progress for each feature
    const featuresWithProgress = await Promise.all(
      features.map(async (feature) => {
        const progress = await this.getFeatureProgress(feature.id);
        return {
          ...feature,
          progress: progress.percentage,
          childCount: progress.childCount,
          completedCount: progress.completed,
          totalCount: progress.total
        };
      })
    );

    // Filter by risk if needed
    if (this.filters.atRisk) {
      return featuresWithProgress.filter(f => {
        const risks = this.assessRisk(f, f.progress);
        return risks.length > 0;
      });
    }

    return featuresWithProgress;
  }

  sortFeatures(features) {
    return features.sort((a, b) => {
      switch (this.sortBy) {
        case 'progress':
          return b.progress - a.progress;

        case 'state':
          const stateOrder = { 'Done': 0, 'Active': 1, 'New': 2, 'Proposed': 3 };
          const aOrder = stateOrder[a.fields['System.State']] || 999;
          const bOrder = stateOrder[b.fields['System.State']] || 999;
          return aOrder - bOrder;

        case 'assignee':
          const aAssignee = this.formatUser(a.fields['System.AssignedTo']);
          const bAssignee = this.formatUser(b.fields['System.AssignedTo']);
          return aAssignee.localeCompare(bAssignee);

        case 'targetDate':
        default:
          const aDate = a.fields['Microsoft.VSTS.Scheduling.TargetDate'] || '9999-12-31';
          const bDate = b.fields['Microsoft.VSTS.Scheduling.TargetDate'] || '9999-12-31';
          return new Date(aDate) - new Date(bDate);
      }
    });
  }

  renderProgressBar(percentage, width = 20) {
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    let color;
    if (percentage >= 80) color = this.colors.green;
    else if (percentage >= 50) color = this.colors.yellow;
    else color = this.colors.red;

    return color(bar);
  }

  displayTableFormat(features) {
    console.log('\n' + this.colors.bold('Feature Status Report'));
    console.log('=' + '='.repeat(100));

    if (features.length === 0) {
      console.log(this.colors.yellow('No features found matching the criteria.'));
      return;
    }

    // Header
    console.log(
      this.colors.bold('ID'.padEnd(8)) +
      this.colors.bold('Title'.padEnd(40)) +
      this.colors.bold('State'.padEnd(12)) +
      this.colors.bold('Progress'.padEnd(25)) +
      this.colors.bold('Target'.padEnd(12)) +
      this.colors.bold('Owner')
    );
    console.log('-'.repeat(100));

    // Features
    features.forEach(feature => {
      const id = feature.id.toString();
      const title = feature.fields['System.Title'].substring(0, 38);
      const state = feature.fields['System.State'];
      const targetDate = this.formatDate(feature.fields['Microsoft.VSTS.Scheduling.TargetDate']);
      const owner = this.formatUser(feature.fields['System.AssignedTo']).substring(0, 20);
      const progressBar = this.renderProgressBar(feature.progress);
      const progressText = `${feature.completedCount}/${feature.totalCount}`;

      // State color
      let stateColor;
      switch(state) {
        case 'Done':
        case 'Closed':
          stateColor = this.colors.green;
          break;
        case 'Active':
        case 'In Progress':
          stateColor = this.colors.blue;
          break;
        default:
          stateColor = this.colors.gray;
      }

      // Risk indicators
      const risks = this.assessRisk(feature, feature.progress);
      const riskIndicator = risks.length > 0 ? this.colors.red(' ⚠') : '';

      console.log(
        id.padEnd(8) +
        title.padEnd(40) +
        stateColor(state.padEnd(12)) +
        (progressBar + ' ' + progressText).padEnd(25) +
        targetDate.padEnd(12) +
        owner +
        riskIndicator
      );

      // Show risks if any
      if (risks.length > 0 && this.options.verbose) {
        console.log('  ' + this.colors.red('Risks: ' + risks.join(', ')));
      }
    });

    // Summary
    console.log('-'.repeat(100));
    const total = features.length;
    const completed = features.filter(f => f.fields['System.State'] === 'Done').length;
    const active = features.filter(f => f.fields['System.State'] === 'Active').length;
    const atRisk = features.filter(f => this.assessRisk(f, f.progress).length > 0).length;

    console.log(
      `Total: ${total} | ` +
      this.colors.green(`Completed: ${completed}`) + ' | ' +
      this.colors.blue(`Active: ${active}`) + ' | ' +
      this.colors.red(`At Risk: ${atRisk}`)
    );
  }

  displayJsonFormat(features) {
    const output = features.map(f => ({
      id: f.id,
      title: f.fields['System.Title'],
      state: f.fields['System.State'],
      progress: f.progress,
      completedStories: f.completedCount,
      totalStories: f.totalCount,
      targetDate: f.fields['Microsoft.VSTS.Scheduling.TargetDate'],
      owner: this.formatUser(f.fields['System.AssignedTo']),
      risks: this.assessRisk(f, f.progress)
    }));

    console.log(JSON.stringify(output, null, 2));
  }

  displaySummaryFormat(features) {
    console.log('\n' + this.colors.bold('Executive Summary'));
    console.log('=' + '='.repeat(60));

    const total = features.length;
    const byState = {};
    const atRiskFeatures = [];

    features.forEach(f => {
      const state = f.fields['System.State'];
      byState[state] = (byState[state] || 0) + 1;

      const risks = this.assessRisk(f, f.progress);
      if (risks.length > 0) {
        atRiskFeatures.push({
          id: f.id,
          title: f.fields['System.Title'],
          risks: risks
        });
      }
    });

    // Overall stats
    console.log(this.colors.bold('\nOverall Statistics:'));
    console.log(`  Total Features: ${total}`);

    Object.entries(byState).forEach(([state, count]) => {
      const percentage = Math.round((count / total) * 100);
      let color;
      switch(state) {
        case 'Done':
        case 'Closed':
          color = this.colors.green;
          break;
        case 'Active':
        case 'In Progress':
          color = this.colors.blue;
          break;
        default:
          color = this.colors.gray;
      }
      console.log(`  ${color(state)}: ${count} (${percentage}%)`);
    });

    // Average progress
    const avgProgress = Math.round(
      features.reduce((sum, f) => sum + f.progress, 0) / total
    );
    console.log(`\n  Average Progress: ${avgProgress}%`);
    console.log(`  Progress Bar: ${this.renderProgressBar(avgProgress, 30)}`);

    // At-risk features
    if (atRiskFeatures.length > 0) {
      console.log(this.colors.bold('\n⚠ Features at Risk:'));
      atRiskFeatures.forEach(f => {
        console.log(this.colors.red(`  • #${f.id}: ${f.title}`));
        console.log(this.colors.dim(`    Risks: ${f.risks.join(', ')}`));
      });
    } else {
      console.log(this.colors.green('\n✓ No features at risk'));
    }

    // Upcoming deadlines
    const upcoming = features
      .filter(f => {
        const days = this.calculateDaysRemaining(f.fields['Microsoft.VSTS.Scheduling.TargetDate']);
        return days !== null && days > 0 && days <= 14;
      })
      .sort((a, b) => {
        const aDays = this.calculateDaysRemaining(a.fields['Microsoft.VSTS.Scheduling.TargetDate']);
        const bDays = this.calculateDaysRemaining(b.fields['Microsoft.VSTS.Scheduling.TargetDate']);
        return aDays - bDays;
      });

    if (upcoming.length > 0) {
      console.log(this.colors.bold('\n📅 Upcoming Deadlines (next 2 weeks):'));
      upcoming.forEach(f => {
        const days = this.calculateDaysRemaining(f.fields['Microsoft.VSTS.Scheduling.TargetDate']);
        const color = days <= 7 ? this.colors.yellow : this.colors.cyan;
        console.log(color(`  • ${f.fields['System.Title']} - ${days} days remaining`));
      });
    }

    console.log('\n' + '='.repeat(61));
  }

  async showStatus() {
    try {
      await this.initializeClient();

      // Get all features
      const features = await this.getAllFeatures();

      // Sort features
      const sortedFeatures = this.sortFeatures(features);

      // Display in requested format
      switch (this.format) {
        case 'json':
          this.displayJsonFormat(sortedFeatures);
          break;
        case 'summary':
          this.displaySummaryFormat(sortedFeatures);
          break;
        case 'table':
        default:
          this.displayTableFormat(sortedFeatures);
          break;
      }

    } catch (error) {
      if (error.message.includes('not configured')) {
        console.error(this.colors.red(`Configuration Error: ${error.message}`));
      } else {
        console.error(this.colors.red('Error fetching feature status:'), error.message);
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
  const options = {
    verbose: false,
    silent: false,
    projectPath: process.cwd()
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: azure-feature-status [options]');
      console.log('\nShow status of all features with progress tracking');
      console.log('\nOptions:');
      console.log('  -h, --help              Show this help message');
      console.log('  -v, --verbose           Show detailed information');
      console.log('  -s, --silent            Suppress color output');
      console.log('  --state <state>         Filter by state (New, Active, Done)');
      console.log('  --iteration <path>      Filter by iteration path');
      console.log('  --area <path>           Filter by area path');
      console.log('  --unassigned            Show only unassigned features');
      console.log('  --at-risk               Show only at-risk features');
      console.log('  --sort <field>          Sort by: targetDate, progress, state, assignee');
      console.log('  --json                  Output in JSON format');
      console.log('  --summary               Show executive summary');
      console.log('  --path <path>           Project path (default: current directory)');
      console.log('\nExamples:');
      console.log('  azure-feature-status');
      console.log('  azure-feature-status --state Active');
      console.log('  azure-feature-status --at-risk --verbose');
      console.log('  azure-feature-status --summary');
      process.exit(0);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else if (arg === '--json') {
      options.format = 'json';
    } else if (arg === '--summary') {
      options.format = 'summary';
    } else if (arg === '--state' && i + 1 < args.length) {
      options.state = args[++i];
    } else if (arg === '--iteration' && i + 1 < args.length) {
      options.iteration = args[++i];
    } else if (arg === '--area' && i + 1 < args.length) {
      options.area = args[++i];
    } else if (arg === '--unassigned') {
      options.unassigned = true;
    } else if (arg === '--at-risk') {
      options.atRisk = true;
    } else if (arg === '--sort' && i + 1 < args.length) {
      options.sortBy = args[++i];
    } else if (arg === '--path' && i + 1 < args.length) {
      options.projectPath = args[++i];
    }
  }

  const featureStatus = new AzureFeatureStatus(options);
  await featureStatus.showStatus();
}

// Export for testing
module.exports = AzureFeatureStatus;

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}