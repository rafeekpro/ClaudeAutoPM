# MCP Management Commands

Complete reference for Model Context Protocol (MCP) server management commands.

---

## What is MCP?

Model Context Protocol (MCP) provides Claude with access to external tools and documentation:
- **context7**: Framework documentation (React, FastAPI, etc.)
- **playwright**: Browser automation
- **filesystem**: File system access
- **sqlite**: Database operations

---

## autopm mcp status

Check status of MCP servers.

### Synopsis

```bash
autopm mcp status [options]
```

### Description

Displays the current status of all configured MCP servers.

### Options

| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed status |
| `--json` | Output as JSON |

### Examples

**Check MCP status:**
```bash
autopm mcp status
```

Output:
```
MCP Servers Status:

✅ context7       - Running  (Documentation access)
   URL: https://context7.com/api
   Version: 1.0.0
   Last check: 2025-01-03 08:15:30

✅ playwright     - Running  (Browser automation)
   Version: 1.40.0
   Last check: 2025-01-03 08:15:31

⚠️  sqlite        - Stopped  (Database operations)
   Reason: Not configured

❌ filesystem     - Error    (File system access)
   Error: Permission denied

Active Servers: 2/4
Enabled Servers: 3/4
```

**Verbose output:**
```bash
autopm mcp status --verbose
```

Shows additional details:
- Configuration details
- Recent activity
- Error logs
- Performance metrics

**JSON output:**
```bash
autopm mcp status --json
```

---

## autopm mcp enable

Enable MCP server.

### Synopsis

```bash
autopm mcp enable <server-name>
```

### Description

Enables an MCP server by adding it to the configuration.

### Available Servers

#### context7
- **Purpose:** Access to framework documentation
- **Supports:** React, Vue, Python, FastAPI, Node.js, etc.
- **Requires:** OpenAI API key (for embeddings)

#### playwright
- **Purpose:** Browser automation and testing
- **Supports:** Chromium, Firefox, WebKit
- **Requires:** Playwright installation

#### filesystem
- **Purpose:** File system operations
- **Supports:** Read, write, list files
- **Requires:** File system permissions

#### sqlite
- **Purpose:** SQLite database access
- **Supports:** Query, insert, update
- **Requires:** SQLite installation

### Examples

**Enable Context7:**
```bash
autopm mcp enable context7
```

Output:
```
✅ Enabled MCP server: context7
   Configuration: .claude/mcp-servers.json
   Documentation: .claude/mcp/context7.md

Next steps:
1. Configure API key: export OPENAI_API_KEY=sk-xxxxx
2. Test connection: autopm mcp test context7
3. Sync to Claude Code: autopm mcp sync
```

**Enable multiple servers:**
```bash
autopm mcp enable context7 playwright sqlite
```

**Enable all servers:**
```bash
autopm mcp enable --all
```

---

## autopm mcp disable

Disable MCP server.

### Synopsis

```bash
autopm mcp disable <server-name>
```

### Description

Disables an MCP server.

### Examples

**Disable Context7:**
```bash
autopm mcp disable context7
```

**Disable multiple servers:**
```bash
autopm mcp disable playwright sqlite
```

---

## autopm mcp setup

Configure MCP server settings.

### Synopsis

```bash
autopm mcp setup [server-name]
```

### Description

Interactive configuration wizard for MCP servers.

### Examples

**Setup all servers (interactive):**
```bash
autopm mcp setup
```

Prompts:
```
MCP Server Setup

Select server to configure:
1. context7 (Documentation access)
2. playwright (Browser automation)
3. filesystem (File system access)
4. sqlite (Database operations)

Choice: 1

Context7 Configuration:
  OpenAI API Key: [sk-xxxxx...]
  Cache enabled: [Y/n] y
  Cache TTL (hours): [24] 24

✅ Configuration saved
```

**Setup specific server:**
```bash
autopm mcp setup context7
```

**Non-interactive setup:**
```bash
OPENAI_API_KEY=sk-xxxxx autopm mcp setup context7 --non-interactive
```

---

## autopm mcp test

Test MCP server connection.

### Synopsis

```bash
autopm mcp test <server-name>
```

### Description

Tests connection to an MCP server and validates functionality.

### Examples

**Test Context7:**
```bash
autopm mcp test context7
```

Output:
```
Testing MCP server: context7

✅ Connection: OK
   URL: https://context7.com/api
   Status: 200 OK

✅ Authentication: OK
   API Key: Valid
   Permissions: Read

✅ Functionality: OK
   Test query: "React hooks documentation"
   Response time: 245ms
   Results: 10 documents found

✅ All tests passed!
```

**Test all servers:**
```bash
autopm mcp test --all
```

**Test with verbose output:**
```bash
autopm mcp test context7 --verbose
```

---

## autopm mcp diagnose

Diagnose MCP server issues.

### Synopsis

```bash
autopm mcp diagnose [options]
```

### Description

Comprehensive diagnostics for MCP server issues.

### Options

| Option | Description |
|--------|-------------|
| `--server <name>` | Diagnose specific server |
| `--fix` | Attempt to fix common issues |
| `--verbose` | Show detailed diagnostics |

### Examples

**Diagnose all servers:**
```bash
autopm mcp diagnose
```

Output:
```
MCP Server Diagnostics

context7:
  ✅ Server configuration valid
  ✅ Network connectivity OK
  ❌ Authentication failed
     → API key not set or invalid
     → Fix: export OPENAI_API_KEY=sk-xxxxx
  ✅ Dependencies installed
  ⚠️  Cache directory not writable
     → Fix: chmod 755 .claude/mcp/cache/

playwright:
  ✅ Server configuration valid
  ✅ Network connectivity OK
  ✅ Authentication OK
  ❌ Playwright not installed
     → Fix: npm install -D playwright
  ✅ Permissions OK

Errors: 2
Warnings: 1
```

**Diagnose specific server:**
```bash
autopm mcp diagnose --server context7
```

**Diagnose and fix:**
```bash
autopm mcp diagnose --fix
```

Attempts to fix:
- Missing environment variables (prompts for values)
- File permissions
- Missing dependencies
- Configuration errors

---

## autopm mcp sync

Sync MCP configuration to Claude Code.

### Synopsis

```bash
autopm mcp sync
```

### Description

Synchronizes MCP server configuration from `.claude/mcp-servers.json` to `.claude-code/config.json`.

**What it does:**
1. Reads MCP configuration
2. Updates Claude Code settings
3. Reloads configuration (if Claude Code is running)

### Examples

**Sync MCP configuration:**
```bash
autopm mcp sync
```

Output:
```
✅ MCP configuration synced
   Enabled servers: 2
   - context7
   - playwright

⚠️  Note: Reload Claude Code for changes to take effect
```

---

## autopm mcp list

List all available MCP servers.

### Synopsis

```bash
autopm mcp list [options]
```

### Description

Lists all available MCP servers.

### Options

| Option | Description |
|--------|-------------|
| `--available` | Show only available servers |
| `--enabled` | Show only enabled servers |
| `--json` | Output as JSON |

### Examples

**List all servers:**
```bash
autopm mcp list
```

Output:
```
Available MCP Servers:

✅ context7 (Enabled)
   Description: Framework documentation access
   Supported: React, Vue, Python, FastAPI, Node.js, etc.
   Requires: OpenAI API key

✅ playwright (Enabled)
   Description: Browser automation
   Supported: Chromium, Firefox, WebKit
   Requires: Playwright installation

⚪ filesystem (Disabled)
   Description: File system operations
   Supported: Read, write, list files
   Requires: File permissions

⚪ sqlite (Disabled)
   Description: SQLite database access
   Supported: Query, insert, update
   Requires: SQLite installation
```

**List enabled servers only:**
```bash
autopm mcp list --enabled
```

---

## autopm mcp agents

Show which agents use MCP servers.

### Synopsis

```bash
autopm mcp agents [server-name]
```

### Description

Displays which agents use MCP servers for enhanced capabilities.

### Examples

**Show all MCP-enabled agents:**
```bash
autopm mcp agents
```

Output:
```
Agents using MCP servers:

context7:
  - python-backend-engineer
    Uses: Python, FastAPI documentation
  - react-frontend-engineer
    Uses: React, Next.js documentation
  - nodejs-backend-engineer
    Uses: Node.js, Express documentation
  - terraform-infrastructure-expert
    Uses: Terraform documentation
  - docker-containerization-expert
    Uses: Docker documentation
  - kubernetes-orchestrator
    Uses: Kubernetes documentation

playwright:
  - e2e-test-engineer
    Uses: Browser automation for testing
  - frontend-testing-engineer
    Uses: Component testing

Total: 8 agents use MCP servers
```

**Show agents using specific server:**
```bash
autopm mcp agents context7
```

---

## autopm mcp usage

Show MCP usage statistics.

### Synopsis

```bash
autopm mcp usage [options]
```

### Description

Displays usage statistics for MCP servers.

### Options

| Option | Description |
|--------|-------------|
| `--server <name>` | Stats for specific server |
| `--period <days>` | Time period (default: 7) |
| `--json` | Output as JSON |

### Examples

**Show usage stats:**
```bash
autopm mcp usage
```

Output:
```
MCP Usage Statistics (Last 7 days):

context7:
  Total requests: 145
  Successful: 142 (97.9%)
  Failed: 3 (2.1%)
  Avg response time: 324ms
  Most queried:
    - React documentation (45 requests)
    - Python documentation (38 requests)
    - FastAPI documentation (27 requests)

playwright:
  Total requests: 23
  Successful: 22 (95.7%)
  Failed: 1 (4.3%)
  Avg response time: 1,245ms
  Most used:
    - Browser launch (15 times)
    - Screenshot (5 times)
    - Navigation (3 times)
```

**Show specific server usage:**
```bash
autopm mcp usage --server context7
```

**Show last 30 days:**
```bash
autopm mcp usage --period 30
```

---

## autopm mcp cache

Manage MCP cache.

### Synopsis

```bash
autopm mcp cache <command> [options]
```

### Commands

| Command | Description |
|---------|-------------|
| `show` | Show cache statistics |
| `clear` | Clear cache |
| `prune` | Remove old entries |

### Examples

**Show cache stats:**
```bash
autopm mcp cache show
```

Output:
```
MCP Cache Statistics:

context7:
  Size: 45.2 MB
  Entries: 234
  Hit rate: 87.3%
  Oldest entry: 2025-01-01 14:23:45
  Newest entry: 2025-01-03 08:15:30

playwright:
  Size: 12.8 MB
  Entries: 45
  Hit rate: 92.1%
  Oldest entry: 2025-01-02 09:12:15
  Newest entry: 2025-01-03 08:14:22

Total cache size: 58.0 MB
```

**Clear cache:**
```bash
autopm mcp cache clear
```

**Prune old entries:**
```bash
autopm mcp cache prune --older-than 7d
```

---

## MCP Configuration File

### Location

`.claude/mcp-servers.json`

### Format

```json
{
  "context7": {
    "enabled": true,
    "url": "https://context7.com/api",
    "apiKey": "${OPENAI_API_KEY}",
    "options": {
      "cache": true,
      "cacheTTL": 86400
    }
  },

  "playwright": {
    "enabled": true,
    "options": {
      "browser": "chromium",
      "headless": true
    }
  },

  "filesystem": {
    "enabled": false,
    "options": {
      "rootDir": "${PROJECT_ROOT}",
      "allowedPaths": [
        "src/",
        "docs/"
      ]
    }
  },

  "sqlite": {
    "enabled": false,
    "options": {
      "databases": [
        "data/app.db"
      ]
    }
  }
}
```

---

## Common Workflows

### Initial MCP Setup

```bash
# 1. Enable Context7
autopm mcp enable context7

# 2. Configure API key
export OPENAI_API_KEY=sk-xxxxx
# Or add to .claude/.env
echo "OPENAI_API_KEY=sk-xxxxx" >> .claude/.env

# 3. Setup configuration
autopm mcp setup context7

# 4. Test connection
autopm mcp test context7

# 5. Sync to Claude Code
autopm mcp sync

# 6. Reload Claude Code
```

### Troubleshooting MCP Issues

```bash
# 1. Check status
autopm mcp status

# 2. Run diagnostics
autopm mcp diagnose --verbose

# 3. Fix issues
autopm mcp diagnose --fix

# 4. Test connection
autopm mcp test context7

# 5. Check logs
autopm mcp logs context7
```

### Optimizing MCP Performance

```bash
# 1. Check cache stats
autopm mcp cache show

# 2. Prune old entries
autopm mcp cache prune --older-than 30d

# 3. Check usage
autopm mcp usage --period 30

# 4. Optimize configuration
autopm mcp setup context7
# Enable cache, set appropriate TTL
```

---

## Related Documentation

- [MCP Servers Guide](../integrations/mcp-servers.md)
- [Context7 Integration](../integrations/context7.md)
- [Configuration Commands](config.md)
- [Installation Guide](../getting-started/installation.md#mcp-setup)
