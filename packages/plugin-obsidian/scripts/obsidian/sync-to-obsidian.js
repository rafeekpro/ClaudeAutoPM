#!/usr/bin/env node
/**
 * sync-to-obsidian.js — Unidirectional sync: project -> Obsidian vault
 *
 * Node.js fallback that mirrors sync-to-obsidian.sh for environments
 * without bash.
 *
 * Usage:
 *   node sync-to-obsidian.js [OPTIONS]
 *
 * Options:
 *   --check          Dry-run mode (show what would be synced)
 *   --watch          Continuous sync on file changes
 *   --safe-mode      Omit --delete from rsync (never remove vault files)
 *   --project-root DIR   Override project root (default: auto-detect)
 *   -h, --help       Show this help message
 *   -v, --version    Show version
 */

import {
  readFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  accessSync,
  constants as fsConstants,
  watch as fsWatch,
} from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Constants ──────────────────────────────────────────────────────

const SCRIPT_NAME = 'sync-to-obsidian.js';
const SCRIPT_VERSION = '1.0.0';

const RSYNC_EXCLUDES = [
  '.git/',
  'node_modules/',
  '*.png',
  '*.jpg',
  '*.gif',
  '*.mp4',
  '__pycache__/',
  '.env',
];

const CLAUDE_SYNC_DIRS = ['agents', 'commands', 'rules', 'epics', 'prds'];

// ─── Output helpers ─────────────────────────────────────────────────

function syncLog(...args) {
  console.log(`[sync]  ${args.join(' ')}`);
}

function watchLog(...args) {
  console.log(`[watch] ${args.join(' ')}`);
}

function err(...args) {
  console.error(`[error] ${args.join(' ')}`);
}

// ─── Usage / help ───────────────────────────────────────────────────

function usage() {
  const text = `Usage: ${SCRIPT_NAME} [OPTIONS]

Sync project markdown to an Obsidian vault (unidirectional: project -> vault).

Options:
  --check          Dry-run: show what would be synced (rsync --dry-run)
  --watch          Continuous sync on file changes
  --safe-mode      Omit --delete from rsync (never remove vault files)
  --project-root DIR  Override project root directory
  -h, --help       Show this help message
  -v, --version    Show version

Modes can be combined: --watch --safe-mode

Configuration (.claude/config.json):
  {
    "obsidian": {
      "vault_path": "/path/to/vault",
      "vault_prefix": "my-project",
      "watch": false
    }
  }`;
  console.log(text);
}

// ─── Argument parsing ───────────────────────────────────────────────

function parseArgs(argv) {
  const opts = {
    check: false,
    watch: false,
    safe: false,
    projectRoot: '',
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case '--check':
        opts.check = true;
        i++;
        break;
      case '--watch':
        opts.watch = true;
        i++;
        break;
      case '--safe-mode':
        opts.safe = true;
        i++;
        break;
      case '--project-root':
        if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
          err('--project-root requires a directory argument');
          process.exit(1);
        }
        opts.projectRoot = argv[i + 1];
        i += 2;
        break;
      case '-h':
      case '--help':
        usage();
        process.exit(0);
        break; // unreachable but conventional
      case '-v':
      case '--version':
        console.log(`${SCRIPT_NAME} ${SCRIPT_VERSION}`);
        process.exit(0);
        break;
      default:
        err(`Unknown option: ${arg}`);
        console.log('');
        usage();
        process.exit(1);
    }
  }

  return opts;
}

// ─── Project root detection ─────────────────────────────────────────

function findProjectRoot(overridePath) {
  if (overridePath) {
    return resolve(overridePath);
  }

  // Walk up from script location looking for .claude/config.json
  let dir = __dirname;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, '.claude', 'config.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }

  err('Could not find project root (no .claude/config.json found)');
  process.exit(1);
}

// ─── Config loading ─────────────────────────────────────────────────

function readConfig(root, opts) {
  const configFile = join(root, '.claude', 'config.json');

  if (!existsSync(configFile)) {
    err(`Config not found: ${configFile}`);
    err('Run the Obsidian setup wizard or add obsidian settings to .claude/config.json');
    process.exit(1);
  }

  let cfg;
  try {
    cfg = JSON.parse(readFileSync(configFile, 'utf8'));
  } catch (e) {
    err(`Failed to parse ${configFile}: ${e.message}`);
    process.exit(1);
  }

  const vaultPath = cfg?.obsidian?.vault_path;
  if (!vaultPath) {
    err(`obsidian.vault_path not set in ${configFile}`);
    err('Add: { "obsidian": { "vault_path": "/path/to/vault" } }');
    process.exit(1);
  }

  const vaultPrefix = cfg?.obsidian?.vault_prefix || basename(root);

  // Check watch config (can be overridden by --watch flag)
  if (!opts.watch && cfg?.obsidian?.watch === true) {
    opts.watch = true;
  }

  // Validate vault path exists
  if (!existsSync(vaultPath)) {
    err(`Vault path does not exist: ${vaultPath}`);
    err('Create it or update obsidian.vault_path in .claude/config.json');
    process.exit(1);
  }

  // Validate vault path is writable
  try {
    accessSync(vaultPath, fsConstants.W_OK);
  } catch {
    err(`Vault path is not writable: ${vaultPath}`);
    process.exit(1);
  }

  return { vaultPath, vaultPrefix };
}

// ─── OS detection ───────────────────────────────────────────────────

function detectOS() {
  const p = platform();
  if (p === 'darwin') {
    return 'darwin';
  }
  if (p === 'linux') {
    try {
      const procVersion = readFileSync('/proc/version', 'utf8');
      if (/microsoft/i.test(procVersion)) {
        return 'wsl';
      }
    } catch {
      // /proc/version not available, assume linux
    }
    return 'linux';
  }
  return 'linux'; // best-effort fallback
}

// ─── Dependency checks ─────────────────────────────────────────────

function checkRsync() {
  try {
    execSync('command -v rsync', { stdio: 'ignore' });
  } catch {
    err('rsync is required but not found');
    err('Install: sudo apt install rsync  (Linux)  /  brew install rsync  (macOS)');
    process.exit(1);
  }
}

function checkWatchTool(os) {
  if (os === 'linux' || os === 'wsl') {
    try {
      execSync('command -v inotifywait', { stdio: 'ignore' });
    } catch {
      // Fall back to Node fs.watch — no external tool required for Node fallback
      return 'node';
    }
    return 'inotifywait';
  }
  if (os === 'darwin') {
    try {
      execSync('command -v fswatch', { stdio: 'ignore' });
    } catch {
      return 'node';
    }
    return 'fswatch';
  }
  return 'node';
}

// ─── Rsync output filtering ────────────────────────────────────────

function printRsyncOutput(stdout) {
  if (!stdout) return;
  const lines = stdout
    .split('\n')
    .filter(
      (line) =>
        line.trim() !== '' &&
        !line.startsWith('sending') &&
        !line.startsWith('sent ') &&
        !line.startsWith('total ')
    );
  if (lines.length > 0) {
    console.log(lines.join('\n'));
  }
}

// ─── Build rsync arguments ─────────────────────────────────────────

function buildRsyncArgs(opts) {
  const args = ['-av'];

  for (const excl of RSYNC_EXCLUDES) {
    args.push(`--exclude=${excl}`);
  }

  // Include only markdown files (and directories for traversal)
  args.push('--include=*/', '--include=*.md', '--exclude=*');

  if (opts.check) {
    args.push('--dry-run');
  }

  if (!opts.safe) {
    args.push('--delete');
  }

  return args;
}

// ─── Sync a single source dir to vault ──────────────────────────────

function syncDir(src, dest, label, opts) {
  if (!existsSync(src)) {
    return; // Skip non-existent optional dirs silently
  }

  syncLog(`Syncing ${label} -> ${dest}`);

  // Ensure trailing slashes for rsync
  const srcSlash = src.endsWith('/') ? src : `${src}/`;
  const destSlash = dest.endsWith('/') ? dest : `${dest}/`;

  // Only create destination in non-dry-run mode
  if (!opts.check) {
    mkdirSync(destSlash, { recursive: true });
  }

  const rsyncArgs = buildRsyncArgs(opts);
  rsyncArgs.push(srcSlash, destSlash);

  const result = spawnSync('rsync', rsyncArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  printRsyncOutput(result.stdout);

  if (result.status !== 0 && result.stderr) {
    err(result.stderr.trim());
  }
}

// ─── Sync root-level markdown files ────────────────────────────────

function syncRootMarkdown(root, dest, opts) {
  let mdFiles;
  try {
    mdFiles = readdirSync(root)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => {
        try {
          return statSync(join(root, f)).isFile();
        } catch {
          return false;
        }
      });
  } catch {
    return;
  }

  if (mdFiles.length === 0) {
    return;
  }

  syncLog(`Syncing root *.md -> ${dest}`);

  if (opts.check) {
    for (const f of mdFiles) {
      console.log(`  ${f} (dry-run)`);
    }
    return;
  }

  mkdirSync(dest, { recursive: true });

  // Use rsync for root markdown files to maintain consistency
  const rsyncArgs = ['-av'];
  for (const excl of RSYNC_EXCLUDES) {
    rsyncArgs.push(`--exclude=${excl}`);
  }
  rsyncArgs.push('--include=*.md', '--exclude=*');
  // No --delete for root files (matches shell script cp behaviour)

  const srcSlash = root.endsWith('/') ? root : `${root}/`;
  const destSlash = dest.endsWith('/') ? dest : `${dest}/`;
  rsyncArgs.push(srcSlash, destSlash);

  const result = spawnSync('rsync', rsyncArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  printRsyncOutput(result.stdout);
}

// ─── Count synced files ─────────────────────────────────────────────

function countVaultFiles(dest) {
  if (!existsSync(dest)) {
    return 0;
  }

  let count = 0;
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (st.isDirectory()) {
          walk(full);
        } else if (st.isFile() && entry.endsWith('.md')) {
          count++;
        }
      } catch {
        // skip inaccessible entries
      }
    }
  }
  walk(dest);
  return count;
}

// ─── Main sync operation ───────────────────────────────────────────

function runSync(root, vaultPath, vaultPrefix, opts) {
  const vaultDest = join(vaultPath, vaultPrefix);

  if (opts.check) {
    syncLog('Dry-run mode: showing what would be synced');
  }
  if (opts.safe) {
    syncLog('Safe mode: will not delete files in vault');
  }

  syncLog(`Starting sync: ${root} -> ${vaultDest}`);

  // Sync .claude/* subdirectories to visible vault paths
  for (const dirName of CLAUDE_SYNC_DIRS) {
    const src = join(root, '.claude', dirName);
    const dest = join(vaultDest, dirName);
    syncDir(src, dest, `.claude/${dirName}/`, opts);
  }

  // Sync issues/ if it exists
  syncDir(join(root, 'issues'), join(vaultDest, 'issues'), 'issues/', opts);

  // Sync root markdown files
  syncRootMarkdown(root, vaultDest, opts);

  if (!opts.check) {
    const fileCount = countVaultFiles(vaultDest);
    syncLog(`Done: ${fileCount} files synced`);
  } else {
    syncLog('Done: dry-run complete (no files changed)');
  }
}

// ─── Watch mode ────────────────────────────────────────────────────

function startWatch(root, vaultPath, vaultPrefix, opts) {
  const os = detectOS();
  const watchTool = checkWatchTool(os);

  watchLog('Watching for changes... (Ctrl+C to stop)');

  if (watchTool === 'node') {
    watchWithNode(root, vaultPath, vaultPrefix, opts);
  } else if (watchTool === 'inotifywait') {
    watchWithInotify(root, vaultPath, vaultPrefix, opts);
  } else if (watchTool === 'fswatch') {
    watchWithFswatch(root, vaultPath, vaultPrefix, opts);
  }
}

function watchWithNode(root, vaultPath, vaultPrefix, opts) {
  // Build list of directories to watch
  const watchPaths = [];
  for (const dirName of CLAUDE_SYNC_DIRS) {
    const d = join(root, '.claude', dirName);
    if (existsSync(d)) {
      watchPaths.push(d);
    }
  }
  const issuesDir = join(root, 'issues');
  if (existsSync(issuesDir)) {
    watchPaths.push(issuesDir);
  }
  watchPaths.push(root);

  let debounceTimer = null;

  const triggerSync = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      watchLog('Change detected, syncing...');
      try {
        runSync(root, vaultPath, vaultPrefix, opts);
      } catch (e) {
        err(e.message);
      }
    }, 300);
  };

  for (const watchPath of watchPaths) {
    try {
      fsWatch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.md')) {
          triggerSync();
        }
      });
    } catch {
      // Recursive watch may not be supported on all platforms; try non-recursive
      try {
        fsWatch(watchPath, (eventType, filename) => {
          if (filename && filename.endsWith('.md')) {
            triggerSync();
          }
        });
      } catch (e) {
        err(`Cannot watch ${watchPath}: ${e.message}`);
      }
    }
  }

  // Keep process alive
  setInterval(() => {}, 1_000_000);
}

function watchWithInotify(root, vaultPath, vaultPrefix, opts) {
  // For the Node.js fallback, we use Node's fs.watch instead of inotifywait
  watchWithNode(root, vaultPath, vaultPrefix, opts);
}

function watchWithFswatch(root, vaultPath, vaultPrefix, opts) {
  // For the Node.js fallback, we use Node's fs.watch instead of fswatch
  watchWithNode(root, vaultPath, vaultPrefix, opts);
}

process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// ─── Entry point ───────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  checkRsync();

  const root = findProjectRoot(opts.projectRoot);
  const { vaultPath, vaultPrefix } = readConfig(root, opts);

  // Initial sync
  runSync(root, vaultPath, vaultPrefix, opts);

  // Enter watch mode if requested
  if (opts.watch) {
    startWatch(root, vaultPath, vaultPrefix, opts);
  }
}

main();
