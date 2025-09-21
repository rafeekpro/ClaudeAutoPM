#!/usr/bin/env node

/**
 * Script to simplify ALL commands by removing agentExecutor dependency
 * Extension of simplify-pm-commands.js for all categories
 */

const fs = require('fs-extra');
const path = require('path');

// Template for simple AI redirect commands
const SIMPLE_AI_TEMPLATE = `/**
 * {{COMMAND_NAME}} Command
 * {{DESCRIPTION}}
 */

const {
  printInfo,
  printWarning
} = require('{{HELPER_PATH}}');

exports.command = '{{COMMAND}}{{POSITIONAL}}';
exports.describe = '{{DESCRIPTION}}';

exports.builder = (yargs) => {
  return yargs{{BUILDER}};
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
  console.log('   /{{COMMAND_SLASH}}{{ARGS_HINT}}');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/{{MD_PATH}}');
};
`;

// Categories to process
const CATEGORIES = {
  'azure': {
    path: 'azure',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'ui': {
    path: 'ui',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'react': {
    path: 'react',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'python': {
    path: 'python',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'ai': {
    path: 'ai',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'infrastructure': {
    path: 'infrastructure',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'kubernetes': {
    path: 'kubernetes',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'cloud': {
    path: 'cloud',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'mcp': {
    path: 'mcp',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'config': {
    path: 'config',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'playwright': {
    path: 'playwright',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'github': {
    path: 'github',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  },
  'traefik': {
    path: 'traefik',
    helperPath: '../../../lib/commandHelpers',
    commands: []
  }
};

async function analyzeCommand(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');

  // Check if uses agentExecutor
  const usesAgent = content.includes('agentExecutor');

  // Extract command info
  const commandMatch = content.match(/exports\.command\s*=\s*['"]([^'"]+)['"]/);
  const descMatch = content.match(/exports\.describe\s*=\s*['"]([^'"]+)['"]/);

  const command = commandMatch ? commandMatch[1] : '';
  const hasPositional = command.includes('<') || command.includes('[');

  return {
    usesAgent,
    command,
    description: descMatch ? descMatch[1] : '',
    hasPositional
  };
}

async function simplifyCommand(category, fileName) {
  const filePath = path.join(__dirname, '..', 'bin', 'commands', category.path, fileName);

  if (!await fs.pathExists(filePath)) {
    console.log(`⚠️  File not found: ${fileName}`);
    return;
  }

  const info = await analyzeCommand(filePath);

  if (!info.usesAgent) {
    console.log(`⏭️  Skipping ${fileName} (no agentExecutor)`);
    return;
  }

  // Backup original
  const backupDir = path.join(__dirname, '..', 'bin', 'commands', category.path, '.backup');
  await fs.ensureDir(backupDir);
  await fs.copy(filePath, path.join(backupDir, `${fileName}.bak`));

  // Parse command structure
  const baseName = path.basename(fileName, '.js');
  const commandParts = info.command.split(' ');
  const baseCommand = commandParts[0];
  const positional = commandParts.slice(1).join(' ');

  // Generate builder based on positional arguments
  let builder = '';
  let argsHint = '';
  if (positional) {
    const argName = positional.replace(/[<>\[\]]/g, '');
    builder = `
    .positional('${argName}', {
      describe: '${argName}',
      type: 'string',
      demandOption: ${!positional.includes('[')}
    })`;
    argsHint = ` ${positional}`;
  }

  // Generate new content
  const newContent = SIMPLE_AI_TEMPLATE
    .replace(/{{COMMAND_NAME}}/g, baseName)
    .replace(/{{COMMAND}}/g, baseCommand)
    .replace(/{{POSITIONAL}}/g, positional ? ` ${positional}` : '')
    .replace(/{{DESCRIPTION}}/g, info.description)
    .replace(/{{HELPER_PATH}}/g, category.helperPath)
    .replace(/{{BUILDER}}/g, builder)
    .replace(/{{COMMAND_SLASH}}/g, baseCommand.replace(/:/g, ':'))
    .replace(/{{ARGS_HINT}}/g, argsHint)
    .replace(/{{MD_PATH}}/g, `${category.path}/${baseName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}.md`);

  await fs.writeFile(filePath, newContent);
  console.log(`✅ Updated: ${category.path}/${fileName}`);
}

async function processCategory(categoryName) {
  const category = CATEGORIES[categoryName];
  const dirPath = path.join(__dirname, '..', 'bin', 'commands', category.path);

  if (!await fs.pathExists(dirPath)) {
    console.log(`⚠️  Category directory not found: ${categoryName}`);
    return;
  }

  const files = await fs.readdir(dirPath);
  const jsFiles = files.filter(f => f.endsWith('.js'));

  console.log(`\n📂 Processing ${categoryName} (${jsFiles.length} files):`);

  for (const file of jsFiles) {
    try {
      await simplifyCommand(category, file);
    } catch (error) {
      console.error(`❌ Failed: ${file} - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔧 Simplifying ALL Commands...\n');

  const categories = process.argv.slice(2);
  const targetCategories = categories.length > 0 ? categories : Object.keys(CATEGORIES);

  for (const category of targetCategories) {
    if (CATEGORIES[category]) {
      await processCategory(category);
    } else {
      console.log(`⚠️  Unknown category: ${category}`);
    }
  }

  console.log('\n✨ Simplification complete!');
  console.log('\nTo test: autopm --help');
  console.log('To revert: find bin/commands -name ".backup" -exec cp {}/*.bak .. \\;');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { simplifyCommand };