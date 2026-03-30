const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./prd-list');

async function execute(options = {}) {
  const name = options.name;
  if (!name) {
    return { success: false, error: 'PRD name is required' };
  }

  const slug = name.replace(/\.md$/, '');
  const prdsDir = path.join(process.cwd(), '.claude', 'prds');
  const filepath = path.join(prdsDir, `${slug}.md`);

  if (!fs.existsSync(filepath)) {
    return { success: false, error: `PRD "${slug}" not found` };
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const fm = parseFrontmatter(content);

  const bodyMatch = content.match(/^---[\s\S]*?---\r?\n?([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1].trim() : '';

  return {
    success: true,
    prd: {
      name: slug,
      title: fm ? (fm.name || slug) : slug,
      status: fm ? (fm.status || 'draft') : 'draft',
      priority: fm ? (fm.priority || 'P2') : 'P2',
      timeline: fm ? (fm.timeline || '') : '',
      body,
      createdAt: fm ? (fm.created || '') : '',
      updatedAt: fm ? (fm.updated || '') : '',
      path: filepath
    }
  };
}

module.exports = { execute };
