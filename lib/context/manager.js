/**
 * Context Manager
 * Provides utilities for managing context files
 * TDD Phase: REFACTOR - Extracting common functionality
 * Task: 1.1
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Validates context name
 * @param {string} name - Context name to validate
 * @returns {boolean} - True if valid
 */
function validateContextName(name) {
  // Only alphanumeric, hyphens, and underscores allowed
  const pattern = /^[a-zA-Z0-9_-]+$/;
  return pattern.test(name);
}

/**
 * Loads template file
 * @param {string} templateName - Template name (without extension)
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string|null>} - Template content or null if not found
 */
async function loadTemplate(templateName, projectRoot) {
  const templatePath = path.join(projectRoot, '.claude', 'templates', `context-${templateName}.md`);

  try {
    const content = await fs.readFile(templatePath, 'utf8');
    return content;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Replaces template variables
 * @param {string} template - Template content
 * @param {object} variables - Variables to replace
 * @returns {string} - Processed template
 */
function processTemplate(template, variables) {
  let processed = template;

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(pattern, value);
  }

  return processed;
}

/**
 * Gets the context directory path
 * @param {string} projectRoot - Project root directory
 * @returns {string} - Context directory path
 */
function getContextDir(projectRoot) {
  return path.join(projectRoot, '.claude', 'contexts');
}

/**
 * Gets the context file path
 * @param {string} projectRoot - Project root directory
 * @param {string} name - Context name
 * @returns {string} - Context file path
 */
function getContextPath(projectRoot, name) {
  return path.join(getContextDir(projectRoot), `${name}.md`);
}

/**
 * Checks if context exists
 * @param {string} projectRoot - Project root directory
 * @param {string} name - Context name
 * @returns {Promise<boolean>} - True if exists
 */
async function contextExists(projectRoot, name) {
  const contextPath = getContextPath(projectRoot, name);
  try {
    await fs.access(contextPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Lists all contexts
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string[]>} - Array of context names
 */
async function listContexts(projectRoot) {
  const contextDir = getContextDir(projectRoot);

  try {
    const files = await fs.readdir(contextDir);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Reads context content
 * @param {string} projectRoot - Project root directory
 * @param {string} name - Context name
 * @returns {Promise<string>} - Context content
 */
async function readContext(projectRoot, name) {
  const contextPath = getContextPath(projectRoot, name);
  return await fs.readFile(contextPath, 'utf8');
}

/**
 * Gets default template content
 * @returns {string} - Default template
 */
function getDefaultTemplate() {
  return `# Context: {{name}}
Created: {{date}}
Type: {{type}}

## Description
{{description}}

## Content
<!-- Add context content here -->`;
}

/**
 * Gets the sessions directory path
 * @param {string} projectRoot - Project root directory
 * @returns {string} - Sessions directory path
 */
function getSessionsDir(projectRoot) {
  return path.join(projectRoot, '.claude', 'sessions');
}

/**
 * Creates a session
 * @param {string} projectRoot - Project root directory
 * @param {object} sessionData - Session data
 * @returns {Promise<void>}
 */
async function createSession(projectRoot, sessionData) {
  const sessionsDir = getSessionsDir(projectRoot);
  await fs.mkdir(sessionsDir, { recursive: true });

  const currentPath = path.join(sessionsDir, 'current.json');
  await fs.writeFile(currentPath, JSON.stringify(sessionData, null, 2));
}

/**
 * Gets current session
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<object|null>} - Current session or null
 */
async function getCurrentSession(projectRoot) {
  const currentPath = path.join(getSessionsDir(projectRoot), 'current.json');

  try {
    const data = await fs.readFile(currentPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Updates session history
 * @param {string} projectRoot - Project root directory
 * @param {object} session - Session to add to history
 * @returns {Promise<void>}
 */
async function updateSessionHistory(projectRoot, session) {
  const sessionsDir = getSessionsDir(projectRoot);
  const historyPath = path.join(sessionsDir, 'history.json');

  let history = [];
  try {
    const data = await fs.readFile(historyPath, 'utf8');
    history = JSON.parse(data);
  } catch (error) {
    // History file doesn't exist yet
  }

  history.push(session);

  // Keep only last 100 entries
  if (history.length > 100) {
    history = history.slice(-100);
  }

  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
}

/**
 * Creates a backup of a context file
 * @param {string} projectRoot - Project root directory
 * @param {string} name - Context name
 * @returns {Promise<string>} - Backup file path
 */
async function createContextBackup(projectRoot, name) {
  const content = await readContext(projectRoot, name);
  const backupDir = path.join(projectRoot, '.claude', 'contexts', '.backups');
  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `${name}_${timestamp}.md`);
  await fs.writeFile(backupPath, content);

  return backupPath;
}

/**
 * Updates context update history
 * @param {string} projectRoot - Project root directory
 * @param {string} name - Context name
 * @param {object} updateInfo - Update information
 * @returns {Promise<void>}
 */
async function updateContextHistory(projectRoot, name, updateInfo) {
  const historyDir = path.join(projectRoot, '.claude', 'contexts', '.history');
  await fs.mkdir(historyDir, { recursive: true });

  const historyPath = path.join(historyDir, `${name}.json`);

  let history = [];
  try {
    const data = await fs.readFile(historyPath, 'utf8');
    history = JSON.parse(data);
  } catch (error) {
    // History doesn't exist yet
  }

  history.push({
    timestamp: new Date().toISOString(),
    ...updateInfo
  });

  // Keep last 50 updates
  if (history.length > 50) {
    history = history.slice(-50);
  }

  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
}

/**
 * Writes updated context content
 * @param {string} projectRoot - Project root directory
 * @param {string} name - Context name
 * @param {string} content - New content
 * @returns {Promise<void>}
 */
async function writeContext(projectRoot, name, content) {
  const contextPath = getContextPath(projectRoot, name);
  await fs.writeFile(contextPath, content);
}

module.exports = {
  validateContextName,
  loadTemplate,
  processTemplate,
  getContextDir,
  getContextPath,
  contextExists,
  listContexts,
  readContext,
  writeContext,
  getDefaultTemplate,
  getSessionsDir,
  createSession,
  getCurrentSession,
  updateSessionHistory,
  createContextBackup,
  updateContextHistory
};