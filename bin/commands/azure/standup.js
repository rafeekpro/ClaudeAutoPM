/**
 * standup Command
 * Azure DevOps Daily Standup
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:standup';
exports.describe = 'Azure DevOps Daily Standup';

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
  console.log('   /azure:standup');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/standup.md');
};
