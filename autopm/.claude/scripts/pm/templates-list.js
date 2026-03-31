#!/usr/bin/env node
/**
 * PM Templates — List available XML templates and issue decomposition templates
 */

const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const templatesDir = path.join(basePath, '.claude', 'templates');
const decompDir = path.join(templatesDir, 'issue-decomposition');

function parseXmlTemplate(content) {
  const idMatch = content.match(/<template\s+id="([^"]+)"/);
  const id = idMatch ? idMatch[1] : 'unknown';

  const sections = [];
  const sectionRe = /<section\s+name="([^"]+)"[^>]*>/g;
  let m;
  while ((m = sectionRe.exec(content)) !== null) sections.push(m[1]);

  const fields = [];
  const fieldRe = /<field\s+name="([^"]+)"[^>]*required="true"[^>]*\/>/g;
  while ((m = fieldRe.exec(content)) !== null) fields.push(m[1]);
  // Also catch required before name
  const fieldRe2 = /<field[^>]*required="true"[^>]*name="([^"]+)"[^>]*\/>/g;
  while ((m = fieldRe2.exec(content)) !== null) {
    if (!fields.includes(m[1])) fields.push(m[1]);
  }

  return { id, sections, fields };
}

function parseYamlTemplate(content) {
  const nameMatch = content.match(/^name:\s*"?([^"\n]+)"?/m);
  const name = nameMatch ? nameMatch[1].trim() : 'unknown';

  // Collect streams only from within streams: block
  const streams = [];
  const contentLines = content.split(/\r?\n/);
  let inStreams = false;
  for (const line of contentLines) {
    if (!inStreams) {
      if (/^streams:\s*$/.test(line)) inStreams = true;
      continue;
    }
    if (/^[^\s]/.test(line)) break; // left streams block
    const m = /^ {2}(\w+):\s*$/.exec(line);
    if (m) streams.push(m[1]);
  }

  const agents = new Set();
  const agentRe = /agent:\s*"?([^"\n]+)"?/g;
  while ((m = agentRe.exec(content)) !== null) agents.add(m[1].trim());

  return { name, streamCount: streams.length, agents: [...agents] };
}

try {
  const lines = ['## Available Templates\n'];

  // XML Templates
  const xmlFiles = fs.existsSync(templatesDir)
    ? fs.readdirSync(templatesDir).filter(f => f.endsWith('.xml'))
    : [];

  if (xmlFiles.length > 0) {
    lines.push('### XML Templates');
    lines.push('| Template | Sections | Required Fields |');
    lines.push('|----------|----------|-----------------|');
    for (const f of xmlFiles) {
      const content = fs.readFileSync(path.join(templatesDir, f), 'utf8');
      const t = parseXmlTemplate(content);
      lines.push(`| ${f} | ${t.sections.join(', ')} | ${t.fields.join(', ') || 'none'} |`);
    }
    lines.push('');
  } else {
    lines.push('### XML Templates\n\nNo XML templates found.\n');
  }

  // Issue Decomposition Templates
  const yamlFiles = fs.existsSync(decompDir)
    ? fs.readdirSync(decompDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    : [];

  if (yamlFiles.length > 0) {
    lines.push('### Issue Decomposition Templates');
    lines.push('| Template | Streams | Agents |');
    lines.push('|----------|---------|--------|');
    for (const f of yamlFiles) {
      const content = fs.readFileSync(path.join(decompDir, f), 'utf8');
      const t = parseYamlTemplate(content);
      lines.push(`| ${f} | ${t.streamCount} | ${t.agents.join(', ')} |`);
    }
    lines.push('');
  } else {
    lines.push('### Issue Decomposition Templates\n\nNo decomposition templates found.\n');
  }

  lines.push(`Total: ${xmlFiles.length} XML + ${yamlFiles.length} decomposition = ${xmlFiles.length + yamlFiles.length} templates`);
  console.log(lines.join('\n'));
} catch (e) {
  console.log(`## Available Templates\n\nError reading templates: ${e.message}`);
}
