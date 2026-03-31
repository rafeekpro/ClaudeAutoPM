const fs = require('fs');
const path = require('path');

/**
 * PM System Validation Script (Node.js version)
 * Migrated from bash script with 100% backward compatibility
 */

async function validate() {
  const result = {
    errors: 0,
    warnings: 0,
    invalidFiles: 0,
    messages: [],
    exitCode: 0
  };

  // Helper function to add messages
  function addMessage(message) {
    result.messages.push(message);
    // Only log if running as CLI
    if (require.main === module) {
      console.log(message);
    }
  }

  // Header
  addMessage('Validating PM System...');
  addMessage('');
  addMessage('');
  addMessage('🔍 Validating PM System');
  addMessage('=======================');
  addMessage('');

  // Check directory structure
  addMessage('📁 Directory Structure:');

  try {
    if (fs.existsSync('.claude') && fs.statSync('.claude').isDirectory()) {
      addMessage('  ✅ .claude directory exists');
    } else {
      addMessage('  ❌ .claude directory missing');
      result.errors++;
    }
  } catch (err) {
    addMessage('  ❌ .claude directory missing');
    result.errors++;
  }

  // Check optional directories
  const optionalDirs = [
    { path: '.claude/prds', name: 'PRDs directory' },
    { path: '.claude/epics', name: 'Epics directory' },
    { path: '.claude/rules', name: 'Rules directory' }
  ];

  for (const dir of optionalDirs) {
    try {
      if (fs.existsSync(dir.path) && fs.statSync(dir.path).isDirectory()) {
        addMessage(`  ✅ ${dir.name} exists`);
      } else {
        addMessage(`  ⚠️ ${dir.name} missing`);
        result.warnings++;
      }
    } catch (err) {
      addMessage(`  ⚠️ ${dir.name} missing`);
      result.warnings++;
    }
  }

  addMessage('');

  // Check for data integrity
  addMessage('🗂️ Data Integrity:');

  // Check epics have epic.md files
  try {
    if (fs.existsSync('.claude/epics')) {
      const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const epicDir of epicDirs) {
        const epicPath = path.join('.claude/epics', epicDir);
        const epicFilePath = path.join(epicPath, 'epic.md');

        if (!fs.existsSync(epicFilePath)) {
          addMessage(`  ⚠️ Missing epic.md in ${epicDir}`);
          result.warnings++;
        }
      }
    }
  } catch (err) {
    // Silently handle directory read errors
  }

  // Check for orphaned task files
  try {
    const orphanedFiles = [];

    function findOrphanedFiles(dir) {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Skip epic directories
          if (fullPath.includes('.claude/epics/')) {
            continue;
          }
          findOrphanedFiles(fullPath);
        } else if (item.isFile() && /^[0-9].*\.md$/.test(item.name)) {
          // Check if this is a numbered task file outside of epics
          if (!fullPath.includes('.claude/epics/')) {
            orphanedFiles.push(fullPath);
          }
        }
      }
    }

    findOrphanedFiles('.claude');

    if (orphanedFiles.length > 0) {
      addMessage(`  ⚠️ Found ${orphanedFiles.length} orphaned task files`);
      result.warnings++;
    }
  } catch (err) {
    // Silently handle file system errors
  }

  // Reference check
  addMessage('');
  addMessage('🔗 Reference Check:');

  let hasValidReferences = true;

  try {
    if (fs.existsSync('.claude/epics')) {
      const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const epicDir of epicDirs) {
        const epicPath = path.join('.claude/epics', epicDir);

        if (!fs.existsSync(epicPath)) continue;

        const files = fs.readdirSync(epicPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && /^[0-9].*\.md$/.test(dirent.name))
          .map(dirent => dirent.name);

        for (const taskFile of files) {
          const taskPath = path.join(epicPath, taskFile);

          try {
            const content = fs.readFileSync(taskPath, 'utf8');

            // Look for depends_on line
            const dependsOnMatch = content.match(/^depends_on:\s*\[(.*?)\]/m);

            if (dependsOnMatch && dependsOnMatch[1].trim()) {
              const deps = dependsOnMatch[1]
                .split(',')
                .map(dep => dep.trim())
                .filter(dep => dep.length > 0);

              for (const dep of deps) {
                const depPath = path.join(epicPath, `${dep}.md`);

                if (!fs.existsSync(depPath)) {
                  const taskName = path.basename(taskFile, '.md');
                  addMessage(`  ⚠️ Task ${taskName} references missing task: ${dep}`);
                  result.warnings++;
                  hasValidReferences = false;
                }
              }
            }
          } catch (err) {
            // Skip files that can't be read
          }
        }
      }
    }
  } catch (err) {
    // Silently handle directory errors
  }

  if (hasValidReferences) {
    addMessage('  ✅ All references valid');
  }

  // Frontmatter validation
  addMessage('');
  addMessage('📝 Frontmatter Validation:');

  let invalidFrontmatter = 0;

  try {
    function checkFrontmatter(dir, relativePath = '') {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relPath = relativePath ? path.join(relativePath, item.name) : item.name;

        if (item.isDirectory()) {
          checkFrontmatter(fullPath, relPath);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          // Only check files in epics and prds directories
          if (fullPath.includes('.claude/epics/') || fullPath.includes('.claude/prds/')) {
            try {
              const content = fs.readFileSync(fullPath, 'utf8');

              if (!content.startsWith('---')) {
                addMessage(`  ⚠️ Missing frontmatter: ${item.name}`);
                invalidFrontmatter++;
              }
            } catch (err) {
              // Skip files that can't be read
            }
          }
        }
      }
    }

    checkFrontmatter('.claude');

    if (invalidFrontmatter === 0) {
      addMessage('  ✅ All files have frontmatter');
    }
  } catch (err) {
    // Silently handle file system errors
  }

  result.invalidFiles = invalidFrontmatter;

  // Summary
  addMessage('');
  addMessage('📊 Validation Summary:');
  addMessage(`  Errors: ${result.errors}`);
  addMessage(`  Warnings: ${result.warnings}`);
  addMessage(`  Invalid files: ${result.invalidFiles}`);

  if (result.errors === 0 && result.warnings === 0 && result.invalidFiles === 0) {
    addMessage('');
    addMessage('✅ System is healthy!');
  } else {
    addMessage('');
    addMessage('💡 Run /pm:clean to fix some issues automatically');
  }

  // Always exit with 0 (matching bash behavior)
  result.exitCode = 0;

  return result;
}

// Export for use as module
module.exports = validate;

// CLI execution
if (require.main === module) {
  validate().then(result => {
    process.exit(result.exitCode);
  }).catch(err => {
    console.error('Validation failed:', err.message);
    process.exit(1);
  });
}