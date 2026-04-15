# ClaudeAutoPM

[![NPM Version](https://img.shields.io/npm/v/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![MIT License](https://img.shields.io/badge/License-MIT-28a745)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rafeekpro/ClaudeAutoPM?style=social)](https://github.com/rafeekpro/ClaudeAutoPM)

**AI-Powered Project Management Framework for Claude Code**

ClaudeAutoPM transforms your development workflow with intelligent automation, specialized AI agents via a plugin system, and complete GitHub/Azure DevOps integration. Install only what you need — pay only for the tokens you use.

---

## Quick Install

```bash
npm install -g claude-autopm
cd your-project
autopm install
```

Choose your scenario during installation:

| Scenario | Agents | Use case |
|----------|--------|----------|
| **Lite** | 7 core | Minimal token footprint |
| **GitHub** | 12 | Core + languages for GitHub projects |
| **Azure** | 14 | Core + languages + Azure DevOps |
| **Docker** | 16 | Core + DevOps + containers |
| **Obsidian** | 12 | PM + Obsidian vault integration |
| **Full** | 44+ | All plugins, all agents |
| **Performance** | 44+ | Full + max parallelization |

---

## Architecture

### Plugin-Based Agent System

ClaudeAutoPM uses a **plugin architecture** for token efficiency. Only 7 core agents are loaded by default. Specialized agents are installed on demand via plugins.

```
autopm/.claude/agents/       ← 7 core agents (always available)
packages/plugin-*/agents/    ← 37+ specialized agents (per plugin)
```

**Token savings**: Lite installs use 73% fewer agent tokens vs full.

### XML Rules Engine

7 critical rules auto-loaded via `@include` in XML format:

| Rule | Enforcement |
|------|-------------|
| `tdd.enforcement.xml` | Zero-tolerance TDD cycle |
| `coverage-thresholds.xml` | 80/75/80/80 coverage gates |
| `agent-mandatory.xml` | Agent delegation + context strategy |
| `context7.xml` | Context7 MCP before any library code |
| `github-operations.xml` | Repo protection + mandatory issue footer |
| `naming-conventions.xml` | Naming prohibitions + code quality |
| `command-pipelines.xml` | 5 mandatory command sequences |

3 MD operational guides: `standard-patterns.md`, `frontmatter-operations.md`, `git-strategy.md`

### Dynamic Agent Registry

`agent-registry.xml` is generated at install time based on selected plugins:

```xml
<!-- Core agents (always present) -->
<agents category="core">
  <agent name="code-analyzer">...</agent>
  <agent name="test-runner">...</agent>
  ...
</agents>

<!-- Plugin agents (injected by installer) -->
<!-- PLUGIN_AGENTS_START -->
<agents category="languages">...</agents>
<agents category="frameworks">...</agents>
<!-- PLUGIN_AGENTS_END -->
```

---

## Core Agents (Always Available)

| Agent | Purpose |
|-------|---------|
| `agent-manager` | Agent lifecycle, registry maintenance |
| `code-analyzer` | Code analysis, bug detection, logic tracing |
| `test-runner` | Test execution with actionable insights |
| `file-analyzer` | Summarize large files, reduce context |
| `parallel-worker` | Multi-agent parallel work streams |
| `mcp-manager` | MCP server install, config, health |
| `context-optimizer` | Context window efficiency, compaction |

## Plugin Agents

| Plugin | Agents | Examples |
|--------|--------|----------|
| **plugin-languages** | 5 | python-backend-engineer, nodejs-backend-engineer, bash-scripting-expert |
| **plugin-frameworks** | 6 | react-frontend-engineer, tailwindcss-expert, e2e-test-engineer |
| **plugin-cloud** | 8 | aws-cloud-architect, kubernetes-orchestrator, terraform-expert |
| **plugin-devops** | 7 | docker-expert, github-operations-specialist, observability-engineer |
| **plugin-databases** | 5 | postgresql-expert, mongodb-expert, redis-expert |
| **plugin-ai** | 8 | openai-python-expert, gemini-api-expert, langchain-expert |
| **plugin-data** | 3 | airflow-orchestration-expert, kedro-pipeline-expert |
| **plugin-testing** | 2 | frontend-testing-engineer, e2e specialists |
| **plugin-ml** | 2 | ML workflow agents |
| **plugin-pm** | — | 29 PM commands (PRD, epic, issue management) |

---

## Quick Start

All commands run inside Claude Code (not terminal):

```bash
# Initialize context and testing
/context:create
/testing:prime

# PM workflow
/pm:issue-start 42
/pm:issue-finish 42

# Working with agents
@python-backend-engineer Build FastAPI endpoint
@test-runner execute all tests
@code-analyzer review recent changes
```

---

## Features

### 14 Official Plugins

- **Core** — Context management, testing, configuration, MCP
- **PM System** — PRD, epics, issues, decomposition, git workflow
- **Obsidian** — Read-only vault sync, Dataview frontmatter, diagnostics
- **Azure DevOps** — Work items, boards, pipelines, sprints
- **GitHub** — Workflows, issues, PRs, automation
- **Languages** — Python, JavaScript, Node.js, Bash
- **Frameworks** — React, Tailwind, UX, E2E testing, NATS
- **Testing** — Frontend unit/integration, E2E
- **DevOps** — Docker, Kubernetes, Traefik, SSH, observability
- **Cloud** — AWS, Azure, GCP, Terraform, serverless
- **Databases** — PostgreSQL, MongoDB, BigQuery, CosmosDB, Redis
- **AI/ML** — OpenAI, Gemini, LangChain, HuggingFace
- **Data** — Airflow, Kedro, LangGraph

### Provider Integration

- **GitHub** — Issues, PRs, Actions, Projects
- **Azure DevOps** — Work Items, Boards, Pipelines
- **Local** — Git-based workflow with markdown tracking

### Execution Strategies

- **Sequential** — Safe, predictable
- **Adaptive** — Intelligent mode selection (default)
- **Hybrid** — Maximum parallelization

---

## Documentation

- [Installation](https://rafeekpro.github.io/ClaudeAutoPM/getting-started/installation)
- [Command Overview](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/commands-overview)
- [Agent Registry](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/agents-overview)
- [Plugin Development](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/plugin-development)
- [Architecture](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/architecture)

---

## Why ClaudeAutoPM?

| Feature | ClaudeAutoPM | Traditional Tools |
|---------|--------------|-------------------|
| AI-native | Built for Claude Code | Adapted/retrofitted |
| Token-efficient | Plugin system, install what you need | Monolithic |
| Agents | 44+ specialized, load on demand | Generic or none |
| Rules | 7 XML auto-enforced (TDD, coverage, Context7) | Manual checklists |
| Integration | GitHub + Azure DevOps | Limited |
| Documentation | Context7-verified, always current | Often outdated |

---

## Contributing

We welcome contributions! See [Contributing Guide](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/contributing).

TDD is mandatory — every PR must follow Red-Green-Refactor.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- **Documentation**: [rafeekpro.github.io/ClaudeAutoPM](https://rafeekpro.github.io/ClaudeAutoPM/)
- **npm**: [npmjs.com/package/claude-autopm](https://www.npmjs.com/package/claude-autopm)
- **Issues**: [GitHub Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
