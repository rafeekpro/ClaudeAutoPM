/**
 * Local PRD Listing Command
 *
 * Lists all Product Requirements Documents (PRDs) in local mode.
 * Supports filtering and sorting.
 *
 * Usage:
 *   /pm:prd-list --local
 *   /pm:prd-list --local --status approved
 *
 * @module pm-prd-list-local
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * Lists all local PRDs with optional filtering
 *
 * @param {Object} options - Listing options
 * @param {string} options.status - Filter by status (draft, approved, etc.)
 * @returns {Promise<Array>} Array of PRD metadata objects
 */
async function listLocalPRDs(options = {}) {
  const prdsDir = path.join(process.cwd(), '.claude', 'prds');

  // Ensure directory exists
  try {
    await fs.access(prdsDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return []; // No PRDs directory = no PRDs
    }
    throw err;
  }

  // Read directory
  const files = await fs.readdir(prdsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  // Parallelize file reading/parsing with Promise.allSettled
  const prdPromises = mdFiles.map(async (file) => {
    try {
      const filepath = path.join(prdsDir, file);
      const content = await fs.readFile(filepath, 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      // Only include files with valid frontmatter containing required fields
      // A valid PRD must have at least an 'id' field
      if (frontmatter && typeof frontmatter === 'object' && frontmatter.id) {
        return {
          filename: file,
          ...frontmatter
        };
      }
    } catch (err) {
      // Skip files that can't be parsed
      console.warn(`Warning: Could not parse ${file}:`, err.message);
    }
    return null;
  });

  const settled = await Promise.allSettled(prdPromises);
  const prds = settled
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
  // Filter by status if specified
  let filtered = prds;
  if (options.status) {
    filtered = filtered.filter(p => p.status === options.status);
  }

  // Sort by creation timestamp (newest first)
  filtered.sort((a, b) => {
    // Use createdAt if available (full timestamp), fallback to created (date only)
    const dateA = new Date(a.createdAt || a.created || 0);
    const dateB = new Date(b.createdAt || b.created || 0);
    return dateB - dateA;
  });

  return filtered;
}

/**
 * Formats PRD list for display
 *
 * @param {Array} prds - Array of PRD objects
 * @returns {string} Formatted string for display
 */
function formatPRDList(prds) {
  if (prds.length === 0) {
    return 'No PRDs found.';
  }

  const lines = ['', 'Local PRDs:', ''];

  prds.forEach((prd, index) => {
    lines.push(
      `${index + 1}. [${prd.id}] ${prd.title}`,
      `   Status: ${prd.status} | Priority: ${prd.priority} | Created: ${prd.created}`,
      ''
    );
  });

  return lines.join('\n');
}

module.exports = {
  listLocalPRDs,
  formatPRDList
};
