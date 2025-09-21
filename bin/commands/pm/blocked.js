/**
 * blocked Command
 * blocked
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const {
  printError,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

exports.command = 'pm:blocked';
exports.describe = 'blocked';

exports.builder = (yargs) => {
  return yargs
    .option('verbose', {
      describe: 'Verbose output',
      type: 'boolean',
      alias: 'v'
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Running pm:blocked...');

  try {
    // Check if we're in Claude Code for enhanced functionality
    const isClaudeCode = process.env.CLAUDE_CODE === 'true' ||
                        process.env.ANTHROPIC_WORKSPACE === 'true';

    if (isClaudeCode) {
      spinner.info();
      console.log();
      console.log('🤖 AI-enhanced version available in Claude Code');
      console.log('Run: /pm:blocked for intelligent blocked items analysis');
      return;
    }

    // Run the deterministic script
    const scriptPath = path.join(process.cwd(), '.claude', 'scripts', 'pm/blocked.sh');

    if (!await fs.pathExists(scriptPath)) {
      spinner.fail();
      printError('Script not found. Is the project initialized?');
      printInfo('Run: autopm pm:init to initialize');
      process.exit(1);
    }

    spinner.stop();

    return new Promise((resolve, reject) => {
      const child = spawn('bash', [scriptPath], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      child.on('error', (error) => {
        printError(`Failed to run script: ${error.message}`);
        reject(error);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Script exited with code ${code}`));
        }
      });
    });

  } catch (error) {
    spinner.fail();
    printError(`Error: ${error.message}`);
    process.exit(1);
  }
};
