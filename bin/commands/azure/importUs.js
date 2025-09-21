/**
 * importUs Command
 * Azure DevOps Import User Stories
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:import-us';
exports.describe = 'Azure DevOps Import User Stories';

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
  console.log('   /azure:import-us');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/import-us.md');
};
