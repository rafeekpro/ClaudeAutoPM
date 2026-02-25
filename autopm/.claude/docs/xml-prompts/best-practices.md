# XML Prompting Best Practices

Advanced techniques and patterns for effective XML structured prompting.

## Core Principles

### 1. Clarity Over Brevity

❌ **Bad:**
```bash
/prompt:xml stage2-code-generation \
  --task "Create auth" \
  --context "For the app"
```

✅ **Good:**
```bash
/prompt:xml stage2-code-generation \
  --task "Create JWT-based user authentication module" \
  --context "E-commerce platform needs secure user login with token refresh and logout capability"
```

### 2. Specific Over Generic

❌ **Bad:**
```
Handle errors properly
Use good libraries
```

✅ **Good:**
```
Return 401 for invalid credentials
Return 500 with error message for server errors
Log errors with stack traces for debugging
Use jsonwebtoken for JWT operations
Use bcrypt for password hashing
```

### 3. Constraints Over Suggestions

❌ **Bad:**
```
Consider using async/await
Maybe add input validation
```

✅ **Good:**
```
Use async/await for all async operations
Validate all input parameters before processing
Sanitize user input to prevent injection attacks
```

## Task Definition Patterns

### Pattern: Context-Rich Tasks

Structure tasks with:
- **What** - Action to perform
- **Why** - Business justification
- **For Whom** - Target users
- **Constraints** - Technical limitations

**Example:**
```bash
--task "Create user registration endpoint for mobile app customers. Must validate email uniqueness, send verification email, and return user profile with JWT token. Target: 100 registrations/second."
```

### Pattern: Outcome-Focused Tasks

Define success criteria:

**Example:**
```bash
--task "Implement payment processing that successfully charges Stripe tokens, handles declined cards with clear error messages, logs all transactions for audit, and idempotently handles duplicate requests"
```

### Pattern: Integration-Aware Tasks

Specify integration points:

**Example:**
```bash
--task "Create order management service that integrates with existing inventory system (check stock), payment gateway (charge cards), and notification service (send email confirmations)"
```

## Requirements Specification

### Pattern: INVEST Criteria

Apply INVEST to requirements:
- **I**ndependent - Can be implemented separately
- **N**egotiable - Allow flexibility in approach
- **V**aluable - Deliver clear value
- **E**stimable - Can scope effort
- **S**mall - Focused and achievable
- **T**estable - Can verify completion

**Example:**
```bash
--requirement "Implement user registration with email validation"  # Independent, Valuable, Testable
--requirement "Send verification email within 5 seconds"  # Estimable, Small, Testable
--requirement "Return JWT token valid for 24 hours"  # Negotiable (duration), Testable
```

### Pattern: Acceptance Criteria

Define clear acceptance criteria:

**Example:**
```bash
--requirement "POST /users accepts {email, password, name}"
--requirement "Returns 201 with {id, email, name, token} on success"
--requirement "Returns 400 with {error, field} for invalid input"
--requirement "Returns 409 if email already exists"
--requirement "Hashes password with bcrypt (cost factor 10)"
```

### Pattern: Edge Case Enumeration

Explicitly list edge cases:

**Example:**
```bash
--requirement "Handle null/undefined email gracefully"
--requirement "Reject passwords shorter than 8 characters"
--requirement "Reject passwords without uppercase, lowercase, number"
--requirement "Handle email case-insensitively"
--requirement "Limit name field to 100 characters"
```

## Constraint Specification

### Pattern: Allow-List for Libraries

Specify exact permitted libraries:

**Example:**
```bash
--allowed "Node.js built-ins only, express@4.x, jsonwebtoken@9.x, bcrypt@5.x"
```

**Benefits:**
- Prevents dependency bloat
- Ensures compatibility
- Simplifies security reviews

### Pattern: Deny-List for Approaches

Explicitly forbid anti-patterns:

**Example:**
```bash
--forbidden "Storing passwords in plain text, hardcoding secrets, using eval(), callback hell, global variables, synchronous database queries"
```

**Benefits:**
- Prevents security vulnerabilities
- Enforces best practices
- Avoids known pitfalls

### Pattern: Complexity Limits

Define complexity constraints:

**Example:**
```bash
--complexity "Single responsibility per function, maximum 3 parameters per function, maximum 2 levels of nesting, maximum 50 lines per function"
```

**Benefits:**
- Maintains code readability
- Enables testing
- Simplifies maintenance

### Pattern: Integration Requirements

Specify integration constraints:

**Example:**
```bash
--integration "Must use existing Auth service for token validation, must use existing Logger service for all logging, must emit events to message bus for order updates"
```

**Benefits:**
- Ensures consistency
- Leverages existing infrastructure
- Prevents duplication

## Deliverables Specification

### Pattern: Testable Deliverables

Make deliverables verifiable:

**Example:**
```xml
<deliverable>
  <name>User Registration Tests</name>
  <description>Test suite covering all registration scenarios</description>
  <format>Jest test file with 10+ test cases</format>
  <required>YES</required>
  <verification>All tests pass with 100% coverage of registration code</verification>
</deliverable>
```

### Pattern: Prioritized Deliverables

Mark required vs optional:

**Example:**
```xml
<deliverable>
  <name>Core Implementation</name>
  <required>YES</required>
</deliverable>
<deliverable>
  <name>Documentation</name>
  <required>NO</required>
</deliverable>
<deliverable>
  <name>Performance Optimization</name>
  <required>Conditional</required>
  <condition>Only if benchmarks show <100 req/s</condition>
</deliverable>
```

### Pattern: Formatted Deliverables

Specify exact output format:

**Example:**
```xml
<deliverable>
  <name>API Documentation</name>
  <format>OpenAPI 3.0 specification in YAML</format>
  <structure>
    - /paths/users/{operation}
    - /components/schemas/User
    - /components/schemas/Error
  </structure>
</deliverable>
```

## Thinking Section Design

### Pattern: Guided Reasoning

Structure thinking with questions:

```xml
<thinking>
Before implementing:

1. Understand Requirements:
   - What exactly needs to be built?
   - What are the success criteria?
   - What are the edge cases?

2. Design the Solution:
   - What components are needed?
   - How do they interact?
   - What data flows where?

3. Plan Testing:
   - What test cases are needed?
   - How to test edge cases?
   - How to achieve 100% coverage?

4. Identify Risks:
   - What could go wrong?
   - How to handle failures?
   - What are the security implications?

5. Verify Constraints:
   - Are all constraints respected?
   - Are forbidden approaches avoided?
   - Are complexity limits met?

After this analysis, proceed with implementation.
</thinking>
```

### Pattern: Decision Framework

Provide decision-making guidance:

```xml
<thinking>
Use this decision framework for each implementation choice:

1. Is this the simplest solution that works?
   - Yes → Proceed
   - No → Simplify

2. Does this follow project patterns?
   - Yes → Proceed
   - No → Check if exception is justified

3. Is this testable?
   - Yes → Proceed
   - No → Redesign for testability

4. Does this respect all constraints?
   - Yes → Proceed
   - No → Choose alternative approach

If any answer is "No", reconsider the approach.
</thinking>
```

## Stage-Specific Best Practices

### Stage 1: Architecture

**Focus:** Design before implementation

**Best Practices:**
1. Define system boundaries clearly
2. Specify component interactions
3. Identify data flows
4. Plan integration points
5. Consider scalability requirements

**Example:**
```bash
/prompt:xml stage1-architectural-planning \
  --task "Design microservices architecture for order processing" \
  --context "E-commerce platform with 10k daily orders" \
  --requirement "Separate services for orders, payments, inventory, notifications" \
  --requirement "Event-driven communication via message queue" \
  --requirement "API gateway for external communication" \
  --requirement "Service discovery mechanism" \
  --allowed "Node.js, Redis, RabbitMQ, PostgreSQL" \
  --forbidden "Monolithic architecture, synchronous service-to-service calls"
```

### Stage 2: Code Generation

**Focus:** TDD enforcement

**Best Practices:**
1. Write tests FIRST (RED phase)
2. Implement MINIMAL code (GREEN phase)
3. Refactor while tests pass (REFACTOR phase)
4. Never skip any phase
5. Maintain 100% test coverage

**Example:**
```bash
/prompt:xml stage2-code-generation \
  --task "Implement order service with CRUD operations" \
  --context "Microservice architecture" \
  --requirement "Create order with validation" \
  --requirement "Update order status" \
  --requirement "Query orders by user ID" \
  --allowed "Node.js, Express, PostgreSQL, TypeORM" \
  --forbidden "Direct SQL queries, skipping validation, missing tests" \
  --complexity "Single responsibility per function"
```

### Stage 3: Test Creation

**Focus:** Comprehensive coverage

**Best Practices:**
1. Test happy paths
2. Test edge cases
3. Test error conditions
4. Use real implementations (no mocks)
5. Make tests verbose for debugging

**Example:**
```bash
/prompt:xml stage3-test-creation \
  --task "Create test suite for order service" \
  --context "Handles order CRUD and status updates" \
  --requirement "Test order creation with valid data" \
  --requirement "Test order creation with invalid data (missing fields)" \
  --requirement "Test order creation with invalid data (negative quantities)" \
  --requirement "Test order status update (pending -> shipped)" \
  --requirement "Test invalid status transition (shipped -> pending)" \
  --requirement "Test order query by user ID" \
  --requirement "Test order query with non-existent user" \
  --test-coverage-minimum "95%"
```

### Stage 4: Refactoring

**Focus:** Improve structure, preserve behavior

**Best Practices:**
1. Ensure tests exist first
2. Identify code smells
3. Refactor in small steps
4. Run tests after each change
5. Never change external behavior

**Example:**
```bash
/prompt:xml stage4-refactoring \
  --task "Refactor order service for better maintainability" \
  --context "Current code has 500-line functions and mixed concerns" \
  --requirement "Extract validation logic" \
  --requirement "Separate data access from business logic" \
  --requirement "Improve error handling consistency" \
  --requirement "Add meaningful function names" \
  --forbidden "Changing external behavior, breaking existing tests"
```

### Stage 5: Documentation

**Focus:** Clear, comprehensive docs

**Best Practices:**
1. Explain "why" not just "what"
2. Provide usage examples
3. Document all public interfaces
4. Specify error conditions
5. Target appropriate audience

**Example:**
```bash
/prompt:xml stage5-documentation \
  --task "Document order management API" \
  --context "REST API for e-commerce platform" \
  --requirement "Document all endpoints (GET, POST, PUT, DELETE)" \
  --requirement "Provide request/response examples" \
  --requirement "Document authentication requirements" \
  --requirement "Document error responses with codes" \
  --requirement "Include integration examples" \
  --target-audience "Frontend developers integrating with API" \
  --doc-format "OpenAPI 3.0 specification"
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Vague Tasks

❌ **Don't:**
```bash
--task "Create good code"
```

✅ **Do:**
```bash
--task "Create user registration endpoint with email validation, password hashing, and JWT token generation"
```

### Anti-Pattern 2: Missing Context

❌ **Don't:**
```bash
--context "For the project"
```

✅ **Do:**
```bash
--context "E-commerce platform serving 100k daily users, needs to handle 1000 req/sec, must integrate with existing Auth service"
```

### Anti-Pattern 3: Over-Constraining

❌ **Don't:**
```bash
--allowed "Only one specific library version"
--forbidden "Everything else"
```

✅ **Do:**
```bash
--allowed "Express 4.x, any compatible middleware"
--forbidden "Deprecated libraries, known security vulnerabilities"
```

### Anti-Pattern 4: Under-Constraining

❌ **Don't:**
```bash
--allowed "Anything"
--forbidden "None"
```

✅ **Do:**
```bash
--allowed "Project standard libraries"
--forbidden "Experimental libraries, libraries < 1.0.0"
```

### Anti-Pattern 5: Skipping TDD

❌ **Don't:**
```bash
# Write code directly, think about tests later
```

✅ **Do:**
```bash
# Use Stage 2 template which enforces TDD
/prompt:xml stage2-code-generation --task "..." --context "..."
```

## Integration with AutoPM Workflow

### With PRD to Epic

```bash
# 1. Create PRD
/pm:prd-new order-management

# 2. Generate architecture
/prompt:xml stage1-architectural-planning \
  --task "Design order management system" \
  --context "$(cat .pm/prds/order-management.md)" \
  --output design.xml

# 3. Parse PRD
/pm:prd-parse order-management

# 4. Decompose into tasks
/pm:epic-decompose order-management
```

### With Parallel Agents

```bash
# Generate prompts for parallel work
for service in "users" "orders" "payments"; do
  /prompt:xml stage2-code-generation \
    --task "Implement $service microservice" \
    --context "From architectural design" \
    --output "$service-prompt.xml"
done

# Launch agents in parallel
# Each agent gets its own XML prompt
```

### With Testing Pipeline

```bash
# 1. Prime testing
/testing:prime

# 2. Generate tests
/prompt:xml stage3-test-creation --task "..." --execute

# 3. Run tests
/testing:run

# 4. Analyze failures
# (if any) fix with Stage 2

# 5. Verify all pass
/testing:run
```

## Measuring Success

### Metrics for Effective XML Prompts

1. **First-Time Success** - AI generates correct code on first try
2. **Test Coverage** - Generated tests achieve target coverage
3. **Code Quality** - Passes linting and complexity checks
4. **Constraint Compliance** - All constraints respected
5. **Deliverable Completeness** - All deliverables present

### Iterating on Prompts

If output doesn't meet expectations:

1. **Identify specific issue**
   - Code doesn't follow constraints?
   - Missing deliverables?
   - Tests insufficient?

2. **Clarify requirements**
   - Add more specific requirements
   - Tighten constraints
   - Provide examples

3. **Enhance thinking section**
   - Add more detailed guidance
   - Include decision framework
   - Specify edge cases

4. **Validate and test**
   - Use `--output` to save XML
   - Review before executing
   - Iterate until satisfactory

## Advanced Techniques

### Technique: Template Composition

Use output from one stage as input to another:

```bash
# Generate architecture
ARCH=$(/prompt:xml stage1-architectural-planning \
  --task "Design API" \
  --output -)

# Use in code generation
/prompt:xml stage2-code-generation \
  --task "Implement API" \
  --context "$ARCH"
```

### Technique: Progressive Constraint Addition

Start simple, add constraints iteratively:

```bash
# First pass: minimal constraints
/prompt:xml stage2-code-generation \
  --task "Implement feature" \
  --context "Basic requirements" \
  --allowed "Node.js standard libs"

# Second pass: add quality constraints
/prompt:xml stage2-code-generation \
  --task "Implement feature" \
  --context "From previous iteration" \
  --allowed "Node.js standard libs" \
  --complexity "Max 50 lines per function" \
  --forbidden "Nested callbacks, global variables"

# Third pass: add integration constraints
/prompt:xml stage2-code-generation \
  --task "Implement feature" \
  --context "Refine for integration" \
  --allowed "Node.js standard libs, project utilities" \
  --integration "Must use existing Logger, must emit events"
```

### Technique: Constraint Libraries

Maintain reusable constraint sets:

```bash
# Define constraint library
STANDARD_CONSTRAINTS="--allowed 'Node.js, Express' --forbidden 'Callbacks, globals' --complexity 'Single responsibility'"

TDD_CONSTRAINTS="--test-framework 'Jest' --coverage-minimum '100%'"

# Use in prompts
/prompt:xml stage2-code-generation \
  --task "..." \
  --context "..." \
  $STANDARD_CONSTRAINTS \
  $TDD_CONSTRAINTS
```

## Troubleshooting Guide

### Problem: AI Ignores Constraints

**Solutions:**
1. Make constraints more explicit
2. Add constraint to thinking section
3. Provide examples of compliant code
4. Use forbidden approaches to specify what NOT to do

### Problem: Insufficient Test Coverage

**Solutions:**
1. Add specific edge case requirements
2. Increase coverage-minimum value
3. List explicit test scenarios in requirements
4. Emphasize "no mocks" in constraints

### Problem: Code Over-Engineering

**Solutions:**
1. Strengthen complexity_limits
2. Add "minimal implementation" to thinking
3. Specify "YAGNI principle" in constraints
4. Limit allowed libraries

### Problem: Missing Deliverables

**Solutions:**
1. Make all deliverables required="YES"
2. Add verification criteria
3. Specify exact format expected
4. Include in quality checklist

## See Also

- **README:** `README.md` - Overview and quick start
- **Templates Guide:** `templates-guide.md` - Using templates
- **Creating Templates:** `creating-templates.md` - Custom templates
