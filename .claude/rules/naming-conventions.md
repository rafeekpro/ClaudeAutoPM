# Naming Conventions and Code Standards

> **CRITICAL**: Consistent naming and zero technical debt. No exceptions.

## Absolute Naming Prohibitions

### NEVER USE These Suffixes

- ❌ `_advanced`, `_fixed`, `_improved`, `_new`, `_old`
- ❌ `_v2`, `_v3`, `_backup`, `_copy`, `_temp`
- ❌ `_updated`, `_modified`, `_changed`
- ❌ Generic suffixes that don't describe function
- ❌ Version numbers in names (use git for versioning)

### NEVER CREATE These Documentation Files

- ❌ `CHANGES_[DATE]_[FEATURE].md`
- ❌ `SUMMARY_OBJECTIVE_[N].md`
- ❌ `WORKFLOW_SETUP_GUIDE.md`
- ❌ One-off documentation files for single changes
- ❌ Documentation files unless explicitly requested
- ❌ Temporary explanation files

## Required Naming Patterns

### Before ANY Implementation

1. Check existing codebase for naming patterns
2. Read naming conventions from existing code
3. Follow established patterns exactly
4. When in doubt, search for similar functions

### Function/Variable Naming

- Use descriptive names that explain purpose
- Follow language-specific conventions (camelCase, snake_case)
- Maintain consistency with existing codebase
- Prefer clarity over brevity

### File Naming

- Match existing file naming patterns
- Use semantic names that describe content
- No temporary or versioned file names
- Keep extensions consistent

## Code Quality Standards

### NEVER TOLERATE

- ❌ Partial implementations
- ❌ "Simplified" code with TODOs
- ❌ Duplicate functions (always search first)
- ❌ Mixed concerns (UI with DB, validation with API)
- ❌ Resource leaks (unclosed connections, listeners)
- ❌ Dead code (unused functions, imports)
- ❌ Inconsistent formatting

### ALWAYS ENFORCE

- ✅ Single responsibility principle
- ✅ Proper separation of concerns
- ✅ Resource cleanup (close connections, clear timeouts)
- ✅ Consistent error handling
- ✅ Meaningful variable names
- ✅ DRY principle (Don't Repeat Yourself)

## Anti-Pattern Prevention

### Over-Engineering

- Don't add unnecessary abstractions
- Don't create factory patterns when simple functions work
- Don't add middleware for trivial operations
- Don't think "enterprise" when you need "working"

### Under-Engineering

- Don't skip error handling
- Don't ignore edge cases
- Don't hardcode values that should be configurable
- Don't assume happy path only

## Code Review Checklist

Before ANY commit:

1. No naming convention violations
2. No duplicate code
3. No resource leaks
4. No mixed concerns
5. No partial implementations
6. No unnecessary complexity
7. All tests passing

## Enforcement

### Discovery of Violation

1. Stop current work immediately
2. Fix naming to match conventions
3. Remove any duplicate code
4. Clean up resources properly
5. Document pattern in CLAUDE.md

### Prevention Strategy

- Always search before creating new functions
- Always read existing code for patterns
- Always use agents for code analysis
- Never assume, always verify
