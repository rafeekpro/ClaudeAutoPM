---
allowed-tools: Task, Bash, Read, Write, Edit, MultiEdit, Glob, Grep
---

# MCP Context Setup

Configures Model Context Protocol (MCP) servers and context sharing between agents.

**Usage**: `/mcp:context-setup [--server=context7|filesystem|custom] [--pool-name=pool] [--agents=agent1,agent2] [--max-size=100MB]`

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


**Example**: `/mcp:context-setup --server=context7 --pool-name=project-context --agents=python-backend-engineer,azure-devops-specialist --max-size=50MB`

**What this does**:
- Configures MCP server connections and authentication
- Sets up shared context pools between specified agents
- Implements context compression and optimization strategies
- Creates context handoff protocols for agent coordination
- Establishes monitoring and debugging capabilities
- Configures context security and access controls

Use the mcp-context-manager agent to implement MCP-based context sharing and optimization.

Requirements for the agent:
- Configure MCP server connections with proper authentication
- Implement shared context pools with size and retention limits
- Set up context compression and deduplication mechanisms
- Create agent coordination protocols for context handoffs
- Add context monitoring and performance metrics
- Implement security controls for context access and isolation
- Create debugging tools for context flow analysis