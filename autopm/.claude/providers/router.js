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
    const options = {};

    // First non-option argument is often the primary parameter (like issue ID)
    let primaryParam = null;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--')) {
        // Handle option flags
        const optionName = arg.substring(2);

        // Boolean flags
        if (optionName === 'assign' || optionName === 'no-branch') {
          options[optionName.replace('-', '_')] = true;
        }
        // Options with values
        else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          const value = args[++i];
          options[optionName.replace('-', '_')] = value;
        }
        // Flags without values default to true
        else {
          options[optionName.replace('-', '_')] = true;
        }
      } else if (!primaryParam) {
        // First non-option argument
        primaryParam = arg;
      }
    }

    // Add primary parameter if exists
    if (primaryParam) {
      options.id = primaryParam;
    }

    // Set defaults for list command
    if (!options.status) {
      options.status = 'open';
    }
    if (!options.limit) {
      options.limit = 50;
    }

    return options;
  }

  /**
   * Output results in consistent format
   */
  outputResults(results) {
    // Handle different response types
    if (!results) {
      console.log('📋 No results returned');
      return;
    }

    // Handle action results (like issue:start)
    if (results.success !== undefined && results.actions) {
      this.outputActionResult(results);
      return;
    }

    // Handle list results (like epic:list)
    if (Array.isArray(results)) {
      this.outputListResults(results);
      return;
    }

    // Default: output as JSON
    console.log(JSON.stringify(results, null, 2));
  }

  /**
   * Output list results
   */
  outputListResults(results) {
    if (results.length === 0) {
      console.log('📋 No items found matching criteria');
      return;
    }

    console.log(`\n📋 Found ${results.length} item(s):\n`);

    results.forEach((item, index) => {
      console.log(`${index + 1}. [${item.id}] ${item.title}`);
      console.log(`   Status: ${item.status}`);
      if (item.assignee) {
        console.log(`   Assignee: ${item.assignee}`);
      }
      if (item.childCount > 0) {
        console.log(`   Progress: ${item.completedCount}/${item.childCount} items completed`);
      }
      if (item.labels && item.labels.length > 0) {
        console.log(`   Labels: ${item.labels.join(', ')}`);
      }
      console.log(`   URL: ${item.url}`);
      console.log('');
    });
  }

  /**
   * Output action result
   */
  outputActionResult(result) {
    if (result.success) {
      console.log(`\n✅ Successfully executed action\n`);

      if (result.issue) {
        console.log(`📋 Issue Details:`);
        console.log(`   ID: ${result.issue.id}`);
        console.log(`   Title: ${result.issue.title}`);
        console.log(`   Status: ${result.issue.status}`);
        if (result.issue.assignee) {
          console.log(`   Assignee: ${result.issue.assignee}`);
        }
        if (result.issue.branch) {
          console.log(`   Branch: ${result.issue.branch}`);
        }
        console.log(`   URL: ${result.issue.url}`);
      }

      if (result.actions && result.actions.length > 0) {
        console.log(`\n🎯 Actions performed:`);
        result.actions.forEach(action => {
          console.log(`   ✓ ${action}`);
        });
      }

      if (result.timestamp) {
        console.log(`\n⏰ Timestamp: ${result.timestamp}`);
      }
    } else {
      console.log(`\n❌ Action failed\n`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
    }
  }
}

// Export class and instance for testing
module.exports = {
  ProviderRouter,
  router: new ProviderRouter(),
  // For compatibility with existing code
  execute: (command, args) => new ProviderRouter().execute(command, args),
  loadConfig: () => new ProviderRouter().loadConfig(),
  getActiveProvider: () => new ProviderRouter().getActiveProvider()
};

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