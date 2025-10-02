# MCP Server Registry

This document provides the official registry of all MCP (Model Context Protocol) servers distributed with ClaudeAutoPM.

## 📡 Available MCP Servers

### context7-docs

**Location**: `.claude/mcp/context7-docs.md`
**Description**: Context7 documentation server for accessing technical documentation
**Status**: Active
**Use Cases**: API documentation, framework guides, technical references

### context7-codebase

**Location**: `.claude/mcp/context7-codebase.md`
**Description**: Context7 codebase server for project code analysis
**Status**: Active
**Use Cases**: Code navigation, project analysis, dependency tracking

### playwright-mcp

**Location**: `.claude/mcp/playwright-mcp.md`
**Description**: Playwright MCP server for browser automation and testing
**Status**: Active
**Use Cases**: E2E testing, visual testing, browser automation

### github-mcp

**Location**: `.claude/mcp/github-mcp.md`
**Description**: GitHub MCP server for repository management
**Status**: Active
**Use Cases**: Issue tracking, PR management, repository analysis

### filesystem-mcp

**Location**: `.claude/mcp/filesystem-mcp.md`
**Description**: Local filesystem access server
**Status**: Active
**Use Cases**: File operations, directory navigation, content management

### sqlite-mcp

**Location**: `.claude/mcp/sqlite-mcp.md`
**Description**: SQLite database server
**Status**: Active
**Use Cases**: Local database operations, data analysis, SQL queries

## 🔧 Server Management

### Adding a New Server

```bash
autopm mcp add
```

This will launch an interactive wizard to create a new server definition.

### Enabling/Disabling Servers

```bash
# Enable a server in your project
autopm mcp enable <server-name>

# Disable a server in your project
autopm mcp disable <server-name>
```

### Syncing Configuration

```bash
# Sync active servers to .claude/mcp-servers.json
autopm mcp sync
```

## 📋 Server Definition Format

Each server is defined in a Markdown file with YAML frontmatter:

```markdown
---
name: server-name
command: npx
args: ["@package/server"]
env:
  ENV_VAR: "${ENV_VAR:-default}"
envFile: .claude/.env
description: Server description
category: documentation|codebase|testing|database
status: active|deprecated
---

# Server Name

## Description
Detailed description of the server...

## Configuration
Configuration details...

## Usage Examples
Example usage...
```

## 🏷️ Server Categories

### Documentation Servers
- context7-docs
- Custom documentation servers

### Codebase Servers
- context7-codebase
- filesystem-mcp

### Testing Servers
- playwright-mcp
- Test automation servers

### Integration Servers
- github-mcp
- Azure DevOps MCP (coming soon)
- GitLab MCP (coming soon)

### Database Servers
- sqlite-mcp
- PostgreSQL MCP (coming soon)
- MongoDB MCP (coming soon)

## 🔄 Server Lifecycle

1. **Definition**: Server defined in `.claude/mcp/*.md`
2. **Registration**: Listed in this registry
3. **Activation**: Enabled via `autopm mcp enable`
4. **Configuration**: Stored in project's `config.json`
5. **Synchronization**: Generated to `.claude/mcp-servers.json`
6. **Runtime**: Used by Claude Code

## 📝 Best Practices

1. **Environment Variables**: Use `${VAR:-default}` syntax
2. **Sensitive Data**: Store in `.claude/.env`
3. **Categories**: Assign appropriate categories
4. **Documentation**: Provide clear usage examples
5. **Versioning**: Include version requirements

## 🚀 Quick Start

```bash
# List all available servers
autopm mcp list

# Enable essential servers
autopm mcp enable context7-docs
autopm mcp enable github-mcp

# Sync configuration
autopm mcp sync
```

## 📊 Server Statistics

- **Total Servers**: 6
- **Active**: 6
- **Deprecated**: 0
- **Categories**: 5

## 🔐 Security Considerations

1. Never commit sensitive tokens
2. Use environment variables for secrets
3. Validate server sources
4. Review permissions regularly
5. Audit server access logs

## 📚 Related Documentation

- [MCP Management Guide](../../docs/MCP-MANAGEMENT-GUIDE.md)
- [Agent-MCP Integration](../agents/AGENT-MCP-INTEGRATION.md)
- [Context Pools](../context-pools/README.md)