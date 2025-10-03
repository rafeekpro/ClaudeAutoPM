# MCP Server Examples

This directory contains example MCP (Model Context Protocol) server configurations that you can use in your projects.

## ⚠️ Important

These are **EXAMPLES ONLY**. They are NOT automatically installed or enabled.

## 🚀 How to Use

### Option 1: Copy to Your Project

```bash
# Copy a specific example to your project's .claude/mcp/ directory
cp .claude/examples/mcp/context7.md .claude/mcp/

# Then enable it
autopm mcp enable context7

# And sync
autopm mcp sync
```

### Option 2: Use as Template

```bash
# Copy and modify
cp .claude/examples/mcp/playwright-mcp.md .claude/mcp/my-custom-server.md
nano .claude/mcp/my-custom-server.md

# Enable and sync
autopm mcp enable my-custom-server
autopm mcp sync
```

### Option 3: Interactive Wizard

```bash
# Create a new server from scratch
autopm mcp add
```

## 📚 Available Examples

### Documentation Servers
- **context7.md** - Context7 up-to-date documentation database

### Integration Servers
- **filesystem-mcp.md** - Local filesystem operations

### Testing Servers
- **playwright-mcp.md** - Browser automation and E2E testing

### Database Servers
- **sqlite-mcp.md** - SQLite database operations

### Test Servers (For Development)
- **info-server.md** - Test server for development
- **test-server.md** - Another test server

## 🔧 Configuration

Each example includes:
- YAML frontmatter with server configuration
- Environment variable placeholders
- Usage examples
- Setup instructions

Make sure to:
1. Configure required environment variables in `.claude/.env`
2. Install required npm packages (e.g., `npm install @upstash/context7-mcp`)
3. Test the server: `autopm mcp test <server-name>`

## 📝 Example Workflow

```bash
# 1. Copy example
cp .claude/examples/mcp/context7.md .claude/mcp/

# 2. Enable the server
autopm mcp enable context7

# 3. Sync configuration
autopm mcp sync

# 4. Test the connection
autopm mcp test context7

# 5. Check status
autopm mcp status
```

## 🔐 Security Notes

- Never commit `.claude/.env` with actual API keys
- Use environment variable substitution: `${VAR_NAME:-default}`
- Review server permissions before enabling
- Keep MCP packages updated for security patches

## 📚 Learn More

- [MCP Registry](../../mcp/MCP-REGISTRY.md) - Full documentation
- [MCP Management Guide](../../../../docs/MCP-MANAGEMENT-GUIDE.md) - Detailed guide
- Official MCP documentation: https://modelcontextprotocol.io/
