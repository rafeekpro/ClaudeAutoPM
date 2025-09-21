/**
 * nextTask Command
 * Azure DevOps Next Task
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:next-task';
exports.describe = 'Azure DevOps Next Task';

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
  console.log('   /azure:next-task');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/next-task.md');
};
