#!/usr/bin/env node
/**
 * PM Session — Gather session info: version, node, git, rules, agents, events
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const basePath = process.cwd();

function run(cmd) {
  try { return execSync(cmd, { cwd: basePath, encoding: 'utf8', timeout: 5000 }).trim(); } catch { return null; }
}

function countXmlRules() {
  const rulesDir = path.join(basePath, '.claude', 'rules');
  try {
    return fs.readdirSync(rulesDir).filter(f => f.endsWith('.xml')).length;
  } catch { return 0; }
}

function countAgents() {
  const registryPath = path.join(basePath, '.claude', 'agents', 'agent-registry.xml');
  try {
    const xml = fs.readFileSync(registryPath, 'utf8');
    const coreMatch = xml.match(/<agents\s+category="core">([\s\S]*?)<\/agents>/);
    const coreCount = coreMatch ? (coreMatch[1].match(/<agent\s/g) || []).length : 0;
    const allAgents = (xml.match(/<agent\s/g) || []).length;
    return { core: coreCount, plugin: allAgents - coreCount, total: allAgents };
  } catch { return { core: 0, plugin: 0, total: 0 }; }
}

function getVersion() {
  // Try project root package.json first, then autopm package
  for (const rel of ['package.json', 'node_modules/autopm/package.json']) {
    const p = path.join(basePath, rel);
    try {
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (pkg.version) return pkg.version;
    } catch { /* continue */ }
  }
  // Try config.json version
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(basePath, '.claude', 'config.json'), 'utf8'));
    if (cfg.version) return cfg.version;
  } catch { /* continue */ }
  return 'unknown';
}

function getProvider() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(basePath, '.claude', 'config.json'), 'utf8'));
    return cfg.provider || 'local';
  } catch { return 'local'; }
}

function recentEvents(days) {
  const eventsPath = path.join(basePath, '.claude', 'pm', 'events.jsonl');
  try {
    const lines = fs.readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean);
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    let count = 0;
    for (const line of lines) {
      try {
        const ev = JSON.parse(line);
        if (ev.timestamp && ev.timestamp >= cutoff) count++;
      } catch { /* skip */ }
    }
    return { total: lines.length, recent: count };
  } catch { return { total: 0, recent: 0 }; }
}

try {
  const version = getVersion();
  const nodeVersion = run('node --version') || 'unknown';
  const gitBranch = run('git rev-parse --abbrev-ref HEAD') || 'unknown';
  const gitDirty = run('git status --porcelain');
  const gitStatus = gitDirty === null ? 'unknown' : (gitDirty === '' ? 'clean' : 'dirty');
  const provider = getProvider();
  const xmlRules = countXmlRules();
  const agents = countAgents();
  const events = recentEvents(7);

  const lines = [
    '## Session Info\n',
    '| Property | Value |',
    '|----------|-------|',
    `| AutoPM Version | ${version} |`,
    `| Node.js | ${nodeVersion} |`,
    `| Git Branch | ${gitBranch} |`,
    `| Git Status | ${gitStatus} |`,
    `| Provider | ${provider} |`,
    `| XML Rules | ${xmlRules} loaded |`,
    `| Agents | ${agents.core} core + ${agents.plugin} plugin = ${agents.total} |`,
    `| Recent Events | ${events.recent} (last 7 days) / ${events.total} total |`,
  ];

  console.log(lines.join('\n'));
} catch (e) {
  console.log(`## Session Info\n\nError gathering session info: ${e.message}`);
}
