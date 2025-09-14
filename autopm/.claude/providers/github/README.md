# GitHub Provider

Provider logic for GitHub Issues integration in ClaudeAutoPM.

## Overview

This provider enables ClaudeAutoPM to work with GitHub repositories, managing:
- Issues and issue templates
- Pull requests
- GitHub Actions workflows
- Project boards
- Milestones and labels

## Configuration

Configure in `.claude/config.json`:

```json
{
  "projectManagement": {
    "provider": "github",
    "settings": {
      "github": {
        "repository": "owner/repo",
        "token": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

## Features

- **Issue Management**: Create, update, and track GitHub issues
- **PR Automation**: Automated pull request creation and management
- **Workflow Integration**: Trigger and monitor GitHub Actions
- **Project Boards**: Sync with GitHub Projects for visual tracking
- **Milestone Tracking**: Organize work into milestones

## API Integration

Uses GitHub REST API v3 and GraphQL API v4 for:
- Real-time issue updates
- Automated PR creation
- Workflow triggering
- Project board management

## Commands

All commands work transparently with GitHub when this provider is active:
- `autopm decompose <issue>` - Fetches issue from GitHub
- `autopm start-streams <issue>` - Updates GitHub issue with progress
- `autopm status <issue>` - Shows GitHub issue status