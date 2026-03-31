#!/usr/bin/env node
/**
 * PM MCP Status — List configured MCP servers
 */

const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const mcpPath = path.join(basePath, '.claude', 'mcp-servers.json');

try {
  if (!fs.existsSync(mcpPath)) {
    console.log('## MCP Servers\n\nNo MCP config found at `.claude/mcp-servers.json`.');
    process.exit(0);
  }

  const raw = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  const servers = raw.mcpServers || raw;
  const entries = Object.entries(servers).filter(([_, v]) => v && typeof v === 'object');
  const lines = ['## MCP Servers\n'];

  if (entries.length === 0) {
    lines.push('No MCP servers configured.\n');
    lines.push('Context7: not configured');
  } else {
    lines.push('| Server | Command | Status |');
    lines.push('|--------|---------|--------|');
    let hasContext7 = null;
    for (const [name, cfg] of entries) {
      const cmd = cfg.command
        ? `${cfg.command}${cfg.args ? ' ' + (Array.isArray(cfg.args) ? cfg.args.join(' ') : cfg.args) : ''}`
        : 'n/a';
      const status = cfg.disabled ? 'disabled' : 'configured';
      lines.push(`| ${name} | ${cmd} | ${status} |`);
      if (name.toLowerCase().includes('context7')) {
        hasContext7 = cfg.disabled ? 'disabled' : 'configured';
      }
    }
    lines.push('');
    lines.push(`Context7: ${hasContext7 || 'not configured'}`);
    lines.push(`Total: ${entries.length} servers configured`);
  }

  console.log(lines.join('\n'));
} catch (e) {
  console.log(`## MCP Servers\n\nError reading MCP config: ${e.message}`);
}
