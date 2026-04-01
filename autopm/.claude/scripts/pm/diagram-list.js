#!/usr/bin/env node

/**
 * PM Diagram List/Show Script
 *
 * Lists diagrams from .claude/pm/diagrams/*.mmd with metadata.
 * With --show <name>: displays diagram content.
 */

const fs = require('fs');
const path = require('path');

const DIAGRAMS_DIR = path.join('.claude', 'pm', 'diagrams');

function findDiagrams() {
  if (!fs.existsSync(DIAGRAMS_DIR)) {
    return [];
  }
  return fs.readdirSync(DIAGRAMS_DIR)
    .filter(f => f.endsWith('.mmd'))
    .map(f => f.replace('.mmd', ''));
}

function loadMeta(name) {
  const metaPath = path.join(DIAGRAMS_DIR, `${name}.meta.json`);
  if (!fs.existsSync(metaPath)) {
    return { name, type: 'unknown', created: '-', updated: '-' };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    return {
      name: raw.name || name,
      type: raw.type || 'unknown',
      created: (raw.created || '-').slice(0, 10),
      updated: (raw.updated || '-').slice(0, 10)
    };
  } catch {
    return { name, type: 'unknown', created: '-', updated: '-' };
  }
}

function listDiagrams() {
  const names = findDiagrams();
  if (names.length === 0) {
    console.log('No diagrams found.');
    console.log('Create one with: /pm:diagram-new <name>');
    return;
  }

  const rows = names.map(loadMeta);

  console.log('## Project Diagrams\n');
  console.log('| Name | Type | Created | Updated |');
  console.log('|------|------|---------|---------|');
  for (const r of rows) {
    console.log(`| ${r.name} | ${r.type} | ${r.created} | ${r.updated} |`);
  }
  console.log(`\nTotal: ${rows.length} diagram${rows.length === 1 ? '' : 's'}`);
  console.log('View in dashboard: /pm:dashboard → Diagrams tab');
}

function showDiagram(name) {
  const mmdPath = path.join(DIAGRAMS_DIR, `${name}.mmd`);
  if (!fs.existsSync(mmdPath)) {
    console.error(`❌ Diagram "${name}" not found. Run: /pm:diagram-new ${name}`);
    process.exit(1);
  }

  const content = fs.readFileSync(mmdPath, 'utf8');
  const meta = loadMeta(name);

  console.log(`## Diagram: ${meta.name} (${meta.type})\n`);
  console.log('```mermaid');
  console.log(content.trim());
  console.log('```');
}

// Parse args
const args = process.argv.slice(2);
const showIdx = args.indexOf('--show');

if (showIdx !== -1 && args[showIdx + 1]) {
  showDiagram(args[showIdx + 1]);
} else {
  listDiagrams();
}
