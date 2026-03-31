#!/usr/bin/env node
/**
 * PM Agents — List registered agents grouped by category
 */

const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const registryPath = path.join(basePath, '.claude', 'agents', 'agent-registry.xml');

function parseAgents(xml) {
  const groups = [];
  const categoryRe = /<agents\s+category="([^"]+)">([\s\S]*?)<\/agents>/g;
  const agentRe = /<agent\s+name="([^"]+)"\s+path="([^"]+)">([\s\S]*?)<\/agent>/g;
  let cm;
  while ((cm = categoryRe.exec(xml)) !== null) {
    const category = cm[1];
    const block = cm[2];
    const agents = [];
    let am;
    while ((am = agentRe.exec(block)) !== null) {
      agents.push({ name: am[1], path: am[2], description: am[3].trim() });
    }
    if (agents.length > 0) groups.push({ category, agents });
  }
  return groups;
}

try {
  if (!fs.existsSync(registryPath)) {
    console.log('## Loaded Agents\n\nNo agent registry found at `.claude/agents/agent-registry.xml`');
    process.exit(0);
  }

  const xml = fs.readFileSync(registryPath, 'utf8');
  const groups = parseAgents(xml);

  let coreCount = 0;
  let pluginCount = 0;
  const lines = ['## Loaded Agents\n'];

  for (const g of groups) {
    const isCore = g.category === 'core';
    const label = isCore ? 'Core (always available)' : `Plugin: ${g.category} (${g.agents.length} agents)`;
    lines.push(`### ${label}`);
    lines.push('| Agent | Description |');
    lines.push('|-------|-------------|');
    for (const a of g.agents) {
      lines.push(`| ${a.name} | ${a.description} |`);
    }
    lines.push('');
    if (isCore) coreCount += g.agents.length;
    else pluginCount += g.agents.length;
  }

  lines.push(`Total: ${coreCount} core + ${pluginCount} plugin = ${coreCount + pluginCount} agents`);
  console.log(lines.join('\n'));
} catch (e) {
  console.log(`## Loaded Agents\n\nError reading agent registry: ${e.message}`);
}
