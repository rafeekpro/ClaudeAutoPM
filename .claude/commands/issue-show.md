# /issue:show

Unified command to display detailed information about an issue or task.

## Description

Shows comprehensive details about an issue/task including status, assignee, comments, and related items.

## Usage

```bash
/issue:show <issue-id> [options]
```

## Arguments

- `<issue-id>` - The issue/task identifier (required)

## Options

- `--comments` - Include comments/discussion
- `--history` - Show state change history
- `--related` - Show related issues/PRs
- `--json` - Output in JSON format

## Provider Mapping

- **GitHub**: Shows issue details via GitHub API
- **Azure DevOps**: Shows work item details
- **Jira**: Shows issue details (future)

## Output

Displays:
- Title and description
- Current status and assignee
- Labels/tags
- Creation and update dates
- Related pull requests
- Child tasks (if applicable)
- Comments (if requested)

## Implementation

Routes to provider-specific implementation via router.js