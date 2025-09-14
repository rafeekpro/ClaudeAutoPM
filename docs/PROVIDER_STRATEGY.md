# Provider Strategy Architecture

## Overview

ClaudeAutoPM implements a **provider-based architecture** that allows seamless integration with multiple project management platforms. This architecture enables users to work with their preferred tools (GitHub, Azure DevOps, etc.) through a unified command interface.

## Core Architecture Components

### 1. Provider Router (`autopm/.claude/providers/router.js`)

The central routing component that:
- Loads project configuration from `.claude/config.json`
- Determines the active provider (GitHub, Azure DevOps, etc.)
- Routes commands to appropriate provider implementations
- Handles provider-specific settings and authentication

```javascript
// Example flow
/pm:issue:show 123
  ↓
ProviderRouter.execute('issue-show', ['123'])
  ↓
Loads github/issue-show.js or azure/issue-show.js
  ↓
Returns unified response format
```

### 2. Provider Implementations

Each provider has its own directory with command implementations:

```
autopm/.claude/providers/
├── router.js           # Central routing logic
├── interface.js        # Unified interface definitions
├── github/
│   ├── issue-show.js
│   ├── issue-start.js
│   ├── issue-close.js
│   ├── epic-list.js
│   ├── epic-show.js
│   └── ...
└── azure/
    ├── issue-show.js
    ├── issue-start.js
    ├── issue-close.js
    ├── board-show.js
    ├── test-plan-create.js
    ├── lib/
    │   ├── client.js    # Azure DevOps API client
    │   └── formatter.js # Output formatting utilities
    └── ...
```

### 3. Unified Command Interface

All providers implement the same command interface, ensuring consistency:

| Unified Command | GitHub Implementation | Azure DevOps Implementation |
|----------------|----------------------|----------------------------|
| `/pm:issue:show` | GitHub Issues API | Azure Work Items API |
| `/pm:issue:start` | Create issue + assign | Create work item + assign |
| `/pm:issue:close` | Close issue | Close work item |
| `/pm:epic:list` | List milestones | List epics/features |
| `/pm:pr:create` | GitHub Pull Request | Azure DevOps Pull Request |
| `/pm:board:show` | GitHub Projects | Azure Boards |

## Configuration

### Project Configuration (`.claude/config.json`)

```json
{
  "projectManagement": {
    "provider": "github",  // or "azure"
    "settings": {
      "github": {
        "owner": "username",
        "repo": "repository"
      },
      "azure": {
        "organization": "org-name",
        "project": "project-name",
        "team": "team-name"
      }
    }
  }
}
```

### Provider Selection Priority

1. **Environment Variable**: `AUTOPM_PROVIDER=azure`
2. **Configuration File**: `.claude/config.json`
3. **Default**: GitHub (if not configured)

## Provider Development Guide

### Creating a New Provider

1. **Create Provider Directory**
   ```
   autopm/.claude/providers/jira/
   ```

2. **Implement Required Commands**
   Each command module must export an `execute` function:

   ```javascript
   // jira/issue-show.js
   module.exports = {
     async execute(options, settings) {
       // Connect to JIRA API
       // Fetch issue data
       // Return unified format
       return {
         id: issue.key,
         title: issue.fields.summary,
         status: mapStatus(issue.fields.status),
         assignee: issue.fields.assignee?.displayName
       };
     }
   };
   ```

3. **Map Provider-Specific Data**
   Convert provider formats to unified structure:

   ```javascript
   // Unified status values
   const STATUS_MAP = {
     'open': ['New', 'To Do', 'Open'],
     'in_progress': ['In Progress', 'Active', 'Doing'],
     'in_review': ['Review', 'Testing', 'Resolved'],
     'closed': ['Done', 'Closed', 'Complete']
   };
   ```

### Provider Interface Standards

Each provider must implement these core methods:

```javascript
class ProviderInterface {
  // Issue Management
  async issueShow(id) { }
  async issueList(filters) { }
  async issueCreate(data) { }
  async issueUpdate(id, changes) { }
  async issueClose(id) { }

  // Epic/Feature Management
  async epicList() { }
  async epicShow(id) { }

  // Pull Request Management
  async prCreate(data) { }
  async prList(filters) { }
  async prMerge(id) { }

  // Board/Project Views
  async boardShow() { }
  async sprintStatus() { }
}
```

## Authentication

### GitHub Provider
- Uses `GITHUB_TOKEN` environment variable
- Supports GitHub Enterprise with custom URLs
- OAuth token or Personal Access Token

### Azure DevOps Provider
- Uses `AZURE_DEVOPS_TOKEN` environment variable
- Personal Access Token (PAT) authentication
- Supports on-premises Azure DevOps Server

### Security Best Practices
- Never commit tokens to repository
- Use `.env` files for local development
- Leverage CI/CD secret management
- Rotate tokens regularly

## Advanced Features

### 1. Provider-Specific Extensions

Providers can offer unique commands:

```javascript
// Azure-specific test management
/pm:test:plan:create
/pm:test:run
/pm:test:summary

// GitHub-specific actions
/pm:action:status
/pm:workflow:trigger
```

### 2. Cross-Provider Migration

Future capability to migrate between providers:

```bash
# Export from GitHub
/pm:export --provider=github --format=universal

# Import to Azure DevOps
/pm:import --provider=azure --source=export.json
```

### 3. Multi-Provider Support

Work with multiple providers simultaneously:

```json
{
  "projectManagement": {
    "providers": {
      "primary": "github",
      "secondary": "azure"
    }
  }
}
```

## Provider Comparison

| Feature | GitHub | Azure DevOps | JIRA | GitLab |
|---------|--------|--------------|------|--------|
| Issues/Work Items | ✅ | ✅ | ✅ | ✅ |
| Epics/Milestones | ✅ | ✅ | ✅ | ✅ |
| Boards/Projects | ✅ | ✅ | ✅ | ✅ |
| Pull/Merge Requests | ✅ | ✅ | ❌ | ✅ |
| Test Management | ❌ | ✅ | ⚠️ | ⚠️ |
| Wiki Integration | ✅ | ✅ | ✅ | ✅ |
| CI/CD Integration | ✅ | ✅ | ⚠️ | ✅ |

Legend: ✅ Full Support | ⚠️ Partial Support | ❌ Not Available

## Troubleshooting

### Common Issues

1. **Provider Not Found**
   ```
   ❌ Provider implementation not found for jira/issue-show
   ```
   Solution: Ensure provider directory and command file exist

2. **Authentication Failed**
   ```
   ❌ Error: Unauthorized (401)
   ```
   Solution: Check environment variable and token validity

3. **Configuration Missing**
   ```
   ⚠️ No provider configured, defaulting to GitHub
   ```
   Solution: Add provider configuration to `.claude/config.json`

### Debug Mode

Enable detailed logging:

```bash
export AUTOPM_DEBUG=true
/pm:issue:show 123
```

## Future Roadmap

### Planned Providers
- **GitLab**: Full GitLab integration
- **Bitbucket**: Atlassian ecosystem support
- **Linear**: Modern issue tracking
- **Notion**: Documentation and project management

### Enhanced Features
- Automated provider detection
- Provider plugin system
- GraphQL support for better performance
- Offline mode with sync capabilities
- AI-powered command suggestions per provider

## Contributing

To add a new provider:

1. Fork the repository
2. Create provider directory structure
3. Implement required commands
4. Add provider tests
5. Update this documentation
6. Submit pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## Resources

- [Provider Interface Specification](./PROVIDER_INTERFACE.md)
- [Command Mapping Guide](./COMMAND_MAPPING.md)
- [API Documentation](./API.md)
- [Testing Providers](../test/providers/README.md)