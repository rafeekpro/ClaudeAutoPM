# ClaudeAutoPM Documentation

Complete documentation for ClaudeAutoPM - AI-Powered Project Management Framework for Claude Code.

---

## 🚀 Getting Started

New to ClaudeAutoPM? Start here:

### Quick Links

- **[Installation Guide](getting-started/installation.md)** - Complete installation walkthrough
- **[5-Minute Quick Start](getting-started/quick-start.md)** - Get productive in 5 minutes
- **[Your First Project](getting-started/first-project.md)** - Build something real

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Claude Code (Desktop app)
- GitHub or Azure DevOps account

---

## 📚 Core Concepts

Understand how ClaudeAutoPM works:

### Architecture & Design

- **[Architecture Overview](core-concepts/architecture.md)** - System architecture and components
- **[Hybrid Execution](core-concepts/hybrid-execution.md)** - Deterministic vs AI-powered modes
- **[Agent System](core-concepts/agent-system.md)** - How AI agents work
- **[Team Management](core-concepts/team-management.md)** - Dynamic agent teams
- **[Execution Strategies](core-concepts/execution-strategies.md)** - Sequential, Adaptive, Hybrid

### Key Features

```
┌─────────────────────────────────────────────────────┐
│  109 CLI Commands  +  39 AI Agents  +  Multi-Cloud │
│                                                      │
│  Hybrid Execution  +  Team Management  +  MCP       │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Workflows

Complete workflows from planning to production:

### Development Workflows

- **[PRD to Production](workflows/prd-to-production.md)** ⭐ Complete end-to-end workflow
- **[Epic Management](workflows/epic-management.md)** - Managing large projects
- **[Issue Tracking](workflows/issue-tracking.md)** - Day-to-day development
- **[Development Cycle](workflows/development-cycle.md)** - Daily development flow
- **[Deployment](workflows/deployment.md)** - Deployment strategies

### Typical Flow

```
PRD → Epic → Issues → Development → Testing → PR → Deploy → Production
 ↓      ↓       ↓         ↓            ↓       ↓      ↓         ↓
AI    Agent   GitHub   Multiple     Automated  Code  CI/CD   Monitor
      Decom-  Sync     AI Agents    Testing    Review
      position
```

---

## 🛠️ CLI Reference

Command-line interface documentation:

### Command Categories

- **[Overview](cli-reference/overview.md)** - All available commands
- **[install & update](cli-reference/install-update.md)** - Project setup
- **[config](cli-reference/config.md)** - Configuration management
- **[team](cli-reference/team.md)** - Agent team management
- **[mcp](cli-reference/mcp.md)** - MCP server management
- **[epic](cli-reference/epic.md)** - Epic management
- **[Slash Commands](cli-reference/slash-commands.md)** - All /pm:* commands

### Quick Command Reference

```bash
# Setup
autopm install                    # Install framework
autopm config set provider github # Configure provider
autopm team load fullstack        # Load agent team

# Project Management (in Claude Code)
/pm:prd-new "description"         # Create PRD
/pm:epic-decompose prd-file       # Create epic
/pm:epic-sync epic-file           # Sync with GitHub
/pm:next-task                     # Get next task
/pm:issue-close "message"         # Complete task

# Configuration
autopm config show                # Show config
autopm config validate            # Validate setup
autopm mcp status                 # Check MCP servers
```

---

## 🤖 Agent System

AI agents for specialized tasks:

### Agent Documentation

- **[Agent Registry](agents/registry.md)** ⭐ Complete agent catalog
- **[Core Agents](agents/core-agents.md)** - System agents (7)
- **[Language Agents](agents/language-agents.md)** - Python, Node.js, etc. (6)
- **[Framework Agents](agents/framework-agents.md)** - React, FastAPI, etc. (8)
- **[Cloud Agents](agents/cloud-agents.md)** - AWS, Azure, GCP (7)
- **[DevOps Agents](agents/devops-agents.md)** - Docker, K8s, CI/CD (6)
- **[Custom Agents](agents/custom-agents.md)** - Creating your own

### Agent Count by Category

```
Core:       █████████████████████ 7
Languages:  █████████████████ 6
Frameworks: ████████████████████████ 8
Cloud:      █████████████████████ 7
DevOps:     █████████████████ 6
Databases:  ██████████████ 5
```

**Total:** 39 active agents

### Quick Agent Selection

```
Planning/Design    → Use "expert" agents
Implementation     → Use "engineer" agents
Infrastructure     → Use "architect" agents
Multi-cloud IaC    → Use terraform-infrastructure-expert
Container work     → Use docker-containerization-expert
Production deploy  → Use kubernetes-orchestrator
```

---

## 🔌 Integrations

External integrations and providers:

### Provider Integrations

- **[GitHub](integrations/github.md)** - GitHub Issues, PRs, Actions
- **[Azure DevOps](integrations/azure-devops.md)** - Work Items, Boards, Pipelines
- **[MCP Servers](integrations/mcp-servers.md)** - Model Context Protocol
- **[Context7](integrations/context7.md)** - Documentation access
- **[Claude Code](integrations/claude-code.md)** - Best practices

### Setup Guides

#### GitHub
```bash
autopm config set provider github
autopm config set github.owner USERNAME
autopm config set github.repo REPOSITORY
export GITHUB_TOKEN=ghp_xxxxx
```

#### Azure DevOps
```bash
autopm config set provider azure
autopm config set azure.organization ORG
autopm config set azure.project PROJECT
export AZURE_DEVOPS_PAT=xxxxx
```

#### MCP Servers
```bash
autopm mcp enable context7
autopm mcp setup
autopm mcp sync
```

---

## 🎓 Advanced Topics

Deep dives into advanced features:

### Advanced Workflows

- **[Parallel Execution](advanced/parallel-execution.md)** - Multi-agent coordination
- **[Context Optimization](advanced/context-optimization.md)** - Managing context efficiently
- **[Custom Workflows](advanced/custom-workflows.md)** - Building custom flows
- **[Hooks & Automation](advanced/hooks-and-automation.md)** - Git hooks, scripts
- **[Performance Tuning](advanced/performance-tuning.md)** - Optimization strategies

### Best Practices

```
✅ Always validate configuration: autopm config validate
✅ Use appropriate execution strategy for your needs
✅ Load correct team before starting work
✅ Sync regularly with provider (GitHub/Azure)
✅ Write clear PRDs for better epic decomposition
✅ Use specialized agents for specialized tasks
✅ Enable MCP servers for better context
```

---

## 👨‍💻 Development

Contributing and extending ClaudeAutoPM:

### For Contributors

- **[Contributing Guide](development/contributing.md)** - How to contribute
- **[Development Standards](development/development-standards.md)** - Coding standards
- **[Testing](development/testing.md)** - Test requirements
- **[Architecture Decisions](development/architecture-decisions.md)** - ADRs

### For Maintainers

- **[Release Process](development/release-process.md)** - How to release
- **[Security](development/security.md)** - Security guidelines
- **[Performance](development/performance.md)** - Performance monitoring

---

## 🆘 Troubleshooting

Get help when you need it:

### Common Issues

- **[FAQ](troubleshooting/faq.md)** - Frequently asked questions
- **[Common Issues](troubleshooting/common-issues.md)** - Typical problems and solutions
- **[Debugging Guide](troubleshooting/debugging.md)** - How to debug issues

### Quick Troubleshooting

#### "Command not found: autopm"
```bash
npm install -g claude-autopm
# Or check PATH
export PATH=$(npm bin -g):$PATH
```

#### "Agent not found"
```bash
autopm team load fullstack
# Reload Claude Code
```

#### "GitHub sync failed"
```bash
autopm config validate
# Check token permissions
```

#### "MCP server not responding"
```bash
autopm mcp diagnose
autopm mcp test context7
```

---

## 📖 Additional Resources

### Documentation Sites

- **GitHub Repository:** [rafeekpro/ClaudeAutoPM](https://github.com/rafeekpro/ClaudeAutoPM)
- **npm Package:** [claude-autopm](https://www.npmjs.com/package/claude-autopm)
- **Full Documentation:** [https://rafeekpro.github.io/ClaudeAutoPM/](https://rafeekpro.github.io/ClaudeAutoPM/)

### Community

- **[GitHub Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)** - Ask questions, share ideas
- **[Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)** - Report bugs, request features
- **[Twitter](https://twitter.com/rafeekpro)** - Follow for updates

### Video Tutorials

- [Installation & Setup](../README.md#-see-it-in-action)
- [First Claude Execution](../README.md#-see-it-in-action)
- [PRD Creation Workflow](../README.md#-see-it-in-action)
- [GitHub Integration](../README.md#-see-it-in-action)

---

## 🗺️ Documentation Roadmap

### Current Coverage

- ✅ Getting Started (Installation, Quick Start)
- ✅ Core Concepts (Architecture, Agents, Teams)
- ✅ Workflows (PRD to Production)
- ✅ CLI Reference (Overview, Commands)
- ⚠️ Integrations (In Progress)
- ⚠️ Advanced Topics (In Progress)
- ⚠️ Troubleshooting (In Progress)

### Coming Soon

- 📝 Video tutorials for each workflow
- 📝 Interactive playground
- 📝 More real-world examples
- 📝 Migration guides from other tools
- 📝 Performance benchmarks

---

## 📊 Documentation Statistics

```
Total Documents:     50+
Getting Started:     3 guides
Core Concepts:       5 guides
Workflows:           5 workflows
CLI Commands:        109 commands
AI Agents:           39 agents
Integrations:        5 platforms
Code Examples:       100+ snippets
```

---

## 🆕 What's New

### v1.20.1 (Latest)
- ✅ Fixed ~230+ deprecated agent references
- ✅ Updated all documentation to reflect agent consolidation
- ✅ Improved framework selection guides

### v1.20.0
- ✅ Package size optimization
- ✅ Comprehensive development standards
- ✅ Framework structure cleanup

[View Full Changelog](../CHANGELOG.md)

---

## 🎯 Quick Navigation

### By Role

**For Developers:**
- [Quick Start](getting-started/quick-start.md)
- [Development Cycle](workflows/development-cycle.md)
- [CLI Reference](cli-reference/overview.md)

**For Team Leads:**
- [Epic Management](workflows/epic-management.md)
- [Project Planning](workflows/prd-to-production.md)
- [Team Configuration](core-concepts/team-management.md)

**For DevOps:**
- [Deployment](workflows/deployment.md)
- [Docker Integration](integrations/docker.md)
- [K8s Integration](integrations/kubernetes.md)

**For Architects:**
- [Architecture](core-concepts/architecture.md)
- [Execution Strategies](core-concepts/execution-strategies.md)
- [Custom Workflows](advanced/custom-workflows.md)

### By Technology

**Python/FastAPI:**
- python-backend-engineer agent
- postgresql-expert agent
- [Python Workflow Example](workflows/python-fastapi-example.md)

**React/TypeScript:**
- react-frontend-engineer agent
- react-ui-expert agent
- [React Workflow Example](workflows/react-typescript-example.md)

**Docker/Kubernetes:**
- docker-containerization-expert agent
- kubernetes-orchestrator agent
- [Container Workflow](workflows/docker-kubernetes-workflow.md)

---

## 💡 Tips for Success

### 1. Start Small
```bash
# Begin with minimal preset
autopm install --preset minimal
# Learn the basics
# Gradually add features
```

### 2. Use the Right Tools
```bash
# CLI for deterministic tasks
autopm team load frontend

# Slash commands for AI tasks
/pm:epic-decompose prd-001.md
```

### 3. Leverage Agents
```
# Be specific
Use python-backend-engineer with framework=fastapi to...

# Provide context
Use react-frontend-engineer to build login form with:
- Email validation
- Password strength indicator
- Remember me checkbox
```

### 4. Keep Documentation Updated
```bash
# After each epic
/pm:epic-status epic-001.md

# Daily standups
/pm:standup

# Sprint reports
/pm:sprint-status
```

---

## 📞 Get Help

Need assistance?

1. **📚 Check the docs** - Most answers are here
2. **🔍 Search issues** - Someone may have asked before
3. **💬 Ask in Discussions** - Community support
4. **🐛 Report bugs** - Help us improve
5. **📧 Contact us** - For enterprise support

---

<p align="center">
  <strong>Ready to get started?</strong>
  <br>
  <a href="getting-started/installation.md">Install ClaudeAutoPM</a> •
  <a href="getting-started/quick-start.md">Quick Start Tutorial</a> •
  <a href="workflows/prd-to-production.md">Complete Workflow</a>
</p>

<p align="center">
  <sub>Built with ❤️ for the Claude Code community</sub>
</p>
