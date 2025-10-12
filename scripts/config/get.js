#!/usr/bin/env node
/**
 * @fileoverview Config command: get
 * Get configuration value with dot notation support
 *
 * Usage: autopm config:get <key>
 * Example: autopm config:get providers.claude.model
 */

const path = require('path');
const os = require('os');
const ConfigManager = require('../../lib/config/ConfigManager');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.autopm', 'config.json');

/**
 * Mask sensitive API key data
 * @param {*} value - Value to potentially mask
 * @returns {*} Masked value or original value
 */
function maskSensitiveData(value) {
  if (value && typeof value === 'object') {
    if ('iv' in value && 'encryptedData' in value) {
      // This is an encrypted API key
      return '***encrypted***';
    }

    // Recursively mask object properties
    const masked = {};
    for (const [key, val] of Object.entries(value)) {
      masked[key] = maskSensitiveData(val);
    }
    return masked;
  }

  return value;
}

/**
 * Format output value
 * @param {*} value - Value to format
 * @returns {string} Formatted output
 */
function formatOutput(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'object') {
    // Mask sensitive data before printing
    const masked = maskSensitiveData(value);
    return JSON.stringify(masked, null, 2);
  }

  return String(value);
}

/**
 * Main function
 */
async function main() {
  try {
    const configPath = process.env.AUTOPM_CONFIG_PATH || DEFAULT_CONFIG_PATH;

    // Get key from command line arguments
    const key = process.argv[2];

    if (!key) {
      console.error('Error: Key is required');
      console.error('Usage: autopm config:get <key>');
      console.error('Example: autopm config:get providers.claude.model');
      process.exit(1);
    }

    // Check if config exists
    const fs = require('fs');
    if (!fs.existsSync(configPath)) {
      console.error('Error: Configuration not found');
      console.error('Run: autopm config:init');
      process.exit(1);
    }

    // Load configuration
    const manager = new ConfigManager(configPath);

    // Get value
    const value = manager.getConfig(key);

    // Output formatted value
    console.log(formatOutput(value));

  } catch (error) {
    if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
      console.error('Error reading config: Invalid JSON format');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
