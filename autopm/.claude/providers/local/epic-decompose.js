const fs = require('fs');
const path = require('path');

async function execute(options = {}, settings = {}) {
  const name = options.name;
  if (!name) {
    return { success: false, error: 'Epic name is required' };
  }

  const slug = path.basename(name);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: `Invalid epic name: "${name}"` };
  }

  const tasks = options.tasks;
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return { success: false, error: 'Tasks array is required' };
  }

  const basePath = settings.basePath || process.cwd();
  const epicsDir = path.join(basePath, '.claude', 'epics');
  const epicDir = path.join(epicsDir, slug);
  const epicFile = path.join(epicDir, 'epic.md');

  if (!fs.existsSync(epicFile)) {
    return { success: false, error: `Epic "${slug}" not found` };
  }

  const now = new Date().toISOString();
  const created = [];

  // Find next task number (numbered .md files only)
  const existing = fs.readdirSync(epicDir).filter(f =>
    /^\d+\.md$/.test(f)
  );
  let nextNum = 1;
  for (const f of existing) {
    const n = parseInt(f.replace('.md', ''));
    if (n >= nextNum) nextNum = n + 1;
  }

  for (const task of tasks) {
    const num = nextNum++;
    const taskFile = path.join(epicDir, `${num}.md`);
    const title = task.title || `Task ${num}`;
    const description = task.description || '';

    const content = `---
name: "${title.replace(/"/g, '\\"')}"
status: open
created: ${now}
updated: ${now}
---

${description || `## Goal\n${title}\n\n## Acceptance Criteria\n- [ ] TODO`}
`;

    fs.writeFileSync(taskFile, content, 'utf8');
    created.push({ number: num, title, path: taskFile });
  }

  // Update epic frontmatter with progress
  const epicContent = fs.readFileSync(epicFile, 'utf8');
  const updatedContent = epicContent
    .replace(/^updated:\s*.*/m, `updated: ${now}`)
    .replace(/^progress:\s*\d+/m, `progress: 0`);
  fs.writeFileSync(epicFile, updatedContent, 'utf8');

  return {
    success: true,
    tasks: created,
    count: created.length,
    actions: [`Decomposed epic "${slug}" into ${created.length} tasks`],
    timestamp: now
  };
}

module.exports = { execute };
