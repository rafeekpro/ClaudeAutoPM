/**
 * XML Template Reader
 *
 * Reads XML templates, generates markdown with frontmatter,
 * and validates content against template rules.
 */

const fs = require('fs');
const path = require('path');
const { parseFrontmatter, stringifyFrontmatter } = require('./frontmatter');

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
  while ((ruleMatch = ruleRegex.exec(xml)) !== null) {
    validation.push(ruleMatch[1].trim());
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

  // Build frontmatter object from template fields + data
  const fm = {};
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
      value = '';
    } else {
      value = '';
    }

    fm[field.name] = value;
  }

  // Build body from sections
  const bodyLines = [];
  for (const section of template.sections) {
    const content = data[section.name] || '';
    bodyLines.push(`## ${section.heading}`);

    if (content) {
      bodyLines.push(content);
    } else if (section.placeholder) {
      bodyLines.push(section.placeholder);
    } else if (section.required) {
      bodyLines.push('TODO');
    }

    bodyLines.push('');
  }

  return stringifyFrontmatter(fm, bodyLines.join('\n'));
}

/**
 * Validate existing markdown content against template
 * @param {Object} template - parsed template from readTemplate()
 * @param {string} content - markdown content to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateContent(template, content) {
  const errors = [];
  const { frontmatter, body } = parseFrontmatter(content);

  // Check required frontmatter fields
  for (const field of template.frontmatter) {
    if (field.required) {
      const val = frontmatter[field.name];
      if (val === undefined || val === null || val === '') {
        errors.push(`Missing required field: ${field.name}`);
      }
    }
  }

  // Check required sections
  for (const section of template.sections) {
    if (section.required) {
      const headingRegex = new RegExp(`^## ${section.heading}`, 'm');
      if (!headingRegex.test(body)) {
        errors.push(`Missing required section: ${section.heading}`);
      }
    }
  }

  // Evaluate validation rules
  if (template.validation) {
    for (const rule of template.validation) {
      if (/must be non-empty/i.test(rule)) {
        const sectionName = rule.split(/\s+must/)[0].trim();
        const section = template.sections.find(s => s.name === sectionName);
        if (section) {
          const headingPattern = new RegExp(`## ${section.heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`);
          const match = body.match(headingPattern);
          if (!match || !match[1].trim()) {
            errors.push(`Validation failed: ${rule}`);
          }
        }
      } else if (/checkbox|- \[ \]/i.test(rule)) {
        if (!content.includes('- [ ]') && !content.includes('- [x]')) {
          errors.push(`Validation failed: ${rule}`);
        }
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
