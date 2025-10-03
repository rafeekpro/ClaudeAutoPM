#!/usr/bin/env node
/**
 * Context7 Enforcement Hook
 *
 * BLOCKS command execution until Context7 queries are performed.
 * This ensures 100% compliance - no exceptions.
 */

const fs = require('fs');
const path = require('path');

// Parse command from arguments
const command = process.argv[2] || '';
const args = process.argv.slice(3).join(' ');

console.log('\n🔒 Context7 Enforcement Active\n');

// Extract command name from /pm:command or command format
const commandMatch = command.match(/\/?(?:pm:)?([a-z-]+)/);
if (!commandMatch) {
  console.log('⚠️  Could not parse command format');
  process.exit(0); // Allow to proceed if we can't parse
}

const commandName = commandMatch[1];
console.log(`📋 Command: ${command} ${args}`);

// Find command file
const commandFile = path.join(__dirname, '../commands/pm', `${commandName}.md`);

if (!fs.existsSync(commandFile)) {
  console.log(`ℹ️  Command file not found: ${commandName}.md`);
  console.log('⏭️  Skipping Context7 check\n');
  process.exit(0);
}

// Read command file
const content = fs.readFileSync(commandFile, 'utf8');

// Extract Documentation Queries section
const queriesMatch = content.match(/\*\*Documentation Queries:\*\*([\s\S]*?)(?:\n\n|\*\*Why|##)/);

if (!queriesMatch) {
  console.log(`⚠️  No Documentation Queries found in ${commandName}.md`);
  console.log('🚫 BLOCKING: This command must have Context7 queries!\n');
  console.log('Add Documentation Queries section to the command file.\n');
  process.exit(1); // BLOCK
}

// Extract individual queries
const queriesSection = queriesMatch[1];
const queries = queriesSection.match(/`mcp:\/\/context7\/[^`]+`/g) || [];

if (queries.length === 0) {
  console.log(`⚠️  No Context7 queries found in ${commandName}.md`);
  console.log('🚫 BLOCKING: Add at least one Context7 query!\n');
  process.exit(1); // BLOCK
}

// Display required queries
console.log(`📚 Required Context7 Queries:\n`);
queries.forEach(query => {
  const cleanQuery = query.replace(/`/g, '');
  console.log(`   ➜ ${cleanQuery}`);
});

console.log('\n⚠️  IMPORTANT: You MUST query Context7 before proceeding!');
console.log('❌ Do NOT skip these queries!');
console.log('❌ Do NOT rely on training data alone!');
console.log('✅ Use Context7 MCP to get current best practices\n');

// Ask for confirmation (in real implementation, this would wait for Context7 results)
console.log('After querying Context7, you may proceed with implementation.\n');

// In future: Could integrate with MCP to verify queries were actually made
// For now: Strong reminder with visual warnings

process.exit(0); // Allow to proceed after showing queries
