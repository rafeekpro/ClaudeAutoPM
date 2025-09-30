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

### 2. Explore Available MCP Servers

```bash
# List all available MCP servers
autopm mcp list

# Show detailed information about a server
autopm mcp info context7-docs

# Check which agents are using MCP
autopm mcp agents

# Show MCP usage statistics
autopm mcp usage
```

### 3. Enable Required MCP Servers

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

### 4. Configure API Keys

```bash
# Interactive API key setup wizard
autopm mcp setup

# Or manually create .claude/.env with your credentials
cat > .claude/.env << EOF
CONTEXT7_API_KEY=your-context7-api-key
CONTEXT7_WORKSPACE=your-workspace-id
GITHUB_TOKEN=your-github-personal-access-token
EOF
```

### 5. Sync MCP Configuration

```bash
# Sync all enabled servers to .claude/mcp-servers.json
autopm mcp sync
```

This creates/updates `.claude/mcp-servers.json` which Claude reads when starting a session.

### 6. Verify Configuration

```bash
# Run comprehensive diagnostics
autopm mcp diagnose

# Test specific server connection
autopm mcp test context7-docs

# Show all servers status
autopm mcp status
```

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

## 🛠️ New MCP Commands Reference

ClaudeAutoPM now provides comprehensive MCP management through the CLI:

### Agent Analysis Commands

```bash
# List all agents using MCP servers
autopm mcp agents

# Group agents by MCP server
autopm mcp agents --by-server

# Show MCP configuration for specific agent
autopm mcp agent react-frontend-engineer

# Display MCP usage statistics
autopm mcp usage

# Show agent-MCP dependency tree
autopm mcp tree
```

**Example Output:**
```
🤖 Agents Using MCP

✅ react-frontend-engineer
   └─ context7-docs

✅ python-backend-engineer
   └─ context7-docs
   └─ sqlite-mcp

📊 Summary:
   Total agents: 53
   Using MCP: 39 (74%)
   Without MCP: 14 (26%)
```

### Configuration & Diagnostics

```bash
# Interactive API key setup
autopm mcp setup

# Run comprehensive MCP diagnostics
autopm mcp diagnose

# Test specific MCP server connection
autopm mcp test context7-docs

# Show all MCP servers status
autopm mcp status
```

**Diagnostic Features:**
- ✅ Check `.claude` directory structure
- ✅ Validate `config.json` and `mcp-servers.json`
- ✅ Detect missing MCP server definitions
- ✅ Check environment variables configuration
- ✅ Verify agents directory
- ✅ Overall health status report

### Visualization Commands

```bash
# Show agent-MCP dependency tree
autopm mcp tree

# Display MCP servers status with details
autopm mcp status
```

**Tree Output Example:**
```
🌳 Agent → MCP Dependency Tree

📁 frontend
├─ react-frontend-engineer ✅
│  └─ context7-docs
└─ vue-frontend-engineer ✅
   └─ context7-docs

📁 backend
├─ python-backend-engineer ✅
│  ├─ context7-docs
│  └─ sqlite-mcp
└─ nodejs-backend-engineer ✅
   └─ context7-docs
```

## 📊 Agent MCP Integration Status

As of the latest version, **39 out of 53 agents (74%)** use MCP servers:

- **Documentation**: 39 agents use `context7-docs` for live documentation
- **Codebase Analysis**: Some agents use `context7-codebase` for project analysis
- **GitHub Integration**: Agents can use `github-mcp` for repository operations
- **Database**: Specialized agents use `sqlite-mcp`, `postgresql-mcp`, etc.

**Top MCP-Using Agents:**
- Cloud architects (AWS, Azure, GCP)
- Backend engineers (Python, Node.js)
- Frontend engineers (React, Vue, Angular)
- DevOps specialists (Docker, Kubernetes, Terraform)
- Database experts (PostgreSQL, MongoDB, Redis)

## 🆘 Getting Help

If MCP setup issues persist:

1. **Run diagnostics**: `autopm mcp diagnose`
2. **Check server status**: `autopm mcp status`
3. **Test connections**: `autopm mcp test <server-name>`
4. **Review agent config**: `autopm mcp agent <agent-name>`
5. Check the [ClaudeAutoPM Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
6. Review agent-specific documentation in `autopm/.claude/agents/`
7. Enable debug mode and check logs
8. Contact support with configuration details (exclude API keys!)

---

**Important**: This guide assumes ClaudeAutoPM is installed and you have valid API keys for the services you want to use (context7, GitHub, etc.).