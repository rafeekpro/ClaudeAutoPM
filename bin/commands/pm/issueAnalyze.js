/**
 * issueAnalyze Command
 * Analyze issue for implementation approach
 */

const {
  printError,
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'pm:issue-analyze <issue_id>';
exports.describe = 'Analyze issue for implementation approach';

exports.builder = (yargs) => {
  return yargs
    .positional('issue_id', {
      describe: 'issue_id',
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
  console.log(`   In Claude Code, run: /pm:issue-analyze <issue_id>`);
  console.log();

  printInfo('💡 This AI command provides:');
  console.log(`   • Deep code analysis
   • Implementation strategy
   • Risk assessment
   • Dependency mapping
   • Effort estimation`);
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/pm/issue-analyze.md');
};
