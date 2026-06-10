/**
 * CLI Obsidian Commands
 * Manage Obsidian vault integration — setup, sync, diagnostics
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

/**
 * Find project root by walking up from cwd
 */
function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.claude', 'config.json')) ||
        fs.existsSync(path.join(dir, 'CLAUDE.md'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

/**
 * Find scripts directory — checks installed location first, then source repo
 */
function findScriptsDir(root) {
  const installed = path.join(root, '.claude', 'scripts', 'obsidian');
  if (fs.existsSync(installed)) return installed;

  const source = path.join(root, 'packages', 'plugin-obsidian', 'scripts', 'obsidian');
  if (fs.existsSync(source)) return source;

  return null;
}

/**
 * Check if plugin-obsidian is installed, return scripts dir
 */
function checkPlugin(root) {
  const scriptsDir = findScriptsDir(root);
  if (!scriptsDir) {
    logger.error('❌ plugin-obsidian not installed.');
    logger.error('   Run: autopm install --scenario=obsidian');
    process.exit(1);
  }
  return scriptsDir;
}

/**
 * autopm obsidian setup
 */
async function obsidianSetup(argv) {
  const root = findProjectRoot();
  const scriptsDir = checkPlugin(root);

  const scriptPath = path.join(scriptsDir, 'setup.js');
  if (!fs.existsSync(scriptPath)) {
    logger.error('❌ Setup script not found:', scriptPath);
    process.exit(1);
  }

  const args = [];
  if (argv.vaultPath) args.push('--vault-path', argv.vaultPath);
  if (argv.prefix) args.push('--prefix', argv.prefix);
  if (argv.watch === true) args.push('--watch');
  if (argv.watch === false) args.push('--no-watch');
  args.push('--project-root', root);

  const child = spawn('node', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: root
  });

  child.on('close', (code) => process.exit(code || 0));
}

/**
 * autopm obsidian sync
 */
async function obsidianSync(argv) {
  const root = findProjectRoot();
  const scriptsDir = checkPlugin(root);

  // Prefer shell script, fall back to Node
  const shPath = path.join(scriptsDir, 'sync-to-obsidian.sh');
  const jsPath = path.join(scriptsDir, 'sync-to-obsidian.js');

  const args = [];
  if (argv.watch) args.push('--watch');
  if (argv.check) args.push('--check');
  if (argv.safeMode) args.push('--safe-mode');
  args.push('--project-root', root);

  let cmd, cmdArgs;
  if (fs.existsSync(shPath)) {
    cmd = 'bash';
    cmdArgs = [shPath, ...args];
  } else if (fs.existsSync(jsPath)) {
    cmd = 'node';
    cmdArgs = [jsPath, ...args];
  } else {
    logger.error('❌ Sync script not found. Reinstall plugin-obsidian.');
    process.exit(1);
  }

  const child = spawn(cmd, cmdArgs, {
    stdio: 'inherit',
    cwd: root
  });

  child.on('close', (code) => process.exit(code || 0));
}

/**
 * autopm obsidian link
 */
async function obsidianLink(argv) {
  const root = findProjectRoot();
  checkPlugin(root);

  // Check multiple locations for link-vault.js
  const candidates = [
    path.join(root, '.claude', 'scripts', 'obsidian', 'link-vault.js'),
    path.join(root, 'packages', 'plugin-obsidian', 'scripts', 'obsidian', 'link-vault.js'),
  ];
  const scriptPath = candidates.find(p => fs.existsSync(p));
  if (!scriptPath) {
    logger.error('❌ Link script not found. Reinstall plugin-obsidian.');
    process.exit(1);
  }

  const args = ['--project-root', root];
  if (argv.dryRun) args.push('--dry-run');

  const child = spawn('node', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: root
  });

  child.on('close', (code) => process.exit(code || 0));
}

/**
 * autopm obsidian doctor
 */
async function obsidianDoctor(argv) {
  const root = findProjectRoot();
  const scriptsDir = checkPlugin(root);

  const scriptPath = path.join(scriptsDir, 'doctor.js');
  if (!fs.existsSync(scriptPath)) {
    logger.error('❌ Doctor script not found:', scriptPath);
    process.exit(1);
  }

  const args = ['--project-root', root];

  const child = spawn('node', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: root
  });

  child.on('close', (code) => process.exit(code || 0));
}

/**
 * Command builder — registers subcommands
 */
function builder(yargs) {
  return yargs
    .command(
      'setup',
      'Configure Obsidian vault integration',
      (yargs) => {
        return yargs
          .option('vault-path', {
            describe: 'Path to your Obsidian vault folder (use quotes if path has spaces)',
            type: 'string',
            demandOption: true
          })
          .option('prefix', {
            describe: 'Subfolder name in vault (default: project directory name)',
            type: 'string'
          })
          .option('watch', {
            describe: 'Enable continuous sync after setup',
            type: 'boolean'
          })
          .example('autopm obsidian setup --vault-path "/mnt/c/Users/You/My Vault"', 'WSL')
          .example('autopm obsidian setup --vault-path "/Users/you/My Vault"', 'macOS')
          .example('autopm obsidian setup --vault-path "/home/you/My Vault" --prefix my-project', 'Linux with prefix');
      },
      obsidianSetup
    )
    .command(
      'sync',
      'Sync project files to Obsidian vault',
      (yargs) => {
        return yargs
          .option('watch', {
            describe: 'Continuous sync on file changes',
            type: 'boolean',
            default: false
          })
          .option('check', {
            describe: 'Dry-run: show what would be synced',
            type: 'boolean',
            default: false
          })
          .option('safe-mode', {
            describe: 'Never delete vault files (omit --delete from rsync)',
            type: 'boolean',
            default: false
          })
          .example('autopm obsidian sync', 'One-shot sync')
          .example('autopm obsidian sync --watch', 'Continuous sync')
          .example('autopm obsidian sync --check', 'Dry-run');
      },
      obsidianSync
    )
    .command(
      'link',
      'Inject [[wikilinks]] into project files for Obsidian Graph View',
      (yargs) => {
        return yargs
          .option('dry-run', {
            describe: 'Show what would be linked without modifying files',
            type: 'boolean',
            default: false
          })
          .example('autopm obsidian link', 'Link all project files')
          .example('autopm obsidian link --dry-run', 'Preview changes');
      },
      obsidianLink
    )
    .command(
      'doctor',
      'Diagnose common Obsidian integration issues',
      (yargs) => {
        return yargs
          .example('autopm obsidian doctor', 'Run all diagnostic checks');
      },
      obsidianDoctor
    )
    .demandCommand(1, 'You must specify an obsidian command')
    .strictCommands()
    .help();
}

module.exports = {
  command: 'obsidian',
  describe: 'Manage Obsidian vault integration (setup, sync, diagnostics)',
  builder,
  handler: (argv) => {
    logger.log('\nUsage: autopm obsidian <command>\n');
    logger.log('Commands:');
    logger.log('  setup    Configure Obsidian vault integration');
    logger.log('  sync     Sync project files to Obsidian vault');
    logger.log('  link     Inject [[wikilinks]] for Graph View');
    logger.log('  doctor   Diagnose common integration issues');
    logger.log('\nRun autopm obsidian <command> --help for details\n');
  }
};
