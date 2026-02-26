---
allowed-tools: Bash, Read, Write, LS, Grep
---

# XML Prompt Generator

Generate structured XML prompts from templates for precise AI control.

## Required Documentation Access

**MANDATORY:** Before generating XML prompts, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/prompt-engineering/structured-prompts` - Structured prompting techniques
- `mcp://context7/ai/prompt-templates` - Prompt template patterns
- `mcp://context7/xml/validation` - XML structure validation

**Why This is Required:**
- Ensures prompts follow industry best practices
- Applies proven techniques for AI constraint specification
- Validates XML structure for maximum effectiveness
- Prevents common anti-patterns in prompt engineering

## Usage

```
/prompt:xml <template-name> [--flag value]
```

## Available Templates

### Architecture Templates (`arch/*`)
- `stage1-architectural-planning` - Design system architecture
- `arch-system-design` - Complete system design specification
- `arch-api-design` - API/endpoint architecture

### Development Templates (`dev/*`)
- `stage2-code-generation` - Generate code with TDD
- `dev-feature-implementation` - Feature development
- `dev-api-endpoint` - API endpoint creation
- `dev-module-creation` - New module development

### Testing Templates (`test/*`)
- `stage3-test-creation` - Comprehensive test generation
- `test-unit-suite` - Unit test suite
- `test-integration-suite` - Integration test suite
- `test-e2e-scenarios` - End-to-end test scenarios

### Refactoring Templates (`refactor/*`)
- `stage4-refactoring` - Code refactoring with TDD
- `refactor-cleanup` - Code cleanup and simplification
- `refactor-optimize` - Performance optimization
- `refactor-modernize` - Update to modern patterns

### Documentation Templates (`doc/*`)
- `stage5-documentation` - Comprehensive documentation
- `doc-api-reference` - API documentation
- `doc-user-guide` - User guide creation
- `doc-architecture-doc` - Architecture documentation

## Command Flags

### Required Flags

- `--task "<description>"` - What the AI should accomplish
- `--context "<background>"` - Prerequisites and background

### Optional Flags

- `--requirement "<req>"` - Add requirement (can use multiple times)
- `--allowed "<libs>"` - Allowed libraries/frameworks
- `--forbidden "<approaches>"` - Forbidden approaches/anti-patterns
- `--complexity "<limits>"` - Complexity constraints
- `--integration "<reqs>"` - Integration requirements
- `--output <file>` - Save XML to file
- `--execute` - Execute prompt immediately (send to AI)

## Quick Check

1. Verify template exists:
   ```bash
   ls autopm/.claude/templates/xml-prompts/<category>/<template>.xml
   ```

2. Check if XML prompt builder available:
   ```bash
   test -f autopm/.claude/lib/xml-prompt-builder.js
   ```

## Examples

### Example 1: Generate Code with TDD

```bash
/prompt:xml stage2-code-generation \
  --task "Create user authentication module" \
  --context "Needs to support JWT tokens and password hashing" \
  --requirement "Use bcrypt for password hashing" \
  --requirement "Implement JWT token generation" \
  --requirement "Follow TDD methodology" \
  --allowed "Node.js built-ins, jsonwebtoken, bcrypt" \
  --forbidden "Storing plain text passwords, hardcoding secrets" \
  --complexity "Single responsibility per function, no over-engineering" \
  --output auth-prompt.xml
```

### Example 2: Create API Endpoint

```bash
/prompt:xml dev-api-endpoint \
  --task "Create REST API endpoint for user CRUD" \
  --context "Part of user management system" \
  --requirement "GET /users - list all users" \
  --requirement "POST /users - create new user" \
  --requirement "GET /users/:id - get user by ID" \
  --requirement "PUT /users/:id - update user" \
  --requirement "DELETE /users/:id - delete user" \
  --allowed "Express.js, middleware patterns" \
  --forbidden "Direct database queries in routes, callback hell" \
  --execute
```

### Example 3: Generate Test Suite

```bash
/prompt:xml stage3-test-creation \
  --task "Create comprehensive test suite for payment processing" \
  --context "Payment module handles credit card transactions" \
  --requirement "Test successful payment flow" \
  --requirement "Test invalid card numbers" \
  --requirement "Test insufficient funds" \
  --requirement "Test network errors" \
  --requirement "Test idempotency" \
  --allowed "Project test framework (detected via /testing:prime)" \
  --forbidden "Mocking payment services, fake test data" \
  --test-coverage-minimum "95%"
```

### Example 4: Refactor Code

```bash
/prompt:xml stage4-refactoring \
  --task "Refactor user service to improve maintainability" \
  --context "Current code has duplication and mixed concerns" \
  --requirement "Extract validation logic" \
  --requirement "Separate data access from business logic" \
  --requirement "Improve error handling" \
  --forbidden "Changing external behavior, breaking tests" \
  --refactoring-scope "UserService class and related code"
```

### Example 5: Generate Documentation

```bash
/prompt:xml stage5-documentation \
  --task "Create API documentation for authentication endpoints" \
  --context "REST API with JWT authentication" \
  --requirement "Document all endpoints" \
  --requirement "Provide usage examples" \
  --requirement "Document error responses" \
  --target-audience "Frontend developers integrating with API" \
  --doc-format "OpenAPI/Swagger compatible"
```

## Implementation

### Step 1: Parse Arguments

Extract template name and flags from command invocation.

### Step 2: Locate Template

Find template file in `autopm/.claude/templates/xml-prompts/`:

- Check each category directory (arch, dev, test, refactor, doc)
- Use first match found
- Error if template not found

### Step 3: Build Variables Object

Construct variables object from flags:

```javascript
const variables = {
  task: flags.task,
  context: flags.context,
  requirements: flags.requirement || [],  // Array from multiple flags
  allowed_libraries: flags.allowed || 'Project standard libraries',
  forbidden_approaches: flags.forbidden || 'None specified',
  complexity_limits: flags.complexity || 'Standard practices',
  integration_requirements: flags.integration || 'None specified',
  // Stage-specific variables
  test_format: flags.testFormat || 'Project test framework',
  code_format: flags.codeFormat || 'Project language',
  // etc.
};
```

### Step 4: Generate XML

Use `XMLPromptBuilder`:

```javascript
const builder = new XMLPromptBuilder();
const xml = builder.build(templatePath, variables);
```

### Step 5: Validate XML

Use `XMLValidator` to check result:

```javascript
const validator = new XMLValidator();
const validation = validator.validate(xml);

if (!validation.valid) {
  console.error('Validation failed:');
  console.error(validator.formatErrors(validation));
  return;
}
```

### Step 6: Output or Execute

If `--output` specified:
```bash
echo "$xml" > <output-file>
echo "✅ XML prompt saved to $(pwd)/<output-file>"
```

If `--execute` specified:
```bash
echo "📤 Sending XML prompt to AI..."
# Display XML for Claude to process
```

Otherwise:
```bash
echo "$xml"
```

## Error Handling

### Template Not Found

```bash
❌ Template not found: <template-name>
Available templates:
  - arch/stage1-architectural-planning
  - dev/stage2-code-generation
  - test/stage3-test-creation
  - refactor/stage4-refactoring
  - doc/stage5-documentation

List all: /xml:template list
```

### Missing Required Fields

```bash
❌ Missing required flags: --task, --context
Usage: /prompt:xml <template> --task "<desc>" --context "<bg>" [options]
```

### Validation Failed

```bash
❌ Generated XML failed validation:
  - Required field <task> is empty
  - Missing constraint: <forbidden_approaches>

Fix errors and try again.
```

## Integration with Existing Commands

### With /pm:* Commands

Use XML prompts for epic decomposition:

```bash
# Generate XML prompt for epic
/prompt:xml stage1-architectural-planning \
  --task "Design payment processing system" \
  --context "E-commerce platform requirements" \
  --output epic-payment.xml

# Use generated prompt with epic decomposition
/pm:epic-decompose payment-processing --prompt epic-payment.xml
```

### With Agent Invocations

Use XML prompts to guide agent behavior:

```bash
# Generate constraint-driven prompt
/prompt:xml stage2-code-generation \
  --task "Implement payment service" \
  --context "From architectural design" \
  --allowed "Node.js, Stripe SDK" \
  --forbidden "Storing payment data, logging card numbers" \
  --execute

# Claude will use @python-backend-engineer with XML constraints
```

### With Testing

Use XML prompts for comprehensive test coverage:

```bash
# First, prime testing environment
/testing:prime

# Generate test suite prompt
/prompt:xml stage3-test-creation \
  --task "Test payment processing module" \
  --context "Handles credit card transactions" \
  --requirement "Test successful charges" \
  --requirement "Test declined cards" \
  --requirement "Test fraud detection" \
  --execute

# Claude will run tests via @test-runner
```

## Tips

1. **Start with Stage Templates** - Use `stage1` through `stage5` for complete workflows
2. **Be Specific with Constraints** - More constraints = more predictable output
3. **Use Multiple Requirements** - Break down complex tasks into numbered requirements
4. **Leverage Allowed/Forbidden** - Explicitly list what AI can/cannot use
5. **Validate Before Executing** - Use `--output` first, review, then execute manually
6. **Combine with Agents** - XML prompts work great with specialized agents
7. **Follow TDD** - Stage 2 templates enforce test-first development
8. **Iterate on Prompts** - Refine XML prompts based on results

## Related Commands

- `/xml:template` - Manage XML templates
- `/pm:epic-decompose` - Decompose epics (use with stage1)
- `/testing:run` - Run tests (use with stage3)
- `/prompt` - Generic complex prompt handler

## See Also

- `.claude/commands/xml/template.md` - Template management
- `autopm/.claude/docs/xml-prompts/` - XML prompt documentation
- `autopm/.claude/templates/xml-prompts/` - Template library
