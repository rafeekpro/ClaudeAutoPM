/**
 * taskNew Command
 * Azure DevOps Task New
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:task-new';
exports.describe = 'Azure DevOps Task New';

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
  console.log('   /azure:task-new');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/task-new.md');
};
