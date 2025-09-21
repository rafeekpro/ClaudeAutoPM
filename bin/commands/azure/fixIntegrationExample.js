/**
 * fixIntegrationExample Command
 * Azure DevOps Integration Fix - Example Command
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:fix-integration-example';
exports.describe = 'Azure DevOps Integration Fix - Example Command';

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
  console.log('   /azure:fix-integration-example');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/fix-integration-example.md');
};
