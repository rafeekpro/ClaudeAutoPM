#!/usr/bin/env node

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('Azure Help Migration', () => {
  // Skip these tests unless in integration test mode
  if (!process.env.AZURE_DEVOPS_INTEGRATION_TESTS) {
    console.log("Skipping Azure DevOps tests (set AZURE_DEVOPS_INTEGRATION_TESTS=true to run)");
    return;
  }
  let consoleOutput;
  let originalConsoleLog;

  beforeEach(() => {
    // Reset module cache
    Object.keys(require.cache).forEach(key => {
      if (key.includes('azure-help')) {
        delete require.cache[key];
      }
    });

    // Mock console output
    consoleOutput = [];
    originalConsoleLog = console.log;
    console.log = (...args) => consoleOutput.push(args.join(' '));
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
  });

  describe('Basic Functionality', () => {
    it('should display help information for all commands', async () => {
      process.argv = ['node', 'azure-help.js'];

      require('../../bin/node/azure-help.js');

      // Check for essential content
      assert(consoleOutput.some(line => line.includes('Azure DevOps PM Commands')));
      assert(consoleOutput.some(line => line.includes('Setup & Configuration')));
      assert(consoleOutput.some(line => line.includes('Daily Workflows')));
      assert(consoleOutput.some(line => line.includes('Feature Management')));
      assert(consoleOutput.some(line => line.includes('User Story Management')));
    });

    it('should display help for specific command when provided', async () => {
      process.argv = ['node', 'azure-help.js', 'daily'];

      require('../../bin/node/azure-help.js');

      assert(consoleOutput.some(line => line.includes('azure-daily')));
      assert(consoleOutput.some(line => line.includes('daily stand-up')));
    });

    it('should show error for unknown command', async () => {
      process.argv = ['node', 'azure-help.js', 'unknown-command'];

      require('../../bin/node/azure-help.js');

      assert(consoleOutput.some(line => line.includes('Unknown command')));
    });
  });

  describe('Command Categories', () => {
    it('should list all command categories', async () => {
      process.argv = ['node', 'azure-help.js'];

      require('../../bin/node/azure-help.js');

      const categories = [
        'Setup & Configuration',
        'Daily Workflows',
        'Feature Management',
        'User Story Management',
        'Sprint Management',
        'Search & Reporting'
      ];

      categories.forEach(category => {
        assert(consoleOutput.some(line => line.includes(category)),
          `Missing category: ${category}`);
      });
    });
  });

  describe('Examples Section', () => {
    it('should include examples for common workflows', async () => {
      process.argv = ['node', 'azure-help.js'];

      require('../../bin/node/azure-help.js');

      assert(consoleOutput.some(line => line.includes('Examples')));
      assert(consoleOutput.some(line => line.includes('pm azure-setup')));
      assert(consoleOutput.some(line => line.includes('pm azure-daily')));
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  // The test runner will handle this
}