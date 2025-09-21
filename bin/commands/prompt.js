/**
 * prompt Command
 * Execute custom AI prompt
 */

const {
  printInfo,
  printWarning
} = require('../../lib/commandHelpers');

exports.command = 'prompt';
exports.describe = 'Execute custom AI prompt';

exports.builder = (yargs) => yargs;

exports.handler = async (argv) => {
  console.log();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║    🤖 AI-Powered Command (Claude Code Only)    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log();
  printWarning('This command requires Claude Code');
  console.log();

  printInfo('📍 To use in Claude Code:');
  console.log('   /prompt');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/prompt.md');
};
