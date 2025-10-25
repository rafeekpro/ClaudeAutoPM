#!/usr/bin/env node

/**
 * ClaudeAutoPM Config Command
 * Manage and display ClaudeAutoPM configuration
 */

const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');

class ConfigCommand {
  constructor() {
    this.configPath = path.join(process.cwd(), '.claude', 'config.json');
    this.envPath = path.join(process.cwd(), '.claude', '.env');

    // Load .env file if it exists
    this.loadEnv();
  }

  /**
   * Load environment variables from .claude/.env
   */
  loadEnv() {
    try {
      if (fs.existsSync(this.envPath)) {
        dotenv.config({ path: this.envPath });
      }
    } catch (error) {
      // Silently ignore - env file is optional
    }
  }

  /**
   * Load configuration
   */
  async loadConfig() {
    try {
      if (!await fs.pathExists(this.configPath)) {
        return null;
      }
      return await fs.readJson(this.configPath);
    } catch (error) {
      console.error(`Error loading config: ${error.message}`);
      return null;
    }
  }

  /**
   * Save configuration
   */
  async saveConfig(config) {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, config, { spaces: 2 });
    } catch (error) {
      console.error(`Error saving config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Show current configuration
   */
  async show() {
    const config = await this.loadConfig();

    if (!config) {
      console.error('❌ No configuration found. Run: autopm install');
      return;
    }

    // Build configuration display
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│       ClaudeAutoPM Configuration        │');
    console.log('├─────────────────────────────────────────┤');

    // Provider info
    console.log(`│ Provider:        ${this.padRight(config.provider || 'not set', 22)} │`);

    if (config.provider === 'azure' && config.providers?.azure) {
      const azure = config.providers.azure;
      console.log(`│ Organization:    ${this.padRight(azure.organization || 'not set', 22)} │`);
      console.log(`│ Project:         ${this.padRight(azure.project || 'not set', 22)} │`);

      const hasToken = process.env.AZURE_DEVOPS_PAT ? '***configured***' : 'not set';
      console.log(`│ Token:           ${this.padRight(hasToken, 22)} │`);
    } else if (config.provider === 'github' && config.providers?.github) {
      const github = config.providers.github;
      console.log(`│ Owner:           ${this.padRight(github.owner || 'not set', 22)} │`);
      console.log(`│ Repository:      ${this.padRight(github.repo || 'not set', 22)} │`);

      const hasToken = process.env.GITHUB_TOKEN ? '***configured***' : 'not set';
      console.log(`│ Token:           ${this.padRight(hasToken, 22)} │`);
    }

    console.log('│                                         │');

    // Installation Configuration - check both new and legacy formats
    const dockerEnabled = config.tools?.docker?.enabled || config.features?.dockerFirst || false;
    const dockerFirst = config.tools?.docker?.first || false;
    const dockerStatus = dockerEnabled ? (dockerFirst ? '✅ Enabled (First)' : '✅ Enabled') : '❌ Disabled';
    console.log(`│ Docker:          ${this.padRight(dockerStatus, 22)} │`);

    const k8sEnabled = config.tools?.kubernetes?.enabled || config.features?.kubernetes || false;
    const k8sStatus = k8sEnabled ? '✅ Enabled' : '❌ Disabled';
    console.log(`│ Kubernetes:      ${this.padRight(k8sStatus, 22)} │`);

    // Execution strategy - check both formats
    let executionStrategy = config.execution_strategy?.mode || config.execution_strategy || config.execution?.strategy || 'adaptive';
    // Handle if it's still an object
    if (typeof executionStrategy === 'object') {
      executionStrategy = executionStrategy.mode || 'adaptive';
    }
    console.log(`│ Execution:       ${this.padRight(executionStrategy, 22)} │`);

    // Show parallel limit if hybrid strategy
    if (executionStrategy === 'hybrid' && config.parallel_limit) {
      console.log(`│ Parallel Limit:  ${this.padRight(config.parallel_limit.toString(), 22)} │`);
    }

    console.log('│                                         │');

    // MCP Configuration - check actual .md files in project
    const mcpActiveServers = config.mcp?.activeServers || [];
    let mcpAvailableServers = 0;

    // Count actual server definition files (.md) in .claude/mcp/
    const mcpDir = path.join(process.cwd(), '.claude', 'mcp');
    if (await fs.pathExists(mcpDir)) {
      try {
        const files = await fs.readdir(mcpDir);
        mcpAvailableServers = files.filter(f => f.endsWith('.md') && f !== 'MCP-REGISTRY.md').length;
      } catch (error) {
        // Ignore error
      }
    }

    let mcpStatus;
    if (mcpActiveServers.length > 0) {
      mcpStatus = `✅ ${mcpActiveServers.length} active (${mcpAvailableServers} total)`;
    } else if (mcpAvailableServers > 0) {
      mcpStatus = `⚠️  ${mcpAvailableServers} available, 0 active`;
    } else {
      mcpStatus = '⚪ No servers installed';
    }
    console.log(`│ MCP:             ${this.padRight(mcpStatus, 22)} │`);

    // Features - optional/legacy features
    const autoCommit = config.features?.autoCommit ? '✅ Enabled' : '❌ Disabled';
    console.log(`│ Auto Commit:     ${this.padRight(autoCommit, 22)} │`);

    // CI/CD
    const cicdPlatform = config.features?.cicd || 'not configured';
    console.log(`│ CI/CD:           ${this.padRight(cicdPlatform, 22)} │`);

    // Current team
    const currentTeam = config.teams?.current || 'base';
    console.log(`│ Team:            ${this.padRight(currentTeam, 22)} │`);

    // Environment
    const environment = config.environment || 'development';
    console.log(`│ Environment:     ${this.padRight(environment, 22)} │`)

    console.log('└─────────────────────────────────────────┘\n');

    // Show configuration issues and how to fix them
    const issues = [];

    if (!config.provider || config.provider === 'not set') {
      issues.push({
        icon: '⚠️',
        problem: 'Provider not configured',
        solution: 'Run: autopm config set provider github  (or azure)'
      });
    }

    if (config.provider === 'github') {
      const github = config.providers?.github;
      if (!github?.owner || github.owner === 'not set') {
        issues.push({
          icon: '⚠️',
          problem: 'GitHub owner not set',
          solution: 'Run: autopm config set github.owner YOUR_USERNAME'
        });
      }
      if (!github?.repo || github.repo === 'not set') {
        issues.push({
          icon: '⚠️',
          problem: 'GitHub repository not set',
          solution: 'Run: autopm config set github.repo YOUR_REPO'
        });
      }
      if (!process.env.GITHUB_TOKEN) {
        issues.push({
          icon: '⚠️',
          problem: 'GitHub token not set',
          solution: 'Add to .claude/.env: GITHUB_TOKEN=ghp_your_token_here'
        });
      }
    }

    if (config.provider === 'azure') {
      const azure = config.providers?.azure;
      if (!azure?.organization) {
        issues.push({
          icon: '⚠️',
          problem: 'Azure organization not set',
          solution: 'Run: autopm config set azure.organization YOUR_ORG'
        });
      }
      if (!azure?.project) {
        issues.push({
          icon: '⚠️',
          problem: 'Azure project not set',
          solution: 'Run: autopm config set azure.project YOUR_PROJECT'
        });
      }
      if (!process.env.AZURE_DEVOPS_PAT) {
        issues.push({
          icon: '⚠️',
          problem: 'Azure DevOps token not set',
          solution: 'Add to .claude/.env: AZURE_DEVOPS_PAT=your_token_here'
        });
      }
    }

    if (mcpActiveServers.length === 0) {
      if (mcpAvailableServers > 0) {
        issues.push({
          icon: 'ℹ️',
          problem: `${mcpAvailableServers} MCP server(s) available but not active`,
          solution: 'Run: autopm mcp list  (then: autopm mcp enable <server>)'
        });
      } else {
        issues.push({
          icon: 'ℹ️',
          problem: 'No MCP servers installed',
          solution: 'Add servers from examples: cp .claude/examples/mcp/*.md .claude/mcp/'
        });
      }
    }

    // Display issues if any
    if (issues.length > 0) {
      console.log('📋 Configuration Issues:\n');
      issues.forEach(issue => {
        console.log(`${issue.icon}  ${issue.problem}`);
        console.log(`   → ${issue.solution}\n`);
      });
    }

    // Show available commands hint
    console.log('💡 Quick Commands:');
    console.log('  autopm config validate           - Check configuration');
    console.log('  autopm mcp check                 - Check MCP requirements');
    console.log('  autopm config --help             - Show all options\n');
  }

  /**
   * Helper to pad strings
   */
  padRight(str, length) {
    const s = String(str || '');
    return s.padEnd(length);
  }

  /**
   * Set configuration value
   */
  async set(key, value) {
    const config = await this.loadConfig() || {};

    // Handle nested keys
    if (key.includes('.')) {
      const parts = key.split('.');

      // Handle provider-specific shortcuts (e.g., azure.organization -> providers.azure.organization)
      if ((parts[0] === 'azure' || parts[0] === 'github') && parts.length > 1) {
        parts.unshift('providers');
      }

      let current = config;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = value;
    } else {
      // Validate provider values
      if (key === 'provider') {
        const validProviders = ['github', 'azure'];
        if (!validProviders.includes(value)) {
          console.error(`❌ Invalid provider: ${value}. Valid options: ${validProviders.join(', ')}`);
          return;
        }

        // Initialize provider config if needed
        if (!config.providers) {
          config.providers = {};
        }
        if (!config.providers[value]) {
          config.providers[value] = {};
        }
      }

      config[key] = value;
    }

    await this.saveConfig(config);

    // Format the confirmation message
    const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    console.log(`✅ ${displayKey} set to: ${value}`);

    // Show helpful information for provider setup
    if (key === 'provider') {
      console.log('');
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log(`│  ${value === 'github' ? 'GitHub' : 'Azure DevOps'} Provider Configuration`);
      console.log('├─────────────────────────────────────────────────────────────┤');

      if (value === 'github') {
        console.log('│  Required Settings:');
        console.log('│  • Repository owner/organization name');
        console.log('│  • Repository name');
        console.log('│  • Personal Access Token (PAT)');
        console.log('│');
        console.log('│  Setup Commands:');
        console.log('│  1. Set owner:     autopm config set github.owner YOUR_USERNAME');
        console.log('│  2. Set repo:      autopm config set github.repo YOUR_REPO');
        console.log('│  3. Add PAT:       Edit .claude/.env and add:');
        console.log('│                    GITHUB_TOKEN=ghp_your_token_here');
        console.log('│');
        console.log('│  Create a GitHub Personal Access Token:');
        console.log('│  1. Go to: https://github.com/settings/tokens');
        console.log('│  2. Click "Generate new token (classic)"');
        console.log('│  3. Give it a name and select scopes:');
        console.log('│     - repo (all)');
        console.log('│     - workflow (if using GitHub Actions)');
        console.log('│  4. Generate and copy the token');
        console.log('│');
        console.log('│  Verify setup:     autopm config validate');
      } else if (value === 'azure') {
        console.log('│  Required Settings:');
        console.log('│  • Organization name');
        console.log('│  • Project name');
        console.log('│  • Personal Access Token (PAT)');
        console.log('│');
        console.log('│  Setup Commands:');
        console.log('│  1. Set org:       autopm config set azure.organization YOUR_ORG');
        console.log('│  2. Set project:   autopm config set azure.project YOUR_PROJECT');
        console.log('│  3. Add PAT:       Edit .claude/.env and add:');
        console.log('│                    AZURE_DEVOPS_PAT=your_token_here');
        console.log('│');
        console.log('│  Create an Azure DevOps Personal Access Token:');
        console.log('│  1. Go to: https://dev.azure.com/YOUR_ORG/_usersSettings/tokens');
        console.log('│  2. Click "+ New Token"');
        console.log('│  3. Give it a name and select scopes:');
        console.log('│     - Work Items: Read, write, & manage');
        console.log('│     - Code: Read & write');
        console.log('│  4. Create and copy the token');
        console.log('│');
        console.log('│  Verify setup:     autopm config validate');
      }

      console.log('└─────────────────────────────────────────────────────────────┘');
      console.log('');
    }
  }

  /**
   * Toggle boolean feature
   */
  async toggle(feature) {
    const config = await this.loadConfig() || {};

    if (!config.features) {
      config.features = {};
    }

    // Map feature names to config keys
    const featureMap = {
      'docker-first': 'dockerFirst',
      'kubernetes': 'kubernetes',
      'mcp': 'mcp',
      'auto-commit': 'autoCommit'
    };

    const configKey = featureMap[feature] || feature;
    config.features[configKey] = !config.features[configKey];

    await this.saveConfig(config);

    const status = config.features[configKey] ? 'Enabled' : 'Disabled';
    const displayName = feature.split('-').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');

    console.log(`✅ ${displayName}: ${status}`);
  }

  /**
   * Validate configuration
   */
  async validate() {
    const config = await this.loadConfig();

    if (!config) {
      console.error('❌ No configuration found');
      return false;
    }

    let valid = true;

    // Validate based on provider
    if (config.provider === 'azure') {
      if (!config.providers?.azure?.organization) {
        console.error('❌ Missing Azure organization');
        valid = false;
      }
      if (!config.providers?.azure?.project) {
        console.error('❌ Missing Azure project');
        valid = false;
      }
      if (!process.env.AZURE_DEVOPS_PAT) {
        console.error('❌ Missing AZURE_DEVOPS_PAT environment variable');
        valid = false;
      }

      if (valid) {
        console.log('✅ Azure DevOps configuration valid');
      }
    } else if (config.provider === 'github') {
      if (!config.providers?.github?.owner) {
        console.error('❌ Missing GitHub owner');
        valid = false;
      }
      if (!config.providers?.github?.repo) {
        console.error('❌ Missing GitHub repository');
        valid = false;
      }
      if (!process.env.GITHUB_TOKEN) {
        console.error('❌ Missing GITHUB_TOKEN environment variable');
        valid = false;
      }

      if (valid) {
        console.log('✅ GitHub configuration valid');
      }
    }

    // Check directories
    const requiredDirs = ['.claude', '.claude/agents', '.claude/commands'];
    for (const dir of requiredDirs) {
      if (!await fs.pathExists(dir)) {
        console.error(`❌ Missing directory: ${dir}`);
        valid = false;
      } else {
        console.log(`✅ Directory exists: ${dir}`);
      }
    }

    return valid;
  }

  /**
   * Interactive initialization
   */
  async init() {
    // This would use inquirer for interactive prompts
    console.log('Interactive configuration coming soon...');
    console.log('For now, use: autopm config set <key> <value>');
  }

  /**
   * Quick switch between providers
   */
  async switch(provider) {
    await this.set('provider', provider);
    // The set method will handle showing the configuration guide
  }
}

// Export for yargs command structure
module.exports = {
  command: 'config <action> [key] [value]',
  desc: 'Manage ClaudeAutoPM configuration and provider settings',
  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Configuration action to perform',
        type: 'string',
        choices: ['show', 'set', 'get', 'validate', 'switch', 'toggle', 'init']
      })
      .positional('key', {
        describe: 'Configuration key (for set/get/toggle)',
        type: 'string'
      })
      .positional('value', {
        describe: 'Configuration value (for set)',
        type: 'string'
      })
      .example('$0 config show', 'Display current configuration')
      .example('$0 config set provider azure', 'Set provider to Azure DevOps')
      .example('$0 config set azure.organization myorg', 'Set Azure organization')
      .example('$0 config switch github', 'Quick switch to GitHub provider')
      .example('$0 config validate', 'Validate current configuration')
      .example('$0 config toggle docker-first', 'Toggle Docker-first feature');
  },
  handler: async (argv) => {
    try {
      const cmd = new ConfigCommand();

      switch (argv.action) {
        case 'show':
          await cmd.show();
          break;

        case 'set':
          if (!argv.key || argv.value === undefined) {
            console.error('❌ Both key and value are required for set command');
            console.error('Usage: autopm config set <key> <value>');
            process.exit(1);
          }
          await cmd.set(argv.key, argv.value);
          break;

        case 'get':
          if (!argv.key) {
            console.error('❌ Key is required for get command');
            console.error('Usage: autopm config get <key>');
            process.exit(1);
          }
          const config = await cmd.loadConfig();
          const value = argv.key.split('.').reduce((obj, key) => obj?.[key], config);
          console.log(value || 'Not set');
          break;

        case 'validate':
          const valid = await cmd.validate();
          process.exit(valid ? 0 : 1);
          break;

        case 'switch':
          if (!argv.key) {
            console.error('❌ Provider name is required for switch command');
            console.error('Usage: autopm config switch <provider>');
            process.exit(1);
          }
          await cmd.switch(argv.key);
          break;

        case 'toggle':
          if (!argv.key) {
            console.error('❌ Feature name is required for toggle command');
            console.error('Usage: autopm config toggle <feature>');
            process.exit(1);
          }
          await cmd.toggle(argv.key);
          break;

        case 'init':
          await cmd.init();
          break;

        default:
          console.error(`❌ Unknown action: ${argv.action}`);
          console.error('Valid actions: show, set, get, validate, switch, toggle, init');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
};

// Export the class for testing
module.exports.ConfigCommand = ConfigCommand;