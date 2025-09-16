#!/usr/bin/env node

/**
 * ClaudeAutoPM CLI - Node.js implementation
 * Migrated from autopm.sh for cross-platform support
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// Use the colors module for consistency
const colors = require('../../lib/utils/colors');

// Package info
const packageJson = require('../../package.json');
const VERSION = packageJson.version;

// Paths
const SCRIPT_DIR = __dirname;
const PACKAGE_DIR = path.resolve(SCRIPT_DIR, '../..');

// Script locations
const SCRIPTS = {
  install: path.join(SCRIPT_DIR, 'install.js'),
  merge: path.join(SCRIPT_DIR, 'merge-claude.js'),
  setupEnv: path.join(SCRIPT_DIR, 'setup-env.js')
};

// Fallback to bash scripts if Node versions don't exist
const BASH_SCRIPTS = {
  install: path.join(PACKAGE_DIR, 'install', 'install.sh'),
  merge: path.join(PACKAGE_DIR, 'install', 'merge-claude.sh'),
  setupEnv: path.join(PACKAGE_DIR, 'install', 'setup-env.sh')
};

class AutoPMCLI {
  constructor() {
    this.args = process.argv.slice(2);
    this.command = this.args[0];
    this.commandArgs = this.args.slice(1);
  }

  /**
   * Display help message
   */
  showHelp() {
    console.log(colors.bold('\n🤖 ClaudeAutoPM - Autonomous Project Management Framework\n'));
    console.log(colors.cyan(`Version: ${VERSION}\n`));
    console.log('Usage: autopm <command> [options]\n');
    console.log('Commands:');
    console.log('  install              Install ClaudeAutoPM in current directory');
    console.log('  merge [file]         Merge Claude instructions into CLAUDE.md');
    console.log('  setup-env            Setup environment variables');
    console.log('  --version, -v        Show version');
    console.log('  --help, -h           Show this help message');
    console.log('\nExamples:');
    console.log('  autopm install       # Interactive installation');
    console.log('  autopm install 3     # Install with Full DevOps preset');
    console.log('  autopm merge         # Merge CLAUDE.md updates');
    console.log('\nFor more information: https://github.com/rafeekpro/ClaudeAutoPM');
  }

  /**
   * Show version
   */
  showVersion() {
    console.log(VERSION);
  }

  /**
   * Execute a script (Node.js or bash)
   */
  executeScript(scriptPath, args = [], options = {}) {
    const isNodeScript = scriptPath.endsWith('.js');
    let command, scriptArgs;

    if (isNodeScript) {
      command = 'node';
      scriptArgs = [scriptPath, ...args];
    } else {
      command = 'bash';
      scriptArgs = [scriptPath, ...args];
    }

    try {
      const result = spawn(command, scriptArgs, {
        stdio: 'inherit',
        shell: false,
        ...options
      });

      result.on('error', (err) => {
        console.error(colors.red(`Error executing script: ${err.message}`));
        process.exit(1);
      });

      result.on('close', (code) => {
        process.exit(code || 0);
      });
    } catch (error) {
      console.error(colors.red(`Failed to execute: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Route to install command
   */
  async runInstall() {
    const scriptPath = fs.existsSync(SCRIPTS.install) ? SCRIPTS.install : BASH_SCRIPTS.install;

    if (!fs.existsSync(scriptPath)) {
      console.error(colors.red('Error: Install script not found'));
      console.error('Please reinstall ClaudeAutoPM: npm install -g claude-autopm');
      process.exit(1);
    }

    this.executeScript(scriptPath, this.commandArgs);
  }

  /**
   * Route to merge command
   */
  async runMerge() {
    const scriptPath = fs.existsSync(SCRIPTS.merge) ? SCRIPTS.merge : BASH_SCRIPTS.merge;

    if (!fs.existsSync(scriptPath)) {
      console.error(colors.red('Error: Merge script not found'));
      process.exit(1);
    }

    this.executeScript(scriptPath, this.commandArgs);
  }

  /**
   * Route to setup-env command
   */
  async runSetupEnv() {
    const scriptPath = fs.existsSync(SCRIPTS.setupEnv) ? SCRIPTS.setupEnv : BASH_SCRIPTS.setupEnv;

    if (!fs.existsSync(scriptPath)) {
      console.error(colors.red('Error: Setup-env script not found'));
      process.exit(1);
    }

    this.executeScript(scriptPath, this.commandArgs);
  }

  /**
   * Main CLI entry point
   */
  async run() {
    // Handle no arguments
    if (this.args.length === 0) {
      this.showHelp();
      return;
    }

    // Route commands
    switch (this.command) {
      case '--help':
      case '-h':
      case 'help':
        this.showHelp();
        break;

      case '--version':
      case '-v':
      case 'version':
        this.showVersion();
        break;

      case 'install':
        await this.runInstall();
        break;

      case 'merge':
      case 'merge-claude':
        await this.runMerge();
        break;

      case 'setup-env':
      case 'setup':
        await this.runSetupEnv();
        break;

      default:
        console.error(colors.red(`Error: Unknown command '${this.command}'`));
        console.log('\nRun "autopm --help" for usage information');
        process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const cli = new AutoPMCLI();
  cli.run().catch(error => {
    console.error(colors.red('Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = AutoPMCLI;