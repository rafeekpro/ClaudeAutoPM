# ClaudeAutoPM Provider Architecture Strategy

## Executive Summary

This document outlines the new provider-based architecture for ClaudeAutoPM, enabling seamless integration with multiple project management platforms while maintaining a unified command interface.

## Architecture Overview

### Core Principle: Provider Abstraction

ClaudeAutoPM now implements a **Provider Pattern** that abstracts project management operations behind a unified interface. This allows the same commands to work transparently with different platforms (GitHub Issues, Azure DevOps, Jira, etc.).

```
User Command → Unified Interface → Provider Layer → Platform API
                                         ↓
                                   [GitHub/Azure/Jira]
```

## Directory Structure

### `/autopm/.claude/providers/`

The central directory for all provider implementations:

```
providers/
├── github/           # GitHub Issues provider
│   ├── README.md
│   ├── api.js       # GitHub API client
│   ├── mapper.js    # Data mapping layer
│   └── handler.js   # Command handler
├── azure/           # Azure DevOps provider
│   ├── README.md
│   ├── api.js       # Azure DevOps API client
│   ├── mapper.js    # Work item mapping
│   └── handler.js   # Command handler
└── interface.js     # Common provider interface
```

Each provider directory contains:
- **README.md**: Provider-specific documentation
- **api.js**: Platform API integration
- **mapper.js**: Data transformation between platform and ClaudeAutoPM formats
- **handler.js**: Command implementation specific to the platform

## Configuration System

### Central Configuration: `config.json`

The configuration file now includes a `projectManagement` section:

```json
{
  "projectManagement": {
    "provider": "github",  // Active provider
    "settings": {
      "github": {
        "repository": "owner/repo",
        "token": "${GITHUB_TOKEN}",
        "defaultLabels": ["autopm"],
        "projectBoard": "Development"
      },
      "azure": {
        "organization": "my-org",
        "project": "my-project",
        "token": "${AZURE_DEVOPS_TOKEN}",
        "defaultAreaPath": "MyProject\\Development",
        "defaultIterationPath": "MyProject\\Sprint 1"
      }
    }
  }
}
```

### Provider Selection

The active provider is determined by:
1. **config.json**: `projectManagement.provider` field
2. **Environment Variable**: `AUTOPM_PROVIDER` (overrides config)
3. **Command Flag**: `--provider=azure` (highest priority)

## Unified Commands

All commands work identically regardless of the active provider:

### Issue/Work Item Management

```bash
# These commands work with both GitHub Issues and Azure Work Items
autopm decompose 123             # Decomposes issue/work item #123
autopm start-streams 123          # Starts parallel work streams
autopm status 123                 # Shows progress status
autopm update 123 "In Progress"   # Updates status
```

### Pull Request Management

```bash
# Creates PR in GitHub or Azure DevOps based on provider
autopm pr create "Feature implementation"
autopm pr merge 456
autopm pr review 456
```

### Project Board Integration

```bash
# Updates GitHub Projects or Azure Boards
autopm board move 123 "In Review"
autopm board list
autopm sprint plan
```

## Provider Interface

All providers implement a common interface:

```javascript
class ProviderInterface {
  // Issue/Work Item Operations
  async getItem(id) {}
  async createItem(data) {}
  async updateItem(id, data) {}
  async decomposeItem(id) {}

  // Pull Request Operations
  async createPR(data) {}
  async mergePR(id) {}
  async getPRStatus(id) {}

  // Board Operations
  async moveCard(itemId, column) {}
  async getBoard() {}
  async createSprint(data) {}
}
```

## Data Mapping

### Unified Data Model

ClaudeAutoPM uses a unified data model that providers map to/from:

```javascript
{
  id: "123",
  title: "Add authentication",
  description: "Implement user authentication...",
  status: "in_progress",
  assignee: "user@example.com",
  labels: ["enhancement", "backend"],
  milestone: "v2.0",
  priority: "high",
  streams: [...]  // Decomposed work streams
}
```

### Platform Mapping

Each provider handles mapping between the unified model and platform-specific formats:

- **GitHub**: Issues, Labels, Milestones, Projects
- **Azure DevOps**: Work Items, Tags, Iterations, Boards
- **Jira**: Issues, Components, Sprints, Boards

## Migration Strategy

### Phase 1: Foundation (Current)
- ✅ Create provider directory structure
- ✅ Update configuration system
- ✅ Document architecture

### Phase 2: Provider Implementation
- [ ] Implement GitHub provider
- [ ] Implement Azure DevOps provider
- [ ] Create provider interface

### Phase 3: Command Unification
- [ ] Update CLI to use providers
- [ ] Implement provider selection logic
- [ ] Add provider-specific features

### Phase 4: Testing & Documentation
- [ ] Provider integration tests
- [ ] Update user documentation
- [ ] Create migration guide

## Benefits

### 1. **Platform Agnostic**
Teams can use their preferred project management platform without changing workflows.

### 2. **Seamless Migration**
Switch between platforms without rewriting automation scripts.

### 3. **Unified Experience**
Consistent commands and behavior across all platforms.

### 4. **Extensibility**
Easy to add new providers (Jira, Linear, Asana, etc.).

### 5. **Configuration Flexibility**
Per-project provider selection with environment-specific overrides.

## Implementation Guidelines

### Adding a New Provider

1. Create directory: `/providers/<provider-name>/`
2. Implement the provider interface
3. Add configuration schema to `config.json`
4. Create data mappers
5. Write provider documentation
6. Add integration tests

### Provider Best Practices

- **Error Handling**: Graceful degradation with clear error messages
- **Rate Limiting**: Respect platform API limits
- **Caching**: Cache frequently accessed data
- **Authentication**: Support multiple auth methods (token, OAuth, etc.)
- **Logging**: Detailed logging for debugging
- **Testing**: Comprehensive unit and integration tests

## Security Considerations

### Token Management
- Tokens stored in environment variables
- Never committed to repository
- Support for credential managers

### API Security
- HTTPS only for API calls
- Token validation before operations
- Audit logging for sensitive operations

### Data Privacy
- No sensitive data in logs
- Configurable data retention
- GDPR compliance for European users

## Future Enhancements

### Planned Features

1. **Multi-Provider Support**: Work with multiple platforms simultaneously
2. **Provider Sync**: Synchronize data between platforms
3. **Custom Providers**: Plugin system for custom implementations
4. **Provider Templates**: Quick-start templates for common platforms
5. **Migration Tools**: Automated data migration between platforms

### Potential Integrations

- **Jira**: Atlassian's issue tracking
- **Linear**: Modern issue tracking
- **Asana**: Task management
- **Monday.com**: Work OS platform
- **ClickUp**: All-in-one productivity
- **Notion**: Workspace collaboration

## Conclusion

The provider architecture transforms ClaudeAutoPM into a truly platform-agnostic project management automation framework. By abstracting platform-specific details behind a unified interface, teams can leverage the power of AI-driven project management regardless of their chosen platform.

This architecture ensures:
- **Flexibility**: Choose the right platform for your team
- **Consistency**: Same commands, same results
- **Scalability**: Easy to add new platforms
- **Maintainability**: Clean separation of concerns

The provider strategy positions ClaudeAutoPM as the universal adapter for AI-powered project management across all major platforms.