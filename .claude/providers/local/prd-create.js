const fs = require('fs');
const path = require('path');

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function getPrdsDir() {
  return path.join(process.cwd(), '.claude', 'prds');
}

async function execute(options = {}) {
  const title = options.title || options.name;
  if (!title) {
    return { success: false, error: 'Title is required' };
  }

  const priority = options.priority || 'P2';
  const timeline = options.timeline || '';
  const body = options.body || '';

  const prdsDir = getPrdsDir();
  if (!fs.existsSync(prdsDir)) {
    fs.mkdirSync(prdsDir, { recursive: true });
  }

  const slug = slugify(title);
  const filepath = path.join(prdsDir, `${slug}.md`);
  const now = new Date().toISOString();

  const content = `---
name: "${title.replace(/"/g, '\\"')}"
status: draft
priority: ${priority}
timeline: "${timeline}"
created: ${now}
updated: ${now}
---

${body || `## Overview\n${title}\n\n## Requirements\n- [ ] TODO`}
`;

  fs.writeFileSync(filepath, content, 'utf8');

  return {
    success: true,
    prd: {
      name: slug,
      title,
      status: 'draft',
      priority,
      path: filepath
    },
    actions: [`Created PRD: ${slug}.md`],
    timestamp: now
  };
}

module.exports = { execute, slugify, getPrdsDir };
