#!/usr/bin/env node

/**
 * Sync Documentation Script
 *
 * Copies docs-site/docs/ → docs/ to maintain a mirror of the VitePress documentation
 * in the repository root for direct GitHub browsing.
 *
 * Usage:
 *   node scripts/sync-docs.js        # Sync all docs
 *   node scripts/sync-docs.js --dry  # Show what would be synced
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const SOURCE_DIR = path.join(__dirname, '..', 'docs-site', 'docs');
const TARGET_DIR = path.join(__dirname, '..', 'docs');
const DRY_RUN = process.argv.includes('--dry');

// Directories to sync (exclude VitePress internals)
const SYNC_DIRS = [
  'getting-started',
  'user-guide',
  'developer-guide',
  'commands',
  'agents',
  'reference'
];

// Files to sync from root
const SYNC_FILES = [
  'index.md',
  'changelog.md'
];

async function main() {
  console.log('📚 Documentation Sync');
  console.log(`   Source: ${SOURCE_DIR}`);
  console.log(`   Target: ${TARGET_DIR}`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Verify source exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ Source directory not found:', SOURCE_DIR);
    process.exit(1);
  }

  let filesCopied = 0;
  let dirsCreated = 0;

  // Sync directories
  for (const dir of SYNC_DIRS) {
    const srcDir = path.join(SOURCE_DIR, dir);
    const dstDir = path.join(TARGET_DIR, dir);

    if (!fs.existsSync(srcDir)) {
      console.log(`   ⚠️  Skipping ${dir}/ (not found in source)`);
      continue;
    }

    // Find all markdown files in directory
    const files = glob.sync('**/*.md', { cwd: srcDir });

    for (const file of files) {
      const srcFile = path.join(srcDir, file);
      const dstFile = path.join(dstDir, file);
      const dstSubDir = path.dirname(dstFile);

      // Ensure directory exists
      if (!DRY_RUN && !fs.existsSync(dstSubDir)) {
        fs.mkdirpSync(dstSubDir);
        dirsCreated++;
      }

      // Copy file
      if (DRY_RUN) {
        console.log(`   → ${dir}/${file}`);
      } else {
        fs.copySync(srcFile, dstFile);
      }
      filesCopied++;
    }
  }

  // Sync root files
  for (const file of SYNC_FILES) {
    const srcFile = path.join(SOURCE_DIR, file);
    const dstFile = path.join(TARGET_DIR, file);

    if (!fs.existsSync(srcFile)) {
      continue;
    }

    if (DRY_RUN) {
      console.log(`   → ${file}`);
    } else {
      fs.copySync(srcFile, dstFile);
    }
    filesCopied++;
  }

  console.log('');
  if (DRY_RUN) {
    console.log(`✅ Would sync ${filesCopied} files`);
  } else {
    console.log(`✅ Synced ${filesCopied} files (${dirsCreated} directories created)`);
  }
}

main().catch((err) => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
