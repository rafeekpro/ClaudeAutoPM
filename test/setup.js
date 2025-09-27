/**
 * Jest Global Setup File
 * This file runs once before all tests
 */

// Extend Jest matchers
require('jest-extended');

// Custom matchers for migration testing
expect.extend({
  /**
   * Check if Node.js output matches bash output
   */
  toMatchBashOutput(received, expected) {
    // Normalize outputs (remove trailing whitespace, normalize line endings)
    const normalizeOutput = (str) => {
      return str
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim();
    };

    const normalizedReceived = normalizeOutput(received);
    const normalizedExpected = normalizeOutput(expected);

    const pass = normalizedReceived === normalizedExpected;

    return {
      pass,
      message: () => {
        if (pass) {
          return `Expected outputs to differ`;
        } else {
          const diff = require('jest-diff').diff(normalizedExpected, normalizedReceived, {
            expand: false,
            contextLines: 3
          });
          return `Output mismatch:\n${diff}`;
        }
      }
    };
  },

  /**
   * Check if exit code matches expected
   */
  toHaveExitCode(result, expected) {
    const pass = result.exitCode === expected;
    return {
      pass,
      message: () => pass
        ? `Expected exit code to not be ${expected}`
        : `Expected exit code ${expected}, got ${result.exitCode}\nStderr: ${result.stderr}`
    };
  },

  /**
   * Check if script execution succeeded
   */
  toExecuteSuccessfully(result) {
    const pass = result.exitCode === 0;
    return {
      pass,
      message: () => pass
        ? `Expected script to fail`
        : `Script failed with exit code ${result.exitCode}\nStderr: ${result.stderr}`
    };
  }
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AUTOPM_TEST_MODE = '1';

// Increase timeout for CI environments
if (process.env.CI) {
  jest.setTimeout(30000);
}

// Global test utilities
global.testHelpers = {
  /**
   * Create a temporary test directory
   */
  async createTempDir() {
    const fs = require('fs-extra');
    const path = require('path');
    const os = require('os');

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopm-test-'));
    return tempDir;
  },

  /**
   * Clean up test artifacts
   */
  async cleanup(dir) {
    const fs = require('fs-extra');
    if (dir && await fs.exists(dir)) {
      await fs.remove(dir);
    }
  }
};

// Suppress console output during tests (unless debugging)
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}