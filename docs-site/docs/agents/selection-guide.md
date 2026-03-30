# Agent Selection Guide

ClaudeAutoPM provides 7 core agents (always available) plus 50+ specialized plugin agents. This guide helps you choose the right agent for your task.

## Core vs Plugin Agents

**Core agents** are available in every installation scenario, including lite. They handle fundamental development tasks.

**Plugin agents** require the corresponding plugin to be installed. If you try to use a plugin agent that is not installed, it will not be available in the agent registry.

## Quick Selection Matrix

### Core Agents (Always Available)

| Task | Agent | When to Use |
|------|-------|-------------|
| Code review / bugs | `@code-analyzer` | Pre-commit reviews, security scanning, architecture analysis |
| Run tests | `@test-runner` | Test execution, failure analysis, coverage reports |
| Analyze files | `@file-analyzer` | Large log files, documentation review, config analysis |
| Parallel work | `@parallel-worker` | Multi-file operations, complex workflows |
| Create agents | `@agent-manager` | New agent creation, registry maintenance |
| MCP servers | `@mcp-manager` | MCP setup, configuration, health checks |
| Context optimization | `@context-optimizer` | Reduce context usage, prompt optimization |

### Plugin Agents by Technology

| Technology | Agent | Plugin Required |
|------------|-------|-----------------|
| React | `@react-ui-expert` | plugin-frameworks |
| Python Backend | `@python-backend-expert` | plugin-languages |
| Node.js Backend | `@nodejs-backend-engineer` | plugin-languages |
| Docker | `@docker-containerization-expert` | plugin-devops |
| Kubernetes | `@kubernetes-orchestrator` | plugin-devops |
| GitHub Actions | `@github-operations-specialist` | plugin-devops |
| AWS | `@aws-cloud-architect` | plugin-cloud |
| Azure | `@azure-cloud-architect` | plugin-cloud |
| GCP | `@gcp-cloud-architect` | plugin-cloud |
| PostgreSQL | `@postgresql-expert` | plugin-databases |
| MongoDB | `@mongodb-expert` | plugin-databases |
| Terraform | `@terraform-infrastructure-expert` | plugin-cloud |
| Playwright | `@e2e-test-engineer` | plugin-frameworks |

### By Task Type

| Task | Agent | Core? |
|------|-------|-------|
| Code review | `@code-analyzer` | Yes |
| Run tests | `@test-runner` | Yes |
| Build UI | `@react-ui-expert` | No (plugin-frameworks) |
| API development | `@python-backend-expert` | No (plugin-languages) |
| DevOps/CI | `@github-operations-specialist` | No (plugin-devops) |
| Database design | `@postgresql-expert` | No (plugin-databases) |
| Cloud architecture | `@aws-cloud-architect` | No (plugin-cloud) |
| Containerization | `@docker-containerization-expert` | No (plugin-devops) |

## Decision Flowchart

### Choosing by Scope

```
1. Is this a code review, test, or file analysis?
   YES → Use core agents (always available)

2. Is this framework/language-specific?
   YES → Check if the required plugin is installed
   NO  → Use @code-analyzer as fallback

3. Is this infrastructure/cloud work?
   YES → Requires plugin-devops or plugin-cloud
```

### Choosing by Role

```
Planning/designing?     → Use "expert" or "architect" agents (plugins)
Building/coding?        → Use "engineer" agents (plugins)
Reviewing/analyzing?    → Use core agents
Testing?                → Use @test-runner (core)
```

## Agent Combinations

### Full Stack Development

```markdown
@code-analyzer review code quality          # Core
@react-ui-expert create user dashboard      # plugin-frameworks
@python-backend-expert create API endpoints # plugin-languages
@postgresql-expert design database schema   # plugin-databases
```

### DevOps Pipeline

```markdown
@test-runner execute all tests                          # Core
@docker-containerization-expert dockerize application   # plugin-devops
@github-operations-specialist setup GitHub Actions      # plugin-devops
@kubernetes-orchestrator deploy to K8s                  # plugin-devops
```

### Testing Suite

```markdown
@test-runner create unit tests             # Core
@code-analyzer verify test coverage        # Core
@e2e-test-engineer create end-to-end tests # plugin-frameworks
```

## Checking Available Agents

Your available agents depend on your installation scenario:

| Scenario | Core Agents | Plugin Agents |
|----------|-------------|---------------|
| lite | 7 | 0 |
| github | 7 | 6 (languages) |
| azure | 7 | 6 (languages) |
| docker | 7 | ~22 |
| full | 7 | ~45 |
| performance | 7 | ~50 |

To see which agents are available, check your `agent-registry.xml`:

```bash
cat .claude/agents/agent-registry.xml
```

## Best Practices

### 1. Start with Core Agents
Always try core agents first. They handle most common tasks without needing plugins.

### 2. Be Specific
Choose the most specific agent for your task:
- Use `@react-ui-expert` for React work, not `@code-analyzer`
- Use `@postgresql-expert` for database queries, not a generic agent

### 3. Provide Context
```markdown
# Good
@postgresql-expert optimize query for table with 10M rows, joining users and orders

# Better than
@postgresql-expert optimize this query
```

### 4. Check Plugin Availability
If an agent does not respond, verify the plugin is installed:
```bash
cat .claude/config.json | grep plugins
```

## Related Pages

- [Agent Registry](./registry) - Complete agent listing
- [Plugin Development](/developer-guide/plugin-development) - Create plugins
- [Installation](/getting-started/installation) - Scenario selection
