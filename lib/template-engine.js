/**
 * Template Engine - Pure Node.js Implementation
 *
 * NO external dependencies - uses only built-in Node.js modules
 *
 * Features:
 * - Variable substitution: {{variable}}
 * - Conditionals: {{#if variable}}...{{/if}}
 * - Loops: {{#each items}}...{{/each}}
 * - Auto-generated variables: id, timestamp, author, date
 * - Template discovery: user custom overrides built-in
 *
 * @example Basic Usage
 * ```javascript
 * const TemplateEngine = require('./lib/template-engine');
 * const engine = new TemplateEngine();
 *
 * // Find template
 * const templatePath = engine.findTemplate('prds', 'api-feature');
 *
 * // Render with variables
 * const rendered = engine.renderFile(templatePath, {
 *   title: 'User Authentication API',
 *   priority: 'P0',
 *   problem: 'Users cannot login securely'
 * });
 * ```
 *
 * @example Advanced Features
 * ```javascript
 * // Template with conditionals and loops
 * const template = `
 * # {{title}}
 *
 * {{#if description}}
 * ## Description
 * {{description}}
 * {{/if}}
 *
 * ## Features
 * {{#each features}}
 * - {{this}}
 * {{/each}}
 * `;
 *
 * const result = engine.render(template, {
 *   title: 'My Feature',
 *   description: 'Feature description',
 *   features: ['Auth', 'API', 'UI']
 * });
 * ```
 *
 * @module TemplateEngine
 * @version 1.0.0
 * @since v1.28.0
 */

const fs = require('fs');
const path = require('path');

class TemplateEngine {
  constructor(builtInDir, userDir) {
    // For testing, allow custom built-in directory and user directory
    // In production, use .claude/templates (framework templates are copied during installation)
    this.builtInDir = builtInDir || path.join(__dirname, '..', '.claude', 'templates');
    this.userDir = userDir || path.join('.claude', 'templates');
  }

  /**
   * Find template by name
   * Priority: user templates > built-in templates
   *
   * @param {string} type - Template type (prds/epics/tasks)
   * @param {string} name - Template name (without .md extension)
   * @returns {string|null} - Path to template or null if not found
   */
  findTemplate(type, name) {
    const userPath = path.resolve(this.userDir, type, `${name}.md`);
    const builtInPath = path.resolve(this.builtInDir, type, `${name}.md`);

    if (fs.existsSync(userPath)) return userPath;
    if (fs.existsSync(builtInPath)) return builtInPath;
    return null;
  }

  /**
   * List all available templates of a given type
   *
   * @param {string} type - Template type (prds/epics/tasks)
   * @returns {Array<{name: string, custom: boolean}>}
   */
  listTemplates(type) {
    const templates = [];

    // Built-in templates
    const builtInPath = path.join(this.builtInDir, type);
    if (fs.existsSync(builtInPath)) {
      const files = fs.readdirSync(builtInPath)
        .filter(f => f.endsWith('.md'))
        .map(f => ({ name: f.replace('.md', ''), custom: false }));
      templates.push(...files);
    }

    // User custom templates
    const userPath = path.join(this.userDir, type);
    if (fs.existsSync(userPath)) {
      const files = fs.readdirSync(userPath)
        .filter(f => f.endsWith('.md'))
        .map(f => ({ name: f.replace('.md', ''), custom: true }));
      templates.push(...files);
    }

    return templates;
  }

  /**
   * Generate auto variables
   *
   * @returns {Object} - Auto-generated variables
   */
  generateAutoVariables() {
    const now = new Date();
    return {
      id: '', // Will be set by generateId()
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      author: process.env.USER || process.env.USERNAME || 'unknown'
    };
  }

  /**
   * Generate sequential ID
   *
   * @param {string} prefix - ID prefix (prd/epic/task)
   * @param {string} directory - Directory to scan for existing IDs
   * @returns {string} - Next sequential ID
   */
  generateId(prefix, directory) {
    if (!fs.existsSync(directory)) {
      return `${prefix}-001`;
    }

    const files = fs.readdirSync(directory)
      .filter(f => f.startsWith(`${prefix}-`) && f.endsWith('.md'));

    if (files.length === 0) {
      return `${prefix}-001`;
    }

    // Extract numbers and find max
    const numbers = files
      .map(f => {
        const match = f.match(new RegExp(`${prefix}-(\\d+)\\.md`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNum = Math.max(...numbers);
    const nextNum = maxNum + 1;

    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Render template with variables
   *
   * @param {string} template - Template string
   * @param {Object} variables - Variables to substitute
   * @returns {string} - Rendered template
   */
  render(template, variables) {
    // Auto-generate variables
    const autoVars = this.generateAutoVariables();

    // Generate ID if not provided
    if (!variables.id && !autoVars.id) {
      // Try to infer type and directory from variables
      const type = variables.type || 'item';
      const directory = `.claude/${type}s`;
      autoVars.id = this.generateId(type, directory);
    }

    const allVars = { ...autoVars, ...variables };

    let content = template;

    // Process loops first ({{#each}}...{{/each}})
    content = this.processLoops(content, allVars);

    // Process conditionals ({{#if}}...{{/if}})
    content = this.processConditionals(content, allVars);

    // Simple variable substitution ({{variable}})
    for (const [key, value] of Object.entries(allVars)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value || '');
    }

    // Replace any remaining {{variables}} that weren't in allVars with empty string
    content = content.replace(/\{\{(\w+)\}\}/g, '');

    return content;
  }

  /**
   * Render template from file
   *
   * @param {string} templatePath - Path to template file
   * @param {Object} variables - Variables to substitute
   * @returns {string} - Rendered template
   */
  renderFile(templatePath, variables) {
    const template = fs.readFileSync(templatePath, 'utf8');
    return this.render(template, variables);
  }

  /**
   * Process conditionals {{#if var}}...{{/if}}
   *
   * @param {string} content - Template content
   * @param {Object} vars - Variables
   * @returns {string} - Processed content
   */
  processConditionals(content, vars) {
    // Match {{#if variable}}...{{/if}} - process from inside out for nested conditionals
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/;

    let result = content;
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;

    // Keep processing until no more conditionals found (handles nesting)
    while (changed && iterations < maxIterations) {
      iterations++;
      changed = false;

      const match = result.match(ifRegex);
      if (match) {
        const [fullMatch, varName, innerContent] = match;
        const varValue = vars[varName];

        // If variable is truthy, keep inner content; otherwise remove
        const replacement = varValue ? innerContent : '';
        result = result.replace(fullMatch, replacement);
        changed = true;
      }
    }

    return result;
  }

  /**
   * Process loops {{#each items}}...{{/each}}
   *
   * @param {string} content - Template content
   * @param {Object} vars - Variables
   * @returns {string} - Processed content
   */
  processLoops(content, vars) {
    // Match {{#each variable}}...{{/each}}
    // Limit inner content to 10,000 characters to prevent ReDoS
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]{0,10000}?)\{\{\/each\}\}/g;

    let result = content;
    let match;

    // Safety counter
    let iterations = 0;
    const maxIterations = 100;

    while ((match = eachRegex.exec(content)) !== null && iterations < maxIterations) {
      iterations++;
      const [fullMatch, varName, template] = match;
      const items = vars[varName];

      if (!Array.isArray(items)) {
        // Not an array, remove the loop
        result = result.replace(fullMatch, '');
        continue;
      }

      // Render each item
      let rendered = '';
      for (const item of items) {
        if (typeof item === 'object' && item !== null) {
          // Object: replace {{property}} with object properties
          let itemRendered = template;
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            itemRendered = itemRendered.replace(regex, value || '');
          }
          rendered += itemRendered;
        } else {
          // Primitive: replace {{this}} with the value
          rendered += template.replace(/\{\{this\}\}/g, item);
        }
      }

      result = result.replace(fullMatch, rendered);
    }

    return result;
  }

  /**
   * Validate template
   *
   * @param {string} template - Template string
   * @returns {Object} - {valid: boolean, errors: string[]}
   */
  validate(template) {
    const errors = [];

    // Check frontmatter
    if (!template.startsWith('---')) {
      errors.push('Missing frontmatter');
    }

    // Check required variables
    const requiredVars = ['id', 'title', 'type'];
    for (const varName of requiredVars) {
      if (!template.includes(`{{${varName}}}`)) {
        errors.push(`Missing required variable: {{${varName}}}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Ensure template directory exists
   *
   * @param {string} type - Template type (prds/epics/tasks)
   */
  ensureTemplateDir(type) {
    const dir = path.join(this.userDir, type);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = TemplateEngine;
