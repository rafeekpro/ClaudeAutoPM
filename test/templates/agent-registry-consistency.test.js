const fs = require('fs');
const path = require('path');

const AUTOPM_DIR = path.join(__dirname, '..', '..', 'autopm', '.claude', 'agents');
const REGISTRY_XML = path.join(AUTOPM_DIR, 'agent-registry.xml');
const REGISTRY_MD = path.join(AUTOPM_DIR, 'AGENT-REGISTRY.md');

function parseXmlAgents(xmlContent) {
  const agents = [];
  const agentRegex = /<agent\s+name="([^"]+)"\s+path="([^"]+)"[^>]*>/g;
  let match;
  while ((match = agentRegex.exec(xmlContent)) !== null) {
    agents.push({ name: match[1], path: match[2] });
  }
  return agents;
}

function parseMdAgents(mdContent) {
  const agents = [];
  const lines = mdContent.split('\n');
  let currentName = null;
  for (const line of lines) {
    const nameMatch = line.match(/^### (.+)$/);
    if (nameMatch) {
      currentName = nameMatch[1].trim();
    }
    const locationMatch = line.match(/\*\*Location\*\*:\s*`([^`]+)`/);
    if (locationMatch && currentName) {
      agents.push({ name: currentName, path: locationMatch[1].replace(/^\.claude\//, '') });
      currentName = null;
    }
  }
  return agents;
}

describe('Agent Registry Consistency', () => {
  let xmlContent;
  let mdContent;
  let xmlAgents;
  let mdAgents;

  beforeAll(() => {
    if (!fs.existsSync(REGISTRY_XML)) {
      throw new Error(`agent-registry.xml not found at ${REGISTRY_XML}`);
    }
    if (!fs.existsSync(REGISTRY_MD)) {
      throw new Error(`AGENT-REGISTRY.md not found at ${REGISTRY_MD}`);
    }
    xmlContent = fs.readFileSync(REGISTRY_XML, 'utf8');
    mdContent = fs.readFileSync(REGISTRY_MD, 'utf8');
    xmlAgents = parseXmlAgents(xmlContent);
    mdAgents = parseMdAgents(mdContent);
  });

  test('agent-registry.xml exists and is non-empty', () => {
    expect(fs.existsSync(REGISTRY_XML)).toBe(true);
    expect(xmlAgents.length).toBeGreaterThan(0);
  });

  test('AGENT-REGISTRY.md exists and is non-empty', () => {
    expect(fs.existsSync(REGISTRY_MD)).toBe(true);
    expect(mdAgents.length).toBeGreaterThan(0);
  });

  test('XML registry has all agents from MD registry', () => {
    const xmlNames = new Set(xmlAgents.map(a => a.name));
    const mdAgentNames = mdAgents.filter(a => !a.path.includes('decision-matrices'));

    for (const agent of mdAgentNames) {
      expect(xmlNames).toContain(agent.name);
    }
  });

  test('every agent in XML registry has a .md file on disk', () => {
    const missing = [];
    for (const agent of xmlAgents) {
      const filePath = path.join(AUTOPM_DIR, '..', agent.path);
      if (!fs.existsSync(filePath)) {
        missing.push(`${agent.name} -> ${agent.path}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('every agent .md file has required frontmatter fields', () => {
    const errors = [];
    for (const agent of xmlAgents) {
      const filePath = path.join(AUTOPM_DIR, '..', agent.path);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (!fmMatch) {
        errors.push(`${agent.name}: missing frontmatter`);
        continue;
      }

      const fm = fmMatch[1];
      if (!fm.includes('name:')) errors.push(`${agent.name}: missing 'name' in frontmatter`);
      if (!fm.includes('category:')) errors.push(`${agent.name}: missing 'category' in frontmatter`);
      if (!fm.includes('tools:')) errors.push(`${agent.name}: missing 'tools' in frontmatter`);
    }
    expect(errors).toEqual([]);
  });

  test('every agent .md file has required sections', () => {
    const errors = [];
    const requiredSections = ['## Scope', '## NOT For', '## Context7 Queries', '## Key Patterns'];

    for (const agent of xmlAgents) {
      const filePath = path.join(AUTOPM_DIR, '..', agent.path);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      for (const section of requiredSections) {
        if (!content.includes(section)) {
          errors.push(`${agent.name}: missing '${section}'`);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test('no orphaned agent files (every .md file is in registry)', () => {
    const registeredPaths = new Set(xmlAgents.map(a => a.path));

    const orphaned = [];
    const categories = ['core', 'frameworks', 'languages', 'cloud', 'devops', 'databases', 'data', 'testing', 'integration'];

    for (const cat of categories) {
      const catDir = path.join(AUTOPM_DIR, cat);
      if (!fs.existsSync(catDir)) continue;

      const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md') && f !== 'README.md');
      for (const file of files) {
        const relativePath = `agents/${cat}/${file}`;
        if (!registeredPaths.has(relativePath)) {
          orphaned.push(relativePath);
        }
      }
    }
    expect(orphaned).toEqual([]);
  });

  test('XML and MD registries have matching agent counts (excluding decision matrices)', () => {
    const mdAgentCount = mdAgents.filter(a => !a.path.includes('decision-matrices')).length;
    expect(xmlAgents.length).toBe(mdAgentCount);
  });

  test('agent paths in XML use consistent format (agents/category/name.md)', () => {
    const errors = [];
    for (const agent of xmlAgents) {
      if (!agent.path.match(/^agents\/[a-z-]+\/[a-z0-9-]+\.md$/)) {
        errors.push(`${agent.name}: invalid path format '${agent.path}'`);
      }
    }
    expect(errors).toEqual([]);
  });

  test('no duplicate agent names in XML registry', () => {
    const names = xmlAgents.map(a => a.name);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
    expect(duplicates).toEqual([]);
  });

  test('no duplicate agent paths in XML registry', () => {
    const paths = xmlAgents.map(a => a.path);
    const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(duplicates).toEqual([]);
  });
});
