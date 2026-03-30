const fs = require('fs');
const path = require('path');

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function getEpicsDir() {
  return path.join(process.cwd(), '.claude', 'epics');
}

async function execute(options = {}) {
  const title = options.title || options.name;
  if (!title) {
    return { success: false, error: 'Title is required' };
  }

  const prd = options.prd || '';
  const body = options.body || '';

  const slug = slugify(title);
  const epicDir = path.join(getEpicsDir(), slug);

  if (!fs.existsSync(epicDir)) {
    fs.mkdirSync(epicDir, { recursive: true });
  }

  const filepath = path.join(epicDir, 'epic.md');
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
