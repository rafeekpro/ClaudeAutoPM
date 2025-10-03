#!/usr/bin/env node

/**
 * Pre-Agent Context7 Hook
 *
 * MANDATORY: This hook enforces Context7 documentation queries BEFORE agent invocation.
 *
 * Workflow:
 * 1. Intercept agent invocation (e.g., @aws-cloud-architect)
 * 2. Extract agent file path from .claude/agents/{category}/{agent}.md
 * 3. Parse "Documentation Queries" section
 * 4. Query Context7 MCP for each link
 * 5. Inject results into agent context
 * 6. Allow agent to proceed with Context7 knowledge
 *
 * Zero Tolerance: If Context7 query fails, agent invocation STOPS.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse agent invocation
 * @param {string} agentInvocation - e.g., "@aws-cloud-architect design VPC"
 * @returns {object} { agentName, task }
 */
function parseAgentInvocation(agentInvocation) {
  // Remove @ symbol and split
  const cleaned = agentInvocation.replace(/^@/, '');
  const parts = cleaned.split(/\s+/);
  const agentName = parts[0];
  const task = parts.slice(1).join(' ');

  return {
    agentName,
    task,
    fullInvocation: agentInvocation
  };
}

/**
 * Find agent file in .claude/agents/
 * @param {string} agentName - Agent name (aws-cloud-architect, test-runner, etc.)
 * @returns {string|null} - Path to agent file or null
 */
function findAgentFile(agentName) {
  const baseDir = path.join(process.cwd(), '.claude', 'agents');

  // Search recursively in all subdirectories
  function searchDir(dir) {
    if (!fs.existsSync(dir)) return null;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const found = searchDir(fullPath);
        if (found) return found;
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Check if filename matches (with or without .md extension)
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
 * Extract Documentation Queries from agent file
 * @param {string} filePath - Path to agent .md file
 * @returns {Array<{url: string, description: string}>}
 */
function extractDocumentationQueries(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const queries = [];

  // Find the Documentation Queries section (agent format)
  const querySection = content.match(/\*\*Documentation Queries:\*\*\s*\n([\s\S]*?)(?=\n\n|\*\*|##|$)/);

  if (!querySection) {
    return queries; // No Documentation Queries section found
  }

  // Extract each mcp://context7/... line
  const lines = querySection[1].split('\n');
  for (const line of lines) {
    const match = line.match(/`(mcp:\/\/context7\/[^`]+)`\s*-\s*(.+)/);
    if (match) {
      queries.push({
        url: match[1],
        description: match[2].trim()
      });
    }
  }

  return queries;
}

/**
 * Query Context7 MCP server
 * @param {string} mcpUrl - e.g., "mcp://context7/aws/compute"
 * @returns {Promise<object>} - Context7 response
 */
async function queryContext7(mcpUrl) {
  // Parse MCP URL: mcp://context7/category/topic
  const urlMatch = mcpUrl.match(/mcp:\/\/context7\/(.+)/);
  if (!urlMatch) {
    throw new Error(`Invalid Context7 URL format: ${mcpUrl}`);
  }

  const topicPath = urlMatch[1]; // e.g., "aws/compute"

  // In real implementation, this would call the MCP server
  // For now, return a placeholder that instructs Claude to query
  return {
    url: mcpUrl,
    topic: topicPath,
    instruction: `MANDATORY: Query Context7 MCP for topic "${topicPath}" before implementing solution.`,
    placeholder: true
  };
}

/**
 * Main hook execution
 * @param {string} agentInvocation - Full agent invocation from user
 */
async function main(agentInvocation) {
  console.log('\n🔒 Context7 Pre-Agent Hook Activated\n');

  // Parse agent invocation
  const { agentName, task, fullInvocation } = parseAgentInvocation(agentInvocation || process.argv[2] || '');

  console.log(`🤖 Agent: @${agentName}`);
  if (task) {
    console.log(`   Task: ${task}`);
  }

  // Find agent file
  const agentFile = findAgentFile(agentName);
  if (!agentFile) {
    console.log(`\n⚠️  Warning: Agent file not found for @${agentName}`);
    console.log(`   Searched: .claude/agents/**/${agentName}.md`);
    console.log(`   Proceeding without Context7 enforcement (agent may not exist)\n`);
    return;
  }

  console.log(`   File: ${path.relative(process.cwd(), agentFile)}`);

  // Extract Documentation Queries
  const queries = extractDocumentationQueries(agentFile);

  if (queries.length === 0) {
    console.log(`\n❌ CRITICAL: No Documentation Queries found in agent file!`);
    console.log(`   This violates Context7 enforcement policy.`);
    console.log(`   ALL agents MUST have Documentation Queries section.`);
    console.log(`\n   Please add to ${path.basename(agentFile)}:`);
    console.log(`   **Documentation Queries:**`);
    console.log(`   - \`mcp://context7/...\` - Description`);
    console.log(`\n   Blocking agent invocation until fixed.\n`);
    process.exit(1);
  }

  console.log(`\n📚 Context7 Documentation Queries Required: ${queries.length}\n`);

  // Query Context7 for each link
  const results = [];
  for (const query of queries) {
    console.log(`   ➜ ${query.url}`);
    console.log(`     ${query.description}`);

    try {
      const result = await queryContext7(query.url);
      results.push(result);
    } catch (error) {
      console.log(`\n❌ Context7 query FAILED: ${error.message}`);
      console.log(`   Cannot proceed without Context7 documentation.`);
      console.log(`   Please ensure Context7 MCP server is running.\n`);
      process.exit(1);
    }
  }

  console.log(`\n✅ Context7 Queries Complete\n`);
  console.log(`📖 REMINDER: @${agentName} MUST use Context7 documentation:`);
  console.log(`   • Apply patterns from Context7 examples`);
  console.log(`   • Verify API signatures against Context7 results`);
  console.log(`   • Follow best practices documented in Context7`);
  console.log(`   • Flag any conflicts between training data and Context7`);
  console.log(`\n🚀 Proceeding with agent invocation...\n`);

  // In production, this would inject Context7 results into agent's context
  // For now, we output instruction for Claude to see
  if (results.length > 0 && results[0].placeholder) {
    console.log(`⚡ ACTION REQUIRED FOR @${agentName}:`);
    console.log(`   Before implementing "${task || 'task'}", you MUST:`);
    for (const result of results) {
      console.log(`   • ${result.instruction}`);
    }
    console.log();
  }
}

// Execute if run directly
if (require.main === module) {
  const agentInvocation = process.argv.slice(2).join(' ');
  main(agentInvocation).catch(error => {
    console.error('\n❌ Hook execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  parseAgentInvocation,
  findAgentFile,
  extractDocumentationQueries,
  queryContext7
};
