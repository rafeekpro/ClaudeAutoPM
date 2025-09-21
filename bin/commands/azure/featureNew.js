/**
 * featureNew Command
 * Azure DevOps Feature New
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:feature-new';
exports.describe = 'Azure DevOps Feature New';

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
  console.log('   /azure:feature-new');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/feature-new.md');
};
