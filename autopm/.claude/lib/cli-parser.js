/**
 * CLI Parser for PM Commands
 *
 * Provides unified command-line argument parsing with --local flag support
 * across all PM commands using yargs best practices.
 *
 * Following Context7 yargs documentation patterns:
 * - .boolean() for boolean flags
 * - .alias() for short flags
 * - .parse() for argument processing
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const path = require('path');

/**
 * Read project configuration to determine default provider
 * @returns {string} Default provider ('github', 'azure', or 'local')
 */
function getDefaultProvider() {
  try {
    const configPath = path.join(process.cwd(), '.claude/config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.provider || 'github';
    }
  } catch (error) {
    // Silently fall back to github if config cannot be read
  }
  return 'github';
}

/**
 * Parse PM command arguments with --local flag support
 *
 * @param {string[]} args - Command arguments (usually process.argv)
 * @returns {object} Parsed arguments with mode determined
 *
 * @example
 * // Local mode
 * parsePMCommand(['prd-new', 'feature', '--local'])
 * // => { _: ['prd-new', 'feature'], local: true, mode: 'local' }
 *
 * @example
 * // Remote mode (from config)
 * parsePMCommand(['prd-list'])
 * // => { _: ['prd-list'], local: false, mode: 'github' }
 */
function parsePMCommand(args) {
  let failureMessage = null;

  // Don't use hideBin if args are already clean (for testing)
  const cleanArgs = Array.isArray(args) && !args[0]?.includes('node') ? args : hideBin(args);

  const argv = yargs(cleanArgs)
    .option('local', {
      alias: 'l',
      type: 'boolean',
      describe: 'Use local mode (offline, no GitHub/Azure)',
      default: false
    })
    .option('github', {
      type: 'boolean',
      describe: 'Use GitHub provider',
      default: false
    })
    .option('azure', {
      type: 'boolean',
      describe: 'Use Azure DevOps provider',
      default: false
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      describe: 'Enable verbose output',
      default: false
    })
    .option('force', {
      alias: 'f',
      type: 'boolean',
      describe: 'Force operation',
      default: false
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'Output format (json, text)',
      choices: ['json', 'text']
    })
    .check((argv) => {
      // Validate: cannot use --local with --github or --azure
      if (argv.local && (argv.github || argv.azure)) {
        throw new Error('Cannot use both --local and remote provider (--github or --azure)');
      }
      return true;
    })
    .fail((msg, err) => {
      // Capture failure for throwing
      failureMessage = msg || (err && err.message) || 'Unknown error';
    })
    .exitProcess(false)  // Don't call process.exit on error (for testing)
    .parse();

  // Throw error if validation failed
  if (failureMessage) {
    throw new Error(failureMessage);
  }

  // Determine mode based on flags and config
  if (argv.local) {
    argv.mode = 'local';
  } else if (argv.github) {
    argv.mode = 'github';
  } else if (argv.azure) {
    argv.mode = 'azure';
  } else {
    // Read from config
    argv.mode = getDefaultProvider();
  }

  return argv;
}

/**
 * Get help text for CLI parser
 * Used for testing help text includes --local flag
 *
 * @returns {Promise<string>} Help text
 */
async function getHelpText() {
  const parser = yargs([])
    .option('local', {
      alias: 'l',
      type: 'boolean',
      describe: 'Use local mode (offline, no GitHub/Azure)',
      default: false
    });

  return await parser.getHelp();
}

module.exports = {
  parsePMCommand,
  getHelpText,
  getDefaultProvider
};
