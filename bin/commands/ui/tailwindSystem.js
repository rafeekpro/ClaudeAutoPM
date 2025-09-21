/**
 * tailwindSystem Command
 * TailwindCSS Design System Command
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'ui:tailwind-system';
exports.describe = 'TailwindCSS Design System Command';

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
  console.log('   /ui:tailwind-system');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/ui/tailwind-system.md');
};
