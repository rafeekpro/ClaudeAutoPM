const fs = require('fs');
const path = require('path');
const { parseIssueFrontmatter } = require('./issue-list');

function findIssueFile(issuesDir, id) {
  if (!fs.existsSync(issuesDir)) return null;
  const files = fs.readdirSync(issuesDir).filter(f => f.endsWith('.md'));
  const numId = String(id);

  // Exact match: {id}-*.md or {id}.md
  for (const file of files) {
    if (file.startsWith(numId + '-') || file === numId + '.md') {
      return path.join(issuesDir, file);
    }
  }
  return null;
}

async function execute(options = {}, settings = {}) {
  const id = options.id;
  if (!id) {
    return { success: false, error: 'Issue ID is required. Usage: /pm:issue-show <number>' };
  }

  const basePath = settings.basePath || process.cwd();
  const issuesDir = path.join(basePath, '.claude', 'issues');
  const filepath = findIssueFile(issuesDir, id);

  if (!filepath) {
    return { success: false, error: `Issue #${id} not found. Run /pm:issue-list to see available issues.` };
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const fm = parseIssueFrontmatter(content);

  // Extract body (after frontmatter)
  const bodyMatch = content.match(/^---[\s\S]*?---\r?\n?([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1].trim() : '';

  return {
    success: true,
    issue: {
      id: parseInt(fm.number) || parseInt(id),
      title: fm.name || '',
      status: fm.status || 'open',
      labels: Array.isArray(fm.labels) ? fm.labels : [],
      assignee: fm.assignee || '',
      body,
      createdAt: fm.created || '',
      updatedAt: fm.updated || '',
      startedAt: fm.started || '',
      completedAt: fm.completed || '',
      path: filepath
    }
  };
}

module.exports = { execute, findIssueFile };
