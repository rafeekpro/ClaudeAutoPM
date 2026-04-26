---
allowed-tools: Bash, Read, Write, Glob, Grep
---

# Obsidian Link

Scan all project markdown files and inject `[[wikilinks]]` for Obsidian Graph View.

## Usage

```
/obsidian:link [--dry-run]
```

Options:
- `--dry-run` — Show what would be linked without modifying files

Also available as: `autopm obsidian link`

## Instructions

### 1. Run the link script

```bash
# Find the script
if [ -f ".claude/scripts/obsidian/link-vault.js" ]; then
  node .claude/scripts/obsidian/link-vault.js
elif [ -f "packages/plugin-obsidian/scripts/obsidian/link-vault.js" ]; then
  node packages/plugin-obsidian/scripts/obsidian/link-vault.js
else
  echo "❌ link-vault.js not found. Reinstall plugin-obsidian."
  exit 1
fi
```

### 2. After linking, run a sync to push changes to the vault

```bash
if [ -f ".claude/scripts/obsidian/sync-to-obsidian.sh" ]; then
  bash .claude/scripts/obsidian/sync-to-obsidian.sh
fi
```

### 3. Output

```
[link]  Linked: issues/123.md (3 links)
[link]  Linked: .claude/epics/auth/001.md (2 links)

42 files linked (87 links) out of 150 scanned

Sync completed. Open Obsidian to see the updated Graph View.
```
