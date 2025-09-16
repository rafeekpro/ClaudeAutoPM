#!/usr/bin/env node

/**
 * ClaudeAutoPM CLI - Bridge to migrated Node.js version
 * This file now delegates to the migrated implementation
 */

const path = require('path');

// Get the migrated CLI module
const AutoPMCLI = require('./node/autopm.js');

// Create and run the CLI
const cli = new AutoPMCLI();
cli.run().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});