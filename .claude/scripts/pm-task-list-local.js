/**
 * List Local Tasks
 *
 * Lists all tasks for a specific epic with optional filtering.
 * Tasks are read from `.claude/epics/<epic-id>/task-*.md` files.
 *
 * Usage:
 *   const { listLocalTasks } = require('./pm-task-list-local');
 *
 *   // List all tasks for epic
 *   const tasks = await listLocalTasks('epic-001');
 *
 *   // Filter by status
 *   const pending = await listLocalTasks('epic-001', { status: 'pending' });
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * List all tasks for an epic
 *
 * @param {string} epicId - Epic ID
 * @param {Object} options - Filter options
 * @param {string} [options.status] - Filter by task status
 * @returns {Promise<Array>} Array of task objects with frontmatter
 * @throws {Error} If epic not found
 */
async function listLocalTasks(epicId, options = {}) {
  const basePath = process.cwd();
  const epicsDir = path.join(basePath, '.claude', 'epics');

  // Find epic directory
  const dirs = await fs.readdir(epicsDir);
  const epicDir = dirs.find(dir => dir.startsWith(`${epicId}-`));

  if (!epicDir) {
    throw new Error(`Epic not found: ${epicId}`);
  }

  const epicDirPath = path.join(epicsDir, epicDir);

  // Read all files in epic directory
  const files = await fs.readdir(epicDirPath);
  const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.md'));

  const tasks = [];

  // Process each task file
  for (const taskFile of taskFiles) {
    try {
      const taskPath = path.join(epicDirPath, taskFile);
      const content = await fs.readFile(taskPath, 'utf8');
      const { frontmatter } = parseFrontmatter(content);

      if (frontmatter && frontmatter.id) {
        tasks.push({
          ...frontmatter,
          filename: taskFile
        });
      }
    } catch (err) {
      // Skip invalid task files
      console.warn(`Warning: Could not process task ${taskFile}:`, err.message);
    }
  }

  // Apply filters
  let filtered = tasks;

  if (options.status) {
    filtered = filtered.filter(task => task.status === options.status);
  }

  // Sort by task number (task-001, task-002, etc.)
  filtered.sort((a, b) => {
    const numA = parseInt(a.filename.match(/task-(\d+)/)?.[1] || '0');
    const numB = parseInt(b.filename.match(/task-(\d+)/)?.[1] || '0');
    return numA - numB;
  });

  return filtered;
}

module.exports = { listLocalTasks };
