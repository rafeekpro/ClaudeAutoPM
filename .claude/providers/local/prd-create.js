const fs = require('fs');
const path = require('path');
const { readTemplate, generateMarkdown, resolveTemplatePath } = require('../../lib/template-reader');

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function getPrdsDir(basePath) {
  return path.join(basePath || process.cwd(), '.claude', 'prds');
}

async function execute(options = {}, settings = {}) {
  const title = options.title || options.name;
  if (!title) {
    return { success: false, error: 'Title is required' };
  }

  const priority = options.priority || 'P2';
  const timeline = options.timeline || '';
  const body = options.body || '';
  const basePath = settings.basePath || process.cwd();

  const slug = slugify(title);
  if (!slug) {
    return { success: false, error: 'Could not generate valid slug from title' };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: `Invalid slug generated: "${slug}"` };
  }

  const prdsDir = getPrdsDir(basePath);
  if (!fs.existsSync(prdsDir)) {
    fs.mkdirSync(prdsDir, { recursive: true });
  }

  const filepath = path.join(prdsDir, `${slug}.md`);

  if (fs.existsSync(filepath)) {
    return { success: false, error: `PRD "${slug}" already exists` };
  }

  const now = new Date().toISOString();
  let content;
  const templatePath = resolveTemplatePath('prd.xml', basePath);

  if (fs.existsSync(templatePath)) {
    const template = readTemplate(templatePath);
    content = generateMarkdown(template, {
      name: title,
      priority,
      timeline,
      objective: body || title,
      requirements: '- [ ] TODO',
      'success-criteria': '- [ ] TODO'
    });
  } else {
    content = `---\nname: "${title.replace(/"/g, '\\"')}"\nstatus: draft\npriority: ${priority}\ntimeline: "${timeline}"\ncreated: ${now}\nupdated: ${now}\n---\n\n${body || `## Objective\n${title}\n\n## Requirements\n- [ ] TODO`}\n`;
  }

  fs.writeFileSync(filepath, content, 'utf8');

  return {
    success: true,
    prd: {
      name: slug,
      title,
      status: 'draft',
      priority,
      path: filepath
    },
    actions: [`Created PRD: ${slug}.md`],
    timestamp: now
  };
}

module.exports = { execute, slugify, getPrdsDir };
