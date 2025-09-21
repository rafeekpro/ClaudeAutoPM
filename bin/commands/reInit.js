/**
 * re-init Command
 * Reinitialize project configuration
 */

const {
  printInfo,
  printWarning
} = require('../../lib/commandHelpers');

exports.command = 're-init';
exports.describe = 'Reinitialize project configuration';

exports.builder = (yargs) => yargs;

exports.handler = async (argv) => {
  console.log();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║    🤖 AI-Powered Command (Claude Code Only)    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log();
  printWarning('This command requires Claude Code');
  console.log();

  printInfo('📍 To use in Claude Code:');
  console.log('   /re-init');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/re-init.md');
};
