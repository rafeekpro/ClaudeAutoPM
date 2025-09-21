#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const SIMPLE_TEMPLATE = `/**
 * {{NAME}} Command
 * {{DESCRIPTION}}
 */

const {
  printInfo,
  printWarning
} = require('../lib/commandHelpers');

exports.command = '{{COMMAND}}';
exports.describe = '{{DESCRIPTION}}';

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
  console.log('   /{{COMMAND}}');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/{{COMMAND}}.md');
};
`;

const ROOT_COMMANDS = [
  { file: 'codeRabbit.js', command: 'code-rabbit', description: 'Code review with AI' },
  { file: 'prompt.js', command: 'prompt', description: 'Execute custom AI prompt' },
  { file: 'reInit.js', command: 're-init', description: 'Reinitialize project configuration' },
  { file: 'uiframeworkcommands.js', command: 'ui-framework-commands', description: 'UI framework operations' },
  { file: 'uxdesigncommands.js', command: 'ux-design-commands', description: 'UX design operations' }
];

async function main() {
  console.log('🔧 Simplifying root commands...\n');

  const backupDir = path.join(__dirname, '..', 'bin', 'commands', '.backup');
  await fs.ensureDir(backupDir);

  for (const cmd of ROOT_COMMANDS) {
    const filePath = path.join(__dirname, '..', 'bin', 'commands', cmd.file);

    if (!await fs.pathExists(filePath)) {
      console.log(`⚠️  Not found: ${cmd.file}`);
      continue;
    }

    // Backup
    await fs.copy(filePath, path.join(backupDir, `${cmd.file}.bak`));

    // Generate new content
    const content = SIMPLE_TEMPLATE
      .replace(/{{NAME}}/g, cmd.command)
      .replace(/{{COMMAND}}/g, cmd.command)
      .replace(/{{DESCRIPTION}}/g, cmd.description);

    await fs.writeFile(filePath, content);
    console.log(`✅ Updated: ${cmd.file}`);
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);