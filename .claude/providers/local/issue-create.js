const fs = require('fs');
const path = require('path');

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
  const filename = `${number}-${slug}.md`;
  const filepath = path.join(issuesDir, filename);
  const now = new Date().toISOString();

  const content = `---
number: ${number}
name: "${title.replace(/"/g, '\\"')}"
status: open
labels: [${labels.join(', ')}]
assignee: ""
created: ${now}
updated: ${now}
started: ""
completed: ""
---

${body || `## Goal\n${title}\n\n## Acceptance Criteria\n- [ ] TODO`}
`;

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
    timestamp: now
  };
}

module.exports = { execute, getNextNumber, slugify, getIssuesDir };
