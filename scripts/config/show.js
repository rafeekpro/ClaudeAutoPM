#!/usr/bin/env node
/**
 * @fileoverview Config command: show
 * Show full configuration with masked sensitive data
 *
 * Usage: autopm config:show [--json]
 */

const path = require('path');
const os = require('os');
const ConfigManager = require('../../lib/config/ConfigManager');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.autopm', 'config.json');

/**
 * Mask sensitive API key data recursively
 * @param {*} obj - Object to mask
 * @returns {*} Masked object
 */
function maskApiKeys(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskApiKeys(item));
  }

  // Check if this is an encrypted API key object
  if ('iv' in obj && 'encryptedData' in obj) {
    return '***encrypted***';
  }

  // Recursively mask nested objects
  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    masked[key] = maskApiKeys(value);
  }

  return masked;
}

/**
 * Display configuration in human-readable format
 * @param {Object} config - Configuration object
 * @param {ConfigManager} manager - ConfigManager instance
 */
function displayHumanReadable(config, manager) {
  const configPath = manager.configPath;

  console.log('\n┌────────────────────────────────────────┐');
  console.log('│       AutoPM Configuration             │');
  console.log('├────────────────────────────────────────┤');
  console.log('│                                        │');

  // Config path
  console.log(`│ Config path:                           │`);
  console.log(`│   ${configPath.substring(0, 36).padEnd(36)} │`);

  console.log('│                                        │');
  console.log('├────────────────────────────────────────┤');

  // Basic info
  console.log(`│ Version:        ${String(config.version || 'not set').padEnd(21)} │`);
  console.log(`│ Environment:    ${String(config.environment || 'development').padEnd(21)} │`);
  console.log(`│ Default:        ${String(config.defaultProvider || 'not set').padEnd(21)} │`);

  console.log('│                                        │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ Providers                              │');
  console.log('├────────────────────────────────────────┤');

  const providers = manager.listProviders();

  if (providers.length === 0) {
    console.log('│ No providers configured                │');
  } else {
    for (const providerName of providers.sort()) {
      const provider = manager.getProvider(providerName);
      const hasApiKey = manager.hasApiKey(providerName);
      const isDefault = providerName === config.defaultProvider;

      const marker = isDefault ? '*' : ' ';
      const keyStatus = hasApiKey ? '✓' : '✗';

      console.log(`│ ${marker} ${providerName.padEnd(16)} ${keyStatus}             │`);
      console.log(`│   Model: ${(provider.model || 'not set').substring(0, 26).padEnd(26)} │`);
    }
  }

  console.log('│                                        │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ Summary                                │');
  console.log('├────────────────────────────────────────┤');

  const apiKeysSet = providers.filter(p => manager.hasApiKey(p)).length;

  console.log(`│ Total providers:     ${String(providers.length).padEnd(15)} │`);
  console.log(`│ API keys set:        ${String(apiKeysSet).padEnd(15)} │`);

  console.log('└────────────────────────────────────────┘\n');

  // Warnings
  const warnings = [];

  if (config.defaultProvider && !manager.hasApiKey(config.defaultProvider)) {
    warnings.push(`⚠️  Warning: Default provider '${config.defaultProvider}' has no API key`);
  }

  const providersWithoutKeys = providers.filter(p => !manager.hasApiKey(p));
  if (providersWithoutKeys.length > 0) {
    warnings.push(`ℹ️  ${providersWithoutKeys.length} provider(s) without API keys: ${providersWithoutKeys.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.log('Notifications:\n');
    warnings.forEach(w => console.log(w));
    console.log();
  }

  // Help
  console.log('To modify configuration:');
  console.log('  autopm config:set <key> <value>     - Set config value');
  console.log('  autopm config:set-provider <name>   - Configure provider');
  console.log('  autopm config:set-api-key           - Set API key\n');
}

/**
 * Display configuration as JSON
 * @param {Object} config - Configuration object
 */
function displayJson(config) {
  const masked = maskApiKeys(config);
  console.log(JSON.stringify(masked, null, 2));
}

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
    const config = manager.getConfig();

    // Check for --json flag
    const jsonOutput = process.argv.includes('--json');

    if (jsonOutput) {
      displayJson(config);
    } else {
      displayHumanReadable(config, manager);
    }

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
