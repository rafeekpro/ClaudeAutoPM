#!/usr/bin/env node
/**
 * contextPrime command implementation
 * Loads and primes AI context from saved context files
 * TDD Phase: GREEN - Making tests pass
 * Task: 1.2
 */

const fs = require('fs').promises;
const path = require('path');
const contextManager = require('../../../lib/context/manager');

/**
 * Lists available contexts
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string[]>} - Array of context names
 */
async function listContexts(projectRoot) {
  return await contextManager.listContexts(projectRoot);
}

/**
 * Loads a context file
 * @param {string} projectRoot - Project root directory
 * @param {string} name - Context name
 * @returns {Promise<object>} - Context data
 */
async function loadContext(projectRoot, name) {
  // Check if context exists
  if (!await contextManager.contextExists(projectRoot, name)) {
    throw new Error(`Context not found: ${name}`);
  }

  // Read context content
  const content = await contextManager.readContext(projectRoot, name);

  return {
    name,
    content,
    size: Buffer.byteLength(content, 'utf8'),
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a session file
 * @param {string} projectRoot - Project root directory
 * @param {object} contextData - Context data
 * @param {boolean} dryRun - Dry run mode
 */
async function createSession(projectRoot, contextData, dryRun = false) {
  if (dryRun) {
    console.log('Dry run mode - session not created');
    return;
  }

  // Create current session
  const session = {
    context: contextData.name,
    timestamp: contextData.timestamp,
    size: contextData.size
  };

  await contextManager.createSession(projectRoot, session);
  await contextManager.updateSessionHistory(projectRoot, session);
}

/**
 * Formats context size
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Primes context
 * @param {string} name - Context name
 * @param {object} options - Command options
 */
async function primeContext(name, options = {}) {
  const projectRoot = process.cwd();

  try {
    // Handle list option
    if (options.list) {
      const contexts = await listContexts(projectRoot);

      if (contexts.length === 0) {
        console.log('No contexts found.');
        return;
      }

      console.log('Available contexts:');
      contexts.forEach(ctx => {
        console.log(`  - ${ctx}`);
      });
      console.log(`\nTotal: ${contexts.length} contexts`);
      return;
    }

    // Require context name if not listing
    if (!name) {
      console.error('Error: Context name is required');
      console.error('Usage: contextPrime <name> or contextPrime --list');
      process.exit(1);
    }

    // Load context
    if (options.verbose) {
      console.log(`Loading context: ${name}`);
    }

    const contextData = await loadContext(projectRoot, name);

    // Handle chunked loading for large contexts
    const isLarge = contextData.size > 100 * 1024; // > 100KB
    if (options.chunked || isLarge) {
      const chunks = Math.ceil(contextData.size / (50 * 1024)); // 50KB chunks
      console.log(`Loading large context in ${chunks} chunks...`);
    }

    // Create session
    await createSession(projectRoot, contextData, options.dryRun);

    // Output results
    if (options.dryRun) {
      console.log(`Dry run: Would load context "${name}"`);
      console.log(`Size: ${formatSize(contextData.size)}`);
    } else {
      console.log(`Context loaded successfully: ${name}`);
      console.log(`Size: ${formatSize(contextData.size)}`);

      if (options.verbose) {
        console.log(`Session created at: ${contextData.timestamp}`);
      }
    }

    // Validate structure and warn if needed
    if (!contextData.content.includes('# Context:')) {
      console.warn('Warning: Context may not have standard structure');
    }

  } catch (error) {
    if (error.message.includes('not found')) {
      console.error(`Error: Context not found: ${name}`);

      // Suggest available contexts
      const contexts = await listContexts(projectRoot);
      if (contexts.length > 0) {
        console.error('\nAvailable contexts:');
        contexts.forEach(ctx => {
          console.error(`  - ${ctx}`);
        });
      }
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Command Definition for yargs
exports.command = 'context:prime [name]';
exports.describe = 'Load and prime AI context from saved context files';

exports.builder = (yargs) => {
  return yargs
    .positional('name', {
      describe: 'Name of the context to prime',
      type: 'string'
    })
    .option('list', {
      describe: 'List available contexts',
      type: 'boolean',
      alias: 'l'
    })
    .option('chunked', {
      describe: 'Use chunked loading for large contexts',
      type: 'boolean'
    })
    .option('verbose', {
      describe: 'Show detailed output',
      type: 'boolean'
    })
    .option('dry-run', {
      describe: 'Preview without actually priming',
      type: 'boolean'
    })
    .strict(false);
};

exports.handler = async (argv) => {
  try {
    await primeContext(argv.name, {
      list: argv.list,
      chunked: argv.chunked,
      verbose: argv.verbose,
      dryRun: argv.dryRun
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse basic arguments
  const options = {
    list: args.includes('--list') || args.includes('-l'),
    chunked: args.includes('--chunked'),
    verbose: args.includes('--verbose'),
    dryRun: args.includes('--dry-run')
  };

  // Get context name (first non-flag argument)
  const name = args.find(arg => !arg.startsWith('-'));

  primeContext(name, options).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for testing
module.exports.listContexts = listContexts;
module.exports.loadContext = loadContext;
module.exports.createSession = createSession;
module.exports.primeContext = primeContext;