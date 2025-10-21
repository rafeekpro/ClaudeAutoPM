---
command: core:agent-test
plugin: core
category: core-operations
description: Test agent configurations and behaviors
tags:
  - core
  - agents
  - testing
  - validation
  - quality-assurance
tools:
  - agent-manager
  - test-runner
  - Read
  - Write
  - Bash
usage: |
  /core:agent-test --agent <agent-name> [options]
  /core:agent-test --all [options]
examples:
  - input: /core:agent-test --agent postgresql-expert --integration
    description: Integration test for postgresql-expert agent
  - input: /core:agent-test --all --registry-check
    description: Test all agents and verify registry consistency
  - input: /core:agent-test --agent aws-cloud-architect --benchmark --verbose
    description: Performance benchmark for aws-cloud-architect with detailed output
  - input: /core:agent-test --agent test-runner --validate
    description: Validate test-runner agent configuration only
---

# core:agent-test

Test agent configurations and behaviors with comprehensive validation, integration testing, and performance benchmarking.

## Description

The `/core:agent-test` command provides comprehensive testing capabilities for ClaudeAutoPM agents, ensuring they meet quality standards and function correctly. It validates agent file structure, documentation completeness, Context7 query integration, tool availability, and performs integration and performance testing.

**Use this command to:**
- Validate agent file structure and frontmatter
- Check documentation completeness and quality
- Verify Context7 documentation queries
- Test tool availability and references
- Validate examples and usage patterns
- Perform integration testing with commands
- Benchmark agent performance
- Verify registry consistency

## Required Documentation Access

**MANDATORY:** Before testing agents, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/jest/testing` - Jest testing patterns and best practices
- `mcp://context7/testing-library/best-practices` - Testing library standards
- `mcp://context7/yaml/validation` - YAML validation and frontmatter parsing
- `mcp://context7/markdown/parsing` - Markdown parsing and structure validation

**Why This is Required:**
- Ensures tests follow industry-standard Jest patterns
- Validates agent configurations against current YAML/Markdown standards
- Prevents test anti-patterns and flaky tests
- Applies proven testing methodologies for agent validation
- Ensures comprehensive coverage of agent capabilities

## Usage

```bash
# Test specific agent
/core:agent-test --agent <agent-name>

# Test all agents
/core:agent-test --all

# Validation only (no integration tests)
/core:agent-test --agent <agent-name> --validate

# Integration testing
/core:agent-test --agent <agent-name> --integration

# Performance benchmarking
/core:agent-test --agent <agent-name> --benchmark

# Registry consistency check
/core:agent-test --all --registry-check

# Verbose output
/core:agent-test --agent <agent-name> --verbose
```

## Options

### `--agent <name>`
Specify agent to test (e.g., `aws-cloud-architect`, `postgresql-expert`)

### `--all`
Test all agents in the registry

### `--validate`
Perform validation checks only (skip integration and performance tests)
- Frontmatter structure
- YAML syntax
- Required fields
- Documentation completeness
- Context7 queries
- Tool references

### `--integration`
Run integration tests
- Agent invocation
- Command execution
- Output format validation
- Error handling

### `--benchmark`
Run performance benchmarking
- Response time metrics
- Token usage tracking
- Performance issue detection
- Multiple iteration testing

### `--registry-check`
Verify registry consistency
- Agent listed in registry
- Metadata accuracy
- Orphaned file detection
- File path validation

### `--verbose`
Show detailed output including:
- Individual test results
- Validation details
- Performance metrics
- Error stack traces

### `--iterations <n>`
Number of iterations for benchmarking (default: 5)

### `--threshold <ms>`
Performance threshold in milliseconds (default: 2000)

## Examples

### Basic Agent Validation

```bash
/core:agent-test --agent postgresql-expert --validate
```

**Output:**
```
🧪 Testing Agent: postgresql-expert

✅ File Validation
  ✓ Agent file exists
  ✓ Valid frontmatter
  ✓ Valid YAML syntax
  ✓ All required fields present

✅ Documentation Check
  ✓ Complete description
  ✓ Examples provided
  ✓ Context7 queries present
  ✓ Tool list documented

✅ Context7 Validation
  ✓ 4 queries found
  ✓ Valid query format
  ✓ Queries relevant to agent purpose

✅ Tool Verification
  ✓ All tools available
  ✓ Tool references valid
  ✓ Permissions configured

📊 Summary: All validation checks passed
```

### Integration Testing

```bash
/core:agent-test --agent aws-cloud-architect --integration
```

**Output:**
```
🧪 Testing Agent: aws-cloud-architect

✅ Validation Complete

🔄 Integration Tests
  ✓ Agent invocation successful
  ✓ Command integration working
  ✓ Output format valid
  ✓ Error handling correct

📊 Integration Tests: 4/4 passed
```

### Performance Benchmarking

```bash
/core:agent-test --agent test-runner --benchmark --iterations 10
```

**Output:**
```
🧪 Testing Agent: test-runner

⚡ Performance Benchmark (10 iterations)

  Response Time:
    Average: 850ms
    Min: 720ms
    Max: 1100ms

  Token Usage:
    Average: 1250 tokens
    Total: 12500 tokens

  Performance Status: ✅ GOOD
  No performance issues detected

📊 Benchmark Complete
```

### Registry Consistency Check

```bash
/core:agent-test --all --registry-check
```

**Output:**
```
🧪 Testing All Agents - Registry Consistency

✅ agent-manager
  ✓ In registry
  ✓ Metadata valid
  ✓ File path correct

✅ code-analyzer
  ✓ In registry
  ✓ Metadata valid
  ✓ File path correct

✅ test-runner
  ✓ In registry
  ✓ Metadata valid
  ✓ File path correct

⚠️  orphaned-agent
  ✗ Not in registry
  ⚠ Orphaned file detected

📊 Summary: 45/46 agents valid, 1 orphaned file found
```

### Comprehensive Test with Verbose Output

```bash
/core:agent-test --agent postgresql-expert --validate --integration --benchmark --verbose
```

## Implementation

### 1. Agent Selection

Use `@agent-manager` to identify target agents:

```bash
# Single agent
agent_path=$(find .claude/agents -name "${AGENT_NAME}.md")

# All agents
agent_paths=$(find .claude/agents -type f -name "*.md")
```

### 2. File Validation and Frontmatter Validation

```javascript
// Parse frontmatter
const frontmatter = parseFrontmatter(agentContent);

// Validate YAML syntax
const yamlValid = validateYAML(frontmatter);

// Frontmatter validation - check required fields
const requiredFields = ['name', 'description', 'tools', 'model', 'color'];
const hasAllFields = requiredFields.every(field => frontmatter[field]);

// Validate markdown structure
const sections = parseMarkdownSections(agentContent);
```

### 3. Documentation Checks and Example Validation

```javascript
// Check description completeness
const hasDescription = content.includes('## Description');
const descriptionComplete = getSection(content, 'Description').length > 100;

// Verify examples and perform example validation
const hasExamples = content.includes('## Examples');
const exampleCount = countCodeBlocks(content);
const exampleValidation = validateExamples(content);

// Validate Context7 queries
const hasContext7 = content.includes('**Documentation Queries:**');
const queries = extractContext7Queries(content);
```

### 4. Context7 Validation

```javascript
// Extract queries
const queryPattern = /mcp:\/\/context7\/[\w\/-]+/g;
const queries = content.match(queryPattern) || [];

// Validate format
const validFormat = queries.every(q => q.startsWith('mcp://context7/'));

// Check relevance
const agentPurpose = frontmatter.description.toLowerCase();
const relevant = queries.some(q =>
  q.toLowerCase().includes(agentPurpose.split(' ')[0])
);
```

### 5. Tool Verification

```javascript
// Get tools from frontmatter
const tools = frontmatter.tools || [];

// Check availability
const availableTools = ['Read', 'Write', 'Bash', 'Grep', 'Glob', 'Edit'];
const allAvailable = tools.every(t => availableTools.includes(t));

// Validate references
const toolsReferenced = tools.filter(tool =>
  content.includes(tool)
);
```

### 6. Integration Testing

Use `@test-runner` to execute agent tests:

```bash
# Test agent invocation
result=$(echo "Test prompt" | agent-executor --agent ${AGENT_NAME})

# Validate output
if [[ $result == *"expected-pattern"* ]]; then
  echo "✓ Output valid"
fi

# Test error handling
error_result=$(echo "Invalid input" | agent-executor --agent ${AGENT_NAME} 2>&1)
```

### 7. Performance Benchmarking

```javascript
// Run multiple iterations
const results = [];
for (let i = 0; i < iterations; i++) {
  const start = Date.now();
  const result = await testAgent(agentName);
  const duration = Date.now() - start;

  results.push({
    duration,
    tokens: result.tokenUsage
  });
}

// Calculate metrics
const avgTime = results.reduce((a, b) => a + b.duration, 0) / iterations;
const minTime = Math.min(...results.map(r => r.duration));
const maxTime = Math.max(...results.map(r => r.duration));

// Identify issues
const issues = [];
if (avgTime > threshold) {
  issues.push(`Average response time (${avgTime}ms) exceeds threshold (${threshold}ms)`);
}
```

### 8. Registry Consistency

```javascript
// Load registry
const registry = loadPluginRegistry();

// Check agent in registry
const inRegistry = registry.agents.some(a => a.name === agentName);

// Validate metadata
const registryEntry = registry.agents.find(a => a.name === agentName);
const metadataValid = validateAgentMetadata(registryEntry);

// Check for orphans
const allFiles = findAllAgentFiles();
const registeredFiles = registry.agents.map(a => a.file);
const orphans = allFiles.filter(f => !registeredFiles.includes(f));
```

## Output Format

### Validation Results

```
✅ PASS - Check passed
✗ FAIL - Check failed
⚠️  WARN - Warning or issue detected
ℹ️  INFO - Informational message
```

### Test Summary

```
📊 Summary: X/Y tests passed
```

### Performance Metrics

```
⚡ Performance Benchmark
  Average: XXXms
  Min: XXXms
  Max: XXXms
  Status: ✅ GOOD / ⚠️ SLOW / ✗ CRITICAL
```

### Registry Status

```
✅ agent-name
  ✓ In registry
  ✓ Metadata valid
  ✓ File path correct
```

## Exit Codes

- `0` - All tests passed
- `1` - Validation failures detected
- `2` - Integration test failures
- `3` - Performance issues detected
- `4` - Registry consistency errors

## Related Agents

- **@agent-manager** - Agent creation and management
- **@test-runner** - Test execution and analysis
- **@code-analyzer** - Code quality analysis

## Best Practices

1. **Run validation before commits**: Ensure agent changes don't break validation
2. **Use --verbose for debugging**: Get detailed output when investigating failures
3. **Benchmark regularly**: Track performance over time
4. **Check registry consistency**: Prevent orphaned files and metadata drift
5. **Validate Context7 queries**: Ensure agents use current documentation
6. **Test integration**: Verify agents work with commands and other agents

## Notes

- Tests run in isolated environment to prevent side effects
- Performance benchmarks use average of multiple iterations
- Registry checks validate both file existence and metadata accuracy
- Context7 queries are validated for format and relevance
- All tools referenced must be available in agent's tool list
