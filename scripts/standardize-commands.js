#!/usr/bin/env node

/**
 * Standardize PM Commands to DEVELOPMENT-STANDARDS.md
 *
 * Adds frontmatter to commands that are missing it
 * Commands should have:
 * - Frontmatter with name, type, category
 * - Context7 Documentation Queries section (already present)
 */

const fs = require('fs');
const path = require('path');

// Commands that need frontmatter (excluding docs)
const commandsToFix = [
  'ai/langgraph-workflow.md',
  'ai/openai-chat.md',
  'azure/feature-show.md',
  'azure/task-analyze.md',
  'config/toggle-features.md',
  'infrastructure/ssh-security.md',
  'infrastructure/traefik-setup.md',
  'pm/epic-split.md',
  'ui-framework-commands.md',
  'ui/bootstrap-scaffold.md',
  'ui/tailwind-system.md',
  'ux-design-commands.md'
];

const commandsDir = path.join(__dirname, '..', 'autopm', '.claude', 'commands');

function extractCommandName(filePath, content) {
  // Try to get from first heading
  const match = content.match(/^#\s+(.+?)(?:\s+Command)?$/m);
  if (match) {
    return match[1].trim().toLowerCase().replace(/\s+/g, '-');
  }

  // Fallback to filename
  return path.basename(filePath, '.md');
}

function extractCategory(filePath) {
  const parts = filePath.split('/');
  if (parts.length > 1) {
    return parts[0]; // azure, pm, ai, etc.
  }
  return 'general';
}

function extractDescription(content) {
  // Get first paragraph after title
  const lines = content.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#')) {
      return line.length > 150 ? line.substring(0, 147) + '...' : line;
    }
  }
  return 'PM command for project management workflow';
}

function determineCommandType(filePath, content) {
  const contentLower = content.toLowerCase();

  // Check category-specific types first
  if (filePath.includes('ai/')) {
    if (contentLower.includes('workflow') || contentLower.includes('langgraph')) return 'ai-workflow';
    if (contentLower.includes('openai') || contentLower.includes('chat')) return 'ai-integration';
    return 'ai-integration';
  }

  if (filePath.includes('infrastructure/')) return 'infrastructure';
  if (filePath.includes('ui/')) return 'ui-development';
  if (filePath.includes('config/')) return 'configuration';

  // PM category types
  if (contentLower.includes('epic') || contentLower.includes('feature')) return 'epic-management';
  if (contentLower.includes('task') || contentLower.includes('issue')) return 'task-management';
  if (contentLower.includes('sprint') || contentLower.includes('standup')) return 'sprint-management';
  if (contentLower.includes('prd') || contentLower.includes('requirement')) return 'requirements';
  if (contentLower.includes('sync') || contentLower.includes('import')) return 'integration';
  if (contentLower.includes('analyze') || contentLower.includes('report')) return 'analytics';

  return 'workflow';
}

function generateFrontmatter(filePath, content) {
  const name = extractCommandName(filePath, content);
  const description = extractDescription(content);
  const category = extractCategory(filePath);
  const type = determineCommandType(filePath, content);

  return `---
name: ${name}
type: ${type}
category: ${category}
---

`;
}

function addFrontmatter(filePath, content) {
  // Check if already has frontmatter
  if (content.startsWith('---')) {
    console.log(`⏭️  Skipping ${filePath} - already has frontmatter`);
    return content;
  }

  const frontmatter = generateFrontmatter(filePath, content);
  console.log(`✅ Adding frontmatter to ${filePath}`);

  return frontmatter + content;
}

function standardizeCommand(relativePath) {
  const fullPath = path.join(commandsDir, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const updated = addFrontmatter(relativePath, content);

  if (updated !== content) {
    fs.writeFileSync(fullPath, updated);
    console.log(`   Frontmatter added to ${relativePath}`);
  }
}

// Main execution
console.log('🔧 Standardizing PM Commands\n');

let processed = 0;
let updated = 0;

for (const commandPath of commandsToFix) {
  const fullPath = path.join(commandsDir, commandPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${commandPath} - not found`);
    continue;
  }

  const before = fs.readFileSync(fullPath, 'utf-8');
  standardizeCommand(commandPath);
  const after = fs.readFileSync(fullPath, 'utf-8');

  processed++;
  if (before !== after) {
    updated++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Processed: ${processed} commands`);
console.log(`   Updated: ${updated} commands`);
console.log(`   Skipped: ${processed - updated} commands`);
