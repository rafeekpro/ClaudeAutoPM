/**
 * JSONL Event Logger
 *
 * Append-only event log for PM actions.
 * Pattern from gstack: ~/.gstack/projects/$SLUG/learnings.jsonl
 */

const fs = require('fs');
const path = require('path');

function getLogPath(basePath) {
  return path.join(basePath || process.cwd(), '.claude', 'pm', 'events.jsonl');
}

/**
 * Log an event to .claude/pm/events.jsonl
 * @param {string} type - event type (e.g. 'issue.created', 'prd.created')
 * @param {Object} data - event data
 * @param {string} [basePath] - project root (defaults to cwd)
 */
function logEvent(type, data = {}, basePath) {
  const logPath = getLogPath(basePath);
  const logDir = path.dirname(logPath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const event = {
    timestamp: new Date().toISOString(),
    type,
    ...data
  };

  fs.appendFileSync(logPath, JSON.stringify(event) + '\n', 'utf8');
}

/**
 * Read recent events from log
 * @param {number} [limit=20] - max events to return
 * @param {string} [type] - filter by event type
 * @param {string} [basePath] - project root
 * @returns {Object[]}
 */
function readEvents(limit = 20, type, basePath) {
  const logPath = getLogPath(basePath);

  if (!fs.existsSync(logPath)) return [];

  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
  let events = lines.map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  if (type) {
    events = events.filter(e => e.type === type || e.type.startsWith(type + '.'));
  }

  return events.slice(-limit);
}

/**
 * Format recent activity as markdown
 * @param {number} [days=7] - lookback window in days
 * @param {string} [basePath] - project root
 * @returns {string} markdown
 */
function formatRecentActivity(days = 7, basePath) {
  const events = readEvents(100, null, basePath);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const recent = events.filter(e => e.timestamp >= cutoff);

  if (recent.length === 0) return 'No activity in the last ' + days + ' days.';

  const counts = {};
  for (const e of recent) {
    counts[e.type] = (counts[e.type] || 0) + 1;
  }

  const lines = [`## Recent Activity (last ${days} days)\n`];
  for (const [type, count] of Object.entries(counts).sort()) {
    const label = type.replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());
    lines.push(`- ${label}: ${count}`);
  }

  return lines.join('\n');
}

module.exports = { logEvent, readEvents, formatRecentActivity, getLogPath };
