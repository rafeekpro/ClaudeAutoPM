/**
 * taskSync Command
 * Azure DevOps Task Sync
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:task-sync';
exports.describe = 'Azure DevOps Task Sync';

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
  console.log('   /azure:task-sync');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/task-sync.md');
};
