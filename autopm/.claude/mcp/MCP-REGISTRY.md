# MCP Server Registry

This document provides guidance on MCP (Model Context Protocol) server management in ClaudeAutoPM.

## 📡 MCP Servers

**By default, NO MCP servers are installed.** You must add and configure servers based on your project needs.

## 📚 Available Example Servers

Example MCP server configurations are available in `.claude/examples/mcp/`:

### context7
**Description**: Context7 MCP server - up-to-date documentation database for any library or framework
**Use Cases**: API documentation, framework guides, technical references, library lookups
**Example**: `.claude/examples/mcp/context7.md`

### playwright-mcp
**Description**: Playwright MCP server for browser automation and testing
**Use Cases**: E2E testing, visual testing, browser automation
**Example**: `.claude/examples/mcp/playwright-mcp.md`

### filesystem-mcp
**Description**: Local filesystem access server
**Use Cases**: File operations, directory navigation, content management
**Example**: `.claude/examples/mcp/filesystem-mcp.md`

### sqlite-mcp
**Description**: SQLite database server
**Use Cases**: Local database operations, data analysis, SQL queries
**Example**: `.claude/examples/mcp/sqlite-mcp.md`

## 🔧 Server Management

### 🔍 Discovering Servers (Dynamic)

**NEW: Search NPM Registry**
```bash
# Search for MCP servers in npm registry
autopm mcp search filesystem
autopm mcp search @modelcontextprotocol
autopm mcp search azure

# Browse popular servers
autopm mcp browse
autopm mcp browse --category database
autopm mcp browse --official  # Only @modelcontextprotocol/* servers
```

**Official MCP Registry**: https://registry.modelcontextprotocol.io

### 📦 Installing Servers (Dynamic)

**NEW: Install from NPM**
```bash
# Install npm package + create server definition automatically
autopm mcp install @modelcontextprotocol/server-filesystem

# Install with custom name
autopm mcp install @modelcontextprotocol/server-memory --name memory

# Install and enable immediately
autopm mcp install @playwright/mcp --enable
```

This command will:
1. Install the npm package (locally or globally based on config)
2. Auto-generate the `.md` definition file
3. Optionally enable the server
4. Update configuration

### 🗑️ Uninstalling Servers (Dynamic)

**NEW: Complete Removal**
```bash
# Remove server definition + npm package
autopm mcp uninstall filesystem

# Keep npm package, only remove definition
autopm mcp uninstall memory --keep-package

# Force removal even if active
autopm mcp uninstall context7 --force
```

### ➕ Adding Servers (Manual)

**Option 1: Interactive Wizard**
```bash
autopm mcp add
```

**Option 2: Copy from Examples**
```bash
# Copy an example to your project
cp .claude/examples/mcp/context7.md .claude/mcp/

# Or from installed framework
cp .claude/examples/mcp/playwright-mcp.md .claude/mcp/
```

### ✅ Enabling/Disabling Servers

```bash
# Enable a server in your project
autopm mcp enable <server-name>

# Disable a server in your project
autopm mcp disable <server-name>

# Enable multiple servers
autopm mcp enable context7 context7 playwright-mcp
```

### 📋 Listing Servers

```bash
# List all servers in your project
autopm mcp list

# List with detailed info
autopm mcp list --detailed

# List only active servers
autopm mcp list --active
```

### 🔄 Syncing Configuration

```bash
# Sync active servers to .claude/mcp-servers.json
autopm mcp sync

# Validate configuration
autopm mcp validate

# Test a specific server
autopm mcp test <server-name>
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
category: documentation|codebase|testing|database|integration
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

- **Documentation**: Technical documentation access
- **Codebase**: Code analysis and navigation
- **Testing**: Browser automation and E2E testing
- **Integration**: GitHub, Azure DevOps, etc.
- **Database**: SQLite, PostgreSQL, MongoDB

## 🔄 Server Lifecycle

1. **Definition**: Create server file in `.claude/mcp/*.md`
2. **Configuration**: Edit YAML frontmatter with server settings
3. **Activation**: Enable via `autopm mcp enable <server-name>`
4. **Synchronization**: Auto-synced to `.claude/mcp-servers.json`
5. **Runtime**: Used by Claude Code

## 📝 Best Practices

1. **Start Simple**: Only add servers you need
2. **Environment Variables**: Use `${VAR:-default}` syntax
3. **Sensitive Data**: Store API keys in `.claude/.env`
4. **Categories**: Assign appropriate categories for organization
5. **Documentation**: Include clear usage examples
6. **Testing**: Use `autopm mcp test <server-name>` to verify configuration

## 🚀 Quick Start

```bash
# 1. Check available servers (should be empty initially)
autopm mcp list

# 2. Copy an example server you want to use
cp .claude/examples/mcp/context7.md .claude/mcp/

# 3. Configure environment variables if needed
nano .claude/.env

# 4. Enable the server
autopm mcp enable context7

# 5. Sync configuration
autopm mcp sync

# 6. Test the server
autopm mcp test context7
```

## 🔐 Security Considerations

1. Never commit sensitive tokens or API keys
2. Use environment variables for all secrets
3. Validate server sources before installation
4. Review permissions regularly
5. Audit server access logs
6. Keep MCP packages updated

## 📚 Related Documentation

- [MCP Management Guide](../../docs/MCP-MANAGEMENT-GUIDE.md)
- [Agent-MCP Integration](../agents/AGENT-MCP-INTEGRATION.md)
- [Context Pools](../context-pools/README.md)
