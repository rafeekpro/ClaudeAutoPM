/**
 * Local PRD Show Command
 *
 * Displays a specific Product Requirements Document (PRD) by ID.
 *
 * Usage:
 *   /pm:prd-show --local <id>
 *
 * @module pm-prd-show-local
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * Shows a specific PRD by ID
 *
 * @param {string} id - PRD ID to display
 * @returns {Promise<Object>} PRD data including frontmatter and body
 * @throws {Error} If PRD not found or ID is invalid
 */
async function showLocalPRD(id) {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('PRD ID is required');
  }

  const prdsDir = path.join(process.cwd(), '.claude', 'prds');

  // Ensure directory exists
  try {
    await fs.access(prdsDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`PRD not found: ${id}`);
    }
    throw err;
  }

  // Read all PRD files
  const files = await fs.readdir(prdsDir);

  // Search for PRD by ID
  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filepath = path.join(prdsDir, file);

    try {
      const content = await fs.readFile(filepath, 'utf8');
      const { frontmatter, body } = parseFrontmatter(content);

      if (frontmatter && frontmatter.id === id) {
        return {
          filepath,
          filename: file,
          frontmatter,
          body,
          content
        };
      }
    } catch (err) {
      // Skip files that can't be parsed
      continue;
    }
  }

  // PRD not found
  throw new Error(`PRD not found: ${id}`);
}

/**
 * Formats PRD for display
 *
 * @param {Object} prd - PRD object from showLocalPRD
 * @returns {string} Formatted PRD for display
 */
function formatPRD(prd) {
  const { frontmatter, body } = prd;

  const header = [
    '',
    `PRD: ${frontmatter.title}`,
    `ID: ${frontmatter.id}`,
    `Status: ${frontmatter.status}`,
    `Priority: ${frontmatter.priority}`,
    `Created: ${frontmatter.created}`,
    `Author: ${frontmatter.author}`,
    `Version: ${frontmatter.version}`,
    '',
    '─'.repeat(80),
    ''
  ].join('\n');

  return header + body;
}

module.exports = {
  showLocalPRD,
  formatPRD
};
