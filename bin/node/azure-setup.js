#!/usr/bin/env node

/**
 * Azure DevOps Setup Script
 * Migrated from autopm/.claude/scripts/azure/setup.sh to Node.js
 *
 * Features:
 * - Azure DevOps credential collection and validation
 * - Connection testing via Azure DevOps REST API
 * - Directory structure creation
 * - YAML configuration generation
 * - Script permissions management
 * - Initial sync attempt
 * - Cross-platform compatibility
 */

const path = require('path');
const fs = require('fs-extra');
const https = require('https');
const { spawn } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const yaml = require('js-yaml');

// Import utilities
const Logger = require('../../lib/utils/logger');
const FileSystem = require('../../lib/utils/filesystem');
const Prompts = require('../../lib/utils/prompts');
const Config = require('../../lib/utils/config');

class AzureSetup {
  constructor(options = {}) {
    // Initialize utilities
    const loggerOptions = {
      verbose: options.verbose || false,
      silent: options.silent || false
    };

    this.logger = new Logger(loggerOptions);
    this.fs = new FileSystem(this.logger);
    this.prompts = new Prompts(this.logger);
    this.config = new Config(this.logger);

    // Set options
    this.options = {
      projectPath: options.projectPath || process.cwd(),
      interactive: !options.nonInteractive,
      verbose: options.verbose || false,
      silent: options.silent || false
    };

    // Set paths
    this.envPath = path.join(this.options.projectPath, '.claude', '.env');
    this.configPath = path.join(this.options.projectPath, '.claude', 'azure', 'config.yml');
    this.scriptsPath = path.join(this.options.projectPath, '.claude', 'scripts', 'azure');

    // Environment variables to collect
    this.envVars = {};

    // Colors (disabled in silent mode)
    this.colors = this.options.silent ? {
      green: '',
      yellow: '',
      red: '',
      blue: '',
      cyan: '',
      reset: ''
    } : {
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m'
    };

    // Directory structure to create
    this.directories = [
      '.claude/azure/cache/features',
      '.claude/azure/cache/stories',
      '.claude/azure/cache/tasks',
      '.claude/azure/user-stories',
      '.claude/azure/tasks',
      '.claude/azure/features',
      '.claude/azure/reports',
      '.claude/azure/imports',
      '.claude/azure/sync',
      '.claude/azure/archive'
    ];

    // For testing - allow dependency injection
    this.spawn = options.spawn || spawn;
    this.prompt = options.prompt || this.prompts.askQuestions.bind(this.prompts);
  }

  /**
   * Main setup process
   */
  async run() {
    try {
      if (!this.options.silent) {
        this.logger.info('🔧 Azure DevOps Integration Setup');
        this.logger.info('==================================');
      }

      // Check/create .env file
      await this.initializeEnvFile();

      // Load existing environment variables
      await this.loadExistingEnv();

      // Collect Azure DevOps credentials
      if (this.options.interactive) {
        await this.collectCredentials();
      }

      // Test connection
      const connectionResult = await this.testConnection();
      if (!connectionResult.success) {
        return {
          success: false,
          error: `Connection test failed: ${connectionResult.error || connectionResult.statusCode}`
        };
      }

      // Create directory structure
      await this.createDirectoryStructure();

      // Generate configuration file
      await this.generateConfig();

      // Set script permissions
      await this.setScriptPermissions();

      // Save environment variables
      await this.saveEnvironment();

      // Perform initial sync
      await this.performInitialSync();

      // Show completion message
      if (!this.options.silent) {
        await this.showCompletionMessage();
      }

      return {
        success: true,
        projectName: connectionResult.projectName
      };

    } catch (error) {
      this.logger.error('Azure DevOps setup failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if .env file exists
   */
  async envFileExists() {
    return await this.fs.exists(this.envPath);
  }

  /**
   * Initialize .env file
   */
  async initializeEnvFile() {
    const envExists = await this.envFileExists();

    if (!envExists) {
      // Ensure .claude directory exists
      await fs.ensureDir(path.dirname(this.envPath));

      // Try to copy from .env.example
      const examplePath = path.join(path.dirname(this.envPath), '.env.example');
      if (await this.fs.exists(examplePath)) {
        await this.createEnvFromExample();
      } else {
        // Create empty .env file
        await fs.writeFile(this.envPath, '');
      }

      if (!this.options.silent) {
        this.logger.info('Created .env file');
      }
    }
  }

  /**
   * Create .env from .env.example
   */
  async createEnvFromExample() {
    const examplePath = path.join(path.dirname(this.envPath), '.env.example');
    const content = await fs.readFile(examplePath, 'utf8');
    await fs.writeFile(this.envPath, content);
  }

  /**
   * Load existing environment variables
   */
  async loadExistingEnv() {
    try {
      const content = await fs.readFile(this.envPath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (key && value) {
            this.envVars[key] = value;
          }
        }
      }
    } catch (error) {
      // File doesn't exist or is empty, that's okay
    }
  }

  /**
   * Collect Azure DevOps credentials interactively
   */
  async collectCredentials() {
    if (!this.options.silent) {
      this.logger.info('📋 Azure DevOps Configuration');
      this.logger.info('-----------------------------');
      this.logger.info('Please provide your Azure DevOps details:');
    }

    const questions = [];

    // PAT Token
    if (!this.envVars.AZURE_DEVOPS_PAT) {
      questions.push({
        type: 'password',
        name: 'AZURE_DEVOPS_PAT',
        message: 'Personal Access Token (PAT)',
        mask: '*',
        validate: (input) => {
          if (!input || input.length < 10) {
            return 'Please enter a valid Personal Access Token';
          }
          return true;
        }
      });
    } else {
      if (!this.options.silent) {
        this.logger.info(`${this.colors.green}✓${this.colors.reset} PAT already configured`);
      }
    }

    // Organization
    if (!this.envVars.AZURE_DEVOPS_ORG) {
      questions.push({
        type: 'input',
        name: 'AZURE_DEVOPS_ORG',
        message: 'Organization name',
        validate: (input) => {
          if (!input || input.length < 1) {
            return 'Please enter your Azure DevOps organization name';
          }
          return true;
        }
      });
    } else {
      if (!this.options.silent) {
        this.logger.info(`${this.colors.green}✓${this.colors.reset} Organization: ${this.envVars.AZURE_DEVOPS_ORG}`);
      }
    }

    // Project
    if (!this.envVars.AZURE_DEVOPS_PROJECT) {
      questions.push({
        type: 'input',
        name: 'AZURE_DEVOPS_PROJECT',
        message: 'Project name',
        validate: (input) => {
          if (!input || input.length < 1) {
            return 'Please enter your Azure DevOps project name';
          }
          return true;
        }
      });
    } else {
      if (!this.options.silent) {
        this.logger.info(`${this.colors.green}✓${this.colors.reset} Project: ${this.envVars.AZURE_DEVOPS_PROJECT}`);
      }
    }

    if (questions.length > 0) {
      const answers = await this.prompt(questions);
      Object.assign(this.envVars, answers);
    }
  }

  /**
   * Test Azure DevOps API connection
   */
  async testConnection() {
    if (!this.options.silent) {
      this.logger.info('');
      this.logger.info('🔌 Testing Azure DevOps Connection');
      this.logger.info('-----------------------------------');
    }

    return new Promise((resolve) => {
      const { AZURE_DEVOPS_PAT, AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT } = this.envVars;

      if (!AZURE_DEVOPS_PAT || !AZURE_DEVOPS_ORG || !AZURE_DEVOPS_PROJECT) {
        resolve({
          success: false,
          error: 'Missing required Azure DevOps credentials'
        });
        return;
      }

      const auth = Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64');
      const options = {
        hostname: 'dev.azure.com',
        port: 443,
        path: `/${AZURE_DEVOPS_ORG}/_apis/projects/${AZURE_DEVOPS_PROJECT}?api-version=7.0`,
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': 'ClaudeAutoPM/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const project = JSON.parse(data);
              if (!this.options.silent) {
                this.logger.info(`${this.colors.green}✅ Connection successful!${this.colors.reset}`);
                this.logger.info(`Connected to project: ${project.name}`);
              }
              resolve({
                success: true,
                projectName: project.name,
                statusCode: 200
              });
            } catch (error) {
              resolve({
                success: false,
                error: 'Invalid response from Azure DevOps API',
                statusCode: res.statusCode
              });
            }
          } else {
            if (!this.options.silent) {
              this.logger.error(`${this.colors.red}❌ Connection failed (HTTP ${res.statusCode})${this.colors.reset}`);
              this.logger.error('Please check your credentials and try again');
            }
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: `HTTP ${res.statusCode}`
            });
          }
        });
      });

      req.on('error', (error) => {
        if (!this.options.silent) {
          this.logger.error(`${this.colors.red}❌ Connection failed${this.colors.reset}`);
          this.logger.error(`Network error: ${error.message}`);
        }
        resolve({
          success: false,
          error: `Network error: ${error.message}`
        });
      });

      req.end();
    });
  }

  /**
   * Create Azure directory structure
   */
  async createDirectoryStructure() {
    if (!this.options.silent) {
      this.logger.info('');
      this.logger.info('📁 Creating Directory Structure');
      this.logger.info('-------------------------------');
    }

    for (const dir of this.directories) {
      const dirPath = path.join(this.options.projectPath, dir);
      const exists = await fs.pathExists(dirPath);

      if (!exists) {
        await fs.ensureDir(dirPath);
        if (!this.options.silent) {
          this.logger.info(`  ✓ Created ${dir}`);
        }
      } else {
        if (!this.options.silent) {
          this.logger.info(`  • ${dir} exists`);
        }
      }
    }
  }

  /**
   * Generate Azure configuration file
   */
  async generateConfig() {
    if (!this.options.silent) {
      this.logger.info('');
      this.logger.info('⚙️ Creating Configuration');
      this.logger.info('-------------------------');
    }

    const configData = {
      '# Azure DevOps Configuration': null,
      '# Generated': new Date().toISOString(),
      azure_devops: {
        organization: this.envVars.AZURE_DEVOPS_ORG,
        project: this.envVars.AZURE_DEVOPS_PROJECT,
        api_version: '7.0'
      },
      defaults: {
        area_path: this.envVars.AZURE_DEVOPS_PROJECT,
        iteration_path: this.envVars.AZURE_DEVOPS_PROJECT,
        work_item_types: ['Feature', 'User Story', 'Task', 'Bug']
      },
      sync: {
        enabled: true,
        interval_minutes: 15,
        cache_ttl_days: 30
      },
      git: {
        auto_branch: true,
        branch_prefix: 'azure',
        link_commits: true,
        pr_template: true
      },
      features: {
        time_tracking: true,
        auto_assign: false,
        notifications: true,
        burndown_charts: true
      },
      team: {
        default_capacity_hours: 6,
        sprint_days: 10
      },
      aliases: {
        enabled: true,
        prefix: 'az'
      }
    };

    // Ensure config directory exists
    await fs.ensureDir(path.dirname(this.configPath));

    // Generate YAML content
    let yamlContent = `# Azure DevOps Configuration\n# Generated: ${new Date().toISOString()}\n\n`;
    yamlContent += yaml.dump({
      azure_devops: configData.azure_devops,
      defaults: configData.defaults,
      sync: configData.sync,
      git: configData.git,
      features: configData.features,
      team: configData.team,
      aliases: configData.aliases
    }, {
      indent: 2,
      lineWidth: 80
    });

    await fs.writeFile(this.configPath, yamlContent);

    if (!this.options.silent) {
      this.logger.info(`${this.colors.green}✓${this.colors.reset} Configuration created`);
    }
  }

  /**
   * Set executable permissions on Azure scripts
   */
  async setScriptPermissions() {
    if (!this.options.silent) {
      this.logger.info('');
      this.logger.info('🔐 Setting Script Permissions');
      this.logger.info('-----------------------------');
    }

    try {
      // Check if scripts directory exists
      if (await fs.pathExists(this.scriptsPath)) {
        const files = await fs.readdir(this.scriptsPath);
        const scriptFiles = files.filter(file => file.endsWith('.sh'));

        for (const file of scriptFiles) {
          const filePath = path.join(this.scriptsPath, file);
          try {
            // Set executable permissions (owner read/write/execute)
            await fs.chmod(filePath, 0o755);
          } catch (error) {
            // Ignore permission errors on Windows
            if (process.platform !== 'win32') {
              this.logger.warn(`Could not set permissions for ${file}: ${error.message}`);
            }
          }
        }
      }

      if (!this.options.silent) {
        this.logger.info(`${this.colors.green}✓${this.colors.reset} Scripts are executable`);
      }
    } catch (error) {
      // Non-critical error, continue
      this.logger.warn(`Could not set script permissions: ${error.message}`);
    }
  }

  /**
   * Save environment variables to .env file
   */
  async saveEnvironment() {
    try {
      // Ensure .claude directory exists
      await fs.ensureDir(path.dirname(this.envPath));

      // Read existing content
      let existingContent = '';
      try {
        existingContent = await fs.readFile(this.envPath, 'utf8');
      } catch (error) {
        // File doesn't exist, that's okay
      }

      // Parse existing variables to avoid duplicates
      const existingVars = new Set();
      const lines = existingContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key] = trimmed.split('=');
          if (key) {
            existingVars.add(key);
          }
        }
      }

      // Append new variables
      let newContent = existingContent.trim();
      if (newContent && !newContent.endsWith('\n')) {
        newContent += '\n';
      }

      const azureVars = ['AZURE_DEVOPS_PAT', 'AZURE_DEVOPS_ORG', 'AZURE_DEVOPS_PROJECT'];
      const newVars = azureVars.filter(key =>
        this.envVars[key] && !existingVars.has(key)
      );

      if (newVars.length > 0) {
        if (newContent) {
          newContent += '\n';
        }
        newContent += '# Azure DevOps Configuration\n';
        for (const key of newVars) {
          newContent += `${key}=${this.envVars[key]}\n`;
        }
      }

      // Write to file
      await fs.writeFile(this.envPath, newContent);

      // Set secure permissions (owner read/write only)
      if (process.platform !== 'win32') {
        await fs.chmod(this.envPath, 0o600);
      }

    } catch (error) {
      throw new Error(`Failed to save environment variables: ${error.message}`);
    }
  }

  /**
   * Perform initial sync with Azure DevOps
   */
  async performInitialSync() {
    if (!this.options.silent) {
      this.logger.info('');
      this.logger.info('🔄 Performing Initial Sync');
      this.logger.info('--------------------------');
    }

    try {
      const syncScript = path.join(this.scriptsPath, 'sync.sh');

      if (await fs.pathExists(syncScript)) {
        if (!this.options.silent) {
          this.logger.info('Fetching recent work items...');
        }

        return new Promise((resolve) => {
          const child = this.spawn(syncScript, ['--quick'], {
            cwd: this.options.projectPath,
            stdio: this.options.silent ? 'ignore' : 'inherit'
          });

          child.on('close', (code) => {
            if (code === 0) {
              if (!this.options.silent) {
                this.logger.info('Initial sync completed');
              }
            } else {
              if (!this.options.silent) {
                this.logger.warn('Sync will be available after first command run');
              }
            }
            resolve();
          });

          child.on('error', () => {
            if (!this.options.silent) {
              this.logger.warn('Sync will be available after first command run');
            }
            resolve();
          });
        });
      } else {
        if (!this.options.silent) {
          this.logger.warn('Sync script not found, skipping initial sync');
        }
      }
    } catch (error) {
      // Non-critical error
      if (!this.options.silent) {
        this.logger.warn('Sync will be available after first command run');
      }
    }
  }

  /**
   * Show completion message
   */
  async showCompletionMessage() {
    this.logger.info('');
    this.logger.info('==================================');
    this.logger.info(`${this.colors.green}✅ Azure DevOps Setup Complete!${this.colors.reset}`);
    this.logger.info('==================================');
    this.logger.info('');
    this.logger.info('📋 Quick Start Guide:');
    this.logger.info('--------------------');
    this.logger.info('1. Initialize in Claude: /azure:init');
    this.logger.info('2. View commands: /azure:help');
    this.logger.info('3. Start daily workflow: /azure:standup');
    this.logger.info('4. Get next task: /azure:next-task');
    this.logger.info('');
    this.logger.info('📚 Documentation:');
    this.logger.info('  • Commands: .claude/commands/azure/README.md');
    this.logger.info('  • Aliases: .claude/commands/azure/aliases.md');
    this.logger.info('  • Config: .claude/azure/config.yml');
    this.logger.info('');
    this.logger.info('🚀 Ready to use Azure DevOps integration!');
  }
}

// CLI interface
if (require.main === module) {
  const argv = yargs(hideBin(process.argv))
    .option('path', {
      alias: 'p',
      describe: 'Project path',
      type: 'string',
      default: process.cwd()
    })
    .option('non-interactive', {
      alias: 'n',
      describe: 'Run in non-interactive mode',
      type: 'boolean',
      default: false
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Verbose output',
      type: 'boolean',
      default: false
    })
    .option('silent', {
      alias: 's',
      describe: 'Silent mode',
      type: 'boolean',
      default: false
    })
    .help()
    .argv;

  const setup = new AzureSetup({
    projectPath: argv.path,
    nonInteractive: argv.nonInteractive,
    verbose: argv.verbose,
    silent: argv.silent
  });

  setup.run()
    .then((result) => {
      if (!result.success) {
        console.error('Azure DevOps setup failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Azure DevOps setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = AzureSetup;