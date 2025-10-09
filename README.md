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

### 🆕 **NEW in v1.29.0: Batch Operations, Filtering & Analytics!**

**Batch Operations** - Sync 1000+ items in seconds
- ⚡ **Parallel Processing** - 10 concurrent uploads (configurable)
- 🔄 **Smart Rate Limiting** - Auto-throttle to respect GitHub API limits
- 📊 **Progress Tracking** - Real-time progress bars
- 🛡️ **Error Recovery** - Continues on failures with detailed reporting

```bash
autopm sync:batch                    # Sync all items
autopm sync:batch --type prd         # Sync only PRDs
autopm sync:batch --dry-run          # Preview changes
```

**Advanced Filtering & Search** - Find anything instantly
- 🔍 **10 Filter Types** - status, priority, epic, dates, author, assignee, search
- 📝 **Full-Text Search** - Search across all markdown content
- 📅 **Date Ranges** - Filter by creation/update dates
- 🎯 **Combined Filters** - AND logic for precise results

```bash
autopm prd:list --status active --priority high
autopm search "authentication" --type prd,epic,task
```

**Analytics & Insights** - Data-driven project management
- 📈 **Velocity Tracking** - Tasks/week with trend analysis
- 📉 **Burndown Charts** - ASCII visualization (ideal vs actual)
- 👥 **Team Metrics** - Completion rates, average duration
- 🔗 **Dependency Analysis** - Bottlenecks, critical path, parallelizable tasks

```bash
autopm analytics:epic epic-001       # Full analytics with burndown
autopm analytics:team --period 30    # Team metrics (30 days)
autopm analytics:dependencies epic-001  # Find bottlenecks
autopm analytics:export epic-001 --format csv  # Export data
```

**Performance** - All targets exceeded ✅
- Batch sync: 1000 items in 28.5s
- Filtering: < 500ms for 1000 items
- Analytics: 230ms for 1000 tasks
- **497+ Tests Passing** (99.6% pass rate)

---

### 🎉 **v1.28.0: Templates & Scaffolding**

**PRD Templates (Quick Start)**
- 📋 **5 Built-in Templates** - api-feature, ui-feature, bug-fix, data-migration, documentation
- 🚀 **70% Faster** - Create PRDs in 9 minutes instead of 30
- 🎯 **Context7-Verified** - All templates use 2025 best practices

```bash
autopm prd:new --template api-feature "Payment API"
autopm template:list
```

---

### 🎉 **v1.27.0: Phase 2 Complete!**

**GitHub Sync (Bidirectional)**
- 📤 **Upload to GitHub Issues** - Sync PRDs/Epics/Tasks with smart conflict detection
- 📥 **Download from GitHub** - Pull Issues back to local files with reverse mapping
- 🔄 **Bidirectional Mapping** - Maintain consistency with `sync-map.json`

**Task Management**
- ✅ **Complete Task Lifecycle** - List, show, update tasks within epics
- 🔗 **Dependency Tracking** - Validate task dependencies automatically
- 📊 **Progress Auto-update** - Epic progress updates on task completion

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
/pm:next

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

## 🔧 Advanced Tools

### Epic Sync (JavaScript)

Complete epic synchronization workflow in one command:

```bash
# Full epic sync (create epic + tasks + update references)
node .claude/lib/commands/pm/epicSync.js sync fullstack/01-infrastructure

# Individual operations
node .claude/lib/commands/pm/epicSync.js create-epic fullstack/01-infrastructure
node .claude/lib/commands/pm/epicSync.js create-tasks fullstack/01-infrastructure 2
node .claude/lib/commands/pm/epicSync.js update-epic fullstack/01-infrastructure 2
```

**Features:**
- Creates GitHub epic issue with labels and stats
- Creates task issues for all tasks in epic
- Updates epic file with GitHub URLs
- Renames task files to match issue numbers
- Updates all cross-references automatically

### Issue Sync (JavaScript)

Synchronize local development progress with GitHub issues:

```bash
# Full sync workflow
node .claude/lib/commands/pm/issueSync.js sync 123 .claude/epics/auth/updates/123

# Mark task as complete
node .claude/lib/commands/pm/issueSync.js sync 456 ./updates --complete

# Dry run (preview without posting)
node .claude/lib/commands/pm/issueSync.js sync 789 ./updates --dry-run

# Individual operations
node .claude/lib/commands/pm/issueSync.js gather 123 ./updates
node .claude/lib/commands/pm/issueSync.js format 123 ./updates
```

**Features:**
- Gathers updates from multiple sources (progress, notes, commits)
- Formats professional GitHub comments
- Posts updates to issues
- Updates frontmatter with sync timestamps
- Preflight validation (auth, issue exists, etc.)
- Supports completion workflow

**What gets synced:**
- Progress updates and completion %
- Technical notes and decisions
- Recent commits (auto-detected or manual)
- Acceptance criteria updates
- Next steps and blockers

### Epic Status (JavaScript)

Track epic progress with detailed status reporting:

```bash
# Show epic status
node .claude/lib/commands/pm/epicStatus.js fullstack/01-infrastructure

# List available epics
node .claude/lib/commands/pm/epicStatus.js
```

**Features:**
- Counts tasks by status (completed/in-progress/pending)
- Calculates progress percentage
- Visual progress bar
- Sub-epic breakdown
- Comprehensive status reporting

**Example output:**
```
Epic: fullstack/01-infrastructure
==================================

Total tasks:     12
Completed:       8 (67%)
In Progress:     2
Pending:         2

Progress: [=================================-------------] 67%

Sub-Epic Breakdown:
-------------------
  backend                        6 tasks (4 completed)
  frontend                       4 tasks (3 completed)
  infrastructure                 2 tasks (1 completed)
```

### Why JavaScript Tools?

**Replaced 10 Bash scripts** (~2600 lines) with **3 JavaScript tools** (~1500 lines):

**Benefits:**
- ✅ Zero parsing errors (no heredoc/awk/sed complexity)
- 🧪 Fully testable (all functions exported)
- 📖 More readable and maintainable
- 🚀 50% less code
- 💾 Better error handling
- 🔍 Easier debugging

**Backward compatible:** Old Bash scripts still work, but new JS tools are recommended.

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
