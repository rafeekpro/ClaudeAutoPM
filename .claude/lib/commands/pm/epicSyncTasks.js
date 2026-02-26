#!/usr/bin/env node
/**
 * Epic Sync Tasks - Create GitHub issues for all tasks in an epic
 *
 * Modern Node.js replacement for bash scripts that had parsing issues.
 * Uses simple, testable code instead of complex shell heredocs.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Parse task file frontmatter and content
 */
function parseTaskFile(filePath) {
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
    body: bodyLines.join('\n').trim(),
    title: frontmatter.name || 'Untitled Task'
  };
}

/**
 * Create GitHub issue for a task
 */
function createTaskIssue(taskData, epicIssueNumber, epicPath, taskNumber) {
  const { title, body } = taskData;

  // Create issue body with epic reference
  const issueBody = `
Part of Epic #${epicIssueNumber}

---

${body}

---

**Epic Path:** \`${epicPath}\`
**Task Number:** ${taskNumber}
`.trim();

  // Escape quotes for shell
  const escapedTitle = title.replace(/"/g, '\\"');
  const escapedBody = issueBody.replace(/"/g, '\\"').replace(/`/g, '\\`');

  // Create GitHub issue
  try {
    const result = execSync(
      `gh issue create --title "${escapedTitle}" --body "${escapedBody}" --label "task"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const issueMatch = result.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/(\d+)/);
    if (issueMatch) {
      return parseInt(issueMatch[1]);
    }

    return null;
  } catch (error) {
    console.error(`❌ Failed to create issue for task ${taskNumber}:`, error.message);
    return null;
  }
}

/**
 * Update task file with GitHub issue number
 */
function updateTaskFrontmatter(filePath, issueNumber) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updatedContent = content.replace(
    /^github:.*$/m,
    `github: "#${issueNumber}"`
  );
  fs.writeFileSync(filePath, updatedContent, 'utf8');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: epicSyncTasks.js <epic-path> <epic-issue-number>');
    console.error('Example: epicSyncTasks.js fullstack/01-infrastructure 2');
    process.exit(1);
  }

  const [epicPath, epicIssueNumber] = args;
  const epicDir = path.join(process.cwd(), '.claude/epics', epicPath);

  if (!fs.existsSync(epicDir)) {
    console.error(`❌ Epic directory not found: ${epicDir}`);
    process.exit(1);
  }

  // Find all task files (numbered .md files)
  const taskFiles = fs.readdirSync(epicDir)
    .filter(f => /^\d+\.md$/.test(f))
    .sort();

  if (taskFiles.length === 0) {
    console.error(`❌ No task files found in ${epicDir}`);
    process.exit(1);
  }

  console.log(`📋 Creating ${taskFiles.length} task issues for epic #${epicIssueNumber}`);
  console.log(`📂 Epic path: ${epicPath}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const taskFile of taskFiles) {
    const taskNumber = taskFile.replace('.md', '');
    const taskPath = path.join(epicDir, taskFile);

    console.log(`[${successCount + failCount + 1}/${taskFiles.length}] Creating issue for task ${taskNumber}...`);

    try {
      const taskData = parseTaskFile(taskPath);
      const issueNumber = createTaskIssue(taskData, epicIssueNumber, epicPath, taskNumber);

      if (issueNumber) {
        updateTaskFrontmatter(taskPath, issueNumber);
        console.log(`   ✅ Created issue #${issueNumber}: ${taskData.title}`);
        successCount++;
      } else {
        console.log(`   ⚠️  Issue created but number not found`);
        failCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${taskFiles.length}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseTaskFile, createTaskIssue, updateTaskFrontmatter };
