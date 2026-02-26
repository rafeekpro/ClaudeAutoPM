/**
 * Update Local Task
 *
 * Updates task frontmatter and automatically updates epic counters.
 * Optionally validates dependency constraints.
 *
 * Usage:
 *   const { updateLocalTask } = require('./pm-task-update-local');
 *
 *   // Update task status
 *   await updateLocalTask('epic-001', 'task-001', { status: 'completed' });
 *
 *   // Update with dependency validation
 *   await updateLocalTask('epic-001', 'task-002', {
 *     status: 'completed',
 *     validateDependencies: true
 *   });
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter, stringifyFrontmatter } = require('../lib/frontmatter');
const { showLocalTask } = require('./pm-task-show-local');
const { listLocalTasks } = require('./pm-task-list-local');
const { updateLocalEpic } = require('./pm-epic-update-local');

/**
 * Update task frontmatter
 *
 * @param {string} epicId - Epic ID containing the task
 * @param {string} taskId - Task ID to update
 * @param {Object} updates - Fields to update
 * @param {boolean} [updates.validateDependencies] - Validate dependencies before update
 * @returns {Promise<Object>} Updated task object
 * @throws {Error} If task not found or dependencies not met
 */
async function updateLocalTask(epicId, taskId, updates) {
  const { validateDependencies, ...frontmatterUpdates } = updates;

  // Get current task
  const task = await showLocalTask(epicId, taskId);

  // Validate dependencies if requested and status is changing to completed
  if (validateDependencies && frontmatterUpdates.status === 'completed') {
    const dependencies = task.frontmatter.dependencies || [];

    if (dependencies.length > 0) {
      // Check if all dependencies are completed
      const allTasks = await listLocalTasks(epicId);

      for (const depId of dependencies) {
        const depTask = allTasks.find(t =>
          t.id === depId ||
          t.id === `task-${epicId}-${depId.replace('task-', '')}` ||
          t.filename === `${depId}.md`
        );

        if (depTask && depTask.status !== 'completed') {
          throw new Error(
            `Dependencies not met: ${depId} (status: ${depTask.status}) must be completed first`
          );
        }
      }
    }
  }

  // Track if status changed to/from completed
  const oldStatus = task.frontmatter.status;
  const newStatus = frontmatterUpdates.status || oldStatus;
  const statusChanged = oldStatus !== newStatus;
  const wasCompleted = oldStatus === 'completed';
  const nowCompleted = newStatus === 'completed';

  // Merge updates into frontmatter
  const updatedFrontmatter = {
    ...task.frontmatter,
    ...frontmatterUpdates
  };

  // Preserve body content
  const updatedContent = stringifyFrontmatter(updatedFrontmatter, task.body);

  // Write updated content back to file
  await fs.writeFile(task.path, updatedContent, 'utf8');

  // Update epic tasks_completed counter if status changed
  if (statusChanged && (wasCompleted || nowCompleted)) {
    const allTasks = await listLocalTasks(epicId);
    const completedCount = allTasks.filter(t => {
      if (t.id === task.frontmatter.id || t.id === updatedFrontmatter.id) {
        return nowCompleted;
      }
      return t.status === 'completed';
    }).length;

    await updateLocalEpic(epicId, {
      tasks_completed: completedCount
    });
  }

  return {
    taskId,
    epicId,
    frontmatter: updatedFrontmatter,
    body: task.body
  };
}

module.exports = { updateLocalTask };
