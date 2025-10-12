#!/usr/bin/env node
/**
 * @fileoverview Config command: list-providers
 * List all configured providers with API key status
 *
 * Usage: autopm config:list-providers
 */

const path = require('path');
const os = require('os');
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
      console.error('\nError: Configuration not found');
      console.error('Run: autopm config:init\n');
      process.exit(1);
    }

    // Load configuration
    const manager = new ConfigManager(configPath);

    // Get providers
    const providers = manager.listProviders();
    const defaultProvider = manager.getDefaultProvider();

    if (providers.length === 0) {
      console.log('\nNo providers configured');
      console.log('Run: autopm config:set-provider <name>\n');
      return;
    }

    // Display header
    console.log('\nConfigured Providers:');
    console.log('=====================\n');

    // Sort providers alphabetically
    const sortedProviders = providers.sort();

    // Count providers with API keys
    let apiKeyCount = 0;

    // Display each provider
    for (const providerName of sortedProviders) {
      const provider = manager.getProvider(providerName);
      const hasApiKey = manager.hasApiKey(providerName);
      const isDefault = providerName === defaultProvider;

      if (hasApiKey) {
        apiKeyCount++;
      }

      // Format line
      const defaultMarker = isDefault ? '* ' : '  ';
      const apiKeyStatus = hasApiKey ? '✓ API key set' : '✗ No API key';
      const modelInfo = provider.model || 'not configured';

      console.log(`${defaultMarker}${providerName.padEnd(18)} ${apiKeyStatus.padEnd(15)} ${modelInfo}`);
    }

    console.log('\n(* = default provider)\n');

    // Summary
    console.log(`Total: ${providers.length} provider${providers.length !== 1 ? 's' : ''} configured`);
    console.log(`API keys: ${apiKeyCount} with API keys configured\n`);

  } catch (error) {
    if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
      console.error('\nError reading config: Invalid JSON format\n');
    } else {
      console.error('\nError:', error.message, '\n');
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
