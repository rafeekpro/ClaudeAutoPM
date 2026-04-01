---
allowed-tools: Bash, Read, Write, Glob, Grep
---

# Diagram Update

Update an existing project diagram after code changes.

## Usage
/pm:diagram-update <name>

## Instructions

1. Read existing diagram from `.claude/pm/diagrams/<name>.mmd`
2. Read metadata from `.claude/pm/diagrams/<name>.meta.json` for type and scope
3. If either file is missing: `❌ Diagram not found: Run /pm:diagram-new <name>`
4. Re-analyze the project (same analysis as diagram-new, scoped to metadata scope)
5. Compare with existing diagram — identify:
   - New modules/components added
   - Removed modules
   - Changed connections
6. Update the .mmd file with changes
7. Update metadata: set `updated` to current timestamp (`date -u +"%Y-%m-%dT%H:%M:%SZ"`)
8. Show diff summary: "Added: X, Removed: Y, Updated: Z connections"
