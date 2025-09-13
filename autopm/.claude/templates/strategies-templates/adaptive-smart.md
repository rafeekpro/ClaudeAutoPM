# ACTIVE_STRATEGY - Adaptive Smart Execution

## Core Principles

The Adaptive Strategy dynamically chooses between sequential and parallel execution based on task complexity and available resources.

## Implementation Strategy

### 1. Intelligent Decision Making
- Analyzes task complexity before execution
- Switches modes based on context usage
- Optimizes for both speed and safety

### 2. Dynamic Resource Allocation
- Monitors token usage in real-time
- Scales agents up or down as needed
- Prevents context exhaustion

### 3. Smart Fallback Mechanisms
- Starts parallel, falls back to sequential if needed
- Automatic retry with different strategy
- Graceful degradation under load

### 4. Learning and Optimization

#### Task Pattern Recognition
- Identifies repetitive patterns
- Caches successful strategies
- Improves over time

#### Performance Metrics
- Tracks success rates per strategy
- Measures token efficiency
- Optimizes future decisions

## Workflow Patterns

### Adaptive Search Pattern
```
1. Analyze search scope
2. If scope > threshold:
   - Spawn parallel agents
   - Aggregate results
3. Else:
   - Execute sequentially
4. Monitor and adjust
```

### Smart Refactoring Pattern
```
1. Assess change impact
2. For isolated changes:
   - Use parallel execution
3. For interconnected changes:
   - Use sequential with checkpoints
4. Validate continuously
```

### Resource-Aware Pattern
```
1. Check available tokens
2. If tokens < 50%:
   - Switch to sequential
   - Increase summarization
3. If tokens < 20%:
   - Emergency consolidation
   - Critical tasks only
```

## Decision Matrix

| Task Type | Files | Complexity | Strategy |
|-----------|-------|------------|----------|
| Search | >10 | Any | Parallel |
| Search | <10 | Any | Sequential |
| Refactor | Any | High | Sequential |
| Refactor | Any | Low | Parallel |
| Debug | Any | Any | Sequential |
| Generate | >5 | Low | Parallel |
| Generate | Any | High | Sequential |

## Configuration

### Environment Variables
- `CLAUDE_STRATEGY_MODE`: Set to "adaptive"
- `CLAUDE_COMPLEXITY_THRESHOLD`: Task complexity threshold (default: 5)
- `CLAUDE_PARALLEL_THRESHOLD`: File count for parallel (default: 10)
- `CLAUDE_TOKEN_WARNING`: Token usage warning level (default: 0.7)
- `CLAUDE_TOKEN_CRITICAL`: Token usage critical level (default: 0.9)

### Adaptive Limits
```javascript
const ADAPTIVE_CONFIG = {
  // Thresholds for strategy selection
  COMPLEXITY_THRESHOLD: 5,
  FILE_COUNT_THRESHOLD: 10,
  TOKEN_USAGE_THRESHOLD: 0.7,

  // Dynamic limits
  MIN_PARALLEL_AGENTS: 1,
  MAX_PARALLEL_AGENTS: 5,
  OPTIMAL_PARALLEL_AGENTS: 3,

  // Fallback settings
  FALLBACK_AFTER_FAILURES: 2,
  RETRY_WITH_SEQUENTIAL: true,

  // Performance tracking
  TRACK_METRICS: true,
  OPTIMIZATION_WINDOW: 100 // last N tasks
};
```

## Heuristics Engine

### Complexity Calculation
```javascript
function calculateComplexity(task) {
  let score = 0;

  // File interdependency
  score += countImports() * 2;
  score += countExports() * 1.5;

  // Code complexity
  score += cyclomaticComplexity() * 3;
  score += nestingDepth() * 2;

  // Task type weights
  if (task.includes('refactor')) score *= 1.5;
  if (task.includes('debug')) score *= 2;
  if (task.includes('search')) score *= 0.5;

  return score;
}
```

### Strategy Selection
```javascript
function selectStrategy(task, context) {
  const complexity = calculateComplexity(task);
  const fileCount = countAffectedFiles(task);
  const tokenUsage = context.tokens / context.maxTokens;

  // Critical token usage - always sequential
  if (tokenUsage > 0.9) return 'sequential';

  // High complexity - prefer sequential
  if (complexity > COMPLEXITY_THRESHOLD) {
    return tokenUsage > 0.7 ? 'sequential' : 'hybrid';
  }

  // Many files - prefer parallel
  if (fileCount > FILE_COUNT_THRESHOLD) {
    return tokenUsage > 0.5 ? 'hybrid' : 'parallel';
  }

  // Default based on token availability
  return tokenUsage > 0.7 ? 'sequential' : 'parallel';
}
```

## Performance Monitoring

### Tracked Metrics
- Strategy success rate
- Average completion time
- Token efficiency ratio
- Error recovery rate
- Fallback frequency

### Optimization Loop
1. Collect metrics for last 100 tasks
2. Analyze patterns and success rates
3. Adjust thresholds dynamically
4. Update decision matrix
5. Report improvements

## When to Use

✅ **Best for:**
- Mixed workloads
- Long-running projects
- Teams wanting optimization
- Complex, varied tasks
- Production environments

⚠️ **Considerations:**
- Slightly more complex setup
- Requires metric tracking
- May have initial learning curve
- Best with consistent usage

## Integration Points

- Works with all Claude Code features
- Enhances existing workflows
- Compatible with CI/CD
- Supports custom metrics
- Extensible decision engine

## Future Enhancements

- [ ] Machine learning for strategy selection
- [ ] Historical pattern database
- [ ] Team-wide metric sharing
- [ ] Custom heuristic plugins
- [ ] Real-time strategy visualization