/**
 * sshSecurity Command
 * SSH Security and Operations Command
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'infrastructure:ssh-security';
exports.describe = 'SSH Security and Operations Command';

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
  console.log('   /infrastructure:ssh-security');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/infrastructure/ssh-security.md');
};
