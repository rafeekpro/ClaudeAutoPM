---
allowed-tools: Task, Bash, Read, Write, Edit, WebFetch, Glob, Grep
---

# Azure DevOps Task Reopen

Reopen a closed task that needs additional work.

**Usage**: `/azure:task-reopen <task-id> [--reason=<text>]`

**Examples**:
- `/azure:task-reopen 102`
- `/azure:task-reopen 102 --reason="Bug found in implementation"`

## Required Documentation Access

**MANDATORY:** Before Azure DevOps integration and agile workflows, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/azure-devops/boards` - boards best practices
- `mcp://context7/agile/user-stories` - user stories best practices
- `mcp://context7/project-management/work-items` - work items best practices
- `mcp://context7/agile/sprint-planning` - sprint planning best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


## Instructions

### Reopen Process

```
⚠️ Reopening Task #102

Current Status: Closed
Completed: 2 days ago
By: john@example.com

Reason for reopening: Bug found in implementation

This will:
- Change status to "To Do" or "In Progress"
- Reset completion date
- Add reopening note to history
- Notify original assignee

Confirm reopen? (y/n): _
```

### Update Task

```json
{
  "op": "replace",
  "path": "/fields/System.State",
  "value": "To Do"
},
{
  "op": "add",
  "path": "/fields/System.History",
  "value": "Reopened: Bug found in implementation"
}
```

### Success Output

```
✅ Task #102 reopened

Status: To Do → In Progress
Assigned: john@example.com (notified)
Reason: Bug found in implementation

Next: /azure:task-start 102
```