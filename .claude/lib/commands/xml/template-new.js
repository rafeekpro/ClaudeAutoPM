#!/usr/bin/env node

/**
 * XML Template New Command
 *
 * Creates a new custom XML prompt template
 */

const fs = require('fs');
const path = require('path');
const XMLPromptBuilder = require('../../xml-prompt-builder');

/**
 * Create a new XML template
 */
function createTemplate(category, name) {
  const validCategories = ['arch', 'dev', 'test', 'refactor', 'doc'];

  // Validate category
  if (!validCategories.includes(category)) {
    console.error(`❌ Invalid category: '${category}'`);
    console.error(`Valid categories: ${validCategories.join(', ')}`);
    process.exit(1);
  }

  // Validate name (kebab-case)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    console.error(`❌ Invalid template name: '${name}'`);
    console.error('Use kebab-case: my-template-name');
    process.exit(1);
  }

  // Check if template already exists
  const builder = new XMLPromptBuilder();
  const templatePath = `${category}/${name}.xml`;

  if (builder.templateExists(templatePath)) {
    console.error(`❌ Template already exists: ${templatePath}`);
    console.error('Use a different name or edit the existing template');
    process.exit(1);
  }

  // Stage mapping
  const stageMap = {
    'arch': '1',
    'dev': '2',
    'test': '3',
    'refactor': '4',
    'doc': '5'
  };

  const workflowType = name.replace(/-/g, '_');

  // Create template content
  const template = `<!--
Template: ${name}
Purpose: [Add purpose description here]
Category: ${category}
Stage: ${stageMap[category]}
-->

<prompt_workflow>
  <stage>${stageMap[category]}</stage>
  <workflow_type>${workflowType}</workflow_type>

  <task>{{task}}</task>

  <context>{{context}}</context>

  <requirements>
    {{#each requirements}}
    <requirement>{{this}}</requirement>
    {{/each}}
  </requirements>

  <constraints>
    <allowed_libraries>{{allowed_libraries}}</allowed_libraries>
    <forbidden_approaches>{{forbidden_approaches}}</forbidden_approaches>
    <complexity_limits>{{complexity_limits}}</complexity_limits>
    <integration_requirements>{{integration_requirements}}</integration_requirements>
  </constraints>

  <testing_requirements>
    <test_real_functionality>REQUIRED</test_real_functionality>
    <no_mocks>TRUE - Use real implementations</no_mocks>
    <no_slow_marker>TRUE - Don't skip tests as slow</no_slow_marker>
  </testing_requirements>

  <forbidden_test_patterns>
    <!-- Add anti-patterns specific to this template -->
  </forbidden_test_patterns>

  <quality_gates>
    <!-- Add validation steps specific to this template -->
  </quality_gates>

  <critical_reminders>
    <!-- Add priority reminders specific to this template -->
  </critical_reminders>

  <deliverables>
    <!-- Define expected outputs for this workflow -->
  </deliverables>

  <thinking>
    Before working on this task:

    1. UNDERSTAND THE REQUIREMENTS:
       - What exactly needs to be done?
       - What are the edge cases?
       - What constraints must be followed?

    2. PLAN THE APPROACH:
       - What are the logical steps?
       - What dependencies exist?
       - What are the risks?

    3. IDENTIFY DELIVERABLES:
       - What needs to be produced?
       - What are the acceptance criteria?

    CRITICAL: Follow TDD and quality standards
  </thinking>

  {{#if existing_code}}
  <existing_code>
    <description>{{description}}</description>
    <content>{{existing_code}}</content>
  </existing_code>
  {{/if}}

  {{#if example}}
  <example>
    <description>{{description}}</description>
    <content>{{example}}</content>
  </example>
  {{/if}}

  <quality_checklist>
    <!-- Add quality checks specific to this template -->
  </quality_checklist>
</prompt_workflow>
`;

  // Create template
  const createdPath = builder.createTemplate(name, category, template);

  console.log(`✅ Template created: ${createdPath}`);
  console.log(`\nLocation: .claude/templates/xml-prompts/${createdPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Edit template to add custom sections`);
  console.log(`  2. Define specific variables for your workflow`);
  console.log(`  3. Add anti-patterns and quality gates`);
  console.log(`  4. Test template: const builder = new XMLPromptBuilder();`);
  console.log(`               builder.build('${createdPath}', vars);`);
  console.log(`\nTemplate structure:`);
  console.log(`  - Variables: {{task}}, {{context}}, {{requirements[]}}, etc.`);
  console.log(`  - Sections: task, requirements, constraints, testing_requirements, deliverables`);
  console.log(`  - Optional: existing_code, example (use {{#if}} conditionals)`);
  console.log(`\nSee .claude/templates/xml-prompts/TEMPLATE_REGISTRY.md for examples\n`);
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: template-new.js <category> <name>');
    console.error('');
    console.error('Arguments:');
    console.error('  category - Template category (arch, dev, test, refactor, doc)');
    console.error('  name     - Template name in kebab-case (e.g., microservice-creation)');
    console.error('');
    console.error('Examples:');
    console.error('  template-new.js dev microservice-creation');
    console.error('  template-new.js test database-integration');
    console.error('  template-new.js arch event-driven-design');
    process.exit(1);
  }

  const [category, name] = args;

  try {
    createTemplate(category, name);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error creating template: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createTemplate };
