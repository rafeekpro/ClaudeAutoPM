/**
 * usNew Command
 * Azure DevOps User Story New
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:us-new';
exports.describe = 'Azure DevOps User Story New';

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
  console.log('   /azure:us-new');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/us-new.md');
};
