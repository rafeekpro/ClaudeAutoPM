#!/usr/bin/env node
/**
 * AutoPM MCP Server
 *
 * Exposes PM data (issues, epics, PRDs, learnings, config) via Model Context Protocol.
 * Reuses local providers as backend — no data duplication.
 *
 * Usage:
 *   node .claude/scripts/mcp/autopm-server.js
 *
 * In .claude/mcp-servers.json:
 *   { "autopm": { "command": "node", "args": [".claude/scripts/mcp/autopm-server.js"] } }
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const settings = { basePath };

// Lazy-load providers to avoid errors when files don't exist
function loadProvider(name) {
  const providerPath = path.join(basePath, '.claude', 'providers', 'local', name + '.js');
  if (fs.existsSync(providerPath)) return require(providerPath);
  // Fallback to autopm path
  const autopmPath = path.join(__dirname, '..', '..', 'providers', 'local', name + '.js');
  if (fs.existsSync(autopmPath)) return require(autopmPath);
  return null;
}

function readFile(relativePath) {
  const fullPath = path.join(basePath, relativePath);
  if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf8');
  return null;
}

function readJSON(relativePath) {
  const content = readFile(relativePath);
  if (!content) return null;
  try { return JSON.parse(content); } catch { return null; }
}

// ── Server Setup ──

const server = new Server(
  { name: 'autopm', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);

// ── Tools ──

const TOOLS = [
  { name: 'autopm_list_issues', description: 'List local issues with optional status filter', inputSchema: { type: 'object', properties: { status: { type: 'string', description: 'Filter: open, in_progress, closed' } } } },
  { name: 'autopm_show_issue', description: 'Show issue details by ID', inputSchema: { type: 'object', properties: { id: { type: 'number', description: 'Issue number' } }, required: ['id'] } },
  { name: 'autopm_create_issue', description: 'Create a new local issue', inputSchema: { type: 'object', properties: { title: { type: 'string' }, labels: { type: 'array', items: { type: 'string' } }, body: { type: 'string' } }, required: ['title'] } },
  { name: 'autopm_start_issue', description: 'Start working on an issue (set in_progress)', inputSchema: { type: 'object', properties: { id: { type: 'number' }, no_branch: { type: 'boolean' } }, required: ['id'] } },
  { name: 'autopm_close_issue', description: 'Close an issue', inputSchema: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] } },
  { name: 'autopm_list_epics', description: 'List epics with progress', inputSchema: { type: 'object', properties: { status: { type: 'string' } } } },
  { name: 'autopm_show_epic', description: 'Show epic with tasks', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'autopm_list_prds', description: 'List PRDs', inputSchema: { type: 'object', properties: { status: { type: 'string' } } } },
  { name: 'autopm_show_prd', description: 'Show PRD details', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'autopm_status', description: 'Project overview — counts, recent activity', inputSchema: { type: 'object', properties: {} } },
  { name: 'autopm_learn', description: 'Save a project learning', inputSchema: { type: 'object', properties: { learning: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['learning'] } },
  { name: 'autopm_recall', description: 'Get project learnings', inputSchema: { type: 'object', properties: { tag: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'autopm_checkpoint', description: 'Create a project checkpoint', inputSchema: { type: 'object', properties: { description: { type: 'string' } }, required: ['description'] } }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'autopm_list_issues': {
        const provider = loadProvider('issue-list');
        if (!provider) return text('Issue list provider not available');
        const result = await provider.execute(args || {}, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_show_issue': {
        const provider = loadProvider('issue-show');
        if (!provider) return text('Issue show provider not available');
        const result = await provider.execute(args, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_create_issue': {
        const provider = loadProvider('issue-create');
        if (!provider) return text('Issue create provider not available');
        const result = await provider.execute(args, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_start_issue': {
        const provider = loadProvider('issue-start');
        if (!provider) return text('Issue start provider not available');
        const result = await provider.execute(args, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_close_issue': {
        const provider = loadProvider('issue-close');
        if (!provider) return text('Issue close provider not available');
        const result = await provider.execute(args, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_list_epics': {
        const provider = loadProvider('epic-list');
        if (!provider) return text('Epic list provider not available');
        const result = await provider.execute(args || {}, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_show_epic': {
        const provider = loadProvider('epic-show');
        if (!provider) return text('Epic show provider not available');
        const result = await provider.execute(args, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_list_prds': {
        const provider = loadProvider('prd-list');
        if (!provider) return text('PRD list provider not available');
        const result = await provider.execute(args || {}, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_show_prd': {
        const provider = loadProvider('prd-show');
        if (!provider) return text('PRD show provider not available');
        const result = await provider.execute(args, settings);
        return text(JSON.stringify(result, null, 2));
      }
      case 'autopm_status': {
        const issues = loadProvider('issue-list');
        const epics = loadProvider('epic-list');
        const prds = loadProvider('prd-list');
        const status = {
          issues: issues ? await issues.execute({}, settings) : { count: 0 },
          epics: epics ? await epics.execute({}, settings) : { count: 0 },
          prds: prds ? await prds.execute({}, settings) : { count: 0 }
        };
        // Add recent events
        try {
          const loggerPath = path.join(basePath, '.claude', 'lib', 'event-logger');
          const { readEvents } = require(loggerPath);
          status.recentEvents = readEvents(10, null, basePath);
        } catch { status.recentEvents = []; }
        return text(JSON.stringify(status, null, 2));
      }
      case 'autopm_learn': {
        try {
          const learningsPath = path.join(basePath, '.claude', 'pm', 'learnings.jsonl');
          const dir = path.dirname(learningsPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const entry = { timestamp: new Date().toISOString(), type: 'learning', learning: args.learning, tags: args.tags || [] };
          fs.appendFileSync(learningsPath, JSON.stringify(entry) + '\n');
          try {
            const loggerPath = path.join(basePath, '.claude', 'lib', 'event-logger');
            const { logEvent } = require(loggerPath);
            logEvent('learning.saved', { learning: args.learning, tags: args.tags || [] }, basePath);
          } catch { /* best effort */ }
          return text(JSON.stringify({ success: true, learning: args.learning }));
        } catch (e) { return text(JSON.stringify({ error: e.message })); }
      }
      case 'autopm_recall': {
        const learningsPath = path.join(basePath, '.claude', 'pm', 'learnings.jsonl');
        if (!fs.existsSync(learningsPath)) return text(JSON.stringify({ learnings: [] }));
        let entries = fs.readFileSync(learningsPath, 'utf8').trim().split('\n')
          .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        if (args && args.tag) entries = entries.filter(e => (e.tags || []).includes(args.tag));
        const limit = (args && args.limit) || 20;
        return text(JSON.stringify({ learnings: entries.slice(-limit).reverse() }));
      }
      case 'autopm_checkpoint': {
        try {
          const { execSync } = require('child_process');
          const cpDir = path.join(basePath, '.claude', 'pm', 'checkpoints');
          if (!fs.existsSync(cpDir)) fs.mkdirSync(cpDir, { recursive: true });
          const now = new Date().toISOString();
          let gitInfo = {};
          try {
            gitInfo.branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: basePath }).trim();
            gitInfo.hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: basePath }).trim();
            gitInfo.clean = !execSync('git status --porcelain', { encoding: 'utf8', cwd: basePath }).trim();
          } catch { /* not a git repo */ }
          // Count PM artifacts to match CLI checkpoint format
          const counts = {};
          for (const [key, dir] of [['issues', 'issues'], ['epics', 'epics'], ['prds', 'prds']]) {
            const d = path.join(basePath, '.claude', dir);
            try { counts[key] = fs.readdirSync(d).filter(f => f.endsWith('.md')).length; } catch { counts[key] = 0; }
          }
          // Load recent learnings
          let learnings = [];
          try {
            const lPath = path.join(basePath, '.claude', 'pm', 'learnings.jsonl');
            if (fs.existsSync(lPath)) {
              learnings = fs.readFileSync(lPath, 'utf8').trim().split('\n')
                .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).slice(-5);
            }
          } catch { /* ignore */ }
          const checkpoint = { timestamp: now, description: args.description, git: gitInfo, counts, learnings, config_snapshot: null };
          fs.writeFileSync(path.join(cpDir, now.replace(/[:.]/g, '-') + '.json'), JSON.stringify(checkpoint, null, 2));
          return text(JSON.stringify({ success: true, checkpoint }));
        } catch (e) { return text(JSON.stringify({ error: e.message })); }
      }
      default:
        return text(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return text(JSON.stringify({ error: e.message }));
  }
});

// ── Resources ──

const RESOURCES = [
  { uri: 'autopm://config', name: 'Project Config', description: 'Current .claude/config.json', mimeType: 'application/json' },
  { uri: 'autopm://agents', name: 'Agent Registry', description: 'Loaded agents from agent-registry.xml', mimeType: 'text/xml' },
  { uri: 'autopm://events', name: 'Recent Events', description: 'Last 50 events from events.jsonl', mimeType: 'application/json' },
  { uri: 'autopm://learnings', name: 'Project Learnings', description: 'All learnings from learnings.jsonl', mimeType: 'application/json' },
  { uri: 'autopm://test-plan', name: 'Test Plan', description: 'Current test plan', mimeType: 'text/markdown' }
];

server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: RESOURCES }));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'autopm://config':
      return resource(uri, readFile('.claude/config.json') || '{}', 'application/json');
    case 'autopm://agents':
      return resource(uri, readFile('.claude/agents/agent-registry.xml') || '<agent-registry/>', 'text/xml');
    case 'autopm://events': {
      try {
        const loggerPath = path.join(basePath, '.claude', 'lib', 'event-logger');
        const { readEvents } = require(loggerPath);
        return resource(uri, JSON.stringify(readEvents(50, null, basePath), null, 2), 'application/json');
      } catch { return resource(uri, '[]', 'application/json'); }
    }
    case 'autopm://learnings': {
      const content = readFile('.claude/pm/learnings.jsonl');
      if (!content) return resource(uri, '[]', 'application/json');
      const entries = content.trim().split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      return resource(uri, JSON.stringify(entries, null, 2), 'application/json');
    }
    case 'autopm://test-plan':
      return resource(uri, readFile('.claude/pm/test-plan.md') || 'No test plan. Run /pm:test-plan to generate.', 'text/markdown');
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// ── Prompts ──

const PROMPTS = [
  { name: 'autopm_issue_template', description: 'Template for creating a new issue' },
  { name: 'autopm_prd_template', description: 'Template for creating a new PRD' },
  { name: 'autopm_epic_template', description: 'Template for creating a new epic' }
];

server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: PROMPTS }));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;

  try {
    const templateReaderPath = path.join(basePath, '.claude', 'lib', 'template-reader');
    const { readTemplate, generateMarkdown, resolveTemplatePath } = require(templateReaderPath);

    const templateMap = {
      autopm_issue_template: 'issue.xml',
      autopm_prd_template: 'prd.xml',
      autopm_epic_template: 'epic.xml'
    };

    const templateFile = templateMap[name];
    if (!templateFile) throw new Error(`Unknown prompt: ${name}`);

    const templatePath = resolveTemplatePath(templateFile, basePath);
    const template = readTemplate(templatePath);
    const markdown = generateMarkdown(template, {});

    return {
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: `Use this template to create a new ${templateFile.replace('.xml', '')}:\n\n${markdown}` }]
      }]
    };
  } catch (e) {
    return {
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: `Template not available: ${e.message}. Run autopm install first.` }]
      }]
    };
  }
});

// ── Helpers ──

function text(content) {
  return { content: [{ type: 'text', text: content }] };
}

function resource(uri, content, mimeType) {
  return { contents: [{ uri, text: content, mimeType }] };
}

// ── Start ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AutoPM MCP Server running on stdio');
}

main().catch(console.error);
