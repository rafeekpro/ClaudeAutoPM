/**
 * usParse Command
 * Azure DevOps User Story Parse
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'azure:us-parse';
exports.describe = 'Azure DevOps User Story Parse';

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
  console.log('   /azure:us-parse');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/azure/us-parse.md');
};
