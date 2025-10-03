# Azure DevOps Integration

Complete guide to Azure DevOps integration.

## Quick Setup

```bash
# 1. Create PAT at Azure DevOps

# 2. Configure
autopm config set provider azure
autopm config set azure.organization YOUR_ORG
autopm config set azure.project YOUR_PROJECT
export AZURE_DEVOPS_PAT=xxxxx

# 3. Validate
autopm config validate
```

## Features

- **Work Items**: Sync epics to work items
- **Boards**: Board synchronization
- **Pipelines**: Azure Pipelines integration
- **Repos**: Repository integration

## Related

- [GitHub Integration](github.md)
