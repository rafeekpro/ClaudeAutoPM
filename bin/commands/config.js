#!/usr/bin/env node

/**
 * ClaudeAutoPM Config Command
 * Manage and display ClaudeAutoPM configuration
 */

const fs = require('fs-extra');
const path = require('path');

class ConfigCommand {
  constructor() {
    this.configPath = path.join(process.cwd(), '.claude', 'config.json');
    this.envPath = path.join(process.cwd(), '.claude', '.env');
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

    // Features
    if (config.features) {
      const dockerStatus = config.features.dockerFirst ? '✅ Enabled' : '❌ Disabled';
      console.log(`│ Docker First:    ${this.padRight(dockerStatus, 22)} │`);

      const k8sStatus = config.features.kubernetes ? '✅ Enabled' : '❌ Disabled';
      console.log(`│ Kubernetes:      ${this.padRight(k8sStatus, 22)} │`);

      if (config.features.cicd) {
        console.log(`│ CI/CD:           ${this.padRight(config.features.cicd, 22)} │`);
      }
    }

    // Execution strategy
    if (config.execution?.strategy) {
      console.log(`│ Execution:       ${this.padRight(config.execution.strategy, 22)} │`);
    }

    // Current team
    if (config.teams?.current) {
      console.log(`│ Team:            ${this.padRight(config.teams.current, 22)} │`);
    }

    console.log('└─────────────────────────────────────────┘\n');
  }

  /**
   * Helper to pad strings
   */
  padRight(str, length) {
    return str.padEnd(length);
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

    const providerName = provider === 'azure' ? 'Azure DevOps' : 'GitHub';
    console.log(`✅ Switched to ${providerName}`);
  }
}

module.exports = ConfigCommand;