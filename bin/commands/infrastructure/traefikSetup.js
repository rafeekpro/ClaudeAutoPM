/**
 * traefikSetup Command
 * Traefik Reverse Proxy Setup Command
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'infrastructure:traefik-setup';
exports.describe = 'Traefik Reverse Proxy Setup Command';

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
  console.log('   /infrastructure:traefik-setup');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/infrastructure/traefik-setup.md');
};
