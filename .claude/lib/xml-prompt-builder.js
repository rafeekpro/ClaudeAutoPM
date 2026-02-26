/**
 * XML Prompt Builder
 *
 * Builds XML prompts from templates with variable substitution.
 * This utility provides a simple template engine for XML prompt generation.
 */

const fs = require('fs');
const path = require('path');

class XMLPromptBuilder {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates/xml-prompts');
  }

  /**
   * Read a template file
   * @param {string} templatePath - Relative path to template
   * @returns {string} Template content
   */
  readTemplate(templatePath) {
    const fullPath = path.join(this.templateDir, templatePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    return fs.readFileSync(fullPath, 'utf8');
  }

  /**
   * Substitute variables in template
   * @param {string} template - Template content
   * @param {object} variables - Variables to substitute
   * @returns {string} Processed template
   */
  substituteVariables(template, variables) {
    let result = template;

    // Handle simple {{variable}} substitution
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }

    // Handle {{#each}} blocks for arrays
    result = this.processEachBlocks(result, variables);

    // Handle {{#if}} conditionals
    result = this.processIfBlocks(result, variables);

    return result;
  }

  /**
   * Process {{#each}} blocks
   * @param {string} template - Template content
   * @param {object} variables - Variables
   * @returns {string} Processed template
   */
  processEachBlocks(template, variables) {
    // Match {{#each array}}...{{/each}} blocks
    const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;

    return template.replace(eachRegex, (match, arrayName, block) => {
      const array = variables[arrayName];
      if (!Array.isArray(array) || array.length === 0) {
        return '';
      }

      return array
        .map(item => {
          // Replace {{this}} with actual item
          return block.replace(/{{this}}/g, item);
        })
        .join('\n');
    });
  }

  /**
   * Process {{#if}} blocks
   * @param {string} template - Template content
   * @param {object} variables - Variables
   * @returns {string} Processed template
   */
  processIfBlocks(template, variables) {
    // Match {{#if var}}...{{/if}} blocks
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

    return template.replace(ifRegex, (match, varName, block) => {
      const value = variables[varName];
      return value ? block : '';
    });
  }

  /**
   * Build XML prompt from template
   * @param {string} templatePath - Path to template
   * @param {object} variables - Variables for substitution
   * @returns {string} Complete XML prompt
   */
  build(templatePath, variables) {
    const template = this.readTemplate(templatePath);
    return this.substituteVariables(template, variables);
  }

  /**
   * List available templates
   * @returns {Array<{name: string, path: string, category: string}>}
   */
  listTemplates() {
    const templates = [];
    const categories = ['arch', 'dev', 'test', 'refactor', 'doc'];

    for (const category of categories) {
      const categoryPath = path.join(this.templateDir, category);
      if (!fs.existsSync(categoryPath)) continue;

      const files = fs.readdirSync(categoryPath);
      for (const file of files) {
        if (file.endsWith('.xml')) {
          templates.push({
            name: file.replace('.xml', ''),
            path: path.join(category, file),
            category
          });
        }
      }
    }

    return templates;
  }

  /**
   * Get template metadata
   * @param {string} templatePath - Path to template
   * @returns {object} Template metadata
   */
  getTemplateMetadata(templatePath) {
    const fullPath = path.join(this.templateDir, templatePath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Extract metadata from XML comments
    const metadata = {};

    const purposeMatch = content.match(/Purpose: ([^\n]+)/);
    if (purposeMatch) {
      metadata.purpose = purposeMatch[1].trim();
    }

    const stageMatch = content.match(/<stage>(\d+)<\/stage>/);
    if (stageMatch) {
      metadata.stage = parseInt(stageMatch[1], 10);
    }

    const workflowMatch = content.match(/<workflow_type>([^<]+)<\/workflow_type>/);
    if (workflowMatch) {
      metadata.workflowType = workflowMatch[1].trim();
    }

    return metadata;
  }

  /**
   * Validate template exists
   * @param {string} templatePath - Path to template
   * @returns {boolean}
   */
  templateExists(templatePath) {
    const fullPath = path.join(this.templateDir, templatePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Create custom template
   * @param {string} name - Template name
   * @param {string} category - Category (arch, dev, test, refactor, doc)
   * @param {string} content - Template content
   * @returns {string} Path to created template
   */
  createTemplate(name, category, content) {
    const categoryPath = path.join(this.templateDir, category);

    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }

    const fileName = `${name}.xml`;
    const fullPath = path.join(categoryPath, fileName);

    fs.writeFileSync(fullPath, content, 'utf8');
    return path.join(category, fileName);
  }
}

module.exports = XMLPromptBuilder;
