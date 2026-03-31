---
allowed-tools: Bash, Read, Write, LS
---

# Epic Close

Mark an epic as complete when all tasks are done.

## Usage
```
/pm:epic-close <epic_name>
```

## Required Documentation Access

**MANDATORY:** Before project management workflows, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/agile/epic-management` - epic management best practices
- `mcp://context7/project-management/issue-tracking` - issue tracking best practices
- `mcp://context7/agile/task-breakdown` - task breakdown best practices
- `mcp://context7/project-management/workflow` - workflow best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


## Instructions

### 1. Verify All Tasks Complete

Check all task files in `.claude/epics/$ARGUMENTS/`:
- Verify all have `status: closed` in frontmatter
- If any open tasks found: "❌ Cannot close epic. Open tasks remain: {list}"

### 2. Update Epic Status

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Update epic.md frontmatter:
```yaml
status: completed
progress: 100%
updated: {current_datetime}
completed: {current_datetime}
```

### 3. Update PRD Status

If epic references a PRD, update its status to "complete".

### 4. Close Epic on GitHub

If epic has GitHub issue:
```bash
gh issue close {epic_issue_number} --comment "✅ Epic completed - all tasks done"
```

### 5. Archive Option

Ask user: "Archive completed epic? (yes/no)"

If yes:
- Move epic directory to `.claude/epics/.archived/{epic_name}/`
- Create archive summary with completion date

### 6. Output

```
✅ Epic closed: $ARGUMENTS
  Tasks completed: {count}
  Duration: {days_from_created_to_completed}
  
{If archived}: Archived to .claude/epics/.archived/

Next epic: Run /pm:next to see priority work
```

## Important Notes

Only close epics with all tasks complete.
Preserve all data when archiving.
Update related PRD status.