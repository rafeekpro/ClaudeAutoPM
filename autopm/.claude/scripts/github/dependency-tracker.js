#!/usr/bin/env node
/**
 * GitHub Issue Dependency Tracker
 *
 * Manages dependency relationships between GitHub issues using:
 * - Label-based dependencies (depends-on:#123)
 * - Native GitHub dependency API (when available)
 * - Local cache for offline mode
 *
 * @module dependency-tracker
 */

const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

/**
 * DependencyTracker class for managing GitHub issue dependencies
 */
class DependencyTracker {
  /**
   * Initialize dependency tracker
   *
   * @param {Object} config - Configuration options
   * @param {string} config.owner - GitHub repository owner
   * @param {string} config.repo - GitHub repository name
   * @param {string} config.token - GitHub personal access token
   * @param {boolean} config.localMode - Enable local mode (no API calls)
   * @param {string} config.cacheDir - Directory for local cache
   */
  constructor(config = {}) {
    this.localMode = config.localMode || false;
    this.cacheDir = config.cacheDir || path.join(process.cwd(), '.claude', 'cache');

    if (!this.localMode) {
      // Load from config or environment
      this.owner = config.owner || process.env.GITHUB_OWNER;
      this.repo = config.repo || process.env.GITHUB_REPO;
      const token = config.token || process.env.GITHUB_TOKEN;

      if (!this.owner || !this.repo) {
        throw new Error('GitHub configuration missing: owner and repo required');
      }

      if (!token) {
        throw new Error('GitHub configuration missing: token required (set GITHUB_TOKEN)');
      }

      // Initialize Octokit
      this.octokit = new Octokit({ auth: token });
    } else {
      this.owner = config.owner || 'local';
      this.repo = config.repo || 'local';

      // Ensure cache directory exists
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    }
  }

  /**
   * Add dependency relationship between issues
   *
   * @param {number} issueNumber - Issue that depends on another
   * @param {number|number[]} dependsOn - Issue(s) that must be resolved first
   * @param {Object} options - Additional options
   * @param {boolean} options.useNativeAPI - Use GitHub native dependency API
   * @returns {Promise<Object>} Result object with success status
   */
  async addDependency(issueNumber, dependsOn, options = {}) {
    try {
      // Validate issue number
      if (typeof issueNumber !== 'number' || issueNumber <= 0) {
        return {
          success: false,
          error: 'Invalid issue number'
        };
      }

      // Ensure dependsOn is an array
      const dependencies = Array.isArray(dependsOn) ? dependsOn : [dependsOn];

      // Check for self-dependency
      if (dependencies.includes(issueNumber)) {
        return {
          success: false,
          error: `Issue #${issueNumber} cannot depend on itself`
        };
      }

      // Local mode
      if (this.localMode) {
        return await this._addDependencyLocal(issueNumber, dependencies);
      }

      // Validate dependencies exist
      for (const depNumber of dependencies) {
        try {
          await this.octokit.rest.issues.get({
            owner: this.owner,
            repo: this.repo,
            issue_number: depNumber
          });
        } catch (error) {
          if (error.status === 404) {
            return {
              success: false,
              error: `Dependency issue #${depNumber} not found`
            };
          }
          throw error;
        }
      }

      // Use native API if requested and available
      if (options.useNativeAPI) {
        return await this._addDependencyNativeAPI(issueNumber, dependencies);
      }

      // Use label-based approach (default)
      return await this._addDependencyLabel(issueNumber, dependencies);

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add dependency using GitHub native API
   * @private
   */
  async _addDependencyNativeAPI(issueNumber, dependencies) {
    try {
      for (const depNumber of dependencies) {
        await this.octokit.request(
          'POST /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by',
          {
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            blocked_by_issue_number: depNumber
          }
        );
      }

      return {
        success: true,
        method: 'native-api',
        dependencies
      };
    } catch (error) {
      // Fallback to label-based if native API not available
      if (error.status === 404 || error.status === 422) {
        return await this._addDependencyLabel(issueNumber, dependencies);
      }
      throw error;
    }
  }

  /**
   * Add dependency using label-based approach
   * @private
   */
  async _addDependencyLabel(issueNumber, dependencies) {
    // Get current labels
    const issue = await this.octokit.rest.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber
    });

    const currentLabels = issue.data.labels.map(l => l.name);

    // Add dependency labels
    const dependencyLabels = dependencies.map(dep => `depends-on:#${dep}`);
    const newLabels = [...currentLabels, ...dependencyLabels];

    // Remove duplicates
    const uniqueLabels = [...new Set(newLabels)];

    // Update issue with new labels
    await this.octokit.rest.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels: uniqueLabels
    });

    return {
      success: true,
      method: 'label',
      dependencies
    };
  }

  /**
   * Add dependency in local mode
   * @private
   */
  async _addDependencyLocal(issueNumber, dependencies) {
    const cacheFile = path.join(this.cacheDir, 'dependencies.json');
    let cache = {};

    if (fs.existsSync(cacheFile)) {
      cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }

    // Add dependencies
    const issueKey = issueNumber.toString();
    if (!cache[issueKey]) {
      cache[issueKey] = [];
    }

    cache[issueKey] = [...new Set([...cache[issueKey], ...dependencies])];

    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');

    return {
      success: true,
      method: 'local',
      dependencies
    };
  }

  /**
   * Remove dependency relationship between issues
   *
   * @param {number} issueNumber - Issue to remove dependency from
   * @param {number|number[]} dependsOn - Dependency/dependencies to remove
   * @returns {Promise<Object>} Result object with success status
   */
  async removeDependency(issueNumber, dependsOn) {
    try {
      const dependencies = Array.isArray(dependsOn) ? dependsOn : [dependsOn];

      if (this.localMode) {
        return await this._removeDependencyLocal(issueNumber, dependencies);
      }

      // Get current issue
      const issue = await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber
      });

      const currentLabels = issue.data.labels.map(l => l.name);

      // Remove dependency labels
      const dependencyLabels = dependencies.map(dep => `depends-on:#${dep}`);
      const newLabels = currentLabels.filter(label => !dependencyLabels.includes(label));

      // Check if any dependencies were actually removed
      const removedCount = currentLabels.length - newLabels.length;

      if (removedCount === 0) {
        return {
          success: true,
          message: 'Dependency not found, no changes made'
        };
      }

      // Update issue
      await this.octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        labels: newLabels
      });

      return {
        success: true,
        removed: dependencies
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove dependency in local mode
   * @private
   */
  async _removeDependencyLocal(issueNumber, dependencies) {
    const cacheFile = path.join(this.cacheDir, 'dependencies.json');

    if (!fs.existsSync(cacheFile)) {
      return {
        success: true,
        message: 'No dependencies found'
      };
    }

    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const issueKey = issueNumber.toString();

    if (!cache[issueKey]) {
      return {
        success: true,
        message: 'No dependencies found for this issue'
      };
    }

    // Remove dependencies
    cache[issueKey] = cache[issueKey].filter(dep => !dependencies.includes(dep));

    // Remove issue key if no dependencies left
    if (cache[issueKey].length === 0) {
      delete cache[issueKey];
    }

    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');

    return {
      success: true,
      removed: dependencies
    };
  }

  /**
   * Get all dependencies for an issue
   *
   * @param {number} issueNumber - Issue to get dependencies for
   * @param {Object} options - Additional options
   * @param {boolean} options.detailed - Return detailed info for each dependency
   * @param {boolean} options.useNativeAPI - Use GitHub native dependency API
   * @returns {Promise<number[]|Object[]>} Array of issue numbers or detailed objects
   */
  async getDependencies(issueNumber, options = {}) {
    try {
      if (this.localMode) {
        return await this._getDependenciesLocal(issueNumber);
      }

      if (options.useNativeAPI) {
        return await this._getDependenciesNativeAPI(issueNumber, options);
      }

      // Get issue
      const issue = await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber
      });

      if (!issue.data.labels) {
        return [];
      }

      // Extract dependency issue numbers from labels
      const dependencyLabels = issue.data.labels
        .map(l => l.name)
        .filter(name => name.startsWith('depends-on:#'));

      const dependencies = dependencyLabels.map(label => {
        const match = label.match(/depends-on:#(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      }).filter(num => num !== null);

      // Return detailed info if requested
      if (options.detailed) {
        const detailedDeps = await Promise.all(
          dependencies.map(async (depNum) => {
            try {
              const depIssue = await this.octokit.rest.issues.get({
                owner: this.owner,
                repo: this.repo,
                issue_number: depNum
              });
              return depIssue.data;
            } catch {
              return { number: depNum, error: 'Failed to fetch' };
            }
          })
        );
        return detailedDeps;
      }

      return dependencies;

    } catch (error) {
      console.error('Error getting dependencies:', error.message);
      return [];
    }
  }

  /**
   * Get dependencies using native API
   * @private
   */
  async _getDependenciesNativeAPI(issueNumber, options) {
    try {
      const response = await this.octokit.request(
        'GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies',
        {
          owner: this.owner,
          repo: this.repo,
          issue_number: issueNumber
        }
      );

      if (options.detailed) {
        return response.data.dependencies;
      }

      return response.data.dependencies.map(dep => dep.number);
    } catch {
      // Fallback to label-based
      return await this.getDependencies(issueNumber, { ...options, useNativeAPI: false });
    }
  }

  /**
   * Get dependencies in local mode
   * @private
   */
  async _getDependenciesLocal(issueNumber) {
    const cacheFile = path.join(this.cacheDir, 'dependencies.json');

    if (!fs.existsSync(cacheFile)) {
      return [];
    }

    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const issueKey = issueNumber.toString();

    return cache[issueKey] || [];
  }

  /**
   * Get issues blocked by the given issue
   *
   * @param {number} issueNumber - Issue that may be blocking others
   * @param {Object} options - Additional options
   * @param {boolean} options.detailed - Return detailed info
   * @returns {Promise<number[]|Object[]>} Array of blocked issue numbers
   */
  async getBlockedIssues(issueNumber, options = {}) {
    try {
      if (this.localMode) {
        return await this._getBlockedIssuesLocal(issueNumber);
      }

      // Fetch all issues with their labels
      const allIssues = await this.octokit.paginate(
        this.octokit.rest.issues.listForRepo,
        {
          owner: this.owner,
          repo: this.repo,
          state: 'all',
          per_page: 100
        }
      );

      // Find issues that depend on this issue
      const dependencyLabel = `depends-on:#${issueNumber}`;
      const blockedIssues = allIssues.filter(issue =>
        issue.labels.some(label => label.name === dependencyLabel)
      );

      if (options.detailed) {
        return blockedIssues;
      }

      return blockedIssues.map(issue => issue.number);

    } catch (error) {
      console.error('Error getting blocked issues:', error.message);
      return [];
    }
  }

  /**
   * Get blocked issues in local mode
   * @private
   */
  async _getBlockedIssuesLocal(issueNumber) {
    const cacheFile = path.join(this.cacheDir, 'dependencies.json');

    if (!fs.existsSync(cacheFile)) {
      return [];
    }

    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const blocked = [];

    // Find issues that list this issue as a dependency
    for (const [issue, dependencies] of Object.entries(cache)) {
      if (dependencies.includes(issueNumber)) {
        blocked.push(parseInt(issue, 10));
      }
    }

    return blocked;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const issueNumber = parseInt(process.argv[3], 10);
  const dependsOn = process.argv[4] ? parseInt(process.argv[4], 10) : null;

  const tracker = new DependencyTracker();

  (async () => {
    switch (command) {
      case 'add':
        if (!dependsOn) {
          console.error('Usage: dependency-tracker.js add <issue> <depends-on>');
          process.exit(1);
        }
        const addResult = await tracker.addDependency(issueNumber, dependsOn);
        console.log(JSON.stringify(addResult, null, 2));
        break;

      case 'remove':
        if (!dependsOn) {
          console.error('Usage: dependency-tracker.js remove <issue> <depends-on>');
          process.exit(1);
        }
        const removeResult = await tracker.removeDependency(issueNumber, dependsOn);
        console.log(JSON.stringify(removeResult, null, 2));
        break;

      case 'get':
        const deps = await tracker.getDependencies(issueNumber);
        console.log('Dependencies:', deps);
        break;

      case 'blocked':
        const blocked = await tracker.getBlockedIssues(issueNumber);
        console.log('Blocked issues:', blocked);
        break;

      default:
        console.error('Usage: dependency-tracker.js <add|remove|get|blocked> <issue> [depends-on]');
        process.exit(1);
    }
  })().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = DependencyTracker;
