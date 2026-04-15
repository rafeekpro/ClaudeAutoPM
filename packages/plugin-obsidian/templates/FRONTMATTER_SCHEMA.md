# Canonical Frontmatter Schema

Fields that Dataview and Breadcrumbs use for queries and navigation.

## Required Fields (all types)

| Field     | Type   | Description                    | Example                     |
|-----------|--------|--------------------------------|-----------------------------|
| `type`    | string | Document type                  | `issue`, `prd`, `epic`      |
| `status`  | string | Current status                 | `open`, `in-progress`, `closed` |
| `created` | string | ISO 8601 creation timestamp    | `2026-01-15T14:30:00Z`     |
| `updated` | string | ISO 8601 last-modified timestamp | `2026-01-15T14:30:00Z`   |
| `tags`    | array  | Categorization tags            | `[issue, auth]`             |

## Optional Fields

| Field      | Type   | Description                    | Example                     |
|------------|--------|--------------------------------|-----------------------------|
| `title`    | string | Human-readable title           | `Implement JWT auth`        |
| `parent`   | string | Parent epic/issue reference    | `epic/authentication`       |
| `assignee` | string | Who is working on this         | `@username`                 |
| `priority` | string | Priority level                 | `high`, `medium`, `low`     |
| `progress` | number | Completion percentage (epics)  | `75`                        |
| `github`   | string | GitHub issue URL               | `https://github.com/.../42` |

## Status Values

- **Issues/Tasks**: `open`, `in-progress`, `closed`
- **PRDs**: `backlog`, `in-progress`, `complete`
- **Epics**: `backlog`, `in-progress`, `completed`

## Type Values

`issue`, `task`, `prd`, `epic`, `agent`, `rule`, `command`, `moc`, `dashboard`, `diagram`

## Notes

- Frontmatter is **additive only** — the setup wizard never overwrites existing custom keys
- All timestamps use ISO 8601 UTC format
- Tags should be lowercase, hyphenated
