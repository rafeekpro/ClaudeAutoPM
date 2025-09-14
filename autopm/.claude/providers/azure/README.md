# Azure DevOps Provider

Provider logic for Azure DevOps work item integration in ClaudeAutoPM.

## Overview

This provider enables ClaudeAutoPM to work with Azure DevOps, managing:
- Work items (User Stories, Tasks, Bugs)
- Pull requests
- Azure Pipelines
- Boards and backlogs
- Sprints and iterations

## Configuration

Configure in `.claude/config.json`:

```json
{
  "projectManagement": {
    "provider": "azure",
    "settings": {
      "azure": {
        "organization": "my-org",
        "project": "my-project",
        "token": "${AZURE_DEVOPS_TOKEN}"
      }
    }
  }
}
```

## Features

- **Work Item Management**: Create, update, and track Azure DevOps work items
- **PR Automation**: Automated pull request creation and management
- **Pipeline Integration**: Trigger and monitor Azure Pipelines
- **Board Synchronization**: Sync with Azure Boards for sprint planning
- **Sprint Management**: Organize work into iterations

## API Integration

Uses Azure DevOps REST API for:
- Work item CRUD operations
- Pull request automation
- Pipeline triggering
- Board and backlog management
- Sprint planning

## Commands

All commands work transparently with Azure DevOps when this provider is active:
- `autopm decompose <work-item>` - Fetches work item from Azure DevOps
- `autopm start-streams <work-item>` - Updates work item with progress
- `autopm status <work-item>` - Shows Azure DevOps work item status

## Work Item Types

Supports all Azure DevOps work item types:
- **Epic**: High-level features
- **Feature**: User-facing functionality
- **User Story**: User requirements
- **Task**: Development tasks
- **Bug**: Defect tracking
- **Test Case**: Test scenarios