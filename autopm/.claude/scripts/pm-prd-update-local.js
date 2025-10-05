/**
 * Local PRD Update Command
 *
 * Updates frontmatter fields in a Product Requirements Document (PRD).
 *
 * Usage:
 *   /pm:prd-update --local <id> <field> <value>
 *
 * @module pm-prd-update-local
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter, stringifyFrontmatter } = require('../lib/frontmatter');

/**
 * Updates a frontmatter field in a PRD
 *
 * @param {string} id - PRD ID
 * @param {string} field - Frontmatter field to update
 * @param {*} value - New value for the field
 * @returns {Promise<Object>} Updated PRD data
 * @throws {Error} If PRD not found or parameters invalid
 */
async function updateLocalPRD(id, field, value) {
  // Validate parameters
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('PRD ID is required');
  }

  if (!field || typeof field !== 'string' || field.trim().length === 0) {
    throw new Error('Field is required');
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

  // Read all PRD files to find the target
  const files = await fs.readdir(prdsDir);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filepath = path.join(prdsDir, file);

    try {
      const content = await fs.readFile(filepath, 'utf8');
      const { frontmatter, body } = parseFrontmatter(content);

      if (frontmatter && frontmatter.id === id) {
        // Update the field
        const updatedFrontmatter = {
          ...frontmatter,
          [field]: value
        };

        // Reconstruct the file
        const updatedContent = stringifyFrontmatter(updatedFrontmatter, body);

        // Write back to file
        await fs.writeFile(filepath, updatedContent, 'utf8');

        return {
          filepath,
          filename: file,
          frontmatter: updatedFrontmatter,
          body
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
 * Updates multiple fields at once
 *
 * @param {string} id - PRD ID
 * @param {Object} updates - Object with field: value pairs
 * @returns {Promise<Object>} Updated PRD data
 */
async function updateMultipleFields(id, updates) {
  // Validate parameters
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('PRD ID is required');
  }
  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates must be an object');
  }

  const prdsDir = path.join(process.cwd(), '.claude', 'prds');
  let files;
  try {
    files = await fs.readdir(prdsDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`PRD not found: ${id}`);
    }
    throw err;
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filepath = path.join(prdsDir, file);

    try {
      const content = await fs.readFile(filepath, 'utf8');
      const { frontmatter, body } = parseFrontmatter(content);

      if (frontmatter && frontmatter.id === id) {
        // Apply all updates
        const updatedFrontmatter = {
          ...frontmatter,
          ...updates
        };

        const updatedContent = stringifyFrontmatter(updatedFrontmatter, body);
        await fs.writeFile(filepath, updatedContent, 'utf8');

        return {
          filepath,
          filename: file,
          frontmatter: updatedFrontmatter,
          body
        };
      }
    } catch (err) {
      continue;
    }
  }

  throw new Error(`PRD not found: ${id}`);
}

module.exports = {
  updateLocalPRD,
  updateMultipleFields
};
