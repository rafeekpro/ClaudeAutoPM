#!/usr/bin/env node

/**
 * Fix template variable syntax in migrated command files
 */

const fs = require('fs-extra');
const path = require('path');

async function fixTemplateVariables(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;

    // Find the AGENT_PROMPT section
    const promptStart = content.indexOf('const AGENT_PROMPT = `');
    const promptEnd = content.indexOf('`;', promptStart);

    if (promptStart > -1 && promptEnd > promptStart) {
      const beforePrompt = content.substring(0, promptStart);
      const afterPrompt = content.substring(promptEnd + 2);
      let promptContent = content.substring(promptStart + 22, promptEnd);

      // Replace ${VAR} with \${VAR} to escape them within template literal
      const originalPrompt = promptContent;
      promptContent = promptContent.replace(/\$\{([^}]+)\}/g, '\\${$1}');

      if (promptContent !== originalPrompt) {
        modified = true;
        content = beforePrompt + 'const AGENT_PROMPT = `' + promptContent + '`;' + afterPrompt;
        await fs.writeFile(filePath, content);
      }
    }

    return modified;
  } catch (error) {
    console.error(`Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing template variables in command files...\n');

  const commandsDir = path.join(__dirname, '../bin/commands');

  // Find all .js files in commands directory
  const findFiles = async (dir) => {
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        files.push(...await findFiles(itemPath));
      } else if (item.endsWith('.js')) {
        files.push(itemPath);
      }
    }

    return files;
  };

  const jsFiles = await findFiles(commandsDir);

  let fixed = 0;
  let checked = 0;

  for (const file of jsFiles) {
    checked++;
    const relativePath = path.relative(commandsDir, file);

    // Try to check if file needs fixing
    const content = await fs.readFile(file, 'utf8');
    if (content.includes('${') && content.includes('const AGENT_PROMPT')) {
      console.log(`Fixing: ${relativePath}`);
      const result = await fixTemplateVariables(file);
      if (result) {
        fixed++;
      }
    }
  }

  console.log('\n📊 Fix Summary:');
  console.log(`  📁 Checked: ${checked} files`);
  console.log(`  ✅ Fixed: ${fixed} files`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});