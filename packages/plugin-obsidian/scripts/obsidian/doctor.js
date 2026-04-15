#!/usr/bin/env node
/**
 * doctor.js -- Obsidian integration diagnostics.
 *
 * Reports and suggests fixes for five canonical Obsidian integration problems.
 * ESM module, Node built-ins only, executable with shebang.
 *
 * Usage:
 *   node doctor.js [OPTIONS]
 *
 * Options:
 *   --project-root DIR   Override project root (for testing)
 *   -h, --help           Show help
 */

import {
  readFileSync,
  existsSync,
  writeFileSync,
  lstatSync,
  realpathSync,
  accessSync,
  constants as fsConstants,
  unlinkSync,
} from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_NAME = 'doctor.js';
const SCRIPT_VERSION = '1.0.0';

// --- Output helpers ---------------------------------------------------------

const STATUS_PASS = '\u2705';
const STATUS_WARN = '\u26A0\uFE0F';
const STATUS_FAIL = '\u274C';

function padRight(str, len) {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

function formatRow(icon, label, status, detail) {
  return `${icon}  ${padRight(label, 24)} ${padRight(status, 12)} ${detail}`;
}

// --- Usage / help -----------------------------------------------------------

function usage() {
  const text = `Usage: ${SCRIPT_NAME} [OPTIONS]

Obsidian integration diagnostics -- checks for common problems and suggests fixes.

Options:
  --project-root DIR   Override project root (for testing)
  -h, --help           Show this help message`;
  console.log(text);
}

// --- Argument parsing -------------------------------------------------------

function parseArgs(argv) {
  const opts = { projectRoot: '' };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case '--project-root':
        if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
          console.error('[error] --project-root requires a directory argument');
          process.exit(1);
        }
        opts.projectRoot = argv[i + 1];
        i += 2;
        break;
      case '-h':
      case '--help':
        usage();
        process.exit(0);
        break;
      default:
        console.error(`[error] Unknown option: ${arg}`);
        console.log('');
        usage();
        process.exit(1);
    }
  }

  return opts;
}

// --- Project root detection -------------------------------------------------

function findProjectRoot(overridePath) {
  if (overridePath) {
    return resolve(overridePath);
  }

  let dir = __dirname;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, '.claude', 'config.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }

  console.error('[error] Could not find project root (no .claude/config.json found)');
  process.exit(1);
}

// --- Config loading ---------------------------------------------------------

function readConfig(root) {
  const configFile = join(root, '.claude', 'config.json');

  if (!existsSync(configFile)) {
    return { error: `Config not found: ${configFile}` };
  }

  let cfg;
  try {
    cfg = JSON.parse(readFileSync(configFile, 'utf8'));
  } catch (e) {
    return { error: `Failed to parse ${configFile}: ${e.message}` };
  }

  const vaultPath = cfg?.obsidian?.vault_path;
  if (!vaultPath) {
    return { error: `obsidian.vault_path not set in ${configFile}` };
  }

  const vaultPrefix = cfg?.obsidian?.vault_prefix || basename(root);

  return { vaultPath, vaultPrefix };
}

// --- OS detection -----------------------------------------------------------

function detectOS() {
  const p = platform();
  if (p === 'darwin') return 'darwin';
  if (p === 'linux') {
    try {
      const procVersion = readFileSync('/proc/version', 'utf8');
      if (/microsoft/i.test(procVersion)) return 'wsl';
    } catch {
      // ignore
    }
    return 'linux';
  }
  return 'linux';
}

// --- Check functions --------------------------------------------------------

function checkRsync() {
  try {
    const rsyncPath = execSync('which rsync', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return { status: 'pass', label: 'rsync', state: 'installed', detail: rsyncPath };
  } catch {
    const os = detectOS();
    let installCmd = 'sudo apt install rsync';
    if (os === 'darwin') installCmd = 'brew install rsync';
    return {
      status: 'fail',
      label: 'rsync',
      state: 'missing',
      detail: `Install: ${installCmd}`,
    };
  }
}

function checkWatchTools() {
  const os = detectOS();
  const results = [];

  if (os === 'linux' || os === 'wsl') {
    try {
      const toolPath = execSync('which inotifywait', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
      results.push({
        status: 'pass',
        label: 'inotify-tools',
        state: 'installed',
        detail: toolPath,
      });
    } catch {
      results.push({
        status: 'warn',
        label: 'inotify-tools',
        state: 'missing',
        detail: 'Install: sudo apt install inotify-tools',
      });
    }
  }

  if (os === 'darwin') {
    try {
      const toolPath = execSync('which fswatch', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
      results.push({
        status: 'pass',
        label: 'fswatch',
        state: 'installed',
        detail: toolPath,
      });
    } catch {
      results.push({
        status: 'warn',
        label: 'fswatch',
        state: 'missing',
        detail: 'Install: brew install fswatch',
      });
    }
  }

  return results;
}

function checkVaultPath(config) {
  const { vaultPath } = config;

  if (!existsSync(vaultPath)) {
    return {
      status: 'fail',
      label: 'Vault path',
      state: 'not found',
      detail: vaultPath,
    };
  }

  // Check write access by writing a temp file
  const tmpFile = join(vaultPath, '.doctor-write-test');
  try {
    writeFileSync(tmpFile, 'test');
    unlinkSync(tmpFile);
  } catch {
    return {
      status: 'fail',
      label: 'Vault path',
      state: 'not writable',
      detail: vaultPath,
    };
  }

  return {
    status: 'pass',
    label: 'Vault path',
    state: 'ok',
    detail: vaultPath,
  };
}

function checkDotfolderIssues(root) {
  const claudeIssues = join(root, '.claude', 'issues');
  const topIssues = join(root, 'issues');

  // Check if .claude/issues is a symlink first -- that is handled by checkSymlink
  try {
    const stat = lstatSync(claudeIssues);
    if (stat.isSymbolicLink()) {
      // Symlink case is handled separately
      return { status: 'pass', label: 'Issues location', state: 'ok', detail: 'symlink exists' };
    }
  } catch {
    // .claude/issues does not exist at all
  }

  const claudeIssuesExists = existsSync(claudeIssues);
  const topIssuesExists = existsSync(topIssues);

  if (claudeIssuesExists && !topIssuesExists) {
    return {
      status: 'fail',
      label: 'Issues location',
      state: 'dotfolder',
      detail: 'Move .claude/issues/ to issues/',
    };
  }

  if (topIssuesExists) {
    return {
      status: 'pass',
      label: 'Issues location',
      state: 'ok',
      detail: 'issues/',
    };
  }

  // Neither exists -- no issues yet, that is fine
  return {
    status: 'pass',
    label: 'Issues location',
    state: 'ok',
    detail: 'no issues directory (ok)',
  };
}

function checkDataviewPrefix(config) {
  const { vaultPath, vaultPrefix } = config;
  const prefixDir = join(vaultPath, vaultPrefix);

  if (!existsSync(prefixDir)) {
    return {
      status: 'warn',
      label: 'Dataview prefix',
      state: 'missing',
      detail: `${prefixDir} does not exist. Run obsidian:sync first.`,
    };
  }

  return {
    status: 'pass',
    label: 'Dataview prefix',
    state: 'correct',
    detail: vaultPrefix,
  };
}

function checkSymlink(root) {
  const claudeIssues = join(root, '.claude', 'issues');

  let stat;
  try {
    stat = lstatSync(claudeIssues);
  } catch {
    // .claude/issues does not exist -- no symlink to check
    return {
      status: 'pass',
      label: 'Symlink',
      state: 'ok',
      detail: 'no symlink (not migrated)',
    };
  }

  if (!stat.isSymbolicLink()) {
    // It is a real directory, not a symlink -- handled by dotfolder check
    return {
      status: 'pass',
      label: 'Symlink',
      state: 'ok',
      detail: 'no symlink',
    };
  }

  // It is a symlink -- verify target exists
  try {
    const target = realpathSync(claudeIssues);
    if (existsSync(target)) {
      return {
        status: 'pass',
        label: 'Symlink',
        state: 'ok',
        detail: `.claude/issues -> ${target}`,
      };
    }
  } catch {
    // realpathSync fails if target does not exist
  }

  return {
    status: 'warn',
    label: 'Symlink',
    state: 'broken',
    detail: '.claude/issues points to non-existent target',
  };
}

// --- Main -------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);
  const root = findProjectRoot(opts.projectRoot);

  // Load config
  const config = readConfig(root);
  if (config.error) {
    console.error(`[error] ${config.error}`);
    process.exit(1);
  }

  // Collect results
  const results = [];
  let passed = 0;
  let warnings = 0;
  let errors = 0;

  // 1. Check rsync
  results.push(checkRsync());

  // 2. Check watch tools (optional)
  const watchResults = checkWatchTools();
  results.push(...watchResults);

  // 3. Check vault path
  results.push(checkVaultPath(config));

  // 4. Check dotfolder issues
  results.push(checkDotfolderIssues(root));

  // 5. Check Dataview prefix
  results.push(checkDataviewPrefix(config));

  // 6. Check symlink
  results.push(checkSymlink(root));

  // Count
  for (const r of results) {
    if (r.status === 'pass') passed++;
    else if (r.status === 'warn') warnings++;
    else errors++;
  }

  // Output
  console.log('');
  console.log('Obsidian Doctor');
  console.log('\u2550'.repeat(60));
  console.log('');

  for (const r of results) {
    let icon;
    if (r.status === 'pass') icon = STATUS_PASS;
    else if (r.status === 'warn') icon = STATUS_WARN;
    else icon = STATUS_FAIL;

    console.log(formatRow(icon, r.label, r.state, r.detail));
  }

  console.log('');
  console.log('\u2550'.repeat(60));

  const parts = [];
  parts.push(`${passed} passed`);
  if (warnings > 0) parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  if (errors > 0) parts.push(`${errors} error${errors > 1 ? 's' : ''}`);
  console.log(`Result: ${parts.join(', ')}`);
  console.log('');

  process.exit(errors > 0 ? 1 : 0);
}

main();
