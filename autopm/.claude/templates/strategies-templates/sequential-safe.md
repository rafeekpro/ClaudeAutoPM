# ACTIVE_STRATEGY - Sequential Safe Execution

## Core Principles

The Sequential Strategy provides safe, predictable execution with full context preservation.

## Implementation Strategy

### 1. Sequential Processing
- Single agent execution at a time
- Full context available for each operation
- No race conditions or conflicts

### 2. Context Preservation
- Complete history maintained
- No context fragmentation
- Easy debugging and tracing

### 3. Resource Management
- Token limit: 200,000 per conversation
- No parallel overhead
- Predictable resource usage

### 4. Safety Features

#### Simple Error Handling
- Clear error messages
- Easy rollback on failure
- No complex coordination

#### Straightforward Debugging
- Linear execution flow
- Complete stack traces
- Simple reproduction steps

## Workflow Patterns

### Linear Task Pattern
```
1. Receive task
2. Process sequentially
3. Return complete result
4. Move to next task
```

### Safe Search Pattern
```
1. Search comprehensively
2. Review all results
3. Select best matches
4. Process findings
```

## Configuration

### Environment Variables
- `CLAUDE_EXECUTION_MODE`: Set to "sequential"
- `CLAUDE_MAX_TOKENS`: Maximum tokens per conversation (default: 200000)
- `CLAUDE_SAFETY_MODE`: Enable extra safety checks (default: true)

### Default Limits
```javascript
const LIMITS = {
  MAX_CONVERSATION_TOKENS: 200000,
  MAX_FILE_SIZE: 10000000,
  OPERATION_TIMEOUT: 60000
};
```

## When to Use

✅ **Best for:**
- Simple, linear workflows
- Debugging and development
- When context preservation is critical
- Projects with clear, sequential tasks

❌ **Not ideal for:**
- Large-scale searches
- Parallel data processing
- Time-critical operations
- Multi-file refactoring

## Integration

This strategy integrates with:
- Standard Claude Code operations
- All existing tools
- Traditional development workflows
- Simple CI/CD pipelines