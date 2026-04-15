/**
 * CLI Obsidian Commands
 * Manage Obsidian vault integration — setup, sync, diagnostics
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PLUGIN_DIR = 'packages/plugin-obsidian';
const SCRIPTS_DIR = path.join(PLUGIN_DIR, 'scripts', 'obsidian');

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
 * Check if plugin-obsidian is installed
 */
function checkPlugin(root) {
  const pluginJson = path.join(root, PLUGIN_DIR, 'plugin.json');
  if (!fs.existsSync(pluginJson)) {
    console.error('❌ plugin-obsidian not installed.');
    console.error('   Run: autopm install --scenario=obsidian');
    process.exit(1);
  }
}

/**
 * autopm obsidian setup
 */
async function obsidianSetup(argv) {
  const root = findProjectRoot();
  checkPlugin(root);

  const scriptPath = path.join(root, SCRIPTS_DIR, 'setup.js');
  if (!fs.existsSync(scriptPath)) {
    console.error('❌ Setup script not found:', scriptPath);
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
  checkPlugin(root);

  // Prefer shell script, fall back to Node
  const shPath = path.join(root, SCRIPTS_DIR, 'sync-to-obsidian.sh');
  const jsPath = path.join(root, SCRIPTS_DIR, 'sync-to-obsidian.js');

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
    console.error('❌ Sync script not found. Reinstall plugin-obsidian.');
    process.exit(1);
  }

  const child = spawn(cmd, cmdArgs, {
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
  checkPlugin(root);

  const scriptPath = path.join(root, SCRIPTS_DIR, 'doctor.js');
  if (!fs.existsSync(scriptPath)) {
    console.error('❌ Doctor script not found:', scriptPath);
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
            describe: 'Path to your Obsidian vault folder',
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
          .example('autopm obsidian setup --vault-path ~/Vaults/MyVault', 'Setup with vault path')
          .example('autopm obsidian setup --vault-path ~/Vaults/Shared --prefix my-project', 'Setup with prefix');
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
    console.log('\nUsage: autopm obsidian <command>\n');
    console.log('Commands:');
    console.log('  setup    Configure Obsidian vault integration');
    console.log('  sync     Sync project files to Obsidian vault');
    console.log('  doctor   Diagnose common integration issues');
    console.log('\nRun autopm obsidian <command> --help for details\n');
  }
};
