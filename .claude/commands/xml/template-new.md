<!--
Command: XML Template New
Purpose: Create new custom XML prompt template
-->

# /xml:template new

Create a new custom XML prompt template.

## Usage

```bash
/xml:template new <category> <name>
```

## Arguments

- `category`: Template category (arch, dev, test, refactor, doc)
- `name`: Template name (without .xml extension)

## Examples

```bash
/xml:template new dev microservice-creation
/xml:template new test database-integration
/xml:template new arch event-driven-design
```

## Required Documentation Access

**Documentation Queries:**
- `mcp://context7/xml/templating` - XML template structure and validation
- `mcp://context7/xml/mustache` - Mustache syntax for variable substitution
- `mcp://context7/software-architecture/patterns` - Architectural pattern documentation (for arch templates)

**Why This is Required:**
- Ensures valid XML structure in new templates
- Applies correct Mustache syntax for variables
- Incorporates architectural best practices

## Quick Check

1. Validate category is one of: arch, dev, test, refactor, doc
2. Validate name follows naming conventions (no spaces, kebab-case)
3. Check template doesn't already exist
4. Create template with all required sections

## Template Structure

New templates will be created with this structure:

```xml
<!--
Template: {{name}}
Purpose: {{purpose}}
Category: {{category}}
Stage: {{stage}}
-->

<prompt_workflow>
  <stage>{{stage}}</stage>
  <workflow_type>{{workflow_type}}</workflow_type>

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
    <!-- Add validation steps -->
  </quality_gates>

  <critical_reminders>
    <!-- Add priority reminders -->
  </critical_reminders>

  <deliverables>
    <!-- Define expected outputs -->
  </deliverables>

  <thinking>
    <!-- Structured thinking process -->
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
    <!-- Quality checks -->
  </quality_checklist>
</prompt_workflow>
```

## Output Format

```
✅ Template created: dev/microservice-creation.xml

Location: .claude/templates/xml-prompts/dev/microservice-creation.xml

Next steps:
  1. Edit template to add custom sections
  2. Define specific variables for your workflow
  3. Add anti-patterns and quality gates
  4. Test template: const builder = new XMLPromptBuilder(); builder.build('dev/microservice-creation.xml', vars)

Template structure:
  - Variables: {{task}}, {{context}}, {{requirements[]}}, etc.
  - Sections: task, requirements, constraints, testing_requirements, deliverables
  - Optional: existing_code, example (use {{#if}} conditionals)

See TEMPLATE_REGISTRY.md for template examples and best practices.
```

## Implementation

```javascript
const XMLPromptBuilder = require('../../lib/xml-prompt-builder');
const fs = require('fs');
const path = require('path');

// Validate inputs
const validCategories = ['arch', 'dev', 'test', 'refactor', 'doc'];
if (!validCategories.includes(category)) {
  console.error(`❌ Invalid category. Must be one of: ${validCategories.join(', ')}`);
  process.exit(1);
}

// Check if template exists
const builder = new XMLPromptBuilder();
const templatePath = `${category}/${name}.xml`;
if (builder.templateExists(templatePath)) {
  console.error(`❌ Template already exists: ${templatePath}`);
  process.exit(1);
}

// Create template content
const stageMap = {
  'arch': '1',
  'dev': '2',
  'test': '3',
  'refactor': '4',
  'doc': '5'
};

const workflowType = name.replace(/-/g, '_');

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
console.log(`\nNext steps:`);
console.log(`  1. Edit template to add custom sections`);
console.log(`  2. Define specific variables for your workflow`);
console.log(`  3. Add anti-patterns and quality gates`);
console.log(`  4. Test template with XMLPromptBuilder`);
```

## Success

✅ Template created: dev/microservice-creation.xml
  - All required sections included
  - Valid XML structure
  - Ready for customization
Next: Edit template to add specific sections for your workflow, see TEMPLATE_REGISTRY.md for examples

## Error Handling

```
❌ Invalid category: 'xyz'
Valid categories: arch, dev, test, refactor, doc

❌ Template already exists: dev/microservice-creation.xml
Use a different name or edit existing template

❌ Invalid template name: 'My Template'
Use kebab-case: 'my-template'
```
