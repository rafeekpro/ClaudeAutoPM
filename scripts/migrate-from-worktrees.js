#!/usr/bin/env node

/**
 * Migration script from worktrees to branches
 * Node.js implementation of migrate-from-worktrees.sh
 * This script helps users transition from the deprecated worktree strategy
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs-extra');
const path = require('path');
const colors = require('../lib/utils/colors');

class WorktreeMigrator {
  constructor() {
    this.worktrees = [];
  }

  /**
   * Prompt user for confirmation
   */
  async promptUser(message) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(message, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }

  /**
   * Wait for user to press Enter
   */
  async waitForEnter(message = 'Press Enter to continue...') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(message, () => {
        rl.close();
        resolve();
      });
    });
  }

  /**
   * Get list of worktrees
   */
  getWorktrees() {
    try {
      const output = execSync('git worktree list', { encoding: 'utf8' });
      const lines = output.trim().split('\n');

      // Skip the main worktree (first line)
      const worktreeLines = lines.slice(1).filter(line => !line.includes('bare'));

      return worktreeLines.map(line => {
        const parts = line.split(/\s+/);
        const path = parts[0];
        const branch = parts[2] ? parts[2].replace(/[\[\]]/g, '') : '';
        return { path, branch, raw: line };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Check for uncommitted changes in worktree
   */
  hasUncommittedChanges(worktreePath) {
    try {
      const output = execSync('git status --porcelain', {
        cwd: worktreePath,
        encoding: 'utf8'
      });
      return output.trim().length > 0;
    } catch (error) {
      // Worktree might not exist or be accessible
      return false;
    }
  }

  /**
   * Get uncommitted changes details
   */
  getUncommittedChanges(worktreePath) {
    try {
      const output = execSync('git status --short', {
        cwd: worktreePath,
        encoding: 'utf8'
      });
      return output.trim().split('\n').filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * Remove a worktree
   */
  removeWorktree(worktreePath) {
    try {
      // First try normal removal
      execSync(`git worktree remove "${worktreePath}"`, { encoding: 'utf8' });
      return true;
    } catch (error) {
      // If normal removal fails, try force
      try {
        execSync(`git worktree remove --force "${worktreePath}"`, { encoding: 'utf8' });
        return true;
      } catch (forceError) {
        console.error(colors.red(`  Failed to remove worktree: ${forceError.message}`));
        return false;
      }
    }
  }

  /**
   * Process a single worktree
   */
  async processWorktree(worktree) {
    console.log('');
    console.log(`Processing worktree: ${colors.cyan(worktree.path)} (branch: ${colors.yellow(worktree.branch)})`);

    // Check for uncommitted changes
    if (this.hasUncommittedChanges(worktree.path)) {
      console.log(colors.yellow('  ⚠️  Uncommitted changes found:'));
      const changes = this.getUncommittedChanges(worktree.path);
      changes.forEach(change => console.log(`    ${change}`));
      console.log('');
      console.log(colors.yellow('  Please commit or stash these changes first.'));
      await this.waitForEnter('  Press Enter when ready to continue...');
    }

    // Remove the worktree
    console.log('  Removing worktree...');
    const removed = this.removeWorktree(worktree.path);

    if (removed) {
      console.log(colors.green(`  ✅ Worktree removed successfully`));
      return true;
    } else {
      console.log(colors.red(`  ❌ Failed to remove worktree`));
      return false;
    }
  }

  /**
   * Update git configuration
   */
  updateGitConfig() {
    console.log('');
    console.log('📝 Updating git configuration...');

    try {
      // Remove worktree-specific configs if they exist
      try {
        execSync('git config --unset-all worktree.guessRemote', { stdio: 'ignore' });
      } catch {}

      // Add helpful branch configs
      execSync('git config branch.autoSetupMerge always');
      execSync('git config branch.autoSetupRebase always');

      console.log(colors.green('✅ Git configuration updated'));
      return true;
    } catch (error) {
      console.log(colors.yellow('⚠️  Could not update all git configurations'));
      return false;
    }
  }

  /**
   * Main execution
   */
  async run() {
    console.log(colors.bold('🔄 ClaudeAutoPM Git Strategy Migration'));
    console.log('='.repeat(38));
    console.log('');
    console.log('This script will help you migrate from worktrees to the unified branch strategy.');
    console.log('');

    // Check for existing worktrees
    this.worktrees = this.getWorktrees();

    if (this.worktrees.length === 0) {
      console.log(colors.green('✅ No worktrees found. You\'re already using the branch strategy!'));
      process.exit(0);
    }

    console.log(colors.yellow('⚠️  Found existing worktrees:'));
    this.worktrees.forEach(wt => console.log(`  ${wt.raw}`));

    console.log('');
    console.log('Migration steps:');
    console.log('1. Stash or commit any uncommitted changes in worktrees');
    console.log('2. Remove worktrees');
    console.log('3. Switch to branch-based workflow');
    console.log('');

    const confirmed = await this.promptUser('Do you want to proceed with migration? [y/N] ');

    if (!confirmed) {
      console.log('Migration cancelled.');
      process.exit(0);
    }

    // Process each worktree
    let successCount = 0;
    let failCount = 0;

    for (const worktree of this.worktrees) {
      const success = await this.processWorktree(worktree);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Update git configuration
    this.updateGitConfig();

    // Final summary
    console.log('');
    console.log('='.repeat(38));
    console.log(colors.bold('Migration Summary'));
    console.log('='.repeat(38));
    console.log(`${colors.green('✅ Removed:')} ${successCount} worktrees`);
    if (failCount > 0) {
      console.log(`${colors.red('❌ Failed:')} ${failCount} worktrees`);
    }

    if (failCount === 0) {
      console.log('');
      console.log(colors.green('🎉 Migration completed successfully!'));
      console.log('');
      console.log('You can now use the standard branch workflow:');
      console.log('  git checkout -b feature/new-feature');
      console.log('  git checkout main');
      console.log('  git merge feature/new-feature');
    } else {
      console.log('');
      console.log(colors.yellow('⚠️  Migration partially completed.'));
      console.log('Some worktrees could not be removed automatically.');
      console.log('You may need to remove them manually with:');
      console.log('  git worktree remove --force <path>');
    }

    process.exit(failCount > 0 ? 1 : 0);
  }
}

// Run if called directly
if (require.main === module) {
  const migrator = new WorktreeMigrator();
  migrator.run().catch(error => {
    console.error(colors.red('Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = WorktreeMigrator;