/**
 * langgraphWorkflow Command
 * LangGraph Workflow Command
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'ai:langgraph-workflow';
exports.describe = 'LangGraph Workflow Command';

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
  console.log('   /ai:langgraph-workflow');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/ai/langgraph-workflow.md');
};
