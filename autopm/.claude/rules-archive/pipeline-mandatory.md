# Mandatory Pipeline Execution

> **CRITICAL**: These pipelines are MANDATORY for specific scenarios. No exceptions.

## 1. ERROR HANDLING PIPELINE

**Trigger**: ANY error encountered
**Sequence**:

```
1. code-analyzer → Identify root cause and affected files
2. code-analyzer → Implement fix following TDD:
   - Write failing test (RED)
   - Implement minimum code to pass (GREEN)
   - Refactor while tests pass (REFACTOR)
3. test-runner → Verify fix across entire codebase
4. file-analyzer → Document fix in error log
5. Update CLAUDE.md with new error pattern
```

## 2. FEATURE IMPLEMENTATION PIPELINE

**Trigger**: Any new feature request
**Sequence**:

```
1. /pm:issue-analyze → Decompose into work streams
2. parallel-worker → Spawn sub-agents for each stream:
   - Write failing tests first (RED phase)
   - Implement minimal solution (GREEN phase)
   - Refactor for quality (REFACTOR phase)
3. test-runner → Run full test suite
4. code-analyzer → Review for bugs and edge cases
5. Update README.md with feature documentation
6. Update CLAUDE.md with new patterns learned
```

## 3. BUG FIX PIPELINE

**Trigger**: Bug reported or discovered
**Sequence**:

```
1. code-analyzer → Trace bug through codebase
2. Write test that reproduces bug (must fail)
3. code-analyzer → Implement fix
4. test-runner → Verify fix doesn't break other tests
5. test-runner → Run regression tests
6. Document bug pattern in CLAUDE.md
```

## 4. CODE SEARCH/RESEARCH PIPELINE

**Trigger**: Any code exploration need
**Sequence**:

```
1. code-analyzer → Initial search and analysis
2. file-analyzer → Summarize findings
3. Never use grep/find directly - always use agents
```

## 5. LOG/OUTPUT ANALYSIS PIPELINE

**Trigger**: Verbose outputs or logs to analyze
**Sequence**:

```
1. file-analyzer → Extract critical information
2. Return only actionable insights (10-20% of original)
3. Never dump raw logs to main conversation
```

## 6. EMERGENCY DEBUG PIPELINE

**Trigger**: Critical blocker or production issue
**Sequence**:

```
1. /pm:blocked → Document blocker
2. code-analyzer → Trace bug through codebase
3. Write failing test → Reproduce issue (RED)
4. Fix implementation → Make test pass (GREEN)
5. test-runner → Verify no regressions
6. /pm:issue-close → Mark resolved
```

## Pipeline Bypass Violations

### NEVER ALLOWED

- ❌ Skipping any step in a pipeline
- ❌ Using direct commands instead of agents
- ❌ Implementing without the required pipeline
- ❌ Merging code without pipeline completion

### Enforcement

- Pipelines are atomic - all steps or none
- Each step must complete before next
- Failures require pipeline restart
- No manual overrides permitted

## Success Verification

- Pipeline completion logged
- All agents return success codes
- Tests pass at pipeline end
- Documentation updated as required
