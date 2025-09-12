#!/usr/bin/env node

/**
 * AUTOPM Setup-Env CLI - Interactive .env Configuration
 * Standalone CLI for setting up environment configuration
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const error = (message) => {
  log(`❌ ${message}`, 'red');
  process.exit(1);
};

// Paths
const SCRIPT_DIR = __dirname;
const PACKAGE_DIR = path.dirname(SCRIPT_DIR);
const ENV_SETUP_SCRIPT = path.join(PACKAGE_DIR, 'install', 'setup-env.sh');

// Check if running on Windows
const isWindows = os.platform() === 'win32';

// Execute bash script
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
      if (code !== 0) {
        process.exit(code);
      }
    });

  } catch (err) {
    error(`Failed to execute script: ${err.message}`);
  }
};

// Main function
const main = () => {
  const args = process.argv.slice(2);
  
  log('🔧 AUTOPM Interactive .env Configuration', 'cyan');
  log('');
  
  // Pass all arguments to the bash script
  executeBashScript(ENV_SETUP_SCRIPT, args);
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };