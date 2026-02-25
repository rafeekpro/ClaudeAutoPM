# XML Prompt Templates Guide

Comprehensive guide to using XML prompt templates effectively in AutoPM.

## Template Categories

### Architecture Templates (`arch/`)

Purpose: Design systems before implementation.

#### stage1-architectural-planning.xml

**Use when:**
- Starting new features or modules
- Designing complex systems
- Planning integrations with external systems
- Need to communicate architecture to team

**Inputs:**
- `--task`: What to design
- `--context`: Background and requirements
- `--requirement`: Architectural requirements (multiple)
- `--allowed`: Technology constraints
- `--forbidden`: Approaches to avoid

**Outputs:**
- System architecture diagram
- Data model specification
- API/interface definitions
- Technology stack recommendations

**Example:**
```bash
/prompt:xml stage1-architectural-planning \
  --task "Design real-time notification system" \
  --context "E-commerce platform needs order updates" \
  --requirement "Support WebSocket connections" \
  --requirement "Handle 10k concurrent users" \
  --requirement "Fallback to polling for older browsers" \
  --allowed "Node.js, Redis, Socket.io" \
  --forbidden "Storing connection state in memory, blocking operations"
```

### Development Templates (`dev/`)

Purpose: Generate implementation with TDD enforcement.

#### stage2-code-generation.xml

**Use when:**
- Implementing features from architectural design
- Creating new modules or components
- Adding API endpoints
- Building features from scratch

**Inputs:**
- `--task`: What to implement
- `--context`: Design background
- `--requirement`: Functional requirements (multiple)
- `--allowed`: Permitted libraries
- `--forbidden`: Anti-patterns to avoid
- `--complexity`: Complexity constraints

**Outputs:**
- Test files (written FIRST per TDD)
- Implementation code (minimal to pass)
- Refactored code (clean, maintainable)

**TDD Enforcement:**
- Tests MUST be written first
- Implementation MUST be minimal
- Refactoring MUST maintain passing tests
- Quality checklist validated

**Example:**
```bash
/prompt:xml stage2-code-generation \
  --task "Implement JWT authentication service" \
  --context "From architectural design" \
  --requirement "Generate JWT tokens with expiration" \
  --requirement "Validate JWT tokens" \
  --requirement "Handle token refresh" \
  --requirement "Revoke tokens on logout" \
  --allowed "Node.js, jsonwebtoken, redis" \
  --forbidden "Storing secrets in code, weak crypto algorithms" \
  --complexity "Single responsibility per function, max 3 params"
```

#### dev-api-endpoint.xml

**Use when:**
- Creating REST API endpoints
- Adding GraphQL resolvers
- Implementing RPC methods

**Specific Constraints:**
- Request validation
- Error handling
- Status codes
- Response formatting

### Testing Templates (`test/`)

Purpose: Generate comprehensive test suites.

#### stage3-test-creation.xml

**Use when:**
- Creating tests for existing code
- Adding test coverage
- Building regression test suites
- Testing edge cases

**Inputs:**
- `--task`: What to test
- `--context`: Code background
- `--requirement`: Test scenarios (multiple)
- `--test-coverage-minimum`: Coverage target (default 100%)

**Outputs:**
- Unit tests
- Integration tests
- Edge case tests
- Error condition tests

**Testing Principles:**
- NO mocks (use real implementations)
- Verbose output for debugging
- Isolated tests (no shared state)
- Clear, descriptive test names

**Example:**
```bash
/prompt:xml stage3-test-creation \
  --task "Test payment processing service" \
  --context "Handles Stripe transactions" \
  --requirement "Test successful payment flow" \
  --requirement "Test declined card scenarios" \
  --requirement "Test insufficient funds" \
  --requirement "Test network timeout handling" \
  --requirement "Test idempotency of payment requests" \
  --requirement "Test webhook signature verification" \
  --test-coverage-minimum "95%"
```

#### test-unit-suite.xml

**Use when:**
- Testing individual functions
- Testing class methods
- Testing isolated components

#### test-integration-suite.xml

**Use when:**
- Testing component interactions
- Testing database operations
- Testing API integrations

### Refactoring Templates (`refactor/`)

Purpose: Improve code structure safely.

#### stage4-refactoring.xml

**Use when:**
- Cleaning up technical debt
- Improving maintainability
- Simplifying complex code
- Removing duplication

**Inputs:**
- `--task`: What to refactor
- `--context`: Current code issues
- `--requirement`: Refactoring goals (multiple)
- `--forbidden`: Behavior changes
- `--refactoring-scope`: Scope of changes

**Outputs:**
- Refactored code
- Test results (all passing)
- Refactoring summary

**Refactoring Principles:**
- Preserve behavior (tests MUST pass)
- Small incremental changes
- Test first if no tests exist
- Run tests after each change

**Example:**
```bash
/prompt:xml stage4-refactoring \
  --task "Refactor user service for better maintainability" \
  --context "Current code has 500-line functions and mixed concerns" \
  --requirement "Extract validation logic into separate module" \
  --requirement "Separate data access from business logic" \
  --requirement "Improve error handling consistency" \
  --requirement "Add proper function names" \
  --forbidden "Changing external behavior, breaking existing tests" \
  --refactoring-scope "UserService class and related modules"
```

### Documentation Templates (`doc/`)

Purpose: Generate comprehensive documentation.

#### stage5-documentation.xml

**Use when:**
- Documenting new code
- Creating API documentation
- Writing user guides
- Updating README files

**Inputs:**
- `--task`: What to document
- `--context`: Code background
- `--requirement`: Documentation requirements (multiple)
- `--target-audience`: Who will read this
- `--doc-format`: Output format (markdown, OpenAPI, etc.)

**Outputs:**
- API/function documentation
- Usage examples
- Architecture overview
- README updates

**Example:**
```bash
/prompt:xml stage5-documentation \
  --task "Document authentication API" \
  --context "REST API with JWT tokens" \
  --requirement "Document all endpoints" \
  --requirement "Provide request/response examples" \
  --requirement "Document error responses" \
  --requirement "Include authentication flow diagram" \
  --target-audience "Frontend developers integrating with API" \
  --doc-format "OpenAPI/Swagger compatible"
```

## Selecting the Right Template

### Decision Tree

```
Starting new feature?
├─ Yes → Need design first?
│   ├─ Yes → stage1-architectural-planning
│   └─ No → Have design?
│       ├─ Yes → stage2-code-generation
│       └─ No → Go to design first
└─ No → Working with existing code?
    ├─ Need tests? → stage3-test-creation
    ├─ Need cleanup? → stage4-refactoring
    └─ Need docs? → stage5-documentation
```

### Template Selection Guide

| Situation | Template | Stage |
|-----------|----------|-------|
| New feature, no design | stage1-architectural-planning | 1 |
| New feature, have design | stage2-code-generation | 2 |
| Existing code, no tests | stage3-test-creation | 3 |
| Code works, needs cleanup | stage4-refactoring | 4 |
| Code done, needs docs | stage5-documentation | 5 |

## Template Variables Reference

### Common Variables (All Templates)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `task` | Yes | Objective | "Create user authentication module" |
| `context` | Yes | Background | "E-commerce platform needs user accounts" |
| `requirements` | Yes* | Functional requirements | Array of requirement strings |
| `allowed_libraries` | No | Permitted libraries | "Node.js, Express, Passport" |
| `forbidden_approaches` | No | Anti-patterns | "Plain text passwords, hardcoded secrets" |
| `complexity_limits` | No | Complexity constraints | "Single responsibility, max 3 params" |
| `integration_requirements` | No | Integration points | "Must work with existing user database" |

### Stage 2 (Code Generation) Specific

| Variable | Description |
|----------|-------------|
| `test_format` | Test framework format |
| `code_format` | Programming language format |
| `existing_code` | Current code to extend |

### Stage 3 (Testing) Specific

| Variable | Description |
|----------|-------------|
| `test_coverage_minimum` | Target coverage percentage |
| `test_framework` | Testing framework to use |

### Stage 4 (Refactoring) Specific

| Variable | Description |
|----------|-------------|
| `refactoring_scope` | Boundaries of refactoring |
| `existing_code` | Code to refactor (required) |

### Stage 5 (Documentation) Specific

| Variable | Description |
|----------|-------------|
| `target_audience` | Who will read documentation |
| `doc_format` | Output format (markdown, OpenAPI, etc.) |
| `existing_code` | Code to document (required) |

## Template Usage Patterns

### Pattern 1: Full Feature Development

Follow complete 5-stage workflow:

```bash
# 1. Design
/prompt:xml stage1-architectural-planning --task "..." --context "..."

# 2. Implement (with TDD)
/prompt:xml stage2-code-generation --task "..." --context "..."

# 3. Test
/prompt:xml stage3-test-creation --task "..." --context "..."

# 4. Refactor (if needed)
/prompt:xml stage4-refactoring --task "..." --context "..."

# 5. Document
/prompt:xml stage5-documentation --task "..." --context "..."
```

### Pattern 2: Test-Driven Development

Emphasize TDD cycle:

```bash
# Write tests first using Stage 3
/prompt:xml stage3-test-creation \
  --task "Write tests for user service" \
  --context "Need to test CRUD operations" \
  --requirement "Test user creation" \
  --requirement "Test user retrieval" \
  --requirement "Test user updates" \
  --requirement "Test user deletion" \
  --execute

# Run tests (should fail - RED)
/testing:run

# Implement code to pass (GREEN)
/prompt:xml stage2-code-generation \
  --task "Implement user service" \
  --context "Make tests pass" \
  --execute

# Run tests (should pass - GREEN)
/testing:run

# Refactor (REFACTOR)
/prompt:xml stage4-refactoring \
  --task "Refactor user service" \
  --context "Improve maintainability" \
  --forbidden "Changing behavior" \
  --execute

# Verify tests still pass
/testing:run
```

### Pattern 3: Adding Tests to Existing Code

```bash
# 1. Create comprehensive test suite
/prompt:xml stage3-test-creation \
  --task "Test legacy payment module" \
  --context "Module handles payment processing" \
  --requirement "Test all payment methods" \
  --requirement "Test error scenarios" \
  --test-coverage-minimum "90%" \
  --execute

# 2. Run new tests
/testing:run

# 3. Fix any failing tests (using Stage 2 or manual fixes)

# 4. Verify all tests pass
/testing:run
```

### Pattern 4: Documentation-First Development

```bash
# 1. Design architecture
/prompt:xml stage1-architectural-planning --task "..." --context "..."

# 2. Document API contract
/prompt:xml stage5-documentation \
  --task "Document API endpoints" \
  --context "From architectural design" \
  --requirement "Specify all endpoints" \
  --requirement "Provide examples" \
  --target-audience "Frontend team"

# 3. Implement to match documentation
/prompt:xml stage2-code-generation --task "..." --context "..."
```

## Advanced Template Usage

### Combining with AutoPM Commands

#### With Epic Decomposition

```bash
# Create PRD
/pm:prd-new payment-processing

# Generate architecture
/prompt:xml stage1-architectural-planning \
  --task "Design payment system" \
  --context "From PRD" \
  --output payment-arch.xml

# Parse PRD
/pm:prd-parse payment-processing

# Decompose into tasks
/pm:epic-decompose payment-processing

# Use XML prompts for each task
for task in "stripe-integration" "webhook-handler" "payment-api"; do
  /prompt:xml stage2-code-generation \
    --task "Implement $task" \
    --context "From epic task" \
    --execute
done
```

#### With Agents

```bash
# Generate prompt with constraints
/prompt:xml stage2-code-generation \
  --task "Create Python FastAPI service" \
  --allowed "Python, FastAPI, Pydantic" \
  --forbidden "ORM dependencies, global state" \
  --execute

# Claude will invoke @python-backend-engineer with XML constraints
```

### Template Customization

#### Creating Project-Specific Templates

```bash
# Create custom template based on stage2
/xml:template create microservice --category dev --stage 2

# Edit to add project-specific constraints
vim autopm/.claude/templates/xml-prompts/dev/microservice.xml

# Add your patterns:
# - Service structure requirements
# - Error handling standards
# - Logging conventions
# - Configuration patterns
```

#### Sharing Templates Across Team

```bash
# Export template
/xml:template export my-template --output ~/shared/

# Commit to repo
git add ~/shared/my-template.xml
git commit -m "Add shared template"

# Team members import
/xml:template import ~/shared/my-template.xml
```

## Troubleshooting Templates

### Template Validation Errors

**Error:** Missing required tag `<task>`

**Solution:** Always provide `--task` flag:
```bash
/prompt:xml template --task "Clear objective"
```

**Error:** Empty constraints section

**Solution:** Provide at least one constraint:
```bash
/prompt:xml template \
  --task "..." \
  --allowed "Standard libraries" \
  --forbidden "None specified"
```

### Variable Substitution Issues

**Warning:** Found unsubstituted template variables

**Solution:** Provide all required variables:
```bash
# Check what variables template needs
/xml:template show <template-name>

# Provide missing variables
/prompt:xml template \
  --task "..." \
  --context "..." \
  --complexity "..."  # Was missing
```

### Template Not Found

**Error:** Template not found: custom-template

**Solutions:**
1. List available templates: `/xml:template list`
2. Create custom template: `/xml:template create custom-template --category dev`
3. Use full path: `/prompt:xml dev/custom-template`

## Best Practices

1. **Start with Stage Templates** - They're well-tested and comprehensive
2. **Be Specific** - Detailed tasks produce better results
3. **Use Numbered Requirements** - Clear, unambiguous expectations
4. **Specify Constraints** - Both allowed AND forbidden approaches
5. **Validate Before Using** - Check XML before sending to AI
6. **Follow TDD** - Never skip test-first for Stage 2
7. **Iterate on Prompts** - Refine based on results
8. **Document Learnings** - Add notes to templates for team knowledge

## See Also

- **README:** `README.md` - Overview and quick start
- **Creating Templates:** `creating-templates.md` - Custom template creation
- **Best Practices:** `best-practices.md` - Advanced patterns
