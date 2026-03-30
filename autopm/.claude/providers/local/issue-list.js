const fs = require('fs');
const path = require('path');

function parseIssueFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const fm = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      let value = kv[2].trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      fm[kv[1]] = value;
    }
  }
  return fm;
}

async function execute(options = {}) {
  const issuesDir = path.join(process.cwd(), '.claude', 'issues');

  if (!fs.existsSync(issuesDir)) {
    return { success: true, issues: [], count: 0 };
  }

  const files = fs.readdirSync(issuesDir).filter(f => f.endsWith('.md')).sort();
  const issues = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(issuesDir, file), 'utf8');
    const fm = parseIssueFrontmatter(content);
    if (!fm) continue;

    // Filter by status
    if (options.status && fm.status !== options.status) continue;

    // Filter by label
    if (options.label) {
      const labels = Array.isArray(fm.labels) ? fm.labels : [];
      if (!labels.includes(options.label)) continue;
    }

    issues.push({
      id: parseInt(fm.number) || 0,
      title: fm.name || file.replace('.md', ''),
      status: fm.status || 'open',
      labels: Array.isArray(fm.labels) ? fm.labels : [],
      assignee: fm.assignee || '',
      createdAt: fm.created || '',
      updatedAt: fm.updated || '',
      path: path.join(issuesDir, file)
    });
  }

  // Sort by number
  issues.sort((a, b) => a.id - b.id);

  return { success: true, issues, count: issues.length };
}

module.exports = { execute, parseIssueFrontmatter };
