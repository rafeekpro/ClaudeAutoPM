#!/usr/bin/env node

/**
 * ClaudeAutoPM CLI - Autonomous Project Management Framework
 * Global command-line interface for installing and managing ClaudeAutoPM
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Package info
const packageJson = require('../package.json');
const ClaudeAutoPM_VERSION = packageJson.version;

// Paths
const SCRIPT_DIR = __dirname;
const PACKAGE_DIR = path.dirname(SCRIPT_DIR);
const INSTALL_SCRIPT = path.join(PACKAGE_DIR, 'install', 'install.sh');
const MERGE_SCRIPT = path.join(PACKAGE_DIR, 'install', 'merge-claude.sh');
const ENV_SETUP_SCRIPT = path.join(PACKAGE_DIR, 'install', 'setup-env.sh');

// Helper functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const error = (message) => {
  log(`❌ ${message}`, 'red');
  process.exit(1);
};

const success = (message) => {
  log(`✅ ${message}`, 'green');
};

const info = (message) => {
  log(`ℹ️  ${message}`, 'cyan');
};

const warning = (message) => {
  log(`⚠️  ${message}`, 'yellow');
};

// Check if running on Windows
const isWindows = os.platform() === 'win32';

// Execute bash script (with Windows compatibility)
const executeBashScript = (scriptPath, args = [], options = {}) => {
  if (!fs.existsSync(scriptPath)) {
    error(`Script not found: ${scriptPath}`);
  }

  const command = isWindows ? 'bash' : scriptPath;
  const scriptArgs = isWindows ? [scriptPath, ...args] : args;

  // Prepare environment variables from options
  const env = { ...process.env };

  if (options.autoAccept) {
    env.AUTOPM_AUTO_ACCEPT = '1';
  }
  if (options.config) {
    env.AUTOPM_CONFIG_PRESET = options.config;
  }
  if (options.skipEnv) {
    env.AUTOPM_SKIP_ENV = '1';
  }
  if (options.skipHooks) {
    env.AUTOPM_SKIP_HOOKS = '1';
  }
  if (options.noBackup) {
    env.AUTOPM_NO_BACKUP = '1';
  }
  if (options.cicd) {
    env.AUTOPM_CICD_SYSTEM = options.cicd;
  }

  try {
    const result = spawn(command, scriptArgs, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: env
    });

    result.on('error', (err) => {
      if (err.code === 'ENOENT') {
        if (isWindows) {
          error('Bash not found. Please install Git Bash or WSL.');
        } else {
          error(`Failed to execute script: ${err.message}`);
        }
      } else {
        error(`Script execution failed: ${err.message}`);
      }
    });

    result.on('close', (code) => {
      if (code === 0) {
        success('Operation completed successfully!');
      } else {
        process.exit(code);
      }
    });

  } catch (err) {
    error(`Failed to execute script: ${err.message}`);
  }
};

// Print banner
const printBanner = () => {
  log('', 'cyan');
  log('╔══════════════════════════════════════════════╗', 'cyan');
  log('║                 ClaudeAutoPM CLI             ║', 'cyan');
  log('║     Autonomous Project Management v' + ClaudeAutoPM_VERSION.padEnd(7) + '║', 'cyan');
  log('╚══════════════════════════════════════════════╝', 'cyan');
  log('', 'cyan');
};

// Show help
const showHelp = () => {
  printBanner();
  
  log('🚀 ClaudeAutoPM - Autonomous Project Management Framework', 'bright');
  log('');
  log('USAGE:', 'yellow');
  log('  autopm [command] [options]');
  log('');
  log('COMMANDS:', 'yellow');
  log('  install [path]     Install ClaudeAutoPM to current directory or specified path');
  log('  update [path]      Update existing ClaudeAutoPM installation');
  log('  merge              Merge CLAUDE.md configurations');
  log('  setup-env [path]   Interactive .env configuration setup (current dir or specified path)');
  log('  init               Initialize new project with ClaudeAutoPM');
  log('  mcp <command>      Manage MCP (Model Context Protocol) servers');
  log('  version            Show version information');
  log('  help               Show this help message');
  log('  config             Configure development features (Docker/K8s toggles)');
  log('');
  log('GLOBAL OPTIONS:', 'yellow');
  log('  --help, -h         Show help');
  log('  --version, -v      Show version');
  log('  --verbose          Verbose output');
  log('  --no-backup        Skip creating backups (not recommended)');
  log('');
  log('INSTALL OPTIONS:', 'yellow');
  log('  --yes, -y          Auto-accept all prompts (non-interactive mode)');
  log('  --config, -c       Preset configuration: minimal|docker|devops|performance');
  log('  --cicd             CI/CD system: github-actions|azure-devops|gitlab-ci|jenkins|none');
  log('  --no-env           Skip .env setup');
  log('  --no-hooks         Skip git hooks installation');
  log('');
  log('EXAMPLES:', 'yellow');
  log('  autopm install                    # Install to current directory (interactive)');
  log('  autopm install ~/my-project       # Install to specific directory');
  log('  autopm install --yes -c devops    # Non-interactive DevOps setup');
  log('  autopm install -y --config minimal --no-env  # Minimal, skip .env');
  log('  autopm install --yes --cicd github-actions  # Use GitHub Actions for CI/CD');
  log('  autopm install -y -c docker --cicd none  # Docker-only, no CI/CD');
  log('  autopm update                     # Update existing installation');
  log('  autopm merge                      # Generate CLAUDE.md merge prompt');
  log('  autopm setup-env                  # Configure .env in current directory');
  log('  autopm setup-env ~/my-project     # Configure .env for specific project');
  log('  autopm init my-new-project        # Initialize new project');
  log('  autopm config                     # Configure Docker/K8s features');
  log('  autopm mcp list                   # List available MCP servers');
  log('  autopm mcp enable github-mcp      # Enable GitHub MCP server');
  log('  autopm mcp sync                   # Sync MCP configuration');
  log('');
  log('INSTALLATION MODES:', 'yellow');
  log('  🆕 Fresh Install   - Sets up complete ClaudeAutoPM framework');
  log('  🔄 Update/Sync     - Updates existing installation with backups');
  log('  🤖 Smart Merge     - AI-assisted configuration merging');
  log('  🔧 Interactive Setup - Step-by-step .env configuration');
  log('');
  log('MORE INFO:', 'yellow');
  log('  Repository: https://github.com/rla/ClaudeAutoPM');
  log('  Documentation: See PLAYBOOK.md after installation');
  log('  Issues: https://github.com/rla/ClaudeAutoPM/issues');
};

// Show version
const showVersion = () => {
  log(`ClaudeAutoPM v${ClaudeAutoPM_VERSION}`, 'green');
  log(`Node.js ${process.version}`);
  log(`Platform: ${os.platform()} ${os.arch()}`);
};

// Initialize new project
const initProject = (projectName) => {
  if (!projectName) {
    error('Project name is required. Usage: autopm init <project-name>');
  }

  const projectPath = path.resolve(process.cwd(), projectName);
  
  if (fs.existsSync(projectPath)) {
    error(`Directory already exists: ${projectPath}`);
  }

  info(`Creating new project: ${projectName}`);
  
  try {
    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });
    
    // Initialize git repository
    execSync('git init', { cwd: projectPath, stdio: 'inherit' });
    
    // Install ClaudeAutoPM
    executeBashScript(INSTALL_SCRIPT, [projectPath]);
    
  } catch (err) {
    error(`Failed to initialize project: ${err.message}`);
  }
};

// Handle MCP commands
const handleMCPCommand = (args) => {
  const subcommand = args[0] || 'help';
  const mcpHandler = path.join(PACKAGE_DIR, 'scripts', 'mcp-handler.js');

  if (!fs.existsSync(mcpHandler)) {
    error('MCP handler not found. Please reinstall ClaudeAutoPM.');
  }

  const validCommands = ['list', 'add', 'remove', 'enable', 'disable', 'sync', 'validate', 'info', 'help'];

  if (subcommand === 'help' || !validCommands.includes(subcommand)) {
    log('\n📡 ClaudeAutoPM MCP Server Management\n', 'bright');
    log('Usage: autopm mcp <command> [options]\n');
    log('Commands:');
    log('  list              List all available MCP servers');
    log('  add               Add a new MCP server interactively');
    log('  remove <name>     Remove an MCP server');
    log('  enable <name>     Enable a server in current project');
    log('  disable <name>    Disable a server in current project');
    log('  sync              Sync active servers to configuration');
    log('  validate          Validate all server definitions');
    log('  info <name>       Show detailed server information');
    log('  help              Show this help message');
    log('\nExamples:');
    log('  autopm mcp list                    # List all servers');
    log('  autopm mcp enable context7-docs    # Enable a server');
    log('  autopm mcp sync                    # Sync configuration');
    return;
  }

  // Execute MCP handler with arguments
  try {
    const { spawnSync } = require('child_process');
    const result = spawnSync('node', [mcpHandler, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    if (result.error) {
      error(`Failed to execute MCP command: ${result.error.message}`);
    }

    process.exit(result.status || 0);
  } catch (err) {
    error(`MCP command failed: ${err.message}`);
  }
};

// Check prerequisites
const checkPrerequisites = () => {
  const requirements = [
    { cmd: 'git --version', name: 'Git' },
    { cmd: 'node --version', name: 'Node.js' }
  ];

  const missing = [];

  requirements.forEach(req => {
    try {
      execSync(req.cmd, { stdio: 'pipe' });
    } catch (err) {
      missing.push(req.name);
    }
  });

  if (missing.length > 0) {
    error(`Missing requirements: ${missing.join(', ')}`);
  }
};

// Parse command line arguments
const parseArgs = (args) => {
  const parsed = {
    command: 'help',
    options: {},
    path: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--') || arg.startsWith('-')) {
      // Handle options
      switch (arg) {
        case '--help':
        case '-h':
          parsed.command = 'help';
          return parsed;
        case '--version':
        case '-v':
          parsed.command = 'version';
          return parsed;
        case '--verbose':
          parsed.options.verbose = true;
          break;
        case '--no-backup':
          parsed.options.noBackup = true;
          break;
        case '--config':
        case '-c':
          // Configuration preset: minimal, docker, devops, performance
          if (i + 1 < args.length) {
            parsed.options.config = args[++i];
          }
          break;
        case '--yes':
        case '-y':
          // Auto-accept all prompts
          parsed.options.autoAccept = true;
          break;
        case '--no-env':
          // Skip .env setup
          parsed.options.skipEnv = true;
          break;
        case '--no-hooks':
          // Skip git hooks installation
          parsed.options.skipHooks = true;
          break;
        case '--cicd':
          // CI/CD system choice
          if (i + 1 < args.length) {
            parsed.options.cicd = args[++i];
          }
          break;
        default:
          warning(`Unknown option: ${arg}`);
      }
    } else if (!parsed.command || parsed.command === 'help') {
      // First non-option argument is the command
      parsed.command = arg;
    } else if (!parsed.path) {
      // Second non-option argument is the path/name
      parsed.path = arg;
    }
  }

  return parsed;
};

// Main function
const main = () => {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // Set verbose mode
  if (parsed.options.verbose) {
    process.env.VERBOSE = '1';
  }

  switch (parsed.command) {
    case 'help':
      showHelp();
      break;

    case 'version':
      showVersion();
      break;

    case 'install':
      checkPrerequisites();
      printBanner();
      info('Starting ClaudeAutoPM installation...');
      executeBashScript(INSTALL_SCRIPT, parsed.path ? [parsed.path] : [], parsed.options);
      break;

    case 'update':
      checkPrerequisites();
      printBanner();
      info('Updating ClaudeAutoPM installation...');
      executeBashScript(INSTALL_SCRIPT, parsed.path ? [parsed.path] : []);
      break;

    case 'merge':
      printBanner();
      info('Starting CLAUDE.md merge helper...');
      executeBashScript(MERGE_SCRIPT);
      break;

    case 'setup-env':
      printBanner();
      info('Starting interactive .env configuration...');
      executeBashScript(ENV_SETUP_SCRIPT, parsed.path ? [parsed.path] : []);
      break;

    case 'init':
      checkPrerequisites();
      printBanner();
      initProject(parsed.path);
      break;

    case 'config':
      printBanner();
      info('Starting ClaudeAutoPM configuration...');
      executeBashScript(path.join(PACKAGE_DIR, '.claude', 'scripts', 'config', 'toggle-features.sh'), []);
      break;

    case 'mcp':
      // Handle MCP subcommands
      handleMCPCommand(args.slice(1));
      break;

    default:
      error(`Unknown command: ${parsed.command}. Use 'autopm help' for usage.`);
  }
};

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n👋 Installation cancelled by user', 'yellow');
  process.exit(0);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  main,
  showHelp,
  showVersion,
  initProject
};