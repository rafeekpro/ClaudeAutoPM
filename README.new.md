# ClaudeAutoPM

[![NPM Version](https://img.shields.io/npm/v/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![MIT License](https://img.shields.io/badge/License-MIT-28a745)](https://github.com/rafeekpro/ClaudeAutoPM/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rafeekpro/ClaudeAutoPM?style=social)](https://github.com/rafeekpro/ClaudeAutoPM)

**AI-Powered Project Management Framework for Claude Code**

Transform your development workflow with intelligent automation, parallel AI agent execution, and seamless integration with GitHub and Azure DevOps. From PRD to production in hours, not days.

---

## 🎯 What is ClaudeAutoPM?

ClaudeAutoPM is a comprehensive project management and development automation framework designed specifically for [Claude Code](https://claude.ai/code). It combines:

- **109+ CLI commands** for deterministic operations (scaffolding, templates, automation)
- **39 specialized AI agents** for intelligent tasks (analysis, design, development)
- **Dynamic team management** with automatic agent switching
- **Hybrid execution modes** - choose between templates or AI assistance
- **Full GitHub & Azure DevOps integration** for seamless workflow

### The Problem We Solve

Traditional development workflows face:
- ❌ Context loss between planning and execution
- ❌ Blocking on sequential tasks
- ❌ Manual coordination of multiple developers
- ❌ Disconnect between PRDs, code, and production

### Our Solution

ClaudeAutoPM creates an **end-to-end automated pipeline**:

```
PRD → Epic Decomposition → Parallel Development → Testing → Production
  ↓         ↓                    ↓                   ↓          ↓
 AI      AI Agents          Multiple AI Agents    Automated   Auto-deploy
         Analyze            Work Simultaneously    Testing     with CI/CD
```

---

## ✨ Key Features

### 🤖 **39 Specialized AI Agents**

Organized into dynamic teams that load based on your work context:

- **Core Agents**: agent-manager, code-analyzer, file-analyzer, test-runner
- **Language Agents**: python-backend-engineer, nodejs-backend-engineer, javascript-frontend-engineer, bash-scripting-expert
- **Framework Agents**: react-frontend-engineer, react-ui-expert, tailwindcss-expert, e2e-test-engineer
- **Cloud Agents**: aws-cloud-architect, azure-cloud-architect, gcp-cloud-architect, kubernetes-orchestrator
- **DevOps Agents**: docker-containerization-expert, github-operations-specialist, terraform-infrastructure-expert
- **Data Agents**: postgresql-expert, mongodb-expert, redis-expert, bigquery-expert

### 🔄 **Hybrid Execution Model**

Choose the best approach for each task:

| Mode | When to Use | Example |
|------|-------------|---------|
| **Deterministic** | Scaffolding, templates, known patterns | `autopm install --preset fullstack` |
| **AI-Powered** | Analysis, design, complex decisions | `/pm:epic-decompose` |
| **Hybrid** | Flexible workflows | `autopm config` (CLI) or `/pm:config` (AI) |

### 🎭 **Dynamic Team Management**

Switch agent teams based on your current work:

```bash
autopm team load frontend    # React, UI, testing agents
autopm team load backend     # Python, Node.js, database agents
autopm team load fullstack   # Complete development stack
autopm team load devops      # Docker, Kubernetes, CI/CD agents
```

Teams automatically activate the right agents for your context.

### 🔌 **MCP (Model Context Protocol) Integration**

Access up-to-date documentation and tools:

```bash
autopm mcp enable context7       # Documentation for all frameworks
autopm mcp enable playwright     # Browser automation
autopm mcp diagnose              # Health check all MCP servers
```

### 📊 **Multi-Provider Support**

Seamlessly work with:
- **GitHub**: Issues, PRs, Actions, Projects
- **Azure DevOps**: Work Items, Boards, Pipelines, Repos
- **Local**: Git-based workflow without remote provider

### ⚡ **Parallel Execution Strategies**

Choose your execution model:

- **Sequential**: Safe, one agent at a time
- **Adaptive**: Intelligent mode selection (recommended)
- **Hybrid**: Maximum parallelization for power users

---

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g claude-autopm

# Verify installation
autopm --version
```

### 5-Minute Setup

```bash
# 1. Install in your project
cd your-project
autopm install

# 2. Choose your preset
# - minimal: Basic setup
# - docker-only: Docker development
# - fullstack: Complete stack (recommended)
# - devops: Full DevOps with K8s
# - custom: Advanced configuration

# 3. Configure your provider
autopm config set provider github
autopm config set github.owner YOUR_USERNAME
autopm config set github.repo YOUR_REPO
export GITHUB_TOKEN=your_github_token

# 4. Load your team
autopm team load fullstack

# 5. Open Claude Code
claude --dangerously-skip-permissions .
```

### Your First Workflow

```bash
# 1. Create a PRD (in Claude Code)
/pm:prd-new "Build user authentication system"

# 2. Decompose into epic
/pm:epic-decompose prd-001-authentication.md

# 3. Sync with GitHub
/pm:epic-sync epic-001-authentication.md

# 4. Start working
/pm:next-task

# 5. Complete and sync
/pm:issue-close
```

---

## 📚 Documentation

### Getting Started
- [Installation Guide](docs/getting-started/installation.md)
- [Quick Start Tutorial](docs/getting-started/quick-start.md)
- [Your First Project](docs/getting-started/first-project.md)

### Core Concepts
- [Architecture Overview](docs/core-concepts/architecture.md)
- [Hybrid Execution](docs/core-concepts/hybrid-execution.md)
- [Agent System](docs/core-concepts/agent-system.md)
- [Team Management](docs/core-concepts/team-management.md)

### Workflows
- [PRD to Production](docs/workflows/prd-to-production.md)
- [Epic Management](docs/workflows/epic-management.md)
- [Development Cycle](docs/workflows/development-cycle.md)

### Reference
- [CLI Commands](docs/cli-reference/overview.md)
- [Agent Registry](docs/agents/registry.md)
- [Configuration](docs/cli-reference/config.md)

---

## 🎬 See It In Action

### Video Walkthroughs

<details>
<summary><b>1️⃣ Installation & Setup</b> - Complete installation process</summary>
<br>
<img src="docs/assets/video-1.gif" width="100%" alt="Install AutoPM">
</details>

<details>
<summary><b>2️⃣ First Claude Execution</b> - Setting up and running Claude Code</summary>
<br>
<img src="docs/assets/video-2.gif" width="100%" alt="First Claude Execution">
</details>

<details>
<summary><b>3️⃣ PRD Creation</b> - Product Requirements workflow</summary>
<br>
<img src="docs/assets/video-3.gif" width="100%" alt="Create PRD">
</details>

<details>
<summary><b>4️⃣ GitHub Sync</b> - Synchronizing and starting work</summary>
<br>
<img src="docs/assets/video-4.gif" width="100%" alt="GitHub Sync">
</details>

<details>
<summary><b>5️⃣ Task Completion</b> - Finishing and closing tasks</summary>
<br>
<img src="docs/assets/video-5.gif" width="100%" alt="Issues Complete">
</details>

<details>
<summary><b>6️⃣ Demo Application</b> - Running Web App + FastAPI</summary>
<br>
<img src="docs/assets/video-6.gif" width="100%" alt="Web App and FastAPI">
</details>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ClaudeAutoPM                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ CLI Layer   │  │ Agent Teams  │  │ MCP Servers  │       │
│  │ (109 cmds)  │  │ (39 agents)  │  │ (Context7)   │       │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │                │
│         └─────────────────┼──────────────────┘                │
│                           │                                   │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │         Execution Engine                         │        │
│  │  - Sequential / Adaptive / Hybrid                │        │
│  │  - Parallel agent coordination                   │        │
│  │  - Context optimization                          │        │
│  └────────────────────────┬─────────────────────────┘        │
│                           │                                   │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │         Provider Integration                     │        │
│  │  - GitHub (Issues, PRs, Actions)                 │        │
│  │  - Azure DevOps (Work Items, Boards)             │        │
│  │  - Local (Git-based)                             │        │
│  └──────────────────────────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Use Cases

### For Solo Developers
- 🚀 Build MVPs faster with AI pair programming
- 📝 Maintain clear project documentation
- ⚡ Automate repetitive development tasks
- 🔄 Keep GitHub/Azure in sync automatically

### For Development Teams
- 👥 Coordinate multiple AI agents like a team
- 📊 Track progress across epics and sprints
- 🔀 Parallel development on independent tasks
- 📈 Maintain velocity with automated workflows

### For DevOps Engineers
- 🐳 Docker-first development patterns
- ☸️ Kubernetes deployment automation
- 🔧 Infrastructure as Code with Terraform
- 📦 CI/CD pipeline generation

---

## 🌟 Why ClaudeAutoPM?

### vs Traditional PM Tools
- ✅ **AI-native**: Built for Claude Code, not adapted
- ✅ **Code-first**: PRDs → Code → Production
- ✅ **Parallel execution**: Multiple agents work simultaneously
- ✅ **Context-aware**: Never lose track of your work

### vs Other AI Tools
- ✅ **Full workflow**: Not just code generation
- ✅ **Multi-agent**: 39 specialized agents, not one generic
- ✅ **Team coordination**: Dynamic team switching
- ✅ **Enterprise-ready**: GitHub & Azure DevOps integration

---

## 📦 What's Included

### CLI Commands (109 total)
- **Project Management**: PRD, Epic, Issue, Task management
- **Development**: Scaffolding, testing, deployment
- **Configuration**: Provider setup, team management, MCP servers
- **DevOps**: Docker, Kubernetes, CI/CD automation

### AI Agents (39 active)
- **Core**: 7 system agents
- **Languages**: 6 language agents
- **Frameworks**: 8 framework agents
- **Cloud**: 7 cloud & infrastructure agents
- **DevOps**: 6 DevOps & CI/CD agents
- **Data**: 5 database agents

### Documentation
- Installation guides
- Complete workflow tutorials
- CLI reference
- Agent documentation
- Integration guides

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/development/contributing.md) for:
- Development setup
- Coding standards
- Testing requirements
- Pull request process

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Documentation**: [https://rafeekpro.github.io/ClaudeAutoPM/](https://rafeekpro.github.io/ClaudeAutoPM/)
- **npm Package**: [https://www.npmjs.com/package/claude-autopm](https://www.npmjs.com/package/claude-autopm)
- **Issues**: [https://github.com/rafeekpro/ClaudeAutoPM/issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- **Discussions**: [https://github.com/rafeekpro/ClaudeAutoPM/discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)

---

## 💬 Support

- 📧 Email: autopm@example.com
- 🐦 Twitter: [@rafeekpro](https://twitter.com/rafeekpro)
- 💬 GitHub Discussions for questions and community support

---

<p align="center">
  <b>Built with ❤️ for the Claude Code community</b>
  <br>
  <sub>Star ⭐ this repo if ClaudeAutoPM helps your workflow!</sub>
</p>
