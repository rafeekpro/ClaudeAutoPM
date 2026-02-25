# XML Structured Prompting in AutoPM

A powerful system for generating precise AI code generation through structured XML templates with defined stages, constraints, and deliverables.

## Overview

XML Structured Prompting provides fine-grained control over AI behavior by specifying:
- **Clear task objectives** with context
- **Numbered requirements** for unambiguous expectations
- **Constraints** on allowed libraries and forbidden approaches
- **Deliverables** with exact output specifications
- **Thinking requirements** that force AI to reason before coding

## Benefits

### For Developers

- **Predictable Output** - Constraints ensure code follows your standards
- **TDD Enforcement** - Stage 2 templates mandate test-first development
- **Architectural Consistency** - Stage 1 ensures design before implementation
- **Comprehensive Testing** - Stage 3 generates thorough test suites
- **Clean Refactoring** - Stage 4 preserves behavior while improving code
- **Complete Documentation** - Stage 5 creates detailed documentation

### For Teams

- **Standardized Workflows** - Everyone uses same templates
- **Enforce Best Practices** - Bake TDD, testing, documentation into process
- **Reduced Ambiguity** - Numbered requirements prevent misunderstandings
- **Quality Gates** - Each stage has validation and quality checklists
- **Knowledge Sharing** - Templates capture team knowledge

## Quick Start

### 1. Generate Your First XML Prompt

```bash
# List available templates
/xml:template list

# Generate code with TDD
/prompt:xml stage2-code-generation \
  --task "Create user authentication" \
  --context "JWT-based auth system" \
  --requirement "Use bcrypt for passwords" \
  --requirement "Generate JWT tokens" \
  --allowed "Node.js, jsonwebtoken, bcrypt" \
  --forbidden "Plain text passwords, hardcoded secrets"
```

### 2. Use Complete 5-Stage Workflow

```bash
# Stage 1: Design Architecture
/prompt:xml stage1-architectural-planning \
  --task "Design payment system" \
  --context "E-commerce platform" \
  --requirement "Support multiple payment methods" \
  --requirement "PCI compliance" \
  --output payment-arch.xml

# Review architecture, then...

# Stage 2: Generate Code (with TDD)
/prompt:xml stage2-code-generation \
  --task "Implement payment service" \
  --context "From architecture design" \
  --requirement "Stripe integration" \
  --requirement "Error handling" \
  --allowed "Node.js, Stripe SDK" \
  --forbidden "Logging card numbers, storing CVV"

# Stage 3: Create Tests
/prompt:xml stage3-test-creation \
  --task "Test payment service" \
  --context "Handle credit card transactions" \
  --requirement "Test successful payments" \
  --requirement "Test declined cards" \
  --requirement "Test network errors"

# Stage 4: Refactor (if needed)
/prompt:xml stage4-refactoring \
  --task "Refactor payment service" \
  --context "Improve maintainability" \
  --requirement "Extract validation logic" \
  --forbidden "Changing external behavior"

# Stage 5: Document
/prompt:xml stage5-documentation \
  --task "Document payment API" \
  --context "REST API documentation" \
  --requirement "Document all endpoints" \
  --requirement "Provide usage examples" \
  --target-audience "Frontend developers"
```

## The 5 Stages

### Stage 1: Architectural Planning

**Template:** `arch/stage1-architectural-planning.xml`

**Purpose:** Design system architecture before implementation

**Deliverables:**
- System architecture diagram
- Data model
- API specification
- Technology stack recommendations

**When to Use:**
- Starting new features/modules
- Designing complex systems
- Planning integrations

**Output:** High-level design with component interactions

### Stage 2: Code Generation

**Template:** `dev/stage2-code-generation.xml`

**Purpose:** Generate implementation with TDD

**Deliverables:**
- Test files (written FIRST)
- Implementation code (minimal to pass tests)
- Refactored code (clean and maintainable)

**When to Use:**
- Implementing features from design
- Creating new modules
- Adding API endpoints

**Output:** Working, tested, clean code

### Stage 3: Test Creation

**Template:** `test/stage3-test-creation.xml`

**Purpose:** Generate comprehensive test suites

**Deliverables:**
- Unit tests
- Integration tests
- Edge case tests
- Test documentation

**When to Use:**
- Testing existing code
- Adding test coverage
- Creating regression tests

**Output:** Thorough test suite with high coverage

### Stage 4: Refactoring

**Template:** `refactor/stage4-refactoring.xml`

**Purpose:** Improve code structure safely

**Deliverables:**
- Refactored code
- Test results (all passing)
- Refactoring summary

**When to Use:**
- Cleaning up technical debt
- Improving maintainability
- Simplifying complex code

**Output:** Cleaner code with identical behavior

### Stage 5: Documentation

**Template:** `doc/stage5-documentation.xml`

**Purpose:** Generate comprehensive documentation

**Deliverables:**
- API/function documentation
- Usage examples
- Architecture overview
- README updates

**When to Use:**
- Documenting new code
- Creating API docs
- Writing user guides

**Output:** Clear, comprehensive documentation

## Template Structure

All XML templates follow this structure:

```xml
<prompt_workflow>
  <stage>1-5</stage>
  <workflow_type>architectural_planning|code_generation|test_creation|refactoring|documentation</workflow_type>

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

  <deliverables>
    <deliverable>
      <name>Deliverable name</name>
      <description>What it includes</description>
      <format>Output format</format>
      <required>YES|NO|Conditional</required>
    </deliverable>
  </deliverables>

  <thinking>
    Detailed instructions for AI reasoning before taking action.
    This forces the AI to think through the problem systematically.
  </thinking>

  {{#if existing_code}}
  <existing_code>
    <description>Current code to consider</description>
    <content>{{existing_code}}</content>
  </existing_code>
  {{/if}}

  {{#if example}}
  <example>
    <description>Reference pattern</description>
    <content>{{example}}</content>
  </example>
  {{/if}}
</prompt_workflow>
```

## Variable Substitution

Templates use Handlebars-style variables:

### Simple Variables

```
{{task}} - Task description
{{context}} - Background and prerequisites
{{allowed_libraries}} - Permitted libraries
```

### Arrays ({{#each}})

```
{{#each requirements}}
<requirement>{{this}}</requirement>
{{/each}}
```

Usage:
```bash
/prompt:xml template \
  --requirement "First requirement" \
  --requirement "Second requirement" \
  --requirement "Third requirement"
```

### Conditionals ({{#if}})

```
{{#if existing_code}}
<existing_code>{{existing_code}}</existing_code>
{{/if}}
```

Usage:
```bash
/prompt:xml template \
  --existing-code "$(cat current-code.js)"
```

## Commands Reference

### /prompt:xml

Generate XML prompts from templates.

**Usage:**
```bash
/prompt:xml <template> --task "<desc>" --context "<bg>" [options]
```

**See:** `.claude/commands/xml/prompt-xml.md`

### /xml:template

Manage XML templates.

**Actions:**
- `list` - List all templates
- `show <name>` - Show template structure
- `validate <name>` - Validate template
- `create <name>` - Create new template
- `delete <name>` - Delete template
- `export <name>` - Export template
- `import <file>` - Import template

**See:** `.claude/commands/xml/template.md`

## Best Practices

### 1. Be Specific with Tasks

❌ Bad: "Create auth module"
✅ Good: "Create user authentication module with JWT tokens and bcrypt password hashing"

### 2. Provide Comprehensive Context

❌ Bad: "For the app"
✅ Good: "E-commerce platform needs user accounts for order tracking and personalized recommendations"

### 3. Use Numbered Requirements

❌ Bad: "Handle errors"
✅ Good: "1. Validate all input parameters, 2. Return descriptive error messages, 3. Log errors for debugging"

### 4. Specify Constraints Explicitly

❌ Bad: "Use good libraries"
✅ Good: "Allowed: Node.js built-ins, jsonwebtoken, bcrypt. Forbidden: Storing plain text passwords, hardcoding secrets"

### 5. Set Complexity Limits

❌ Bad: "Keep it simple"
✅ Good: "Single responsibility per function, maximum 3 parameters per function, no nested conditionals deeper than 2 levels"

### 6. Follow TDD Strictly

- Always use Stage 2 for new code
- Write tests FIRST (RED)
- Implement MINIMAL code to pass (GREEN)
- Refactor while tests pass (REFACTOR)
- Never skip any phase

### 7. Validate Before Using

```bash
# Generate XML
/prompt:xml stage2-code-generation \
  --task "..." \
  --context "..." \
  --output prompt.xml

# Validate before using
/xml:template validate prompt.xml

# Then execute
cat prompt.xml
```

## Integration with AutoPM

### With PM Workflows

```bash
# 1. Create PRD
/pm:prd-new user-authentication

# 2. Generate architectural design
/prompt:xml stage1-architectural-planning \
  --task "Design auth system" \
  --context "From PRD requirements" \
  --output auth-design.xml

# 3. Parse PRD to epic
/pm:prd-parse user-authentication

# 4. Decompose epic
/pm:epic-decompose user-authentication

# 5. Use XML prompts for each task
/prompt:xml stage2-code-generation \
  --task "Implement login endpoint" \
  --context "From epic task" \
  --execute
```

### With Agents

```bash
# Generate constraint-driven prompt
/prompt:xml stage2-code-generation \
  --task "Create payment service" \
  --allowed "Python, Stripe SDK" \
  --forbidden "Logging card numbers" \
  --execute

# Claude will invoke @python-backend-engineer with XML constraints
```

### With Testing

```bash
# 1. Prime testing framework
/testing:prime

# 2. Generate test suite
/prompt:xml stage3-test-creation \
  --task "Test payment module" \
  --requirement "Test successful charges" \
  --requirement "Test declined cards" \
  --execute

# 3. Run tests
/testing:run
```

## Advanced Usage

### Custom Templates

Create templates tailored to your project:

```bash
# Create custom template
/xml:template create microservice \
  --category dev \
  --stage 2

# Edit template
vim autopm/.claude/templates/xml-prompts/dev/microservice.xml

# Use custom template
/prompt:xml microservice \
  --task "Create inventory service" \
  --context "Microservices architecture"
```

### Template Composition

Use output from one stage as input to next:

```bash
# Stage 1: Architecture
/prompt:xml stage1-architectural-planning \
  --task "Design API" \
  --output design.xml

# Extract design, use in Stage 2
DESIGN=$(sed -n '/<architecture_overview/,/<\/architecture_overview>/p' design.xml)
/prompt:xml stage2-code-generation \
  --task "Implement API" \
  --context "$DESIGN"
```

### Batch Processing

Generate XML prompts for multiple tasks:

```bash
# Loop through tasks
for task in "login" "logout" "register"; do
  /prompt:xml stage2-code-generation \
    --task "Implement $task endpoint" \
    --context "User authentication API" \
    --output "$task-prompt.xml"
done
```

## Troubleshooting

### Template Not Found

```bash
❌ Template not found: my-template

Solution: List available templates
/xml:template list

Or create custom template
/xml:template create my-template --category dev
```

### Validation Failed

```bash
❌ Generated XML failed validation

Solution: Check for missing required fields
- --task is required
- --context is required
- At least one --requirement recommended

Review template structure
/xml:template show <template-name>
```

### Variables Not Substituted

```bash
⚠️ Found unsubstituted template variables: {{complexity_limits}}

Solution: Provide missing flag
/prompt:xml template \
  --task "..." \
  --complexity "Single responsibility"
```

## See Also

- **Templates Guide:** `templates-guide.md` - Using templates effectively
- **Creating Templates:** `creating-templates.md` - Custom template creation
- **Best Practices:** `best-practices.md` - Advanced techniques and patterns
- **Commands:**
  - `.claude/commands/xml/prompt-xml.md`
  - `.claude/commands/xml/template.md`
- **Utilities:**
  - `autopm/.claude/lib/xml-prompt-builder.js`
  - `autopm/.claude/lib/xml-validator.js`
