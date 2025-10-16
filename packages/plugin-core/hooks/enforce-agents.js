#!/usr/bin/env node

/**
 * Hook enforcing agent usage instead of direct operations
 * Usage: set as tool-use-hook in Claude Code configuration
 */

const fs = require('fs');
const path = require('path');

class AgentEnforcer {
  constructor() {
    // Get tool name and parameters from arguments
    this.toolName = process.argv[2] || '';
    this.toolParams = process.argv[3] || '';

    // Parse params if they're JSON
    try {
      this.parsedParams = JSON.parse(this.toolParams);
    } catch {
      this.parsedParams = {};
    }
  }

  blockWithMessage(reason, agent, example) {
    console.log(`❌ BLOCKED: ${reason}`);
    console.log(`✅ INSTEAD: Use the ${agent} agent via Task tool`);
    console.log('');
    console.log('Example:');
    console.log(`  Task: ${example}`);
    process.exit(1);
  }

  checkBashUsage() {
    if (this.toolName !== 'Bash') return;

    // Block direct grep/find - should use code-analyzer
    const codeSearchPattern = /(grep|rg|find|ag)\s+.*\.(py|js|ts|jsx|tsx)/;
    if (codeSearchPattern.test(this.toolParams)) {
      this.blockWithMessage(
        'Direct code search detected',
        'code-analyzer',
        'Search for [pattern] in codebase'
      );
    }

    // Block direct test execution - should use test-runner
    const testExecPattern = /(pytest|npm test|yarn test|jest|vitest)/;
    if (testExecPattern.test(this.toolParams)) {
      this.blockWithMessage(
        'Direct test execution detected',
        'test-runner',
        'Run and analyze test results'
      );
    }

    // Block direct log reading - should use file-analyzer
    const logReadPattern = /(cat|head|tail|less).*\.(log|txt|out)/;
    if (logReadPattern.test(this.toolParams)) {
      this.blockWithMessage(
        'Direct log reading detected',
        'file-analyzer',
        'Analyze and summarize [log file]'
      );
    }
  }

  checkReadUsage() {
    if (this.toolName !== 'Read') return;

    const filePath = this.parsedParams.file_path;
    if (!filePath) return;

    // If file is larger than 1000 lines, enforce file-analyzer
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lineCount = content.split('\n').length;

        if (lineCount > 1000) {
          this.blockWithMessage(
            `Reading large file directly (${lineCount} lines)`,
            'file-analyzer',
            `Summarize contents of ${filePath}`
          );
        }
      } catch (error) {
        // Can't read file, let it pass through
      }
    }
  }

  checkGrepUsage() {
    if (this.toolName !== 'Grep') return;

    const pattern = this.parsedParams.pattern;
    if (!pattern) return;

    // If pattern is complex or searches many files, use code-analyzer
    const complexPattern = /(\.\*|\+|\{|\[)/;
    if (complexPattern.test(pattern)) {
      console.log('⚠️  SUGGESTION: For complex searches, consider using code-analyzer agent');
      console.log('   It provides better context and analysis of results');
      // Don't block, just suggest
    }
  }

  run() {
    // Check various tool usages
    this.checkBashUsage();
    this.checkReadUsage();
    this.checkGrepUsage();

    // If we got here, it's allowed - pass through
    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const enforcer = new AgentEnforcer();
  enforcer.run();
}

module.exports = AgentEnforcer;