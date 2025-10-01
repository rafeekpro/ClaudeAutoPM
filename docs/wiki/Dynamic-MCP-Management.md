# Dynamic MCP Server Management

**ClaudeAutoPM now supports dynamic discovery, installation, and management of MCP (Model Context Protocol) servers!**

This guide covers the new dynamic management features that allow you to search, install, and manage MCP servers directly from npm registry without manual configuration.

## 🎯 Overview

Traditional MCP server setup required:
1. Manual npm installation
2. Creating `.md` definition files
3. Configuring YAML frontmatter
4. Enabling in config.json
5. Syncing to mcp-servers.json

**New dynamic management handles all of this automatically!**

## 🔍 Discovery Commands

### Search NPM Registry

Search for MCP servers across the entire npm registry:

```bash
# Search by keyword
autopm mcp search filesystem
autopm mcp search database
autopm mcp search azure

# Search by organization
autopm mcp search @modelcontextprotocol
autopm mcp search @upstash

# Search with multiple keywords
autopm mcp search "browser automation"
```

**Example Output:**
```
🔍 MCP Servers matching "filesystem"

📦 @modelcontextprotocol/server-filesystem
   Version: 2025.8.21
   Description: MCP server for filesystem access
   Category: codebase
   Downloads: 1,234/week

📦 @company/fs-mcp
   Version: 1.0.5
   Description: Secure filesystem operations
   Category: codebase
   Downloads: 456/week

Found 2 servers
```

### Browse Popular Servers

Browse curated lists of MCP servers:

```bash
# Browse all popular servers
autopm mcp browse

# Browse official @modelcontextprotocol servers only
autopm mcp browse --official

# Browse by category
autopm mcp browse --category documentation
autopm mcp browse --category database
autopm mcp browse --category testing
autopm mcp browse --category integration

# Show top N servers
autopm mcp browse --top 10

# Filter by minimum downloads
autopm mcp browse --min-downloads 1000
```

**Example Output:**
```
🌟 Popular MCP Servers

📚 Documentation Servers
  1. @modelcontextprotocol/server-filesystem (15k/wk)
  2. @upstash/context7-mcp (8k/wk)

🗄️ Database Servers
  1. @modelcontextprotocol/server-memory (5k/wk)
  2. @sqlite/mcp-server (3k/wk)

🧪 Testing Servers
  1. @playwright/mcp (12k/wk)

Total: 27 popular servers
```

## 📦 Installation Commands

### Install from NPM

Install MCP servers with automatic configuration:

```bash
# Basic installation
autopm mcp install @modelcontextprotocol/server-filesystem

# Install with custom name
autopm mcp install @modelcontextprotocol/server-memory --name memory

# Install and enable immediately
autopm mcp install @playwright/mcp --enable

# Install specific version
autopm mcp install @upstash/context7-mcp@1.2.3

# Install globally (for all projects)
autopm mcp install @modelcontextprotocol/server-filesystem --global
```

**What happens during installation:**

1. ✅ Validates package exists in npm registry
2. ✅ Downloads and installs npm package
3. ✅ Fetches package metadata
4. ✅ Auto-generates `.md` definition file
5. ✅ Configures YAML frontmatter
6. ✅ Optionally enables the server
7. ✅ Updates configuration files

**Example Installation:**
```bash
$ autopm mcp install @modelcontextprotocol/server-filesystem --enable

📦 Installing MCP Server...

1️⃣ Fetching package info from npm...
   ✅ Found: @modelcontextprotocol/server-filesystem@2025.8.21

2️⃣ Installing npm package...
   ✅ Installed successfully

3️⃣ Creating server definition...
   ✅ Created: .claude/mcp/server-filesystem.md

4️⃣ Enabling server...
   ✅ Enabled in config.json

5️⃣ Syncing configuration...
   ✅ Updated: .claude/mcp-servers.json

🎉 MCP server 'server-filesystem' ready to use!

Next steps:
  1. Configure environment: nano .claude/.env
  2. Test connection: autopm mcp test server-filesystem
```

### Auto-generated Server Definition

The `.md` file is automatically created with:

```markdown
---
name: server-filesystem
command: npx
args: ["@modelcontextprotocol/server-filesystem"]
description: MCP server for filesystem access
category: codebase
status: active
version: 2025.8.21
installed: 2025-01-15T10:30:00Z
---

# Filesystem MCP Server

## Description
MCP server for filesystem access

## Installation
This server was automatically installed via:
\`\`\`bash
autopm mcp install @modelcontextprotocol/server-filesystem
\`\`\`

## Usage
[Auto-populated from npm README]

## Configuration
[Auto-detected from package.json]
```

## 🗑️ Uninstallation Commands

### Complete Removal

Remove MCP servers and optionally their npm packages:

```bash
# Remove server definition + npm package
autopm mcp uninstall filesystem

# Remove definition only (keep npm package)
autopm mcp uninstall memory --keep-package

# Force removal even if server is active
autopm mcp uninstall context7 --force

# Remove globally installed package
autopm mcp uninstall filesystem --global
```

**What happens during uninstallation:**

1. ✅ Checks if server exists
2. ✅ Disables server if active
3. ✅ Removes `.md` definition file
4. ✅ Uninstalls npm package (unless --keep-package)
5. ✅ Updates configuration files
6. ✅ Cleans up references

**Example Uninstallation:**
```bash
$ autopm mcp uninstall filesystem

🗑️ Uninstalling MCP Server 'filesystem'...

1️⃣ Checking server status...
   ⚠️  Server is currently enabled

2️⃣ Disabling server...
   ✅ Disabled in config.json

3️⃣ Removing server definition...
   ✅ Deleted: .claude/mcp/filesystem.md

4️⃣ Uninstalling npm package...
   ✅ Uninstalled: @modelcontextprotocol/server-filesystem

5️⃣ Cleaning up configuration...
   ✅ Updated: .claude/mcp-servers.json

✨ Server 'filesystem' completely removed
```

## 🌐 MCP Registry Integration

### Official MCP Registry

ClaudeAutoPM integrates with the official MCP Registry at https://registry.modelcontextprotocol.io

**Registry Sources:**
1. **Official Registry API** - Curated list of verified servers
2. **NPM Registry** - All public MCP packages
3. **GitHub Repository** - Community servers list

### Registry Metadata

When browsing/searching, you get rich metadata:

- 📦 **Package name** and version
- 📝 **Description** and category
- 📊 **Download statistics**
- ⭐ **GitHub stars** (if available)
- 🔐 **Security audit** status
- 📅 **Last updated** date
- 🏷️ **Tags** and keywords

## 🎨 Advanced Features

### Installation Options

```bash
# Interactive installation wizard
autopm mcp install --interactive

# Batch installation
autopm mcp install \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-memory \
  @playwright/mcp

# Install from package.json
autopm mcp install --from-package

# Install with custom configuration
autopm mcp install @upstash/context7-mcp \
  --env CONTEXT7_MODE=documentation \
  --env-file .claude/.env.context7
```

### Search Filters

```bash
# Search with filters
autopm mcp search filesystem \
  --category codebase \
  --min-downloads 500 \
  --updated-within 30d \
  --official-only

# Save search results
autopm mcp search database --output servers.json

# Show detailed info
autopm mcp search playwright --verbose
```

### Browse Options

```bash
# Browse with advanced filters
autopm mcp browse \
  --category testing \
  --sort downloads \
  --limit 20 \
  --show-deprecated

# Export to CSV
autopm mcp browse --output servers.csv --format csv

# Show only verified servers
autopm mcp browse --verified-only
```

## 🔄 Migration from Manual Setup

If you have manually configured MCP servers, you can migrate them:

```bash
# Scan existing servers and offer to convert
autopm mcp migrate

# This will:
# 1. Detect manually configured servers
# 2. Find matching npm packages
# 3. Offer to convert to dynamic management
# 4. Preserve your custom configuration
```

## 📚 Best Practices

### 1. Use Search Before Installing

Always search first to find the best server for your needs:

```bash
# Bad: Installing without research
autopm mcp install @random/server

# Good: Search and compare first
autopm mcp search database
autopm mcp browse --category database
```

### 2. Check Server Details

Review server information before installing:

```bash
autopm mcp info @modelcontextprotocol/server-memory --preview
```

### 3. Test After Installation

Always test the connection after installing:

```bash
autopm mcp install @upstash/context7-mcp --enable
autopm mcp test context7-mcp
```

### 4. Keep Servers Updated

Regularly update your MCP servers:

```bash
# Check for updates
autopm mcp list --outdated

# Update specific server
autopm mcp update context7-mcp

# Update all servers
autopm mcp update --all
```

### 5. Use Version Pinning for Production

Pin versions in production environments:

```bash
# Development: latest version
autopm mcp install @playwright/mcp

# Production: specific version
autopm mcp install @playwright/mcp@1.2.3
```

## 🔐 Security Considerations

### 1. Verify Server Sources

Only install servers from trusted sources:

```bash
# Check package details before installing
autopm mcp search playwright --verify

# Install only official servers
autopm mcp browse --official
```

### 2. Review Permissions

Check what permissions the server requires:

```bash
autopm mcp info @modelcontextprotocol/server-filesystem --permissions
```

### 3. Environment Variables

Never commit sensitive data:

```bash
# Store in .env file
echo "CONTEXT7_API_KEY=secret" >> .claude/.env

# Add to .gitignore
echo ".claude/.env" >> .gitignore
```

### 4. Audit Server Configuration

Regularly audit your MCP servers:

```bash
autopm mcp audit --security
```

## 🆘 Troubleshooting

### Installation Fails

```bash
# Check npm connectivity
npm ping

# Verify package exists
npm view @modelcontextprotocol/server-filesystem

# Try with verbose logging
autopm mcp install @pkg/server --verbose --debug
```

### Server Not Found After Installation

```bash
# Verify installation
autopm mcp list

# Check file was created
ls -la .claude/mcp/

# Sync configuration
autopm mcp sync
```

### Package Version Conflicts

```bash
# Check installed versions
npm list @modelcontextprotocol/server-filesystem

# Force reinstall
autopm mcp uninstall filesystem --force
autopm mcp install @modelcontextprotocol/server-filesystem
```

## 📖 Related Documentation

- [MCP Setup Guide](../../MCP_SETUP_GUIDE.md)
- [MCP Registry](../../autopm/.claude/mcp/MCP-REGISTRY.md)
- [Agent-MCP Integration](../../autopm/.claude/agents/AGENT-MCP-INTEGRATION.md)
- [Official MCP Documentation](https://modelcontextprotocol.io/)

## 🎓 Examples

### Example 1: Setting Up a New Project

```bash
# 1. Search for needed servers
autopm mcp search documentation
autopm mcp search github

# 2. Install essential servers
autopm mcp install @upstash/context7-mcp --enable
autopm mcp install @github/mcp --enable

# 3. Configure environment
nano .claude/.env

# 4. Test servers
autopm mcp test context7-mcp
autopm mcp test github-mcp

# 5. Verify setup
autopm mcp diagnose
```

### Example 2: Exploring Database Options

```bash
# Browse database servers
autopm mcp browse --category database

# Compare specific servers
autopm mcp info @modelcontextprotocol/server-memory
autopm mcp info @sqlite/mcp-server

# Install chosen server
autopm mcp install @modelcontextprotocol/server-memory --enable
```

### Example 3: Cleaning Up Unused Servers

```bash
# List all installed servers
autopm mcp list --detailed

# Check which are actually used
autopm mcp usage

# Remove unused servers
autopm mcp uninstall old-server
autopm mcp uninstall deprecated-server --force
```

---

**Need help?** Run `autopm mcp --help` or visit our [documentation](https://rafeekpro.github.io/ClaudeAutoPM/)
