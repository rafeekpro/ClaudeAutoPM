#!/usr/bin/env node

/**
 * Unified Context7 Enforcement Hook
 *
 * Handles both command (/pm:epic-decompose) and agent (@aws-cloud-architect) invocations.
 * Extracts Documentation Queries from the corresponding .md file and enforces Context7 usage.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse invocation to determine type and extract metadata
 * @param {string} invocation - e.g., "/pm:epic-decompose feature-name" or "@aws-cloud-architect design VPC"
 * @returns {object} { type, name, category, command, task, args }
 */
function parseInvocation(invocation) {
  if (invocation.startsWith('/')) {
    const cleaned = invocation.replace(/^\//, '');
    const [categoryCommand, ...args] = cleaned.split(/\s+/);
    const [category, command] = categoryCommand.split(':');
    return {
      type: 'command',
      category: category || 'pm',
      command: command || categoryCommand,
      args,
      fullName: categoryCommand
    };
  } else if (invocation.startsWith('@')) {
    const cleaned = invocation.replace(/^@/, '');
    const parts = cleaned.split(/\s+/);
    return {
      type: 'agent',
      name: parts[0],
      task: parts.slice(1).join(' '),
      fullName: parts[0]
    };
  }
  return null;
}

/**
 * Find command file in .claude/commands/
 */
function findCommandFile(category, command) {
  const baseDir = path.join(process.cwd(), '.claude', 'commands');

  const candidates = [
    path.join(baseDir, category, `${command}.md`),
    path.join(baseDir, category, `${command.replace(/-/g, '_')}.md`)
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Find agent file in .claude/agents/ (recursive)
 */
function findAgentFile(agentName) {
  const baseDir = path.join(process.cwd(), '.claude', 'agents');

  function searchDir(dir) {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = searchDir(fullPath);
        if (found) return found;
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const basename = path.basename(entry.name, '.md');
        if (basename === agentName || basename.replace(/-/g, '_') === agentName) {
          return fullPath;
        }
      }
    }
    return null;
  }

  return searchDir(baseDir);
}

/**
 * Extract Documentation Queries from a .md file
 */
function extractDocumentationQueries(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const queries = [];

  const querySection = content.match(/\*\*Documentation Queries:\*\*\s*\n([\s\S]*?)(?=\n\n|\*\*Why This is Required|\*\*|##|$)/);
  if (!querySection) return queries;

  const lines = querySection[1].split('\n');
  for (const line of lines) {
    const match = line.match(/`(mcp:\/\/context7\/[^`]+)`\s*-\s*(.+)/);
    if (match) {
      queries.push({ url: match[1], description: match[2].trim() });
    }
  }
  return queries;
}

/**
 * Main hook execution
 */
async function main(invocation) {
  const parsed = parseInvocation(invocation || process.argv.slice(2).join(' ') || '');
  if (!parsed) {
    process.exit(0);
  }

  console.log('\nContext7 Enforcement Active\n');

  let targetFile;
  if (parsed.type === 'command') {
    console.log(`Command: /${parsed.fullName}`);
    targetFile = findCommandFile(parsed.category, parsed.command);
    if (!targetFile) {
      console.log(`Warning: Command file not found for /${parsed.fullName}. Proceeding without enforcement.\n`);
      return;
    }
  } else {
    console.log(`Agent: @${parsed.fullName}`);
    targetFile = findAgentFile(parsed.name);
    if (!targetFile) {
      console.log(`Warning: Agent file not found for @${parsed.fullName}. Proceeding without enforcement.\n`);
      return;
    }
  }

  console.log(`File: ${path.relative(process.cwd(), targetFile)}`);

  const queries = extractDocumentationQueries(targetFile);

  if (queries.length === 0) {
    console.log(`\nNo Documentation Queries found in file.`);
    console.log(`ALL ${parsed.type}s MUST have Documentation Queries section.\n`);
    process.exit(1);
  }

  console.log(`\nContext7 Queries Required: ${queries.length}\n`);
  for (const query of queries) {
    console.log(`   -> ${query.url}`);
    console.log(`      ${query.description}`);
  }

  console.log(`\nContext7 complete. Proceeding with implementation.\n`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('\nHook execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  parseInvocation,
  findCommandFile,
  findAgentFile,
  extractDocumentationQueries
};
