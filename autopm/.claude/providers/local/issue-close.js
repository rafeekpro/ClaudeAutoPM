const fs = require('fs');
const path = require('path');
const { findIssueFile } = require('./issue-show');
const { parseIssueFrontmatter } = require('./issue-list');
const { logEvent } = require('../../lib/event-logger');

async function execute(options = {}, settings = {}) {
  const id = options.id;
  if (!id) {
    return { success: false, error: 'Issue ID is required' };
  }

  const basePath = settings.basePath || process.cwd();
  const issuesDir = path.join(basePath, '.claude', 'issues');
  const filepath = findIssueFile(issuesDir, id);

  if (!filepath) {
    return { success: false, error: `Issue #${id} not found` };
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const fm = parseIssueFrontmatter(content);
  const now = new Date().toISOString();

  // Update frontmatter: status, completed, updated
  const updated = content
    .replace(/^status:\s*.+$/m, 'status: closed')
    .replace(/^updated:\s*.+$/m, `updated: ${now}`)
    .replace(/^completed:\s*.*$/m, `completed: ${now}`);

  fs.writeFileSync(filepath, updated, 'utf8');

  logEvent('issue.closed', { id: parseInt(id), title: fm.name }, basePath);

  return {
    success: true,
    issue: {
      id: parseInt(fm.number) || parseInt(id),
      title: fm.name || '',
      status: 'closed',
      resolution: options.resolution || 'completed'
    },
    actions: [`Closed issue #${id}`],
    timestamp: now
  };
}

module.exports = { execute };
