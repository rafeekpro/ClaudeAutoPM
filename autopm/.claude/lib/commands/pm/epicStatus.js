#!/usr/bin/env node
/**
 * Epic Status - Complete epic progress tracking
 *
 * Replaces epic-status.sh with clean, testable JavaScript
 * - Counts tasks by status (completed/in-progress/pending)
 * - Calculates progress percentage
 * - Shows progress bar visualization
 * - Provides sub-epic breakdown
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let inFrontmatter = false;
    let frontmatterCount = 0;
    const frontmatter = {};

    for (const line of lines) {
      if (line === '---') {
        frontmatterCount++;
        if (frontmatterCount === 1) {
          inFrontmatter = true;
          continue;
        } else if (frontmatterCount === 2) {
          break;
        }
      }

      if (inFrontmatter) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          frontmatter[key] = value;
        }
      }
    }

    return frontmatter;
  } catch (error) {
    return {};
  }
}

/**
 * Find all task files in directory
 */
function findTaskFiles(dir, maxDepth = 2, currentDepth = 0) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return [];
  }

  if (currentDepth >= maxDepth) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && /^\d+\.md$/.test(entry.name)) {
      files.push(fullPath);
    } else if (entry.isDirectory() && currentDepth < maxDepth - 1) {
      files.push(...findTaskFiles(fullPath, maxDepth, currentDepth + 1));
    }
  }

  return files;
}

/**
 * Count tasks by status
 */
function countTasksByStatus(taskFiles) {
  const counts = {
    completed: 0,
    in_progress: 0,
    pending: 0,
    total: taskFiles.length
  };

  for (const taskFile of taskFiles) {
    const frontmatter = parseFrontmatter(taskFile);
    const status = frontmatter.status || '';

    if (status === 'completed') {
      counts.completed++;
    } else if (status === 'in-progress' || status === 'in_progress') {
      counts.in_progress++;
    } else {
      counts.pending++;
    }
  }

  return counts;
}

/**
 * Generate progress bar
 */
function generateProgressBar(percentage, length = 50) {
  const filled = Math.round((percentage * length) / 100);
  const empty = length - filled;

  const bar = '='.repeat(filled) + '-'.repeat(empty);
  return `[${bar}] ${percentage}%`;
}

/**
 * Get sub-epic breakdown
 */
function getSubEpicBreakdown(epicDir) {
  const breakdown = [];

  if (!fs.existsSync(epicDir)) {
    return breakdown;
  }

  const entries = fs.readdirSync(epicDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(epicDir, entry.name);
      const taskFiles = findTaskFiles(subDir, 1);

      if (taskFiles.length > 0) {
        const counts = countTasksByStatus(taskFiles);
        breakdown.push({
          name: entry.name,
          total: counts.total,
          completed: counts.completed
        });
      }
    }
  }

  return breakdown;
}

/**
 * Format epic status report
 */
function formatEpicStatus(epicName, epicDir) {
  // Find all tasks
  const taskFiles = findTaskFiles(epicDir);
  const counts = countTasksByStatus(taskFiles);

  // Calculate progress
  const progress = counts.total > 0
    ? Math.round((counts.completed * 100) / counts.total)
    : 0;

  // Build report
  const lines = [];
  lines.push(`Epic: ${epicName}`);
  lines.push('='.repeat(20 + epicName.length));
  lines.push('');
  lines.push(`Total tasks:     ${counts.total}`);
  lines.push(`Completed:       ${counts.completed} (${progress}%)`);
  lines.push(`In Progress:     ${counts.in_progress}`);
  lines.push(`Pending:         ${counts.pending}`);
  lines.push('');

  // Progress bar
  if (counts.total > 0) {
    lines.push(`Progress: ${generateProgressBar(progress)}`);
    lines.push('');
  }

  // Sub-epic breakdown
  const breakdown = getSubEpicBreakdown(epicDir);
  if (breakdown.length > 0) {
    lines.push('Sub-Epic Breakdown:');
    lines.push('-'.repeat(19));

    for (const sub of breakdown) {
      const name = sub.name.padEnd(30);
      lines.push(`  ${name} ${sub.total.toString().padStart(3)} tasks (${sub.completed} completed)`);
    }
  }

  return lines.join('\n');
}

/**
 * List available epics
 */
function listAvailableEpics(epicsDir) {
  if (!fs.existsSync(epicsDir)) {
    return [];
  }

  const entries = fs.readdirSync(epicsDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const epicName = args[0];

  const epicsDir = path.join(process.cwd(), '.claude/epics');

  if (!epicName) {
    console.log('Usage: epicStatus.js <epic-name>');
    console.log('');
    console.log('Available epics:');

    const epics = listAvailableEpics(epicsDir);
    if (epics.length > 0) {
      epics.forEach(epic => console.log(`  ${epic}`));
    } else {
      console.log('  No epics found');
    }

    process.exit(1);
  }

  const epicDir = path.join(epicsDir, epicName);

  if (!fs.existsSync(epicDir)) {
    console.error(`Error: Epic '${epicName}' not found`);
    console.log('');
    console.log('Available epics:');

    const epics = listAvailableEpics(epicsDir);
    epics.forEach(epic => console.log(`  ${epic}`));

    process.exit(1);
  }

  // Generate and display status
  const status = formatEpicStatus(epicName, epicDir);
  console.log(status);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseFrontmatter,
  findTaskFiles,
  countTasksByStatus,
  generateProgressBar,
  getSubEpicBreakdown,
  formatEpicStatus,
  listAvailableEpics
};
