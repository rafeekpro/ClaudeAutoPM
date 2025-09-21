/**
 * blockedItems Command
 * Azure DevOps Blocked Items
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:blocked-items';
exports.describe = 'Azure DevOps Blocked Items';

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
  console.log('   /azure:blocked-items');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/blocked-items.md');
};
