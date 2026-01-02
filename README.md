# ClaudeAutoPM

[![NPM Version](https://img.shields.io/npm/v/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![MIT License](https://img.shields.io/badge/License-MIT-28a745)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rafeekpro/ClaudeAutoPM?style=social)](https://github.com/rafeekpro/ClaudeAutoPM)

**AI-Powered Project Management Framework for Claude Code**

ClaudeAutoPM transforms your development workflow with intelligent automation, 60+ specialized AI agents, and complete GitHub/Azure DevOps integration.

---

## Quick Install

```bash
npm install -g claude-autopm
cd your-project
autopm install
```

Choose your scenario during installation:
- **Minimal** - Core features, 3 plugins
- **Docker-only** - Modern web development, 6 plugins
- **Full DevOps** - Production-ready, 9 plugins (recommended)
- **Performance** - All capabilities, 11 plugins

---

## Quick Start

```bash
# Initialize PM structure
autopm pm init

# Create and decompose a feature
/pm:prd-new "User authentication system"
/pm:epic-decompose prd-001-authentication.md

# Work on tasks
autopm pm next
autopm issue start 123
autopm issue close 123

# Sync with provider
autopm pm sync
```

---

## Features

### Plugin System
11 official plugins with 60+ specialized agents:
- **Core** - Framework essentials, code analyzer, test runner
- **Languages** - JavaScript, TypeScript, Python, Node.js, Bash
- **Frameworks** - React, Vue, Tailwind CSS
- **Testing** - E2E, frontend testing, accessibility
- **DevOps** - Docker, GitHub Actions, observability
- **Cloud** - AWS, Azure, GCP, Kubernetes, Terraform
- **Databases** - PostgreSQL, MongoDB, Redis, BigQuery
- **PM** - 87 project management commands

### Provider Integration
- **GitHub** - Issues, PRs, Actions, Projects
- **Azure DevOps** - Work Items, Boards, Pipelines
- **Local** - Git-based workflow

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
- [PM Workflow](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/pm-workflow)
- [Commands Overview](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/commands-overview)
- [Agents Overview](https://rafeekpro.github.io/ClaudeAutoPM/user-guide/agents-overview)
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
| Modular | 11 plugins, install what you need | Monolithic |
| Agents | 60+ specialized experts | Generic or none |
| Workflow | PRD to Production | Fragmented |
| Integration | GitHub + Azure DevOps | Limited |

---

## Contributing

We welcome contributions! See the [Contributing Guide](https://rafeekpro.github.io/ClaudeAutoPM/developer-guide/contributing) for:
- Development setup
- Coding standards
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
  <b>Built for the Claude Code community</b>
  <br>
  <sub>Star this repo if ClaudeAutoPM helps your workflow!</sub>
</p>
