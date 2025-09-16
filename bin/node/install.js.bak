#!/usr/bin/env node

/**
 * ClaudeAutoPM Framework Installation Script
 * Migrated from install.sh to Node.js for cross-platform compatibility
 *
 * Features:
 * - Interactive configuration
 * - Fresh install and update support
 * - Backup and rollback
 * - Cross-platform (Windows, macOS, Linux)
 */

const path = require('path');
const fs = require('fs-extra');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Import utilities
const Logger = require('../../lib/utils/logger');
const FileSystem = require('../../lib/utils/filesystem');
const Prompts = require('../../lib/utils/prompts');
const Shell = require('../../lib/utils/shell');
const Config = require('../../lib/utils/config');

class Installer {
  constructor(options = {}) {
    // Initialize utilities with proper options
    const loggerOptions = {
      verbose: options.verbose || false,
      silent: options.silent || false
    };

    this.logger = new Logger(loggerOptions);
    this.fs = new FileSystem(this.logger);
    this.prompts = new Prompts(this.logger);
    this.shell = new Shell(this.logger);
    this.config = new Config(this.logger);

    // Set options
    this.options = {
      targetPath: options.path || process.cwd(),
      nonInteractive: options.yes || false,
      configPreset: options.config || null,
      skipEnv: options.noEnv || false,
      skipHooks: options.noHooks || false,
      verbose: options.verbose || false,
      update: options.update || false
    };

    // Set paths
    this.sourcePath = path.resolve(__dirname, '../../autopm');
    this.targetClaudePath = path.join(this.options.targetPath, '.claude');
    this.backupPath = null;
  }

  /**
   * Main installation process
   */
  async install() {
    try {
      this.logger.box('ClaudeAutoPM Framework Installer', 'cyan');

      // Check prerequisites
      await this.checkPrerequisites();

      // Detect installation type
      const isUpdate = await this.detectInstallationType();

      if (isUpdate) {
        await this.performUpdate();
      } else {
        await this.performFreshInstall();
      }

      this.logger.complete('Installation completed successfully!');
      await this.showPostInstallInstructions();

    } catch (error) {
      this.logger.error('Installation failed', error);

      if (this.backupPath) {
        await this.rollback();
      }

      process.exit(1);
    }
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    this.logger.header('Checking Prerequisites');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 16) {
      throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
    }
    this.logger.success(`Node.js ${nodeVersion} ✓`);

    // Check Git
    if (!await this.shell.commandExists('git')) {
      throw new Error('Git is required but not found in PATH');
    }
    this.logger.success('Git installed ✓');

    // Check if in git repository
    const isGitRepo = await this.shell.isGitRepo();
    if (!isGitRepo) {
      this.logger.warn('Not in a git repository. Some features may be limited.');
    }

    // Check source files exist
    if (!await this.fs.exists(this.sourcePath)) {
      throw new Error(`Source files not found at: ${this.sourcePath}`);
    }
    this.logger.success('Source files found ✓');
  }

  /**
   * Detect if this is an update or fresh install
   */
  async detectInstallationType() {
    const claudeExists = await this.fs.exists(this.targetClaudePath);
    const configExists = await this.config.isConfigured(this.options.targetPath);

    if (claudeExists || configExists) {
      this.logger.info('Existing installation detected');

      if (!this.options.nonInteractive) {
        const shouldUpdate = await this.prompts.confirm(
          'Update existing ClaudeAutoPM installation?',
          true
        );

        if (!shouldUpdate) {
          this.logger.info('Installation cancelled');
          process.exit(0);
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Perform fresh installation
   */
  async performFreshInstall() {
    this.logger.header('Starting Fresh Installation');

    // Get configuration
    const config = await this.getConfiguration();

    // Copy framework files
    await this.copyFrameworkFiles();

    // Generate CLAUDE.md
    await this.generateClaudeMd(config);

    // Setup environment
    if (!this.options.skipEnv) {
      await this.setupEnvironment();
    }

    // Install git hooks
    if (!this.options.skipHooks) {
      await this.installGitHooks();
    }

    // Save configuration
    await this.config.save(config, this.options.targetPath);

    // Initialize PM system
    await this.initializePMSystem();
  }

  /**
   * Perform update of existing installation
   */
  async performUpdate() {
    this.logger.header('Updating Existing Installation');

    // Create backup
    await this.createBackup();

    // Load existing configuration
    const existingConfig = await this.config.load(this.options.targetPath);

    // Update framework files
    await this.updateFrameworkFiles();

    // Merge CLAUDE.md if exists
    if (await this.fs.exists(path.join(this.options.targetPath, 'CLAUDE.md'))) {
      await this.mergeClaudeMd();
    }

    // Update configuration
    const updatedConfig = await this.updateConfiguration(existingConfig);
    await this.config.save(updatedConfig, this.options.targetPath);

    this.logger.success('Update completed successfully');
  }

  /**
   * Get configuration interactively or from preset
   */
  async getConfiguration() {
    let config;

    if (this.options.configPreset) {
      // Use preset configuration
      config = this.config.applyPreset(this.options.configPreset);
      this.logger.info(`Using preset configuration: ${this.options.configPreset}`);
    } else if (this.options.nonInteractive) {
      // Use default configuration
      config = this.config.getDefaultConfig();
      this.logger.info('Using default configuration');
    } else {
      // Interactive configuration
      config = await this.interactiveConfiguration();
    }

    return config;
  }

  /**
   * Interactive configuration
   */
  async interactiveConfiguration() {
    this.logger.header('Configuration Setup');

    const config = this.config.getDefaultConfig();

    // Select provider
    config.provider = await this.prompts.selectPlatform();

    // Select configuration type
    const configurationType = await this.prompts.selectConfiguration();

    if (configurationType === 'custom') {
      // Custom configuration
      config.features.docker_first_development = await this.prompts.confirm(
        'Enable Docker-first development?',
        false
      );

      if (config.features.docker_first_development) {
        config.features.enforce_docker_tests = await this.prompts.confirm(
          'Enforce Docker for all tests?',
          true
        );
      }

      config.features.kubernetes_devops_testing = await this.prompts.confirm(
        'Enable Kubernetes testing (KIND)?',
        false
      );

      if (config.features.kubernetes_devops_testing) {
        config.features.github_actions_k8s = await this.prompts.confirm(
          'Enable GitHub Actions K8s integration?',
          true
        );
      }

      // Execution strategy
      const strategies = [
        { name: 'Sequential (safe)', value: 'sequential' },
        { name: 'Adaptive (smart)', value: 'adaptive' },
        { name: 'Hybrid Parallel (performance)', value: 'hybrid-parallel' }
      ];

      config.executionStrategy = await this.prompts.select(
        'Select execution strategy:',
        strategies,
        'adaptive'
      );
    } else {
      // Apply preset
      const preset = this.config.getPresets()[configurationType];
      Object.assign(config, preset);
    }

    return config;
  }

  /**
   * Copy framework files to target
   */
  async copyFrameworkFiles() {
    this.logger.header('Copying Framework Files');

    const items = [
      '.claude/agents',
      '.claude/commands',
      '.claude/rules',
      '.claude/scripts',
      '.claude/checklists',
      '.claude/examples',
      '.claude/hooks',
      '.claude/base.md',
      '.claude/AGENT-REGISTRY.md',
      'scripts/safe-commit.sh',
      'scripts/setup-hooks.sh'
    ];

    let copied = 0;
    let skipped = 0;

    for (const item of items) {
      const sourcePath = path.join(this.sourcePath, item);
      const targetPath = path.join(this.options.targetPath, item);

      if (!await this.fs.exists(sourcePath)) {
        this.logger.warn(`Source not found: ${item}`);
        skipped++;
        continue;
      }

      await this.fs.ensureDir(path.dirname(targetPath));
      await this.fs.copy(sourcePath, targetPath, { overwrite: true });
      copied++;

      this.logger.debug(`Copied: ${item}`);
    }

    this.logger.success(`Copied ${copied} items, skipped ${skipped}`);
  }

  /**
   * Generate CLAUDE.md from template
   */
  async generateClaudeMd(config) {
    this.logger.header('Generating CLAUDE.md');

    const templatePath = path.join(
      this.sourcePath,
      '.claude/templates/claude-templates',
      `CLAUDE-${config.executionStrategy.toUpperCase()}.md`
    );

    const targetPath = path.join(this.options.targetPath, 'CLAUDE.md');

    if (!await this.fs.exists(templatePath)) {
      this.logger.warn(`Template not found for strategy: ${config.executionStrategy}`);
      return;
    }

    // Read template
    let content = await this.fs.readFile(templatePath);

    // Replace variables
    const replacements = {
      '{{PROJECT_NAME}}': path.basename(this.options.targetPath),
      '{{PROVIDER}}': config.provider,
      '{{DOCKER_ENABLED}}': config.features.docker_first_development,
      '{{K8S_ENABLED}}': config.features.kubernetes_devops_testing,
      '{{EXECUTION_STRATEGY}}': config.executionStrategy
    };

    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(key, 'g'), value);
    }

    // Write CLAUDE.md
    await this.fs.writeFile(targetPath, content);
    this.logger.success('CLAUDE.md generated');
  }

  /**
   * Setup environment variables
   */
  async setupEnvironment() {
    this.logger.header('Environment Setup');

    const env = {};

    // GitHub token
    if (!this.options.nonInteractive) {
      const githubToken = await this.prompts.askForToken('GitHub', false);
      if (githubToken) {
        env.GITHUB_TOKEN = githubToken;
      }
    }

    // Save environment
    if (Object.keys(env).length > 0) {
      await this.config.saveEnv(env, this.options.targetPath);
      this.logger.success('.env file created');
    } else {
      this.logger.info('No environment variables configured');
    }
  }

  /**
   * Install git hooks
   */
  async installGitHooks() {
    this.logger.header('Installing Git Hooks');

    const setupHooksPath = path.join(this.options.targetPath, 'scripts/setup-hooks.sh');

    if (await this.fs.exists(setupHooksPath)) {
      try {
        await this.shell.execInteractive('bash', [setupHooksPath]);
        this.logger.success('Git hooks installed');
      } catch (error) {
        this.logger.warn('Failed to install git hooks', error);
      }
    } else {
      this.logger.warn('setup-hooks.sh not found');
    }
  }

  /**
   * Initialize PM system
   */
  async initializePMSystem() {
    this.logger.header('Initializing PM System');

    // Create directories
    const dirs = [
      '.claude/epics',
      '.claude/prds',
      '.claude/context'
    ];

    for (const dir of dirs) {
      await this.fs.ensureDir(path.join(this.options.targetPath, dir));
    }

    // Update .gitignore
    await this.updateGitignore();

    this.logger.success('PM system initialized');
  }

  /**
   * Update .gitignore
   */
  async updateGitignore() {
    const gitignorePath = path.join(this.options.targetPath, '.gitignore');
    const additions = [
      '# ClaudeAutoPM',
      '.claude/.env',
      '.claude/epics/',
      '.claude/*.backup-*'
    ];

    let content = '';
    if (await this.fs.exists(gitignorePath)) {
      content = await this.fs.readFile(gitignorePath);
    }

    // Check if already added
    if (content.includes('# ClaudeAutoPM')) {
      return;
    }

    // Add entries
    content += '\n' + additions.join('\n') + '\n';
    await this.fs.writeFile(gitignorePath, content);

    this.logger.debug('Updated .gitignore');
  }

  /**
   * Create backup
   */
  async createBackup() {
    this.logger.info('Creating backup...');
    this.backupPath = await this.fs.backup(this.targetClaudePath);
  }

  /**
   * Rollback installation
   */
  async rollback() {
    if (!this.backupPath) {
      return;
    }

    this.logger.info('Rolling back installation...');

    try {
      await this.fs.remove(this.targetClaudePath);
      await this.fs.move(this.backupPath, this.targetClaudePath);
      this.logger.success('Rollback completed');
    } catch (error) {
      this.logger.error('Rollback failed', error);
    }
  }

  /**
   * Update framework files
   */
  async updateFrameworkFiles() {
    // Similar to copyFrameworkFiles but with change detection
    await this.copyFrameworkFiles();
  }

  /**
   * Merge CLAUDE.md files
   */
  async mergeClaudeMd() {
    this.logger.info('CLAUDE.md merge required');
    // This will be handled by the separate merge-claude.js script
  }

  /**
   * Update configuration
   */
  async updateConfiguration(existingConfig) {
    // Preserve user settings while updating framework defaults
    const defaultConfig = this.config.getDefaultConfig();
    return this.config.mergeConfig(defaultConfig, existingConfig);
  }

  /**
   * Show post-installation instructions
   */
  async showPostInstallInstructions() {
    this.logger.divider();
    this.logger.header('Next Steps');

    const instructions = [
      'Open Claude Code in this project',
      'Run: /pm:init to initialize the PM system',
      'Run: /init include rules from .claude/CLAUDE.md',
      'Start creating: /pm:prd-new feature-name'
    ];

    this.logger.list(instructions, true);
    this.logger.divider();
  }
}

// CLI setup
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options] [path]')
  .option('yes', {
    alias: 'y',
    describe: 'Non-interactive mode, accept defaults',
    type: 'boolean'
  })
  .option('config', {
    alias: 'c',
    describe: 'Use preset configuration',
    choices: ['minimal', 'docker', 'devops', 'performance']
  })
  .option('no-env', {
    describe: 'Skip environment setup',
    type: 'boolean'
  })
  .option('no-hooks', {
    describe: 'Skip git hooks installation',
    type: 'boolean'
  })
  .option('update', {
    alias: 'u',
    describe: 'Update existing installation',
    type: 'boolean'
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Verbose output',
    type: 'boolean'
  })
  .help('help')
  .alias('h', 'help')
  .version(false)
  .argv;

// Main execution
async function main() {
  const installer = new Installer({
    path: argv._[0],
    yes: argv.yes,
    config: argv.config,
    noEnv: argv.noEnv,
    noHooks: argv.noHooks,
    update: argv.update,
    verbose: argv.verbose
  });

  await installer.install();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = Installer;