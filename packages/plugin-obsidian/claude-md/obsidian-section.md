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

### Wikilinks (MANDATORY)

All markdown files in issues, epics, PRDs, and the vault MUST use `[[wikilinks]]` to connect related content. This powers Obsidian's Graph View.

**Link format:**
- Issues: `[[issues/NNN|#NNN]]`
- Epics: `[[epics/{name}/epic|{name}]]`
- Tasks: `[[epics/{name}/{num}|Task #{num}]]`
- PRDs: `[[prds/{name}|{name}]]`

**Every markdown file MUST end with a `## Related` section** containing wikilinks to connected content. Never leave orphan files.

**Re-link existing files:** Run `/obsidian:link` or `autopm obsidian link` to scan and inject wikilinks into all project files.

### Important Rules

- **Never edit files in the Obsidian vault directly** — changes will be overwritten on next sync
- Dotfolders (`.claude/`) are invisible to Dataview — the sync script maps them to visible paths
- If using shared vaults, set `obsidian.vault_prefix` in `.claude/config.json`
