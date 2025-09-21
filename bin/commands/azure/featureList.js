/**
 * featureList Command
 * Azure DevOps Feature List
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:feature-list';
exports.describe = 'Azure DevOps Feature List';

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
  console.log('   /azure:feature-list');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/feature-list.md');
};
