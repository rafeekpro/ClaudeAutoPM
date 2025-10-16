# TDD (Test-Driven Development) Enforcement

> **CRITICAL**: This rule has HIGHEST PRIORITY. All code changes MUST follow TDD cycle.

## Core TDD Philosophy

**Prime Directive**: Follow Test-Driven Development (Red-Green-Refactor) for ALL implementations.
**Zero Tolerance**: No code without tests. No partial implementations. No shortcuts.

## The TDD Cycle

### 1. RED Phase (Test First)

- Write test that describes desired behavior
- Test MUST fail initially
- Test must be meaningful (no trivial assertions)
- Test must be verbose for debugging
- Never proceed until test is red

### 2. GREEN Phase (Make It Pass)

- Write MINIMUM code to pass test
- Don't add features not required by test
- Focus on making test green, not perfection
- Resist temptation to over-engineer

### 3. REFACTOR Phase (Clean Up)

- Improve code structure
- Remove duplication
- Enhance readability
- All tests must remain green
- Never skip this phase

## Enforcement Rules

### ABSOLUTE REQUIREMENTS

- Every new function requires a test FIRST
- Every bug fix starts with a failing test that reproduces it
- Every feature begins with failing acceptance tests
- No code commits without passing tests

### PROHIBITED PRACTICES

- ❌ Writing implementation before test
- ❌ Writing "simplified" or "partial" implementations
- ❌ Leaving TODO comments without test coverage
- ❌ Skipping refactor phase "for later"
- ❌ Writing trivial tests just to satisfy coverage

## Test Quality Standards

### Test Design Requirements

- Tests must reflect real usage patterns
- Tests must be designed to reveal flaws
- Tests must be verbose for debugging
- No mock services - use real implementations
- Each test should test ONE thing

### Coverage Requirements

- 100% test coverage for new code
- Regression tests for all bug fixes
- Integration tests for feature interactions
- Edge case coverage mandatory

## Integration with Agents

### MANDATORY Agent Usage

- **test-runner agent**: For ALL test execution
- **code-analyzer agent**: Review test coverage
- **parallel-worker agent**: Run tests in parallel streams

### Pipeline Integration

```
Feature Implementation:
1. Write failing test (RED) → test-runner confirms failure
2. Implement minimum code (GREEN) → test-runner confirms pass
3. Refactor (REFACTOR) → test-runner maintains green
4. code-analyzer → Verify test quality and coverage
```

## Violation Consequences

If TDD is violated:

1. STOP immediately
2. Delete non-TDD code
3. Start over with test first
4. Document violation in CLAUDE.md
5. No exceptions, no excuses

## Success Metrics

- ✅ 100% of new code has tests written first
- ✅ Zero commits without test coverage
- ✅ All tests meaningful and verbose
- ✅ Refactor phase completed for all code
- ✅ No mock services in test suite
