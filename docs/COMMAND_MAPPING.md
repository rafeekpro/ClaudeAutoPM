# Command Mapping Guide

## Overview

This document provides a comprehensive mapping of unified commands to their provider-specific implementations. All commands use the unified `/pm:` prefix and are automatically routed to the appropriate provider based on configuration.

## Unified Command Structure

All project management commands follow this pattern:
```
/pm:<resource>:<action> [parameters]
```

Examples:
- `/pm:issue:show 123` - Show issue/work item #123
- `/pm:epic:list` - List all epics/features
- `/pm:pr:create` - Create a pull request

## Complete Command Mapping

### Issue/Work Item Management

| Unified Command | Description | GitHub Implementation | Azure DevOps Implementation |
|-----------------|-------------|----------------------|----------------------------|
| `/pm:issue:show <id>` | Display issue details | GitHub Issues API | Azure Work Items API |
| `/pm:issue:list [--filter]` | List all issues | List repository issues | Query work items |
| `/pm:issue:create` | Create new issue | Create GitHub issue | Create work item |
| `/pm:issue:start <id>` | Start working on issue | Assign + label "in-progress" | Update state to "Active" |
| `/pm:issue:close <id>` | Close issue | Close GitHub issue | Set state to "Closed" |
| `/pm:issue:edit <id>` | Edit issue fields | Update issue via API | Update work item fields |
| `/pm:issue:assign <id> <user>` | Assign to user | Set assignee | Set assigned to |
| `/pm:issue:comment <id>` | Add comment | Post issue comment | Add work item comment |

### Epic/Feature Management

| Unified Command | Description | GitHub Implementation | Azure DevOps Implementation |
|-----------------|-------------|----------------------|----------------------------|
| `/pm:epic:list` | List all epics | List milestones | List epics/features |
| `/pm:epic:show <id>` | Display epic details | Show milestone + issues | Show epic + children |
| `/pm:epic:create` | Create new epic | Create milestone | Create epic work item |
| `/pm:epic:update <id>` | Update epic | Update milestone | Update epic fields |
| `/pm:epic:close <id>` | Close epic | Close milestone | Set epic to "Closed" |
| `/pm:epic:progress <id>` | Show epic progress | Calculate from issues | Show rollup progress |

### Pull/Merge Request Management

| Unified Command | Description | GitHub Implementation | Azure DevOps Implementation |
|-----------------|-------------|----------------------|----------------------------|
| `/pm:pr:create` | Create pull request | GitHub PR API | Azure Repos PR API |
| `/pm:pr:list` | List pull requests | List repository PRs | List branch PRs |
| `/pm:pr:show <id>` | Display PR details | Get PR details | Get PR details |
| `/pm:pr:review <id>` | Start PR review | Create review | Add reviewer |
| `/pm:pr:approve <id>` | Approve PR | Approve review | Vote approve |
| `/pm:pr:merge <id>` | Merge PR | Merge pull request | Complete pull request |
| `/pm:pr:close <id>` | Close without merging | Close PR | Abandon PR |

### Board/Project Views

| Unified Command | Description | GitHub Implementation | Azure DevOps Implementation |
|-----------------|-------------|----------------------|----------------------------|
| `/pm:board:show` | Display project board | GitHub Projects | Azure Boards |
| `/pm:board:update` | Update board items | Move project cards | Update work item states |
| `/pm:sprint:current` | Show current sprint | Active milestone | Current iteration |
| `/pm:sprint:plan` | Plan next sprint | Create milestone | Create iteration |
| `/pm:sprint:close` | Close sprint | Close milestone | Complete iteration |

### Test Management (Azure-Enhanced)

| Unified Command | Description | GitHub Implementation | Azure DevOps Implementation |
|-----------------|-------------|----------------------|----------------------------|
| `/pm:test:plan:create` | Create test plan | ❌ Not supported | Create test plan |
| `/pm:test:plan:show <id>` | Display test plan | ❌ Not supported | Show test plan details |
| `/pm:test:run` | Execute tests | Via Actions/Workflows | Run test suite |
| `/pm:test:summary` | Test results summary | Actions summary | Test run results |
| `/pm:test:case:create` | Create test case | ❌ Not supported | Create test case |

### Search and Reporting

| Unified Command | Description | GitHub Implementation | Azure DevOps Implementation |
|-----------------|-------------|----------------------|----------------------------|
| `/pm:search <query>` | Search all items | Search issues/PRs | Search work items |
| `/pm:report:velocity` | Team velocity | Calculate from closed | Velocity widget data |
| `/pm:report:burndown` | Sprint burndown | Milestone progress | Iteration burndown |
| `/pm:report:summary` | Project summary | Repository insights | Project analytics |

## Provider-Specific Features

### GitHub-Exclusive Commands

```bash
# GitHub Actions integration
/pm:action:status          # Check workflow status
/pm:action:trigger <name>   # Trigger workflow
/pm:action:logs <run-id>    # View workflow logs

# GitHub-specific features
/pm:release:create          # Create GitHub release
/pm:wiki:update            # Update wiki pages
```

### Azure DevOps-Exclusive Commands

```bash
# Azure Pipelines integration
/pm:pipeline:status         # Check pipeline status
/pm:pipeline:trigger        # Trigger pipeline
/pm:pipeline:logs           # View pipeline logs

# Azure-specific features
/pm:backlog:refine         # Backlog refinement
/pm:capacity:plan          # Capacity planning
/pm:dependency:map         # Dependency tracking
```

## Configuration Examples

### GitHub Configuration

```json
{
  "projectManagement": {
    "provider": "github",
    "settings": {
      "github": {
        "owner": "myorg",
        "repo": "myproject",
        "defaultLabels": ["autopm"],
        "workflowIntegration": true
      }
    }
  }
}
```

### Azure DevOps Configuration

```json
{
  "projectManagement": {
    "provider": "azure",
    "settings": {
      "azure": {
        "organization": "myorg",
        "project": "MyProject",
        "team": "MyTeam",
        "defaultAreaPath": "MyProject\\Backend",
        "defaultIterationPath": "MyProject\\Sprint 1"
      }
    }
  }
}
```

## Command Parameters

### Common Parameters

All commands support these common parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--format` | Output format (json, table, markdown) | `--format=json` |
| `--verbose` | Detailed output | `--verbose` |
| `--dry-run` | Preview without executing | `--dry-run` |
| `--provider` | Override configured provider | `--provider=azure` |

### Filter Parameters

List commands support filtering:

```bash
# Filter by status
/pm:issue:list --status=open
/pm:issue:list --status=in_progress

# Filter by assignee
/pm:issue:list --assignee=@me
/pm:issue:list --assignee=johndoe

# Filter by labels/tags
/pm:issue:list --label=bug
/pm:issue:list --tag=frontend

# Combine filters
/pm:issue:list --status=open --assignee=@me --label=bug
```

## Status Mapping

### Unified Status Values

| Unified Status | GitHub States | Azure DevOps States |
|----------------|---------------|---------------------|
| `open` | open | New, To Do |
| `in_progress` | open + "in-progress" label | Active, In Progress |
| `in_review` | open + "review" label | Resolved, In Review |
| `closed` | closed | Closed, Done |
| `cancelled` | closed + "wontfix" label | Removed, Cancelled |

## Error Handling

### Common Error Responses

```bash
# Provider not configured
❌ Error: No provider configured. Please set up in .claude/config.json

# Authentication failed
❌ Error: Authentication failed. Check GITHUB_TOKEN or AZURE_DEVOPS_TOKEN

# Resource not found
❌ Error: Issue #123 not found in repository

# Permission denied
❌ Error: Insufficient permissions to perform this action
```

## Migration Guide

### From Legacy Commands

| Old Command | New Unified Command |
|-------------|-------------------|
| `/pm:epic-show` | `/pm:epic:show` |
| `/azure:work-item-show` | `/pm:issue:show` |
| `/github:issue-create` | `/pm:issue:create` |
| `/pm:standup` | `/pm:report:daily` |

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `AUTOPM_PROVIDER` | Override default provider | `export AUTOPM_PROVIDER=azure` |
| `GITHUB_TOKEN` | GitHub authentication | `export GITHUB_TOKEN=ghp_xxx` |
| `AZURE_DEVOPS_TOKEN` | Azure DevOps authentication | `export AZURE_DEVOPS_TOKEN=xxx` |
| `AUTOPM_DEBUG` | Enable debug output | `export AUTOPM_DEBUG=true` |

## Best Practices

1. **Use unified commands** - Always use `/pm:` prefix for portability
2. **Configure provider once** - Set in `.claude/config.json` for consistency
3. **Use semantic status values** - Use unified status values for cross-provider compatibility
4. **Handle provider differences** - Be aware of provider-specific features and limitations
5. **Test with dry-run** - Use `--dry-run` to preview command effects

## Troubleshooting

### Command Not Found

```bash
❌ Provider implementation not found for gitlab/issue-show
```
**Solution**: Check if provider is implemented and properly configured

### Authentication Issues

```bash
❌ Error: Unauthorized (401)
```
**Solution**: Verify environment variables and token permissions

### Provider Mismatch

```bash
⚠️ Warning: Command 'test:plan:create' not supported by GitHub provider
```
**Solution**: Some commands are provider-specific; check compatibility

## Future Enhancements

- **Auto-detection**: Automatically detect provider from git remote
- **Multi-provider**: Support multiple providers in same project
- **Offline mode**: Cache data for offline access
- **Batch operations**: Execute commands on multiple items
- **Custom commands**: User-defined command aliases and macros