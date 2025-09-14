#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Provider Router - Routes commands to appropriate provider implementation
 */
class ProviderRouter {
  constructor() {
    this.configPath = path.join(process.cwd(), '.claude', 'config.json');
    this.config = this.loadConfig();
    this.provider = this.getActiveProvider();
  }

  /**
   * Load configuration from config.json
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading config:', error.message);
    }
    return {};
  }

  /**
   * Determine active provider from config or environment
   */
  getActiveProvider() {
    // Priority: Environment variable > Config file > Default
    if (process.env.AUTOPM_PROVIDER) {
      return process.env.AUTOPM_PROVIDER;
    }

    if (this.config.projectManagement?.provider) {
      return this.config.projectManagement.provider;
    }

    // Default to GitHub if not configured
    return 'github';
  }

  /**
   * Execute command with appropriate provider
   */
  async execute(command, args = []) {
    console.log(`🔄 Using ${this.provider} provider for ${command}`);

    const providerModule = this.loadProviderModule(command);

    if (!providerModule) {
      console.error(`❌ Provider implementation not found for ${this.provider}/${command}`);
      process.exit(1);
    }

    try {
      // Parse command line arguments
      const options = this.parseArgs(args);

      // Get provider settings
      const settings = this.config.projectManagement?.settings?.[this.provider] || {};

      // Execute provider command
      const result = await providerModule.execute(options, settings);

      // Output results
      this.outputResults(result);

    } catch (error) {
      console.error(`❌ Error executing ${command}:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Load provider-specific module
   */
  loadProviderModule(command) {
    const modulePath = path.join(__dirname, this.provider, `${command}.js`);

    try {
      if (fs.existsSync(modulePath)) {
        return require(modulePath);
      }
    } catch (error) {
      console.error(`Error loading provider module:`, error.message);
    }

    return null;
  }

  /**
   * Parse command line arguments
   */
  parseArgs(args) {
    const options = {
      status: 'open',
      limit: 50
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--status':
          if (i + 1 < args.length) {
            options.status = args[++i];
          }
          break;
        case '--assignee':
          if (i + 1 < args.length) {
            options.assignee = args[++i];
          }
          break;
        case '--label':
          if (i + 1 < args.length) {
            options.label = args[++i];
          }
          break;
        case '--limit':
          if (i + 1 < args.length) {
            options.limit = parseInt(args[++i], 10);
          }
          break;
      }
    }

    return options;
  }

  /**
   * Output results in consistent format
   */
  outputResults(results) {
    if (!results || results.length === 0) {
      console.log('📋 No epics found matching criteria');
      return;
    }

    console.log(`\n📋 Found ${results.length} epic(s):\n`);

    results.forEach((epic, index) => {
      console.log(`${index + 1}. [${epic.id}] ${epic.title}`);
      console.log(`   Status: ${epic.status}`);
      if (epic.assignee) {
        console.log(`   Assignee: ${epic.assignee}`);
      }
      if (epic.childCount > 0) {
        console.log(`   Progress: ${epic.completedCount}/${epic.childCount} items completed`);
      }
      if (epic.labels && epic.labels.length > 0) {
        console.log(`   Labels: ${epic.labels.join(', ')}`);
      }
      console.log(`   URL: ${epic.url}`);
      console.log('');
    });
  }
}

// Export for use as module
module.exports = new ProviderRouter();

// CLI interface
if (require.main === module) {
  const router = new ProviderRouter();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (!command) {
    console.error('Usage: router.js <command> [options]');
    process.exit(1);
  }

  router.execute(command, args);
}