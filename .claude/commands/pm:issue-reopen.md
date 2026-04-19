---
allowed-tools: Bash, Read, Write, LS
---

# Issue Reopen

Reopen a closed issue.

## Usage
```
/pm:issue-reopen <issue_number> [reason]
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

### 1. Find Local Task File

```bash
# Primary: search frontmatter for github issue URL (works with any filename)
task_file=$(grep -rl "github:.*issues/$ARGUMENTS" .claude/epics/ 2>/dev/null | head -1)
if [ -z "$task_file" ]; then
  # Fallback: check for issue-number filename
  task_file=$(find .claude/epics -name "$ARGUMENTS.md" 2>/dev/null | head -1)
fi
```
If not found: "❌ No local task for issue #$ARGUMENTS"
Use `$task_file` as the canonical path for ALL subsequent steps.

### 2. Update Local Status

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Update task file frontmatter:
```yaml
status: open
updated: {current_datetime}
```

### 3. Reset Progress

If progress file exists:
- Keep original started date
- Reset completion to previous value or 0%
- Add note about reopening with reason

### 4. Reopen on GitHub

```bash
# Reopen with comment
echo "🔄 Reopening issue

Reason: $ARGUMENTS

---
Reopened at: {timestamp}" | gh issue comment $ARGUMENTS --body-file -

# Reopen the issue
gh issue reopen $ARGUMENTS
```

### 5. Update Epic Progress

Recalculate epic progress with this task now open again.

### 6. Output

```
🔄 Reopened issue #$ARGUMENTS
  Reason: {reason_if_provided}
  Epic progress: {updated_progress}%
  
Start work with: /pm:issue-start $ARGUMENTS
```

## Important Notes

Preserve work history in progress files.
Don't delete previous progress, just reset status.