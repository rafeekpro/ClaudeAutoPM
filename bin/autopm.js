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
    .command('guide [action]', 'Interactive setup guide and documentation generator (deprecated: use --help)',
      (yargs) => {
        return yargs
          .positional('action', {
            describe: 'Guide action (default: show enhanced help)',
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
          .example('autopm --help', 'Show comprehensive usage guide (recommended)')
          .example('autopm guide', 'Show enhanced help (same as --help)')
          .example('autopm guide config', 'Generate configuration documentation');
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
            // Backward compatibility: redirect to enhanced help
            console.log('💡 The interactive guide has been replaced with enhanced help.\n');
            console.log('📖 For comprehensive usage information, use: autopm --help\n');
            console.log('🔧 For specific documentation generation, use:');
            console.log('   autopm guide config    # Generate configuration docs');
            console.log('   autopm guide tutorial  # Create tutorials');
            console.log('   autopm guide examples  # Generate examples\n');

            // Show the enhanced help
            process.argv = ['node', 'autopm', '--help'];
            cli.showHelp();
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

🔧 Configuration Setup:
   # Interactive configuration (recommended)
   node install/setup-env.js         # Interactive token & provider setup

   # Non-interactive setup
   node install/setup-env.js --non-interactive \\
     --github-token=ghp_xxx --email=you@email.com

   # Manual .claude/.env file
   GITHUB_TOKEN=ghp_your_token_here
   AZURE_DEVOPS_PAT=your_azure_pat
   AZURE_DEVOPS_ORG=your-organization
   AZURE_DEVOPS_PROJECT=your-project

🔑 Token Setup:
   # GitHub PAT (Settings → Developer settings → Personal access tokens)
   Scopes: repo, workflow, admin:repo_hook

   # Azure DevOps PAT (User settings → Personal access tokens)
   Scopes: Work Items (read/write), Code (read/write)

🤖 Team Management:
   autopm team list                 # See all available agent teams
   autopm team load frontend        # Load React/UI agents
   autopm team load backend         # Load Python/Node.js agents
   autopm team load fullstack       # Load complete development stack
   autopm team load devops          # Load Docker/K8s/CI-CD agents
   autopm team current              # Check currently active team
   autopm team reset                # Reset to default team

💡 Claude Code PM Commands:
   /pm:status                       # Project overview and health
   /pm:validate                     # Validate configuration
   /pm:prd-new feature-name         # Create new Product Requirements Document
   /pm:prd-parse feature-name       # Parse PRD into epic structure
   /pm:epic-decompose feature-name  # Break PRD into actionable tasks
   /pm:epic-sync feature-name       # Sync epic with provider (GitHub/Azure)
   /pm:next                         # Get next priority task to work on
   /pm:issue-start TASK-123         # Start working on specific task
   /pm:issue-show TASK-123          # View task details
   /pm:issue-close TASK-123         # Close completed task
   /pm:standup                      # Generate daily standup summary
   /pm:search keyword               # Search across PRDs and epics
   /pm:help                         # Show all PM commands

🚀 Complete Workflow Example:
   1. autopm install               # Setup project framework
   2. node install/setup-env.js    # Configure GitHub/Azure tokens
   3. autopm team load fullstack   # Load appropriate agents
   4. claude --bypass-permissions . # Open Claude Code
   5. /pm:validate                 # Verify configuration
   6. /pm:prd-new user-auth        # Create feature PRD
   7. /pm:epic-decompose user-auth # Break into tasks
   8. /pm:epic-sync user-auth      # Sync with GitHub/Azure
   9. /pm:next                     # Get first task
   10. /pm:issue-start TASK-123    # Start development

🛠️  Troubleshooting:
   # Check installation
   ls -la .claude/                  # Should show: agents/, commands/, config.json

   # Verify configuration
   /pm:validate                     # In Claude Code
   autopm team current              # Check active team

   # Reset if needed
   autopm install --force           # Reinstall framework
   autopm team reset                # Reset to default agents

📋 Documentation Generation:
   autopm guide config              # Generate configuration docs
   autopm guide tutorial            # Create tutorials
   autopm guide examples            # Generate code examples

📚 Resources:
   Documentation: https://github.com/rafeekpro/ClaudeAutoPM
   Report Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues
   Agent Registry: autopm/.claude/agents/AGENT-REGISTRY.md
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