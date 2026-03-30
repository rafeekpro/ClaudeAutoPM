const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../../lib/frontmatter');

function getEpicsDir(basePath) {
  return path.join(basePath || process.cwd(), '.claude', 'epics');
}

async function execute(options = {}, settings = {}) {
  const basePath = settings.basePath || process.cwd();
  const epicsDir = getEpicsDir(basePath);

  if (!fs.existsSync(epicsDir)) {
    return { success: true, epics: [], count: 0 };
  }

  const dirs = fs.readdirSync(epicsDir).filter(d => {
    if (!/^[a-z0-9-]+$/.test(d)) return false;
    const full = path.join(epicsDir, d);
    return fs.statSync(full).isDirectory();
  }).sort();

  const epics = [];

  for (const dir of dirs) {
    const epicFile = path.join(epicsDir, dir, 'epic.md');
    if (!fs.existsSync(epicFile)) continue;

    const content = fs.readFileSync(epicFile, 'utf8');
    const { frontmatter: fm } = parseFrontmatter(content);
    if (!fm || Object.keys(fm).length === 0) continue;

    if (options.status && fm.status !== options.status) continue;

    // Count task files (numbered .md files only)
    const epicDirPath = path.join(epicsDir, dir);
    const taskFiles = fs.readdirSync(epicDirPath).filter(f =>
      /^\d+\.md$/.test(f)
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
