/**
 * Show Local Epic
 *
 * Displays details of a specific epic including frontmatter,
 * body content, and directory information.
 *
 * Usage:
 *   const { showLocalEpic } = require('./pm-epic-show-local');
 *
 *   const epic = await showLocalEpic('epic-001');
 *   console.log(epic.frontmatter.title);
 *   console.log(epic.body);
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * Get epic details by ID
 *
 * @param {string} epicId - Epic ID to retrieve
 * @returns {Promise<Object>} Epic object with frontmatter, body, and directory
 * @throws {Error} If epic not found
 */
async function showLocalEpic(epicId) {
  const basePath = process.cwd();
  const epicsDir = path.join(basePath, '.claude', 'epics');

  // Check if epics directory exists
  try {
    await fs.access(epicsDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Epic not found: ${epicId} (epics directory does not exist)`);
    }
    throw err;
  }

  // Find epic directory by ID
  const dirs = await fs.readdir(epicsDir);
  const epicDir = dirs.find(dir => dir.startsWith(`${epicId}-`));

  if (!epicDir) {
    throw new Error(`Epic not found: ${epicId}`);
  }

  const epicDirPath = path.join(epicsDir, epicDir);
  const epicPath = path.join(epicDirPath, 'epic.md');

  // Read and parse epic file
  try {
    const content = await fs.readFile(epicPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);

    return {
      frontmatter,
      body,
      directory: epicDir,
      path: epicPath
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Epic not found: ${epicId} (epic.md missing in ${epicDir})`);
    }
    throw err;
  }
}

module.exports = { showLocalEpic };
