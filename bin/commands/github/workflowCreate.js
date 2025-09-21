/**
 * workflowCreate Command
 * GitHub Workflow Creation
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'github:workflow-create';
exports.describe = 'GitHub Workflow Creation';

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
  console.log('   /github:workflow-create');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/github/workflow-create.md');
};
