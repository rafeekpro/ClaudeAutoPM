const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../../lib/frontmatter');

async function execute(options = {}) {
  const name = options.name;
  if (!name) {
    return { success: false, error: 'PRD name is required' };
  }

  const slug = path.basename(name.replace(/\.md$/, ''));
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: `Invalid PRD name: "${name}"` };
  }

  const prdsDir = path.join(process.cwd(), '.claude', 'prds');
  const filepath = path.join(prdsDir, `${slug}.md`);

  if (!fs.existsSync(filepath)) {
    return { success: false, error: `PRD "${slug}" not found` };
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const { frontmatter: fm, body } = parseFrontmatter(content);

  return {
    success: true,
    prd: {
      name: slug,
      title: fm.name || slug,
      status: fm.status || 'draft',
      priority: fm.priority || 'P2',
      timeline: fm.timeline || '',
      body: body.trim(),
      createdAt: fm.created || '',
      updatedAt: fm.updated || '',
      path: filepath
    }
  };
}

module.exports = { execute };
