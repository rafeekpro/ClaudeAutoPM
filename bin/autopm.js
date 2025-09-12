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
const executeBashScript = (scriptPath, args = []) => {
  if (!fs.existsSync(scriptPath)) {
    error(`Script not found: ${scriptPath}`);
  }

  const command = isWindows ? 'bash' : scriptPath;
  const scriptArgs = isWindows ? [scriptPath, ...args] : args;

  try {
    const result = spawn(command, scriptArgs, {
      stdio: 'inherit',
      cwd: process.cwd()
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
  log('║              🤖 ClaudeAutoPM CLI                   ║', 'cyan');
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
  log('  setup-env [path]   Interactive .env configuration setup');
  log('  init               Initialize new project with ClaudeAutoPM');
  log('  version            Show version information');
  log('  help               Show this help message');
  log('');
  log('GLOBAL OPTIONS:', 'yellow');
  log('  --help, -h         Show help');
  log('  --version, -v      Show version');
  log('  --verbose          Verbose output');
  log('  --no-backup        Skip creating backups (not recommended)');
  log('');
  log('EXAMPLES:', 'yellow');
  log('  autopm install                    # Install to current directory');
  log('  autopm install ~/my-project       # Install to specific directory');
  log('  autopm update                     # Update existing installation');
  log('  autopm merge                      # Generate CLAUDE.md merge prompt');
  log('  autopm setup-env                  # Configure .env interactively');
  log('  autopm setup-env ~/my-project     # Configure .env for specific project');
  log('  autopm init my-new-project        # Initialize new project');
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
      executeBashScript(INSTALL_SCRIPT, parsed.path ? [parsed.path] : []);
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