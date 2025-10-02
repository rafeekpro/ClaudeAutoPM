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
    .command('update', 'Update ClaudeAutoPM framework to latest version in current project',
      (yargs) => {
        return yargs
          .option('force', {
            describe: 'Force update even if project structure differs',
            type: 'boolean',
            default: false
          })
          .option('backup', {
            describe: 'Create backup before updating',
            type: 'boolean',
            default: true
          })
          .option('preserve-config', {
            describe: 'Preserve existing configuration files',
            type: 'boolean',
            default: true
          })
          .example('autopm update', 'Update to latest version')
          .example('autopm update --force', 'Force update ignoring conflicts')
          .example('autopm update --no-backup', 'Update without creating backup');
      },
      (argv) => {
        // Delegate to the update script
        const { execSync } = require('child_process');
        const updatePath = path.join(__dirname, '..', 'install', 'update.sh');
        try {
          const env = {
            ...process.env,
            AUTOPM_FORCE: argv.force ? '1' : '0',
            AUTOPM_BACKUP: argv.backup ? '1' : '0',
            AUTOPM_PRESERVE_CONFIG: argv.preserveConfig ? '1' : '0'
          };
          execSync(`bash ${updatePath}`, {
            stdio: 'inherit',
            env
          });
        } catch (error) {
          console.error('Update failed:', error.message);
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
    // Config management command
    .command(require('./commands/config'))
    // MCP management command
    .command(require('./commands/mcp'))
    // Epic management command
    .command(require('./commands/epic'))
    // Validation command
    .command('validate', 'Validate ClaudeAutoPM configuration and setup',
      (yargs) => {
        return yargs
          .example('autopm validate', 'Check all configuration requirements')
          .example('autopm validate --verbose', 'Show detailed validation info');
      },
      async (argv) => {
        const PostInstallChecker = require('../install/post-install-check.js');
        const checker = new PostInstallChecker();

        try {
          await checker.runAllChecks();
          process.exit(0);
        } catch (error) {
          console.error(`❌ Validation error: ${error.message}`);
          if (argv.debug) {
            console.error(error.stack);
          }
          process.exit(1);
        }
      }
    )
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
   autopm validate                   # Check configuration status
   autopm update                     # Update to latest framework version
   autopm team load frontend         # Load React/UI development agents
   claude --dangerously-skip-permissions .     # Open Claude Code

🔧 Configuration Setup:
   # View current configuration
   autopm config show

   # Configure GitHub provider
   autopm config set provider github
   autopm config set github.owner <username>
   autopm config set github.repo <repository>
   export GITHUB_TOKEN=ghp_your_token_here

   # Configure Azure DevOps provider
   autopm config set provider azure
   autopm config set azure.organization <org>
   autopm config set azure.project <project>
   export AZURE_DEVOPS_PAT=your_azure_pat

   # Quick switch between providers
   autopm config switch github
   autopm config switch azure

   # Validate configuration
   autopm config validate

🔌 MCP (Model Context Protocol) Management:
   # List and manage MCP servers
   autopm mcp list                  # List all available MCP servers
   autopm mcp enable context7  # Enable documentation server
   autopm mcp sync                  # Sync configuration to .claude/mcp-servers.json

   # Agent Analysis
   autopm mcp agents                # List agents using MCP
   autopm mcp agent react-frontend-engineer  # Show MCP config for agent
   autopm mcp usage                 # Show MCP usage statistics
   autopm mcp tree                  # Show agent-MCP dependency tree

   # Configuration & Diagnostics
   autopm mcp setup                 # Interactive API key setup
   autopm mcp diagnose              # Run comprehensive diagnostics
   autopm mcp test context7    # Test MCP server connection
   autopm mcp status                # Show all MCP servers status

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
   /pm:context                      # Show current project context and progress
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

📋 PM Workflow Decision Guide:

   WHEN TO USE ONE EPIC (/pm:epic-decompose):
   ✅ Simple feature (1-2 weeks)
   ✅ Single component (frontend OR backend)
   ✅ One developer
   Examples: "User profile page", "REST API endpoint"

   WHEN TO USE MULTIPLE EPICS (/pm:epic-split):
   ✅ Complex project (2+ months)
   ✅ Multiple components (frontend + backend + infra)
   ✅ Multiple teams working in parallel
   Examples: "E-commerce platform", "Social dashboard"

   SIMPLE FEATURE FLOW:
   /pm:prd-new feature → /pm:prd-parse feature → /pm:epic-decompose feature

   COMPLEX PROJECT FLOW:
   /pm:prd-new project → /pm:prd-parse project → /pm:epic-split project
   → /pm:epic-decompose project/01-epic1 → /pm:epic-decompose project/02-epic2 ...

   📖 Full Guide: See PM-WORKFLOW-GUIDE.md

🚀 Complete Workflows:

   === GITHUB WORKFLOW (PRD → Epic → Issues) ===
   1. autopm install               # Setup project framework
   2. autopm config set provider github  # Set provider
      autopm config set github.owner <username>
      autopm config set github.repo <repository>
      export GITHUB_TOKEN=<your-token>
   3. autopm team load fullstack   # Load appropriate agents
   4. claude --dangerously-skip-permissions . # Open Claude Code
   5. /pm:validate                 # Verify GitHub integration

   6. /pm:prd-new user-auth        # Create Product Requirements Document
   7. /pm:prd-parse user-auth      # Parse PRD into structured format
   8. /pm:epic-split user-auth     # [OPTIONAL] Split complex PRD into multiple epics
   9. /pm:epic-decompose user-auth # Break PRD/Epic into Issues
   10. /pm:epic-sync user-auth     # Create GitHub Epic + Issues
   11. /pm:next                    # Get next priority issue
   12. /pm:issue-start ISSUE-123   # Start working on specific issue
   13. # ... development work ...
   14. /pm:issue-close ISSUE-123   # Close completed issue
   15. /pm:standup                 # Generate progress summary

   === AZURE DEVOPS WORKFLOW (PRD → User Stories → Tasks) ===
   1. autopm install               # Setup project framework
   2. autopm config set provider azure  # Set provider
      autopm config set azure.organization <org>
      autopm config set azure.project <project>
      export AZURE_DEVOPS_PAT=<your-pat>
   3. autopm team load fullstack   # Load appropriate agents
   4. claude --dangerously-skip-permissions . # Open Claude Code
   5. /pm:validate                 # Verify Azure DevOps integration

   6. /pm:prd-new user-auth        # Create Product Requirements Document
   7. /pm:prd-parse user-auth      # Parse PRD into structured format
   8. /pm:epic-split user-auth     # [OPTIONAL] Split complex PRD into multiple epics
   9. /pm:epic-decompose user-auth # Break PRD/Epic into User Stories + Tasks
   10. /pm:epic-sync user-auth     # Create Azure Epic + User Stories + Tasks
   11. /pm:next                    # Get next priority task
   12. /pm:issue-start TASK-123    # Start working on specific task
   13. # ... development work ...
   14. /pm:issue-close TASK-123    # Close completed task
   15. /pm:standup                 # Generate sprint summary

   === COMPLEX PROJECT WORKFLOW (Multi-Epic Split) ===
   Example: Full-stack e-commerce platform

   6. /pm:prd-new ecommerce-platform
   7. /pm:prd-parse ecommerce-platform
   8. /pm:epic-split ecommerce-platform # → Creates 6 epics automatically
      → Epic 1: Infrastructure Foundation (Docker, DB, monitoring)
      → Epic 2: Authentication Backend (JWT, users, RBAC)
      → Epic 3: Product API Services (catalog, inventory, orders)
      → Epic 4: Frontend Foundation (React setup, state management)
      → Epic 5: E-commerce UI (product pages, cart, checkout)
      → Epic 6: Testing & Deployment (CI/CD, quality gates)
   9. /pm:epic-decompose ecommerce-platform/01-infrastructure # Decompose each epic
   10. /pm:epic-decompose ecommerce-platform/02-auth-backend
   11. ... (repeat for each epic)
   12. /pm:epic-sync ecommerce-platform # Sync all epics to provider
   13. /pm:next                         # Start with P0 infrastructure epic

📋 Detailed Step-by-Step Examples:

   STEP 6 - Creating PRD:
   /pm:prd-new user-authentication
   → Creates: .claude/prds/user-authentication.md
   → Contains: Problem statement, user stories, acceptance criteria

   STEP 7 - Parsing PRD:
   /pm:prd-parse user-authentication
   → Analyzes PRD content and structure
   → Prepares for epic decomposition

   STEP 8 - Epic Split (Optional for Complex Projects):
   /pm:epic-split user-authentication
   → Analyzes PRD complexity and identifies logical divisions
   → Splits into multiple epics: Infrastructure, Backend, Frontend, UI, etc.
   → Creates structured epic hierarchy with dependencies
   → Example: 6 epics identified (Infrastructure, Auth Backend, Frontend, etc.)
   → Use when: Multi-component projects, large teams, parallel work needed

   STEP 9 - Epic Decomposition:
   /pm:epic-decompose user-authentication
   → GitHub: Creates Epic with linked Issues
   → Azure: Creates Epic with User Stories and child Tasks
   → File: .claude/epics/user-authentication.md (or multiple epic folders if split)

   STEP 10 - Sync with Provider:
   /pm:epic-sync user-authentication
   → GitHub: Creates Epic + Issues in repository
   → Azure: Creates Epic + User Stories + Tasks in project
   → Links local files with remote work items

   STEP 11 - Get Next Work:
   /pm:next
   → Returns highest priority unassigned item
   → GitHub: Next issue to work on
   → Azure: Next task to work on

   STEP 12 - Start Development:
   /pm:issue-start USER-AUTH-001
   → Assigns work item to you
   → Updates status to "In Progress"
   → Creates development branch (if configured)

   STEP 13 - Complete Work:
   /pm:issue-close USER-AUTH-001
   → Updates status to "Done/Closed"
   → Links commits and PR (if available)
   → Updates epic progress tracking

🛠️  Troubleshooting:
   # Check installation and configuration
   autopm validate                  # Comprehensive status check
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