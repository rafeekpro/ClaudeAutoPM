#!/usr/bin/env node

/**
 * Setup script for git hooks - Node.js implementation
 * Configures git to use custom hooks directory
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

class SetupHooks {
  constructor() {
    this.gitDir = '.git';
    this.hooksDir = '.githooks';
  }

  /**
   * Print colored message
   */
  print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Check if we're in a git repository
   */
  isGitRepository() {
    return fs.existsSync(this.gitDir);
  }

  /**
   * Configure git hooks
   */
  configureHooks() {
    try {
      execSync(`git config core.hooksPath ${this.hooksDir}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Main execution
   */
  async run() {
    console.log('🔧 Setting up git hooks for code protection...');

    // Check if we're in a git repository
    if (!this.isGitRepository()) {
      this.print('❌ Error: Not in a git repository', 'red');
      process.exit(1);
    }

    // Configure git to use our hooks directory
    if (this.configureHooks()) {
      this.print('✅ Git hooks configured successfully!', 'green');
      console.log('');
      console.log('📋 Active hooks:');
      console.log('  • pre-commit: Validates code integrity before commits');
      console.log('');
      console.log('To disable temporarily:');
      console.log('  git commit --no-verify');
      console.log('');
      console.log('To disable permanently:');
      console.log('  git config --unset core.hooksPath');
    } else {
      this.print('❌ Failed to configure git hooks', 'red');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const setupHooks = new SetupHooks();
  setupHooks.run().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = SetupHooks;