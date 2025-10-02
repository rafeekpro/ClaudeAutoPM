# Development Workflow Standards

> **CRITICAL**: Systematic approach to every development task.

## Before ANY Implementation

### Required Preparation

1. Check existing codebase for similar functions
2. Read naming conventions from existing code
3. Understand current architecture patterns
4. Plan test cases first
5. Identify which agents to use

### Codebase Analysis

- Search for existing implementations
- Verify no duplication will occur
- Understand dependencies
- Check for related tests
- Review error handling patterns

## During Implementation

### Mandatory Practices

1. Follow TDD cycle religiously
2. Use appropriate agents for context management
3. Never bypass agent pipelines
4. Maintain consistent naming
5. Write verbose tests for debugging

### Quality Checkpoints

- After each test: Verify it fails correctly
- After each implementation: Verify minimal code
- After each refactor: Verify tests still pass
- Before commit: Run full test suite

## After Implementation

### Required Verification

1. Run full test suite via test-runner
2. Use code-analyzer for final review
3. Update documentation ONLY if requested
4. Document patterns in CLAUDE.md if new
5. Verify no resource leaks

### Cleanup Tasks

- Remove any debug code
- Clean up test artifacts
- Close any open resources
- Update status tracking
- Clear any temporary files

## Development Patterns

### Search Before Create

```
ALWAYS:
1. Search for existing function
2. Check for similar patterns
3. Verify not duplicating
4. Only then create new

NEVER:
- Assume function doesn't exist
- Create without searching
- Duplicate existing logic
```

### Test Before Code

```
ALWAYS:
1. Write failing test first
2. Run test to see failure
3. Write minimal code
4. Verify test passes
5. Refactor if needed

NEVER:
- Write code without test
- Skip test execution
- Write complex code first
- Assume test will pass
```

### Agent Before Direct

```
ALWAYS:
1. Use file-analyzer for file reads
2. Use code-analyzer for searches
3. Use test-runner for tests
4. Use parallel-worker for multi-file

NEVER:
- Use grep directly
- Use cat/head/tail directly
- Run tests manually
- Process files sequentially
```

## Error Handling Patterns

### When Error Occurs

1. Stop immediately
2. Activate ERROR HANDLING PIPELINE
3. Write test to reproduce
4. Fix with minimal change
5. Verify all tests pass
6. Document error pattern

### Prevention Strategy

- Defensive coding
- Input validation
- Resource cleanup
- Error propagation
- Graceful degradation

## Performance Considerations

### Optimization Rules

- Profile before optimizing
- Optimize algorithms first
- Then optimize implementation
- Cache expensive operations
- Batch similar operations

### Anti-Patterns

- ❌ Premature optimization
- ❌ Micro-optimizations
- ❌ Ignoring algorithmic complexity
- ❌ Not measuring impact

## Continuous Improvement

### Learn From Each Task

1. Document new patterns discovered
2. Update CLAUDE.md with learnings
3. Create new agent if pattern repeats
4. Improve pipeline efficiency
5. Share knowledge in rules

### Metrics to Track

- Test coverage percentage
- Agent utilization rate
- Context efficiency ratio
- Pipeline completion rate
- Error frequency trends

## Success Indicators

### Task Completion

- ✅ All tests passing
- ✅ No code duplication
- ✅ Consistent naming
- ✅ Proper error handling
- ✅ Resources cleaned up
- ✅ Documentation current
- ✅ Patterns documented

### Quality Markers

- ✅ TDD cycle followed
- ✅ Agents used appropriately
- ✅ Context optimized
- ✅ Pipelines completed
- ✅ No technical debt

## Enforcement

### Violation Response

1. Stop current approach
2. Identify violation type
3. Correct using proper workflow
4. Document lesson learned
5. Update relevant rules

### Prevention Focus

- Checklists before starting
- Agent delegation habits
- TDD discipline
- Regular rule review
- Continuous learning
