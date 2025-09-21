/**
 * workItemSync Command
 * Azure DevOps Work Item Synchronization
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:work-item-sync';
exports.describe = 'Azure DevOps Work Item Synchronization';

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
  console.log('   /azure:work-item-sync');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/work-item-sync.md');
};
