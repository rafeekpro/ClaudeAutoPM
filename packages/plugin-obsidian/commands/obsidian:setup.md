---
allowed-tools: Bash, Read, Write
---

# Obsidian Setup Wizard

Configure an Obsidian vault for use with ClaudeAutoPM. Run this once after `autopm install --scenario=obsidian`.

## Usage

```
/obsidian:setup --vault-path /path/to/vault [--prefix my-project] [--watch] [--no-watch]
```

Options:
- `--vault-path PATH` — Absolute path to your Obsidian vault (required)
- `--prefix NAME` — Subfolder name inside the vault (default: project directory name)
- `--watch` — Enable continuous sync in config
- `--no-watch` — Disable continuous sync in config (default)

## Instructions

### 1. Gather Arguments

Ask the user for `--vault-path` if not provided. The vault must already exist as a directory.

On WSL, vault paths typically look like: `/mnt/c/Users/<name>/Documents/Obsidian/Vault`

### 2. Run Setup Script

Execute the backend script with the user's arguments:

```bash
node packages/plugin-obsidian/scripts/obsidian/setup.js \
  --vault-path "$VAULT_PATH" \
  --prefix "$PREFIX" \
  --project-root "$(pwd)"
```

Add `--watch` or `--no-watch` if the user specified either.

### 3. What the Script Does

The setup script performs these steps in order:

1. **Detects environment** — WSL, macOS, or Linux
2. **Validates vault path** — Checks existence and write permissions
3. **Merges config** — Adds `obsidian` section to `.claude/config.json` (preserves all existing keys)
4. **Generates templates** — Writes MOC, Dashboard, Obsidian templates, and diagram stubs into the vault
5. **Applies canonical frontmatter** — Adds missing fields (`type`, `status`, `created`, `updated`, `tags`) to existing issues and PRDs without overwriting existing values
6. **Migrates issues** — If `issues/` doesn't exist but `.claude/issues/` does, moves it and creates a symlink
7. **Copies sync script** — Places `sync-to-obsidian.sh` into `.claude/scripts/`
8. **Runs first sync** — Executes the sync script once to populate the vault

### 4. Output

On success, the script prints a summary showing the vault path, prefix, environment, generated files, and recommended next steps (plugin installation links).

### 5. Troubleshooting

If the script fails:

- **Vault path does not exist** — Create the directory first or check the path
- **Vault path is not writable** — Fix permissions: `chmod u+w /path/to/vault`
- **Sync script not found** — Re-run `autopm install --scenario=obsidian`

## Related Commands

- `/obsidian:sync` — Run a one-off or continuous sync after setup
