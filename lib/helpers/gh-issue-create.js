#!/usr/bin/env node

/**
 * GitHub Issue Creation Helper
 * Handles the limitation that gh issue create doesn't support --json flag
 * Provides methods to create issues and get JSON responses
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class GitHubIssueCreator {
  constructor() {
    this.execSync = execSync;
  }

  /**
   * Set custom execSync for testing
   */
  _setExecSync(customExecSync) {
    this.execSync = customExecSync;
  }

  /**
   * Extract issue number from GitHub URL
   */
  _extractIssueNumber(url) {
    if (!url) return null;

    const match = url.toString().trim().match(/\/issues\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Validate required options
   */
  _validateOptions(options, requiredFields = ['title']) {
    for (const field of requiredFields) {
      if (!options[field]) {
        throw new Error(`${field} is required`);
      }
    }
  }

  /**
   * Build gh issue create command
   */
  _buildCreateCommand(options) {
    const parts = ['gh issue create'];

    // Title
    parts.push(`--title "${options.title.replace(/"/g, '\\"')}"`);

    // Body or body file
    if (options.bodyFile) {
      parts.push(`--body-file "${options.bodyFile}"`);
    } else if (options.body) {
      parts.push(`--body "${options.body.replace(/"/g, '\\"')}"`);
    }

    // Labels
    if (options.labels && options.labels.length > 0) {
      const labelStr = options.labels.join(',');
      parts.push(`--label "${labelStr}"`);
    }

    // Assignee
    if (options.assignee) {
      parts.push(`--assignee "${options.assignee}"`);
    }

    // Milestone
    if (options.milestone) {
      parts.push(`--milestone "${options.milestone}"`);
    }

    // Project
    if (options.project) {
      parts.push(`--project "${options.project}"`);
    }

    return parts.join(' ');
  }

  /**
   * Create issue using gh CLI and return issue details
   */
  async createIssue(options) {
    this._validateOptions(options, ['title']);

    try {
      // Create the issue
      const command = this._buildCreateCommand(options);
      const output = this.execSync(command, { encoding: 'utf8' });

      // Extract issue number from URL
      const number = this._extractIssueNumber(output);

      if (!number) {
        throw new Error(`Could not extract issue number from output: ${output}`);
      }

      return {
        number,
        url: output.trim()
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('GitHub CLI (gh) is not installed or not in PATH');
      }
      if (error.message && error.message.includes('not authenticated')) {
        throw new Error('GitHub CLI not authenticated. Run: gh auth login');
      }
      throw error;
    }
  }

  /**
   * Create issue using gh api for JSON response
   */
  async createIssueWithJson(options) {
    this._validateOptions(options, ['title']);

    try {
      // Prepare API payload
      const payload = {
        title: options.title,
        body: options.body || ''
      };

      // Read body from file if specified
      if (options.bodyFile && !options.body) {
        payload.body = await fs.readFile(options.bodyFile, 'utf8');
      }

      // Add labels
      if (options.labels && options.labels.length > 0) {
        payload.labels = options.labels;
      }

      // Add assignees
      if (options.assignee) {
        payload.assignees = [options.assignee === '@me' ? '' : options.assignee];
      }

      // Build gh api command
      const fieldArgs = Object.entries(payload)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `--field ${key}='${JSON.stringify(value)}'`;
          }
          return `--field ${key}="${value.replace(/"/g, '\\"')}"`;
        })
        .join(' ');

      const command = `gh api repos/:owner/:repo/issues --method POST ${fieldArgs}`;
      const output = this.execSync(command, { encoding: 'utf8' });

      return JSON.parse(output);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('GitHub CLI (gh) is not installed or not in PATH');
      }
      if (error.message && error.message.includes('not authenticated')) {
        throw new Error('GitHub CLI not authenticated. Run: gh auth login');
      }
      throw error;
    }
  }

  /**
   * Create an epic (issue with epic labels)
   */
  async createEpic(options) {
    const epicName = options.epicName || options.title?.replace(/^Epic:\s*/, '');

    if (!epicName) {
      throw new Error('epicName or title is required for epic creation');
    }

    // Prepare epic options
    const epicOptions = {
      title: options.title || `Epic: ${epicName}`,
      body: options.body || this._generateEpicBody(options),
      labels: ['epic', `epic:${epicName}`]
    };

    // Add additional labels
    if (options.additionalLabels) {
      epicOptions.labels.push(...options.additionalLabels);
    }

    // Use JSON method if we need the full response
    if (options.returnJson !== false) {
      return await this.createIssueWithJson(epicOptions);
    }

    return await this.createIssue(epicOptions);
  }

  /**
   * Generate epic body from template
   */
  _generateEpicBody(options) {
    let body = '## Epic Description\n\n';

    if (options.description) {
      body += `${options.description}\n\n`;
    }

    if (options.acceptanceCriteria && options.acceptanceCriteria.length > 0) {
      body += '## Acceptance Criteria\n\n';
      options.acceptanceCriteria.forEach(criteria => {
        body += `- [ ] ${criteria}\n`;
      });
      body += '\n';
    }

    if (options.tasks && options.tasks.length > 0) {
      body += '## Tasks\n\n';
      options.tasks.forEach(task => {
        body += `- [ ] ${task}\n`;
      });
    }

    return body;
  }

  /**
   * Helper method for PM commands - create epic and return just the number
   */
  async createEpicAndGetNumber(options) {
    const result = await this.createEpic({ ...options, returnJson: false });
    return result.number;
  }
}

// Create singleton instance
const creator = new GitHubIssueCreator();

// Export methods bound to instance
module.exports = {
  createIssue: creator.createIssue.bind(creator),
  createIssueWithJson: creator.createIssueWithJson.bind(creator),
  createEpic: creator.createEpic.bind(creator),
  createEpicAndGetNumber: creator.createEpicAndGetNumber.bind(creator),
  _setExecSync: creator._setExecSync.bind(creator),
  _extractIssueNumber: creator._extractIssueNumber.bind(creator)
};