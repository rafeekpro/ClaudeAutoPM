# ClaudeAutoPM

[![NPM Version](https://img.shields.io/npm/v/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![MIT License](https://img.shields.io/badge/License-MIT-28a745)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rafeekpro/ClaudeAutoPM?style=social)](https://github.com/rafeekpro/ClaudeAutoPM)

**AI-Powered Project Management Framework for Claude Code**

ClaudeAutoPM transforms your development workflow with intelligent automation, 40 specialized AI agents, and complete GitHub/Azure DevOps integration.

---

## Quick Install

```bash
npm install -g claude-autopm
cd your-project
autopm install
```

Choose your scenario during installation:
- **Minimal** - Core features, sequential execution
- **Docker** - Container development with Docker
- **Full** - All features, adaptive execution (recommended)
- **Performance** - Maximum parallelization for power users

---

## Quick Start

All commands run inside Claude Code (not terminal):

```bash
# Initialize context and testing
/context:create
/testing:prime

# Azure DevOps integration
/azure:init
/azure:us-new "User authentication"
/azure:task-list

# GitHub integration
/github:workflow-create

# Working with agents
@python-backend-engineer Build FastAPI endpoint
@test-runner execute all tests
@code-analyzer review recent changes
```

---

## Features

### Plugin System

12 official plugins with 269 commands across all domains:

**Core** (7 commands)
- Context management (`/context:*`)
- Testing framework detection (`/testing:*`)
- Configuration (`/config:*`)
- MCP server setup (`/mcp:*`)

**PM System** (54 commands)
- PRD and Epic management
- Issue tracking and decomposition
- Git workflow integration
- Progress tracking

**Azure DevOps** (41 commands)
- User Story management (`/azure:us-*`)
- Task management (`/azure:task-*`)
- Feature/Epic management (`/azure:feature-*`)
- Sprint planning and status

**GitHub** (18 commands)
- Workflow creation
- Issue and PR management
- Repository automation

**Languages** (3 commands)
- Python backend expert
- JavaScript frontend expert
- Node.js backend expert

**Frameworks** (6 commands)
- React UI components
- Tailwind CSS styling
- UX design analysis

**Testing** (3 commands)
- E2E test scaffolding
- Frontend testing
- Test execution

**DevOps** (8 commands)
- Docker containerization
- Kubernetes deployment
- Infrastructure setup
- SSH operations

**Cloud** (2 commands)
- Multi-cloud deployment
- Infrastructure automation

**Databases** (4 commands)
- PostgreSQL expert
- MongoDB expert
- Redis expert
- BigQuery expert

**AI/ML** (3 commands)
- LangGraph workflows
- OpenAI integration
- Data pipelines

**Data** (3 commands)
- Kedro pipelines
- Airflow orchestration

### Agent Registry

40 specialized AI agents organized by domain:

**Core Agents** (6)
- `agent-manager` - Create and manage agents
- `code-analyzer` - Code analysis and bug detection
- `test-runner` - Test execution and analysis
- `file-analyzer` - Large file summarization
- `parallel-worker` - Multi-agent coordination
- `mcp-manager` - MCP server infrastructure

**Language Agents** (4)
- `python-backend-engineer` - Python architecture and FastAPI
- `javascript-frontend-engineer` - Modern JavaScript/TypeScript
- `nodejs-backend-engineer` - Express, Fastify, NestJS
- `bash-scripting-expert` - Shell automation and scripting

**Framework Agents** (5)
- `react-frontend-engineer` - Full React applications
- `react-ui-expert` - UI components (MUI, Chakra, AntD)
- `tailwindcss-expert` - Utility-first CSS framework
- `ux-design-expert` - UX/UI design and accessibility
- `e2e-test-engineer` - Playwright and Cypress E2E tests

**Testing Agents** (1)
- `frontend-testing-engineer` - Component and integration tests

**Database Agents** (4)
- `postgresql-expert` - PostgreSQL design and optimization
- `mongodb-expert` - MongoDB schema and aggregation
- `redis-expert` - Caching and pub/sub messaging
- `bigquery-expert` - Data warehouse and analytics

**DevOps Agents** (6)
- `docker-containerization-expert` - Docker containers and compose
- `kubernetes-orchestrator` - K8s deployments and Helm
- `github-operations-specialist` - GitHub Actions and workflows
- `observability-engineer` - Prometheus, Grafana, ELK
- `traefik-proxy-expert` - Reverse proxy configuration
- `ssh-operations-expert` - Secure SSH operations

**Cloud Agents** (5)
- `aws-cloud-architect` - AWS infrastructure design
- `azure-cloud-architect` - Azure cloud architecture
- `gcp-cloud-architect` - GCP cloud design
- `terraform-infrastructure-expert` - Infrastructure as Code
- `gcp-cloud-functions-engineer` - Serverless functions

**Integration Agents** (2)
- `message-queue-engineer` - Kafka, RabbitMQ, SQS/SNS
- `nats-messaging-expert` - NATS pub/sub and queues

**Data/ML Agents** (3)
- `langgraph-workflow-expert` - LangGraph workflows
- `kedro-pipeline-expert` - Kedro data pipelines
- `airflow-orchestration-expert` - Airflow DAGs

**AI API Agents** (2)
- `openai-python-expert` - OpenAI API integration
- `gemini-api-expert` - Google Gemini API

### Provider Integration

- **GitHub** - Issues, PRs, Actions, Projects, Workflows
- **Azure DevOps** - Work Items, Boards, Pipelines, Sprints
- **Local** - Git-based workflow with markdown tracking

### Execution Strategies

- **Sequential** - Safe, predictable, resource-light
- **Adaptive** - Intelligent mode selection (default)
- **Hybrid** - Maximum parallelization

---

## Documentation

### Getting Started
- [Installation](https://rafeekpro.github.io/ClaudeAutoPM/getting-started/installation)
- [First Project](https://rafeekpro.github.io/ClaudeAutoPM/getting-started/first-project)
- [Configuration](https://rafeekpro.github.io/ClaudeAutoPM/getting-started/configuration)

### User Guide
- [Command Overview](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/commands-overview)
- [Agent Registry](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/agents-overview)
- [PM System](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/pm-system)
- [Azure DevOps Integration](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/azure-devops)
- [GitHub Integration](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/github-integration)
- [MCP Servers](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/mcp-servers)
- [Best Practices](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/best-practices)

### Developer Guide
- [Architecture](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/architecture)
- [Plugin Development](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/plugin-development)
- [Agent Development](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/agent-development)
- [Command Development](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/command-development)
- [Testing](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/testing)
- [Contributing](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/contributing)

### Reference
- [CLI Reference](https://rafeekpro.github.io/ClaudeAutoPM/commands/)
- [Agent Registry](https://rafeekpro.github.io/ClaudeAutoPM/agents/)
- [Configuration Options](https://rafeekpro.github.io/ClaudeAutoPM/reference/configuration)
- [Troubleshooting](https://rafeekpro.github.io/ClaudeAutoPM/reference/troubleshooting)

---

## Why ClaudeAutoPM?

| Feature | ClaudeAutoPM | Traditional Tools |
|---------|--------------|-------------------|
| AI-native | Built for Claude Code | Adapted/retrofitted |
| Modular | 12 plugins, install what you need | Monolithic |
| Agents | 40 specialized experts | Generic or none |
| Workflow | Context to Production | Fragmented |
| Integration | GitHub + Azure DevOps | Limited |
| Documentation | Context7-verified, always current | Often outdated |

---

## Contributing

We welcome contributions! See [Contributing Guide](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/contributing) for:
- Development setup
- Coding standards (TDD mandatory)
- Testing requirements
- Pull request process

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- **Documentation**: [rafeekpro.github.io/ClaudeAutoPM](https://rafeekpro.github.io/ClaudeAutoPM/)
- **npm**: [npmjs.com/package/claude-autopm](https://www.npmjs.com/package/claude-autopm)
- **Issues**: [GitHub Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

<p align="center">
  <b>Built for Claude Code community</b>
  <br>
  <sub>Star this repo if ClaudeAutoPM helps your workflow!</sub>
</p>
