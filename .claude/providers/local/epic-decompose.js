const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./prd-list');

async function execute(options = {}) {
  const name = options.name;
  if (!name) {
    return { success: false, error: 'Epic name is required' };
  }

  const tasks = options.tasks;
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return { success: false, error: 'Tasks array is required' };
  }

  const epicsDir = path.join(process.cwd(), '.claude', 'epics');
  const epicDir = path.join(epicsDir, name);
  const epicFile = path.join(epicDir, 'epic.md');

  if (!fs.existsSync(epicFile)) {
    return { success: false, error: `Epic "${name}" not found` };
  }

  const now = new Date().toISOString();
  const created = [];

  // Find next task number
  const existing = fs.readdirSync(epicDir).filter(f =>
    f.endsWith('.md') && f !== 'epic.md'
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
    .replace(/updated: .+/, `updated: ${now}`)
    .replace(/progress: \d+/, `progress: 0`);
  fs.writeFileSync(epicFile, updatedContent, 'utf8');

  return {
    success: true,
    tasks: created,
    count: created.length,
    actions: [`Decomposed epic "${name}" into ${created.length} tasks`],
    timestamp: now
  };
}

module.exports = { execute };
