#!/usr/bin/env node
/**
 * PM Checkpoint — Save/list/show project state snapshots
 * Usage: node checkpoint.js "description"
 *        node checkpoint.js --list
 *        node checkpoint.js --show <timestamp>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const basePath = process.cwd();
const checkpointsDir = path.join(basePath, '.claude', 'pm', 'checkpoints');
const learningsPath = path.join(basePath, '.claude', 'pm', 'learnings.jsonl');

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage: node checkpoint.js "description"');
    console.log('       node checkpoint.js --list');
    console.log('       node checkpoint.js --show <timestamp>');
    process.exit(0);
  }

  if (args[0] === '--list') {
    return listCheckpoints();
  }

  if (args[0] === '--show' && args[1]) {
    return showCheckpoint(args[1]);
  }

  return createCheckpoint(args[0]);
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    return { branch, hash, clean: status.length === 0 };
  } catch {
    return { branch: 'unknown', hash: 'unknown', clean: false };
  }
}

function countItems() {
  const counts = { prds: 0, epics: 0, issues: 0 };

  try {
    const prdsDir = path.join(basePath, '.claude', 'prds');
    if (fs.existsSync(prdsDir)) {
      counts.prds = fs.readdirSync(prdsDir).filter(f => f.endsWith('.md')).length;
    }
  } catch { /* skip */ }

  try {
    const epicsDir = path.join(basePath, '.claude', 'epics');
    if (fs.existsSync(epicsDir)) {
      const epicDirs = fs.readdirSync(epicsDir, { withFileTypes: true })
        .filter(d => d.isDirectory());
      counts.epics = epicDirs.length;

      for (const dir of epicDirs) {
        const epicPath = path.join(epicsDir, dir.name);
        counts.issues += fs.readdirSync(epicPath)
          .filter(f => /^\d+.*\.md$/.test(f)).length;
      }
    }
  } catch { /* skip */ }

  return counts;
}

function getRecentLearnings(n) {
  if (!fs.existsSync(learningsPath)) return [];
  try {
    const lines = fs.readFileSync(learningsPath, 'utf8').trim().split('\n').filter(Boolean);
    return lines.slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

function getConfigSnapshot() {
  const configPath = path.join(basePath, '.claude', 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return { version: config.version, provider: config.providers ? Object.keys(config.providers).join(', ') : 'local' };
  } catch { return null; }
}

function createCheckpoint(description) {
  if (!fs.existsSync(checkpointsDir)) {
    fs.mkdirSync(checkpointsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const checkpoint = {
    timestamp,
    description,
    git: getGitInfo(),
    counts: countItems(),
    learnings: getRecentLearnings(5),
    config_snapshot: getConfigSnapshot()
  };

  const filename = timestamp.replace(/:/g, '-') + '.json';
  fs.writeFileSync(path.join(checkpointsDir, filename), JSON.stringify(checkpoint, null, 2), 'utf8');

  console.log(`✅ Checkpoint saved: ${description}`);
  console.log(`  - Branch: ${checkpoint.git.branch} (${checkpoint.git.hash})`);
  console.log(`  - Items: ${checkpoint.counts.prds} PRDs, ${checkpoint.counts.epics} epics, ${checkpoint.counts.issues} issues`);
}

function listCheckpoints() {
  if (!fs.existsSync(checkpointsDir)) {
    console.log('## Checkpoints\n\nNo checkpoints found. Use `node checkpoint.js "description"` to create one.');
    process.exit(0);
  }

  const files = fs.readdirSync(checkpointsDir).filter(f => f.endsWith('.json')).sort();

  if (files.length === 0) {
    console.log('## Checkpoints\n\nNo checkpoints found.');
    process.exit(0);
  }

  console.log('## Checkpoints');
  console.log('');
  console.log('| # | Description | Date | Branch | Issues |');
  console.log('|---|------------|------|--------|--------|');

  files.forEach((file, idx) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(checkpointsDir, file), 'utf8'));
      const date = data.timestamp ? data.timestamp.split('T')[0] : '-';
      const branch = data.git ? data.git.branch : '-';
      const issues = data.counts ? `${data.counts.issues} tasks` : '-';
      console.log(`| ${idx + 1} | ${data.description} | ${date} | ${branch} | ${issues} |`);
    } catch { /* skip corrupt file */ }
  });
}

function showCheckpoint(id) {
  if (!fs.existsSync(checkpointsDir)) {
    console.log('❌ No checkpoints directory found');
    process.exit(1);
  }

  // Find matching file (by timestamp prefix or full filename)
  const files = fs.readdirSync(checkpointsDir).filter(f => f.endsWith('.json'));
  const match = files.find(f => f.includes(id.replace(/:/g, '-')));

  if (!match) {
    console.log(`❌ Checkpoint not found: ${id}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(path.join(checkpointsDir, match), 'utf8'));

  console.log(`## Checkpoint: ${data.description}`);
  console.log('');
  console.log('| Property | Value |');
  console.log('|----------|-------|');
  console.log(`| Timestamp | ${data.timestamp} |`);
  console.log(`| Description | ${data.description} |`);
  console.log(`| Branch | ${data.git ? data.git.branch : '-'} |`);
  console.log(`| Commit | ${data.git ? data.git.hash : '-'} |`);
  console.log(`| Clean | ${data.git ? (data.git.clean ? 'Yes' : 'No') : '-'} |`);
  console.log(`| PRDs | ${data.counts ? data.counts.prds : 0} |`);
  console.log(`| Epics | ${data.counts ? data.counts.epics : 0} |`);
  console.log(`| Issues | ${data.counts ? data.counts.issues : 0} |`);

  if (data.config_snapshot) {
    console.log(`| Version | ${data.config_snapshot.version || '-'} |`);
    console.log(`| Provider | ${data.config_snapshot.provider || '-'} |`);
  }

  if (data.learnings && data.learnings.length > 0) {
    console.log('');
    console.log('### Recent Learnings at Checkpoint');
    console.log('');
    data.learnings.forEach((l, i) => {
      console.log(`${i + 1}. ${l.learning} [${(l.tags || []).join(', ')}]`);
    });
  }
}

main();
