# Context Optimization Strategies

> **CRITICAL**: Preserve conversation context through intelligent agent delegation.

## Core Philosophy

**Context Management**: Use specialized agents to preserve conversation context
**Information Hierarchy**: Only critical information in main thread
**Efficiency Target**: Agents return <20% of processed data

## Agent Usage Requirements

### ALWAYS USE file-analyzer WHEN

- Reading any log file
- Analyzing test outputs  
- Reviewing configuration files
- Summarizing verbose outputs
- Reading multiple files for comparison
- Extracting key information from large files

### ALWAYS USE code-analyzer WHEN

- Searching for code patterns
- Tracing logic flow
- Investigating bugs
- Reviewing code changes
- Finding security vulnerabilities
- Analyzing dependencies
- Understanding code structure

### ALWAYS USE test-runner WHEN

- Running any tests
- Validating implementations
- Checking for regressions
- Debugging test failures
- Verifying fixes

### ALWAYS USE parallel-worker WHEN

- Implementing features with multiple components
- Working on multiple files simultaneously
- Decomposing epics into parallel tasks
- Handling independent work streams

### ALWAYS USE fastapi-expert WHEN

- Building FastAPI endpoints
- Implementing API authentication
- Optimizing API performance
- Adding WebSocket functionality
- Debugging FastAPI-specific issues

## Context Firewall Pattern

### Main Thread (High-Level Only)

- Task coordination
- Critical decisions
- User interaction
- Success/failure reporting
- Next step determination

### Agent Threads (Heavy Lifting)

- File reading and analysis
- Code searching and parsing
- Test execution and analysis
- Multi-file operations
- Verbose processing

### Information Return Rules

- Return only actionable insights
- Summarize findings to 10-20% of original
- Focus on decisions needed
- Exclude implementation details
- Never dump raw output

## Batch Operation Strategies

### Parallel Execution

- Use parallel-worker for multi-file changes
- Group related tests in test-runner
- Combine searches in code-analyzer
- Batch similar operations together

### Sequential When Required

- Dependencies between operations
- State changes affecting next steps
- User approval needed between steps

## Anti-Patterns to Avoid

### NEVER DO

- ❌ Direct grep/find/cat usage
- ❌ Reading files without file-analyzer
- ❌ Running tests without test-runner
- ❌ Searching code without code-analyzer
- ❌ Dumping verbose output to main thread
- ❌ Processing logs in main conversation

### Context Waste Examples

```
BAD: Dumping entire log file to main thread
GOOD: Use file-analyzer to extract key errors

BAD: Running grep directly and showing all matches
GOOD: Use code-analyzer to find and summarize patterns

BAD: Showing full test output in conversation
GOOD: Use test-runner to run and summarize results
```

## Information Hierarchy

### Priority 1: Critical (Main Thread)

- Blocking errors
- Security vulnerabilities
- Data loss risks
- User decisions required

### Priority 2: Important (Agent Summary)

- Test failures
- Performance issues
- Code quality problems
- Configuration errors

### Priority 3: Verbose (Agent Internal)

- Detailed logs
- Full test output
- Complete search results
- Implementation details

## Success Metrics

### Context Efficiency

- ✅ All agents return <20% of processed data
- ✅ No raw logs in main thread
- ✅ No direct file reads without agents
- ✅ Batch operations when possible
- ✅ Clear summaries over raw data

### Agent Utilization

- ✅ 100% file reads through file-analyzer
- ✅ 100% code search through code-analyzer
- ✅ 100% test runs through test-runner
- ✅ Multi-file work through parallel-worker

## Enforcement

### Violation Detection

If context wastage detected:

1. Stop current approach
2. Identify appropriate agent
3. Delegate task to agent
4. Resume with summary only

### Continuous Improvement

- Monitor context usage
- Identify patterns for new agents
- Update agent capabilities
- Document new patterns in CLAUDE.md
