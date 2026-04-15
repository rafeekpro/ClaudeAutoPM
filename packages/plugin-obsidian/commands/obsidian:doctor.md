---
allowed-tools: Bash, Read
---

# Obsidian Doctor

Run diagnostics on the Obsidian integration and suggest fixes for common problems.

## Usage

```
/obsidian:doctor
```

## Instructions

### 1. Locate Script

```bash
SCRIPT_JS="packages/plugin-obsidian/scripts/obsidian/doctor.js"

if [ ! -f "$SCRIPT_JS" ]; then
  SCRIPT_JS=".claude/scripts/doctor.js"
fi

if [ ! -f "$SCRIPT_JS" ]; then
  echo "❌ Doctor script not found. Reinstall plugin-obsidian or run: /obsidian:setup"
  exit 1
fi
```

### 2. Run Diagnostics

```bash
node "$SCRIPT_JS"
```

### 3. Output

On success (all checks pass or only warnings):

```
Obsidian Doctor
════════════════════════════════════════════════════════════

✅  rsync                    installed    /usr/bin/rsync
⚠️  inotify-tools            missing      Install: sudo apt install inotify-tools
✅  Vault path               ok           /path/to/vault
✅  Issues location          ok           issues/
✅  Dataview prefix          correct      my-project
✅  Symlink                  ok           .claude/issues -> issues

════════════════════════════════════════════════════════════
Result: 5 passed, 1 warning
```

On failure (any check has an error):

```
Result: 3 passed, 1 warning, 2 errors
```

Exit code 0 means all checks passed (warnings are OK). Exit code 1 means at least one check failed.
