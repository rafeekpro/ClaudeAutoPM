const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../../lib/frontmatter');

async function execute(options = {}, settings = {}) {
  const basePath = settings.basePath || process.cwd();
  const prdsDir = path.join(basePath, '.claude', 'prds');

  if (!fs.existsSync(prdsDir)) {
    return { success: true, prds: [], count: 0 };
  }

  const files = fs.readdirSync(prdsDir).filter(f => f.endsWith('.md')).sort();
  const prds = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(prdsDir, file), 'utf8');
    const { frontmatter: fm } = parseFrontmatter(content);
    if (!fm || Object.keys(fm).length === 0) continue;

    if (options.status && fm.status !== options.status) continue;

    prds.push({
      name: file.replace('.md', ''),
      title: fm.name || file.replace('.md', ''),
      status: fm.status || 'draft',
      priority: fm.priority || 'P2',
      timeline: fm.timeline || '',
      createdAt: fm.created || '',
      updatedAt: fm.updated || '',
      path: path.join(prdsDir, file)
    });
  }

  return { success: true, prds, count: prds.length };
}

module.exports = { execute };
