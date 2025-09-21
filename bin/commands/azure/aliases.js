/**
 * aliases Command
 * Azure DevOps Command Aliases
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:aliases';
exports.describe = 'Azure DevOps Command Aliases';

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
  console.log('   /azure:aliases');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/aliases.md');
};
