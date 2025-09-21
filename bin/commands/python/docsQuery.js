/**
 * docsQuery Command
 * Python Documentation Query
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'python:docs-query';
exports.describe = 'Python Documentation Query';

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
  console.log('   /python:docs-query');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/python/docs-query.md');
};
