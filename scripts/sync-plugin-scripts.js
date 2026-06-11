#!/usr/bin/env node
/**
 * Sync shared scripts from the single source of truth
 * (packages/plugin-core/scripts) into its two consumers:
 *
 *   - the installer payload at `autopm/` + `.claude/scripts` (shipped to user projects)
 *   - this repo's own installed copy at `.claude/scripts`
 *
 * Usage:
 *   node scripts/sync-plugin-scripts.js            # copy (repair) targets
 *   node scripts/sync-plugin-scripts.js --check    # report divergence, exit 1
 *
 * Options (mainly for tests):
 *   --source <dir>    override source directory
 *   --target <dir>    override target directory (repeatable)
 *
 * Only files present in the source tree are managed; consumer-specific
 * files (e.g. autopm payload pm/*.js) are left untouched. No dependencies.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** Recursively list relative file paths under dir (POSIX separators). */
function collectFiles(dir, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...collectFiles(path.join(dir, entry.name), rel));
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }
  return files.sort();
}

/** Copy every source file into each target, preserving permission bits. */
function syncScripts({ sourceDir, targetDirs }) {
  const copied = [];
  const files = collectFiles(sourceDir);
  for (const target of targetDirs) {
    for (const rel of files) {
      const src = path.join(sourceDir, rel);
      const dst = path.join(target, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      fs.chmodSync(dst, fs.statSync(src).mode & 0o777);
      copied.push({ target, file: rel });
    }
  }
  return { files, copied };
}

/** Compare targets against source. Reasons: missing | content | mode. */
function checkSync({ sourceDir, targetDirs }) {
  const diverged = [];
  const files = collectFiles(sourceDir);
  for (const target of targetDirs) {
    for (const rel of files) {
      const src = path.join(sourceDir, rel);
      const dst = path.join(target, rel);
      if (!fs.existsSync(dst)) {
        diverged.push({ target, file: rel, reason: 'missing' });
      } else if (!fs.readFileSync(src).equals(fs.readFileSync(dst))) {
        diverged.push({ target, file: rel, reason: 'content' });
      } else if ((fs.statSync(src).mode & 0o777) !== (fs.statSync(dst).mode & 0o777)) {
        diverged.push({ target, file: rel, reason: 'mode' });
      }
    }
  }
  return { files, diverged };
}

function parseArgs(argv) {
  const repoRoot = path.resolve(__dirname, '..');
  const opts = { check: false, sourceDir: null, targetDirs: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') opts.check = true;
    else if (arg === '--source') opts.sourceDir = path.resolve(argv[++i]);
    else if (arg === '--target') opts.targetDirs.push(path.resolve(argv[++i]));
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  if (!opts.sourceDir) {
    opts.sourceDir = path.join(repoRoot, 'packages', 'plugin-core', 'scripts');
  }
  if (opts.targetDirs.length === 0) {
    opts.targetDirs = [
      path.join(repoRoot, 'autopm', '.claude', 'scripts'),
      path.join(repoRoot, '.claude', 'scripts')
    ];
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.check) {
    const { files, diverged } = checkSync(opts);
    if (diverged.length > 0) {
      console.error('❌ Script copies diverged from packages/plugin-core/scripts:');
      for (const d of diverged) {
        console.error(`  - ${path.join(d.target, d.file)} (${d.reason})`);
      }
      console.error('Fix with: npm run sync:scripts');
      process.exit(1);
    }
    console.log(`✅ In sync: ${files.length} files x ${opts.targetDirs.length} targets`);
    return;
  }

  const { files } = syncScripts(opts);
  console.log(`✅ Synced ${files.length} files to ${opts.targetDirs.length} targets`);
}

if (require.main === module) {
  main();
}

module.exports = { collectFiles, syncScripts, checkSync, parseArgs };
