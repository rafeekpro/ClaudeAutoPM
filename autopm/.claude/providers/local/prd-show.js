const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../../lib/frontmatter');

async function execute(options = {}, settings = {}) {
  const name = options.name;
  if (!name) {
    return { success: false, error: 'PRD name is required. Usage: /pm:prd-show <name>. Run /pm:prd-list to see available PRDs.' };
  }

  const slug = path.basename(name.replace(/\.md$/, ''));
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: `Invalid PRD name "${name}". Use the slug (lowercase, hyphens). Run /pm:prd-list to see available PRDs.` };
  }

  const basePath = settings.basePath || process.cwd();
  const prdsDir = path.join(basePath, '.claude', 'prds');
  const filepath = path.join(prdsDir, `${slug}.md`);

  if (!fs.existsSync(filepath)) {
    return { success: false, error: `PRD "${slug}" not found. Run /pm:prd-list to see available PRDs.` };
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
