# Common Development Patterns (Quick Reference)

<pattern_library>

<pattern id="error-handling">
<name>Fail-Fast Error Handling</name>
<when>Critical configuration|Invalid input|System requirements</when>
<code>
# Python
if not config.get('required_field'):
    raise ValueError("Missing required_field")

# TypeScript
if (!config.requiredField) {
    throw new Error('Missing requiredField');
}
</code>
<principle>Fail early|Clear messages|No silent failures</principle>
</pattern>

<pattern id="search-before-create">
<name>Search Before Creating</name>
<when>New files|New functions|New components</when>
<workflow>
1. @code-analyzer search for similar code
2. Grep for related patterns
3. Read existing implementations
4. Reuse or extend existing code
5. Only create if truly new
</workflow>
<why>Prevent duplication|Maintain consistency|Reduce complexity</why>
</pattern>

<pattern id="agent-delegation">
<name>Specialized Agent Delegation</name>
<when>Complex tasks|Domain expertise needed|Context optimization</when>
<mapping>
Python backend → @python-backend-engineer
React UI → @react-frontend-engineer
Database → @postgresql-expert|@mongodb-expert
Testing → @test-runner
Analysis → @code-analyzer
Logs → @file-analyzer
</mapping>
<benefit>Context preservation|Expert knowledge|Parallel work</benefit>
</pattern>

<pattern id="tdd-cycle">
<name>Test-Driven Development</name>
<steps>
🔴 RED: Write failing test
✅ GREEN: Minimal code to pass
♻️ REFACTOR: Clean up code
</steps>
<commits>
test: add failing test for [feature]
feat: implement [feature]
refactor: improve [feature] structure
</commits>
<ref>.claude/quick-ref/tdd-cycle.md</ref>
</pattern>

<pattern id="context7-first">
<name>Documentation-First Development</name>
<workflow>
1. Query Context7 for current docs
2. Review API signatures + patterns
3. Implement using verified approach
4. Test against documentation examples
</workflow>
<ref>.claude/quick-ref/context7-queries.md</ref>
</pattern>

<pattern id="git-workflow">
<name>Branch-Based Git Workflow</name>
<flow>
main (protected)
  └─ feature/name
       ├─ commit: test
       ├─ commit: feat
       ├─ commit: refactor
       └─ PR → review → merge
</flow>
<conventions>
feature/|bugfix/|hotfix/
Conventional commits (feat|fix|docs|test|refactor)
Squash merge to main
</conventions>
</pattern>

<pattern id="definition-of-done">
<name>Comprehensive Definition of Done</name>
<checklist>
✓ All Acceptance Criteria met
✓ Tests written (TDD)
✓ Tests passing (@test-runner)
✓ Code formatted (black|prettier|eslint)
✓ Linting clean (ruff|eslint)
✓ Type checking passed (mypy|tsc)
✓ Documentation updated
✓ No TODOs or placeholders
✓ No partial implementations
✓ Security considered
✓ Error handling implemented
</checklist>
</pattern>

<pattern id="pr-template">
<name>Standard PR Template</name>
<template>
## Summary
- What: [changes made]
- Why: [business/technical reason]
- How: [approach taken]

## Changes
- Component A: [description]
- Component B: [description]

## Test Plan
1. Automated: [test files]
2. Manual: [verification steps]

## Acceptance Criteria
✓ AC1: [description]
✓ AC2: [description]

## Checklist
✓ Tests pass
✓ Linting clean
✓ Documentation updated
✓ Breaking changes noted
</template>
</pattern>

<pattern id="context-optimization">
<name>Agent-Based Context Preservation</name>
<rule>Agent responses ≤ 20% of input data</rule>
<techniques>
- Summaries not full content
- Key findings only
- Actionable insights focus
- Error patterns not raw logs
- Use @file-analyzer for large files
- Use @code-analyzer for deep dives
- Use specialist agents for complex tasks
</techniques>
<ref>.claude/rules/context-optimization.md</ref>
</pattern>

<pattern id="real-services">
<name>Real Services in Tests</name>
<principle>No mocks|Use real implementations|Integration tests</principle>
<why>
Mocks hide bugs|Reality differs|Integration critical
</why>
<approach>
# Use testcontainers
docker run -d postgres:latest
docker run -d redis:latest

# Test against real services
pytest tests/ --real-db --real-cache
</approach>
<ref>.claude/rules/test-execution.md</ref>
</pattern>

<pattern id="datetime-handling">
<name>Real DateTime (No Placeholders)</name>
<rule>Use real ISO 8601 UTC timestamps</rule>
<prohibited>
❌ "2024-01-01T00:00:00Z" (placeholder)
❌ datetime.now() (timezone unaware)
</prohibited>
<correct>
✓ datetime.now(UTC)
✓ "2025-10-18T14:23:45.123Z" (actual time)
</correct>
<ref>.claude/rules/datetime.md</ref>
</pattern>

<pattern id="naming-conventions">
<name>Code Quality Standards</name>
<prohibited>
❌ "_fixed" suffixes
❌ "temp_" files
❌ "WIP" commits
❌ "TODO: add tests"
❌ Hardcoded values
❌ Magic numbers
</prohibited>
<required>
✓ Descriptive names
✓ Single responsibility
✓ Meaningful tests
✓ Error handling
✓ Type annotations
</required>
<ref>.claude/rules/naming-conventions.md</ref>
</pattern>

</pattern_library>

<usage>
These patterns are MANDATORY, not optional.
Follow them consistently across all projects.
See full documentation in .claude/rules/ for details.
</usage>

<full_docs>
.claude/rules/development-workflow.md
.claude/rules/naming-conventions.md
.claude/rules/test-execution.md
.claude/rules/context-optimization.md
</full_docs>
