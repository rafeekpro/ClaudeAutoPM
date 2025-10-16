---
allowed-tools: Task, Bash, Read, Write, Edit, Glob, Grep
---

# Azure DevOps Clean

Clean up completed items and optimize work item structure.

**Usage**: `/azure:clean [--archive] [--older-than=<days>]`

**Examples**:
- `/azure:clean` - Clean completed items
- `/azure:clean --archive` - Archive to file
- `/azure:clean --older-than=30` - Clean items older than 30 days

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

### Cleanup Process

```
🧹 Azure DevOps Cleanup
═══════════════════════════════════════════════════════════════

Analyzing completed items...

Items to clean:
─────────────────────────────────────────────────────────────
Completed Stories (30+ days old):
  • #12: Old login system (45 days)
  • #15: Legacy API (38 days)
  • #18: Deprecated feature (35 days)

Completed Tasks (30+ days old):
  • 25 tasks from completed stories

Closed Bugs (60+ days old):
  • 12 bugs marked as Won't Fix or Duplicate

Total: 40 items (freeing ~2GB cache)

Actions:
[1] Archive to .claude/azure/archive/2025-01.json
[2] Delete from local cache only
[3] Delete from Azure DevOps (requires confirmation)
[4] Skip cleanup

Choose: 1

Archiving...
✓ Archived 40 items to archive/2025-01.json
✓ Removed from active cache
✓ Cache optimized: 2GB → 500MB

📊 Cleanup Summary:
- Stories: 3 archived
- Tasks: 25 archived
- Bugs: 12 archived
- Space saved: 1.5GB
- Performance improved: +30%
```

### Archive Structure

```json
{
  "archive_date": "2025-01-10",
  "items_count": 40,
  "stories": [...],
  "tasks": [...],
  "bugs": [...],
  "metadata": {
    "oldest_item": "2024-11-01",
    "newest_item": "2024-12-10"
  }
}
```