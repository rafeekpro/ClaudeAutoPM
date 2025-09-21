/**
 * prdEdit Command
 * AI-powered operation
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'pm:-\L&/grdEdit';
exports.describe = 'prdEdit operation';

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
  console.log('   /pm:-\L&/grdEdit');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/pm/-\L&/grdEdit.md');
};
