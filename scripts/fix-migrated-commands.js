#!/usr/bin/env node

/**
 * Fix syntax errors in migrated command files
 */

const fs = require('fs-extra');
const path = require('path');

async function fixCommandFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');

    // Find the AGENT_PROMPT section
    const promptStart = content.indexOf('const AGENT_PROMPT = `');
    const promptEnd = content.lastIndexOf('`;');

    if (promptStart > -1 && promptEnd > promptStart) {
      // Extract the prompt content
      const beforePrompt = content.substring(0, promptStart);
      const afterPrompt = content.substring(promptEnd + 2);
      let promptContent = content.substring(promptStart + 22, promptEnd);

      // Escape backticks within the prompt
      promptContent = promptContent.replace(/`/g, '\\`');

      // Reconstruct the file
      content = beforePrompt + 'const AGENT_PROMPT = `' + promptContent + '`;' + afterPrompt;

      // Write back the fixed content
      await fs.writeFile(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing migrated command files...\n');

  const commandsDir = path.join(__dirname, '../bin/commands');
  const dirs = await fs.readdir(commandsDir);

  let fixed = 0;
  let failed = 0;

  for (const dir of dirs) {
    const dirPath = path.join(commandsDir, dir);
    const stat = await fs.stat(dirPath);

    if (stat.isDirectory()) {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = path.join(dirPath, file);

          // Check if file has syntax error
          try {
            require(filePath);
          } catch (error) {
            if (error instanceof SyntaxError) {
              console.log(`Fixing: ${dir}/${file}`);
              const result = await fixCommandFile(filePath);
              if (result) {
                fixed++;
              } else {
                failed++;
              }
            }
          }
        }
      }
    }
  }

  console.log('\n📊 Fix Summary:');
  console.log(`  ✅ Fixed: ${fixed}`);
  console.log(`  ❌ Failed: ${failed}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});