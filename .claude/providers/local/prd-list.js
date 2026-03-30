const fs = require('fs');
const path = require('path');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const fm = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      let value = kv[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      fm[kv[1]] = value;
    }
  }
  return fm;
}

async function execute(options = {}) {
  const prdsDir = path.join(process.cwd(), '.claude', 'prds');

  if (!fs.existsSync(prdsDir)) {
    return { success: true, prds: [], count: 0 };
  }

  const files = fs.readdirSync(prdsDir).filter(f => f.endsWith('.md')).sort();
  const prds = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(prdsDir, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) continue;

    if (options.status && fm.status !== options.status) continue;

    prds.push({
      name: file.replace('.md', ''),
      title: fm.name || file.replace('.md', ''),
      status: fm.status || 'draft',
      priority: fm.priority || 'P2',
      timeline: fm.timeline || '',
      createdAt: fm.created || '',
      updatedAt: fm.updated || '',
      path: path.join(prdsDir, file)
    });
  }

  return { success: true, prds, count: prds.length };
}

module.exports = { execute, parseFrontmatter };
