/**
 * Azure DevOps Output Formatter
 * Formats work items and sprint data for console display
 */

const Table = require('table').table;
const chalk = require('chalk');

class AzureFormatter {
  static formatWorkItems(items, options = {}) {
    if (!items || items.length === 0) {
      return chalk.yellow('No work items found.');
    }

    const headers = this.getHeaders(options);
    const rows = items.map(item => this.formatWorkItem(item, options));

    const tableConfig = {
      header: {
        alignment: 'center',
        content: chalk.cyan.bold('Work Items')
      }
    };

    return Table([headers, ...rows], tableConfig);
  }

  static getHeaders(options) {
    const headers = [
      chalk.bold('ID'),
      chalk.bold('Type'),
      chalk.bold('Title'),
      chalk.bold('State'),
      chalk.bold('Assigned To')
    ];

    if (options.showRemaining) {
      headers.push(chalk.bold('Remaining'));
    }

    if (options.showPriority) {
      headers.push(chalk.bold('Priority'));
    }

    return headers;
  }

  static formatWorkItem(item, options) {
    const fields = item.fields || {};
    const row = [
      chalk.blue(item.id),
      this.getTypeIcon(fields['System.WorkItemType']),
      this.truncate(fields['System.Title'], 50),
      this.getStateColor(fields['System.State']),
      this.getAssignedTo(fields['System.AssignedTo'])
    ];

    if (options.showRemaining) {
      row.push(fields['Microsoft.VSTS.Scheduling.RemainingWork'] || '-');
    }

    if (options.showPriority) {
      row.push(fields['Microsoft.VSTS.Common.Priority'] || '-');
    }

    return row;
  }

  static getTypeIcon(type) {
    const icons = {
      'Task': '📋 Task',
      'Bug': '🐛 Bug',
      'User Story': '📖 Story',
      'Feature': '🎯 Feature',
      'Epic': '🏔️  Epic'
    };
    return icons[type] || type;
  }

  static getStateColor(state) {
    const colors = {
      'New': chalk.gray(state),
      'Active': chalk.blue(state),
      'In Progress': chalk.yellow(state),
      'Resolved': chalk.green(state),
      'Closed': chalk.dim(state),
      'Done': chalk.green(state),
      'Removed': chalk.strikethrough(state)
    };
    return colors[state] || state;
  }

  static getAssignedTo(assignedTo) {
    if (!assignedTo) return chalk.gray('Unassigned');
    const name = assignedTo.displayName || assignedTo.uniqueName || assignedTo;
    return this.truncate(name, 20);
  }

  static truncate(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length - 3) + '...';
  }

  static formatSummary(items) {
    if (!items || items.length === 0) {
      return '';
    }

    const states = {};
    const types = {};
    let totalRemaining = 0;

    items.forEach(item => {
      const fields = item.fields || {};
      const state = fields['System.State'];
      const type = fields['System.WorkItemType'];
      const remaining = fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0;

      states[state] = (states[state] || 0) + 1;
      types[type] = (types[type] || 0) + 1;
      totalRemaining += remaining;
    });

    const lines = [];
    lines.push(chalk.bold('\n📊 Summary:'));
    lines.push(`Total items: ${chalk.cyan(items.length)}`);

    if (Object.keys(types).length > 0) {
      lines.push('\nBy Type:');
      Object.entries(types).forEach(([type, count]) => {
        lines.push(`  ${this.getTypeIcon(type)}: ${count}`);
      });
    }

    if (Object.keys(states).length > 0) {
      lines.push('\nBy State:');
      Object.entries(states).forEach(([state, count]) => {
        lines.push(`  ${this.getStateColor(state)}: ${count}`);
      });
    }

    if (totalRemaining > 0) {
      lines.push(`\nTotal Remaining Work: ${chalk.yellow(totalRemaining + ' hours')}`);
    }

    return lines.join('\n');
  }

  static formatSprintInfo(sprint) {
    if (!sprint) {
      return chalk.yellow('No active sprint found.');
    }

    const attributes = sprint.attributes || {};
    const startDate = attributes.startDate ? new Date(attributes.startDate).toLocaleDateString() : 'N/A';
    const endDate = attributes.finishDate ? new Date(attributes.finishDate).toLocaleDateString() : 'N/A';

    return chalk.cyan.bold(`\n🏃 Current Sprint: ${sprint.name}\n`) +
           `  Start: ${startDate}\n` +
           `  End: ${endDate}\n`;
  }

  static formatError(error) {
    return chalk.red(`\n❌ Error: ${error.message}\n`);
  }

  static formatSuccess(message) {
    return chalk.green(`\n✅ ${message}\n`);
  }

  static formatWarning(message) {
    return chalk.yellow(`\n⚠️  ${message}\n`);
  }
}

module.exports = AzureFormatter;