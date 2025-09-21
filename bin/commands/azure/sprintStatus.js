/**
 * sprintStatus Command
 * Azure DevOps Sprint Status
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:sprint-status';
exports.describe = 'Azure DevOps Sprint Status';

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
  console.log('   /azure:sprint-status');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/sprint-status.md');
};
