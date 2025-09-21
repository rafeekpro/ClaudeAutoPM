/**
 * contextSetup Command
 * MCP Context Setup
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'mcp:context-setup';
exports.describe = 'MCP Context Setup';

exports.builder = (yargs) => {
  return yargs;
};

exports.handler = async (argv) => {
  console.log();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║    🤖 AI-Powered Command (Claude Code Only)    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log();
  printWarning('This command requires Claude Code');
  console.log();

  printInfo('📍 To use in Claude Code:');
  console.log('   /mcp:context-setup');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/mcp/context-setup.md');
};
