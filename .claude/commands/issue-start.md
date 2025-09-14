# /issue:start

Unified command to start work on an issue/task across different project management providers.

## Description

Marks an issue/task as "in progress" and performs provider-specific initialization:
- Creates a working branch
- Updates issue status
- Assigns to current user (if not already assigned)
- Adds work-started timestamp
- Triggers any provider-specific workflows

## Usage

```bash
/issue:start <issue-id> [options]
```

## Arguments

- `<issue-id>` - The issue/task identifier (required)

## Options

- `--branch <name>` - Custom branch name (default: feature/issue-{id})
- `--assign` - Auto-assign to current user
- `--comment <text>` - Add a comment when starting
- `--no-branch` - Skip branch creation
- `--sprint <id>` - Move to specific sprint (Azure)
- `--project <name>` - Move to project column (GitHub)

## Provider Mapping

- **GitHub**: Updates issue state, moves project card, creates branch
- **Azure DevOps**: Updates work item state, sets iteration, creates branch
- **Jira**: Transitions issue, updates sprint, creates branch (future)

## Actions Performed

1. **Validates** issue exists and is startable
2. **Updates** issue status to "in progress"
3. **Creates** feature branch (unless --no-branch)
4. **Assigns** to user (if --assign or unassigned)
5. **Comments** on issue with start notification
6. **Moves** to active sprint/project column
7. **Links** branch to issue
8. **Triggers** any automation hooks

## Response Format

Returns a unified response regardless of provider:

```json
{
  "success": true,
  "issue": {
    "id": "123",
    "title": "Issue title",
    "status": "in_progress",
    "assignee": "user@example.com",
    "branch": "feature/issue-123",
    "url": "https://..."
  },
  "actions": [
    "Updated status to in_progress",
    "Created branch feature/issue-123",
    "Assigned to user@example.com",
    "Added to Sprint 15"
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Handling

Common errors handled consistently:
- Issue not found
- Issue already in progress
- Permission denied
- Branch already exists
- API rate limits

## Implementation

This command routes to the appropriate provider implementation based on the `projectManagement.provider` setting in `config.json`.

## Script

```javascript
#!/usr/bin/env node
const issueStartRouter = require('../../autopm/.claude/providers/router');
issueStartRouter.execute('issue-start', process.argv.slice(2));
```