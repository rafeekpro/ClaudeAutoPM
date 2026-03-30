/**
 * XML Template Reader
 *
 * Reads XML templates, generates markdown with frontmatter,
 * and validates content against template rules.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse XML template file into structured object
 * @param {string} templatePath - absolute or relative path to .xml template
 * @returns {{ id: string, version: string, frontmatter: Object[], sections: Object[], validation: string[] }}
 */
function readTemplate(templatePath) {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const xml = fs.readFileSync(templatePath, 'utf8');

  // Parse template id and version
  const templateMatch = xml.match(/<template\s+id="([^"]+)"\s+version="([^"]+)">/);
  const id = templateMatch ? templateMatch[1] : 'unknown';
  const version = templateMatch ? templateMatch[2] : '1.0';

  // Parse frontmatter fields
  const frontmatter = [];
  const fieldRegex = /<field\s+([^/]*?)\/>/g;
  let fieldMatch;
  while ((fieldMatch = fieldRegex.exec(xml)) !== null) {
    const attrs = fieldMatch[1];
    frontmatter.push({
      name: extractAttr(attrs, 'name'),
      type: extractAttr(attrs, 'type'),
      required: extractAttr(attrs, 'required') === 'true',
      auto: extractAttr(attrs, 'auto') === 'true',
      values: extractAttr(attrs, 'values'),
      default: extractAttr(attrs, 'default')
    });
  }

  // Parse sections
  const sections = [];
  const sectionRegex = /<section\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/section>)/g;
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(xml)) !== null) {
    const attrs = sectionMatch[1];
    sections.push({
      name: extractAttr(attrs, 'name'),
      heading: extractAttr(attrs, 'heading'),
      required: extractAttr(attrs, 'required') === 'true',
      placeholder: (sectionMatch[2] || '').trim()
    });
  }

  // Parse validation rules
  const validation = [];
  const ruleRegex = /<rule>([\s\S]*?)<\/rule>/g;
  let ruleMatch;
  while ((ruleRegex.exec(xml)) !== null) {
    validation.push(RegExp.$1.trim());
  }

  return { id, version, frontmatter, sections, validation };
}

/**
 * Generate markdown content from template and data
 * @param {Object} template - parsed template from readTemplate()
 * @param {Object} data - field values and section content
 * @returns {string} markdown with YAML frontmatter
 */
function generateMarkdown(template, data = {}) {
  const now = new Date().toISOString();
  const lines = ['---'];

  // Generate frontmatter
  for (const field of template.frontmatter) {
    let value;

    if (data[field.name] !== undefined) {
      value = data[field.name];
    } else if (field.auto && field.type === 'datetime') {
      value = now;
    } else if (field.auto && field.type === 'int') {
      value = data[field.name] || 0;
    } else if (field.default !== undefined && field.default !== null) {
      value = field.default;
    } else if (field.type === 'datetime') {
      value = '""';
    } else {
      value = '';
    }

    // Format value based on type
    if (field.type === 'string' && typeof value === 'string' && (value.includes(':') || value.includes('"'))) {
      lines.push(`${field.name}: "${value.replace(/"/g, '\\"')}"`);
    } else if (field.type === 'array') {
      if (Array.isArray(value)) {
        lines.push(`${field.name}: [${value.join(', ')}]`);
      } else {
        lines.push(`${field.name}: ${value}`);
      }
    } else if (field.type === 'string' && value === '') {
      lines.push(`${field.name}: ""`);
    } else {
      lines.push(`${field.name}: ${value}`);
    }
  }

  lines.push('---');
  lines.push('');

  // Generate sections
  for (const section of template.sections) {
    const content = data[section.name] || '';
    lines.push(`## ${section.heading}`);

    if (content) {
      lines.push(content);
    } else if (section.placeholder) {
      lines.push(section.placeholder);
    } else if (section.required) {
      lines.push('TODO');
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Validate existing markdown content against template
 * @param {Object} template - parsed template from readTemplate()
 * @param {string} content - markdown content to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateContent(template, content) {
  const errors = [];

  // Check required frontmatter fields
  for (const field of template.frontmatter) {
    if (field.required) {
      const regex = new RegExp(`^${field.name}:\\s*.+$`, 'm');
      if (!regex.test(content)) {
        errors.push(`Missing required field: ${field.name}`);
      }
    }
  }

  // Check required sections
  for (const section of template.sections) {
    if (section.required) {
      const headingRegex = new RegExp(`^## ${section.heading}`, 'm');
      if (!headingRegex.test(content)) {
        errors.push(`Missing required section: ${section.heading}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Resolve template path relative to .claude/templates/
 * @param {string} templateName - e.g. 'issue.xml'
 * @param {string} basePath - project root
 * @returns {string} absolute path
 */
function resolveTemplatePath(templateName, basePath) {
  return path.join(basePath || process.cwd(), '.claude', 'templates', templateName);
}

function extractAttr(str, name) {
  const match = str.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : undefined;
}

module.exports = { readTemplate, generateMarkdown, validateContent, resolveTemplatePath };
