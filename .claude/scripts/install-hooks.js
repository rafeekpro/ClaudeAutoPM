#!/usr/bin/env node

/**
 * Node.js implementation of install-hooks.sh
 * Installs Git hooks for Docker-first development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class InstallHooks {
  constructor() {
    this.projectRoot = process.cwd();
    this.force = false;

    // ANSI color codes
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m'
    };
  }

  // Helper to print colored messages
  print(message, color = null) {
    if (color && this.colors[color]) {
      console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    } else {
      console.log(message);
    }
  }

  // Check if we're in a git repository
  checkGitRepo() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch (error) {
      this.print('❌ Not in a Git repository', 'red');
      this.print('Run this script from the root of your Git repository');
      process.exit(1);
    }
  }

  // Ensure .git/hooks directory exists
  ensureHooksDir() {
    const hooksDir = path.join(this.projectRoot, '.git', 'hooks');
    if (!fs.existsSync(hooksDir)) {
      this.print('Creating .git/hooks directory...', 'blue');
      fs.mkdirSync(hooksDir, { recursive: true });
    }
  }

  // Install a single hook
  async installHook(hookName, sourcePath) {
    const targetPath = path.join(this.projectRoot, '.git', 'hooks', hookName);

    this.print(`Installing ${hookName} hook...`, 'blue');

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      this.print(`❌ Source hook not found: ${sourcePath}`, 'red');
      return false;
    }

    // Check if target exists and handle overwrite
    if (fs.existsSync(targetPath) && !this.force) {
      this.print(`⚠️  Hook already exists: ${targetPath}`, 'yellow');

      const answer = await this.prompt('Overwrite? (y/N): ');
      if (!answer.toLowerCase().startsWith('y')) {
        console.log(`Skipping ${hookName}`);
        return false;
      }
    }

    try {
      // Create symlink (relative path from hooks dir to source)
      const relativePath = path.relative(
        path.dirname(targetPath),
        sourcePath
      );

      // Remove existing file/link if it exists
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }

      fs.symlinkSync(relativePath, targetPath);
      fs.chmodSync(targetPath, 0o755);

      this.print(`✅ Installed ${hookName} hook`, 'green');
      return true;
    } catch (error) {
      this.print(`❌ Failed to install ${hookName} hook: ${error.message}`, 'red');
      return false;
    }
  }

  // Prompt user for input
  prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  // Parse command line arguments
  parseArgs(args) {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch(arg) {
        case '--force':
          this.force = true;
          break;

        case '-h':
        case '--help':
          this.showUsage();
          process.exit(0);
          break;

        default:
          this.print(`Unknown option: ${arg}`, 'red');
          process.exit(1);
      }
    }
  }

  // Show usage information
  showUsage() {
    console.log('Install Git hooks for Docker-first development');
    console.log('');
    console.log('Usage: install-hooks [options]');
    console.log('');
    console.log('Options:');
    console.log('  --force      Overwrite existing hooks');
    console.log('  -h, --help   Show this help message');
  }

  // Main installation process
  async run(args = []) {
    // Parse arguments
    this.parseArgs(args);

    this.print('=== Installing Docker-First Development Git Hooks ===', 'blue');
    console.log('');

    // Validate environment
    this.checkGitRepo();
    this.ensureHooksDir();

    // Define hooks to install
    const hooks = [
      {
        name: 'pre-push',
        source: '.claude/hooks/pre-push-docker-tests.sh'
      },
      {
        name: 'pre-commit',
        source: '.claude/hooks/docker-first-enforcement.sh'
      }
    ];

    // Look for available hooks
    console.log('');
    this.print('Looking for available hooks...', 'blue');

    let installedCount = 0;
    let availableHooks = [];

    for (const hook of hooks) {
      const sourcePath = path.join(this.projectRoot, hook.source);
      if (fs.existsSync(sourcePath)) {
        availableHooks.push(hook);
      }
    }

    if (availableHooks.length === 0) {
      this.print('No hook files found in .claude/hooks/', 'yellow');
      this.print('Please ensure hook files exist before running this script', 'yellow');
      process.exit(1);
    }

    console.log('');
    this.print(`Found ${availableHooks.length} hook(s) to install`, 'green');
    console.log('');

    // Install each hook
    for (const hook of availableHooks) {
      const sourcePath = path.join(this.projectRoot, hook.source);
      const success = await this.installHook(hook.name, sourcePath);
      if (success) {
        installedCount++;
      }
    }

    // Summary
    console.log('');
    this.print('=== Installation Summary ===', 'blue');

    if (installedCount > 0) {
      this.print(`✅ Successfully installed ${installedCount} hook(s)`, 'green');
      console.log('');
      this.print('Git hooks are now active. They will:', 'green');
      this.print('  • Enforce Docker-first development on pre-commit', 'green');
      this.print('  • Run Docker tests before push', 'green');
      console.log('');
      this.print('To bypass hooks temporarily, use --no-verify flag', 'yellow');
    } else {
      this.print('⚠️  No hooks were installed', 'yellow');
    }

    process.exit(installedCount > 0 ? 0 : 1);
  }
}

// CLI entry point
if (require.main === module) {
  const installer = new InstallHooks();
  installer.run(process.argv.slice(2)).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = InstallHooks;