#!/usr/bin/env node
/**
 * Epic Sync - Complete GitHub sync for epics
 *
 * Replaces all 4 Bash scripts with clean, testable JavaScript:
 * - create-epic-issue.sh → createEpicIssue()
 * - create-task-issues.sh → createTaskIssues()
 * - update-epic-file.sh → updateEpicFile()
 * - update-references.sh → updateTaskReferences()
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Parse frontmatter and body from markdown file
 */
function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let inFrontmatter = false;
  let frontmatterLines = [];
  let bodyLines = [];
  let frontmatterCount = 0;

  for (const line of lines) {
    if (line === '---') {
      frontmatterCount++;
      if (frontmatterCount === 1) {
        inFrontmatter = true;
        continue;
      } else if (frontmatterCount === 2) {
        inFrontmatter = false;
        continue;
      }
    }

    if (inFrontmatter) {
      frontmatterLines.push(line);
    } else if (frontmatterCount === 2) {
      bodyLines.push(line);
    }
  }

  // Parse frontmatter
  const frontmatter = {};
  for (const line of frontmatterLines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter,
    frontmatterLines,
    body: bodyLines.join('\n').trim(),
    fullContent: content
  };
}

/**
 * Update frontmatter field in markdown content
 */
function updateFrontmatter(content, updates) {
  const lines = content.split('\n');
  const result = [];
  let inFrontmatter = false;
  let frontmatterCount = 0;

  for (const line of lines) {
    if (line === '---') {
      frontmatterCount++;
      result.push(line);
      if (frontmatterCount === 1) {
        inFrontmatter = true;
      } else if (frontmatterCount === 2) {
        inFrontmatter = false;
      }
      continue;
    }

    if (inFrontmatter) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key] = match;
        if (updates[key] !== undefined) {
          result.push(`${key}: ${updates[key]}`);
        } else {
          result.push(line);
        }
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Check that remote origin is not the template repository
 */
function checkRepoProtection() {
  try {
    const remote = execSync('git remote get-url origin', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    if (remote.includes('rlagowski/autopm')) {
      throw new Error('Cannot sync to template repository (rlagowski/autopm). Fork first.');
    }
  } catch (e) {
    if (e.message.includes('template repository')) throw e;
    // No remote origin — warn but allow (local-only repos)
    console.warn('⚠️  Could not verify remote origin. Proceeding without repo protection check.');
  }
}

/**
 * Read mandatory footer template for issue bodies
 */
function readMandatoryFooter() {
  const footerPath = path.join(process.cwd(), '.claude/templates/issue-mandatory-footer.md');
  if (!fs.existsSync(footerPath)) {
    throw new Error(`Mandatory footer template not found: ${footerPath}. Run 'autopm install' to restore it.`);
  }
  return '\n\n' + fs.readFileSync(footerPath, 'utf8');
}

/**
 * Get repository info from gh CLI
 */
function getRepoInfo() {
  try {
    const result = execSync('gh repo view --json nameWithOwner -q .nameWithOwner', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch (error) {
    return 'unknown/repo';
  }
}

/**
 * Create epic GitHub issue
 */
function createEpicIssue(epicPath) {
  checkRepoProtection();

  const epicFile = path.join(process.cwd(), '.claude/epics', epicPath, 'epic.md');

  if (!fs.existsSync(epicFile)) {
    throw new Error(`Epic file not found: ${epicFile}`);
  }

  const { body } = parseMarkdownFile(epicFile);

  // Count tasks
  const epicDir = path.dirname(epicFile);
  const taskFiles = fs.readdirSync(epicDir)
    .filter(f => /^\d+\.md$/.test(f));
  const taskCount = taskFiles.length;

  // Detect epic type
  const isFeature = body.toLowerCase().includes('feature') ||
                    body.toLowerCase().includes('implement') ||
                    !body.toLowerCase().includes('bug');
  const labels = isFeature ? 'epic,feature' : 'epic,bug';

  console.log(`📝 Creating epic issue: ${epicPath}`);
  console.log(`   Tasks: ${taskCount}`);
  console.log(`   Labels: ${labels}`);

  // Create issue body with mandatory footer
  const footer = readMandatoryFooter();
  const issueBody = `
${body}

---

**Epic Statistics:**
- Tasks: ${taskCount}
- Status: Planning
- Created: ${getTimestamp()}
${footer}`.trim();

  // Escape for shell
  const escapedTitle = `Epic: ${epicPath}`.replace(/"/g, '\\"');
  const escapedBody = issueBody.replace(/"/g, '\\"').replace(/`/g, '\\`');

  try {
    const result = execSync(
      `gh issue create --title "${escapedTitle}" --body "${escapedBody}" --label "${labels}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const match = result.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/(\d+)/);
    if (match) {
      const issueNumber = parseInt(match[1]);
      console.log(`✅ Created epic issue #${issueNumber}`);
      return issueNumber;
    }

    throw new Error('Could not extract issue number from gh output');
  } catch (error) {
    throw new Error(`Failed to create epic issue: ${error.message}`);
  }
}

/**
 * Create task issues for an epic
 */
function createTaskIssues(epicPath, epicIssueNumber) {
  checkRepoProtection();

  const epicDir = path.join(process.cwd(), '.claude/epics', epicPath);

  if (!fs.existsSync(epicDir)) {
    throw new Error(`Epic directory not found: ${epicDir}`);
  }

  // Find all task files
  const taskFiles = fs.readdirSync(epicDir)
    .filter(f => /^\d+\.md$/.test(f))
    .sort();

  if (taskFiles.length === 0) {
    throw new Error(`No task files found in ${epicDir}`);
  }

  console.log(`\n📋 Creating ${taskFiles.length} task issues for epic #${epicIssueNumber}`);

  const mapping = [];
  let successCount = 0;

  for (let i = 0; i < taskFiles.length; i++) {
    const taskFile = taskFiles[i];
    const taskNumber = taskFile.replace('.md', '');
    const taskPath = path.join(epicDir, taskFile);

    console.log(`[${i + 1}/${taskFiles.length}] Creating issue for task ${taskNumber}...`);

    try {
      const { frontmatter, body } = parseMarkdownFile(taskPath);
      const title = frontmatter.name || 'Untitled Task';

      // Create issue body with mandatory footer
      const taskFooter = readMandatoryFooter();
      const issueBody = `
Part of Epic #${epicIssueNumber}

---

${body}

---

**Epic Path:** \`${epicPath}\`
**Task Number:** ${taskNumber}
${taskFooter}`.trim();

      // Escape for shell
      const escapedTitle = title.replace(/"/g, '\\"');
      const escapedBody = issueBody.replace(/"/g, '\\"').replace(/`/g, '\\`');

      const result = execSync(
        `gh issue create --title "${escapedTitle}" --body "${escapedBody}" --label "task"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );

      const match = result.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/(\d+)/);
      if (match) {
        const issueNumber = parseInt(match[1]);
        console.log(`   ✅ Created issue #${issueNumber}: ${title}`);
        mapping.push({ oldName: taskNumber, newNumber: issueNumber });
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Save mapping file
  const mappingFile = path.join(epicDir, '.task-mapping.txt');
  const mappingContent = mapping.map(m => `${m.oldName} ${m.newNumber}`).join('\n');
  fs.writeFileSync(mappingFile, mappingContent, 'utf8');

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${taskFiles.length - successCount}`);
  console.log(`   📝 Total: ${taskFiles.length}`);

  return mapping;
}

/**
 * Update epic file with GitHub URL and task references
 */
function updateEpicFile(epicPath, epicIssueNumber, taskMapping) {
  const epicFile = path.join(process.cwd(), '.claude/epics', epicPath, 'epic.md');

  if (!fs.existsSync(epicFile)) {
    throw new Error(`Epic file not found: ${epicFile}`);
  }

  console.log(`\n📄 Updating epic file: ${epicFile}`);

  const repo = getRepoInfo();
  const epicUrl = `https://github.com/${repo}/issues/${epicIssueNumber}`;

  // Read current content
  let content = fs.readFileSync(epicFile, 'utf8');

  // Update frontmatter
  content = updateFrontmatter(content, {
    github: epicUrl,
    updated: getTimestamp()
  });

  // Update task references in body
  if (taskMapping && taskMapping.length > 0) {
    console.log('   Updating task references...');

    for (const { oldName, newNumber } of taskMapping) {
      // Update checkbox items
      content = content.replace(
        new RegExp(`- \\[ \\] ${oldName}\\b`, 'g'),
        `- [ ] #${newNumber}`
      );
      content = content.replace(
        new RegExp(`- \\[x\\] ${oldName}\\b`, 'g'),
        `- [x] #${newNumber}`
      );

      // Update task links
      content = content.replace(
        new RegExp(`Task ${oldName}\\b`, 'g'),
        `Task #${newNumber}`
      );
    }
  }

  // Write updated content
  fs.writeFileSync(epicFile, content, 'utf8');

  console.log('✅ Epic file updated');
  console.log(`   GitHub: ${epicUrl}`);
}

/**
 * Update task files with GitHub URLs and rename to issue numbers
 */
function updateTaskReferences(epicPath, taskMapping) {
  const epicDir = path.join(process.cwd(), '.claude/epics', epicPath);

  if (!fs.existsSync(epicDir)) {
    throw new Error(`Epic directory not found: ${epicDir}`);
  }

  console.log(`\n🔗 Updating task references and renaming files`);

  const repo = getRepoInfo();

  for (const { oldName, newNumber } of taskMapping) {
    const oldFile = path.join(epicDir, `${oldName}.md`);
    const newFile = path.join(epicDir, `${newNumber}.md`);

    if (!fs.existsSync(oldFile)) {
      console.log(`   ⚠️  File not found: ${oldName}.md (skipping)`);
      continue;
    }

    console.log(`   Renaming ${oldName}.md → ${newNumber}.md...`);

    // Read and update content
    let content = fs.readFileSync(oldFile, 'utf8');

    const githubUrl = `https://github.com/${repo}/issues/${newNumber}`;
    content = updateFrontmatter(content, {
      github: githubUrl,
      updated: getTimestamp()
    });

    // Write to new file
    fs.writeFileSync(newFile, content, 'utf8');

    // Remove old file
    fs.unlinkSync(oldFile);

    console.log(`      ✓`);
  }

  console.log('\n✅ Task files renamed and frontmatter updated');
}

/**
 * Full epic sync workflow
 */
function syncEpic(epicPath) {
  console.log(`🚀 Starting full epic sync: ${epicPath}\n`);

  try {
    // Step 1: Create epic issue
    const epicIssueNumber = createEpicIssue(epicPath);

    // Step 2: Create task issues
    const taskMapping = createTaskIssues(epicPath, epicIssueNumber);

    // Step 3: Update epic file
    updateEpicFile(epicPath, epicIssueNumber, taskMapping);

    // Step 4: Update task references
    updateTaskReferences(epicPath, taskMapping);

    console.log(`\n✅ Epic sync complete!`);
    console.log(`   Epic: #${epicIssueNumber}`);
    console.log(`   Tasks: ${taskMapping.length} created and synced`);

    return { epicIssueNumber, taskMapping };
  } catch (error) {
    console.error(`\n❌ Epic sync failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * CLI interface
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  epicSync.js sync <epic-path>           - Full sync workflow');
    console.log('  epicSync.js create-epic <epic-path>    - Create epic issue only');
    console.log('  epicSync.js create-tasks <epic-path> <epic-number> - Create task issues only');
    console.log('  epicSync.js update-epic <epic-path> <epic-number>  - Update epic file only');
    console.log('');
    console.log('Examples:');
    console.log('  epicSync.js sync fullstack/01-infrastructure');
    console.log('  epicSync.js create-epic fullstack/01-infrastructure');
    process.exit(1);
  }

  switch (command) {
    case 'sync': {
      const epicPath = args[1];
      if (!epicPath) {
        console.error('Error: epic-path required');
        process.exit(1);
      }
      syncEpic(epicPath);
      break;
    }

    case 'create-epic': {
      const epicPath = args[1];
      if (!epicPath) {
        console.error('Error: epic-path required');
        process.exit(1);
      }
      const epicNumber = createEpicIssue(epicPath);
      console.log(`\nEpic issue number: ${epicNumber}`);
      break;
    }

    case 'create-tasks': {
      const epicPath = args[1];
      const epicNumber = parseInt(args[2]);
      if (!epicPath || !epicNumber) {
        console.error('Error: epic-path and epic-number required');
        process.exit(1);
      }
      createTaskIssues(epicPath, epicNumber);
      break;
    }

    case 'update-epic': {
      const epicPath = args[1];
      const epicNumber = parseInt(args[2]);
      if (!epicPath || !epicNumber) {
        console.error('Error: epic-path and epic-number required');
        process.exit(1);
      }
      // Load mapping file
      const mappingFile = path.join(process.cwd(), '.claude/epics', epicPath, '.task-mapping.txt');
      let mapping = [];
      if (fs.existsSync(mappingFile)) {
        const content = fs.readFileSync(mappingFile, 'utf8');
        mapping = content.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [oldName, newNumber] = line.split(' ');
            return { oldName, newNumber: parseInt(newNumber) };
          });
      }
      updateEpicFile(epicPath, epicNumber, mapping);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseMarkdownFile,
  updateFrontmatter,
  checkRepoProtection,
  readMandatoryFooter,
  createEpicIssue,
  createTaskIssues,
  updateEpicFile,
  updateTaskReferences,
  syncEpic
};
