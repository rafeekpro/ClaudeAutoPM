/**
 * Update Local Epic
 *
 * Updates epic frontmatter fields while preserving body content.
 * Supports updating single or multiple fields at once.
 *
 * Usage:
 *   const { updateLocalEpic } = require('./pm-epic-update-local');
 *
 *   // Update status
 *   await updateLocalEpic('epic-001', { status: 'in_progress' });
 *
 *   // Update multiple fields
 *   await updateLocalEpic('epic-001', {
 *     status: 'completed',
 *     tasks_completed: 5
 *   });
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter, stringifyFrontmatter } = require('../lib/frontmatter');
const { showLocalEpic } = require('./pm-epic-show-local');

/**
 * Update epic frontmatter fields
 *
 * @param {string} epicId - Epic ID to update
 * @param {Object} updates - Fields to update in frontmatter
 * @returns {Promise<Object>} Updated epic object
 * @throws {Error} If epic not found
 */
async function updateLocalEpic(epicId, updates) {
  // Get current epic
  const epic = await showLocalEpic(epicId);

  // Merge updates into frontmatter
  const updatedFrontmatter = {
    ...epic.frontmatter,
    ...updates
  };

  // Preserve body content
  const updatedContent = stringifyFrontmatter(updatedFrontmatter, epic.body);

  // Write updated content back to file
  await fs.writeFile(epic.path, updatedContent, 'utf8');

  return {
    epicId,
    frontmatter: updatedFrontmatter,
    body: epic.body
  };
}

module.exports = { updateLocalEpic };
