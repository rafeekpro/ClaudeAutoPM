#!/usr/bin/env node

/**
 * ClaudeAutoPM CLI - Refactored with yargs
 * This is the main CLI entry point using yargs for command management
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const fs = require('fs-extra');

// Get package info for version
const packageJson = require('../package.json');
const VERSION = packageJson.version;

// Main CLI function
function main() {
  const cli = yargs(hideBin(process.argv));

  cli
    // Main commands
    .command('install [preset]', 'Install ClaudeAutoPM framework in current project directory',
      (yargs) => {
        return yargs
          .positional('preset', {
            describe: 'Installation preset (1-5)',
            type: 'number'
          });
      },
      (argv) => {
        // Delegate to the install script
        const { execSync } = require('child_process');
        const installPath = path.join(__dirname, '..', 'install', 'install.sh');
        try {
          execSync(`bash ${installPath}`, {
            stdio: 'inherit',
            env: { ...process.env, AUTOPM_PRESET: argv.preset || '' }
          });
        } catch (error) {
          console.error('Installation failed:', error.message);
          process.exit(1);
        }
      }
    )
    .command('guide [action]', 'Interactive setup guide and documentation generator',
      (yargs) => {
        return yargs
          .positional('action', {
            describe: 'Guide action (default: interactive guide)',
            type: 'string',
            choices: ['quickstart', 'install', 'config', 'tutorial', 'examples', 'faq'],
            default: 'quickstart'
          })
          .option('platform', {
            describe: 'Target platform for installation guide',
            type: 'string',
            choices: ['node', 'docker', 'kubernetes'],
            default: 'node'
          })
          .option('topic', {
            describe: 'Tutorial topic',
            type: 'string'
          })
          .example('autopm guide', 'Start interactive setup guide')
          .example('autopm guide install --platform docker', 'Generate Docker installation guide')
          .example('autopm guide tutorial --topic basics', 'Create basics tutorial');
      },
      async (argv) => {
        try {
          if (argv.action && argv.action !== 'quickstart') {
            // Legacy documentation generation for specific actions
            const GuideManager = require('../lib/guide/manager');
            const manager = new GuideManager();

            console.log('\n🎯 ClaudeAutoPM Documentation Generator');
            console.log('=====================================\n');

            switch (argv.action) {
              case 'install':
                console.log(`📦 Generating Installation Guide for ${argv.platform}...\n`);
                const installResult = await manager.generateInstallationGuide(argv.platform, argv);
                console.log(`✅ Installation guide created: ${installResult.path}`);
                console.log(`🖥️  Platform: ${installResult.platform}\n`);
                break;

              case 'config':
                console.log('⚙️  Generating Configuration Guide...\n');
                const configResult = await manager.generateConfigGuide(argv);
                console.log(`✅ Configuration guide created: ${configResult.path}\n`);
                break;

              case 'tutorial':
                const topic = argv.topic || 'basics';
                console.log(`🎓 Creating ${topic} Tutorial...\n`);
                const tutorialResult = await manager.createTutorial(topic, argv);
                console.log(`✅ Tutorial created: ${tutorialResult.path}\n`);
                break;

              case 'examples':
                console.log('💡 Generating Code Examples...\n');
                const examplesResult = await manager.generateExamples(argv.category || 'general', argv);
                console.log(`✅ Examples created: ${examplesResult.path}\n`);
                break;

              case 'faq':
                console.log('❓ Generating FAQ Document...\n');
                const faqResult = await manager.generateFAQ(argv);
                console.log(`✅ FAQ created: ${faqResult.path}\n`);
                break;

              default:
                console.log('❌ Unknown guide action. Use: autopm guide --help');
            }
          } else {
            // New interactive guide (default)
            const InteractiveGuide = require('../lib/guide/interactive-guide');
            const guide = new InteractiveGuide();
            await guide.start();
          }
        } catch (error) {
          console.error(`❌ Guide error: ${error.message}`);
          process.exit(1);
        }
      }
    )
    // Team management command
    .command(require('./commands/team'))
    // Global options
    .option('verbose', {
      type: 'boolean',
      description: 'Run with verbose logging'
    })
    .option('debug', {
      type: 'boolean',
      description: 'Run with debug output'
    })
    // Help and version
    .version(VERSION)
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    // Error handling and requirements
    .demandCommand(1, 'You must provide a command. Use --help to see available options.')
    .recommendCommands()
    .strictCommands()
    .wrap(cli.terminalWidth())
    // Enhanced help epilogue
    .epilogue(`
📖 Quick Start:
   autopm install                    # Install ClaudeAutoPM in current directory
   autopm team load frontend         # Load React/UI development agents
   claude --bypass-permissions .     # Open Claude Code

🔧 Configuration & Teams:
   autopm guide config              # Setup Azure DevOps or GitHub integration
   autopm team list                 # See all available agent teams
   autopm team current              # Check currently active team
   autopm guide                     # Interactive setup guide

💡 After installation, use Claude Code for PM commands:
   /pm:status                       # Project overview and health
   /pm:prd-new my-feature           # Create new Product Requirements Document
   /pm:epic-decompose my-feature    # Break PRD into actionable tasks
   /pm:next                         # Get next priority task to work on
   /pm:issue-start TASK-123         # Start working on specific task
   /pm:standup                      # Generate daily standup summary

🚀 Example Workflow:
   1. autopm install               # Setup project
   2. autopm team load fullstack   # Load appropriate agents
   3. claude --bypass-permissions . # Open Claude
   4. /pm:prd-new user-auth        # Create feature PRD
   5. /pm:epic-decompose user-auth # Break into tasks
   6. /pm:next                     # Start working

📚 Documentation: https://github.com/rafeekpro/ClaudeAutoPM
🐛 Report Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues
`)
    .fail((msg, err, yargs) => {
      if (err) {
        console.error('Error:', err.message);
        if (process.env.DEBUG) {
          console.error(err.stack);
        }
      } else {
        console.error(msg);
      }
      console.error('\nRun "autopm --help" for usage information');
      process.exit(1);
    })
    .argv;
}

// Run the CLI
try {
  main();
} catch (error) {
  console.error('Fatal error:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}