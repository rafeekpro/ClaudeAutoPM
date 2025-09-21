/**
 * epicSync Command
 * Sync epic to GitHub/Azure DevOps
 */

const {
  printError,
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'pm:epic-sync <epic_name>';
exports.describe = 'Sync epic to GitHub/Azure DevOps';

exports.builder = (yargs) => {
  return yargs
    .positional('epic_name', {
      describe: 'epic_name',
      type: 'string',
      demandOption: true
    });
};

exports.handler = async (argv) => {
  // This is an AI-powered command that requires Claude Code
  console.log();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║    🤖 AI-Powered Command (Claude Code Only)    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log();
  printWarning('This command requires Claude Code for execution');
  console.log();

  printInfo('📍 To use this command:');
  console.log(`   In Claude Code, run: /pm:epic-sync <epic_name>`);
  console.log();

  printInfo('💡 This AI command provides:');
  console.log(`   • Intelligent task creation
   • Dependency management
   • Label assignment
   • Milestone tracking
   • Team notifications`);
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/pm/epic-sync.md');
};
