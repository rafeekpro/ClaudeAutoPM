const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./prd-list');

async function execute(options = {}) {
  const name = options.name;
  if (!name) {
    return { success: false, error: 'Epic name is required' };
  }

  const epicsDir = path.join(process.cwd(), '.claude', 'epics');
  const epicDir = path.join(epicsDir, name);
  const filepath = path.join(epicDir, 'epic.md');

  if (!fs.existsSync(filepath)) {
    return { success: false, error: `Epic "${name}" not found` };
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const fm = parseFrontmatter(content);

  const bodyMatch = content.match(/^---[\s\S]*?---\r?\n?([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1].trim() : '';

  // List task files
  const taskFiles = fs.readdirSync(epicDir).filter(f =>
    f.endsWith('.md') && f !== 'epic.md'
  ).sort();

  const tasks = [];
  for (const file of taskFiles) {
    const taskContent = fs.readFileSync(path.join(epicDir, file), 'utf8');
    const taskFm = parseFrontmatter(taskContent);
    const num = parseInt(file.replace('.md', '')) || 0;
    tasks.push({
      number: num,
      title: taskFm ? (taskFm.name || file) : file,
      status: taskFm ? (taskFm.status || 'open') : 'open',
      path: path.join(epicDir, file)
    });
  }

  tasks.sort((a, b) => a.number - b.number);

  return {
    success: true,
    epic: {
      name,
      title: fm ? (fm.name || name) : name,
      status: fm ? (fm.status || 'backlog') : 'backlog',
      prd: fm ? (fm.prd || '') : '',
      progress: fm ? (parseInt(fm.progress) || 0) : 0,
      body,
      tasks,
      taskCount: tasks.length,
      createdAt: fm ? (fm.created || '') : '',
      updatedAt: fm ? (fm.updated || '') : '',
      path: filepath
    }
  };
}

module.exports = { execute };
