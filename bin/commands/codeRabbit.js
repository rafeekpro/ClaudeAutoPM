/**
 * code-rabbit Command
 * Code review with AI
 */

const {
  printInfo,
  printWarning
} = require('../../lib/commandHelpers');

exports.command = 'code-rabbit';
exports.describe = 'Code review with AI';

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
  console.log('   /code-rabbit');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/code-rabbit.md');
};
