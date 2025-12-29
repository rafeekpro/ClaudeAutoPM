---
allowed-tools: Bash, Read, LS
---

# Issue Show

Display issue and sub-issues with detailed information.

## Usage
```
/pm:issue-show <issue_number>
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

Run `node .claude/scripts/pm/issue-show.js $ARGUMENTS` using the Bash tool and show me the complete output.

This will display comprehensive information about the GitHub issue including:
1. Issue details and status
2. Local file mappings and task files
3. Sub-issues and dependencies
4. Recent activity and comments
5. Progress tracking with acceptance criteria
6. Quick action suggestions
