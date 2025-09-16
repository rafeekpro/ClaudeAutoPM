#!/usr/bin/env node

/**
 * ClaudeAutoPM CLI - Refactored with yargs
 * This is the main CLI entry point using yargs for command management
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const fs = require('fs-extra');

// Get package info for version
const packageJson = require('../package.json');
const VERSION = packageJson.version;

// Main CLI function
function main() {
  const cli = yargs(hideBin(process.argv));

  cli
    // Load commands from the commands directory
    .commandDir(path.join(__dirname, 'commands'), {
      recurse: true,
      extensions: ['js']
    })
    // Legacy commands (temporarily keep for backwards compatibility)
    .command('install [preset]', 'Install ClaudeAutoPM in current directory',
      (yargs) => {
        return yargs
          .positional('preset', {
            describe: 'Installation preset (1-5)',
            type: 'number'
          });
      },
      (argv) => {
        // Delegate to the existing install script
        const installScript = require('./node/install.js');
        installScript.run(argv.preset);
      }
    )
    .command('merge [file]', 'Merge Claude instructions into CLAUDE.md',
      (yargs) => {
        return yargs
          .positional('file', {
            describe: 'File to merge',
            type: 'string'
          });
      },
      (argv) => {
        // Delegate to the existing merge script
        const mergeScript = require('./node/merge-claude.js');
        mergeScript.run(argv.file);
      }
    )
    .command('setup-env', 'Setup environment variables', {}, (argv) => {
      // Delegate to the existing setup-env script
      const setupEnvScript = require('./node/setup-env.js');
      setupEnvScript.run();
    })
    // Global options
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    })
    .option('debug', {
      type: 'boolean',
      description: 'Run with debug output'
    })
    // Help and version
    .version(VERSION)
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    // Error handling and requirements
    .demandCommand(1, 'You must provide a command. Use --help to see available options.')
    .strict()
    .wrap(cli.terminalWidth())
    // Custom epilogue
    .epilogue('For more information, visit: https://github.com/rafeekpro/ClaudeAutoPM')
    .fail((msg, err, yargs) => {
      if (err) {
        console.error('Error:', err.message);
        if (process.env.DEBUG) {
          console.error(err.stack);
        }
      } else {
        console.error(msg);
      }
      console.error('\nRun "autopm --help" for usage information');
      process.exit(1);
    })
    .argv;
}

// Run the CLI
try {
  main();
} catch (error) {
  console.error('Fatal error:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}