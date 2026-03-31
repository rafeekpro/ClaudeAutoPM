/**
 * Preamble — Quick project context summary for PM commands
 */

const fs = require('fs');
const path = require('path');

/**
 * Load preamble data from project state
 * @param {string} basePath - project root (defaults to cwd)
 * @returns {{ version: string|null, provider: string, recentLearnings: Array, activeEpic: string|null, lastCheckpoint: Object|null }}
 */
function loadPreamble(basePath) {
  basePath = basePath || process.cwd();
  const result = {
    version: null,
    provider: 'local',
    recentLearnings: [],
    activeEpic: null,
    lastCheckpoint: null
  };

  // Read config.json
  try {
    const configPath = path.join(basePath, '.claude', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      result.version = config.version || null;
      if (config.providers) {
        const providers = Object.keys(config.providers);
        result.provider = providers.length > 0 ? providers[0] : 'local';
      }
    }
  } catch { /* skip */ }

  // Read last 3 learnings
  try {
    const learningsPath = path.join(basePath, '.claude', 'pm', 'learnings.jsonl');
    if (fs.existsSync(learningsPath)) {
      const lines = fs.readFileSync(learningsPath, 'utf8').trim().split('\n').filter(Boolean);
      result.recentLearnings = lines.slice(-3).map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);
    }
  } catch { /* skip */ }

  // Find active (in-progress) epic
  try {
    const epicsDir = path.join(basePath, '.claude', 'epics');
    if (fs.existsSync(epicsDir)) {
      const epicDirs = fs.readdirSync(epicsDir, { withFileTypes: true })
        .filter(d => d.isDirectory());

      for (const dir of epicDirs) {
        const epicFile = path.join(epicsDir, dir.name, 'epic.md');
        if (fs.existsSync(epicFile)) {
          const content = fs.readFileSync(epicFile, 'utf8');
          const statusMatch = content.match(/^status:\s*(.+)$/m);
          const s = statusMatch ? statusMatch[1].trim().toLowerCase() : '';
          if (s === 'in-progress' || s === 'in_progress' || s === 'active') {
            const nameMatch = content.match(/^name:\s*(.+)$/m);
            result.activeEpic = nameMatch ? nameMatch[1].trim() : dir.name;
            break;
          }
        }
      }
    }
  } catch { /* skip */ }

  // Find latest checkpoint
  try {
    const checkpointsDir = path.join(basePath, '.claude', 'pm', 'checkpoints');
    if (fs.existsSync(checkpointsDir)) {
      const files = fs.readdirSync(checkpointsDir).filter(f => f.endsWith('.json')).sort();
      if (files.length > 0) {
        const last = JSON.parse(fs.readFileSync(path.join(checkpointsDir, files[files.length - 1]), 'utf8'));
        result.lastCheckpoint = { timestamp: last.timestamp, description: last.description };
      }
    }
  } catch { /* skip */ }

  return result;
}

/**
 * Format preamble as single-line summary
 * @param {Object} preamble - from loadPreamble()
 * @returns {string}
 */
function formatPreamble(preamble) {
  const parts = [];

  if (preamble.version) {
    parts.push(`AutoPM v${preamble.version}`);
  }

  parts.push(`Provider: ${preamble.provider}`);

  if (preamble.activeEpic) {
    parts.push(`Active epic: ${preamble.activeEpic}`);
  }

  if (preamble.recentLearnings.length > 0) {
    const last = preamble.recentLearnings[preamble.recentLearnings.length - 1];
    const ago = formatTimeAgo(last.timestamp);
    const text = last.learning.length > 40 ? last.learning.slice(0, 37) + '...' : last.learning;
    parts.push(`Last learning: "${text}" (${ago})`);
  }

  return parts.join(' | ');
}

function formatTimeAgo(isoTimestamp) {
  if (!isoTimestamp) return 'unknown';
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

module.exports = { loadPreamble, formatPreamble };
