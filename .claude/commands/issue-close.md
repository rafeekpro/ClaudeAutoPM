# /issue:close

Unified command to close/complete an issue or task across different project management providers.

## Description

Closes an issue/task, marking it as completed with optional resolution details.

## Usage

```bash
/issue:close <issue-id> [options]
```

## Arguments

- `<issue-id>` - The issue/task identifier (required)

## Options

- `--comment <text>` - Add closing comment
- `--resolution <type>` - Resolution type (fixed, wontfix, duplicate, invalid)
- `--pr <id>` - Link to closing pull request
- `--no-branch-delete` - Keep feature branch after closing

## Provider Mapping

- **GitHub**: Closes issue, adds labels, links PR
- **Azure DevOps**: Updates work item to Done/Closed state
- **Jira**: Transitions to Done with resolution (future)

## Implementation

Routes to provider-specific implementation via router.js