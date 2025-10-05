---
allowed-tools: Bash, Read, Write, LS, Task
---

# Epic Decompose

Break epic into concrete, actionable tasks.

## Usage

**Single Epic:**
```bash
/pm:epic-decompose <feature_name> [--local]
```

**Multi-Epic (decomposes ALL epics at once):**
```bash
/pm:epic-decompose <feature_name> [--local]
# Example: /pm:epic-decompose ecommerce-platform --local
# This will automatically decompose ALL epics:
#   - 01-infrastructure
#   - 02-auth-backend
#   - 03-product-api
#   - etc.
```

**Single Epic from Multi-Epic structure:**
```bash
/pm:epic-decompose <feature_name>/<epic_folder> [--local]
# Example: /pm:epic-decompose ecommerce-platform/01-infrastructure --local
```

## Flags

`--local`, `-l`
: Use local mode (offline workflow)
: Creates task files in `.claude/epics/` directory structure
: No GitHub/Azure synchronization
: Task files remain local-only until manually synced
: Ideal for offline work or projects without remote tracking

Example:
```
/pm:epic-decompose user-authentication --local
```

## Required Documentation Access

**MANDATORY:** Before decomposing epics, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/agile/epic-decomposition` - Epic breakdown best practices
- `mcp://context7/agile/task-sizing` - Task estimation and sizing
- `mcp://context7/agile/user-stories` - User story formats (INVEST criteria)
- `mcp://context7/project-management/task-breakdown` - Work breakdown structure

**Why This is Required:**
- Ensures tasks follow industry-standard decomposition patterns
- Applies current best practices for task sizing and dependencies
- Validates task structure against proven methodologies
- Prevents common anti-patterns in task breakdown

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:
- `.claude/rules/datetime.md` - For getting real current date/time

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress ("I'm not going to ..."). Just do them and move on.

1. **Verify epic exists:**
   - Check if `.claude/epics/$ARGUMENTS` directory exists
   - Check for either:
     a) Single epic: `.claude/epics/$ARGUMENTS/epic.md` exists
     b) Multiple epics: Subdirectories like `.claude/epics/$ARGUMENTS/01-infrastructure/epic.md`
   - If neither found, tell user: "❌ Epic not found: $ARGUMENTS. First create it with: /pm:prd-parse $ARGUMENTS or /pm:epic-split $ARGUMENTS"
   - Stop execution if no epics found

2. **Detect epic structure:**
   - If `.claude/epics/$ARGUMENTS/epic.md` exists → Single epic mode
   - If subdirectories with epic.md files exist → Multi-epic mode
   - Store the mode for later processing

3. **Check for existing tasks:**
   - For single epic: Check `.claude/epics/$ARGUMENTS/` for numbered task files
   - For multi-epic: Check each subdirectory for numbered task files
   - If tasks exist, list them and ask: "⚠️ Found {count} existing tasks. Delete and recreate all tasks? (yes/no)"
   - Only proceed with explicit 'yes' confirmation
   - If user says no, suggest: "View existing tasks with: /pm:epic-show $ARGUMENTS"

4. **Validate epic frontmatter:**
   - For single epic: Verify `.claude/epics/$ARGUMENTS/epic.md` has valid frontmatter
   - For multi-epic: Verify each subdirectory's epic.md has valid frontmatter
   - If invalid, tell user which epic file has invalid frontmatter

5. **Check epic status:**
   - For each epic, check if status is already "completed"
   - If any epic is completed, warn user: "⚠️ Epic(s) marked as completed. Are you sure you want to decompose again?"

## ⚠️ TDD REMINDER

**CRITICAL: All tasks MUST follow Test-Driven Development (TDD).**

When creating tasks, ensure each task includes:
- TDD Requirements section (RED-GREEN-REFACTOR cycle)
- "Tests written FIRST" as first item in Definition of Done
- References to `.claude/rules/tdd.enforcement.md`

Every generated task file will remind developers to write tests first.

---

## Instructions

You are decomposing epic(s) into specific, actionable tasks for: **$ARGUMENTS**

### 1. Determine Processing Mode

**Single Epic Mode:**
- Process `.claude/epics/$ARGUMENTS/epic.md`
- Create tasks in `.claude/epics/$ARGUMENTS/`

**Multi-Epic Mode (from epic-split):**
- Find all subdirectories in `.claude/epics/$ARGUMENTS/`
- Process each subdirectory's epic.md file separately
- Create tasks in each respective subdirectory
- Show progress for each epic being processed

### 2. Read the Epic(s)
- For single epic: Load from `.claude/epics/$ARGUMENTS/epic.md`
- For multi-epic: Load each `.claude/epics/$ARGUMENTS/*/epic.md`
- Understand the technical approach and requirements
- Review the task breakdown preview

### 2. Analyze for Parallel Creation

Determine if tasks can be created in parallel:
- If tasks are mostly independent: Create in parallel using Task agents
- If tasks have complex dependencies: Create sequentially
- For best results: Group independent tasks for parallel creation

### 3. Parallel Task Creation (When Possible)

If tasks can be created in parallel, spawn sub-agents:

```yaml
Task:
  description: "Create task files batch {X}"
  subagent_type: "general-purpose"
  prompt: |
    Create task files for epic: $ARGUMENTS

    Tasks to create:
    - {list of 3-4 tasks for this batch}

    For each task:
    1. Create file: .claude/epics/$ARGUMENTS/{number}.md
    2. Use exact format with frontmatter and all sections
    3. Follow task breakdown from epic
    4. Set parallel/depends_on fields appropriately
    5. Number sequentially (001.md, 002.md, etc.)

    Return: List of files created
```

### 4. Task File Format with Frontmatter
For each task, create a file with this exact structure:

```markdown
---
name: [Task Title]
status: open
created: [Current ISO date/time]
updated: [Current ISO date/time]
github: [Will be updated when synced to GitHub]
depends_on: []  # List of task numbers this depends on, e.g., [001, 002]
parallel: true  # Can this run in parallel with other tasks?
conflicts_with: []  # Tasks that modify same files, e.g., [003, 004]
---

# Task: [Task Title]

## Description
Clear, concise description of what needs to be done

## ⚠️ TDD Requirements
**This project uses Test-Driven Development. You MUST:**
1. 🔴 RED: Write failing test first
2. 🟢 GREEN: Write minimal code to make test pass
3. 🔵 REFACTOR: Clean up code while keeping tests green

See `.claude/rules/tdd.enforcement.md` for complete requirements.

## Acceptance Criteria
- [ ] Specific criterion 1
- [ ] Specific criterion 2
- [ ] Specific criterion 3

## Technical Details
- Implementation approach
- Key considerations
- Code locations/files affected

## Dependencies
- [ ] Task/Issue dependencies
- [ ] External dependencies

## Effort Estimate
- Size: XS/S/M/L/XL
- Hours: estimated hours
- Parallel: true/false (can run in parallel with other tasks)

## Definition of Done
- [ ] Tests written FIRST (RED phase)
- [ ] Code implemented (GREEN phase)
- [ ] Code refactored (REFACTOR phase)
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging
```

### 3. Task Naming Convention

**For Single Epic:**
Save tasks as: `.claude/epics/$ARGUMENTS/{task_number}.md`

**For Multi-Epic:**
Save tasks as: `.claude/epics/$ARGUMENTS/{epic_folder}/{task_number}.md`
Example: `.claude/epics/ecommerce/01-infrastructure/001.md`

- Use sequential numbering: 001.md, 002.md, etc.
- Keep task titles short but descriptive
- Each epic gets its own task number sequence

### 4. Frontmatter Guidelines
- **name**: Use a descriptive task title (without "Task:" prefix)
- **status**: Always start with "open" for new tasks
- **created**: Get REAL current datetime by running: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- **updated**: Use the same real datetime as created for new tasks
- **github**: Leave placeholder text - will be updated during sync
- **depends_on**: List task numbers that must complete before this can start (e.g., [001, 002])
- **parallel**: Set to true if this can run alongside other tasks without conflicts
- **conflicts_with**: List task numbers that modify the same files (helps coordination)

### 5. Task Types to Consider
- **Setup tasks**: Environment, dependencies, scaffolding
- **Data tasks**: Models, schemas, migrations
- **API tasks**: Endpoints, services, integration
- **UI tasks**: Components, pages, styling
- **Testing tasks**: Unit tests, integration tests
- **Documentation tasks**: README, API docs
- **Deployment tasks**: CI/CD, infrastructure

### 6. Parallelization
Mark tasks with `parallel: true` if they can be worked on simultaneously without conflicts.

### 7. Execution Strategy

Choose based on task count and complexity:

**Small Epic (< 5 tasks)**: Create sequentially for simplicity

**Medium Epic (5-10 tasks)**:
- Batch into 2-3 groups
- Spawn agents for each batch
- Consolidate results

**Large Epic (> 10 tasks)**:
- Analyze dependencies first
- Group independent tasks
- Launch parallel agents (max 5 concurrent)
- Create dependent tasks after prerequisites

Example for parallel execution:
```markdown
Spawning 3 agents for parallel task creation:
- Agent 1: Creating tasks 001-003 (Database layer)
- Agent 2: Creating tasks 004-006 (API layer)
- Agent 3: Creating tasks 007-009 (UI layer)
```

**Multi-Epic Processing Example:**
```markdown
Processing multiple epics from split:

📂 01-infrastructure/epic.md
   Creating 8 tasks...
   ✅ Done

📂 02-auth-backend/epic.md
   Creating 12 tasks...
   ✅ Done

📂 03-frontend/epic.md
   Creating 10 tasks...
   ✅ Done
```

### 8. Task Dependency Validation

When creating tasks with dependencies:
- Ensure referenced dependencies exist (e.g., if Task 003 depends on Task 002, verify 002 was created)
- Check for circular dependencies (Task A → Task B → Task A)
- If dependency issues found, warn but continue: "⚠️ Task dependency warning: {details}"

### 9. Update Epic with Task Summary
After creating all tasks, update the epic file by adding this section:
```markdown
## Tasks Created
- [ ] 001.md - {Task Title} (parallel: true/false)
- [ ] 002.md - {Task Title} (parallel: true/false)
- etc.

Total tasks: {count}
Parallel tasks: {parallel_count}
Sequential tasks: {sequential_count}
Estimated total effort: {sum of hours}
```

Also update the epic's frontmatter progress if needed (still 0% until tasks actually start).

### 9. Quality Validation

Before finalizing tasks, verify:
- [ ] All tasks have clear acceptance criteria
- [ ] Task sizes are reasonable (1-3 days each)
- [ ] Dependencies are logical and achievable
- [ ] Parallel tasks don't conflict with each other
- [ ] Combined tasks cover all epic requirements

### 10. Post-Decomposition

**For Single Epic:**
After successfully creating tasks:
1. Confirm: "✅ Created {count} tasks for epic: $ARGUMENTS"
2. Show summary:
   - Total tasks created
   - Parallel vs sequential breakdown
   - Total estimated effort
3. Suggest next step: "Ready to sync to GitHub? Run: /pm:epic-sync $ARGUMENTS"

**For Multi-Epic:**
After processing all epics:
1. Show per-epic summary:
   ```
   ✅ Epic Decomposition Complete

   📂 01-infrastructure: 8 tasks created
   📂 02-auth-backend: 12 tasks created
   📂 03-frontend: 10 tasks created

   Total: 30 tasks across 3 epics
   ```
2. Show combined statistics:
   - Total tasks across all epics
   - Total estimated effort
   - Breakdown by epic
3. Suggest next step: "Ready to sync all epics? Run: /pm:epic-sync $ARGUMENTS"

## Error Recovery

If any step fails:
- If task creation partially completes, list which tasks were created
- Provide option to clean up partial tasks
- Never leave the epic in an inconsistent state

Aim for tasks that can be completed in 1-3 days each. Break down larger tasks into smaller, manageable pieces for the "$ARGUMENTS" epic.
