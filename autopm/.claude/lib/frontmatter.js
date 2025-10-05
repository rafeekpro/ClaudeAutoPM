/**
 * Frontmatter Utilities
 *
 * Provides utilities for parsing, validating, and manipulating YAML frontmatter
 * in markdown files. Used by Local Mode for PRD, Epic, and Task management.
 *
 * Documentation Source: Context7 - /eemeli/yaml
 * Trust Score: 9.4, 100 code snippets
 */

const { parse, stringify } = require('yaml');
const fs = require('fs').promises;

/**
 * Parse YAML frontmatter from markdown content
 *
 * @param {string} content - Markdown content with optional frontmatter
 * @returns {{frontmatter: Object, body: string}} Parsed frontmatter and body
 *
 * @example
 * const { frontmatter, body } = parseFrontmatter(content);
 * console.log(frontmatter.id); // 'task-001'
 */
function parseFrontmatter(content) {
  if (!content || typeof content !== 'string') {
    return { frontmatter: {}, body: content || '' };
  }

  // Check for frontmatter delimiters
  // Handles both empty (---\n---\n) and non-empty frontmatter
  const frontmatterRegex = /^---\r?\n([\s\S]*?)^---\r?\n?([\s\S]*)$/m;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // No frontmatter found, return entire content as body
    return { frontmatter: {}, body: content };
  }

  const [, yamlContent, body] = match;

  // Handle empty frontmatter
  if (!yamlContent.trim()) {
    return { frontmatter: {}, body: body || '' };
  }

  try {
    // Parse YAML using Context7-documented pattern
    const frontmatter = parse(yamlContent);
    return {
      frontmatter: frontmatter || {},
      body: body || ''
    };
  } catch (error) {
    // Invalid YAML syntax
    throw new Error(`Invalid YAML syntax in frontmatter: ${error.message}`);
  }
}

/**
 * Stringify frontmatter and body into markdown format
 *
 * @param {Object} data - Frontmatter data object
 * @param {string} body - Markdown body content
 * @returns {string} Complete markdown with frontmatter
 *
 * @example
 * const markdown = stringifyFrontmatter({ id: 'task-001' }, 'Body content');
 */
function stringifyFrontmatter(data, body = '') {
  // Handle empty frontmatter - don't add empty object literal
  if (!data || Object.keys(data).length === 0) {
    return `---\n---\n${body}`;
  }

  // Use Context7-documented stringify with default options
  const yamlContent = stringify(data);

  // Format: ---\nYAML\n---\nBODY
  return `---\n${yamlContent}---\n${body}`;
}

/**
 * Update frontmatter fields in a file
 *
 * Supports nested field updates using dot notation:
 * - 'status' → updates top-level field
 * - 'providers.github.owner' → updates nested field
 *
 * @param {string} filePath - Path to markdown file
 * @param {Object} updates - Fields to update (supports dot notation for nested)
 * @returns {Promise<void>}
 *
 * @example
 * await updateFrontmatter('task.md', { status: 'done', 'metadata.updated': '2025-10-05' });
 */
async function updateFrontmatter(filePath, updates) {
  // Read existing file
  const content = await fs.readFile(filePath, 'utf8');

  // Parse current frontmatter
  const { frontmatter, body } = parseFrontmatter(content);

  // Apply updates (supports nested fields via dot notation)
  const updatedFrontmatter = { ...frontmatter };

  for (const [key, value] of Object.entries(updates)) {
    if (key.includes('.')) {
      // Nested field update: 'providers.github.owner'
      const keys = key.split('.');
      let current = updatedFrontmatter;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== 'object') {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]] = value;
    } else {
      // Top-level field update
      updatedFrontmatter[key] = value;
    }
  }

  // Write updated content
  const updated = stringifyFrontmatter(updatedFrontmatter, body);
  await fs.writeFile(filePath, updated, 'utf8');
}

/**
 * Validate frontmatter against schema
 *
 * Schema format:
 * {
 *   required: ['id', 'title', 'status'],
 *   fields: {
 *     id: { type: 'string', pattern: /^task-\d+$/ },
 *     status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
 *     tasks_total: { type: 'number' }
 *   }
 * }
 *
 * @param {Object} data - Frontmatter data to validate
 * @param {Object} schema - Validation schema
 * @returns {{valid: boolean, errors: string[]}} Validation result
 *
 * @example
 * const result = validateFrontmatter(data, schema);
 * if (!result.valid) console.error(result.errors);
 */
function validateFrontmatter(data, schema) {
  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check field types and constraints
  if (schema.fields) {
    for (const [field, constraints] of Object.entries(schema.fields)) {
      const value = data[field];

      // Skip validation if field is not present and not required
      if (value === undefined) {
        continue;
      }

      // Type validation
      if (constraints.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== constraints.type) {
          errors.push(`Field '${field}' must be of type ${constraints.type}, got ${actualType}`);
          continue; // Skip other validations if type is wrong
        }
      }

      // Enum validation
      if (constraints.enum && !constraints.enum.includes(value)) {
        errors.push(`Field '${field}' must be one of [${constraints.enum.join(', ')}], got '${value}' (invalid enum value)`);
      }

      // Pattern validation (for strings)
      if (constraints.pattern && typeof value === 'string') {
        if (!constraints.pattern.test(value)) {
          errors.push(`Field '${field}' does not match required pattern (pattern validation failed)`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Strip frontmatter and return only body content
 *
 * @param {string} content - Markdown content with optional frontmatter
 * @returns {string} Body content only
 *
 * @example
 * const body = stripBody(content);
 */
function stripBody(content) {
  const { body } = parseFrontmatter(content);
  return body;
}

module.exports = {
  parseFrontmatter,
  stringifyFrontmatter,
  updateFrontmatter,
  validateFrontmatter,
  stripBody
};
