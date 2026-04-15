## Obsidian Vault Integration

This project uses Obsidian as a visual layer for project documentation.

### Vault Sync

- **Sync is unidirectional**: Project → Vault (never edit in Obsidian)
- Run `/obsidian:sync` for one-shot sync
- Run `/obsidian:sync --watch` for continuous sync
- Run `/obsidian:doctor` to diagnose issues

### Frontmatter Convention

All markdown files should include canonical frontmatter for Dataview:

```yaml
---
type: issue|prd|epic|agent|rule
status: open|in-progress|closed
created: "YYYY-MM-DDTHH:mm:ssZ"
updated: "YYYY-MM-DDTHH:mm:ssZ"
tags: [relevant, tags]
---
```

### Important Rules

- **Never edit files in the Obsidian vault directly** — changes will be overwritten on next sync
- Dotfolders (`.claude/`) are invisible to Dataview — the sync script maps them to visible paths
- If using shared vaults, set `obsidian.vault_prefix` in `.claude/config.json`
