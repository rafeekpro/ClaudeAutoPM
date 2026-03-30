const fs = require('fs');
const path = require('path');

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function getEpicsDir(basePath) {
  return path.join(basePath || process.cwd(), '.claude', 'epics');
}

async function execute(options = {}, settings = {}) {
  const title = options.title || options.name;
  if (!title) {
    return { success: false, error: 'Title is required' };
  }

  const prd = options.prd || '';
  const body = options.body || '';
  const basePath = settings.basePath || process.cwd();

  const slug = slugify(title);
  if (!slug) {
    return { success: false, error: 'Could not generate valid slug from title' };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: `Invalid slug generated: "${slug}"` };
  }

  const epicDir = path.join(getEpicsDir(basePath), slug);
  const filepath = path.join(epicDir, 'epic.md');

  if (fs.existsSync(filepath)) {
    return { success: false, error: `Epic "${slug}" already exists` };
  }

  fs.mkdirSync(epicDir, { recursive: true });

  const now = new Date().toISOString();

  const content = `---
name: "${title.replace(/"/g, '\\"')}"
status: backlog
prd: "${prd}"
progress: 0
created: ${now}
updated: ${now}
---

${body || `## Overview\n${title}\n\n## Tasks\n- [ ] TODO`}
`;

  fs.writeFileSync(filepath, content, 'utf8');

  return {
    success: true,
    epic: {
      name: slug,
      title,
      status: 'backlog',
      path: filepath
    },
    actions: [`Created epic: ${slug}/epic.md`],
    timestamp: now
  };
}

module.exports = { execute, slugify, getEpicsDir };
