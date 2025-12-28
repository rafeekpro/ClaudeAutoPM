---
allowed-tools: Task, Bash, Read, Write, Edit, WebFetch, Glob, Grep
---

# Azure DevOps Task New

Create a new Task under a User Story.

**Usage**: `/azure:task-new <story-id> <task-title>`

**Examples**:
- `/azure:task-new 34 "Add input validation"`
- `/azure:task-new 34 "Write unit tests" --hours=4`
- `/azure:task-new 34 "Fix bug" --assigned-to=john@example.com`

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

### 1. Interactive Task Creation

```
📝 Creating new Task for Story #34

Task Title: Add input validation

Task Details:
Description: [Validate email format and password strength]
Activity Type: [Development]
Original Estimate: [4] hours
Assigned To: [john@example.com]
Priority: [2]

Confirm creation? (y/n): _
```

### 2. Create Task

Use azure-devops-specialist agent to create task with parent link:

```json
{
  "op": "add",
  "path": "/fields/System.Title",
  "value": "Add input validation"
},
{
  "op": "add",
  "path": "/relations/-",
  "value": {
    "rel": "System.LinkTypes.Hierarchy-Reverse",
    "url": "story_url"
  }
}
```

### 3. Success Output

```
✅ Task created successfully!

Task #106: Add input validation
Parent: Story #34 - Password Reset
Hours: 4h
Assigned: john@example.com
Status: To Do

Next: /azure:task-start 106
```