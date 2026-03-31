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

### Interactive (config editor) — `--serve`

```bash
node .claude/scripts/pm/dashboard-serve.js
```

Pass `--serve` when invoking via the PM command to launch the interactive server instead of the static report.

Starts a localhost-only HTTP server with bearer token auth. The server writes its PID, port, and token to `.claude/pm/dashboard.pid`. The browser is opened automatically with the token in the query string (`?token=<token>`).

Provides forms for editing:
- **Config** -- execution strategy, provider, docker/k8s toggles, plugins
- **MCP Servers** -- add, edit, remove MCP server entries (merges with existing config)
- **API Keys** -- .env variable editor with masked inputs (merges with existing .env, preserves secrets)

Security:
- Binds to 127.0.0.1 only (no external access)
- Bearer token auth on all API routes
- Token query param required for HTML route (`/?token=<token>`)
- Auto-shutdown after 5 minutes idle
- HTML output is XSS-escaped
- JSON parse errors return 400, not 500
- Config saves merge with existing data (no overwrites)
- .env saves skip placeholder `********` values to preserve existing secrets
- Backs up config files before writing
