---
allowed-tools: Bash, Read, Write
---

# Project Checkpoint

Save, list, or show project state snapshots.

## Usage
```bash
node .claude/scripts/pm/checkpoint.js "description"
node .claude/scripts/pm/checkpoint.js --list
node .claude/scripts/pm/checkpoint.js --show <timestamp>
```

## Instructions

Run the checkpoint script using the Bash tool with the appropriate arguments.

- To create: pass description as first argument (quoted)
- To list: use `--list`
- To show details: use `--show` followed by a timestamp or partial match
- Show complete output, DO NOT truncate
