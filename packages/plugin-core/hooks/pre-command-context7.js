#!/usr/bin/env node

/**
 * Pre-Command Context7 Hook
 *
 * MANDATORY: This hook enforces Context7 documentation queries BEFORE command execution.
 *
 * Workflow:
 * 1. Intercept command execution (e.g., /pm:epic-decompose)
 * 2. Extract command file path from .claude/commands/{category}/{command}.md
 * 3. Parse "Documentation Queries" section
 * 4. Query Context7 MCP for each link
 * 5. Inject results into execution context
 * 6. Allow command to proceed with Context7 knowledge
 *
 * Zero Tolerance: If Context7 query fails, execution STOPS.
 */

const fs = require('fs');
const path = require('path');

/**
 * Extract command metadata from invocation
 * @param {string} commandInvocation - e.g., "/pm:epic-decompose feature-name"
 * @returns {object} { category, command, args }
 */
function parseCommandInvocation(commandInvocation) {
  // Remove leading slash and split
  const cleaned = commandInvocation.replace(/^\//, '');
  const [categoryCommand, ...args] = cleaned.split(/\s+/);
  const [category, command] = categoryCommand.split(':');

  return {
    category: category || 'pm', // Default to pm if no category
    command: command || categoryCommand,
    args: args,
    fullCommand: categoryCommand
  };
}

/**
 * Find command file in .claude/commands/
 * @param {string} category - Command category (pm, azure, cloud, etc.)
 * @param {string} command - Command name (epic-decompose, issue-start, etc.)
 * @returns {string|null} - Path to command file or null
 */
function findCommandFile(category, command) {
  const baseDir = path.join(process.cwd(), '.claude', 'commands');

  // Try exact match first
  let commandPath = path.join(baseDir, category, `${command}.md`);
  if (fs.existsSync(commandPath)) {
    return commandPath;
  }

  // Try with underscores (epic-decompose → epic_decompose)
  const underscored = command.replace(/-/g, '_');
  commandPath = path.join(baseDir, category, `${underscored}.md`);
  if (fs.existsSync(commandPath)) {
    return commandPath;
  }

  // Try without category prefix if command includes it
  if (command.includes('-')) {
    const [, actualCommand] = command.split('-', 2);
    if (actualCommand) {
      commandPath = path.join(baseDir, category, `${actualCommand}.md`);
      if (fs.existsSync(commandPath)) {
        return commandPath;
      }
    }
  }

  return null;
}

/**
 * Extract Documentation Queries from command file
 * @param {string} filePath - Path to command .md file
 * @returns {Array<{url: string, description: string}>}
 */
function extractDocumentationQueries(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const queries = [];

  // Find the Documentation Queries section
  const querySection = content.match(/\*\*Documentation Queries:\*\*\s*\n([\s\S]*?)(?=\n\n|\*\*Why This is Required|\n##|$)/);

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
 * @param {string} mcpUrl - e.g., "mcp://context7/agile/epic-decomposition"
 * @returns {Promise<object>} - Context7 response
 */
async function queryContext7(mcpUrl) {
  // Parse MCP URL: mcp://context7/category/topic
  const urlMatch = mcpUrl.match(/mcp:\/\/context7\/(.+)/);
  if (!urlMatch) {
    throw new Error(`Invalid Context7 URL format: ${mcpUrl}`);
  }

  const topicPath = urlMatch[1]; // e.g., "agile/epic-decomposition"

  // In real implementation, this would call the MCP server
  // For now, return a placeholder that instructs Claude to query
  return {
    url: mcpUrl,
    topic: topicPath,
    instruction: `MANDATORY: Query Context7 MCP for topic "${topicPath}" before proceeding with implementation.`,
    placeholder: true
  };
}

/**
 * Main hook execution
 * @param {string} commandInvocation - Full command string from user
 */
async function main(commandInvocation) {
  console.log('\n🔒 Context7 Pre-Command Hook Activated\n');

  // Parse command
  const { category, command, args, fullCommand } = parseCommandInvocation(commandInvocation || process.argv[2] || '');

  console.log(`📋 Command: /${fullCommand}`);
  console.log(`   Category: ${category}`);
  console.log(`   Command: ${command}`);
  if (args.length > 0) {
    console.log(`   Arguments: ${args.join(' ')}`);
  }

  // Find command file
  const commandFile = findCommandFile(category, command);
  if (!commandFile) {
    console.log(`\n⚠️  Warning: Command file not found for /${fullCommand}`);
    console.log(`   Searched: .claude/commands/${category}/${command}.md`);
    console.log(`   Proceeding without Context7 enforcement (file may not exist yet)\n`);
    return;
  }

  console.log(`   File: ${path.relative(process.cwd(), commandFile)}`);

  // Extract Documentation Queries
  const queries = extractDocumentationQueries(commandFile);

  if (queries.length === 0) {
    console.log(`\n❌ CRITICAL: No Documentation Queries found in command file!`);
    console.log(`   This violates Context7 enforcement policy.`);
    console.log(`   ALL commands MUST have Documentation Queries section.`);
    console.log(`\n   Please add to ${path.basename(commandFile)}:`);
    console.log(`   ## Required Documentation Access`);
    console.log(`   **MANDATORY:** Before [action], query Context7 for best practices:`);
    console.log(`   **Documentation Queries:**`);
    console.log(`   - \`mcp://context7/...\` - Description`);
    console.log(`\n   Blocking execution until fixed.\n`);
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
  console.log(`📖 REMINDER: You MUST use Context7 documentation in your implementation:`);
  console.log(`   • Apply patterns from Context7 examples`);
  console.log(`   • Verify API signatures against Context7 results`);
  console.log(`   • Follow best practices documented in Context7`);
  console.log(`   • Flag any conflicts between training data and Context7`);
  console.log(`\n🚀 Proceeding with command execution...\n`);

  // In production, this would inject Context7 results into Claude's context
  // For now, we output instruction for Claude to see
  if (results.length > 0 && results[0].placeholder) {
    console.log(`⚡ ACTION REQUIRED:`);
    console.log(`   Before implementing /${fullCommand}, you MUST:`);
    for (const result of results) {
      console.log(`   • ${result.instruction}`);
    }
    console.log();
  }
}

// Execute if run directly
if (require.main === module) {
  const commandInvocation = process.argv.slice(2).join(' ');
  main(commandInvocation).catch(error => {
    console.error('\n❌ Hook execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  parseCommandInvocation,
  findCommandFile,
  extractDocumentationQueries,
  queryContext7
};
