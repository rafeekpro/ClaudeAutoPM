# @claudeautopm/plugin-obsidian

> **Obsidian Vault Integration Plugin for ClaudeAutoPM Framework**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`@claudeautopm/plugin-obsidian` creates a read-only Obsidian vault mirror of your ClaudeAutoPM project. It syncs project markdown (agents, commands, rules, epics, PRDs, issues) to an Obsidian vault where Dataview, Mermaid, Excalidraw, and canonical frontmatter work out of the box.

Sync is **unidirectional**: project to vault. Never edit files in the Obsidian vault directly.

### Package Information

- **Package Name:** `@claudeautopm/plugin-obsidian`
- **Category:** Integration
- **Schema Version:** 2.0

---

## Features

- **Vault Sync** -- Unidirectional project-to-vault sync via rsync (one-shot, watch, dry-run, safe-mode)
- **Setup Wizard** -- Interactive configuration for vault path, prefix, watch mode, and environment detection (WSL2, macOS, Linux)
- **Doctor** -- Five-check diagnostic for common integration issues (missing tools, unreachable vault, dotfolder visibility, Dataview prefix, broken symlinks)
- **Templates** -- MOC, Dashboard, Dataview queries, Mermaid diagrams, and Excalidraw canvas
- **Canonical Frontmatter** -- Schema for Dataview + Breadcrumbs compatibility across all synced files
- **Cross-Platform** -- Supports WSL2, macOS, and Linux-native environments

---

## Installation

```bash
# Install via scenario
autopm install --scenario=obsidian

# Or add to existing installation (scenario 7)
autopm install
```

### Prerequisites

- `rsync` (required)
- `inotify-tools` (Linux/WSL, optional for `--watch` mode)
- `fswatch` (macOS, optional for `--watch` mode)
- Obsidian desktop app

---

## Commands

### `obsidian:setup`

Interactive vault configuration wizard. Run once after install.

```bash
/obsidian:setup --vault-path /path/to/vault --prefix my-project
```

### `obsidian:sync`

Sync project files to the Obsidian vault.

```bash
/obsidian:sync              # One-shot sync
/obsidian:sync --watch      # Continuous sync on file changes
/obsidian:sync --check      # Dry-run (show what would sync)
/obsidian:sync --safe-mode  # Don't delete vault files
```

### `obsidian:doctor`

Diagnose common integration problems:

1. Missing rsync / inotify-tools / fswatch
2. Unreachable or non-writable vault path
3. Issues under `.claude/issues/` (invisible to Dataview)
4. Wrong Dataview FROM prefix
5. Broken symlink between `.claude/issues` and `issues/`

---

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

---

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

---

## Documentation

Full user guide: [docs/plugins/obsidian.md](../../docs/plugins/obsidian.md)

---

## Peer Dependencies

- **@claudeautopm/plugin-core** (^2.0.0) -- Core framework plugin (REQUIRED)

---

## License

MIT
