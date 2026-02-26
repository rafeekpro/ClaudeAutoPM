---
allowed-tools: Bash, Read, Write, LS, Grep
---

# XML Template Manager

Manage XML prompt templates for structured AI workflows.

## Required Documentation Access

**MANDATORY:** Before creating templates, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/prompt-engineering/template-design` - Template design principles
- `mcp://context7/xml/schemas` - XML schema best practices
- `mcp://context7/ai/constraint-specification` - How to specify effective constraints

**Why This is Required:**
- Ensures templates follow proven patterns
- Applies industry best practices for XML structure
- Validates constraint specification techniques
- Prevents common template design mistakes

## Usage

```
/xml:template <action> [options]
```

## Actions

### List Templates

```
/xml:template list [--category <name>]
```

List all available XML templates, optionally filtered by category.

**Categories:**
- `arch` - Architecture and design templates
- `dev` - Development and code generation templates
- `test` - Testing and validation templates
- `refactor` - Refactoring templates
- `doc` - Documentation templates

**Examples:**
```bash
# List all templates
/xml:template list

# List only development templates
/xml:template list --category dev
```

**Output Format:**
```
📋 Available XML Templates

Architecture (arch):
  - stage1-architectural-planning
    Design system architecture before implementation

Development (dev):
  - stage2-code-generation
    Generate implementation code based on architecture

Testing (test):
  - stage3-test-creation
    Generate comprehensive test suites for existing code

Refactoring (refactor):
  - stage4-refactoring
    Improve code structure while maintaining functionality

Documentation (doc):
  - stage5-documentation
    Generate comprehensive documentation for code

5 templates found
```

### Show Template

```
/xml:template show <template-name>
```

Display the structure and metadata of a template.

**Examples:**
```bash
# Show structure of code generation template
/xml:template show stage2-code-generation

# Show architecture template
/xml:template show arch/stage1-architectural-planning
```

**Output Format:**
```
📄 Template: stage2-code-generation

Category: Development
Stage: 2
Workflow: code_generation

Purpose: Generate implementation code based on architecture

Required Variables:
  - task: What the AI should accomplish
  - context: Prerequisites and background
  - requirements: Numbered requirements list
  - allowed_libraries: Permitted libraries/frameworks
  - forbidden_approaches: Approaches to avoid
  - complexity_limits: Complexity constraints
  - integration_requirements: Integration points

Sections:
  - TDD Requirements (test-first enforcement)
  - Deliverables (tests, code, refactored code)
  - Thinking (reasoning before coding)
  - Quality Checklist

Usage Example:
  /prompt:xml stage2-code-generation \
    --task "Create auth module" \
    --context "JWT-based authentication" \
    --requirement "Use bcrypt" \
    --allowed "Node.js, jsonwebtoken"
```

### Validate Template

```
/xml:template validate <template-name>
```

Validate a template file for structural correctness.

**Examples:**
```bash
# Validate stage2 template
/xml:template validate stage2-code-generation

# Validate custom template
/xml:template validate my-custom-template
```

**Output Format:**
```
✅ Template validation passed

Template: stage2-code-generation
Stage: 2
Required tags: 11/11 present
Optional tags: 3/3 present

Constraints section: Valid
Deliverables section: Valid (3 deliverables)
Thinking section: Valid (512 chars)

No issues found
```

### Create Template

```
/xml:template create <name> --category <cat> [--stage <n>]
```

Create a new XML template interactively.

**Arguments:**
- `name` - Template name (without .xml extension)
- `--category` - Category (arch, dev, test, refactor, doc)
- `--stage` - Workflow stage (1-5, optional)

**Examples:**
```bash
# Create custom development template
/xml:template create my-feature --category dev --stage 2

# Create custom test template
/xml:template create e2e-tests --category test --stage 3
```

**Interactive Flow:**

```
📝 Creating new XML template: my-feature

Stage: 2 (Code Generation)
Category: Development

Enter template purpose:
> Generate feature implementation with specific patterns

Required variables (comma-separated):
> task, context, patterns, constraints

Include TDD requirements? (yes/no):
> yes

Include quality checklist? (yes/no):
> yes

✅ Template created: dev/my-feature.xml

Location: autopm/.claude/templates/xml-prompts/dev/my-feature.xml

Next steps:
1. Review template: /xml:template show my-feature
2. Test template: /prompt:xml my-feature --task "Test" --context "Test"
3. Edit if needed: autopm/.claude/templates/xml-prompts/dev/my-feature.xml
```

### Delete Template

```
/xml:template delete <template-name>
```

Delete a template file.

**Warning:** Cannot delete built-in stage templates.

**Examples:**
```bash
# Delete custom template
/xml:template delete my-custom-template

# Will fail for built-in templates
/xml:template delete stage2-code-generation
❌ Cannot delete built-in template: stage2-code-generation
```

### Export Template

```
/xml:template export <template-name> [--output <file>]
```

Export a template to a file for sharing or backup.

**Examples:**
```bash
# Export to current directory
/xml:template export stage2-code-generation

# Export to specific location
/xml:template export stage2-code-generation --output ~/templates/
```

### Import Template

```
/xml:template import <file> [--category <cat>]
```

Import a template from a file.

**Examples:**
```bash
# Import template
/xml:template import ~/my-template.xml --category dev

# Import without category (detect from file)
/xml:template import ~/my-template.xml
```

## Quick Check

1. Verify XML template directory exists:
   ```bash
   test -d autopm/.claude/templates/xml-prompts
   ```

2. Check XML utilities available:
   ```bash
   test -f autopm/.claude/lib/xml-prompt-builder.js
   test -f autopm/.claude/lib/xml-validator.js
   ```

3. Verify templates exist:
   ```bash
   ls -1 autopm/.claude/templates/xml-prompts/*/*.xml
   ```

## Implementation

### List Templates Action

```bash
# Use XMLPromptBuilder.listTemplates()
const builder = new XMLPromptBuilder();
const templates = builder.listTemplates();

# Group by category
const byCategory = {};
for (const tmpl of templates) {
  if (!byCategory[tmpl.category]) {
    byCategory[tmpl.category] = [];
  }
  byCategory[tmpl.category].push(tmpl);
}

# Output formatted list
```

### Show Template Action

```bash
# Get template metadata
const builder = new XMLPromptBuilder();
const metadata = builder.getTemplateMetadata(templatePath);

# Extract variable placeholders from template
const content = builder.readTemplate(templatePath);
const variables = extractVariables(content);

# Display formatted info
```

### Validate Template Action

```bash
# Use XMLValidator
const validator = new XMLValidator();
const validation = validator.validateTemplate(templatePath);

# Format and display results
console.log(validator.formatErrors(validation));
```

### Create Template Action

```bash
# Interactive prompts (use Read tool)
# Gather template information

# Generate base template structure
const baseXML = generateTemplateStructure({
  name,
  category,
  stage,
  purpose,
  variables
});

# Create template file
const builder = new XMLPromptBuilder();
const path = builder.createTemplate(name, category, baseXML);

echo "✅ Template created: $path"
```

## Template Structure Reference

### Minimum Required Tags

All templates must include:

```xml
<prompt_workflow>
  <stage>1-5</stage>
  <workflow_type>string</workflow_type>
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
  </constraints>
  <deliverables>
    <deliverable>
      <name>string</name>
      <description>string</description>
      <format>string</format>
    </deliverable>
  </deliverables>
  <thinking>
    Instructions for AI reasoning before acting
  </thinking>
</prompt_workflow>
```

### Stage-Specific Requirements

**Stage 1 (Architecture):**
- Additional deliverables: architecture diagrams, data model, API spec
- Thinking should focus on design patterns and component boundaries

**Stage 2 (Code Generation):**
- Must include `<tdd_requirements>` section
- Deliverables must include test files, implementation, refactored code
- Thinking must emphasize TDD cycle

**Stage 3 (Test Creation):**
- Must include `<test_requirements>` section
- Deliverables focus on unit, integration, edge case tests
- Thinking should cover test categories and coverage

**Stage 4 (Refactoring):**
- Must include `<refactoring_principles>` section
- Deliverables: refactored code, test results, summary
- Thinking should identify code smells and plan refactoring

**Stage 5 (Documentation):**
- Must include `<documentation_requirements>` section
- Deliverables: API docs, usage examples, architecture overview
- Thinking should consider audience and structure

## Error Handling

### Template Not Found

```bash
❌ Template not found: <name>

Use /xml:template list to see available templates
```

### Invalid Category

```bash
❌ Invalid category: <name>

Valid categories: arch, dev, test, refactor, doc
```

### Validation Failed

```bash
❌ Template validation failed

Errors:
  - Missing required tag: <task>
  - Empty constraints section

Fix errors before using template
```

### Cannot Delete Built-in

```bash
❌ Cannot delete built-in template: <name>

Built-in templates are protected. Create custom templates instead:
  /xml:template create <name> --category <cat>
```

## Tips

1. **List Before Using** - Use `list` to see available templates
2. **Show Before Generating** - Use `show` to understand template structure
3. **Validate After Creating** - Always `validate` custom templates
4. **Export for Backup** - Export custom templates before major changes
5. **Start from Stage Templates** - Copy and modify stage templates for custom needs
6. **Test Thoroughly** - Test templates with simple prompts before complex use
7. **Document Purpose** - Include clear purpose comments in templates
8. **Follow Patterns** - Match structure of existing stage templates

## Related Commands

- `/prompt:xml` - Generate XML prompts from templates
- `/prompt` - Generic complex prompt handler

## See Also

- `.claude/commands/xml/prompt-xml.md` - XML prompt generation
- `autopm/.claude/lib/xml-prompt-builder.js` - Template engine
- `autopm/.claude/lib/xml-validator.js` - Validation logic
- `autopm/.claude/docs/xml-prompts/creating-templates.md` - Template creation guide
