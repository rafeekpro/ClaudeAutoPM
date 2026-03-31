#!/usr/bin/env node
/**
 * PM Config — Show project configuration as structured markdown
 */

const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const configPath = path.join(basePath, '.claude', 'config.json');

try {
  if (!fs.existsSync(configPath)) {
    console.log('## Project Configuration\n\nNo config found at `.claude/config.json`. Run `/pm:init` first.');
    process.exit(0);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const lines = ['## Project Configuration\n'];

  // Main settings table
  lines.push('| Setting | Value |');
  lines.push('|---------|-------|');
  if (config.version) lines.push(`| Version | ${config.version} |`);
  if (config.installed) lines.push(`| Installed | ${config.installed} |`);
  if (config.execution_strategy) lines.push(`| Execution Strategy | ${config.execution_strategy.mode || 'default'} |`);
  if (config.docker) lines.push(`| Docker | ${config.features?.docker_first_development ? 'enabled' : 'disabled'} |`);
  if (config.kubernetes) lines.push(`| Kubernetes | ${config.kubernetes?.enabled ? 'enabled' : 'disabled'} |`);
  if (config.provider) lines.push(`| Provider | ${config.provider} |`);
  lines.push('');

  // Features
  if (config.features) {
    const entries = Object.entries(config.features);
    lines.push(`### Features (${entries.length})`);
    lines.push('| Feature | Status |');
    lines.push('|---------|--------|');
    for (const [k, v] of entries) {
      lines.push(`| ${k} | ${v ? 'enabled' : 'disabled'} |`);
    }
    lines.push('');
  }

  // Plugins — check for plugins field or scan packages
  const pluginsDir = path.join(basePath, 'packages');
  if (config.plugins) {
    const plugins = Array.isArray(config.plugins) ? config.plugins : Object.keys(config.plugins);
    lines.push(`### Installed Plugins (${plugins.length})`);
    lines.push('| Plugin | Status |');
    lines.push('|--------|--------|');
    for (const p of plugins) {
      const status = typeof config.plugins === 'object' && !Array.isArray(config.plugins) ? config.plugins[p] : 'installed';
      lines.push(`| ${typeof p === 'string' ? p : p.name || p} | ${status} |`);
    }
    lines.push('');
  } else if (fs.existsSync(pluginsDir)) {
    const pkgs = fs.readdirSync(pluginsDir).filter(d => {
      try { return fs.statSync(path.join(pluginsDir, d)).isDirectory(); } catch { return false; }
    });
    if (pkgs.length > 0) {
      lines.push(`### Packages (${pkgs.length})`);
      lines.push('| Package | Status |');
      lines.push('|---------|--------|');
      for (const p of pkgs) lines.push(`| ${p} | installed |`);
      lines.push('');
    }
  }

  console.log(lines.join('\n'));
} catch (e) {
  console.log(`## Project Configuration\n\nError reading config: ${e.message}`);
}
