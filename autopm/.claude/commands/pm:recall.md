---
allowed-tools: Bash, Read
---

# Recall Learnings

Display recorded project learnings.

## Usage
```bash
node .claude/scripts/pm/recall.js [--tag tagname] [--limit N]
```

## Instructions

Run the recall script using the Bash tool and show the complete output.

- Use `--tag` to filter by tag if the user specifies one
- Use `--limit` to restrict results (default: 20)
- DO NOT truncate output
