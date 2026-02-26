/**
 * Show Local Task
 *
 * Displays details of a specific task including blocking/blocked relationships.
 * Provides epic context and dependency information.
 *
 * Usage:
 *   const { showLocalTask } = require('./pm-task-show-local');
 *
 *   const task = await showLocalTask('epic-001', 'task-001');
 *   console.log(task.frontmatter.title);
 *   console.log(task.blocking); // Tasks this blocks
 *   console.log(task.blockedBy); // Tasks blocking this
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter } = require('../lib/frontmatter');
const { showLocalEpic } = require('./pm-epic-show-local');
const { listLocalTasks } = require('./pm-task-list-local');

/**
 * Get task details by ID
 *
 * @param {string} epicId - Epic ID containing the task
 * @param {string} taskId - Task ID (e.g., 'task-001')
 * @returns {Promise<Object>} Task object with frontmatter, body, and relationships
 * @throws {Error} If task not found
 */
async function showLocalTask(epicId, taskId) {
  const basePath = process.cwd();
  const epicsDir = path.join(basePath, '.claude', 'epics');

  // Find epic directory
  const dirs = await fs.readdir(epicsDir);
  const epicDir = dirs.find(dir => dir.startsWith(`${epicId}-`));

  if (!epicDir) {
    throw new Error(`Epic not found: ${epicId}`);
  }

  const epicDirPath = path.join(epicsDir, epicDir);

  // Find task file
  const taskFilename = taskId.endsWith('.md') ? taskId : `${taskId}.md`;
  const taskPath = path.join(epicDirPath, taskFilename);

  try {
    // Read task file
    const content = await fs.readFile(taskPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);

    // Get epic context
    const epic = await showLocalEpic(epicId);

    // Get all tasks to find blocking relationships
    const allTasks = await listLocalTasks(epicId);

    // Find tasks this task blocks (tasks that depend on this one)
    const taskFullId = frontmatter.id || taskId.replace('.md', '');
    const blocking = allTasks
      .filter(t => {
        const deps = t.dependencies || [];
        return deps.some(dep =>
          dep === taskFullId ||
          dep === taskId.replace('.md', '') ||
          dep === `task-${taskId.replace('.md', '').replace('task-', '')}`
        );
      })
      .map(t => t.id);

    // Tasks blocking this task (dependencies)
    const blockedBy = frontmatter.dependencies || [];

    return {
      frontmatter,
      body,
      epicTitle: epic.frontmatter.title,
      epicId,
      blocking,
      blockedBy,
      path: taskPath
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Task not found: ${taskId} in epic ${epicId}`);
    }
    throw err;
  }
}

module.exports = { showLocalTask };
