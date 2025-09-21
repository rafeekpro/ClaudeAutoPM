/**
 * docsRefresh Command
 * MCP Documentation Refresh
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'mcp:docs-refresh';
exports.describe = 'MCP Documentation Refresh';

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
  console.log('   /mcp:docs-refresh');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/mcp/docs-refresh.md');
};
