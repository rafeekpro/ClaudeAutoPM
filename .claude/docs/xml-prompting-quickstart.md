# XML Structured Prompting - Quick Start Guide

## What is XML Structured Prompting?

XML Structured Prompting is a system that provides consistent, comprehensive prompts for different development stages. Instead of writing ad-hoc prompts, you use pre-defined XML templates that enforce best practices, TDD, and quality standards.

## Why Use XML Templates?

### Benefits Over Traditional Prompts

1. **Consistency**: Every prompt follows the same structure
2. **Completeness**: Templates remind you to consider all important aspects
3. **TDD Enforcement**: Templates require test-first approach
4. **Quality Gates**: Built-in quality checks and validation
5. **Best Practices**: Anti-patterns and reminders prevent common mistakes
6. **No Forgotten Steps**: Templates ensure nothing is overlooked

### What XML Templates Provide

```xml
<prompt_workflow>
  <!-- Clear task definition -->
  <task>{{task}}</task>

  <!-- All requirements documented -->
  <requirements>
    {{#each requirements}}
    <requirement>{{this}}</requirement>
    {{/each}}
  </requirements>

  <!-- Constraints and limits -->
  <constraints>
    <allowed_libraries>{{allowed_libraries}}</allowed_libraries>
    <forbidden_approaches>{{forbidden_approaches}}</forbidden_approaches>
  </constraints>

  <!-- TDD enforcement -->
  <tdd_requirements>
    <test_first>REQUIRED</test_first>
  </tdd_requirements>

  <!-- What NOT to do (anti-patterns) -->
  <forbidden_test_patterns>
    <pattern>
      <name>File Existence Only</name>
      <anti_example>assert Path("file").exists()</anti_example>
    </pattern>
  </forbidden_test_patterns>

  <!-- Quality checkpoints -->
  <quality_gates>
    <gate name="TDD Compliance">
      <check>Tests written before implementation</check>
    </gate>
  </quality_gates>

  <!-- Priority reminders -->
  <critical_reminders>
    <reminder priority="1">
      NEVER report "100% tests passing" if only file-checking tests ran
    </reminder>
  </critical_reminders>
</prompt_workflow>
```

## Quick Start

### 1. View Available Templates

```bash
# List all XML templates
/xml:template list
```

Or programmatically:

```javascript
const XMLPromptBuilder = require('.claude/lib/xml-prompt-builder');
const builder = new XMLPromptBuilder();
const templates = builder.listTemplates();
console.log(templates);
```

### 2. Select Appropriate Template

Templates are organized by development stage:

- **Stage 1 (arch/)**: Architectural planning
  - `stage1-architectural-planning.xml` - Design system architecture
  - `prd-to-epic.xml` - Convert PRD to technical epic

- **Stage 2 (dev/)**: Code/infrastructure implementation
  - `stage2-code-generation.xml` - Generate code with TDD
  - `api-endpoint.xml` - Create REST API endpoints
  - `stage2-infrastructure-implementation.xml` - Implement infrastructure (Docker, K8s)

- **Stage 3 (test/)**: Test creation
  - `stage3-test-creation.xml` - Create comprehensive test suites
  - `stage3-infrastructure-validation.xml` - Validate infrastructure

- **Stage 4 (refactor/)**: Refactoring
  - `stage4-refactoring.xml` - Refactor code safely

- **Stage 5 (doc/)**: Documentation
  - `stage5-documentation.xml` - Generate documentation

### 3. Build Prompt from Template

```javascript
const XMLPromptBuilder = require('.claude/lib/xml-prompt-builder');
const builder = new XMLPromptBuilder();

// Prepare variables
const variables = {
  task: 'Implement user authentication API',
  context: 'Express.js API with JWT tokens',
  requirements: [
    'Login endpoint with email/password',
    'JWT token generation',
    'Password hashing with bcrypt',
    'Input validation and error handling'
  ],
  allowed_libraries: 'bcrypt, jsonwebtoken, express-validator',
  test_format: 'Jest',
  code_format: 'TypeScript'
};

// Build prompt
const prompt = builder.build('dev/stage2-code-generation.xml', variables);
console.log(prompt);
```

### 4. Use with Agents

Pass the generated XML prompt to specialized agents:

```markdown
@nodejs-backend-engineer

<prompt_workflow>
  <stage>2</stage>
  <workflow_type>code_generation</workflow_type>

  <task>Implement user authentication API</task>
  <context>Express.js API with JWT tokens</context>

  <requirements>
    <requirement>Login endpoint with email/password</requirement>
    <requirement>JWT token generation</requirement>
    <requirement>Password hashing with bcrypt</requirement>
    <requirement>Input validation and error handling</requirement>
  </requirements>

  <!-- ... rest of XML template ... -->
</prompt_workflow>
```

## Template Variables

### Simple Variables

```mustache
{{task}}
{{context}}
{{allowed_libraries}}
```

### Arrays (Loops)

```mustache
{{#each requirements}}
<requirement>{{this}}</requirement>
{{/each}}
```

Usage:
```javascript
{
  requirements: [
    'Requirement 1',
    'Requirement 2',
    'Requirement 3'
  ]
}
```

### Conditionals

```mustache
{{#if existing_code}}
<existing_code>
  <content>{{existing_code}}</content>
</existing_code>
{{/if}}
```

Usage:
```javascript
{
  existing_code: 'current implementation to refactor'  // Included if present
}
```

## Real-World Examples

### Example 1: Creating API Endpoint

```javascript
const builder = new XMLPromptBuilder();

const prompt = builder.build('dev/api-endpoint.xml', {
  task: 'Create user registration endpoint',
  context: 'Express.js REST API',
  requirements: [
    'POST /api/users/register',
    'Validate email and password',
    'Hash password with bcrypt',
    'Return JWT token on success',
    'Handle duplicate email error'
  ],
  http_method: 'POST',
  endpoint_path: '/api/users/register',
  auth_required: 'false',
  request_format: '{email: string, password: string}',
  response_format: '{token: string, user: object}',
  test_framework: 'Jest',
  coverage_minimum: '100%'
});
```

### Example 2: Implementing Infrastructure

```javascript
const prompt = builder.build('dev/stage2-infrastructure-implementation.xml', {
  task: 'Create Docker configuration for web application',
  context: 'Node.js app with nginx reverse proxy and PostgreSQL',
  requirements: [
    'Multi-stage Dockerfile for Node.js',
    'nginx reverse proxy configuration',
    'PostgreSQL service',
    'Development and production configurations'
  ],
  infrastructure_type: 'Docker Compose',
  cloud_provider: 'Local / AWS ECS',
  allowed_tools: 'Docker, Docker Compose',
  forbidden_approaches: 'No container orchestration (K8s) for now'
});
```

### Example 3: Creating Tests

```javascript
const prompt = builder.build('test/stage3-test-creation.xml', {
  task: 'Create comprehensive test suite for user service',
  context: 'Express.js service with PostgreSQL database',
  requirements: [
    'Unit tests for all functions',
    'Integration tests with real database',
    'API endpoint tests',
    'Error handling tests',
    'Edge case coverage'
  ],
  allowed_libraries: 'Jest, supertest',
  test_coverage_minimum: '100%'
});
```

## Customizing Templates

### Creating Custom Templates

```bash
# Create new custom template
/xml:template new dev my-custom-workflow
```

Or manually:

```javascript
// Create custom template
const customTemplate = `
<prompt_workflow>
  <stage>2</stage>
  <workflow_type>custom_workflow</workflow_type>

  <task>{{task}}</task>
  <context>{{context}}</context>

  {{#each requirements}}
  <requirement>{{this}}</requirement>
  {{/each}}

  <custom_section>
    {{custom_content}}
  </custom_section>
</prompt_workflow>
`;

// Save it
const path = builder.createTemplate('my-custom-workflow', 'dev', customTemplate);
```

### Extending Existing Templates

You can add custom sections to existing templates:

```javascript
const builder = new XMLPromptBuilder();
let prompt = builder.build('dev/stage2-code-generation.xml', variables);

// Add custom section
prompt += `
<custom_requirements>
  <requirement>Must follow project naming conventions</requirement>
  <requirement>Must include error logging</requirement>
</custom_requirements>
`;
```

## Integration with Commands

XML templates integrate with ClaudeAutoPM commands:

```bash
# PM commands use XML templates internally
/pm:prd-parse feature-name      # Uses arch/prd-to-epic.xml
/pm:epic-start feature-name     # Uses dev/stage2-code-generation.xml
/testing:run                    # Uses test/stage3-test-creation.xml
```

## Best Practices

### 1. Always Use Templates for Structured Work

```markdown
# ❌ Bad - Ad-hoc prompt
"Create a user login endpoint"

# ✅ Good - XML template
@nodejs-backend-engineer
<prompt_workflow>
  <!-- Complete XML template -->
</prompt_workflow>
```

### 2. Fill All Required Variables

```javascript
// ❌ Bad - Missing required variables
{ task: 'Create endpoint' }

// ✅ Good - All variables provided
{
  task: 'Create user login endpoint',
  context: 'Express.js API',
  requirements: [...],
  allowed_libraries: 'bcrypt, jsonwebtoken',
  test_format: 'Jest',
  code_format: 'TypeScript'
}
```

### 3. Respect Template Structure

```xml
<!-- ✅ Good - Add within template structure -->
<prompt_workflow>
  <task>{{task}}</task>

  <!-- Add your custom sections here -->
  <my_custom_section>
    <content>{{custom}}</content>
  </my_custom_section>

  <!-- Keep existing sections -->
  <requirements>...</requirements>
</prompt_workflow>

<!-- ❌ Bad - Remove required sections -->
<prompt_workflow>
  <task>{{task}}</task>
  <!-- Missing requirements, testing, etc. -->
</prompt_workflow>
```

### 4. Follow TDD Requirements

Templates enforce TDD - don't skip it:

```xml
<tdd_requirements>
  <test_first>REQUIRED</test_first>
  <!-- This is not optional -->
</tdd_requirements>
```

### 5. Pay Attention to Anti-Patterns

Templates show what NOT to do:

```xml
<forbidden_test_patterns>
  <pattern>
    <name>File Existence Only</name>
    <anti_example>assert Path("file").exists()</anti_example>
    <why>Don't do this - false confidence</why>
    <real_test>Use real functionality tests</real_test>
  </pattern>
</forbidden_test_patterns>
```

## Advanced Features

### Quality Gates

Templates define quality checkpoints:

```xml
<quality_gates>
  <gate name="TDD Compliance">
    <check>Tests written before implementation</check>
    <check>Tests fail initially</check>
    <check>Minimal implementation</check>
    <check>All tests passing</check>
    <failure>Start over - complete TDD cycle</failure>
  </gate>
</quality_gates>
```

### Critical Reminders

Priority-tagged reminders prevent mistakes:

```xml
<critical_reminders>
  <reminder priority="1">
    NEVER report "100% tests passing" if only file-checking tests ran
  </reminder>
  <reminder priority="2">
    Always test REAL functionality, not just file existence
  </reminder>
</critical_reminders>
```

### Pre-commit Hooks

Some templates specify required hooks:

```xml
<pre_commit_hooks>
  <hook required="true">
    <command>docker compose build --no-cache</command>
    <purpose>Ensure Dockerfiles build before commit</purpose>
  </hook>
</pre_commit_hooks>
```

## Template Reference

See `.claude/templates/xml-prompts/TEMPLATE_REGISTRY.md` for complete template catalog with:
- All available templates
- Required variables for each
- Usage examples
- Best practices

## Troubleshooting

### Template Not Found

```javascript
// ❌ Wrong path
builder.build('code-gen.xml', vars)

// ✅ Correct path (category/filename.xml)
builder.build('dev/stage2-code-generation.xml', vars)
```

### Variable Not Substituted

```javascript
// ❌ Wrong syntax
{{ variable }}

// ✅ Correct syntax (no spaces)
{{variable}}
```

### Conditional Not Working

```javascript
// ❌ Variable not provided
{{#if existing_code}}...{{/if}}  // Won't show if existing_code undefined

// ✅ Provide the variable
{ existing_code: 'some code' }  // Will show the section
```

## Next Steps

1. **Explore Templates**: Browse `.claude/templates/xml-prompts/`
2. **Read Registry**: See `TEMPLATE_REGISTRY.md` for complete catalog
3. **Try Examples**: Use `EXAMPLE-docker-validation.xml` as reference
4. **Create Custom**: Build your own templates for your workflows
5. **Integrate**: Use with agents and commands for maximum benefit

## Summary

XML Structured Prompting provides:

- ✅ Consistent, complete prompts
- ✅ TDD enforcement
- ✅ Quality gates and reminders
- ✅ Anti-pattern prevention
- ✅ Best practices built-in
- ✅ Agent and command integration

Use XML templates for all structured development work to ensure quality and completeness.
