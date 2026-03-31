---
allowed-tools: Bash, Read, Write
---

# Session Learning

Record a project learning for future reference.

## Usage
```bash
node .claude/scripts/pm/learn.js "lesson text" [--tag tagname]
```

## Instructions

Run the learn script with the user's provided learning text and optional tags using the Bash tool.

- Pass the learning text as the first argument (quoted)
- Use `--tag` for each tag the user wants to add
- Show the complete output

## Examples
```bash
node .claude/scripts/pm/learn.js "Always run migrations before seeding" --tag database
node .claude/scripts/pm/learn.js "Use path.join for cross-platform paths" --tag node
```
