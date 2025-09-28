# MCP (Model Context Protocol) Setup Guide for ClaudeAutoPM

## 🎯 Overview

MCP (Model Context Protocol) enables Claude to access external tools and resources like documentation, codebases, and services. This guide explains how to ensure MCP servers, especially context7, are properly configured and available in your Claude projects.

## 📦 MCP Servers Available in ClaudeAutoPM

### Core MCP Servers

1. **context7-docs** - Technical documentation access
2. **context7-codebase** - Project code analysis
3. **playwright-mcp** - Browser automation
4. **github-mcp** - GitHub repository management
5. **filesystem-mcp** - Local file system access
6. **sqlite-mcp** - SQLite database operations

## 🔧 Step-by-Step MCP Setup

### 1. Initial Installation

When you install ClaudeAutoPM in a project:

```bash
# Install ClaudeAutoPM globally (if not already done)
npm install -g claude-autopm

# Initialize in your project
cd /your/project
autopm install

# Choose installation scenario (recommend: Full DevOps)
```

### 2. Enable Required MCP Servers

```bash
# Enable context7 documentation server
autopm mcp enable context7-docs

# Enable context7 codebase server
autopm mcp enable context7-codebase

# Enable other servers as needed
autopm mcp enable github-mcp
autopm mcp enable playwright-mcp
```

### 3. Configure Environment Variables

Create or update `.claude/.env` with your credentials:

```bash
# Context7 Configuration
CONTEXT7_API_KEY=your-context7-api-key
CONTEXT7_WORKSPACE=your-workspace-id

# GitHub Configuration (if using github-mcp)
GITHUB_TOKEN=your-github-personal-access-token

# Filesystem Configuration (if using filesystem-mcp)
FILESYSTEM_ROOT=/
FILESYSTEM_READONLY=false
```

### 4. Sync MCP Configuration

```bash
# Sync all enabled servers to .claude/mcp-servers.json
autopm mcp sync
```

This creates/updates `.claude/mcp-servers.json` which Claude reads when starting a session.

### 5. Verify Configuration

Check that `.claude/mcp-servers.json` contains your enabled servers:

```json
{
  "mcpServers": {
    "context7-docs": {
      "command": "npx",
      "args": ["@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY:-}",
        "CONTEXT7_MODE": "documentation"
      },
      "envFile": ".claude/.env"
    },
    "context7-codebase": {
      "command": "npx",
      "args": ["@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY:-}",
        "CONTEXT7_MODE": "codebase"
      },
      "envFile": ".claude/.env"
    }
  }
}
```

## 🚀 Using MCP in Claude

### Starting a Claude Session

1. **Open your project in Claude Code**
2. **Claude automatically reads** `.claude/mcp-servers.json`
3. **MCP servers start** in the background
4. **Agents can access** MCP resources via special URIs

### MCP URI Format

Agents use special URIs to access MCP resources:

```
mcp://context7-docs/python/fastapi       # FastAPI documentation
mcp://context7-docs/aws/ec2             # AWS EC2 documentation
mcp://context7-codebase/project/analyze # Analyze current project
mcp://github-mcp/issues/list           # List GitHub issues
```

## 🤖 Agents with MCP Integration

### Agents Currently Using Context7

These agents have built-in context7 documentation access:

- **aws-cloud-architect** - AWS documentation
- **azure-cloud-architect** - Azure documentation
- **gcp-cloud-architect** - GCP documentation
- **kubernetes-orchestrator** - K8s documentation
- **python-backend-engineer** - Python docs
- **nodejs-backend-engineer** - Node.js docs
- **react-frontend-engineer** - React docs

### Agents That Should Have Context7

These agents would benefit from context7 integration:

- **frontend-testing-engineer** - Testing framework docs
- **observability-engineer** - Monitoring tool docs
- **message-queue-engineer** - Message broker docs
- **postgresql-expert** - PostgreSQL docs
- **mongodb-expert** - MongoDB docs

## 📋 Verification Checklist

Before starting a Claude session, verify:

- [ ] `.claude/.env` exists with required API keys
- [ ] `.claude/mcp-servers.json` exists and is valid JSON
- [ ] Required MCP servers are listed in the JSON file
- [ ] Environment variables are properly referenced
- [ ] No syntax errors in configuration files

## 🔍 Troubleshooting

### MCP Server Not Available

If an MCP server isn't working:

1. **Check if enabled**: Run `autopm mcp list` to see enabled servers
2. **Verify credentials**: Check `.claude/.env` has correct API keys
3. **Sync configuration**: Run `autopm mcp sync`
4. **Restart Claude**: Close and reopen Claude Code

### Context7 Specific Issues

1. **"Authentication Failed"**
   - Verify `CONTEXT7_API_KEY` in `.claude/.env`
   - Check key hasn't expired
   - Ensure workspace ID is correct

2. **"Documentation Not Found"**
   - Check if documentation source is supported
   - Verify workspace has access to requested docs
   - Try updating context7 server: `npm update @context7/mcp-server`

3. **Slow Response Times**
   - Enable caching in context7 configuration
   - Use specific documentation filters
   - Check network connectivity

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Add to .claude/.env
CONTEXT7_DEBUG=true
MCP_DEBUG=true
```

## 🔐 Security Best Practices

1. **Never commit `.claude/.env`** - Add to `.gitignore`
2. **Use environment variables** - Don't hardcode credentials
3. **Rotate API keys regularly** - Update quarterly
4. **Limit permissions** - Use read-only where possible
5. **Monitor usage** - Check API usage dashboards

## 📝 Manual MCP Server Addition

To manually add an MCP server to `.claude/mcp-servers.json`:

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["@your-org/mcp-server"],
      "env": {
        "YOUR_API_KEY": "${YOUR_API_KEY:-}",
        "YOUR_SETTING": "value"
      },
      "envFile": ".claude/.env"
    }
  }
}
```

## 🎓 Example: Complete Setup for New Project

```bash
# 1. Initialize project
mkdir my-project && cd my-project
git init

# 2. Install ClaudeAutoPM
autopm install
# Choose: 3 (Full DevOps)

# 3. Enable MCP servers
autopm mcp enable context7-docs
autopm mcp enable context7-codebase
autopm mcp enable github-mcp

# 4. Configure environment
cat > .claude/.env << EOF
CONTEXT7_API_KEY=your-key-here
CONTEXT7_WORKSPACE=your-workspace
GITHUB_TOKEN=your-github-token
EOF

# 5. Sync configuration
autopm mcp sync

# 6. Verify setup
cat .claude/mcp-servers.json

# 7. Start Claude Code
# MCP servers will be automatically available!
```

## 📚 Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.org)
- [Context7 Documentation](https://docs.context7.com)
- [ClaudeAutoPM MCP Registry](autopm/.claude/mcp/MCP-REGISTRY.md)
- [Agent MCP Integration Guide](autopm/.claude/agents/AGENT-MCP-INTEGRATION.md)

## 🆘 Getting Help

If MCP setup issues persist:

1. Check the [ClaudeAutoPM Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
2. Review agent-specific documentation in `autopm/.claude/agents/`
3. Enable debug mode and check logs
4. Contact support with configuration details (exclude API keys!)

---

**Important**: This guide assumes ClaudeAutoPM is installed and you have valid API keys for the services you want to use (context7, GitHub, etc.).