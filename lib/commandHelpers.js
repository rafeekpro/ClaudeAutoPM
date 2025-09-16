/**
 * Command Helpers Module
 * Common utilities for CLI commands
 */

const colors = require('./utils/colors');
const fs = require('fs-extra');
const path = require('path');

/**
 * Validate kebab-case format
 * @param {string} name - The name to validate
 * @returns {boolean} True if valid kebab-case
 */
function isValidKebabCase(name) {
  return /^[a-z][a-z0-9-]*$/.test(name);
}

/**
 * Validate command input
 * @param {string} input - The input to validate
 * @param {string} type - The type of input (e.g., 'story-name', 'task-name')
 * @returns {Object} Validation result
 */
function validateInput(input, type = 'name') {
  if (!input) {
    return {
      valid: false,
      message: `❌ ${type} is required`
    };
  }

  if (!isValidKebabCase(input)) {
    return {
      valid: false,
      message: `❌ ${type} must be kebab-case (lowercase letters, numbers, hyphens only). Examples: user-auth, payment-v2, notification-system`
    };
  }

  return { valid: true };
}

/**
 * Load environment variables from .claude/.env
 */
function loadEnvironment() {
  const envPath = path.join(process.cwd(), '.claude', '.env');

  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    return true;
  }

  return false;
}

/**
 * Check if a command should be run in verbose mode
 * @param {Object} argv - Command arguments
 * @returns {boolean} True if verbose mode
 */
function isVerbose(argv) {
  return argv.verbose || process.env.VERBOSE === 'true';
}

/**
 * Check if a command should be run in debug mode
 * @param {Object} argv - Command arguments
 * @returns {boolean} True if debug mode
 */
function isDebug(argv) {
  return argv.debug || process.env.DEBUG === 'true';
}

/**
 * Print a formatted error message
 * @param {string} message - The error message
 * @param {Error} error - Optional error object
 */
function printError(message, error = null) {
  console.error(colors.red(`❌ ${message}`));
  if (error && isDebug()) {
    console.error(colors.gray(error.stack));
  }
}

/**
 * Print a formatted success message
 * @param {string} message - The success message
 */
function printSuccess(message) {
  console.log(colors.green(`✅ ${message}`));
}

/**
 * Print a formatted info message
 * @param {string} message - The info message
 */
function printInfo(message) {
  console.log(colors.blue(`ℹ️  ${message}`));
}

/**
 * Print a formatted warning message
 * @param {string} message - The warning message
 */
function printWarning(message) {
  console.warn(colors.yellow(`⚠️  ${message}`));
}

/**
 * Print a formatted step message
 * @param {string} message - The step message
 * @param {number} current - Current step number
 * @param {number} total - Total number of steps
 */
function printStep(message, current, total) {
  console.log(colors.cyan(`[${current}/${total}] ${message}`));
}

/**
 * Create a progress spinner
 * @param {string} text - The spinner text
 * @returns {Object} Spinner instance
 */
function createSpinner(text) {
  const ora = require('ora');
  return ora({
    text: text,
    spinner: 'dots'
  });
}

/**
 * Format a table for console output
 * @param {Array<Array>} data - Table data
 * @param {Object} options - Table options
 * @returns {string} Formatted table
 */
function formatTable(data, options = {}) {
  const Table = require('table');
  return Table.table(data, options);
}

/**
 * Confirm an action with the user
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} User's confirmation
 */
async function confirm(message) {
  const inquirer = require('inquirer');
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: message,
      default: false
    }
  ]);
  return confirmed;
}

module.exports = {
  isValidKebabCase,
  validateInput,
  loadEnvironment,
  isVerbose,
  isDebug,
  printError,
  printSuccess,
  printInfo,
  printWarning,
  printStep,
  createSpinner,
  formatTable,
  confirm
};