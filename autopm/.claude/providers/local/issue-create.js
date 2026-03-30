const fs = require('fs');
const path = require('path');
const { readTemplate, generateMarkdown, resolveTemplatePath } = require('../../lib/template-reader');
const { logEvent } = require('../../lib/event-logger');

function getIssuesDir(basePath) {
  return path.join(basePath || process.cwd(), '.claude', 'issues');
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function getNextNumber(issuesDir) {
  if (!fs.existsSync(issuesDir)) return 1;
  const files = fs.readdirSync(issuesDir).filter(f => f.endsWith('.md'));
  let max = 0;
  for (const file of files) {
    const match = file.match(/^(\d+)/);
    if (match) max = Math.max(max, parseInt(match[1]));
  }
  return max + 1;
}

async function execute(options = {}, settings = {}) {
  const title = options.title || options.name || 'Untitled Issue';
  const labels = options.labels || [];
  const body = options.body || '';
  const basePath = settings.basePath || process.cwd();

  const issuesDir = getIssuesDir(basePath);
  if (!fs.existsSync(issuesDir)) {
    fs.mkdirSync(issuesDir, { recursive: true });
  }

  const number = getNextNumber(issuesDir);
  const slug = slugify(title);
  if (!slug) {
    return { success: false, error: 'Could not generate valid slug from title' };
  }

  const filename = `${number}-${slug}.md`;
  const filepath = path.join(issuesDir, filename);

  // Use XML template if available, fallback to inline
  let content;
  const templatePath = resolveTemplatePath('issue.xml', basePath);

  if (fs.existsSync(templatePath)) {
    const template = readTemplate(templatePath);
    content = generateMarkdown(template, {
      number,
      name: title,
      labels,
      goal: body || title,
      'acceptance-criteria': '- [ ] TODO',
      'affected-files': '- TODO'
    });
  } else {
    const now = new Date().toISOString();
    content = `---\nnumber: ${number}\nname: "${title.replace(/"/g, '\\"')}"\nstatus: open\nlabels: [${labels.join(', ')}]\nassignee: ""\ncreated: ${now}\nupdated: ${now}\nstarted: ""\ncompleted: ""\n---\n\n${body || `## Goal\n${title}\n\n## Acceptance Criteria\n- [ ] TODO`}\n`;
  }

  fs.writeFileSync(filepath, content, 'utf8');

  return {
    success: true,
    issue: {
      id: number,
      title,
      status: 'open',
      labels,
      path: filepath,
      url: `file://${filepath}`
    },
    actions: [`Created local issue #${number}: ${filename}`],
    timestamp: (() => { logEvent('issue.created', { id: number, title, labels }, basePath); return new Date().toISOString(); })()
  };
}

module.exports = { execute, getNextNumber, slugify, getIssuesDir };
