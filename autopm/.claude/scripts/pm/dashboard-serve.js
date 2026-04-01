#!/usr/bin/env node
/**
 * PM Config Dashboard — Interactive HTTP server
 *
 * Starts localhost-only HTTP server with bearer token auth.
 * Serves config editing forms, saves changes to disk.
 * Auto-shuts down after 5 minutes idle.
 *
 * Usage: node .claude/scripts/pm/dashboard-serve.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const basePath = process.cwd();
const pmDir = path.join(basePath, '.claude', 'pm');
const pidFile = path.join(pmDir, 'dashboard.pid');
const configPath = path.join(basePath, '.claude', 'config.json');
const mcpPath = path.join(basePath, '.claude', 'mcp-servers.json');
const envPath = path.join(basePath, '.env');
const epicsDir = path.join(basePath, '.claude', 'epics');
const prdsDir = path.join(basePath, '.claude', 'prds');
const agentRegistryPath = path.join(basePath, '.claude', 'agents', 'agent-registry.xml');
const claudeDir = path.join(basePath, '.claude');

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const token = crypto.randomBytes(16).toString('hex');
let idleTimer = null;

// Fix 3: XSS — escape HTML in user-controlled data
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resetIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    console.log('Idle timeout reached. Shutting down.');
    cleanup();
    process.exit(0);
  }, IDLE_TIMEOUT_MS);
}

function cleanup() {
  try { fs.unlinkSync(pidFile); } catch {}
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function writeJSON(p, data) {
  const backup = p + '.backup';
  if (fs.existsSync(p)) fs.copyFileSync(p, backup);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function readEnv() {
  if (!fs.existsSync(envPath)) return {};
  const vars = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) vars[m[1]] = m[2];
  }
  return vars;
}

function writeEnv(vars) {
  const backup = envPath + '.backup';
  if (fs.existsSync(envPath)) fs.copyFileSync(envPath, backup);
  const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
}

function scanPlugins() {
  const pluginsDir = path.join(basePath, 'packages');
  if (!fs.existsSync(pluginsDir)) return [];
  try {
    return fs.readdirSync(pluginsDir).filter(d => {
      try { return fs.statSync(path.join(pluginsDir, d)).isDirectory(); } catch { return false; }
    });
  } catch { return []; }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 1e6) reject(new Error('Body too large')); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// --- Diagram Generators ---
function generateEpicFlowDiagram() {
  const lines = ['graph TD'];
  // Read PRDs
  const prds = [];
  try {
    if (fs.existsSync(prdsDir)) {
      for (const f of fs.readdirSync(prdsDir)) {
        if (f.endsWith('.md')) prds.push(f.replace('.md', ''));
      }
    }
  } catch {}
  // Read epics
  const epics = [];
  try {
    if (fs.existsSync(epicsDir)) {
      for (const entry of fs.readdirSync(epicsDir)) {
        const ep = path.join(epicsDir, entry);
        if (fs.statSync(ep).isDirectory()) {
          const tasks = [];
          for (const tf of fs.readdirSync(ep)) {
            if (!tf.endsWith('.md')) continue;
            const content = fs.readFileSync(path.join(ep, tf), 'utf8');
            const sm = content.match(/status:\s*(\S+)/);
            const status = sm ? sm[1] : 'open';
            const icon = status === 'closed' || status === 'completed' || status === 'done' || status === 'complete' ? '✅' : status === 'in-progress' || status === 'in_progress' ? '🔄' : '⬜';
            tasks.push({ name: tf.replace('.md', ''), icon });
          }
          epics.push({ name: entry, tasks });
        }
      }
    }
  } catch {}
  if (epics.length === 0 && prds.length === 0) {
    return { mermaid: '', hasData: false };
  }
  let nodeId = 0;
  for (const prd of prds) {
    const pid = `P${nodeId++}`;
    lines.push(`  ${pid}[PRD: ${prd}]`);
    const matchingEpic = epics.find(e => e.name === prd);
    if (matchingEpic) {
      const eid = `E${nodeId++}`;
      lines.push(`  ${pid} --> ${eid}[Epic: ${matchingEpic.name}]`);
      for (const t of matchingEpic.tasks) {
        const tid = `T${nodeId++}`;
        lines.push(`  ${eid} --> ${tid}["${t.name} ${t.icon}"]`);
      }
    }
  }
  // Epics without matching PRDs
  for (const epic of epics) {
    if (prds.includes(epic.name)) continue;
    const eid = `E${nodeId++}`;
    lines.push(`  ${eid}[Epic: ${epic.name}]`);
    for (const t of epic.tasks) {
      const tid = `T${nodeId++}`;
      lines.push(`  ${eid} --> ${tid}["${t.name} ${t.icon}"]`);
    }
  }
  return { mermaid: lines.join('\n'), hasData: true };
}

function generatePluginGraph() {
  const plugins = scanPlugins();
  const lines = ['graph TD'];
  if (plugins.length === 0) {
    lines.push('  N[No plugins found]');
    return lines.join('\n');
  }
  const hasCore = plugins.includes('plugin-core');
  if (hasCore) {
    lines.push('  Core[plugin-core]');
    for (const p of plugins) {
      if (p === 'plugin-core') continue;
      const id = p.replace(/-/g, '_');
      const label = p;
      lines.push(`  Core --> ${id}[${label}]`);
    }
  } else {
    for (const p of plugins) {
      const id = p.replace(/-/g, '_');
      lines.push(`  ${id}[${p}]`);
    }
  }
  return lines.join('\n');
}

function generateAgentTree() {
  const lines = ['graph TD'];
  lines.push('  A[Select Agent] --> B{Task Type}');
  // Try to read agent registry
  let agents = [];
  try {
    if (fs.existsSync(agentRegistryPath)) {
      const content = fs.readFileSync(agentRegistryPath, 'utf8');
      const matches = content.match(/<agent[^>]*name="([^"]+)"/g);
      if (matches) {
        agents = matches.map(m => { const n = m.match(/name="([^"]+)"/); return n ? n[1] : null; }).filter(Boolean);
      }
    }
  } catch {}
  if (agents.length === 0) {
    // Fallback defaults
    agents = ['code-analyzer', 'test-runner', 'file-analyzer', 'parallel-worker'];
  }
  let nodeId = 0;
  for (const agent of agents.slice(0, 12)) {
    const id = `AG${nodeId++}`;
    lines.push(`  B --> ${id}[${agent}]`);
  }
  if (agents.length > 12) {
    lines.push(`  B --> MORE[... +${agents.length - 12} more]`);
  }
  return lines.join('\n');
}

// --- Test Plan Data ---
function readTestPlan() {
  const testPlanPath = path.join(pmDir, 'test-plan.md');
  try { return fs.readFileSync(testPlanPath, 'utf8'); } catch { return null; }
}

function readTestResults() {
  const resultsPath = path.join(pmDir, 'test-results.json');
  try { return JSON.parse(fs.readFileSync(resultsPath, 'utf8')); } catch { return null; }
}

function getStatusData() {
  const config = readJSON(configPath) || {};
  const mcp = readJSON(mcpPath) || {};
  const plugins = scanPlugins();
  const env = readEnv();
  const eventsPath = path.join(pmDir, 'events.jsonl');
  let events = [];
  if (fs.existsSync(eventsPath)) {
    const lines = fs.readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean);
    events = lines.slice(-20).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse();
  }
  return { config, mcp, plugins, env, events };
}

function getProjectDiagrams() {
  const diagramsDir = path.join(basePath, '.claude', 'pm', 'diagrams');
  let entries;
  try {
    if (!fs.existsSync(diagramsDir)) return [];
    entries = fs.readdirSync(diagramsDir);
  } catch { return []; }

  const diagrams = [];
  for (const f of entries) {
    if (!f.endsWith('.mmd')) continue;
    try {
      const name = f.replace(/\.mmd$/, '');
      const d = { name, content: fs.readFileSync(path.join(diagramsDir, f), 'utf8') };
      // Load metadata if available
      const metaPath = path.join(diagramsDir, name + '.meta.json');
      try { const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); d.type = meta.type || 'custom'; } catch { d.type = 'custom'; }
      diagrams.push(d);
    } catch { /* skip unreadable */ }
  }
  return diagrams;
}

function getDiagramsData() {
  const epic = generateEpicFlowDiagram();
  return {
    epicFlow: epic.mermaid,
    epicFlowHasData: epic.hasData,
    projectDiagrams: getProjectDiagrams(),
    pluginGraph: generatePluginGraph(),
    agentTree: generateAgentTree()
  };
}

function getTestsData() {
  return {
    testPlan: readTestPlan(),
    testResults: readTestResults()
  };
}

// --- HTML ---
function renderHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AutoPM Config Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/panzoom@9.4.3/dist/panzoom.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { color: #58a6ff; margin-bottom: 4px; }
  .subtitle { color: #8b949e; margin-bottom: 24px; font-size: 13px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .card h2 { color: #58a6ff; font-size: 14px; text-transform: uppercase; margin-bottom: 14px; }
  .card h3 { color: #c9d1d9; font-size: 13px; margin-bottom: 10px; }
  label { display: block; color: #8b949e; font-size: 12px; margin-bottom: 4px; margin-top: 10px; }
  select, input[type="text"], input[type="password"] {
    background: #0d1117; border: 1px solid #30363d; color: #c9d1d9; border-radius: 6px;
    padding: 8px 12px; width: 100%; font-size: 13px; outline: none;
  }
  select:focus, input:focus { border-color: #58a6ff; }
  .row { display: flex; gap: 16px; flex-wrap: wrap; }
  .row > div { flex: 1; min-width: 200px; }
  .toggle-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
  .toggle { position: relative; width: 40px; height: 22px; cursor: pointer; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle .slider { position: absolute; inset: 0; background: #30363d; border-radius: 11px; transition: 0.2s; }
  .toggle .slider:before { content: ''; position: absolute; left: 3px; top: 3px; width: 16px; height: 16px; background: #8b949e; border-radius: 50%; transition: 0.2s; }
  .toggle input:checked + .slider { background: #238636; }
  .toggle input:checked + .slider:before { transform: translateX(18px); background: #fff; }
  .toggle-label { color: #c9d1d9; font-size: 13px; }
  .btn { background: #238636; color: #fff; border: none; border-radius: 6px; padding: 8px 20px; cursor: pointer; font-size: 13px; margin-top: 14px; }
  .btn:hover { background: #2ea043; }
  .btn-danger { background: #da3633; }
  .btn-danger:hover { background: #f85149; }
  .btn-sm { padding: 4px 12px; font-size: 12px; margin-top: 0; }
  .mcp-entry { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; margin-top: 8px; }
  .mcp-entry .row { margin-top: 6px; }
  .mcp-card { background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .mcp-card h4 { color: #58a6ff; margin-bottom: 4px; }
  .mcp-card .mcp-desc { color: #8b949e; font-size: 12px; margin-bottom: 12px; }
  .mcp-card .env-var-row { display: flex; gap: 8px; margin-top: 4px; align-items: center; }
  .mcp-card .env-var-row input { flex: 1; }
  .env-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
  .env-row input { flex: 1; }
  .btn-icon { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; }
  .plugin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; }
  .plugin-item { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 8px 12px; font-size: 13px; }
  .plugin-item label { display: flex; align-items: center; gap: 8px; color: #c9d1d9; font-size: 13px; margin: 0; }
  .plugin-item input { width: 16px; height: 16px; accent-color: #238636; }
  .plugin-item .hint { margin-left: 24px; }
  .hint { color: #8b949e; font-size: 12px; margin: 2px 0 8px 0; }
  .desc { color: #8b949e; font-size: 13px; margin-bottom: 16px; }
  .mcp-presets button, .env-suggestions button {
    background: #21262d; color: #58a6ff; border: 1px solid #30363d;
    padding: 4px 12px; border-radius: 4px; cursor: pointer; margin: 4px;
  }
  .mcp-presets button:hover, .env-suggestions button:hover { background: #30363d; }
  .mcp-presets, .env-suggestions { margin-bottom: 12px; }
  .events { max-height: 200px; overflow-y: auto; }
  .event { padding: 5px 0; border-bottom: 1px solid #21262d; font-size: 12px; }
  .event-type { color: #58a6ff; }
  .event-time { color: #484f58; }
  .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #30363d; }
  .tab { background: none; border: none; color: #8b949e; padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; font-size: 13px; }
  .tab.active { color: #58a6ff; border-bottom-color: #58a6ff; }
  .tab:hover { color: #c9d1d9; }
  .tab-content { display: none; }
  .tab-content.active { display: block; }
  .grid { display: grid; gap: 16px; }
  .test-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .test-table th { text-align: left; color: #8b949e; padding: 6px 8px; border-bottom: 1px solid #30363d; }
  .test-table td { padding: 6px 8px; border-bottom: 1px solid #21262d; }
  .test-table tr:hover { background: #1c2128; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
  .badge-pending { background: #30363d; color: #8b949e; }
  .badge-passed { background: #1b3a2d; color: #3fb950; }
  .badge-failed { background: #3d1116; color: #f85149; }
  .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; font-size: 13px; color: #fff; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 999; }
  .toast.show { opacity: 1; }
  .toast.ok { background: #238636; }
  .toast.err { background: #da3633; }
  footer { margin-top: 24px; text-align: center; color: #484f58; font-size: 12px; }
  /* Diagram list */
  .diagram-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .diagram-grid-item {
    background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 16px; cursor: pointer; transition: border-color 0.15s;
  }
  .diagram-grid-item:hover { border-color: #58a6ff; }
  .diagram-grid-item h4 { color: #58a6ff; margin-bottom: 4px; }
  .diagram-grid-item .diagram-meta { color: #8b949e; font-size: 11px; }
  .diagram-grid-item .diagram-preview { height: 100px; overflow: hidden; opacity: 0.6; margin-top: 8px; }
  .diagram-grid-item .diagram-preview svg { max-height: 100px; width: 100%; }
  /* Diagram split editor */
  .diagram-editor { display: none; }
  .diagram-editor.active { display: flex; flex-direction: column; }
  .diagram-editor-toolbar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; margin-bottom: 8px;
  }
  .diagram-editor-toolbar .left { display: flex; align-items: center; gap: 12px; }
  .diagram-editor-toolbar .right { display: flex; gap: 6px; }
  .diagram-editor-toolbar button {
    background: #21262d; color: #8b949e; border: 1px solid #30363d;
    padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
  }
  .diagram-editor-toolbar button:hover { background: #30363d; color: #c9d1d9; }
  .diagram-editor-toolbar .btn-save { background: #238636; color: #fff; border-color: #238636; }
  .diagram-editor-toolbar .btn-save:hover { background: #2ea043; }
  .diagram-editor-toolbar .btn-back { color: #58a6ff; }
  .diagram-split {
    display: flex; gap: 0; flex: 1; min-height: 500px;
    border: 1px solid #30363d; border-radius: 8px; overflow: hidden;
  }
  .diagram-split .code-pane {
    flex: 1; display: flex; flex-direction: column; border-right: 1px solid #30363d; min-width: 0;
  }
  .diagram-split .code-pane .pane-header {
    background: #161b22; padding: 6px 12px; font-size: 11px; color: #8b949e;
    border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center;
  }
  .diagram-split .code-pane textarea {
    flex: 1; background: #0d1117; color: #c9d1d9; border: none; padding: 12px;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 13px;
    line-height: 1.5; resize: none; outline: none; tab-size: 2;
  }
  .diagram-split .preview-pane {
    flex: 1; display: flex; flex-direction: column; background: #161b22; min-width: 0;
  }
  .diagram-split .preview-pane .pane-header {
    background: #161b22; padding: 6px 12px; font-size: 11px; color: #8b949e;
    border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center;
  }
  .diagram-split .preview-pane .pane-header button {
    background: none; border: none; color: #8b949e; cursor: pointer; font-size: 11px; padding: 2px 6px;
  }
  .diagram-split .preview-pane .pane-header button:hover { color: #c9d1d9; }
  .diagram-split .preview-container {
    flex: 1; overflow: hidden; position: relative; background: #0d1117;
  }
  .diagram-split .preview-container svg { width: 100%; height: 100%; }
  .panzoom-hint {
    position: absolute; bottom: 8px; right: 12px; color: #484f58; font-size: 10px; pointer-events: none; z-index: 1;
  }
</style>
</head>
<body>
<div class="container">
  <h1>AutoPM Config Dashboard</h1>
  <p class="subtitle">Interactive configuration editor &mdash; changes save to disk</p>

  <div id="connection-banner" style="display:none;background:#3d1116;color:#f85149;padding:12px;border-radius:8px;margin-bottom:16px;text-align:center;">
    Connection lost. Server may have auto-shutdown (5min idle).
    <button onclick="location.reload()" style="background:#da3633;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;margin-left:8px;">Retry</button> or restart with /pm:dashboard --serve
  </div>

  <div class="tabs">
    <button class="tab active" onclick="showTab('overview', this)">Overview</button>
    <button class="tab" onclick="showTab('config', this)">Config</button>
    <button class="tab" onclick="showTab('mcp', this)">MCP & Keys</button>
    <button class="tab" onclick="showTab('diagrams', this)">Diagrams</button>
    <button class="tab" onclick="showTab('tests', this)">Tests</button>
  </div>

  <!-- Overview Tab -->
  <div id="tab-overview" class="tab-content active">
    <div class="card">
      <h2>Configuration Overview</h2>
      <p class="desc">Quick view of current settings. Use Config tab to edit.</p>
      <div class="row">
        <div><label>Strategy</label><span id="ov-strategy">-</span></div>
        <div><label>Provider</label><span id="ov-provider">-</span></div>
        <div><label>Plugins</label><span id="ov-plugins">-</span></div>
      </div>
    </div>
    <div class="card">
      <h2>Recent Events</h2>
      <div class="events" id="events-list"></div>
    </div>
    <div class="card">
      <h3>Agent Selection</h3>
      <pre class="mermaid" id="diagram-agents"></pre>
    </div>
  </div>

  <!-- Config Tab -->
  <div id="tab-config" class="tab-content">
    <div class="card" id="config-section">
      <h2>Configuration</h2>
      <p class="desc">Project execution settings. Changes saved to .claude/config.json</p>
      <div class="row">
        <div>
          <label>Execution Strategy</label>
          <p class="hint">How Claude Code runs tasks: sequential (safe), adaptive (smart auto-choice), hybrid (max parallel)</p>
          <select id="cfg-strategy">
            <option value="sequential">sequential</option>
            <option value="parallel">parallel</option>
            <option value="adaptive">adaptive</option>
          </select>
        </div>
        <div>
          <label>Provider</label>
          <p class="hint">Where issues/epics are tracked: local (files only), github (requires gh CLI), azure (requires PAT)</p>
          <select id="cfg-provider">
            <option value="github">github</option>
            <option value="azure">azure</option>
            <option value="local">local</option>
          </select>
        </div>
      </div>
      <div class="toggle-row">
        <label class="toggle"><input type="checkbox" id="cfg-docker"><span class="slider"></span></label>
        <div>
          <span class="toggle-label">Docker</span>
          <p class="hint">Enable Docker-first development. Tests and commands run inside containers.</p>
        </div>
      </div>
      <div class="toggle-row">
        <label class="toggle"><input type="checkbox" id="cfg-k8s"><span class="slider"></span></label>
        <div>
          <span class="toggle-label">Kubernetes</span>
          <p class="hint">Enable Kubernetes orchestration for deployment and scaling.</p>
        </div>
      </div>
      <button class="btn" onclick="saveConfig()">Save Config</button>
    </div>

    <div class="card" id="plugins-section">
      <h2>Plugins</h2>
      <p class="desc">Check plugins to include their agents. Click Save Plugins to apply. Requires re-running <code>autopm install</code>.</p>
      <div class="plugin-grid" id="plugin-list"></div>
      <p id="no-plugins" style="color:#8b949e;font-size:13px;display:none">No plugins found in packages/</p>
      <button class="btn" onclick="saveConfig()">Save Plugins</button>
    </div>
    <div class="card">
      <h3>Installed Plugins</h3>
      <pre class="mermaid" id="diagram-plugins"></pre>
    </div>
  </div>

  <!-- MCP & Keys Tab -->
  <div id="tab-mcp" class="tab-content">
    <div class="card" id="mcp-section">
      <h2>MCP Servers</h2>
      <p class="desc">Model Context Protocol servers provide real-time documentation and tools to Claude Code.</p>
      <div class="mcp-presets">
        <span style="color:#8b949e;font-size:12px;margin-right:8px;">Quick add:</span>
        <button onclick="addMcpPreset('context7')">+ Context7 (docs)</button>
        <button onclick="addMcpPreset('playwright')">+ Playwright (browser)</button>
      </div>
      <div id="mcp-list"></div>
      <button class="btn" style="margin-right:8px" onclick="addMcpCard()">+ Add Server</button>
      <button class="btn" onclick="saveMcp()">Save MCP Config</button>
      <p style="margin-top:12px"><a href="https://github.com/modelcontextprotocol/servers" target="_blank" style="color:#58a6ff;font-size:12px;">Browse more MCP servers</a></p>
    </div>

    <div class="card" id="env-section">
      <h2>API Keys / Environment</h2>
      <p class="desc">Environment variables stored in .claude/.env. Values are masked by default &mdash; click the eye icon to reveal.</p>
      <div id="env-list"></div>
      <button class="btn" style="margin-right:8px" onclick="addEnvRow()">+ Add Variable</button>
      <button class="btn" onclick="saveEnv()">Save .claude/.env</button>
      <div class="env-suggestions" style="margin-top:12px;">
        <p class="hint">Quick add:</p>
        <button onclick="addEnvSuggestion('GITHUB_TOKEN','','GitHub personal access token')">+ GITHUB_TOKEN</button>
        <button onclick="addEnvSuggestion('OPENAI_API_KEY','','OpenAI API key for AI agents')">+ OPENAI_API_KEY</button>
        <button onclick="addEnvSuggestion('AZURE_DEVOPS_PAT','','Azure DevOps personal access token')">+ AZURE_DEVOPS_PAT</button>
        <button onclick="addEnvSuggestion('HF_TOKEN','','HuggingFace API token')">+ HF_TOKEN</button>
      </div>
    </div>
  </div>

  <!-- Diagrams Tab -->
  <div id="tab-diagrams" class="tab-content">
    <!-- Diagram list view -->
    <div id="diagram-list-view">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <p class="desc" style="margin:0;">Click a diagram to view and edit. Create new: <code>/pm:diagram-new &lt;name&gt;</code></p>
      </div>
      <div id="diagram-grid" class="diagram-grid"></div>
    </div>
    <!-- Diagram editor view (split: code | preview) -->
    <div id="diagram-editor-view" class="diagram-editor">
      <div class="diagram-editor-toolbar">
        <div class="left">
          <button class="btn-back" onclick="closeDiagramEditor()">← Back</button>
          <strong id="editor-diagram-name" style="color:#c9d1d9;font-size:14px;"></strong>
          <span id="editor-diagram-meta" style="color:#8b949e;font-size:11px;"></span>
          <span id="editor-unsaved" style="color:#d29922;font-size:11px;display:none;">● unsaved</span>
        </div>
        <div class="right">
          <button onclick="downloadCurrentDiagram()">↓ .mmd</button>
          <button class="btn-save" onclick="saveDiagram()">Save</button>
        </div>
      </div>
      <div class="diagram-split">
        <div class="code-pane">
          <div class="pane-header"><span>Mermaid Source</span></div>
          <textarea id="diagram-code" spellcheck="false"></textarea>
        </div>
        <div class="preview-pane">
          <div class="pane-header">
            <span>Preview</span>
            <button onclick="resetPanZoom()">Reset zoom</button>
          </div>
          <div class="preview-container" id="diagram-preview-container">
            <div id="diagram-preview-render"></div>
            <div class="panzoom-hint">Scroll to zoom · Drag to pan</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Tests Tab -->
  <div id="tab-tests" class="tab-content">
    <div class="card">
      <h2>TEST PLAN</h2>
      <p class="desc">Generated from epic acceptance criteria. Run /pm:test-plan to regenerate.</p>
      <div id="test-plan-content">Loading...</div>
    </div>
    <div class="card">
      <h2>LAST TEST RESULTS</h2>
      <p class="desc">From .claude/pm/test-results.json (run npm test with --json reporter)</p>
      <div id="test-results-content">No test results found.</div>
    </div>
  </div>

  <footer>AutoPM Config Dashboard &mdash; localhost only &mdash; auto-shutdown after 5 min idle</footer>
</div>

<div class="toast" id="toast"></div>

<script>
if (typeof mermaid !== 'undefined' && mermaid.initialize) {
  mermaid.initialize({ startOnLoad: false, theme: 'dark' });
}

const TOKEN = '${token}';
const headers = { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };

// Fix 3: client-side XSS escaping
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function showTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'diagrams') renderDiagramsTab();
}

// --- Diagram editor state ---
let diagramsLoaded = false;
let allDiagrams = [];
let currentDiagramName = null;
let currentDiagramSaved = '';
let panzoomInstance = null;
let previewDebounce = null;

function renderDiagramsTab() {
  if (diagramsLoaded) return;
  fetch('/api/diagrams', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(data => {
      // Merge system-generated + project diagrams into one list
      allDiagrams = [];
      if (data.epicFlowHasData) {
        allDiagrams.push({ name: 'epic-flow', content: data.epicFlow, type: 'system', meta: 'PRD → Epic → Tasks' });
      }
      allDiagrams.push({ name: 'plugins', content: data.pluginGraph, type: 'system', meta: 'Plugin dependencies' });
      allDiagrams.push({ name: 'agents', content: data.agentTree, type: 'system', meta: 'Agent selection tree' });
      if (data.projectDiagrams) {
        data.projectDiagrams.forEach(d => {
          allDiagrams.push({ name: d.name, content: d.content, type: 'project', meta: d.type || 'custom' });
        });
      }
      renderDiagramGrid();
      diagramsLoaded = true;
    });
}

function renderDiagramGrid() {
  const grid = document.getElementById('diagram-grid');
  grid.textContent = '';
  if (allDiagrams.length === 0) {
    grid.innerHTML = '<p class="desc">No diagrams yet. Run <code>/pm:diagram-new &lt;name&gt;</code> to create one.</p>';
    return;
  }
  allDiagrams.forEach(d => {
    const item = document.createElement('div');
    item.className = 'diagram-grid-item';
    item.onclick = function() { openDiagramEditor(d.name); };
    const h4 = document.createElement('h4');
    h4.textContent = d.name;
    const meta = document.createElement('div');
    meta.className = 'diagram-meta';
    meta.textContent = d.type === 'system' ? '⚙ ' + d.meta : '📄 ' + d.meta;
    const preview = document.createElement('div');
    preview.className = 'diagram-preview';
    const pre = document.createElement('pre');
    pre.className = 'mermaid';
    pre.textContent = d.content;
    preview.appendChild(pre);
    item.appendChild(h4);
    item.appendChild(meta);
    item.appendChild(preview);
    grid.appendChild(item);
  });
  // Render mini previews
  if (typeof mermaid !== 'undefined' && mermaid.run) {
    mermaid.run({ nodes: grid.querySelectorAll('.mermaid') });
  }
}

function openDiagramEditor(name) {
  const d = allDiagrams.find(x => x.name === name);
  if (!d) return;
  currentDiagramName = name;
  currentDiagramSaved = d.content;
  document.getElementById('editor-diagram-name').textContent = name;
  document.getElementById('editor-diagram-meta').textContent = d.type === 'system' ? '(system — read-only)' : '';
  document.getElementById('editor-unsaved').style.display = 'none';
  const codeEl = document.getElementById('diagram-code');
  codeEl.value = d.content;
  codeEl.readOnly = d.type === 'system';
  document.getElementById('diagram-list-view').style.display = 'none';
  document.getElementById('diagram-editor-view').classList.add('active');
  // Lock auto-refresh while editing
  editingLock = true;
  renderPreview(d.content);
}

function closeDiagramEditor() {
  if (panzoomInstance) { panzoomInstance.dispose(); panzoomInstance = null; }
  document.getElementById('diagram-editor-view').classList.remove('active');
  document.getElementById('diagram-list-view').style.display = '';
  currentDiagramName = null;
  editingLock = false;
}

function renderPreview(source) {
  const container = document.getElementById('diagram-preview-render');
  container.textContent = '';
  if (panzoomInstance) { panzoomInstance.dispose(); panzoomInstance = null; }
  if (!source || !source.trim()) { container.textContent = 'Empty diagram'; return; }
  const pre = document.createElement('pre');
  pre.className = 'mermaid';
  pre.textContent = source;
  container.appendChild(pre);
  if (typeof mermaid !== 'undefined' && mermaid.run) {
    mermaid.run({ nodes: [pre] }).then(function() {
      const svg = container.querySelector('svg');
      if (svg && typeof panzoom !== 'undefined') {
        svg.style.width = '100%';
        svg.style.height = '100%';
        panzoomInstance = panzoom(svg, { maxZoom: 10, minZoom: 0.1, smoothScroll: false });
      }
    }).catch(function() {
      container.textContent = 'Mermaid syntax error — check your code';
    });
  }
}

function resetPanZoom() {
  if (panzoomInstance) {
    panzoomInstance.moveTo(0, 0);
    panzoomInstance.zoomAbs(0, 0, 1);
  }
}

// Live preview on code change
document.addEventListener('DOMContentLoaded', function() {
  const codeEl = document.getElementById('diagram-code');
  if (codeEl) {
    codeEl.addEventListener('input', function() {
      document.getElementById('editor-unsaved').style.display = codeEl.value !== currentDiagramSaved ? '' : 'none';
      clearTimeout(previewDebounce);
      previewDebounce = setTimeout(function() { renderPreview(codeEl.value); }, 600);
    });
  }
});

async function saveDiagram() {
  if (!currentDiagramName) return;
  const d = allDiagrams.find(x => x.name === currentDiagramName);
  if (d && d.type === 'system') { toast('System diagrams are read-only', false); return; }
  const content = document.getElementById('diagram-code').value;
  try {
    await api('POST', '/api/diagrams/' + encodeURIComponent(currentDiagramName), { content: content });
    currentDiagramSaved = content;
    if (d) d.content = content;
    document.getElementById('editor-unsaved').style.display = 'none';
    toast('Diagram saved', true);
  } catch (e) {
    toast('Save failed: ' + e.message, false);
  }
}

function downloadCurrentDiagram() {
  const src = document.getElementById('diagram-code').value;
  if (!src || !currentDiagramName) return;
  const safeName = currentDiagramName.replace(/[^a-zA-Z0-9_-]/g, '_') + '.mmd';
  const blob = new Blob([src], { type: 'text/plain' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = safeName;
  a.style.display = 'none';
  document.body.appendChild(a);
  try { a.click(); } finally {
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 100);
  }
}

function renderTestPlan(md) {
  if (!md) { document.getElementById('test-plan-content').textContent = 'No test plan found. Run /pm:test-plan to generate.'; return; }
  const lines = md.split('\\n');
  let html = '';
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('# ')) html += '<h2 style="color:#58a6ff;margin:8px 0">' + esc(line.slice(2)) + '</h2>';
    else if (line.startsWith('## ')) html += '<h3 style="color:#c9d1d9;margin:8px 0">' + esc(line.slice(3)) + '</h3>';
    else if (line.startsWith('| #')) {
      html += '<table class="test-table"><thead><tr>';
      inTable = true;
      const cols = line.split('|').filter(Boolean).map(c => c.trim());
      for (const c of cols) html += '<th>' + esc(c) + '</th>';
      html += '</tr></thead><tbody>';
    } else if (line.startsWith('|---')) { /* skip separator */ }
    else if (line.startsWith('|') && line.includes('|')) {
      html += '<tr>';
      const text = line.replace(/\\|/g, '&#124;');
      const cols = text.split('|').filter(Boolean).map(c => c.trim());
      for (let i = 0; i < cols.length; i++) {
        let val = esc(cols[i]).replace(/&#124;/g, '|');
        if (i === cols.length - 1) {
          const cls = val === 'passed' ? 'badge-passed' : val === 'failed' ? 'badge-failed' : 'badge-pending';
          val = '<span class="badge ' + cls + '">' + val + '</span>';
        }
        html += '<td>' + val + '</td>';
      }
      html += '</tr>';
    } else if (line.startsWith('Total:') || line.startsWith('Summary:')) {
      if (inTable) { html += '</tbody></table>'; inTable = false; }
      html += '<p style="color:#8b949e;margin-top:8px;font-size:12px">' + esc(line) + '</p>';
    } else if (line.trim()) {
      html += '<p style="color:#c9d1d9;font-size:13px">' + esc(line) + '</p>';
    }
  }
  if (inTable) html += '</tbody></table>';
  document.getElementById('test-plan-content').innerHTML = html;
}

function renderTestResults(results) {
  if (!results) { document.getElementById('test-results-content').textContent = 'No test results found.'; return; }
  let html = '';
  const passed = results.numPassedTests || 0;
  const failed = results.numFailedTests || 0;
  const total = results.numTotalTests || (passed + failed);
  html += '<div style="display:flex;gap:16px;margin-bottom:12px">';
  html += '<span class="badge badge-passed">' + passed + ' passed</span>';
  if (failed > 0) html += '<span class="badge badge-failed">' + failed + ' failed</span>';
  html += '<span style="color:#8b949e;font-size:12px">' + total + ' total</span>';
  html += '</div>';
  if (results.testResults && Array.isArray(results.testResults)) {
    html += '<table class="test-table"><thead><tr><th>Suite</th><th>Status</th><th>Time</th></tr></thead><tbody>';
    for (const suite of results.testResults) {
      const name = (suite.testFilePath || suite.name || '').split('/').pop();
      const status = suite.status === 'passed' ? '<span class="badge badge-passed">passed</span>' : '<span class="badge badge-failed">failed</span>';
      const time = suite.perfStats ? ((suite.perfStats.end - suite.perfStats.start) / 1000).toFixed(1) + 's' : '-';
      html += '<tr><td>' + esc(name) + '</td><td>' + status + '</td><td>' + time + '</td></tr>';
    }
    html += '</tbody></table>';
  }
  document.getElementById('test-results-content').innerHTML = html;
}

const PLUGIN_DESCRIPTIONS = {
  'plugin-core': 'Core agents (always installed). agent-manager, code-analyzer, test-runner, file-analyzer, parallel-worker, mcp-manager, context-optimizer.',
  'plugin-languages': 'Python, JavaScript, Node.js, Bash agents. For backend/frontend development.',
  'plugin-frameworks': 'React, Tailwind, UX, E2E testing, NATS. For frontend/UI development.',
  'plugin-cloud': 'AWS, Azure, GCP, Kubernetes, Terraform. For cloud infrastructure.',
  'plugin-devops': 'Docker, GitHub Actions, SSH, observability. For CI/CD and deployment.',
  'plugin-databases': 'PostgreSQL, MongoDB, Redis, BigQuery, CosmosDB. For database work.',
  'plugin-ai': 'OpenAI, Gemini, LangChain, HuggingFace. For AI/ML integrations.',
  'plugin-data': 'Airflow, Kedro, LangGraph. For data pipelines.',
  'plugin-ml': 'ML workflow agents. For machine learning projects.',
  'plugin-testing': 'Frontend testing specialists. For UI test automation.',
  'plugin-pm': 'PM commands (always installed). PRD, epic, issue management.',
  'plugin-pm-github': 'GitHub integration. Issues, PRs, Actions sync.',
  'plugin-pm-azure': 'Azure DevOps integration. Work items, sprints.'
};

function toast(msg, ok) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (ok ? 'ok' : 'err');
  setTimeout(() => t.className = 'toast', 2500);
}

async function api(method, url, body) {
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (e) { toast(e.message, false); throw e; }
}

function loadStatus(data) {
  const cfg = data.config || {};
  const strategy = cfg.execution_strategy?.mode || cfg.execution_strategy || 'sequential';
  document.getElementById('cfg-strategy').value = strategy;
  document.getElementById('cfg-provider').value = cfg.provider || 'github';

  // Overview tab
  document.getElementById('ov-strategy').textContent = strategy;
  document.getElementById('ov-provider').textContent = cfg.provider || 'github';
  document.getElementById('ov-plugins').textContent = data.plugins.length + ' installed';
  document.getElementById('cfg-docker').checked = !!(cfg.docker?.enabled ?? cfg.features?.docker_first_development);
  document.getElementById('cfg-k8s').checked = !!(cfg.kubernetes?.enabled);

  // Plugins
  const pl = document.getElementById('plugin-list');
  const np = document.getElementById('no-plugins');
  pl.innerHTML = '';
  if (data.plugins.length === 0) { np.style.display = 'block'; }
  else {
    np.style.display = 'none';
    // Fix 9: check actual enabled status, not just key presence
    const enabledSet = new Set();
    if (Array.isArray(cfg.plugins)) {
      cfg.plugins.forEach(p => enabledSet.add(p));
    } else if (cfg.plugins && typeof cfg.plugins === 'object') {
      for (const [k, v] of Object.entries(cfg.plugins)) {
        if (v === true || v === 'enabled') enabledSet.add(k);
      }
    }
    data.plugins.forEach(p => {
      const d = document.createElement('div'); d.className = 'plugin-item';
      const lbl = document.createElement('label');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.plugin = p; cb.checked = enabledSet.has(p);
      const sp = document.createElement('span'); sp.textContent = ' ' + p;
      lbl.appendChild(cb); lbl.appendChild(sp);
      d.appendChild(lbl);
      if (PLUGIN_DESCRIPTIONS[p]) {
        const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = PLUGIN_DESCRIPTIONS[p];
        d.appendChild(hint);
      }
      pl.appendChild(d);
    });
  }

  // MCP
  const ml = document.getElementById('mcp-list');
  ml.innerHTML = '';
  const servers = data.mcp?.mcpServers || {};
  for (const [name, srv] of Object.entries(servers)) {
    addMcpCard(name, srv.command || '', (srv.args || []).join(' '), '', srv.env || {});
  }

  // Env
  const el = document.getElementById('env-list');
  el.innerHTML = '';
  const envData = data.env || {};
  for (const [k, v] of Object.entries(envData)) {
    addEnvRow(k, v);
  }

  // Events
  const ev = document.getElementById('events-list');
  ev.innerHTML = '';
  // Fix 3: XSS — use escaped content in events
  (data.events || []).forEach(e => {
    const d = document.createElement('div'); d.className = 'event';
    const typeSpan = document.createElement('span'); typeSpan.className = 'event-type'; typeSpan.textContent = e.type || '';
    const text = document.createTextNode(' ' + (e.title || e.name || '') + ' ');
    const timeSpan = document.createElement('span'); timeSpan.className = 'event-time'; timeSpan.textContent = e.timestamp ? e.timestamp.split('T')[0] : '';
    d.appendChild(typeSpan); d.appendChild(text); d.appendChild(timeSpan);
    ev.appendChild(d);
  });

  // Test plan and results fetched on demand
  fetchTests();
}

function fetchTests() {
  fetch('/api/tests', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => r.json())
    .then(data => {
      renderTestPlan(data.testPlan);
      renderTestResults(data.testResults);
    })
    .catch(() => {});
}

const MCP_PRESETS = {
  context7: {
    name: 'context7',
    command: 'npx',
    args: '@upstash/context7-mcp',
    description: 'Real-time library documentation. Queries up-to-date API docs before writing code. No API key needed.',
    envVars: []
  },
  playwright: {
    name: 'playwright-mcp',
    command: 'npx',
    args: '@playwright/mcp',
    description: 'Browser automation for E2E testing and screenshots. No API key needed.',
    envVars: [{ key: 'PLAYWRIGHT_HEADLESS', value: 'true', hint: 'Run browser headless (true/false)' }]
  }
};

function addMcpCard(name, cmd, args, description, envVars) {
  const ml = document.getElementById('mcp-list');
  const card = document.createElement('div'); card.className = 'mcp-card';

  const header = document.createElement('div'); header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'start';
  const h4 = document.createElement('h4'); h4.textContent = name || 'New Server';
  const rmBtn = document.createElement('button'); rmBtn.className = 'btn btn-danger btn-sm'; rmBtn.textContent = 'Remove';
  rmBtn.addEventListener('click', function() { card.remove(); });
  header.appendChild(h4); header.appendChild(rmBtn);
  card.appendChild(header);

  if (description) {
    const desc = document.createElement('p'); desc.className = 'mcp-desc'; desc.textContent = description;
    card.appendChild(desc);
  }

  function makeField(labelText, className, val, placeholder) {
    const wrap = document.createElement('div'); wrap.style.flex = '1';
    const lbl = document.createElement('label'); lbl.textContent = labelText;
    const inp = document.createElement('input'); inp.type = 'text'; inp.className = className; inp.value = val || ''; inp.placeholder = placeholder || '';
    wrap.appendChild(lbl); wrap.appendChild(inp);
    return wrap;
  }

  const row1 = document.createElement('div'); row1.className = 'row';
  row1.appendChild(makeField('Name', 'mcp-name', name, 'server-name'));
  row1.appendChild(makeField('Command', 'mcp-cmd', cmd, 'npx'));
  card.appendChild(row1);

  const row2 = document.createElement('div'); row2.className = 'row'; row2.style.marginTop = '6px';
  row2.appendChild(makeField('Args (space-separated)', 'mcp-args', args, '@scope/package'));
  card.appendChild(row2);

  // Env vars section
  const envSection = document.createElement('div'); envSection.style.marginTop = '10px';
  const envLabel = document.createElement('label'); envLabel.textContent = 'Environment Variables';
  envSection.appendChild(envLabel);

  const envList = document.createElement('div'); envList.className = 'mcp-env-list';
  envSection.appendChild(envList);

  // Populate env vars
  if (envVars && typeof envVars === 'object') {
    const entries = Array.isArray(envVars) ? envVars : Object.entries(envVars).map(([k, v]) => ({ key: k, value: v }));
    for (const ev of entries) {
      addMcpEnvVar(envList, ev.key || '', ev.value || '', ev.hint || '');
    }
  }

  const addVarBtn = document.createElement('button'); addVarBtn.className = 'btn btn-sm'; addVarBtn.textContent = '+ Add Var'; addVarBtn.style.marginTop = '6px';
  addVarBtn.addEventListener('click', function() { addMcpEnvVar(envList, '', '', ''); });
  envSection.appendChild(addVarBtn);

  card.appendChild(envSection);
  ml.appendChild(card);

  // Update card title on name change
  const nameInp = card.querySelector('.mcp-name');
  nameInp.addEventListener('input', function() { h4.textContent = this.value || 'New Server'; });
}

function addMcpEnvVar(container, key, value, hint) {
  const row = document.createElement('div'); row.className = 'env-var-row';
  const kInp = document.createElement('input'); kInp.type = 'text'; kInp.placeholder = 'VAR_NAME'; kInp.value = key; kInp.style.flex = '1';
  const vInp = document.createElement('input'); vInp.type = 'text'; vInp.placeholder = hint || 'value'; vInp.value = value; vInp.style.flex = '1';
  const rmBtn = document.createElement('button'); rmBtn.className = 'btn btn-danger btn-sm'; rmBtn.textContent = 'X';
  rmBtn.addEventListener('click', function() { row.remove(); });
  row.appendChild(kInp); row.appendChild(vInp); row.appendChild(rmBtn);
  container.appendChild(row);
}

function addEnvRow(key, val) {
  const el = document.getElementById('env-list');
  const d = document.createElement('div'); d.className = 'env-row';
  const keyInp = document.createElement('input'); keyInp.type = 'text'; keyInp.className = 'env-key'; keyInp.placeholder = 'KEY'; keyInp.value = key || '';
  const valInp = document.createElement('input'); valInp.type = 'password'; valInp.className = 'env-val'; valInp.placeholder = 'value'; valInp.value = val || '';
  const eyeBtn = document.createElement('button'); eyeBtn.className = 'btn-icon'; eyeBtn.textContent = '\u{1F441}'; eyeBtn.title = 'Show/Hide'; eyeBtn.type = 'button'; eyeBtn.setAttribute('aria-label', 'Toggle password visibility');
  eyeBtn.addEventListener('click', function() { toggleEnvVisibility(this); });
  const rmBtn = document.createElement('button'); rmBtn.className = 'btn btn-danger btn-sm'; rmBtn.textContent = 'X';
  rmBtn.addEventListener('click', function() { this.parentElement.remove(); });
  d.appendChild(keyInp); d.appendChild(valInp); d.appendChild(eyeBtn); d.appendChild(rmBtn);
  el.appendChild(d);
}

function toggleEnvVisibility(btn) {
  const input = btn.parentElement.querySelector('.env-val');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '\u{1F512}';
    btn.title = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = '\u{1F441}';
    btn.title = 'Show';
  }
}

// Fix 7: saveConfig — merge nested objects, don't replace
async function saveConfig() {
  const cfg = (await api('GET', '/api/status')).config || {};
  cfg.execution_strategy = Object.assign({}, cfg.execution_strategy || {}, { mode: document.getElementById('cfg-strategy').value });
  cfg.provider = document.getElementById('cfg-provider').value;
  cfg.docker = Object.assign({}, cfg.docker || {}, { enabled: document.getElementById('cfg-docker').checked });
  cfg.kubernetes = Object.assign({}, cfg.kubernetes || {}, { enabled: document.getElementById('cfg-k8s').checked });
  const checks = document.querySelectorAll('#plugin-list input[data-plugin]');
  const plugins = {};
  checks.forEach(c => { plugins[c.dataset.plugin] = c.checked ? 'enabled' : 'disabled'; });
  if (Object.keys(plugins).length) cfg.plugins = plugins;
  await api('POST', '/api/config', cfg);
  toast('Config saved', true);
}

function collectMcpData() {
  const cards = document.querySelectorAll('.mcp-card');
  const servers = {};
  cards.forEach(c => {
    const name = c.querySelector('.mcp-name').value.trim();
    const cmd = c.querySelector('.mcp-cmd').value.trim();
    const args = c.querySelector('.mcp-args').value.trim().split(/\\s+/).filter(Boolean);
    if (!name || !cmd) return;
    const envRows = c.querySelectorAll('.env-var-row');
    const env = {};
    envRows.forEach(r => {
      const inputs = r.querySelectorAll('input');
      const k = inputs[0].value.trim();
      const v = inputs[1].value.trim();
      if (k) env[k] = v;
    });
    const entry = { command: cmd, args };
    if (Object.keys(env).length > 0) entry.env = env;
    servers[name] = entry;
  });
  return { mcpServers: servers };
}

async function saveMcp() {
  const data = collectMcpData();
  const preview = JSON.stringify(data, null, 2);
  const display = preview.length > 1000 ? preview.substring(0, 1000) + '\\n\\n... (truncated)' : preview;
  if (!confirm('Save MCP Config?\\n\\n' + display)) return;
  await api('POST', '/api/mcp', data);
  toast('MCP config saved', true);
}

function collectEnvData() {
  const rows = document.querySelectorAll('.env-row');
  const vars = {};
  rows.forEach(r => {
    const k = r.querySelector('.env-key').value.trim();
    const v = r.querySelector('.env-val').value;
    if (k) vars[k] = v;
  });
  return vars;
}

async function saveEnv() {
  const data = collectEnvData();
  const preview = Object.entries(data).map(([k,v]) => k + '=' + v).join('\\n');
  if (!confirm('Save .claude/.env?\\n\\n' + preview)) return;
  await api('POST', '/api/env', data);
  toast('.env saved', true);
}

function addMcpPreset(name) {
  const p = MCP_PRESETS[name];
  if (!p) return;
  // Check if already exists
  const existing = document.querySelectorAll('.mcp-card .mcp-name');
  for (const inp of existing) { if (inp.value === p.name) { toast(p.name + ' already added', false); return; } }
  addMcpCard(p.name, p.command, p.args, p.description, p.envVars);
}

function addEnvSuggestion(key, val, hint) {
  const existing = document.querySelectorAll('.env-key');
  for (const inp of existing) { if (inp.value === key) { toast(key + ' already exists', false); return; } }
  addEnvRow(key, val);
}

// Pause auto-refresh while user is editing MCP or env forms
let editingLock = false;
document.addEventListener('focusin', function(e) {
  if (e.target.closest('#mcp-list, #env-list, .mcp-entry, .env-row')) editingLock = true;
});
document.addEventListener('focusout', function(e) {
  if (e.target.closest('#mcp-list, #env-list, .mcp-entry, .env-row')) {
    setTimeout(function() {
      const active = document.activeElement;
      if (!active || !active.closest('#mcp-list, #env-list, .mcp-entry, .env-row')) editingLock = false;
    }, 200);
  }
});

async function refresh() {
  if (editingLock) return;
  try {
    const data = await api('GET', '/api/status');
    loadStatus(data);
    document.getElementById('connection-banner').style.display = 'none';
  } catch {
    document.getElementById('connection-banner').style.display = 'block';
  }
}

refresh();
setInterval(refresh, 10000);
</script>
</body>
</html>`;
}

// --- Helpers for safe JSON body parsing ---
async function parseJSONBody(req, res) {
  let raw;
  try { raw = await readBody(req); } catch (e) { return { err: json(res, 400, { error: e.message }) }; }
  let body;
  try { body = JSON.parse(raw); } catch { return { err: json(res, 400, { error: 'Invalid JSON syntax' }) }; }
  if (typeof body !== 'object' || body === null) return { err: json(res, 400, { error: 'Invalid JSON object' }) };
  return { body };
}

// --- Server ---
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);

  // Fix 13 + Fix 4: Auth check BEFORE resetIdle
  if (parsedUrl.pathname !== '/favicon.ico') {
    const authHeader = req.headers['authorization'] || '';
    const isHTML = parsedUrl.pathname === '/' || parsedUrl.pathname === '';

    if (isHTML) {
      // HTML route: accept token as query param
      const qToken = parsedUrl.searchParams.get('token');
      if (qToken !== token) {
        return json(res, 401, { error: 'Unauthorized — append ?token=<token> to URL' });
      }
    } else {
      if (authHeader !== `Bearer ${token}`) {
        return json(res, 401, { error: 'Unauthorized' });
      }
    }
  }

  // Fix 4: resetIdle only AFTER auth succeeds
  resetIdle();

  try {
    // Routes
    if (req.method === 'GET' && (parsedUrl.pathname === '/' || parsedUrl.pathname === '')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(renderHTML());
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/status') {
      return json(res, 200, getStatusData());
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/diagrams') {
      return json(res, 200, getDiagramsData());
    }

    // Save diagram content
    const diagramMatch = parsedUrl.pathname.match(/^\/api\/diagrams\/([a-zA-Z0-9_-]+)$/);
    if (req.method === 'POST' && diagramMatch) {
      const name = decodeURIComponent(diagramMatch[1]);
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) return json(res, 400, { error: 'Invalid diagram name' });
      const { body, err } = await parseJSONBody(req, res);
      if (err) return;
      const diagramsDir = path.join(basePath, '.claude', 'pm', 'diagrams');
      if (!fs.existsSync(diagramsDir)) fs.mkdirSync(diagramsDir, { recursive: true });
      fs.writeFileSync(path.join(diagramsDir, name + '.mmd'), body.content || '', 'utf8');
      // Update metadata timestamp if exists, or create
      const metaPath = path.join(diagramsDir, name + '.meta.json');
      let meta = {};
      try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch {}
      meta.name = meta.name || name;
      meta.updated = new Date().toISOString().replace(/\\.\\d{3}Z$/, 'Z');
      if (!meta.created) meta.created = meta.updated;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
      return json(res, 200, { ok: true });
    }

    const diagramDeleteMatch = parsedUrl.pathname.match(/^\/api\/diagrams\/([a-zA-Z0-9_-]+)$/);
    if (req.method === 'DELETE' && diagramDeleteMatch) {
      const name = decodeURIComponent(diagramDeleteMatch[1]);
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) return json(res, 400, { error: 'Invalid diagram name' });
      const diagramsDir = path.join(basePath, '.claude', 'pm', 'diagrams');
      const mmdPath = path.join(diagramsDir, name + '.mmd');
      const metaPath = path.join(diagramsDir, name + '.meta.json');
      try { fs.unlinkSync(mmdPath); } catch {}
      try { fs.unlinkSync(metaPath); } catch {}
      return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/tests') {
      return json(res, 200, getTestsData());
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/config') {
      const { body, err } = await parseJSONBody(req, res);
      if (err) return;
      writeJSON(configPath, body);
      return json(res, 200, { ok: true });
    }

    // Fix 1: /api/mcp — merge with existing, don't overwrite
    if (req.method === 'POST' && parsedUrl.pathname === '/api/mcp') {
      const { body, err } = await parseJSONBody(req, res);
      if (err) return;
      let current = {};
      try { current = JSON.parse(fs.readFileSync(mcpPath, 'utf8')); } catch {}
      const merged = { ...current, ...body };
      writeJSON(mcpPath, merged);
      return json(res, 200, { ok: true });
    }

    // /api/env — save env vars (UI sends real values, not masked)
    if (req.method === 'POST' && parsedUrl.pathname === '/api/env') {
      const { body, err } = await parseJSONBody(req, res);
      if (err) return;
      let existing = {};
      try {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
          const m = line.match(/^([^#=]+)=(.*)$/);
          if (m) existing[m[1].trim()] = m[2].trim();
        }
      } catch {}
      for (const [k, v] of Object.entries(body)) {
        existing[k] = v;
      }
      const envContent = Object.entries(existing).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
      const backup = envPath + '.backup';
      if (fs.existsSync(envPath)) fs.copyFileSync(envPath, backup);
      fs.writeFileSync(envPath, envContent, 'utf8');
      return json(res, 200, { ok: true });
    }

    json(res, 404, { error: 'Not found' });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const pidData = JSON.stringify({ pid: process.pid, port, token }, null, 2);

  if (!fs.existsSync(pmDir)) fs.mkdirSync(pmDir, { recursive: true });
  fs.writeFileSync(pidFile, pidData + '\n', 'utf8');

  resetIdle();

  const baseUrl = `http://127.0.0.1:${port}`;
  const authUrl = `${baseUrl}/?token=${token}`;
  console.log(`## Config Dashboard Server\n`);
  console.log(`URL:   ${authUrl}`);
  console.log(`Token: ${token}`);
  console.log(`PID:   ${process.pid}`);
  console.log(`State: ${pidFile}`);
  console.log(`\nAuto-shutdown: 5 min idle`);
  console.log(`Opening browser...`);

  try {
    const { execSync } = require('child_process');
    // Fix 6: Windows browser open + Fix 13: token in URL
    if (process.platform === 'darwin') execSync(`open "${authUrl}"`);
    else if (process.platform === 'win32') execSync(`cmd /c start "" "${authUrl}"`);
    else execSync(`xdg-open "${authUrl}"`);
  } catch {
    console.log(`Could not open browser. Open manually: ${authUrl}`);
  }
});

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('exit', cleanup);
