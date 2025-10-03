---
allowed-tools: Task, Bash, Read, Write, WebFetch, Glob, Grep
---

# Azure DevOps Feature List

List all Features/Epics with filtering and sorting options.

**Usage**: `/azure:feature-list [--status=<state>] [--quarter=<Q>]`

**Examples**:
- `/azure:feature-list` - All features
- `/azure:feature-list --status=Active` - Active features
- `/azure:feature-list --quarter=Q1` - Q1 features

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

### Display Format

```
📦 Features/Epics Overview
═══════════════════════════════════════════════════════════════

| ID | Feature | Status | Progress | Points | Value | Target | Owner |
|----|---------|--------|----------|--------|-------|--------|-------|
| 25 | Authentication | 🔄 Active | 82% | 89 | 85 | Q1 | Product |
| 26 | Payment Gateway | 📅 Planned | 0% | 55 | 92 | Q2 | - |
| 27 | Search System | 🆕 New | 10% | 34 | 70 | Q1 | Tech |
| 28 | Analytics | ✅ Done | 100% | 21 | 60 | Q1 | Data |

📊 Summary:
- Active: 1 (89 points)
- Planned: 1 (55 points)
- New: 1 (34 points)
- Done: 1 (21 points)

Total Value: 307
Q1 Capacity: 144/150 points (96%)

🎯 Recommendations:
- Feature #25 needs attention (behind schedule)
- Feature #26 ready to start
- Consider deferring Feature #27 to Q2
```