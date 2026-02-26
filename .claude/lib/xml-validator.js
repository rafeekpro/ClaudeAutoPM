/**
 * XML Validator
 *
 * Validates XML prompt structure and content.
 * Ensures XML prompts follow required format and constraints.
 */

const fs = require('fs');
const path = require('path');

class XMLValidator {
  constructor() {
    // Define required tags for different stages
    this.stageRequirements = {
      1: {
        requiredTags: ['prompt_workflow', 'stage', 'workflow_type', 'task', 'context', 'requirements', 'constraints', 'deliverables', 'thinking'],
        optionalTags: ['existing_code', 'example']
      },
      2: {
        requiredTags: ['prompt_workflow', 'stage', 'workflow_type', 'task', 'context', 'requirements', 'constraints', 'tdd_requirements', 'deliverables', 'thinking'],
        optionalTags: ['existing_code', 'example', 'quality_checklist']
      },
      3: {
        requiredTags: ['prompt_workflow', 'stage', 'workflow_type', 'task', 'context', 'requirements', 'constraints', 'test_requirements', 'deliverables', 'thinking'],
        optionalTags: ['existing_code', 'example', 'test_patterns', 'quality_checklist']
      },
      4: {
        requiredTags: ['prompt_workflow', 'stage', 'workflow_type', 'task', 'context', 'requirements', 'constraints', 'refactoring_principles', 'deliverables', 'thinking'],
        optionalTags: ['existing_code', 'example', 'refactoring_techniques', 'quality_checklist']
      },
      5: {
        requiredTags: ['prompt_workflow', 'stage', 'workflow_type', 'task', 'context', 'requirements', 'constraints', 'documentation_requirements', 'deliverables', 'thinking'],
        optionalTags: ['existing_code', 'example', 'documentation_sections', 'quality_checklist']
      }
    };

    // Define constraint sub-tags that should be present
    this.requiredConstraintTags = [
      'allowed_libraries',
      'forbidden_approaches'
    ];

    // Define deliverable requirements
    this.requiredDeliverableFields = ['name', 'description', 'format'];
  }

  /**
   * Validate XML string structure
   * @param {string} xmlContent - XML content to validate
   * @returns {object} Validation result with errors and warnings
   */
  validate(xmlContent) {
    const errors = [];
    const warnings = [];

    // Basic XML structure check
    if (!xmlContent.trim().startsWith('<')) {
      errors.push({
        type: 'structure',
        message: 'Content does not appear to be valid XML'
      });
      return { valid: false, errors, warnings };
    }

    // Extract stage number
    const stageMatch = xmlContent.match(/<stage>(\d+)<\/stage>/);
    if (!stageMatch) {
      errors.push({
        type: 'structure',
        message: 'Missing or invalid <stage> tag'
      });
      return { valid: false, errors, warnings };
    }

    const stage = parseInt(stageMatch[1], 10);
    if (stage < 1 || stage > 5) {
      errors.push({
        type: 'structure',
        message: `Invalid stage number: ${stage}. Must be 1-5.`
      });
      return { valid: false, errors, warnings };
    }

    // Check required tags for stage
    const stageReqs = this.stageRequirements[stage];
    if (!stageReqs) {
      errors.push({
        type: 'structure',
        message: `No requirements defined for stage ${stage}`
      });
      return { valid: false, errors, warnings };
    }

    for (const tag of stageReqs.requiredTags) {
      const tagRegex = new RegExp(`<${tag}[\\s>]`);
      if (!tagRegex.test(xmlContent)) {
        errors.push({
          type: 'missing_tag',
          tag,
          message: `Required tag <${tag}> is missing for stage ${stage}`
        });
      }
    }

    // Validate constraints section
    this.validateConstraints(xmlContent, errors, warnings);

    // Validate deliverables section
    this.validateDeliverables(xmlContent, errors, warnings);

    // Validate thinking section
    this.validateThinking(xmlContent, warnings);

    // Check for template variables that weren't substituted
    this.validateTemplateVariables(xmlContent, warnings);

    // Check for empty required fields
    this.validateEmptyFields(xmlContent, errors);

    const valid = errors.length === 0;
    return { valid, errors, warnings, stage };
  }

  /**
   * Validate constraints section
   * @param {string} xmlContent - XML content
   * @param {Array} errors - Errors array to populate
   * @param {Array} warnings - Warnings array to populate
   */
  validateConstraints(xmlContent, errors, warnings) {
    // Check if constraints tag exists
    if (!/<constraints>[\s\S]*?<\/constraints>/.test(xmlContent)) {
      errors.push({
        type: 'missing_section',
        section: 'constraints',
        message: 'Missing <constraints> section'
      });
      return;
    }

    // Extract constraints section
    const constraintsMatch = xmlContent.match(/<constraints>([\s\S]*?)<\/constraints>/);
    if (!constraintsMatch) return;

    const constraintsContent = constraintsMatch[1];

    // Check for required constraint tags
    for (const tag of this.requiredConstraintTags) {
      const tagRegex = new RegExp(`<${tag}>`);
      if (!tagRegex.test(constraintsContent)) {
        warnings.push({
          type: 'missing_constraint',
          tag,
          message: `Recommended constraint <${tag}> is missing`
        });
      }
    }

    // Check for empty constraint values
    const emptyConstraints = constraintsContent.match(/<(\w+)>\s*<\/\1>/g);
    if (emptyConstraints) {
      for (const empty of emptyConstraints) {
        const tagName = empty.match(/<(\w+)>/)[1];
        warnings.push({
          type: 'empty_value',
          tag: tagName,
          message: `Constraint <${tagName}> is empty`
        });
      }
    }
  }

  /**
   * Validate deliverables section
   * @param {string} xmlContent - XML content
   * @param {Array} errors - Errors array to populate
   * @param {Array} warnings - Warnings array to populate
   */
  validateDeliverables(xmlContent, errors, warnings) {
    // Check if deliverables tag exists
    if (!/<deliverables>[\s\S]*?<\/deliverables>/.test(xmlContent)) {
      errors.push({
        type: 'missing_section',
        section: 'deliverables',
        message: 'Missing <deliverables> section'
      });
      return;
    }

    // Extract deliverable blocks
    const deliverableMatches = xmlContent.match(/<deliverable>[\s\S]*?<\/deliverable>/g);
    if (!deliverableMatches || deliverableMatches.length === 0) {
      warnings.push({
        type: 'missing_deliverables',
        message: 'No deliverables defined'
      });
      return;
    }

    // Validate each deliverable
    for (const deliverable of deliverableMatches) {
      for (const field of this.requiredDeliverableFields) {
        const fieldRegex = new RegExp(`<${field}>`);
        if (!fieldRegex.test(deliverable)) {
          warnings.push({
            type: 'missing_deliverable_field',
            field,
            message: `Deliverable missing field: <${field}>`
          });
        }
      }
    }
  }

  /**
   * Validate thinking section
   * @param {string} xmlContent - XML content
   * @param {Array} warnings - Warnings array to populate
   */
  validateThinking(xmlContent, warnings) {
    // Check if thinking section exists
    if (!/<thinking>[\s\S]*?<\/thinking>/.test(xmlContent)) {
      return; // Already caught by required tags check
    }

    // Extract thinking content
    const thinkingMatch = xmlContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (!thinkingMatch) return;

    const thinkingContent = thinkingMatch[1].trim();

    // Check if thinking section is too short (less than 200 characters)
    if (thinkingContent.length < 200) {
      warnings.push({
        type: 'insufficient_thinking',
        message: 'Thinking section seems too short. Provide more detailed reasoning.'
      });
    }
  }

  /**
   * Validate template variables
   * @param {string} xmlContent - XML content
   * @param {Array} warnings - Warnings array to populate
   */
  validateTemplateVariables(xmlContent, warnings) {
    // Check for unsubstituted template variables
    const simpleVariables = xmlContent.match(/{{\w+}}/g);
    if (simpleVariables) {
      const uniqueVars = [...new Set(simpleVariables)];
      warnings.push({
        type: 'unsubstituted_variables',
        variables: uniqueVars,
        message: `Found unsubstituted template variables: ${uniqueVars.join(', ')}`
      });
    }

    // Check for unsubstituted blocks
    const eachBlocks = xmlContent.match(/{{#each\s+\w+}}[\s\S]*?{{\/each}}/g);
    if (eachBlocks) {
      warnings.push({
        type: 'unsubstituted_blocks',
        message: `Found ${eachBlocks.length} unsubstituted {{#each}} blocks`
      });
    }

    // Check for unsubstituted conditionals
    const ifBlocks = xmlContent.match(/{{#if\s+\w+}}[\s\S]*?{{\/if}}/g);
    if (ifBlocks) {
      warnings.push({
        type: 'unsubstituted_blocks',
        message: `Found ${ifBlocks.length} unsubstituted {{#if}} blocks`
      });
    }
  }

  /**
   * Validate for empty required fields
   * @param {string} xmlContent - XML content
   * @param {Array} errors - Errors array to populate
   */
  validateEmptyFields(xmlContent, errors) {
    // Check for empty task
    const taskMatch = xmlContent.match(/<task>\s*<\/task>/);
    if (taskMatch) {
      errors.push({
        type: 'empty_field',
        field: 'task',
        message: 'Required field <task> is empty'
      });
    }

    // Check for empty context
    const contextMatch = xmlContent.match(/<context>\s*<\/context>/);
    if (contextMatch) {
      errors.push({
        type: 'empty_field',
        field: 'context',
        message: 'Required field <context> is empty'
      });
    }
  }

  /**
   * Validate template file
   * @param {string} templatePath - Path to template file
   * @returns {object} Validation result
   */
  validateTemplate(templatePath) {
    if (!fs.existsSync(templatePath)) {
      return {
        valid: false,
        errors: [{
          type: 'file_not_found',
          message: `Template file not found: ${templatePath}`
        }],
        warnings: []
      };
    }

    const content = fs.readFileSync(templatePath, 'utf8');
    return this.validate(content);
  }

  /**
   * Format validation errors for display
   * @param {object} validation - Validation result
   * @returns {string} Formatted error message
   */
  formatErrors(validation) {
    if (validation.valid) {
      return '✅ XML prompt is valid';
    }

    let output = '❌ XML prompt validation failed:\n\n';

    if (validation.errors.length > 0) {
      output += 'Errors:\n';
      for (const error of validation.errors) {
        output += `  - ${error.message}\n`;
      }
    }

    if (validation.warnings.length > 0) {
      output += '\nWarnings:\n';
      for (const warning of validation.warnings) {
        output += `  - ${warning.message}\n`;
      }
    }

    return output;
  }
}

module.exports = XMLValidator;
