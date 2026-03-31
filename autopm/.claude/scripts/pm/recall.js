#!/usr/bin/env node
/**
 * PM Recall — Display learnings from .claude/pm/learnings.jsonl
 * Usage: node recall.js [--tag tagname] [--limit N]
 */

const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const learningsPath = path.join(basePath, '.claude', 'pm', 'learnings.jsonl');

function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let tagFilter = null;
  let limit = 20;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tag' && i + 1 < args.length) {
      tagFilter = args[++i];
    } else if (args[i] === '--limit' && i + 1 < args.length) {
      limit = parseInt(args[++i], 10) || 20;
    }
  }

  if (!fs.existsSync(learningsPath)) {
    console.log('## Project Learnings\n\nNo learnings recorded yet. Use `/pm:learn "lesson"` to add one.');
    process.exit(0);
  }

  const lines = fs.readFileSync(learningsPath, 'utf8').trim().split('\n').filter(Boolean);
  let entries = lines.map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  if (tagFilter) {
    entries = entries.filter(e => e.tags && e.tags.includes(tagFilter));
  }

  // Most recent first, then apply limit
  entries = entries.reverse().slice(0, limit);

  if (entries.length === 0) {
    const filterMsg = tagFilter ? ` with tag "${tagFilter}"` : '';
    console.log(`## Project Learnings\n\nNo learnings found${filterMsg}.`);
    process.exit(0);
  }

  console.log('## Project Learnings');
  console.log('');
  console.log('| # | Learning | Tags | Date |');
  console.log('|---|---------|------|------|');

  entries.forEach((entry, idx) => {
    const date = entry.timestamp ? entry.timestamp.split('T')[0] : '-';
    const tags = (entry.tags || []).length > 0 ? entry.tags.join(', ') : '\u2014';
    const text = String(entry.learning || '').replace(/\|/g, '\\|');
    console.log(`| ${idx + 1} | ${text} | ${tags} | ${date} |`);
  });

  console.log('');
  console.log(`${entries.length} learnings shown.`);
}

main();
