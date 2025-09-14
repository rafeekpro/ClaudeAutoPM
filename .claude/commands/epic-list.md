# /epic:list

Unified command to list epics/features across different project management providers.

## Description

Lists all epics (GitHub) or features (Azure DevOps) in the current project, automatically using the configured provider.

## Usage

```
/epic:list [options]
```

## Options

- `--status <status>` - Filter by status (open, closed, all)
- `--assignee <user>` - Filter by assignee
- `--label <label>` - Filter by label/tag
- `--limit <n>` - Limit number of results

## Provider Mapping

- **GitHub**: Lists GitHub Issues labeled as 'epic'
- **Azure DevOps**: Lists Azure DevOps Features
- **Jira**: Lists Jira Epics (future)

## Output Format

Returns a unified structure regardless of provider:

```json
[
  {
    "id": "123",
    "title": "Epic Title",
    "description": "Epic description",
    "status": "in_progress",
    "assignee": "user@example.com",
    "labels": ["enhancement", "backend"],
    "childCount": 5,
    "completedCount": 2,
    "url": "https://..."
  }
]
```

## Implementation

This command routes to the appropriate provider implementation based on the `projectManagement.provider` setting in `config.json`.

## Script

```javascript
#!/usr/bin/env node
const epicListRouter = require('../../autopm/.claude/providers/router');
epicListRouter.execute('epic-list', process.argv.slice(2));
```