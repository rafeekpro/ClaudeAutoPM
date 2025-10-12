#!/usr/bin/env node
/**
 * GitHub Issue Dependency Validator
 *
 * Validates dependency relationships and checks if issues can be closed:
 * - Checks if all dependencies are resolved
 * - Detects circular dependencies
 * - Validates issue closure readiness
 * - Provides blocker status and progress tracking
 *
 * @module dependency-validator
 */

const fs = require('fs');
const path = require('path');
const DependencyTracker = require('./dependency-tracker.js');

/**
 * DependencyValidator class for validating GitHub issue dependencies
 */
class DependencyValidator {
  /**
   * Initialize dependency validator
   *
   * @param {Object} config - Configuration options
   * @param {string} config.owner - GitHub repository owner
   * @param {string} config.repo - GitHub repository name
   * @param {string} config.token - GitHub personal access token
   * @param {boolean} config.localMode - Enable local mode
   * @param {string} config.cacheDir - Directory for local cache
   */
  constructor(config = {}) {
    this.localMode = config.localMode || false;
    this.cacheDir = config.cacheDir || path.join(process.cwd(), '.claude', 'cache');
    this.cacheTimeout = config.cacheTimeout || 300000; // 5 minutes default
    this.validationCache = new Map();

    // Initialize dependency tracker
    this.tracker = new DependencyTracker(config);

    if (this.localMode) {
      this._ensureCacheDir();
    }
  }

  /**
   * Ensure cache directory exists
   * @private
   */
  _ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Get cached validation result
   * @private
   */
  _getCached(issueNumber) {
    const cached = this.validationCache.get(issueNumber);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.validationCache.delete(issueNumber);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached validation result
   * @private
   */
  _setCached(issueNumber, data) {
    this.validationCache.set(issueNumber, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Validate all dependencies for an issue
   *
   * @param {number} issueNumber - Issue to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.recursive - Check nested dependencies
   * @param {boolean} options.useCache - Use cached results
   * @returns {Promise<Object>} Validation result
   */
  async validateDependencies(issueNumber, options = {}) {
    try {
      // Check cache
      if (options.useCache !== false) {
        const cached = this._getCached(issueNumber);
        if (cached) return cached;
      }

      if (this.localMode) {
        return await this._validateLocal(issueNumber, options);
      }

      // Get dependencies
      const dependencies = await this.tracker.getDependencies(issueNumber);

      if (dependencies.length === 0) {
        const result = {
          valid: true,
          unresolvedDependencies: [],
          message: 'No dependencies to validate'
        };
        this._setCached(issueNumber, result);
        return result;
      }

      // Check status of each dependency
      const unresolvedDependencies = [];

      for (const depNumber of dependencies) {
        try {
          const depIssue = await this.tracker.octokit.rest.issues.get({
            owner: this.tracker.owner,
            repo: this.tracker.repo,
            issue_number: depNumber
          });

          if (depIssue.data.state !== 'closed') {
            unresolvedDependencies.push({
              number: depIssue.data.number,
              title: depIssue.data.title,
              state: depIssue.data.state,
              url: depIssue.data.html_url
            });
          }

          // Recursively check nested dependencies if requested
          if (options.recursive && depIssue.data.state !== 'closed') {
            const nestedValidation = await this.validateDependencies(depNumber, {
              ...options,
              useCache: true
            });
            if (!nestedValidation.valid) {
              unresolvedDependencies.push(...nestedValidation.unresolvedDependencies);
            }
          }
        } catch (error) {
          if (error.status === 404) {
            unresolvedDependencies.push({
              number: depNumber,
              error: 'Issue not found',
              state: 'unknown'
            });
          } else {
            throw error;
          }
        }
      }

      const result = {
        valid: unresolvedDependencies.length === 0,
        unresolvedDependencies,
        message: unresolvedDependencies.length === 0
          ? 'All dependencies resolved'
          : `${unresolvedDependencies.length} unresolved dependencies`
      };

      this._setCached(issueNumber, result);
      return result;

    } catch (error) {
      return {
        valid: false,
        error: error.message,
        unresolvedDependencies: []
      };
    }
  }

  /**
   * Validate dependencies in local mode
   * @private
   */
  async _validateLocal(issueNumber, options) {
    const depsFile = path.join(this.cacheDir, 'dependencies.json');
    const statesFile = path.join(this.cacheDir, 'issue-states.json');

    if (!fs.existsSync(depsFile)) {
      return {
        valid: true,
        unresolvedDependencies: [],
        message: 'No dependencies found (local mode)'
      };
    }

    const dependencies = JSON.parse(fs.readFileSync(depsFile, 'utf8'));
    const issueKey = issueNumber.toString();
    const issueDeps = dependencies[issueKey] || [];

    if (issueDeps.length === 0) {
      return {
        valid: true,
        unresolvedDependencies: [],
        message: 'No dependencies'
      };
    }

    // Load issue states if available
    let states = {};
    if (fs.existsSync(statesFile)) {
      states = JSON.parse(fs.readFileSync(statesFile, 'utf8'));
    }

    const unresolvedDependencies = issueDeps
      .filter(dep => states[dep.toString()] !== 'closed')
      .map(dep => ({ number: dep, state: states[dep.toString()] || 'unknown' }));

    return {
      valid: unresolvedDependencies.length === 0,
      unresolvedDependencies,
      message: unresolvedDependencies.length === 0
        ? 'All dependencies resolved'
        : `${unresolvedDependencies.length} unresolved dependencies`
    };
  }

  /**
   * Detect circular dependencies in dependency chain
   *
   * @param {number} issueNumber - Starting issue
   * @param {Object} options - Detection options
   * @param {number} options.maxDepth - Maximum depth to search
   * @returns {Promise<Object>} Detection result with cycles found
   */
  async detectCircularDependencies(issueNumber, options = {}) {
    const maxDepth = options.maxDepth || 50;
    const visited = new Set();
    const path = [];
    const cycles = [];

    /**
     * DFS to detect cycles
     */
    const detectCycle = async (current, depth = 0) => {
      if (depth > maxDepth) {
        return; // Prevent infinite loops
      }

      if (path.includes(current)) {
        // Found a cycle
        const cycleStart = path.indexOf(current);
        const cycle = [...path.slice(cycleStart), current];
        cycles.push(cycle);
        return;
      }

      if (visited.has(current)) {
        return; // Already explored this path
      }

      visited.add(current);
      path.push(current);

      try {
        const dependencies = await this.tracker.getDependencies(current);

        for (const dep of dependencies) {
          await detectCycle(dep, depth + 1);
        }
      } catch (error) {
        // Silently ignore errors in cycle detection
      }

      path.pop();
    };

    await detectCycle(issueNumber);

    return {
      hasCircular: cycles.length > 0,
      cycles,
      message: cycles.length > 0
        ? `Found ${cycles.length} circular dependency cycle(s)`
        : 'No circular dependencies detected'
    };
  }

  /**
   * Check if an issue can be closed
   *
   * @param {number} issueNumber - Issue to check
   * @returns {Promise<Object>} Result indicating if issue can be closed
   */
  async canClose(issueNumber) {
    try {
      // Check if dependencies are resolved
      const validation = await this.validateDependencies(issueNumber);

      if (!validation.valid) {
        return {
          canClose: false,
          reason: `Issue #${issueNumber} has unresolved dependencies`,
          blockingIssues: validation.unresolvedDependencies
        };
      }

      // Check if closing would block other issues
      const blockedIssues = await this.tracker.getBlockedIssues(issueNumber);

      if (blockedIssues.length > 0) {
        // Get details of blocked issues
        const openBlockedIssues = [];

        for (const blockedNum of blockedIssues) {
          try {
            const blockedIssue = await this.tracker.octokit.rest.issues.get({
              owner: this.tracker.owner,
              repo: this.tracker.repo,
              issue_number: blockedNum
            });

            if (blockedIssue.data.state === 'open') {
              openBlockedIssues.push({
                number: blockedIssue.data.number,
                title: blockedIssue.data.title,
                url: blockedIssue.data.html_url
              });
            }
          } catch {
            // Ignore errors for individual issues
          }
        }

        const result = {
          canClose: true,
          reason: 'All dependencies resolved',
          affectedIssues: openBlockedIssues
        };

        if (openBlockedIssues.length > 0) {
          result.warning = `Closing this issue will block ${openBlockedIssues.length} open issue(s)`;
        }

        return result;
      }

      // Check for circular dependencies
      const circularCheck = await this.detectCircularDependencies(issueNumber);
      const result = {
        canClose: true,
        reason: 'No dependencies blocking closure'
      };

      if (circularCheck.hasCircular) {
        result.warning = 'Issue is part of a circular dependency chain';
        result.cycles = circularCheck.cycles;
      }

      return result;

    } catch (error) {
      return {
        canClose: false,
        reason: 'Error checking closure status',
        error: error.message
      };
    }
  }

  /**
   * Get status of all blocking issues (dependencies)
   *
   * @param {number} issueNumber - Issue to check blockers for
   * @returns {Promise<Object>} Status of all blockers with progress
   */
  async getBlockerStatus(issueNumber) {
    try {
      const dependencies = await this.tracker.getDependencies(issueNumber);

      if (dependencies.length === 0) {
        return {
          total: 0,
          resolved: 0,
          unresolved: 0,
          progress: 100,
          blockers: []
        };
      }

      const blockers = [];
      let resolved = 0;

      for (const depNumber of dependencies) {
        try {
          const depIssue = await this.tracker.octokit.rest.issues.get({
            owner: this.tracker.owner,
            repo: this.tracker.repo,
            issue_number: depNumber
          });

          const blocker = {
            number: depIssue.data.number,
            title: depIssue.data.title,
            state: depIssue.data.state,
            url: depIssue.data.html_url,
            assignees: depIssue.data.assignees,
            labels: depIssue.data.labels
          };

          if (depIssue.data.state === 'closed') {
            resolved++;
            blocker.resolved = true;
          } else {
            blocker.resolved = false;
          }

          blockers.push(blocker);
        } catch (error) {
          blockers.push({
            number: depNumber,
            error: 'Failed to fetch issue details',
            resolved: false
          });
        }
      }

      const total = dependencies.length;
      const progress = (resolved / total) * 100;

      return {
        total,
        resolved,
        unresolved: total - resolved,
        progress: Math.round(progress * 100) / 100,
        blockers
      };

    } catch (error) {
      return {
        total: 0,
        resolved: 0,
        unresolved: 0,
        progress: 0,
        error: error.message,
        blockers: []
      };
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const issueNumber = parseInt(process.argv[3], 10);

  const validator = new DependencyValidator();

  (async () => {
    switch (command) {
      case 'validate':
        const validation = await validator.validateDependencies(issueNumber);
        console.log('\nDependency Validation:');
        console.log('─'.repeat(50));
        console.log(`Valid: ${validation.valid ? '✓' : '✗'}`);
        console.log(`Message: ${validation.message}`);

        if (validation.unresolvedDependencies.length > 0) {
          console.log('\nUnresolved Dependencies:');
          validation.unresolvedDependencies.forEach(dep => {
            console.log(`  • #${dep.number}: ${dep.title || 'Unknown'} (${dep.state})`);
          });
        }
        break;

      case 'circular':
        const circular = await validator.detectCircularDependencies(issueNumber);
        console.log('\nCircular Dependency Check:');
        console.log('─'.repeat(50));
        console.log(`Has Circular: ${circular.hasCircular ? 'YES' : 'NO'}`);

        if (circular.hasCircular) {
          console.log('\nCycles Found:');
          circular.cycles.forEach((cycle, i) => {
            console.log(`  ${i + 1}. ${cycle.join(' → ')}`);
          });
        }
        break;

      case 'can-close':
        const canClose = await validator.canClose(issueNumber);
        console.log('\nClosure Check:');
        console.log('─'.repeat(50));
        console.log(`Can Close: ${canClose.canClose ? '✓ YES' : '✗ NO'}`);
        console.log(`Reason: ${canClose.reason}`);

        if (canClose.warning) {
          console.log(`\n⚠ Warning: ${canClose.warning}`);
        }

        if (canClose.blockingIssues && canClose.blockingIssues.length > 0) {
          console.log('\nBlocking Issues:');
          canClose.blockingIssues.forEach(issue => {
            console.log(`  • #${issue.number}: ${issue.title}`);
          });
        }

        if (canClose.affectedIssues && canClose.affectedIssues.length > 0) {
          console.log('\nAffected Issues:');
          canClose.affectedIssues.forEach(issue => {
            console.log(`  • #${issue.number}: ${issue.title}`);
          });
        }
        break;

      case 'status':
      case 'blockers':
        const status = await validator.getBlockerStatus(issueNumber);
        console.log('\nBlocker Status:');
        console.log('─'.repeat(50));
        console.log(`Total Dependencies: ${status.total}`);
        console.log(`Resolved: ${status.resolved}`);
        console.log(`Unresolved: ${status.unresolved}`);
        console.log(`Progress: ${status.progress}%`);

        if (status.blockers.length > 0) {
          console.log('\nBlockers:');
          status.blockers.forEach(blocker => {
            const icon = blocker.resolved ? '✓' : '○';
            console.log(`  ${icon} #${blocker.number}: ${blocker.title || 'Unknown'} (${blocker.state})`);
          });
        }
        break;

      default:
        console.error('Usage: dependency-validator.js <validate|circular|can-close|status> <issue>');
        process.exit(1);
    }
  })().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = DependencyValidator;
