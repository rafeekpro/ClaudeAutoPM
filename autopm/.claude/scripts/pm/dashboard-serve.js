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
  return { config, mcp, plugins, env: Object.keys(env), events };
}

// --- HTML ---
function renderHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AutoPM Config Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { color: #58a6ff; margin-bottom: 4px; }
  .subtitle { color: #8b949e; margin-bottom: 24px; font-size: 13px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .card h2 { color: #58a6ff; font-size: 14px; text-transform: uppercase; margin-bottom: 14px; }
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
  .env-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
  .env-row input { flex: 1; }
  .env-row .eye { cursor: pointer; color: #8b949e; font-size: 16px; user-select: none; width: 30px; text-align: center; }
  .plugin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
  .plugin-item { display: flex; align-items: center; gap: 8px; background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 8px 12px; font-size: 13px; }
  .plugin-item input { width: 16px; height: 16px; accent-color: #238636; }
  .events { max-height: 200px; overflow-y: auto; }
  .event { padding: 5px 0; border-bottom: 1px solid #21262d; font-size: 12px; }
  .event-type { color: #58a6ff; }
  .event-time { color: #484f58; }
  .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; font-size: 13px; color: #fff; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 999; }
  .toast.show { opacity: 1; }
  .toast.ok { background: #238636; }
  .toast.err { background: #da3633; }
  footer { margin-top: 24px; text-align: center; color: #484f58; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <h1>AutoPM Config Dashboard</h1>
  <p class="subtitle">Interactive configuration editor &mdash; changes save to disk</p>

  <!-- Config Section -->
  <div class="card" id="config-section">
    <h2>Configuration</h2>
    <div class="row">
      <div>
        <label>Execution Strategy</label>
        <select id="cfg-strategy">
          <option value="sequential">sequential</option>
          <option value="parallel">parallel</option>
          <option value="adaptive">adaptive</option>
        </select>
      </div>
      <div>
        <label>Provider</label>
        <select id="cfg-provider">
          <option value="github">github</option>
          <option value="azure">azure</option>
          <option value="local">local</option>
        </select>
      </div>
    </div>
    <div class="toggle-row">
      <label class="toggle"><input type="checkbox" id="cfg-docker"><span class="slider"></span></label>
      <span class="toggle-label">Docker</span>
    </div>
    <div class="toggle-row">
      <label class="toggle"><input type="checkbox" id="cfg-k8s"><span class="slider"></span></label>
      <span class="toggle-label">Kubernetes</span>
    </div>
    <button class="btn" onclick="saveConfig()">Save Config</button>
  </div>

  <!-- Plugins Section -->
  <div class="card" id="plugins-section">
    <h2>Plugins</h2>
    <div class="plugin-grid" id="plugin-list"></div>
    <p id="no-plugins" style="color:#8b949e;font-size:13px;display:none">No plugins found in packages/</p>
  </div>

  <!-- MCP Servers Section -->
  <div class="card" id="mcp-section">
    <h2>MCP Servers</h2>
    <div id="mcp-list"></div>
    <button class="btn" style="margin-right:8px" onclick="addMcpEntry()">+ Add Server</button>
    <button class="btn" onclick="saveMcp()">Save MCP Config</button>
  </div>

  <!-- API Keys Section -->
  <div class="card" id="env-section">
    <h2>API Keys / Environment</h2>
    <div id="env-list"></div>
    <button class="btn" style="margin-right:8px" onclick="addEnvRow()">+ Add Variable</button>
    <button class="btn" onclick="saveEnv()">Save .env</button>
  </div>

  <!-- Recent Events -->
  <div class="card">
    <h2>Recent Events</h2>
    <div class="events" id="events-list"></div>
  </div>

  <footer>AutoPM Config Dashboard &mdash; localhost only &mdash; auto-shutdown after 5 min idle</footer>
</div>

<div class="toast" id="toast"></div>

<script>
const TOKEN = '${token}';
const headers = { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };

// Fix 3: client-side XSS escaping
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

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
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.plugin = p; cb.checked = enabledSet.has(p);
      const sp = document.createElement('span'); sp.textContent = p;
      d.appendChild(cb); d.appendChild(sp);
      pl.appendChild(d);
    });
  }

  // MCP
  const ml = document.getElementById('mcp-list');
  ml.innerHTML = '';
  const servers = data.mcp?.mcpServers || {};
  for (const [name, srv] of Object.entries(servers)) {
    addMcpEntry(name, srv.command || '', (srv.args || []).join(' '));
  }

  // Env
  const el = document.getElementById('env-list');
  el.innerHTML = '';
  (data.env || []).forEach(k => addEnvRow(k, '********'));

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
}

// Fix 12: addMcpEntry — use DOM APIs not innerHTML
function addMcpEntry(name, cmd, args) {
  const ml = document.getElementById('mcp-list');
  const d = document.createElement('div'); d.className = 'mcp-entry';

  function makeField(labelText, className, val) {
    const wrap = document.createElement('div');
    const lbl = document.createElement('label'); lbl.textContent = labelText;
    const inp = document.createElement('input'); inp.type = 'text'; inp.className = className; inp.value = val || '';
    wrap.appendChild(lbl); wrap.appendChild(inp);
    return wrap;
  }

  const row1 = document.createElement('div'); row1.className = 'row';
  row1.appendChild(makeField('Name', 'mcp-name', name));
  row1.appendChild(makeField('Command', 'mcp-cmd', cmd));

  const row2 = document.createElement('div'); row2.className = 'row';
  row2.appendChild(makeField('Args (space-separated)', 'mcp-args', args));
  const btnWrap = document.createElement('div'); btnWrap.style.display = 'flex'; btnWrap.style.alignItems = 'end';
  const rmBtn = document.createElement('button'); rmBtn.className = 'btn btn-danger btn-sm'; rmBtn.textContent = 'Remove';
  rmBtn.addEventListener('click', function() { this.closest('.mcp-entry').remove(); });
  btnWrap.appendChild(rmBtn);
  row2.appendChild(btnWrap);

  d.appendChild(row1); d.appendChild(row2);
  ml.appendChild(d);
}

function addEnvRow(key, val) {
  const el = document.getElementById('env-list');
  const d = document.createElement('div'); d.className = 'env-row';
  const keyInp = document.createElement('input'); keyInp.type = 'text'; keyInp.className = 'env-key'; keyInp.placeholder = 'KEY'; keyInp.value = key || '';
  const valInp = document.createElement('input'); valInp.type = 'password'; valInp.className = 'env-val'; valInp.placeholder = 'value'; valInp.value = val || '';
  const eye = document.createElement('span'); eye.className = 'eye'; eye.innerHTML = '&#128065;';
  eye.addEventListener('click', function() { toggleVis(this); });
  const rmBtn = document.createElement('button'); rmBtn.className = 'btn btn-danger btn-sm'; rmBtn.textContent = 'X';
  rmBtn.addEventListener('click', function() { this.parentElement.remove(); });
  d.appendChild(keyInp); d.appendChild(valInp); d.appendChild(eye); d.appendChild(rmBtn);
  el.appendChild(d);
}

function toggleVis(el) {
  const inp = el.previousElementSibling;
  inp.type = inp.type === 'password' ? 'text' : 'password';
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

async function saveMcp() {
  const entries = document.querySelectorAll('.mcp-entry');
  const servers = {};
  entries.forEach(e => {
    const name = e.querySelector('.mcp-name').value.trim();
    const cmd = e.querySelector('.mcp-cmd').value.trim();
    const args = e.querySelector('.mcp-args').value.trim().split(/\\s+/).filter(Boolean);
    if (name && cmd) servers[name] = { command: cmd, args };
  });
  await api('POST', '/api/mcp', { mcpServers: servers });
  toast('MCP config saved', true);
}

// Fix 11: saveEnv — send all values (server-side merge handles placeholders)
async function saveEnv() {
  const rows = document.querySelectorAll('.env-row');
  const vars = {};
  rows.forEach(r => {
    const k = r.querySelector('.env-key').value.trim();
    const v = r.querySelector('.env-val').value;
    if (k) vars[k] = v;
  });
  await api('POST', '/api/env', vars);
  toast('.env saved', true);
}

async function refresh() {
  try {
    const data = await api('GET', '/api/status');
    loadStatus(data);
  } catch {}
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

    // Fix 2: /api/env — merge with existing, skip placeholders
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
        if (v !== '********') existing[k] = v;
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
