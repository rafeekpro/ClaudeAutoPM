---
allowed-tools: Task, Bash, Read, Write, WebFetch, Glob, Grep
---

# Azure DevOps Validate

Validate work item structure and relationships for consistency.

**Usage**: `/azure:validate [--fix] [--type=<type>]`

**Examples**:
- `/azure:validate` - Check all items
- `/azure:validate --fix` - Auto-fix issues
- `/azure:validate --type=story` - Validate stories only

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

### Validation Report

```
🔍 Azure DevOps Validation Report
═══════════════════════════════════════════════════════════════

Checking work item integrity...

✅ PASSED (45 items)
─────────────────────────────────────────────────────────────
✓ All tasks have parent stories
✓ All stories have valid estimates
✓ No duplicate work items
✓ All required fields populated

⚠️ WARNINGS (8 items)
─────────────────────────────────────────────────────────────
• Story #34: Missing acceptance criteria
• Task #102: No remaining hours set
• Task #105: Not assigned
• Feature #27: No target date

❌ ERRORS (3 items)
─────────────────────────────────────────────────────────────
• Task #108: Orphaned (parent deleted)
• Story #39: Invalid state transition
• Task #112: Circular dependency

📋 Recommendations:
─────────────────────────────────────────────────────────────
1. Add acceptance criteria to Story #34
2. Assign Task #105 to team member
3. Delete orphaned Task #108
4. Fix Story #39 state

Auto-fix available for 2 issues.
Run with --fix? (y/n): _
```

### Validation Rules

```
Checking:
✓ Parent-child relationships
✓ Required fields
✓ State transitions
✓ Estimate ranges
✓ Date consistency
✓ Assignment validity
✓ Dependency cycles
✓ Duplicate detection
```