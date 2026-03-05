# Context Optimization Strategies

> **CRITICAL**: Preserve conversation context through intelligent agent delegation.

## Core Philosophy

**Context Management**: Use specialized agents to preserve conversation context
**Information Hierarchy**: Only critical information in main thread
**Efficiency Target**: Agents return <20% of processed data

Agent-to-task mapping: See `.claude/rules/agent-mandatory-optimized.md`

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

## Anti-Patterns

- Do not use direct grep/find/cat for large outputs
- Do not dump verbose output to main thread
- Do not process logs in main conversation

```
BAD: Dumping entire log file to main thread
GOOD: Use file-analyzer to extract key errors

BAD: Showing full test output in conversation
GOOD: Use test-runner to run and summarize results
```

## Information Hierarchy

### Priority 1: Critical (Main Thread)

- Blocking errors, security vulnerabilities, data loss risks, user decisions

### Priority 2: Important (Agent Summary)

- Test failures, performance issues, code quality problems

### Priority 3: Verbose (Agent Internal)

- Detailed logs, full test output, complete search results
