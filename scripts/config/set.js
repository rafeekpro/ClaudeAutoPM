#!/usr/bin/env node
/**
 * @fileoverview Config command: set
 * Set configuration value with validation
 *
 * Usage: autopm config:set <key> <value>
 * Example: autopm config:set providers.claude.temperature 0.9
 */

const path = require('path');
const os = require('os');
const ConfigManager = require('../../lib/config/ConfigManager');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.autopm', 'config.json');

/**
 * Parse value from string
 * Converts numeric strings to numbers, "true"/"false" to booleans, JSON objects
 * @param {string} valueStr - String value to parse
 * @returns {*} Parsed value
 */
function parseValue(valueStr) {
  // Try to parse as JSON first (handles objects, arrays, etc.)
  if (valueStr.startsWith('{') || valueStr.startsWith('[')) {
    try {
      return JSON.parse(valueStr);
    } catch (error) {
      throw new Error('Invalid JSON value');
    }
  }

  // Parse boolean
  if (valueStr === 'true') return true;
  if (valueStr === 'false') return false;

  // Parse number
  if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
    return Number(valueStr);
  }

  // Return as string
  return valueStr;
}

/**
 * Validate specific configuration keys
 * @param {string} key - Configuration key
 * @param {*} value - Value to validate
 * @throws {Error} If validation fails
 */
function validateValue(key, value) {
  // Temperature validation
  if (key.includes('temperature')) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }
  }

  // maxTokens validation
  if (key.includes('maxTokens')) {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error('maxTokens must be positive');
    }
  }

  // Rate limit interval validation
  if (key.includes('rateLimit.interval')) {
    const validIntervals = ['second', 'minute', 'hour'];
    if (!validIntervals.includes(value)) {
      throw new Error('Rate limit interval must be one of: second, minute, hour');
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const configPath = process.env.AUTOPM_CONFIG_PATH || DEFAULT_CONFIG_PATH;

    // Get key and value from command line arguments
    const key = process.argv[2];
    const valueStr = process.argv[3];

    if (!key || valueStr === undefined) {
      console.error('Error: Both key and value are required');
      console.error('Usage: autopm config:set <key> <value>');
      console.error('Example: autopm config:set providers.claude.temperature 0.9');
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

    // Parse value
    const value = parseValue(valueStr);

    // Validate value
    validateValue(key, value);

    // Set value
    manager.setConfig(key, value);

    // Validate entire config before saving
    manager.validateConfig();

    // Save configuration
    manager.save();

    console.log(`✓ Configuration updated: ${key} set to: ${JSON.stringify(value)}\n`);

  } catch (error) {
    if (error.message.includes('JSON')) {
      console.error('Error:', error.message);
    } else if (error.message.includes('Temperature') || error.message.includes('maxTokens') || error.message.includes('interval')) {
      console.error('Error:', error.message);
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
