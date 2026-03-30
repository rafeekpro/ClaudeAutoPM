const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./prd-list');

function getEpicsDir() {
  return path.join(process.cwd(), '.claude', 'epics');
}

async function execute(options = {}) {
  const epicsDir = getEpicsDir();

  if (!fs.existsSync(epicsDir)) {
    return { success: true, epics: [], count: 0 };
  }

  const dirs = fs.readdirSync(epicsDir).filter(d => {
    const full = path.join(epicsDir, d);
    return fs.statSync(full).isDirectory();
  }).sort();

  const epics = [];

  for (const dir of dirs) {
    const epicFile = path.join(epicsDir, dir, 'epic.md');
    if (!fs.existsSync(epicFile)) continue;

    const content = fs.readFileSync(epicFile, 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) continue;

    if (options.status && fm.status !== options.status) continue;

    // Count task files (numbered .md files, not epic.md)
    const epicDirPath = path.join(epicsDir, dir);
    const taskFiles = fs.readdirSync(epicDirPath).filter(f =>
      f.endsWith('.md') && f !== 'epic.md'
    );

    epics.push({
      name: dir,
      title: fm.name || dir,
      status: fm.status || 'backlog',
      prd: fm.prd || '',
      progress: parseInt(fm.progress) || 0,
      taskCount: taskFiles.length,
      createdAt: fm.created || '',
      updatedAt: fm.updated || '',
      path: epicFile
    });
  }

  return { success: true, epics, count: epics.length };
}

module.exports = { execute, getEpicsDir };
