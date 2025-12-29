## Task Creation Excellence

### Task Quality Standards

When creating tasks from analysis, follow these guidelines:

#### 1. INVEST Criteria

Every task must meet INVEST criteria:

- **Independent**: Task can be worked on separately from others
- **Negotiable**: Scope can be discussed and refined
- **Valuable**: Delivers clear user or business value
- **Estimable**: Complexity and effort are understood
- **Small**: Can be completed in a single work session
- **Testable**: Has clear acceptance criteria

#### 2. Task Structure

Each task must include:

- **Clear title**: Describes the deliverable, not the activity
- **Acceptance criteria**: Checklist of verifiable outcomes
- **Dependencies**: Other tasks that must complete first
- **Estimated complexity**: S (< 2h), M (2-4h), L (4-8h)
- **Files to modify**: List of affected source files
- **Testing approach**: How the task will be validated

#### 3. Technical Details

Include sufficient context:

- Relevant code paths and entry points
- Integration points with other components
- Edge cases to consider
- Performance implications if applicable

### Anti-Patterns to Avoid

- Vague tasks without clear deliverables
- Tasks too large to complete in one session
- Missing acceptance criteria
- No testing strategy defined
- Incomplete dependency mapping
- Generic descriptions like "improve" or "fix"

### Task Templates

#### Feature Task
```
Title: Add [feature] to [component]
Complexity: [S/M/L]
Files: [list]
Acceptance:
- [ ] Feature works as specified
- [ ] Tests written and passing
- [ ] No regression in existing functionality
```

#### Bug Fix Task
```
Title: Fix [bug description] in [component]
Complexity: [S/M/L]
Files: [list]
Acceptance:
- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Root cause documented
```

#### Refactor Task
```
Title: Refactor [component] to [improvement]
Complexity: [S/M/L]
Files: [list]
Acceptance:
- [ ] All existing tests pass
- [ ] Code quality improved (measurable)
- [ ] No behavior changes
```
