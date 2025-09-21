/**
 * syncAll Command
 * Azure DevOps Sync All
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:sync-all';
exports.describe = 'Azure DevOps Sync All';

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
  console.log('   /azure:sync-all');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/sync-all.md');
};
