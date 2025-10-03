# Core Agents

System-level agents for project management, code analysis, and orchestration.

---

## Overview

Core agents provide fundamental capabilities that support all other agents:
- **7 core agents** in total
- Available in all team configurations
- Foundation for ClaudeAutoPM functionality

---

## agent-manager

**Purpose:** Create, analyze, and manage agents in the registry

**File:** `.claude/agents/core/agent-manager.md`

### Expertise

- Agent creation and validation
- Registry management
- Agent documentation
- Best practices enforcement
- Template management

### When to Use

```
@agent-manager create a new agent for GraphQL development with Apollo Server

@agent-manager validate all agent definitions in the registry

@agent-manager update documentation for python-backend-engineer

@agent-manager analyze agent usage and suggest optimizations
```

### Example Tasks

**Creating New Agent:**
```
@agent-manager create a new specialized agent:

Name: graphql-api-expert
Purpose: GraphQL API development with Apollo Server
Expertise:
- GraphQL schema design
- Resolver implementation
- Apollo Server configuration
- GraphQL subscriptions
- Performance optimization

Tools: Bash, Edit, Write, Read, npm
Frameworks: Apollo Server, GraphQL, Type-GraphQL
```

**Validating Registry:**
```
@agent-manager validate the agent registry:

Check for:
- Duplicate agents
- Missing required fields
- Incorrect frontmatter
- Broken links in documentation
- Consistent naming conventions
```

---

## code-analyzer

**Purpose:** Analyze code changes for bugs, trace logic flow, investigate issues

**File:** `.claude/agents/core/code-analyzer.md`

### Expertise

- Deep code analysis
- Bug detection
- Logic flow tracing
- Performance analysis
- Security scanning
- Impact analysis

### When to Use

```
@code-analyzer review recent changes for potential bugs

@code-analyzer trace the authentication flow through the codebase

@code-analyzer check for security vulnerabilities in user input handling

@code-analyzer analyze performance bottlenecks in the API endpoints
```

### Example Tasks

**Bug Detection:**
```
@code-analyzer review the recent changes to the authentication module:

Focus on:
- Potential null pointer exceptions
- Unhandled error cases
- Race conditions
- Security vulnerabilities
- Logic errors
```

**Logic Flow Tracing:**
```
@code-analyzer trace the user registration flow:

Starting from: POST /api/users/register
Ending at: Email confirmation sent

Show:
- All files involved
- Key functions called
- Database interactions
- External API calls
- Error handling paths
```

---

## file-analyzer

**Purpose:** Analyze and summarize large files to reduce context usage

**File:** `.claude/agents/core/file-analyzer.md`

### Expertise

- Log file analysis
- Pattern extraction
- Error identification
- Context optimization
- Summary generation

### When to Use

```
@file-analyzer summarize the test.log file extracting key errors

@file-analyzer analyze deployment logs for failure causes

@file-analyzer extract important information from build output
```

### Example Tasks

**Log Analysis:**
```
@file-analyzer summarize test/logs/installation-failure.log:

Extract:
- Error messages
- Stack traces
- Failed steps
- Root cause indicators
- Suggested fixes

Format: Concise summary with line number references
```

**Build Output Analysis:**
```
@file-analyzer analyze the npm build output:

Look for:
- Warnings and errors
- Deprecated dependencies
- Bundle size issues
- Missing dependencies
- Configuration problems
```

---

## test-runner

**Purpose:** Execute tests and provide comprehensive failure analysis

**File:** `.claude/agents/core/test-runner.md`

### Expertise

- Test execution (Jest, Vitest, pytest, etc.)
- Failure analysis
- Coverage reporting
- Performance testing
- Test optimization

### When to Use

```
@test-runner execute all unit tests and analyze failures

@test-runner run integration tests for the API module

@test-runner check test coverage for recent changes

@test-runner execute performance tests and identify slow tests
```

### Example Tasks

**Running Tests:**
```
@test-runner execute the test suite:

Command: npm test
Scope: All unit tests
Focus: Analyze any failures in detail

For each failure provide:
- Test name and file
- Failure reason
- Expected vs actual
- Suggested fix
- Related code location
```

**Coverage Analysis:**
```
@test-runner analyze test coverage:

Generate coverage report
Identify uncovered code
Highlight critical uncovered paths
Suggest tests to add
```

---

## parallel-worker

**Purpose:** Execute independent tasks concurrently for better performance

**File:** `.claude/agents/core/parallel-worker.md`

### Expertise

- Parallel task execution
- Dependency analysis
- Resource optimization
- Concurrent processing
- Load balancing

### When to Use

```
@parallel-worker execute these independent build tasks concurrently

@parallel-worker run multiple test suites in parallel

@parallel-worker optimize the build process with parallel compilation
```

### Example Tasks

**Parallel Execution:**
```
@parallel-worker execute these tasks concurrently:

1. Build frontend (npm run build:frontend)
2. Build backend (npm run build:backend)
3. Run linter (npm run lint)
4. Generate documentation (npm run docs)

Coordinate:
- Start all tasks simultaneously
- Monitor progress
- Report when all complete
- Aggregate results
```

---

## mcp-manager

**Purpose:** Manage Model Context Protocol servers and integrations

**File:** `.claude/agents/core/mcp-manager.md`

### Expertise

- MCP server configuration
- Server diagnostics
- Integration testing
- Documentation access
- Cache management

### When to Use

```
@mcp-manager diagnose Context7 connection issues

@mcp-manager configure new MCP server for our project

@mcp-manager test all MCP integrations and report status
```

### Example Tasks

**Server Diagnostics:**
```
@mcp-manager diagnose why Context7 is not responding:

Check:
- Server configuration in mcp-servers.json
- Network connectivity
- Authentication (API keys)
- Recent error logs
- Cache status

Provide:
- Root cause
- Suggested fix
- Step-by-step resolution
```

**Configuration:**
```
@mcp-manager configure a new MCP server:

Server: Playwright
Purpose: Browser automation for testing
Configuration needed:
- Add to mcp-servers.json
- Install dependencies
- Test connection
- Update documentation
```

---

## documentation-manager

**Purpose:** Create and maintain comprehensive project documentation

**File:** `.claude/agents/core/documentation-manager.md`

### Expertise

- Documentation structure
- API documentation
- User guides
- README files
- Code documentation

### When to Use

```
@documentation-manager create API documentation for the REST endpoints

@documentation-manager update the README with new features

@documentation-manager generate user guide for the CLI commands
```

### Example Tasks

**API Documentation:**
```
@documentation-manager create API documentation:

Source: src/api/routes/
Format: OpenAPI/Swagger

Include:
- All endpoints
- Request/response schemas
- Authentication requirements
- Example requests
- Error responses
```

**README Update:**
```
@documentation-manager update README.md:

Add sections for:
- New MCP integration feature
- Updated CLI commands
- Configuration changes
- Migration guide from v1.x

Keep:
- Existing structure
- Code examples working
- Links valid
```

---

## Common Workflows

### Pre-Release Validation

```
1. @code-analyzer review all changes since last release
   - Check for breaking changes
   - Identify security issues
   - Analyze performance impact

2. @test-runner execute full test suite
   - Run all tests
   - Generate coverage report
   - Analyze failures

3. @agent-manager validate agent registry
   - Check for inconsistencies
   - Verify documentation
   - Confirm all agents working

4. @documentation-manager update release docs
   - Generate changelog
   - Update README
   - Create migration guide
```

### Daily Development

```
1. @code-analyzer review my changes before commit
   - Check for bugs
   - Verify logic correct
   - Ensure security

2. @test-runner run affected tests
   - Execute relevant test suites
   - Check coverage
   - Verify passing

3. @documentation-manager update code comments
   - Add JSDoc/docstrings
   - Update inline documentation
```

### Troubleshooting

```
1. @file-analyzer summarize error logs
   - Extract key errors
   - Identify patterns
   - Find root cause

2. @code-analyzer trace issue through codebase
   - Follow logic flow
   - Identify problem location
   - Suggest fix

3. @mcp-manager diagnose MCP issues (if relevant)
   - Check server status
   - Test connections
   - Fix configuration
```

---

## Coordination Between Core Agents

Core agents often work together:

### Example: Release Preparation

```
# 1. Code Analysis
@code-analyzer review all changes for v1.21.0 release

# 2. Testing
@test-runner execute comprehensive test suite

# 3. Registry Validation
@agent-manager validate entire agent registry

# 4. Documentation
@documentation-manager generate release documentation

# 5. Parallel Optimization
@parallel-worker optimize release build process
```

### Example: Incident Response

```
# 1. Log Analysis
@file-analyzer summarize production error logs from last hour

# 2. Code Investigation
@code-analyzer trace error through codebase

# 3. Testing
@test-runner reproduce issue in test environment

# 4. Documentation
@documentation-manager document incident and resolution
```

---

## Best Practices

### Using agent-manager
- ✅ Create agents for recurring specialized tasks
- ✅ Validate registry regularly
- ✅ Keep agent documentation updated
- ❌ Don't create overlapping agents

### Using code-analyzer
- ✅ Review code before committing
- ✅ Trace complex logic flows
- ✅ Check security issues proactively
- ❌ Don't skip pre-release analysis

### Using file-analyzer
- ✅ Use for large log files
- ✅ Extract patterns and errors
- ✅ Reduce context with summaries
- ❌ Don't use for small files (use Read tool)

### Using test-runner
- ✅ Run tests frequently
- ✅ Analyze failures immediately
- ✅ Track coverage trends
- ❌ Don't ignore flaky tests

### Using parallel-worker
- ✅ Identify independent tasks
- ✅ Optimize build processes
- ✅ Utilize concurrent execution
- ❌ Don't parallelize dependent tasks

### Using mcp-manager
- ✅ Keep MCP servers configured
- ✅ Test connections regularly
- ✅ Monitor performance
- ❌ Don't ignore connection errors

### Using documentation-manager
- ✅ Keep docs up to date
- ✅ Generate API documentation
- ✅ Write clear user guides
- ❌ Don't skip documentation

---

## Related Documentation

- [Agent Registry](registry.md) - Complete agent catalog
- [Language Agents](language-agents.md)
- [Framework Agents](framework-agents.md)
- [Team Management](../cli-reference/team.md)
