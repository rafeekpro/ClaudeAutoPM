#!/usr/bin/env node
/**
 * Sync command prompt files from plugin packages (source of truth) into the
 * installable payload (autopm/.claude/commands).
 *
 * Scope: every "*.md" file directly under packages/<plugin>/commands/ that has
 * a same-named counterpart in autopm/.claude/commands/. Plugin-only commands
 * and payload-only commands are left alone.
 *
 * Usage:
 *   node scripts/sync-plugin-commands.js          # copy plugin -> payload
 *   node scripts/sync-plugin-commands.js --check  # exit 1 if any pair diverges
 *
 * Guarded by test/unit/plugin-command-sync.test.js (issue #609).
 * Note: scripts/sync-plugin-scripts.js (issue #610) does the same for
 * scripts; the two can be consolidated later.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAYLOAD_COMMANDS = path.join(ROOT, 'autopm', '.claude', 'commands');
const PACKAGES_DIR = path.join(ROOT, 'packages');

function pluginCommandFiles() {
  const result = [];
  for (const pkg of fs.readdirSync(PACKAGES_DIR)) {
    const commandsDir = path.join(PACKAGES_DIR, pkg, 'commands');
    if (!fs.existsSync(commandsDir) || !fs.statSync(commandsDir).isDirectory()) continue;
    for (const file of fs.readdirSync(commandsDir)) {
      if (!file.endsWith('.md')) continue;
      result.push({ plugin: pkg, name: file, file: path.join(commandsDir, file) });
    }
  }
  return result;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const owners = new Map();
  const diverged = [];
  let synced = 0;
  let identical = 0;

  for (const { plugin, name, file } of pluginCommandFiles()) {
    if (owners.has(name) && owners.get(name) !== plugin) {
      console.error(`ERROR: ${name} exists in both ${owners.get(name)} and ${plugin}`);
      process.exit(1);
    }
    owners.set(name, plugin);

    const payloadFile = path.join(PAYLOAD_COMMANDS, name);
    if (!fs.existsSync(payloadFile)) continue; // plugin-only command

    const pluginContent = fs.readFileSync(file);
    if (pluginContent.equals(fs.readFileSync(payloadFile))) {
      identical++;
      continue;
    }

    if (checkOnly) {
      diverged.push(`${name}  (packages/${plugin}/commands -> autopm/.claude/commands)`);
    } else {
      fs.writeFileSync(payloadFile, pluginContent);
      console.log(`synced: ${name}  (from packages/${plugin}/commands)`);
      synced++;
    }
  }

  if (checkOnly) {
    if (diverged.length > 0) {
      console.error('Diverged command copies (run "npm run sync:commands" after editing the plugin copy):');
      for (const d of diverged) console.error(`  ${d}`);
      process.exit(1);
    }
    console.log(`OK: ${identical} shared command files in sync.`);
  } else {
    console.log(`Done: ${synced} synced, ${identical} already in sync.`);
  }
}

main();
