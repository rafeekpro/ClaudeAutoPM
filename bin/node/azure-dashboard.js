#!/usr/bin/env node

/**
 * Azure DevOps Dashboard Script
 * Migrated from autopm/.claude/scripts/azure/dashboard.sh to Node.js
 *
 * Features:
 * - Comprehensive Azure DevOps project status overview
 * - Current sprint information with progress visualization
 * - Work items overview by state with color coding
 * - Sprint burndown analysis with story points and velocity
 * - Team activity analysis for recent contributions
 * - Alert system for blocked, high priority, and stale items
 * - Recent completions showcase
 * - Quick actions menu for common operations
 * - Cross-platform compatibility
 */

const path = require('path');
const fs = require('fs-extra');
const https = require('https');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

class AzureDashboard {
  constructor(options = {}) {
    // Set options
    this.options = {
      projectPath: options.projectPath || process.cwd(),
      verbose: options.verbose || false,
      silent: options.silent || false
    };

    // Set paths
    this.envPath = path.join(this.options.projectPath, '.claude', '.env');

    // Azure DevOps credentials
    this.credentials = {};

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

    // Cache for API responses to avoid repeated calls
    this.apiCache = new Map();
  }

  /**
   * Main dashboard generation process
   */
  async run() {
    try {
      const timestamp = new Date().toISOString();

      if (!this.options.silent) {
        this.log('📊 Azure DevOps Project Dashboard');
        this.log('=================================');
        this.log(`Generated: ${new Date().toLocaleString()}`);
        this.log('');
      }

      // Load environment variables
      await this.loadEnvironment();

      // Gather all dashboard data
      const dashboardData = {
        timestamp,
        sprintInfo: await this.getCurrentSprintInfo(),
        workItemsOverview: await this.getWorkItemsOverview(),
        sprintBurndown: null,
        teamActivity: await this.getTeamActivity(),
        alerts: await this.generateAlerts(),
        recentCompletions: await this.getRecentCompletions(),
        quickActions: this.getQuickActions()
      };

      // Get sprint burndown if we have an active sprint
      if (dashboardData.sprintInfo) {
        dashboardData.sprintBurndown = await this.getSprintBurndown(dashboardData.sprintInfo.path);
      }

      // Display dashboard sections
      if (!this.options.silent) {
        await this.displaySprintInformation(dashboardData.sprintInfo);
        await this.displayWorkItemsOverview(dashboardData.workItemsOverview);
        if (dashboardData.sprintBurndown) {
          await this.displaySprintBurndown(dashboardData.sprintBurndown);
        }
        await this.displayTeamActivity(dashboardData.teamActivity);
        await this.displayAlerts(dashboardData.alerts);
        await this.displayRecentCompletions(dashboardData.recentCompletions);
        await this.displayQuickActions(dashboardData.quickActions);
      }

      return {
        success: true,
        data: dashboardData
      };

    } catch (error) {
      this.logError('Dashboard generation failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load Azure DevOps credentials from .env file
   */
  async loadEnvironment() {
    try {
      if (!(await fs.pathExists(this.envPath))) {
        throw new Error('Azure DevOps credentials not configured. Please run: /azure:init');
      }

      const content = await fs.readFile(this.envPath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (key && value) {
            this.credentials[key] = value;
          }
        }
      }

      // Validate required credentials
      const required = ['AZURE_DEVOPS_PAT', 'AZURE_DEVOPS_ORG', 'AZURE_DEVOPS_PROJECT'];
      for (const key of required) {
        if (!this.credentials[key]) {
          throw new Error(`Azure DevOps credentials not configured. Missing: ${key}`);
        }
      }

    } catch (error) {
      throw new Error(`Failed to load credentials: ${error.message}`);
    }
  }

  /**
   * Get current sprint information
   */
  async getCurrentSprintInfo() {
    try {
      const response = await this.callAzureAPI('work/teamsettings/iterations?$timeframe=current');

      if (response.value && response.value.length > 0) {
        const sprint = response.value[0];
        return {
          name: sprint.path.split('\\').pop(),
          path: sprint.path,
          startDate: sprint.attributes?.startDate,
          endDate: sprint.attributes?.finishDate
        };
      }

      return null;
    } catch (error) {
      if (!this.options.silent) {
        this.logError('Failed to get sprint information', error);
      }
      return null;
    }
  }

  /**
   * Calculate sprint progress percentage
   */
  calculateSprintProgress(sprintInfo) {
    if (!sprintInfo || !sprintInfo.startDate || !sprintInfo.endDate) {
      return 0;
    }

    const now = new Date();
    const start = new Date(sprintInfo.startDate);
    const end = new Date(sprintInfo.endDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    return Math.round((elapsed / total) * 100);
  }

  /**
   * Generate progress bar visualization
   */
  generateProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Get work items overview by state
   */
  async getWorkItemsOverview() {
    const states = [
      { name: 'New', icon: '🆕', color: '' },
      { name: 'Active', icon: '🔄', color: 'yellow' },
      { name: 'In Progress', icon: '🔄', color: 'yellow' },
      { name: 'Resolved', icon: '✅', color: 'green' },
      { name: 'Done', icon: '✅', color: 'green' },
      { name: 'Closed', icon: '🔒', color: '' }
    ];

    const overview = [];

    for (const state of states) {
      try {
        const query = `SELECT [System.Id] FROM workitems WHERE [System.State] = '${state.name}'`;
        const response = await this.queryWorkItems(query);
        const count = response.workItems ? response.workItems.length : 0;

        if (count > 0) {
          overview.push({
            state: state.name,
            count,
            icon: state.icon,
            color: state.color
          });
        }
      } catch (error) {
        // Continue with other states if one fails
        if (this.options.verbose) {
          this.logError(`Failed to get ${state.name} items`, error);
        }
      }
    }

    return overview;
  }

  /**
   * Get sprint burndown analysis
   */
  async getSprintBurndown(sprintPath) {
    try {
      const query = `SELECT [System.Id], [System.WorkItemType], [System.State],
                     [Microsoft.VSTS.Scheduling.StoryPoints],
                     [Microsoft.VSTS.Scheduling.RemainingWork]
                     FROM workitems
                     WHERE [System.IterationPath] = '${sprintPath}'
                     AND [System.WorkItemType] IN ('User Story', 'Task')`;

      const response = await this.queryWorkItems(query);
      const workItems = response.workItems || [];

      let totalStories = 0;
      let completedStories = 0;
      let totalPoints = 0;
      let completedPoints = 0;
      let remainingHours = 0;

      for (const workItemRef of workItems) {
        try {
          const item = await this.callAzureAPI(`wit/workitems/${workItemRef.id}`);
          const type = item.fields['System.WorkItemType'];
          const state = item.fields['System.State'];

          if (type === 'User Story') {
            const points = parseInt(item.fields['Microsoft.VSTS.Scheduling.StoryPoints']) || 0;
            totalStories++;
            totalPoints += points;

            if (state === 'Done' || state === 'Closed') {
              completedStories++;
              completedPoints += points;
            }
          } else if (type === 'Task') {
            const remaining = parseInt(item.fields['Microsoft.VSTS.Scheduling.RemainingWork']) || 0;
            remainingHours += remaining;
          }
        } catch (error) {
          // Continue with other items if one fails
          if (this.options.verbose) {
            this.logError(`Failed to get work item ${workItemRef.id}`, error);
          }
        }
      }

      return {
        totalStories,
        completedStories,
        totalPoints,
        completedPoints,
        remainingHours
      };

    } catch (error) {
      if (!this.options.silent) {
        this.logError('Failed to get sprint burndown', error);
      }
      return null;
    }
  }

  /**
   * Get team activity for last 7 days
   */
  async getTeamActivity() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const dateStr = weekAgo.toISOString().split('T')[0];

      const query = `SELECT [System.Id], [System.AssignedTo], [System.ChangedDate]
                     FROM workitems
                     WHERE [System.ChangedDate] >= '${dateStr}'`;

      const response = await this.queryWorkItems(query);
      const workItems = response.workItems || [];

      const userActivity = {};

      for (const workItemRef of workItems) {
        try {
          const item = await this.callAzureAPI(`wit/workitems/${workItemRef.id}`);
          const assignedTo = item.fields['System.AssignedTo'];

          if (assignedTo && assignedTo.displayName) {
            const user = assignedTo.displayName;
            userActivity[user] = (userActivity[user] || 0) + 1;
          }
        } catch (error) {
          // Continue with other items
          if (this.options.verbose) {
            this.logError(`Failed to get work item ${workItemRef.id}`, error);
          }
        }
      }

      // Convert to array and sort by activity
      return Object.entries(userActivity)
        .map(([user, count]) => ({ user, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 contributors

    } catch (error) {
      if (!this.options.silent) {
        this.logError('Failed to get team activity', error);
      }
      return [];
    }
  }

  /**
   * Get blocked items count
   */
  async getBlockedItems() {
    try {
      const query = `SELECT [System.Id] FROM workitems
                     WHERE [System.Tags] CONTAINS 'blocked'
                     AND [System.State] != 'Closed'`;
      const response = await this.queryWorkItems(query);
      return response.workItems ? response.workItems.length : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get high priority items count
   */
  async getHighPriorityItems() {
    try {
      const query = `SELECT [System.Id] FROM workitems
                     WHERE [Microsoft.VSTS.Common.Priority] = 1
                     AND [System.State] IN ('New', 'Active')`;
      const response = await this.queryWorkItems(query);
      return response.workItems ? response.workItems.length : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get stale items count (unchanged for 14+ days)
   */
  async getStaleItems() {
    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const dateStr = twoWeeksAgo.toISOString().split('T')[0];

      const query = `SELECT [System.Id] FROM workitems
                     WHERE [System.State] = 'Active'
                     AND [System.ChangedDate] < '${dateStr}'`;
      const response = await this.queryWorkItems(query);
      return response.workItems ? response.workItems.length : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Generate alerts for various issues
   */
  async generateAlerts() {
    const alerts = [];

    try {
      const [blockedCount, highPriorityCount, staleCount] = await Promise.all([
        this.getBlockedItems(),
        this.getHighPriorityItems(),
        this.getStaleItems()
      ]);

      if (blockedCount > 0) {
        alerts.push({
          type: 'blocked',
          count: blockedCount,
          message: `${blockedCount} items blocked`,
          level: 'error'
        });
      } else {
        alerts.push({
          type: 'blocked',
          count: 0,
          message: 'No blocked items',
          level: 'info'
        });
      }

      if (highPriorityCount > 0) {
        alerts.push({
          type: 'high_priority',
          count: highPriorityCount,
          message: `${highPriorityCount} high priority items`,
          level: 'warning'
        });
      }

      if (staleCount > 0) {
        alerts.push({
          type: 'stale',
          count: staleCount,
          message: `${staleCount} stale items (>14 days)`,
          level: 'warning'
        });
      }
    } catch (error) {
      alerts.push({
        type: 'error',
        count: 0,
        message: 'Failed to check for alerts',
        level: 'error'
      });
    }

    return alerts;
  }

  /**
   * Get recent completions (last 3 days)
   */
  async getRecentCompletions() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateStr = threeDaysAgo.toISOString().split('T')[0];

      const query = `SELECT [System.Id], [System.Title], [System.WorkItemType]
                     FROM workitems
                     WHERE [System.State] IN ('Done', 'Closed')
                     AND [System.ChangedDate] >= '${dateStr}'
                     ORDER BY [System.ChangedDate] DESC`;

      const response = await this.queryWorkItems(query);
      const workItems = response.workItems || [];

      const completions = [];

      for (const workItemRef of workItems.slice(0, 5)) { // Limit to 5 items
        try {
          const item = await this.callAzureAPI(`wit/workitems/${workItemRef.id}`);
          const title = item.fields['System.Title'] || 'Untitled';
          const type = item.fields['System.WorkItemType'];

          let icon = '📄';
          switch (type) {
            case 'User Story': icon = '📖'; break;
            case 'Task': icon = '📋'; break;
            case 'Bug': icon = '🐛'; break;
            case 'Feature': icon = '🎯'; break;
          }

          completions.push({
            id: item.id,
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            type,
            icon
          });
        } catch (error) {
          // Continue with other items
          if (this.options.verbose) {
            this.logError(`Failed to get completion ${workItemRef.id}`, error);
          }
        }
      }

      return completions;

    } catch (error) {
      if (!this.options.silent) {
        this.logError('Failed to get recent completions', error);
      }
      return [];
    }
  }

  /**
   * Get quick actions menu
   */
  getQuickActions() {
    return [
      { number: 1, description: 'Daily standup', command: '/azure:standup' },
      { number: 2, description: 'Get next task', command: '/azure:next-task' },
      { number: 3, description: 'View active work', command: '/azure:active-work' },
      { number: 4, description: 'Check blockers', command: '/azure:blocked-items' },
      { number: 5, description: 'Sprint details', command: '/azure:sprint-status' },
      { number: 6, description: 'Search items', command: '/azure:search' }
    ];
  }

  /**
   * Display sprint information section
   */
  async displaySprintInformation(sprintInfo) {
    this.log(`${this.colors.cyan}🏃 Sprint Information${this.colors.reset}`);
    this.log('--------------------');

    if (sprintInfo) {
      this.log(`Current Sprint: ${sprintInfo.name}`);

      if (sprintInfo.startDate && sprintInfo.endDate) {
        const startDate = new Date(sprintInfo.startDate).toISOString().split('T')[0];
        const endDate = new Date(sprintInfo.endDate).toISOString().split('T')[0];
        this.log(`Period: ${startDate} to ${endDate}`);

        const progress = this.calculateSprintProgress(sprintInfo);
        const progressBar = this.generateProgressBar(progress, 20);
        this.log(`Progress: ${progressBar} ${progress}%`);
      }
    } else {
      this.log('No active sprint');
    }

    this.log('');
  }

  /**
   * Display work items overview section
   */
  async displayWorkItemsOverview(workItemsOverview) {
    this.log(`${this.colors.blue}📋 Work Items Overview${this.colors.reset}`);
    this.log('---------------------');

    if (workItemsOverview.length === 0) {
      this.log('No work items found');
    } else {
      for (const item of workItemsOverview) {
        let colorCode = '';
        switch (item.color) {
          case 'green': colorCode = this.colors.green; break;
          case 'yellow': colorCode = this.colors.yellow; break;
          case 'red': colorCode = this.colors.red; break;
        }

        this.log(`  ${item.icon} ${colorCode}${item.state}: ${item.count}${this.colors.reset}`);
      }
    }

    this.log('');
  }

  /**
   * Display sprint burndown section
   */
  async displaySprintBurndown(burndown) {
    this.log(`${this.colors.green}📉 Sprint Burndown${this.colors.reset}`);
    this.log('-----------------');

    this.log(`Stories: ${burndown.completedStories}/${burndown.totalStories} completed`);
    this.log(`Points: ${burndown.completedPoints}/${burndown.totalPoints} completed`);
    this.log(`Remaining Work: ${burndown.remainingHours}h`);

    if (burndown.totalPoints > 0) {
      const velocity = Math.round((burndown.completedPoints / burndown.totalPoints) * 100);
      this.log(`Velocity: ${velocity}%`);
    }

    this.log('');
  }

  /**
   * Display team activity section
   */
  async displayTeamActivity(teamActivity) {
    this.log(`${this.colors.cyan}👥 Team Activity (Last 7 days)${this.colors.reset}`);
    this.log('------------------------------');

    if (teamActivity.length === 0) {
      this.log('No recent activity');
    } else {
      for (const activity of teamActivity) {
        const userName = activity.user.length > 20 ? activity.user.substring(0, 20) : activity.user;
        this.log(`  ${userName.padEnd(20)}: ${activity.count} items`);
      }
    }

    this.log('');
  }

  /**
   * Display alerts section
   */
  async displayAlerts(alerts) {
    this.log(`${this.colors.red}⚠️ Alerts${this.colors.reset}`);
    this.log('---------');

    for (const alert of alerts) {
      let colorCode = '';
      let icon = '';

      switch (alert.level) {
        case 'error':
          colorCode = this.colors.red;
          icon = alert.type === 'blocked' && alert.count > 0 ? '🚧' : '❌';
          break;
        case 'warning':
          colorCode = this.colors.yellow;
          icon = alert.type === 'high_priority' ? '🔥' : '📅';
          break;
        case 'info':
          colorCode = this.colors.green;
          icon = '✅';
          break;
      }

      this.log(`${colorCode}${icon} ${alert.message}${this.colors.reset}`);
    }

    this.log('');
  }

  /**
   * Display recent completions section
   */
  async displayRecentCompletions(completions) {
    this.log(`${this.colors.green}✅ Recent Completions (Last 3 days)${this.colors.reset}`);
    this.log('-----------------------------------');

    if (completions.length === 0) {
      this.log('  No recent completions');
    } else {
      for (const completion of completions) {
        this.log(`  ${completion.icon} #${completion.id}: ${completion.title}`);
      }
    }

    this.log('');
  }

  /**
   * Display quick actions section
   */
  async displayQuickActions(quickActions) {
    this.log('🚀 Quick Actions');
    this.log('----------------');

    for (const action of quickActions) {
      this.log(`${action.number}. ${action.description.padEnd(20)} → ${action.command}`);
    }

    this.log('');
    this.log('Dashboard refresh: ./dashboard.sh');
  }

  /**
   * Query work items using WIQL
   */
  async queryWorkItems(query) {
    const cacheKey = `wiql:${query}`;
    if (this.apiCache.has(cacheKey)) {
      return this.apiCache.get(cacheKey);
    }

    const response = await this.callAzureAPI('wit/wiql', {
      method: 'POST',
      body: JSON.stringify({ query })
    });

    this.apiCache.set(cacheKey, response);
    return response;
  }

  /**
   * Make API call to Azure DevOps
   */
  async callAzureAPI(endpoint, options = {}) {
    const cacheKey = `api:${endpoint}:${JSON.stringify(options)}`;
    if (this.apiCache.has(cacheKey)) {
      return this.apiCache.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
      const { AZURE_DEVOPS_PAT, AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT } = this.credentials;

      const auth = Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64');
      const requestOptions = {
        hostname: 'dev.azure.com',
        port: 443,
        path: `/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0`,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': 'ClaudeAutoPM/1.0',
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: 10000 // 10 second timeout
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              this.apiCache.set(cacheKey, parsed);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`Invalid JSON response: ${error.message}`));
            }
          } else {
            reject(new Error(`API call failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Log message (respects silent mode)
   */
  log(message) {
    if (!this.options.silent) {
      console.log(message);
    }
  }

  /**
   * Log error message
   */
  logError(message, error) {
    if (!this.options.silent) {
      console.error(`${this.colors.red}❌ ${message}${this.colors.reset}`);
      if (this.options.verbose && error) {
        console.error(error);
      }
    }
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

  const dashboard = new AzureDashboard({
    projectPath: argv.path,
    verbose: argv.verbose,
    silent: argv.silent
  });

  dashboard.run()
    .then((result) => {
      if (!result.success) {
        console.error('Azure DevOps dashboard failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Azure DevOps dashboard failed:', error.message);
      process.exit(1);
    });
}

module.exports = AzureDashboard;