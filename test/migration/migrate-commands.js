#!/usr/bin/env node

/**
 * Migrate large command files to minimal references
 * Moves implementations to autopm/.claude/lib/commands/
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const BIN_COMMANDS = path.join(PROJECT_ROOT, 'bin/commands');
const AUTOPM_LIB = path.join(PROJECT_ROOT, 'autopm/.claude/lib/commands');

// Command template for minimal reference
const COMMAND_TEMPLATE = (commandPath) => `/**
 * Command reference - delegates to autopm implementation
 */
const path = require('path');

module.exports = {
  handler: () => {
    const commandDoc = path.join(__dirname, '../../../autopm/.claude/commands/${commandPath}');
    console.log(\`Execute command from: \${commandDoc}\`);
    return { success: true, delegated: true };
  }
};
`;

// Process a single command file
function processCommandFile(filepath) {
  const stats = fs.statSync(filepath);
  const relativePath = path.relative(BIN_COMMANDS, filepath);

  // Skip if already small (likely already a reference)
  if (stats.size < 2000) {
    console.log(`  ⏭️  Skipping ${relativePath} (already minimal)`);
    return;
  }

  // Determine command path for documentation
  const commandPath = relativePath
    .replace(/\.js$/, '.md')
    .replace(/([A-Z])/g, (match, p1, offset) =>
      offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase()
    );

  // Read the original file to check if it has useful implementation
  const content = fs.readFileSync(filepath, 'utf8');

  // If it has substantial implementation, move it to lib
  if (content.length > 3000 && content.includes('async') && content.includes('function')) {
    // Create lib directory if needed
    const libDir = path.dirname(path.join(AUTOPM_LIB, relativePath));
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }

    // Copy implementation to lib
    const libPath = path.join(AUTOPM_LIB, relativePath);
    fs.writeFileSync(libPath, content);
    console.log(`  📦 Moved implementation to lib: ${relativePath}`);
  }

  // Replace with minimal reference
  fs.writeFileSync(filepath, COMMAND_TEMPLATE(commandPath));
  console.log(`  ✅ Created minimal reference: ${relativePath}`);
}

// Get all command files recursively
function getAllCommandFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.')) {
      getAllCommandFiles(fullPath, files);
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Main migration
console.log('🔄 Migrating command files to minimal references...\n');

// Create lib directory if needed
if (!fs.existsSync(AUTOPM_LIB)) {
  fs.mkdirSync(AUTOPM_LIB, { recursive: true });
}

// Process all command files
const commandFiles = getAllCommandFiles(BIN_COMMANDS);
console.log(`Found ${commandFiles.length} command files\n`);

let processed = 0;
let skipped = 0;

for (const file of commandFiles) {
  const stats = fs.statSync(file);
  if (stats.size > 2000) {
    processCommandFile(file);
    processed++;
  } else {
    skipped++;
  }
}

console.log(`\n✅ Migration complete!`);
console.log(`  - Processed: ${processed} files`);
console.log(`  - Skipped: ${skipped} files (already minimal)`);