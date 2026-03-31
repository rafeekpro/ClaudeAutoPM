---
allowed-tools: Bash, Read
---

# PM Dashboard

Project dashboard with two modes: interactive config server (default) or static HTML report.

## Interactive mode (default)

```bash
node .claude/scripts/pm/dashboard-serve.js
```

Starts interactive dashboard with tabs: Overview, Config, MCP & Keys, Diagrams, Tests.

Localhost-only HTTP server with bearer token auth. Writes PID, port, and token to `.claude/pm/dashboard.pid`. Browser opens automatically with token in query string.

Provides forms for editing:
- **Config** — execution strategy, provider, docker/k8s toggles, plugins
- **MCP Servers** — add, edit, remove MCP server entries (merges with existing config)
- **API Keys** — .env variable editor with masked inputs (preserves existing secrets)
- **Diagrams** — Mermaid architecture, epic flow, plugin graph, agent tree
- **Tests** — test plan from epic AC, last test results

Security:
- Binds to 127.0.0.1 only
- Bearer token auth on all routes
- Auto-shutdown after 5 minutes idle
- XSS-escaped output, JSON validation
- Config saves merge with existing data
- Backs up files before writing

## Static mode (legacy)

```bash
node .claude/scripts/pm/dashboard.js
```

Generates static `.claude/pm/dashboard.html` without tabs or config forms. Opens in browser.
