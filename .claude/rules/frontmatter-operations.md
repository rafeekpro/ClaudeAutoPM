# Frontmatter Operations Rule

Standard patterns for working with YAML frontmatter in markdown files.

## Reading Frontmatter

Extract frontmatter from any markdown file:

1. Look for content between `---` markers at start of file
2. Parse as YAML
3. If invalid or missing, use sensible defaults

## Updating Frontmatter

When updating existing files:

1. Preserve all existing fields
2. Only update specified fields
3. Always update `updated` field with current datetime (see `/rules/datetime.md`)

## Standard Fields

### All Files

```yaml
---
name: {identifier}
created: {ISO datetime}      # Never change after creation
updated: {ISO datetime}      # Update on any modification
---
```

### Status Values

- PRDs: `backlog`, `in-progress`, `complete`
- Epics: `backlog`, `in-progress`, `completed`  
- Tasks: `open`, `in-progress`, `closed`

### Progress Tracking

```yaml
progress: {0-100}%           # For epics
completion: {0-100}%         # For progress files
```

## Creating New Files

Always include frontmatter when creating markdown files:

```yaml
---
name: {from_arguments_or_context}
status: {initial_status}
created: {current_datetime}
updated: {current_datetime}
---
```

## Stripping Before GitHub Sync

YAML frontmatter MUST be removed before sending content to GitHub (issues, comments, external systems):

```bash
# Strip frontmatter (everything between first two --- lines)
sed '1,/^---$/d; 1,/^---$/d' input.md > output.md
```

Always strip when:
- Creating GitHub issues from markdown files (`gh issue create --body-file`)
- Posting file content as comments
- Syncing to any external system

```bash
# Example: create issue from file
sed '1,/^---$/d; 1,/^---$/d' task.md > /tmp/clean.md
gh issue create --body-file /tmp/clean.md
```

## Important Notes

- Never modify `created` field after initial creation
- Always use real datetime from system (`date -u +"%Y-%m-%dT%H:%M:%SZ"`)
- Validate frontmatter exists before trying to parse
- Use consistent field names across all files
