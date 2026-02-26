/**
 * List Local Epics
 *
 * Lists all epics in the local `.claude/epics/` directory
 * with optional filtering by status or PRD ID.
 *
 * Usage:
 *   const { listLocalEpics } = require('./pm-epic-list-local');
 *
 *   // List all epics
 *   const epics = await listLocalEpics();
 *
 *   // Filter by status
 *   const inProgress = await listLocalEpics({ status: 'in_progress' });
 *
 *   // Filter by PRD
 *   const prdEpics = await listLocalEpics({ prd_id: 'prd-001' });
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * List all local epics with optional filtering
 *
 * @param {Object} options - Filter options
 * @param {string} [options.status] - Filter by epic status (planning, in_progress, completed, etc.)
 * @param {string} [options.prd_id] - Filter by PRD ID
 * @returns {Promise<Array>} Array of epic objects with frontmatter
 */
async function listLocalEpics(options = {}) {
  const basePath = process.cwd();
  const epicsDir = path.join(basePath, '.claude', 'epics');

  // Check if epics directory exists
  try {
    await fs.access(epicsDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return []; // No epics directory = no epics
    }
    throw err;
  }

  // Read all epic directories
  const dirs = await fs.readdir(epicsDir);
  const epics = [];

  // Process each epic directory
  for (const dir of dirs) {
    // Skip hidden directories and files
    if (dir.startsWith('.')) continue;

    const epicDir = path.join(epicsDir, dir);
    const epicPath = path.join(epicDir, 'epic.md');

    try {
      // Check if it's a directory with epic.md
      const stat = await fs.stat(epicDir);
      if (!stat.isDirectory()) continue;

      // Read and parse epic.md
      const content = await fs.readFile(epicPath, 'utf8');
      const { frontmatter } = parseFrontmatter(content);

      // Only include valid epics with required fields
      if (frontmatter && frontmatter.id) {
        epics.push({
          ...frontmatter,
          directory: dir
        });
      }
    } catch (err) {
      // Skip invalid epic directories (missing epic.md, parse errors, etc.)
      if (err.code !== 'ENOENT') {
        console.warn(`Warning: Could not process epic in ${dir}:`, err.message);
      }
    }
  }

  // Apply filters
  let filtered = epics;

  if (options.status) {
    filtered = filtered.filter(epic => epic.status === options.status);
  }

  if (options.prd_id) {
    filtered = filtered.filter(epic => epic.prd_id === options.prd_id);
  }

  // Sort by creation date (newest first)
  filtered.sort((a, b) => {
    const dateA = new Date(a.created || 0);
    const dateB = new Date(b.created || 0);
    return dateB - dateA; // Descending order (newest first)
  });

  return filtered;
}

module.exports = { listLocalEpics };
