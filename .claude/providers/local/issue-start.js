const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { findIssueFile } = require('./issue-show');
const { parseIssueFrontmatter } = require('./issue-list');

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
  const actions = [];

  // Update frontmatter: status, started, updated
  let updated = content
    .replace(/^status:\s*.+$/m, 'status: in_progress')
    .replace(/^updated:\s*.+$/m, `updated: ${now}`)
    .replace(/^started:\s*.*$/m, `started: ${now}`);

  fs.writeFileSync(filepath, updated, 'utf8');
  actions.push(`Updated issue #${id} status to in_progress`);

  // Create branch unless --no-branch
  let branch = null;
  if (!options.no_branch) {
    const slug = path.basename(filepath, '.md').replace(/^\d+-/, '');
    branch = `feature/${id}-${slug}`;
    try {
      execSync(`git checkout -b ${branch}`, { stdio: 'pipe' });
      actions.push(`Created branch: ${branch}`);
    } catch (e) {
      actions.push(`Branch creation skipped: ${e.message.split('\n')[0]}`);
    }
  }

  return {
    success: true,
    issue: {
      id: parseInt(fm.number) || parseInt(id),
      title: fm.name || '',
      status: 'in_progress',
      branch,
      assignee: fm.assignee || '',
      url: `file://${filepath}`
    },
    actions,
    timestamp: now
  };
}

module.exports = { execute };
