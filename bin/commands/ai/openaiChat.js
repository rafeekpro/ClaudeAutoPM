/**
 * openaiChat Command
 * OpenAI Chat Integration Command
 */

const {
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'ai:openai-chat';
exports.describe = 'OpenAI Chat Integration Command';

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
  console.log('   /ai:openai-chat');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/ai/openai-chat.md');
};
