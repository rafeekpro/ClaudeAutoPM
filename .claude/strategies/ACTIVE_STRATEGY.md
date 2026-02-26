# ACTIVE_STRATEGY - Hybrid Parallel Execution

## Core Principles

The Hybrid Strategy combines parallel execution with intelligent context management to maximize Claude's capabilities while maintaining security and efficiency.

## Implementation Strategy

### 1. Parallel Execution
- Spawn multiple specialized agents for concurrent task processing
- Each agent operates in isolated context with specific responsibilities
- Coordinator manages agent lifecycle and resource allocation

### 2. Context Isolation
- Each agent maintains separate context sandbox
- No shared variables between agent contexts
- Secure communication through structured message passing

### 3. Resource Management
- Token limit: 100,000 per context
- Max parallel agents: 5
- Recursion depth limit: 10
- Automatic timeout: 30 seconds

### 4. Security Layers

#### Prompt Injection Prevention
- Pattern-based detection for malicious prompts
- Input sanitization and validation
- Anomaly detection (length, nesting, repetition)

#### Context Security
- Isolated execution environments
- Resource consumption monitoring
- Rate limiting and throttling

#### Error Recovery
- Graceful failure handling
- Automatic retry with backoff
- Fallback to sequential execution

## Workflow Patterns

### Parallel Search Pattern
```
1. Receive search request
2. Spawn search agents (max 5)
3. Each agent searches different scope
4. Aggregate and deduplicate results
5. Return consolidated findings
```

### Context Aggregation Pattern
```
1. Break task into subtasks
2. Assign to specialized agents
3. Execute in parallel
4. Merge results maintaining context
5. Validate and return
```

### Resource-Aware Execution
```
1. Monitor token usage
2. Track memory consumption
3. Enforce rate limits
4. Scale down if needed
5. Report metrics
```

## Configuration

### Environment Variables
- `CLAUDE_PARALLEL_ENABLED`: Enable/disable parallel execution
- `CLAUDE_MAX_AGENTS`: Maximum concurrent agents (default: 5)
- `CLAUDE_CONTEXT_ISOLATION`: Enforce strict isolation (default: true)
- `CLAUDE_TOKEN_LIMIT`: Max tokens per context (default: 100000)

### Default Limits
```javascript
const LIMITS = {
  MAX_PARALLEL_AGENTS: 5,
  MAX_CONTEXT_TOKENS: 100000,
  MAX_RECURSION_DEPTH: 10,
  CONTEXT_TIMEOUT: 30000,
  RATE_LIMIT_RPS: 10
};
```

## Testing Strategy

### Security Tests
- Prompt injection detection
- Context isolation verification
- Resource exhaustion prevention
- Rate limiting validation

### Regression Tests
- File structure integrity
- Core functionality preservation
- Backward compatibility
- Configuration stability

### Performance Tests
- Load testing with concurrent requests
- Memory leak detection
- Timeout handling
- Resource limit enforcement

## Integration Points

### With Orchestrator
- Orchestrator spawns and manages agents
- Coordinates parallel execution
- Handles result aggregation

### With Base Configuration
- Inherits project rules from base.md
- Extends with parallel execution capabilities
- Maintains compatibility with existing setup

### With CI/CD Pipeline
- Pre-commit hooks validate changes
- Automated testing on PR
- Performance benchmarking
- Security scanning

## Monitoring and Observability

### Metrics Collection
- Token usage per context
- Agent execution time
- Resource consumption
- Error rates and types

### Health Checks
- System health score (target: >80%)
- Critical path validation
- Feature availability checks
- Performance baselines

## Best Practices

1. **Always validate inputs** before spawning agents
2. **Monitor resource usage** continuously
3. **Implement timeouts** for all async operations
4. **Log security events** for audit trail
5. **Test edge cases** thoroughly
6. **Document changes** to strategy
7. **Review performance** regularly

## Future Enhancements

- [ ] Dynamic agent scaling based on load
- [ ] Advanced caching strategies
- [ ] ML-based anomaly detection
- [ ] Cross-context knowledge sharing
- [ ] Distributed execution support

## References

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Model Context Protocol](https://github.com/anthropics/mcp)
- [Security Best Practices](./security/README.md)
- [Performance Tuning Guide](./performance/README.md)