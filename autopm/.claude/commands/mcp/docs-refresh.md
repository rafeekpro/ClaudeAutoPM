---
allowed-tools: Task, Bash, Read, Write, WebFetch, Glob, Grep
---

# MCP Documentation Refresh

Refreshes documentation cache from context7 for specified agents and technologies.

**Usage**: `/mcp:docs-refresh [--agent=agent-name] [--tech=technology] [--force] [--validate]`

## Required Documentation Access

**MANDATORY:** Before MCP server setup and documentation, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/mcp/protocol` - protocol best practices
- `mcp://context7/mcp/servers` - servers best practices
- `mcp://context7/ai/context-management` - context management best practices
- `mcp://context7/mcp/integration` - integration best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


**Examples**: 
- `/mcp:docs-refresh --agent=python-backend-engineer --tech=fastapi`
- `/mcp:docs-refresh --tech=azure-devops --force`
- `/mcp:docs-refresh --validate`

**What this does**:
- Fetches latest documentation from context7 servers
- Updates agent-specific documentation caches
- Validates documentation integrity and accessibility
- Reports cache status and refresh timestamps
- Clears stale or corrupted documentation entries

Use the mcp-context-manager agent to refresh documentation caches and validate integrity.

Requirements for the agent:
- Connect to context7 documentation servers using MCP protocol
- Fetch latest documentation for specified technologies/agents
- Update local documentation caches with version tracking
- Validate documentation integrity and format consistency
- Report refresh status, timestamps, and any errors encountered
- Clean up stale documentation entries and optimize cache usage