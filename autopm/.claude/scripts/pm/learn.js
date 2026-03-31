#!/usr/bin/env node
/**
 * PM Learn — Append a learning to .claude/pm/learnings.jsonl
 * Usage: node learn.js "lesson text" [--tag tagname]
 */

const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const learningsPath = path.join(basePath, '.claude', 'pm', 'learnings.jsonl');

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage: node learn.js "lesson text" [--tag tagname]');
    process.exit(0);
  }

  // Parse arguments
  let learning = '';
  const tags = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tag' && i + 1 < args.length) {
      tags.push(args[++i]);
    } else if (!learning) {
      learning = args[i];
    }
  }

  if (!learning) {
    console.log('❌ No learning text provided');
    process.exit(1);
  }

  // Ensure directory exists
  const dir = path.dirname(learningsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const entry = {
    timestamp: new Date().toISOString(),
    learning,
    tags: tags.length > 0 ? tags : ['general'],
    source: 'manual'
  };

  fs.appendFileSync(learningsPath, JSON.stringify(entry) + '\n', 'utf8');

  console.log(`✅ Learning saved`);
  console.log(`  - "${learning}"`);
  console.log(`  - Tags: ${entry.tags.join(', ')}`);
}

main();
