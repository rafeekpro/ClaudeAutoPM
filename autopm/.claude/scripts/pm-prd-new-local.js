/**
 * Local PRD Creation Command
 *
 * Creates a new Product Requirements Document (PRD) in local mode.
 * PRDs are stored in .claude/prds/ directory.
 *
 * Usage:
 *   /pm:prd-new --local "Feature Name"
 *
 * @module pm-prd-new-local
 */

const fs = require('fs').promises;
const path = require('path');
const { stringifyFrontmatter } = require('../lib/frontmatter');

/**
 * Creates a new PRD in the local .claude/prds/ directory
 *
 * @param {string} name - PRD title/name
 * @param {Object} options - Optional configuration
 * @param {string} options.id - Custom PRD ID (auto-generated if not provided)
 * @param {string} options.author - Author name (default: 'ClaudeAutoPM')
 * @param {string} options.priority - Priority level (default: 'medium')
 * @returns {Promise<Object>} Created PRD metadata
 * @throws {Error} If name is invalid or PRD already exists
 */
async function createLocalPRD(name, options = {}) {
  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('PRD name is required and must be a non-empty string');
  }

  const sanitizedName = name.trim();

  // Generate unique ID
  const id = options.id || generatePRDId();

  // Create frontmatter
  const now = new Date();
  const frontmatter = {
    id,
    title: sanitizedName,
    created: now.toISOString().split('T')[0],
    createdAt: now.toISOString(), // Include full timestamp for sorting
    author: options.author || 'ClaudeAutoPM',
    status: 'draft',
    priority: options.priority || 'medium',
    version: '1.0'
  };

  // Create PRD body template
  const body = createPRDTemplate(sanitizedName);

  // Generate full markdown content
  const content = stringifyFrontmatter(frontmatter, body);

  // Generate filename (sanitize name + add ID for uniqueness)
  const filename = `${id}-${sanitizeFilename(sanitizedName)}`;
  const filepath = path.join(process.cwd(), '.claude', 'prds', filename);

  // Check if file already exists
  try {
    await fs.access(filepath);
    throw new Error(`PRD already exists: ${filename}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  // Ensure directory exists
  await fs.mkdir(path.dirname(filepath), { recursive: true });

  // Write to file
  await fs.writeFile(filepath, content, 'utf8');

  return {
    id,
    filepath,
    frontmatter
  };
}

/**
 * Creates a PRD template with standard sections
 *
 * @param {string} name - PRD title
 * @returns {string} PRD template content
 */
function createPRDTemplate(name) {
  return `# Product Requirements Document: ${name}

## 1. Executive Summary

### Overview
[Describe the feature/product in 2-3 sentences]

### Business Value
[Why is this important?]

### Success Metrics
[How will we measure success?]

## 2. Background

### Problem Statement
[What problem are we solving?]

### Current State
[What exists today?]

### Goals and Objectives
[What are we trying to achieve?]

## 3. User Stories

[Epic-level user stories]

## 4. Functional Requirements

[Detailed requirements]

## 5. Non-Functional Requirements

[Performance, security, etc.]

## 6. Out of Scope

[What we're NOT doing]

## 7. Timeline

[Key milestones]
`;
}

// Counter for ensuring unique IDs even when created at the same millisecond
let idCounter = 0;

/**
 * Generates a unique PRD ID
 *
 * Format: prd-XXX (3 digits from timestamp + counter)
 *
 * @returns {string} Generated PRD ID
 */
function generatePRDId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 900) + 100; // 100-999
  const counter = (idCounter++) % 10; // 0-9 cycling counter

  // Use last digit of timestamp + last 2 digits of random = 3 digits total
  const suffix = (timestamp % 10).toString() +
                 (Math.floor(random / 10) % 10).toString() +
                 counter.toString();

  return `prd-${suffix}`;
}

/**
 * Sanitizes a PRD name for use as a filename
 *
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters except hyphens
 * - Truncates to safe length (max 100 chars before .md)
 * - Adds .md extension
 *
 * @param {string} name - PRD name to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(name) {
  const sanitized = name
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')     // Remove special characters
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens

  // Truncate to safe length (100 chars + .md = 103 total)
  // With prd-XXX- prefix (8 chars), max base name is ~92 chars
  const maxLength = 92;
  const truncated = sanitized.length > maxLength
    ? sanitized.substring(0, maxLength)
    : sanitized;

  return truncated + '.md';
}

module.exports = {
  createLocalPRD,
  createPRDTemplate,
  generatePRDId,
  sanitizeFilename
};
