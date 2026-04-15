---
allowed-tools: Bash, Read
---

# Obsidian Sync

Sync project markdown to an Obsidian vault (unidirectional: project → vault).

## Usage

```
/obsidian:sync [--watch] [--check] [--safe-mode]
```

Options:
- `--watch` — Continuous sync on file changes (inotifywait on Linux/WSL, fswatch on macOS)
- `--check` — Dry-run: show what would be synced without creating files
- `--safe-mode` — Never delete vault files (omits `--delete` from rsync)

Options can be combined: `--watch --safe-mode`

## Instructions

### 1. Verify Setup

Check that Obsidian has been configured:

```bash
if [ ! -f .claude/config.json ] || ! node -e "
  const c = JSON.parse(require('fs').readFileSync('.claude/config.json','utf8'));
  if (!c.obsidian || !c.obsidian.vault_path) process.exit(1);
" 2>/dev/null; then
  echo "❌ Obsidian not configured. Run: /obsidian:setup"
  exit 1
fi
```

### 2. Detect Script Runner

Choose shell or Node fallback based on environment:

```bash
PLUGIN_DIR="$(dirname "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")")"

# Try to find scripts relative to plugin package
SCRIPT_SH="packages/plugin-obsidian/scripts/obsidian/sync-to-obsidian.sh"
SCRIPT_JS="packages/plugin-obsidian/scripts/obsidian/sync-to-obsidian.js"

# Also check if copied to .claude/scripts during setup
if [ ! -f "$SCRIPT_SH" ]; then
  SCRIPT_SH=".claude/scripts/sync-to-obsidian.sh"
fi
if [ ! -f "$SCRIPT_JS" ]; then
  SCRIPT_JS=".claude/scripts/sync-to-obsidian.js"
fi
```

### 3. Run Sync

Build flags from user arguments and execute:

```bash
FLAGS=""

# Parse arguments from $ARGUMENTS
case "$ARGUMENTS" in
  *--watch*)    FLAGS="$FLAGS --watch" ;;
esac
case "$ARGUMENTS" in
  *--check*)    FLAGS="$FLAGS --check" ;;
esac
case "$ARGUMENTS" in
  *--safe-mode*) FLAGS="$FLAGS --safe-mode" ;;
esac

# Prefer shell script, fall back to Node
if [ -f "$SCRIPT_SH" ] && command -v bash >/dev/null 2>&1; then
  bash "$SCRIPT_SH" $FLAGS
elif [ -f "$SCRIPT_JS" ] && command -v node >/dev/null 2>&1; then
  node "$SCRIPT_JS" $FLAGS
else
  echo "❌ Sync script not found. Reinstall plugin-obsidian or run: /obsidian:setup"
  exit 1
fi
```

### 4. Output

On success:

```
✅ Sync complete
  Vault: {vault_path}
  Prefix: {vault_prefix}
  Files synced: {count}

Next: Open vault in Obsidian to see changes
```

On watch mode:

```
👁️ Watching for changes... (Ctrl+C to stop)
  Vault: {vault_path}
```
