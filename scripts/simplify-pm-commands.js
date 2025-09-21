#!/usr/bin/env node

/**
 * Script to simplify PM commands by removing agentExecutor dependency
 * and implementing deterministic logic where possible
 */

const fs = require('fs-extra');
const path = require('path');

// Template for script-based commands
const SCRIPT_COMMAND_TEMPLATE = `/**
 * {{COMMAND_NAME}} Command
 * {{DESCRIPTION}}
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const {
  printError,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

exports.command = '{{COMMAND}}';
exports.describe = '{{DESCRIPTION}}';

exports.builder = (yargs) => {
  return yargs
    .option('verbose', {
      describe: 'Verbose output',
      type: 'boolean',
      alias: 'v'
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Running {{COMMAND}}...');

  try {
    // Check if we're in Claude Code for enhanced functionality
    const isClaudeCode = process.env.CLAUDE_CODE === 'true' ||
                        process.env.ANTHROPIC_WORKSPACE === 'true';

    if (isClaudeCode) {
      spinner.info();
      console.log();
      console.log('🤖 AI-enhanced version available in Claude Code');
      console.log('Run: /{{COMMAND}} for intelligent {{OPERATION}}');
      return;
    }

    // Run the deterministic script
    const scriptPath = path.join(process.cwd(), '.claude', 'scripts', '{{SCRIPT_PATH}}');

    if (!await fs.pathExists(scriptPath)) {
      spinner.fail();
      printError('Script not found. Is the project initialized?');
      printInfo('Run: autopm pm:init to initialize');
      process.exit(1);
    }

    spinner.stop();

    return new Promise((resolve, reject) => {
      const child = spawn('bash', [scriptPath], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      child.on('error', (error) => {
        printError(\`Failed to run script: \${error.message}\`);
        reject(error);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(\`Script exited with code \${code}\`));
        }
      });
    });

  } catch (error) {
    spinner.fail();
    printError(\`Error: \${error.message}\`);
    process.exit(1);
  }
};
`;

// Template for AI-only commands
const AI_COMMAND_TEMPLATE = `/**
 * {{COMMAND_NAME}} Command
 * {{DESCRIPTION}}
 */

const {
  printError,
  printInfo,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = '{{COMMAND}}';
exports.describe = '{{DESCRIPTION}}';

exports.builder = (yargs) => {
  return yargs{{POSITIONAL}};
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
  console.log(\`   In Claude Code, run: /{{COMMAND}}{{ARGS_EXAMPLE}}\`);
  console.log();

  printInfo('💡 This AI command provides:');
  console.log('{{BENEFITS}}');
  console.log();

  printInfo('📄 Command definition:');
  console.log('   .claude/commands/{{MD_PATH}}');
};
`;

// Commands to update
const SCRIPT_COMMANDS = [
  { name: 'blocked', script: 'pm/blocked.sh', operation: 'blocked items analysis' },
  { name: 'epicList', script: 'pm/epic-list.sh', operation: 'epic listing' },
  { name: 'epicShow', script: 'pm/epic-show.sh', operation: 'epic details' },
  { name: 'epicStatus', script: 'pm/epic-status.sh', operation: 'epic status tracking' },
  { name: 'help', script: 'pm/help.sh', operation: 'help documentation' },
  { name: 'init', script: 'pm/init.sh', operation: 'project initialization' },
  { name: 'inProgress', script: 'pm/in-progress.sh', operation: 'progress tracking' },
  { name: 'next', script: 'pm/next.sh', operation: 'task prioritization' },
  { name: 'prdList', script: 'pm/prd-list.sh', operation: 'PRD listing' },
  { name: 'prdStatus', script: 'pm/prd-status.sh', operation: 'PRD status' },
  { name: 'search', script: 'pm/search.sh', operation: 'search functionality' },
  { name: 'status', script: 'pm/status.sh', operation: 'status reporting' },
  { name: 'validate', script: 'pm/validate.sh', operation: 'validation checks' }
];

const AI_COMMANDS = [
  {
    name: 'issueAnalyze',
    description: 'Analyze issue for implementation approach',
    positional: '<issue_id>',
    argsExample: ' <issue_id>',
    benefits: `   • Deep code analysis
   • Implementation strategy
   • Risk assessment
   • Dependency mapping
   • Effort estimation`
  },
  {
    name: 'epicSync',
    description: 'Sync epic to GitHub/Azure DevOps',
    positional: '<epic_name>',
    argsExample: ' <epic_name>',
    benefits: `   • Intelligent task creation
   • Dependency management
   • Label assignment
   • Milestone tracking
   • Team notifications`
  },
  // Add more AI commands as needed
];

async function updateScriptCommand(cmd) {
  const filePath = path.join(__dirname, '..', 'bin', 'commands', 'pm', `${cmd.name}.js`);

  // Read current file to get description
  const content = await fs.readFile(filePath, 'utf-8');
  const descMatch = content.match(/exports\.describe\s*=\s*['"](.+)['"]/);
  const description = descMatch ? descMatch[1] : cmd.name;

  // Generate new content
  const newContent = SCRIPT_COMMAND_TEMPLATE
    .replace(/{{COMMAND_NAME}}/g, cmd.name)
    .replace(/{{COMMAND}}/g, `pm:${cmd.name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`)
    .replace(/{{DESCRIPTION}}/g, description)
    .replace(/{{SCRIPT_PATH}}/g, cmd.script)
    .replace(/{{OPERATION}}/g, cmd.operation);

  await fs.writeFile(filePath, newContent);
  console.log(`✅ Updated: ${cmd.name}.js (script-based)`);
}

async function updateAICommand(cmd) {
  const filePath = path.join(__dirname, '..', 'bin', 'commands', 'pm', `${cmd.name}.js`);

  const commandName = `pm:${cmd.name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`;
  const mdPath = `pm/${cmd.name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}.md`;

  const positional = cmd.positional ? `
    .positional('${cmd.positional.replace(/[<>]/g, '')}', {
      describe: '${cmd.positional.replace(/[<>]/g, '')}',
      type: 'string',
      demandOption: true
    })` : '';

  const newContent = AI_COMMAND_TEMPLATE
    .replace(/{{COMMAND_NAME}}/g, cmd.name)
    .replace(/{{COMMAND}}/g, commandName)
    .replace(/{{DESCRIPTION}}/g, cmd.description)
    .replace(/{{POSITIONAL}}/g, positional)
    .replace(/{{ARGS_EXAMPLE}}/g, cmd.argsExample || '')
    .replace(/{{BENEFITS}}/g, cmd.benefits)
    .replace(/{{MD_PATH}}/g, mdPath);

  await fs.writeFile(filePath, newContent);
  console.log(`✅ Updated: ${cmd.name}.js (AI-only)`);
}

async function main() {
  console.log('🔧 Simplifying PM Commands...\n');

  // Backup directory
  const backupDir = path.join(__dirname, '..', 'bin', 'commands', 'pm', '.backup');
  await fs.ensureDir(backupDir);

  // Update script-based commands
  console.log('📝 Updating script-based commands:');
  for (const cmd of SCRIPT_COMMANDS) {
    try {
      // Backup original
      const original = path.join(__dirname, '..', 'bin', 'commands', 'pm', `${cmd.name}.js`);
      const backup = path.join(backupDir, `${cmd.name}.js.bak`);
      await fs.copy(original, backup);

      await updateScriptCommand(cmd);
    } catch (error) {
      console.error(`❌ Failed to update ${cmd.name}: ${error.message}`);
    }
  }

  console.log('\n🤖 Updating AI-only commands:');
  for (const cmd of AI_COMMANDS) {
    try {
      // Backup original
      const original = path.join(__dirname, '..', 'bin', 'commands', 'pm', `${cmd.name}.js`);
      const backup = path.join(backupDir, `${cmd.name}.js.bak`);
      await fs.copy(original, backup);

      await updateAICommand(cmd);
    } catch (error) {
      console.error(`❌ Failed to update ${cmd.name}: ${error.message}`);
    }
  }

  console.log('\n✨ Simplification complete!');
  console.log('📁 Backups saved in: bin/commands/pm/.backup/');
  console.log('\nTo test: autopm pm:help');
  console.log('To revert: cp bin/commands/pm/.backup/*.bak bin/commands/pm/');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateScriptCommand, updateAICommand };