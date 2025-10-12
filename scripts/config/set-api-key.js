#!/usr/bin/env node
/**
 * @fileoverview Config command: set-api-key
 * Set encrypted API key for a provider
 *
 * Usage: autopm config:set-api-key
 */

const path = require('path');
const os = require('os');
const { select, password } = require('@inquirer/prompts');
const ConfigManager = require('../../lib/config/ConfigManager');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.autopm', 'config.json');

/**
 * Main function
 */
async function main() {
  try {
    const configPath = process.env.AUTOPM_CONFIG_PATH || DEFAULT_CONFIG_PATH;

    // Check if config exists
    const fs = require('fs');
    if (!fs.existsSync(configPath)) {
      console.error('\nError: Configuration not initialized');
      console.error('Run: autopm config:init\n');
      process.exit(1);
    }

    // Load configuration
    const manager = new ConfigManager(configPath);

    // Get list of providers
    const providers = manager.listProviders();

    if (providers.length === 0) {
      console.error('\nError: No providers configured');
      console.error('Run: autopm config:set-provider <name>\n');
      process.exit(1);
    }

    // Build choices with current API key status
    const choices = providers.map(provider => {
      const hasKey = manager.hasApiKey(provider);
      const status = hasKey ? '✓ API key set' : '✗ No API key';
      return {
        name: `${provider.padEnd(20)} ${status}`,
        value: provider
      };
    });

    // Prompt for provider selection
    const selectedProvider = await select({
      message: 'Select provider:',
      choices
    });

    // Get master password (from env or prompt)
    let masterPassword = process.env.AUTOPM_MASTER_PASSWORD;

    if (!masterPassword) {
      masterPassword = await password({
        message: 'Enter master password:',
        mask: '*'
      });
    }

    manager.setMasterPassword(masterPassword);

    // Prompt for API key
    const apiKey = await password({
      message: `Enter API key for ${selectedProvider}:`,
      mask: '*'
    });

    // Validate API key not empty
    if (!apiKey || apiKey.trim().length === 0) {
      console.error('\nError: API key cannot be empty');
      process.exit(1);
    }

    // Set and save API key
    manager.setApiKey(selectedProvider, apiKey);
    manager.save();

    console.log(`\n✓ API key encrypted and stored for '${selectedProvider}'\n`);

  } catch (error) {
    if (error.message.includes('cancelled') || error.message.includes('User force closed')) {
      console.error('\nError: Operation cancelled by user');
    } else if (error.message.includes('incorrect')) {
      console.error('\nError: Incorrect master password');
    } else {
      console.error('\nError:', error.message);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
