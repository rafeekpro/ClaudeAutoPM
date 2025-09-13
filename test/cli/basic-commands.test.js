#!/usr/bin/env node

const { describe, it } = require('node:test');
const assert = require('assert');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Basic AutoPM CLI Test Suite
 *
 * Quick tests for essential CLI functionality
 */

const AUTOPM_BIN = path.join(__dirname, '../../bin/autopm.js');

const execAutopm = (args) => {
  try {
    return {
      success: true,
      output: execSync(`node ${AUTOPM_BIN} ${args}`, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 5000
      })
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.status,
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || ''
    };
  }
};

describe('AutoPM CLI Basic Commands', () => {

  it('should show help with --help', () => {
    const result = execAutopm('--help');

    assert(result.success, `Help command failed: ${result.error}`);
    assert(result.output.includes('COMMANDS:'), 'Help should show commands section');
    assert(result.output.includes('install'), 'Help should list install command');
    assert(result.output.includes('init'), 'Help should list init command');
    console.log('✓ Help command working');
  });

  it('should show version with --version', () => {
    const result = execAutopm('--version');

    assert(result.success, `Version command failed: ${result.error}`);
    assert(/ClaudeAutoPM v\d+\.\d+\.\d+/.test(result.output), 'Should show ClaudeAutoPM version');
    console.log(`✓ Version: ${result.output.split('\\n')[0]}`);
  });

  it('should show help with no arguments', () => {
    const result = execAutopm('');

    assert(result.success, `Default help failed: ${result.error}`);
    assert(result.output.includes('COMMANDS:'), 'Should show help by default');
    console.log('✓ Default help working');
  });

  it('should handle invalid commands gracefully', () => {
    const result = execAutopm('invalid-command-xyz');

    // Should either show help or give meaningful error
    const hasHelp = (result.output || '').includes('COMMANDS:') || (result.output || '').includes('help');
    const hasError = (result.stderr || '').includes('command') || !result.success;

    assert(hasHelp || hasError, 'Should show help or meaningful error for invalid commands');
    console.log('✓ Invalid command handling working');
  });

  it('should require project name for init', () => {
    const result = execAutopm('init');

    // Should fail and show usage
    assert(!result.success, 'Init without project name should fail');

    const allOutput = (result.stdout || '') + (result.stderr || '') + (result.output || '');
    const hasUsageMessage = allOutput.includes('required') ||
                           allOutput.includes('Usage') ||
                           allOutput.includes('project-name');

    assert(hasUsageMessage, 'Should show usage error message');
    console.log('✓ Init parameter validation working');
  });

});

console.log('🧪 Running Basic CLI Tests...');