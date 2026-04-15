# Obsidian Vault Integration (plugin-obsidian)

## Overview

plugin-obsidian creates a read-only Obsidian vault mirror of your ClaudeAutoPM project. It syncs project markdown (agents, commands, rules, epics, PRDs, issues) to an Obsidian vault where Dataview, Mermaid, Excalidraw, and canonical frontmatter work out of the box.

Sync is **unidirectional**: project to vault. Never edit files in the Obsidian vault directly.

## Prerequisites

- `rsync` (required for sync)
- `inotify-tools` (Linux/WSL, optional -- for `--watch` mode)
- `fswatch` (macOS, optional -- for `--watch` mode)
- Obsidian desktop app

## Installation

```bash
autopm install --scenario=obsidian
```

Or add to an existing installation by selecting scenario 7 during `autopm install`.

## Setup

After installation, configure your vault:

```bash
autopm obsidian setup --vault-path /path/to/vault --prefix my-project
```

Arguments:
- `--vault-path` (required): Path to your Obsidian vault folder
- `--prefix` (optional): Subfolder name in vault (defaults to project directory name)
- `--watch` / `--no-watch`: Enable/disable continuous sync

The setup wizard will:
1. Detect your environment (WSL2, macOS, Linux)
2. Validate the vault path
3. Save configuration to `.claude/config.json`
4. Generate MOC, Dashboard, templates, and diagrams in your vault
5. Apply canonical frontmatter to existing issues/PRDs
6. Run the first sync

## Commands

> Commands are available both as `autopm obsidian <command>` in your terminal and as `/obsidian:<command>` slash commands inside Claude Code.

### `autopm obsidian sync`

Sync project files to the Obsidian vault.

```bash
autopm obsidian sync              # One-shot sync
autopm obsidian sync --watch      # Continuous sync on file changes
autopm obsidian sync --check      # Dry-run (show what would sync)
autopm obsidian sync --safe-mode  # Don't delete vault files
```

Flags can be combined: `autopm obsidian sync --watch --safe-mode`

### `autopm obsidian doctor`

Diagnose common integration problems:

1. Missing rsync / inotify-tools / fswatch
2. Unreachable or non-writable vault path
3. Issues under `.claude/issues/` (invisible to Dataview)
4. Wrong Dataview FROM prefix
5. Broken symlink between `.claude/issues` and `issues/`

### `autopm obsidian setup`

Vault configuration wizard (run once after install).

## Sync Mapping

| Project Path | Vault Path |
|--------------|------------|
| `.claude/agents/` | `{vault}/{prefix}/agents/` |
| `.claude/commands/` | `{vault}/{prefix}/commands/` |
| `.claude/rules/` | `{vault}/{prefix}/rules/` |
| `.claude/epics/` | `{vault}/{prefix}/epics/` |
| `.claude/prds/` | `{vault}/{prefix}/prds/` |
| `issues/` | `{vault}/{prefix}/issues/` |
| `*.md` (root) | `{vault}/{prefix}/` |

> Obsidian ignores dotfolders (`.claude/`), so the sync script maps them to visible paths.

## Recommended Obsidian Plugins

Install these in Obsidian for the best experience:

| Plugin | Purpose | Link |
|--------|---------|------|
| Dataview | Query and display data from frontmatter | [Install](https://obsidian.md/plugins?id=dataview) |
| Templater | Template engine for new notes | [Install](https://obsidian.md/plugins?id=templater-obsidian) |
| Excalidraw | Whiteboard / diagram drawing | [Install](https://obsidian.md/plugins?id=obsidian-excalidraw-plugin) |
| Mermaid Tools | Enhanced Mermaid diagram rendering | [Install](https://obsidian.md/plugins?id=mermaid-tools) |
| Breadcrumbs | Hierarchical navigation | [Install](https://obsidian.md/plugins?id=breadcrumbs) |
| Advanced Tables | Markdown table editing | [Install](https://obsidian.md/plugins?id=table-editor-obsidian) |

## Frontmatter Schema

All synced files include canonical frontmatter for Dataview:

```yaml
---
type: issue|prd|epic|agent|rule
status: open|in-progress|closed
created: "2026-01-15T14:30:00Z"
updated: "2026-01-15T14:30:00Z"
tags: [issue, auth]
---
```

See `packages/plugin-obsidian/templates/FRONTMATTER_SCHEMA.md` for full schema.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Dataview shows no results | Wrong prefix or dotfolder issue | Run `autopm obsidian doctor` |
| Sync fails with "rsync not found" | rsync not installed | `sudo apt install rsync` (Linux) or `brew install rsync` (macOS) |
| Watch mode doesn't detect changes | Missing inotify-tools/fswatch | `sudo apt install inotify-tools` (Linux) or `brew install fswatch` (macOS) |
| Files appear in vault but Dataview can't see them | Files in dotfolder | Run `autopm obsidian setup` to migrate `.claude/issues/` to `issues/` |
| Symlink broken after git pull | Target deleted | Run `autopm obsidian doctor` check 5 |
| WSL vault path unreachable | Using `\\wsl.localhost\...` path | Use a Windows path (e.g., `/mnt/c/Users/.../vault`) or a local Linux path |

## Configuration

Settings are stored in `.claude/config.json`:

```json
{
  "obsidian": {
    "vault_path": "/path/to/vault",
    "vault_prefix": "my-project",
    "watch": false,
    "environment": "wsl"
  }
}
```

## Limitations

- Sync is unidirectional (project to vault). Do not edit vault files.
- One vault per project (multiple vaults not supported).
- Obsidian plugins must be installed manually (UI-only action).
- Binary files (images, videos) are excluded from sync.
