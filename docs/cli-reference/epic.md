# Epic Management Commands

Complete reference for epic-level project management commands.

---

## autopm epic list

List all epics in the project.

### Synopsis

```bash
autopm epic list [options]
```

### Description

Lists all epic files in the `epics/` directory with their status and progress.

### Options

| Option | Description |
|--------|-------------|
| `--status <status>` | Filter by status (active, completed, archived) |
| `--json` | Output as JSON |
| `--verbose` | Show detailed information |

### Examples

**List all epics:**
```bash
autopm epic list
```

Output:
```
Epics:

epic-001-task-management-api.md
  Status: In Progress
  Progress: 6/12 tasks (50%)
  Created: 2025-01-01
  Updated: 2025-01-03

epic-002-user-authentication.md
  Status: Completed
  Progress: 8/8 tasks (100%)
  Created: 2024-12-28
  Completed: 2025-01-02

epic-003-payment-integration.md
  Status: Active
  Progress: 0/15 tasks (0%)
  Created: 2025-01-03

Total: 3 epics
Active: 2
Completed: 1
```

**List active epics:**
```bash
autopm epic list --status active
```

**List with details:**
```bash
autopm epic list --verbose
```

---

## autopm epic validate

Validate epic file structure and content.

### Synopsis

```bash
autopm epic validate <epic-file>
```

### Description

Validates an epic file to ensure it has correct structure and all required sections.

### Validation Checks

#### 1. File Format
- ✅ Valid Markdown format
- ✅ Frontmatter present and valid
- ✅ File naming convention

#### 2. Required Sections
- ✅ Epic title (H1)
- ✅ Description/Overview
- ✅ Tasks section
- ✅ PRD reference

#### 3. Task Format
- ✅ Tasks use proper checkbox format
- ✅ Tasks have descriptions
- ✅ Issue numbers valid (if linked)

#### 4. Links
- ✅ PRD file exists
- ✅ Issue links valid (if provider configured)
- ✅ No broken internal links

### Examples

**Validate epic:**
```bash
autopm epic validate epics/epic-001-task-management-api.md
```

Output:
```
Validating: epics/epic-001-task-management-api.md

✅ File format: OK
✅ Frontmatter: OK
   - Title: Task Management API
   - Epic ID: epic-001
   - Status: in_progress
   - PRD: prds/prd-001-task-management-api.md

✅ Required sections: OK
   - Title (H1): Present
   - Description: Present
   - Tasks: Present (12 tasks)
   - PRD reference: Present

✅ Task format: OK
   - All tasks have valid format
   - 6 tasks completed
   - 6 tasks pending

⚠️  Links: WARNING
   - PRD file exists: Yes
   - Issue #7 not found in GitHub
   - Issue #8 not found in GitHub

Validation completed with 2 warnings
```

**Validate and fix:**
```bash
autopm epic validate epics/epic-001.md --fix
```

---

## autopm epic status

Show epic status and progress.

### Synopsis

```bash
autopm epic status <epic-file>
```

### Description

Displays detailed status and progress information for an epic.

### Examples

**Show epic status:**
```bash
autopm epic status epics/epic-001-task-management-api.md
```

Output:
```
Epic 001: Task Management API

Status: In Progress
Progress: 6/12 tasks (50%)
Duration: 5 days
Estimate: 10 days remaining

PRD: prds/prd-001-task-management-api.md
Created: 2025-01-01
Updated: 2025-01-03
Last sync: 2025-01-03 08:15:30

Tasks:

✅ #1: Setup FastAPI project structure
   Completed: 2025-01-01
   Assignee: @developer1

✅ #2: Configure PostgreSQL database
   Completed: 2025-01-01
   Assignee: @developer1

✅ #3: Create User model
   Completed: 2025-01-02
   Assignee: @developer2

✅ #4: Implement authentication endpoints
   Completed: 2025-01-02
   Assignee: @developer2

✅ #5: Create Task CRUD endpoints
   Completed: 2025-01-03
   Assignee: @developer1

✅ #6: Add API tests
   Completed: 2025-01-03
   Assignee: @developer2

⏳ #7: Write API documentation
   Status: In Progress
   Assignee: @developer1

⏳ #8: Docker containerization
   Status: Pending
   Blocked by: #7

⏳ #9: Kubernetes deployment
   Status: Pending
   Blocked by: #8

⏳ #10: CI/CD pipeline
   Status: Pending

⏳ #11: Monitoring setup
   Status: Pending

⏳ #12: Production deployment
   Status: Pending
   Blocked by: #9, #10, #11

Statistics:
  Completed: 6 tasks (50%)
  In Progress: 1 task (8%)
  Pending: 5 tasks (42%)
  Blocked: 3 tasks (25%)

  Velocity: 1.2 tasks/day
  Estimated completion: 2025-01-13
```

---

## autopm epic sync

Synchronize epic with provider (GitHub/Azure DevOps).

### Synopsis

```bash
autopm epic sync <epic-file> [options]
```

### Description

Synchronizes epic tasks with provider issues/work items.

**What it does:**
1. Reads epic file
2. Parses tasks
3. For each task without issue number:
   - Creates GitHub issue or Azure DevOps work item
   - Links to epic
   - Sets labels/tags
4. Updates epic file with issue numbers
5. Syncs task status bidirectionally

### Options

| Option | Description |
|--------|-------------|
| `--create-missing` | Create issues for tasks without numbers |
| `--update-status` | Update task status from provider |
| `--dry-run` | Show what would be synced |
| `--force` | Overwrite local changes |

### Examples

**Sync epic with GitHub:**
```bash
autopm epic sync epics/epic-001-task-management-api.md
```

Output:
```
Syncing epic: Task Management API

Reading epic file...
✅ Found 12 tasks

Syncing with GitHub...
✅ Created issue #7: Write API documentation
✅ Created issue #8: Docker containerization
✅ Created issue #9: Kubernetes deployment
✅ Created issue #10: CI/CD pipeline
✅ Created issue #11: Monitoring setup
✅ Created issue #12: Production deployment

Updating epic file...
✅ Updated task #7 with issue number
✅ Updated task #8 with issue number
✅ Updated task #9 with issue number
✅ Updated task #10 with issue number
✅ Updated task #11 with issue number
✅ Updated task #12 with issue number

Sync completed successfully!
  Created issues: 6
  Updated tasks: 6
  No errors

View on GitHub:
  https://github.com/myusername/myproject/issues?q=label:epic-001
```

**Dry run (show what would happen):**
```bash
autopm epic sync epics/epic-001.md --dry-run
```

**Sync and update status:**
```bash
autopm epic sync epics/epic-001.md --update-status
```

Updates local epic file with latest status from GitHub issues.

---

## autopm epic create

Create new epic from PRD.

### Synopsis

```bash
autopm epic create <prd-file> [options]
```

### Description

Creates a new epic by decomposing a PRD into implementable tasks.

**This is a helper command.** For full AI-powered decomposition, use the slash command `/pm:epic-decompose` in Claude Code.

### Options

| Option | Description |
|--------|-------------|
| `--template <file>` | Use custom epic template |
| `--no-sync` | Don't sync to provider immediately |

### Examples

**Create epic from PRD:**
```bash
autopm epic create prds/prd-001-task-management-api.md
```

Output:
```
Creating epic from PRD...

✅ Read PRD: Task Management API
✅ Generated epic ID: epic-001
✅ Created epic file: epics/epic-001-task-management-api.md

Epic contains:
  - 12 tasks identified
  - Estimated duration: 15 days
  - Categories: Backend (6), Testing (3), DevOps (3)

Next steps:
  1. Review epic file: epics/epic-001-task-management-api.md
  2. Sync with GitHub: autopm epic sync epics/epic-001.md
  3. Start working: /pm:next-task
```

---

## autopm epic archive

Archive completed epic.

### Synopsis

```bash
autopm epic archive <epic-file> [options]
```

### Description

Archives a completed epic by moving it to the archive directory.

### Options

| Option | Description |
|--------|-------------|
| `--force` | Archive even if not completed |
| `--no-backup` | Don't create backup |

### Examples

**Archive completed epic:**
```bash
autopm epic archive epics/epic-002-user-authentication.md
```

Moves to: `epics/archive/epic-002-user-authentication.md`

**Force archive (incomplete):**
```bash
autopm epic archive epics/epic-001.md --force
```

---

## autopm epic metrics

Show epic metrics and analytics.

### Synopsis

```bash
autopm epic metrics <epic-file> [options]
```

### Description

Displays analytics and metrics for an epic.

### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |
| `--verbose` | Show detailed metrics |

### Examples

**Show metrics:**
```bash
autopm epic metrics epics/epic-001-task-management-api.md
```

Output:
```
Epic Metrics: Task Management API

Progress:
  Total tasks: 12
  Completed: 6 (50%)
  In progress: 1 (8%)
  Pending: 5 (42%)

Time:
  Started: 2025-01-01
  Current: 2025-01-03 (Day 3)
  Duration: 3 days
  Estimated remaining: 10 days
  Estimated completion: 2025-01-13

Velocity:
  Tasks/day: 1.2
  Avg completion time: 0.83 days/task
  Trend: Stable

Categories:
  Backend: 6 tasks (50%)
  Testing: 3 tasks (25%)
  DevOps: 3 tasks (25%)

Completion by category:
  Backend: 4/6 (67%)
  Testing: 2/3 (67%)
  DevOps: 0/3 (0%)

Blockers:
  Active: 3 tasks
  Most blocked: Task #12 (blocked by 3 tasks)

Team:
  Contributors: 2
  @developer1: 7 tasks (4 completed)
  @developer2: 5 tasks (2 completed)
```

---

## autopm epic export

Export epic to different formats.

### Synopsis

```bash
autopm epic export <epic-file> [options]
```

### Description

Exports epic to various formats for reporting or sharing.

### Options

| Option | Description |
|--------|-------------|
| `--format <format>` | Export format (json, yaml, csv, pdf) |
| `--output <file>` | Output file path |
| `--include-tasks` | Include task details |

### Examples

**Export to JSON:**
```bash
autopm epic export epics/epic-001.md --format json --output epic-001.json
```

**Export to CSV:**
```bash
autopm epic export epics/epic-001.md --format csv --output epic-001.csv
```

**Export with task details:**
```bash
autopm epic export epics/epic-001.md --format json --include-tasks --output epic-001-full.json
```

---

## Epic File Format

### Location

`epics/epic-<number>-<slug>.md`

### Structure

```markdown
---
epicId: epic-001
title: Task Management API
status: in_progress
prdFile: prds/prd-001-task-management-api.md
created: 2025-01-01
updated: 2025-01-03
---

# Epic 001: Task Management API

## Description

Build a complete REST API for task management with authentication,
CRUD operations, and deployment infrastructure.

## PRD Reference

See: [PRD-001: Task Management API](../prds/prd-001-task-management-api.md)

## Tasks

### Backend Development

- [x] #1: Setup FastAPI project structure
- [x] #2: Configure PostgreSQL database
- [x] #3: Create User model
- [x] #4: Implement authentication endpoints
- [x] #5: Create Task CRUD endpoints

### Testing

- [x] #6: Add API tests
- [ ] #7: Write API documentation
- [ ] #8: Performance testing

### DevOps

- [ ] #9: Docker containerization
- [ ] #10: Kubernetes deployment
- [ ] #11: CI/CD pipeline
- [ ] #12: Production deployment

## Success Criteria

- All endpoints functional
- Test coverage > 80%
- Response time < 200ms
- Successfully deployed to production
```

---

## Common Workflows

### Create Epic from PRD

```bash
# 1. Create PRD
# (Use /pm:prd-new in Claude Code)

# 2. Decompose to epic
# (Use /pm:epic-decompose in Claude Code)
# Or: autopm epic create prds/prd-001.md

# 3. Validate epic
autopm epic validate epics/epic-001.md

# 4. Sync with GitHub
autopm epic sync epics/epic-001.md

# 5. Check status
autopm epic status epics/epic-001.md
```

### Working with Epic

```bash
# Get next task
# (Use /pm:next-task in Claude Code)

# Work on task
# (Implement features)

# Complete task
# (Use /pm:issue-close in Claude Code)

# Update status
autopm epic sync epics/epic-001.md --update-status

# Check progress
autopm epic status epics/epic-001.md

# View metrics
autopm epic metrics epics/epic-001.md
```

### Complete Epic

```bash
# 1. Verify all tasks complete
autopm epic status epics/epic-001.md

# 2. Final sync
autopm epic sync epics/epic-001.md

# 3. Generate report
autopm epic export epics/epic-001.md --format pdf --include-tasks

# 4. Archive epic
autopm epic archive epics/epic-001.md

# 5. Update metrics
autopm epic metrics --all
```

---

## Related Documentation

- [Epic Management Workflow](../workflows/epic-management.md)
- [PRD to Production](../workflows/prd-to-production.md)
- [Slash Commands](slash-commands.md)
- [Configuration](config.md)
