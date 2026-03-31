#!/usr/bin/env node
/**
 * PM Dashboard — Self-contained HTML generator
 *
 * Generates a single HTML file with project overview, epic progress,
 * recent activity, and blockers. No external dependencies.
 * Pattern from gstack: inline CSS + HTML, zero deps.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const basePath = process.cwd();
const prdsDir = path.join(basePath, '.claude', 'prds');
const epicsDir = path.join(basePath, '.claude', 'epics');
const issuesDir = path.join(basePath, '.claude', 'issues');
const eventsPath = path.join(basePath, '.claude', 'pm', 'events.jsonl');
const outputPath = path.join(basePath, '.claude', 'pm', 'dashboard.html');

function parseFm(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  return fm;
}

function scanDir(dir, pattern = /\.md$/) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => pattern.test(f));
}

function readEvents(limit = 50) {
  if (!fs.existsSync(eventsPath)) return [];
  const lines = fs.readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// Gather data
const prds = scanDir(prdsDir).map(f => {
  const fm = parseFm(fs.readFileSync(path.join(prdsDir, f), 'utf8'));
  return { name: fm.name || f.replace('.md', ''), status: fm.status || 'draft', priority: fm.priority || 'P2' };
});

const epics = [];
if (fs.existsSync(epicsDir)) {
  for (const dir of fs.readdirSync(epicsDir, { withFileTypes: true }).filter(d => d.isDirectory())) {
    const epicFile = path.join(epicsDir, dir.name, 'epic.md');
    if (!fs.existsSync(epicFile)) continue;
    const fm = parseFm(fs.readFileSync(epicFile, 'utf8'));
    const tasks = fs.readdirSync(path.join(epicsDir, dir.name)).filter(f => /^\d+\.md$/.test(f));
    const doneTasks = tasks.filter(f => {
      const tfm = parseFm(fs.readFileSync(path.join(epicsDir, dir.name, f), 'utf8'));
      return tfm.status === 'done' || tfm.status === 'closed';
    });
    epics.push({
      name: fm.name || dir.name,
      status: fm.status || 'backlog',
      progress: tasks.length > 0 ? Math.round(doneTasks.length / tasks.length * 100) : 0,
      totalTasks: tasks.length,
      doneTasks: doneTasks.length
    });
  }
}

const issues = scanDir(issuesDir).map(f => {
  const fm = parseFm(fs.readFileSync(path.join(issuesDir, f), 'utf8'));
  return { id: fm.number || '', name: fm.name || f, status: fm.status || 'open' };
});

const events = readEvents(30);
const now = new Date().toISOString().split('T')[0];

// Count by status
const count = (arr, status) => arr.filter(i => i.status === status).length;

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AutoPM Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
  .container { max-width: 1200px; margin: 0 auto; }
  h1 { color: #58a6ff; margin-bottom: 8px; }
  .subtitle { color: #8b949e; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; }
  .card h2 { color: #58a6ff; font-size: 14px; text-transform: uppercase; margin-bottom: 12px; }
  .stat { font-size: 32px; font-weight: bold; color: #f0f6fc; }
  .stat-label { color: #8b949e; font-size: 13px; }
  .stat-row { display: flex; justify-content: space-between; margin-top: 8px; }
  .stat-item { text-align: center; }
  .stat-num { font-size: 18px; font-weight: bold; }
  .stat-num.open { color: #3fb950; }
  .stat-num.progress { color: #d29922; }
  .stat-num.done { color: #8b949e; }
  .stat-num.blocked { color: #f85149; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; color: #8b949e; font-size: 12px; padding: 8px; border-bottom: 1px solid #30363d; }
  td { padding: 8px; border-bottom: 1px solid #21262d; font-size: 13px; }
  .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-open { background: #1b4332; color: #3fb950; }
  .badge-progress { background: #3d2e00; color: #d29922; }
  .badge-done { background: #1c2128; color: #8b949e; }
  .badge-blocked { background: #3d1116; color: #f85149; }
  .badge-draft { background: #1c2128; color: #8b949e; }
  .badge-backlog { background: #1c2128; color: #8b949e; }
  .progress-bar { background: #21262d; border-radius: 4px; height: 8px; margin-top: 4px; }
  .progress-fill { background: #3fb950; border-radius: 4px; height: 100%; transition: width 0.3s; }
  .event { padding: 6px 0; border-bottom: 1px solid #21262d; font-size: 13px; }
  .event-time { color: #8b949e; font-size: 11px; }
  .event-type { color: #58a6ff; }
  footer { margin-top: 24px; text-align: center; color: #484f58; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <h1>AutoPM Dashboard</h1>
  <p class="subtitle">Generated: ${now}</p>

  <div class="grid">
    <div class="card">
      <h2>PRDs</h2>
      <div class="stat">${prds.length}</div>
      <div class="stat-row">
        <div class="stat-item"><div class="stat-num open">${count(prds, 'draft')}</div><div class="stat-label">Draft</div></div>
        <div class="stat-item"><div class="stat-num progress">${count(prds, 'review')}</div><div class="stat-label">Review</div></div>
        <div class="stat-item"><div class="stat-num done">${count(prds, 'approved')}</div><div class="stat-label">Approved</div></div>
      </div>
    </div>
    <div class="card">
      <h2>Epics</h2>
      <div class="stat">${epics.length}</div>
      <div class="stat-row">
        <div class="stat-item"><div class="stat-num open">${count(epics, 'backlog')}</div><div class="stat-label">Backlog</div></div>
        <div class="stat-item"><div class="stat-num progress">${count(epics, 'in_progress')}</div><div class="stat-label">Active</div></div>
        <div class="stat-item"><div class="stat-num done">${count(epics, 'completed')}</div><div class="stat-label">Done</div></div>
      </div>
    </div>
    <div class="card">
      <h2>Issues</h2>
      <div class="stat">${issues.length}</div>
      <div class="stat-row">
        <div class="stat-item"><div class="stat-num open">${count(issues, 'open')}</div><div class="stat-label">Open</div></div>
        <div class="stat-item"><div class="stat-num progress">${count(issues, 'in_progress')}</div><div class="stat-label">Active</div></div>
        <div class="stat-item"><div class="stat-num done">${count(issues, 'closed')}</div><div class="stat-label">Closed</div></div>
      </div>
    </div>
  </div>

  ${epics.length > 0 ? `
  <div class="card" style="margin-bottom: 24px;">
    <h2>Epic Progress</h2>
    <table>
      <tr><th>Epic</th><th>Status</th><th>Progress</th><th>Tasks</th></tr>
      ${epics.map(e => `
      <tr>
        <td>${e.name}</td>
        <td><span class="badge badge-${e.status === 'in_progress' ? 'progress' : e.status}">${e.status}</span></td>
        <td>
          <div class="progress-bar"><div class="progress-fill" style="width:${e.progress}%"></div></div>
          <span style="font-size:11px;color:#8b949e">${e.progress}%</span>
        </td>
        <td>${e.doneTasks}/${e.totalTasks}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  ${events.length > 0 ? `
  <div class="card">
    <h2>Recent Activity</h2>
    ${events.slice(-15).reverse().map(e => `
    <div class="event">
      <span class="event-type">${e.type}</span>
      ${e.title ? ` — ${e.title}` : ''}${e.name ? ` — ${e.name}` : ''}
      <span class="event-time">${e.timestamp ? e.timestamp.split('T')[0] : ''}</span>
    </div>`).join('')}
  </div>` : ''}

  <footer>
    AutoPM Dashboard — Generated ${new Date().toISOString()} — Self-contained, no external dependencies
  </footer>
</div>
</body>
</html>`;

// Write and open
const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');

console.log(`## Dashboard Generated\n`);
console.log(`File: ${outputPath}`);
console.log(`PRDs: ${prds.length} | Epics: ${epics.length} | Issues: ${issues.length}`);
console.log(`Events: ${events.length} logged\n`);
console.log(`Opening in browser...`);

try {
  if (process.platform === 'darwin') execSync(`open "${outputPath}"`);
  else if (process.platform === 'win32') execSync(`start "${outputPath}"`);
  else execSync(`xdg-open "${outputPath}"`);
} catch (e) {
  console.log(`Could not open browser. Open manually: ${outputPath}`);
}
