#!/usr/bin/env node
/**
 * Add missing wrapper scripts to plugin.json
 *
 * This script finds all .sh wrapper scripts and ensures they have
 * corresponding entries in plugin.json as standalone scripts.
 */

const fs = require('fs');
const path = require('path');

const pluginJsonPath = path.join(__dirname, '..', 'packages', 'plugin-pm', 'plugin.json');
const scriptsDir = path.join(__dirname, '..', 'packages', 'plugin-pm', 'scripts', 'pm');

// Read plugin.json
const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

// Get all .sh files
const shellScripts = fs.readdirSync(scriptsDir)
  .filter(file => file.endsWith('.sh'))
  .map(file => path.basename(file, '.sh'));

console.log(`Found ${shellScripts.length} shell scripts:`, shellScripts);

// Find which ones are missing as standalone entries
const existingScripts = new Set(
  pluginJson.scripts
    .filter(s => s.file && s.file.includes('.sh'))
    .map(s => path.basename(s.file, '.sh'))
);

console.log(`\nExisting standalone entries:`, Array.from(existingScripts));

const missingScripts = shellScripts.filter(name => !existingScripts.has(name));

console.log(`\nMissing standalone entries:`, missingScripts);

if (missingScripts.length === 0) {
  console.log('\n✅ All wrapper scripts already have standalone entries!');
  process.exit(0);
}

// Add missing scripts
const newEntries = missingScripts.map(name => ({
  name: name,
  file: `scripts/pm/${name}.sh`,
  description: `${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} wrapper script`,
  type: 'workflow',
  executable: true,
  category: 'pm-workflow',
  tags: ['pm', name.includes('epic') ? 'epic' : 'workflow', 'automation']
}));

console.log(`\n📝 Adding ${newEntries.length} new entries...`);

// Insert new entries after existing scripts
pluginJson.scripts.push(...newEntries);

// Write back
fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2) + '\n', 'utf8');

console.log(`\n✅ Updated plugin.json with ${newEntries.length} new wrapper script entries`);
console.log(`\nAdded scripts:`);
newEntries.forEach(entry => {
  console.log(`  - ${entry.name} (${entry.file})`);
});
