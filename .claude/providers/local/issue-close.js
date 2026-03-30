const fs = require('fs');
const path = require('path');
const { findIssueFile } = require('./issue-show');
const { parseIssueFrontmatter } = require('./issue-list');

async function execute(options = {}) {
  const id = options.id;
  if (!id) {
    return { success: false, error: 'Issue ID is required' };
  }

  const issuesDir = path.join(process.cwd(), '.claude', 'issues');
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
