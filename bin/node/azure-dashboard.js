#!/usr/bin/env node

/**
 * Azure DevOps Dashboard
 * Provides a comprehensive dashboard view of project metrics and status
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

class AzureDashboard {
  constructor(options = {}) {
    this.silent = options.silent || false;
    this.format = options.format || 'table'; // table, json, html
    this.refresh = options.refresh || false;
    this.sections = options.sections || 'all'; // all, sprint, team, quality, velocity

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

  async generateDashboard() {
    try {
      if (!this.silent && this.format !== "json") {
        console.log(chalk.cyan.bold('\n📊 Project Dashboard\n'));
        console.log(chalk.yellow('Note: This is a stub implementation returning mock data\n'));
      }

      // Return mock dashboard data
      const mockDashboard = {
        project: {
          name: 'Sample Project',
          organization: 'Sample Org',
          lastUpdated: new Date().toISOString()
        },
        sprint: {
          name: 'Sprint 2024.1',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
          daysRemaining: 5,
          progress: {
            completed: 15,
            inProgress: 8,
            new: 5,
            total: 28,
            completionRate: '53.6%'
          },
          burndown: {
            ideal: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0],
            actual: [100, 95, 85, 78, 70, 65],
            trend: 'slightly behind'
          }
        },
        team: {
          members: 8,
          availability: '87.5%',
          workDistribution: {
            'John Doe': { tasks: 5, hours: 35 },
            'Jane Smith': { tasks: 4, hours: 28 },
            'Bob Johnson': { tasks: 3, hours: 24 },
            'Alice Brown': { tasks: 6, hours: 40 },
            'Others': { tasks: 10, hours: 73 }
          },
          velocity: {
            current: 45,
            average: 42,
            trend: 'increasing'
          }
        },
        quality: {
          bugs: {
            active: 12,
            resolved: 45,
            new: 3,
            criticalBugs: 2
          },
          codeMetrics: {
            coverage: '78%',
            technicalDebt: '3.2 days',
            codeSmells: 23
          },
          testResults: {
            passing: 234,
            failing: 5,
            skipped: 12,
            successRate: '93.6%'
          }
        },
        pipeline: {
          builds: {
            successful: 45,
            failed: 3,
            inProgress: 1,
            successRate: '93.8%'
          },
          deployments: {
            production: { lastDeploy: '2024-01-08', status: 'healthy' },
            staging: { lastDeploy: '2024-01-09', status: 'healthy' },
            development: { lastDeploy: '2024-01-10', status: 'building' }
          }
        },
        risks: [
          { level: 'high', description: 'Critical bug in authentication module' },
          { level: 'medium', description: 'Team capacity reduced next week' },
          { level: 'low', description: 'Minor UI inconsistencies reported' }
        ],
        achievements: [
          'Completed OAuth2 implementation',
          'Improved API response time by 40%',
          'Zero downtime in production this sprint'
        ]
      };

      if (!this.silent && this.format !== "json") {
        this.displayDashboard(mockDashboard);
      }

      return mockDashboard;
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  displayDashboard(data) {
    switch (this.format) {
      case 'json':
        console.log(JSON.stringify(data, null, 2));
        break;
      case 'html':
        this.displayHTML(data);
        break;
      default:
        this.displayTable(data);
    }
  }

  displayTable(data) {
    // Header
    console.log(chalk.cyan.bold('═'.repeat(60)));
    console.log(chalk.cyan.bold(`  ${data.project.name} - Dashboard`));
    console.log(chalk.gray(`  Last Updated: ${new Date(data.project.lastUpdated).toLocaleString()}`));
    console.log(chalk.cyan.bold('═'.repeat(60)) + '\n');

    // Sprint Section
    if (this.sections === 'all' || this.sections === 'sprint') {
      console.log(chalk.green.bold('🏃 Sprint Status'));
      console.log('─'.repeat(40));
      console.log(`Current Sprint: ${data.sprint.name}`);
      console.log(`Period: ${data.sprint.startDate} to ${data.sprint.endDate}`);
      console.log(`Days Remaining: ${data.sprint.daysRemaining}`);
      console.log(`\nProgress:`);
      const p = data.sprint.progress;
      console.log(`  Completed: ${chalk.green(p.completed)} | In Progress: ${chalk.yellow(p.inProgress)} | New: ${chalk.blue(p.new)}`);
      console.log(`  Total: ${p.total} | Completion: ${p.completionRate}`);
      console.log(`  Burndown Trend: ${this.getTrendColor(data.sprint.burndown.trend)}\n`);
    }

    // Team Section
    if (this.sections === 'all' || this.sections === 'team') {
      console.log(chalk.blue.bold('👥 Team Performance'));
      console.log('─'.repeat(40));
      console.log(`Team Size: ${data.team.members} | Availability: ${data.team.availability}`);
      console.log(`Velocity: ${data.team.velocity.current} (avg: ${data.team.velocity.average})`);
      console.log(`Velocity Trend: ${this.getTrendColor(data.team.velocity.trend)}`);
      console.log(`\nTop Contributors:`);
      Object.entries(data.team.workDistribution).slice(0, 3).forEach(([name, work]) => {
        console.log(`  ${name}: ${work.tasks} tasks, ${work.hours}h`);
      });
      console.log('');
    }

    // Quality Section
    if (this.sections === 'all' || this.sections === 'quality') {
      console.log(chalk.yellow.bold('🐛 Quality Metrics'));
      console.log('─'.repeat(40));
      const q = data.quality;
      console.log(`Bugs: ${chalk.red(q.bugs.active)} active | ${chalk.green(q.bugs.resolved)} resolved | ${chalk.yellow(q.bugs.new)} new`);
      if (q.bugs.criticalBugs > 0) {
        console.log(chalk.red(`⚠️  Critical Bugs: ${q.bugs.criticalBugs}`));
      }
      console.log(`\nCode Quality:`);
      console.log(`  Coverage: ${q.codeMetrics.coverage}`);
      console.log(`  Technical Debt: ${q.codeMetrics.technicalDebt}`);
      console.log(`  Code Smells: ${q.codeMetrics.codeSmells}`);
      console.log(`\nTests: ${chalk.green(q.testResults.passing)} passing | ${chalk.red(q.testResults.failing)} failing`);
      console.log(`  Success Rate: ${q.testResults.successRate}\n`);
    }

    // Pipeline Section
    if (this.sections === 'all' || this.sections === 'pipeline') {
      console.log(chalk.magenta.bold('🚀 CI/CD Pipeline'));
      console.log('─'.repeat(40));
      const pipeline = data.pipeline;
      console.log(`Builds: ${chalk.green(pipeline.builds.successful)} successful | ${chalk.red(pipeline.builds.failed)} failed`);
      console.log(`  Success Rate: ${pipeline.builds.successRate}`);
      console.log(`\nDeployments:`);
      Object.entries(pipeline.deployments).forEach(([env, info]) => {
        const statusColor = info.status === 'healthy' ? chalk.green :
                           info.status === 'building' ? chalk.yellow : chalk.red;
        console.log(`  ${env}: ${statusColor(info.status)} (${info.lastDeploy})`);
      });
      console.log('');
    }

    // Risks and Achievements
    if (data.risks && data.risks.length > 0) {
      console.log(chalk.red.bold('⚠️  Risks'));
      console.log('─'.repeat(40));
      data.risks.forEach(risk => {
        const icon = risk.level === 'high' ? '🔴' : risk.level === 'medium' ? '🟡' : '🟢';
        console.log(`  ${icon} ${risk.description}`);
      });
      console.log('');
    }

    if (data.achievements && data.achievements.length > 0) {
      console.log(chalk.green.bold('🎉 Recent Achievements'));
      console.log('─'.repeat(40));
      data.achievements.forEach(achievement => {
        console.log(`  ✓ ${achievement}`);
      });
      console.log('');
    }

    console.log(chalk.cyan.bold('═'.repeat(60)));
  }

  displayHTML(data) {
    console.log('<!DOCTYPE html>');
    console.log('<html><head><title>Dashboard</title></head><body>');
    console.log(`<h1>${data.project.name} Dashboard</h1>`);
    console.log('<p>HTML output is a stub - implement full HTML generation as needed</p>');
    console.log('</body></html>');
  }

  getTrendColor(trend) {
    if (trend.includes('increasing') || trend.includes('ahead')) {
      return chalk.green(trend);
    } else if (trend.includes('behind') || trend.includes('decreasing')) {
      return chalk.red(trend);
    } else {
      return chalk.yellow(trend);
    }
  }

  static parseArguments(args = process.argv) {
    const options = {};

    args.forEach((arg, index) => {
      if (arg === '--sections' && args[index + 1]) {
        options.sections = args[index + 1];
      } else if (arg === '--format' && args[index + 1]) {
        options.format = args[index + 1];
      } else if (arg === '--refresh') {
        options.refresh = true;
      } else if (arg === '--json') {
        options.format = 'json';
      } else if (arg === '--html') {
        options.format = 'html';
      } else if (arg === '--silent' || arg === '-s') {
        options.silent = true;
      }
    });

    return options;
  }
}

// Run if called directly
if (require.main === module) {
  const options = AzureDashboard.parseArguments();
  const dashboard = new AzureDashboard(options);

  dashboard.generateDashboard()
    .then(() => {
      if (dashboard.client) {
        const stats = dashboard.client.getCacheStats();
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

module.exports = AzureDashboard;