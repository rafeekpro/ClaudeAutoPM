---
allowed-tools: Bash, Read
---

# PM Dashboard

Project dashboard with two modes: static HTML report or interactive config server.

## Usage

### Static (read-only report)

```bash
node .claude/scripts/pm/dashboard.js
```

Generates `.claude/pm/dashboard.html` with PRD/Epic/Issue counts, epic progress bars, recent activity. Opens in browser.

### Interactive (config editor)

```bash
node .claude/scripts/pm/dashboard-serve.js
```

Starts localhost HTTP server with bearer token auth. Provides forms for editing:
- **Config** -- execution strategy, provider, docker/k8s toggles
- **Plugins** -- enable/disable installed plugins
- **MCP Servers** -- add, edit, remove MCP server entries
- **API Keys** -- .env variable editor with masked inputs

Features:
- Binds to 127.0.0.1 only (localhost)
- Bearer token auth (written to `.claude/pm/dashboard.pid`)
- Auto-shutdown after 5 minutes idle
- Backs up config files before writing
- Auto-refreshes status every 10 seconds
