/**
 * activeWork Command
 * Azure DevOps Active Work
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:active-work';
exports.describe = 'Azure DevOps Active Work';

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
  console.log('   /azure:active-work');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/active-work.md');
};
