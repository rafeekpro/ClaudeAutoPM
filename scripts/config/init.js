#!/usr/bin/env node
/**
 * @fileoverview Config command: init
 * Initialize configuration with interactive prompts for master password
 *
 * Usage: autopm config:init
 */

const path = require('path');
const os = require('os');
const { password } = require('@inquirer/prompts');
const ConfigManager = require('../../lib/config/ConfigManager');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.autopm', 'config.json');

/**
 * Validate password meets minimum requirements
 * @param {string} pwd - Password to validate
 * @returns {boolean|string} True if valid, error message otherwise
 */
function validatePassword(pwd) {
  if (!pwd || pwd.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  return true;
}

/**
 * Main initialization function
 */
async function main() {
  try {
    const configPath = process.env.AUTOPM_CONFIG_PATH || DEFAULT_CONFIG_PATH;

    console.log('\n🔧 AutoPM Configuration Setup');
    console.log('=============================\n');

    // Check if config already exists
    const fs = require('fs');
    if (fs.existsSync(configPath)) {
      console.log('⚠️  Configuration already exists at:', configPath);
      console.log('To reconfigure, delete the existing file first.\n');
      return;
    }

    // Prompt for master password
    const masterPassword = await password({
      message: 'Enter master password (for API key encryption):',
      mask: '*'
    });

    // Validate password
    const validationResult = validatePassword(masterPassword);
    if (validationResult !== true) {
      console.error(`\nError: ${validationResult}`);
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await password({
      message: 'Confirm master password:',
      mask: '*'
    });

    // Check passwords match
    if (masterPassword !== confirmPassword) {
      console.error('\nError: Passwords do not match');
      process.exit(1);
    }

    // Create ConfigManager instance
    const manager = new ConfigManager(configPath);
    manager.setMasterPassword(masterPassword);

    // Save configuration
    manager.save();

    console.log('\n✓ Configuration initialized at:', configPath);
    console.log('✓ Master password set (not stored, remember it!)');
    console.log('\nNext steps:');
    console.log('  - Set API key: autopm config:set-api-key');
    console.log('  - Configure provider: autopm config:set-provider\n');

  } catch (error) {
    if (error.message.includes('cancelled') || error.message.includes('User force closed')) {
      console.error('\nError: Setup cancelled by user');
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
