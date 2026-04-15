# @claudeautopm/plugin-obsidian

Obsidian vault integration plugin for ClaudeAutoPM.

## Features

- **Vault Sync**: Unidirectional project → Obsidian vault sync via rsync
- **Setup Wizard**: Interactive configuration for vault path, prefix, and watch mode
- **Doctor**: Five-check diagnostic for common integration issues
- **Templates**: MOC, Dashboard, and Dataview-aware templates with canonical frontmatter

## Installation

```bash
autopm install --scenario=obsidian
```

## Commands

- `obsidian:setup` — Interactive vault configuration wizard
- `obsidian:sync` — Sync project to Obsidian vault
- `obsidian:doctor` — Diagnose common integration problems

## Requirements

- `rsync` (required)
- `inotify-tools` (Linux/WSL, optional for watch mode)
- `fswatch` (macOS, optional for watch mode)

## License

MIT
