const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../../lib/frontmatter');

async function execute(options = {}, settings = {}) {
  const name = options.name;
  if (!name) {
    return { success: false, error: 'Epic name is required' };
  }

  const slug = path.basename(name);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: `Invalid epic name: "${name}"` };
  }

  const basePath = settings.basePath || process.cwd();
  const epicsDir = path.join(basePath, '.claude', 'epics');
  const epicDir = path.join(epicsDir, slug);
  const filepath = path.join(epicDir, 'epic.md');

  if (!fs.existsSync(filepath)) {
    return { success: false, error: `Epic "${slug}" not found` };
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const { frontmatter: fm, body } = parseFrontmatter(content);

  // List task files (numbered .md files only)
  const taskFiles = fs.readdirSync(epicDir).filter(f =>
    /^\d+\.md$/.test(f)
  ).sort();

  const tasks = [];
  for (const file of taskFiles) {
    const taskContent = fs.readFileSync(path.join(epicDir, file), 'utf8');
    const { frontmatter: taskFm } = parseFrontmatter(taskContent);
    const num = parseInt(file.replace('.md', '')) || 0;
    tasks.push({
      number: num,
      title: taskFm.name || file,
      status: taskFm.status || 'open',
      path: path.join(epicDir, file)
    });
  }

  tasks.sort((a, b) => a.number - b.number);

  return {
    success: true,
    epic: {
      name: slug,
      title: fm.name || slug,
      status: fm.status || 'backlog',
      prd: fm.prd || '',
      progress: parseInt(fm.progress) || 0,
      body: body.trim(),
      tasks,
      taskCount: tasks.length,
      createdAt: fm.created || '',
      updatedAt: fm.updated || '',
      path: filepath
    }
  };
}

module.exports = { execute };
