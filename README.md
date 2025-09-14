# ClaudeAutoPM

[![NPM Version](https://img.shields.io/npm/v/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![MIT License](https://img.shields.io/badge/License-MIT-28a745)](https://github.com/rafeekpro/ClaudeAutoPM/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rafeekpro/ClaudeAutoPM?style=social)](https://github.com/rafeekpro/ClaudeAutoPM)
&nbsp;
[![Follow on 𝕏](https://img.shields.io/badge/𝕏-@rafeekpro-1c9bf0)](http://x.com/intent/follow?screen_name=rafeekpro)

## Automated project management system to ship ~~faster~~ _better_ using spec-driven development, GitHub issues, Git worktrees, and multiple AI agents running in parallel

> **Inspired by [CCPM (Claude Code Project Manager)](https://github.com/automazeio/ccpm)** - This project builds upon the foundational concepts of AI-powered project management to create a comprehensive development framework.

Stop losing context. Stop blocking on tasks. Stop shipping bugs. This battle-tested system turns PRDs into epics, epics into GitHub issues, and issues into production code – with full traceability at every step.

## Table of Contents

- [🚀 Installation](#-installation)
- [Background](#background)
- [The Workflow](#the-workflow)
- [What Makes This Different?](#what-makes-this-different)
- [⚙️ Configuration Options](#️-configuration-options)
- [🔧 Post-Installation Configuration Management](#-post-installation-configuration-management)
- [Why GitHub Issues?](#why-github-issues)
- [Core Principle: No Vibe Coding](#core-principle-no-vibe-coding)
- [🌟 Key Features](#-key-features)
- [System Architecture](#system-architecture)
- [Workflow Phases](#workflow-phases)
- [Command Reference](#command-reference)
- [The Parallel Execution System](#the-parallel-execution-system)
- [Proven Results](#proven-results)
- [Example Flow](#example-flow)
- [Local vs Remote](#local-vs-remote)
- [Technical Notes](#technical-notes)
- [Support This Project](#support-this-project)

## Background

Every team struggles with the same problems:

- **Context evaporates** between sessions, forcing constant re-discovery
- **Parallel work creates conflicts** when multiple developers touch the same code
- **Requirements drift** as verbal decisions override written specs
- **Progress becomes invisible** until the very end

This system solves all of that.

## 🤖 Self-Maintaining System

ClaudeAutoPM uses its own framework capabilities for self-maintenance:

```bash
# Check system health
pm health

# Optimize agent ecosystem
pm optimize

# Validate integrity
pm validate
```

See [Self-Maintenance Guide](docs/SELF-MAINTENANCE-GUIDE.md) for details.

## 📡 MCP Server Management

ClaudeAutoPM includes comprehensive MCP (Model Context Protocol) server management:

```bash
# List available MCP servers
autopm mcp list

# Enable servers in your project
autopm mcp enable context7-docs
autopm mcp enable github-mcp

# Sync configuration
autopm mcp sync
```

See [MCP Management Guide](docs/MCP-MANAGEMENT-GUIDE.md) for complete documentation.

## 🚀 Installation

### Global Installation (Recommended)

```bash
npm install -g claude-autopm
claude-autopm --help
```

### Quick Start Commands

```bash
# Install ClaudeAutoPM framework to current project
claude-autopm install

# Install to specific directory
claude-autopm install ./my-project

# Non-interactive installation with preset configuration
claude-autopm install --yes --config devops
claude-autopm install -y -c minimal --no-env --no-hooks

# Update existing ClaudeAutoPM installation
claude-autopm update

# Generate AI-powered CLAUDE.md merge prompts
claude-autopm merge

# Interactive .env configuration
claude-autopm setup-env

# Create new project with ClaudeAutoPM
claude-autopm init my-new-project
```

### Non-Interactive Installation

For CI/CD pipelines and automated setups, ClaudeAutoPM supports fully non-interactive installation:

```bash
# Minimal setup (sequential execution, no Docker/K8s)
claude-autopm install --yes --config minimal --no-env --no-hooks

# DevOps setup (Docker + Kubernetes enabled)
claude-autopm install -y -c devops

# Performance setup (hybrid parallel execution)
claude-autopm install --yes --config performance

# Docker-only setup
claude-autopm install -y -c docker --no-env
```

**Available Options:**
- `--yes, -y` - Auto-accept all prompts (non-interactive mode)
- `--config, -c` - Preset configuration: `minimal`, `docker`, `devops`, `performance`
- `--no-env` - Skip .env setup
- `--no-hooks` - Skip git hooks installation

### Alternative Installation Methods

#### Use without global installation

```bash
npx claude-autopm install
npx claude-autopm merge
```

#### Manual installation (legacy)

```bash
# Unix/Linux/macOS
curl -sSL https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | bash

# Windows PowerShell
iwr -useb https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | iex
```

### System Requirements

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git** (system installation)
- **Claude Code** or compatible AI coding assistant

### Package Information

- **Package**: `claude-autopm`
- **Current Version**: `1.0.0`
- **Registry**: <https://www.npmjs.com/package/claude-autopm>
- **Repository**: <https://github.com/rafeekpro/ClaudeAutoPM>

## The Workflow

```mermaid
graph LR
    A[PRD Creation] --> B[Epic Planning]
    B --> C[Task Decomposition]
    C --> D[GitHub Sync]
    D --> E[Parallel Execution]
```

### See It In Action (60 seconds)

```bash
# Create a comprehensive PRD through guided brainstorming
/pm:prd-new memory-system

# Transform PRD into a technical epic with task breakdown
/pm:prd-parse memory-system

# Push to GitHub and start parallel execution
/pm:epic-oneshot memory-system
/pm:issue-start 1235
```

## What Makes This Different?

| Traditional Development | ClaudeAutoPM System |
|------------------------|----------------------|
| Context lost between sessions | **Persistent context** across all work |
| Serial task execution | **Parallel agents** on independent tasks |
| "Vibe coding" from memory | **Spec-driven** with full traceability |
| Progress hidden in branches | **Transparent audit trail** in GitHub |
| Manual task coordination | **Intelligent prioritization** with `/pm:next` |

## ⚙️ Configuration Options

ClaudeAutoPM adapts to your development style with **3 distinct configurations**:

### 🏃 **Minimal Configuration**
**Traditional development workflow**
- Native tooling (npm, pip, local execution)
- Standard test runners and frameworks  
- No Docker/Kubernetes requirements
- Perfect for: Simple projects, rapid prototyping, learning

```bash
# Features disabled:
docker_first_development: false
kubernetes_devops_testing: false
github_actions_k8s: false
```

### 🐳 **Docker-Only Configuration**
**Container-first development**
- All code runs in Docker containers
- No local execution allowed
- Docker Compose orchestration
- Hot reload with volume mounts
- Perfect for: Team consistency, environment parity

```bash
# Features enabled:
docker_first_development: true
enforce_docker_tests: true
# Kubernetes disabled
kubernetes_devops_testing: false
```

### 🚀 **Full DevOps Configuration**  
**Enterprise-grade Docker + Kubernetes**
- Local development in Docker containers
- CI/CD testing in Kubernetes (KIND)
- Helm charts and security scanning
- GitHub Actions K8s integration
- Perfect for: Production deployments, enterprise teams

```bash
# All features enabled:
docker_first_development: true
kubernetes_devops_testing: true
github_actions_k8s: true
integration_tests: true
```

### 🔄 **Dynamic Configuration**

Switch between configurations anytime:

```bash
# Interactive configuration tool
autopm config

# During installation
autopm install  # Choose: 1) Minimal, 2) Docker-only, 3) Full DevOps

# Update preserves your settings
autopm update   # Keeps your current configuration
```

**🎯 Smart CLAUDE.md Generation**: Your `CLAUDE.md` file automatically adapts to match your chosen configuration, giving Claude the right development rules for your environment.

## 🔧 Post-Installation Configuration Management

ClaudeAutoPM provides comprehensive tools to manage your configuration after installation. **You can add, modify, or remove any configuration without reinstalling.**

### Quick Configuration Commands

| Task | Command | Description |
|------|---------|-------------|
| **Update .env** | `autopm setup-env` | Reconfigure API keys and tokens interactively |
| **Manage MCP** | `autopm mcp <cmd>` | Enable/disable MCP servers |
| **Toggle features** | `autopm config` | Switch Docker/K8s features |
| **Update framework** | `autopm update` | Update to latest version |
| **Merge configs** | `autopm merge` | AI-assisted config merging |

### Managing API Keys and Tokens

```bash
# Reconfigure .env at any time
autopm setup-env           # Current directory
autopm setup-env ~/project # Specific project

# Add services manually
echo "OPENAI_API_KEY=sk-xxxxx" >> .claude/.env
```

### MCP Server Management

```bash
# List available servers
autopm mcp list

# Enable/disable servers
autopm mcp enable github-mcp
autopm mcp disable context7-docs

# Sync configuration
autopm mcp sync
```

### Feature Configuration

```bash
# Interactive feature toggle
autopm config

# Switch configurations
# Options: minimal, docker-only, full-devops
```

📚 **Full documentation**: [Post-Installation Management Guide](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Post_Installation_Management)

---

## 🌟 Key Features

### 🤖 **50+ Specialized AI Agents**

**Language Experts:**

- **Python**: `python-backend-engineer` - FastAPI, SQLAlchemy, async development
- **JavaScript/TypeScript**: `javascript-frontend-engineer`, `nodejs-backend-engineer`
- **Bash**: `bash-scripting-expert` - System automation, CI/CD scripts

**Framework Specialists:**

- **React**: `react-frontend-engineer` - Modern React, TypeScript, Next.js
- **Backend APIs**: `fastapi-backend-engineer`, `flask-backend-engineer`
- **Testing**: `playwright-test-engineer`, `playwright-mcp-frontend-tester`

**UI Framework Agents:**

- **Material-UI**: `mui-react-expert` - Enterprise DataGrid, theming
- **Chakra UI**: `chakra-ui-expert` - Accessibility-first design systems
- **Ant Design**: `antd-react-expert` - Enterprise admin interfaces
- **Bootstrap**: `bootstrap-ui-expert` - Rapid prototyping
- **Tailwind CSS**: `tailwindcss-expert` - Custom design systems
- **UX Design**: `ux-design-expert` - User experience optimization

**Cloud & Infrastructure:**

- **AWS**: `aws-cloud-architect` - EKS, Lambda, CloudFormation
- **Azure**: `azure-cloud-architect` - AKS, Functions, ARM templates
- **GCP**: `gcp-cloud-architect` - GKE, Cloud Run, Terraform
- **Kubernetes**: `kubernetes-orchestrator` - Helm charts, GitOps
- **Terraform**: `terraform-infrastructure-expert` - Multi-cloud IaC

**DevOps & Operations:**

- **GitHub Actions**: `github-operations-specialist`
- **Azure DevOps**: `azure-devops-specialist` - Complete enterprise integration
- **Docker**: `docker-expert`, `docker-compose-expert`, `docker-development-orchestrator`
- **Proxy & Networking**: `traefik-proxy-expert`
- **SSH Management**: `ssh-operations-expert`

**Database Specialists:**

- **PostgreSQL**: `postgresql-expert` - Query optimization, migrations
- **MongoDB**: `mongodb-expert` - Document modeling, aggregations
- **Redis**: `redis-expert` - Caching, pub/sub, data structures
- **BigQuery**: `bigquery-expert` - Data warehousing, ML
- **Cosmos DB**: `cosmosdb-expert` - Multi-model, global distribution

**AI & Integration:**

- **OpenAI**: `openai-python-expert` - GPT models, embeddings, fine-tuning
- **Google Gemini**: `gemini-api-expert` - Multimodal AI, function calling
- **LangGraph**: `langgraph-workflow-expert` - AI workflow orchestration

**Data Engineering:**

- **Apache Airflow**: `airflow-orchestration-expert` - ETL/ELT pipelines
- **Kedro**: `kedro-pipeline-expert` - Reproducible data science
- **NATS**: `nats-messaging-expert` - High-performance messaging

**Core Utilities:**

- **file-analyzer** - Smart file and log analysis
- **code-analyzer** - Bug detection and logic tracing  
- **test-runner** - Comprehensive test execution with analysis
- **parallel-worker** - Multi-stream parallel execution coordinator

### 🔧 **Advanced Installation System**

- **Smart Detection** - Automatically detects existing vs fresh installations
- **Safe Updates** - Automatic backups with timestamps
- **File Change Detection** - Only updates modified files  
- **Cross-Platform** - Windows (Git Bash/WSL), macOS, Linux support
- **Error Recovery** - Graceful failures with rollback information

### 🤝 **CLAUDE.md Management**

- **Intelligent Merging** - AI-powered configuration combining
- **Conflict Resolution** - Preserves user customizations while adding framework updates
- **Migration Tools** - Automatic migration from CLAUDE_BASIC.md
- **Backup System** - Never lose your customizations

### 🌐 **MCP (Model Context Protocol) Integration**

- **Context7** - Documentation and codebase context management
- **Playwright MCP** - Browser automation and visual testing
- **GitHub MCP** - Repository operations and workflow management
- **Extensible** - Add custom MCP servers for team-specific integrations

### 📋 **Enterprise Azure DevOps Integration**

- **38+ Commands** - Complete project management suite
- **Bidirectional Sync** - GitHub ↔ Azure DevOps synchronization
- **User Stories** - PRD to User Story mapping with automatic task breakdown
- **Sprint Management** - Complete agile workflow with burndown tracking
- **Work Item Automation** - Automated task creation, assignment, and tracking

### 🛡️ **DevOps Troubleshooting Playbook**

- **Kubernetes Debugging** - Standard procedures for pod, service, and deployment issues
- **ConfigMap Size Limits** - Solutions for "ConfigMap too long" errors with Kaniko
- **Database Strategy** - Environment-specific database management patterns
- **Security Best Practices** - Secret management and incident response templates
- **Emergency Procedures** - Quick rollback and debugging commands

### ⚙️ **Development Quality Enforcement**

- **TDD Mandatory** - Test-Driven Development cycle enforcement
- **Code Quality Gates** - Automatic linting, formatting, and validation
- **Git Hooks** - Pre-commit and pre-push quality checks
- **Commit Safety** - Comprehensive commit checklist and validation
- **Performance Guidelines** - Built-in performance optimization patterns

## Why GitHub Issues?

Most AI-assisted workflows operate in isolation – a single developer working with AI in their local environment. This creates a fundamental problem: **AI-assisted development becomes a silo**.

By using GitHub Issues as our database, we unlock something powerful:

### 🤝 **True Team Collaboration**

- Multiple Claude instances can work on the same project simultaneously
- Human developers see AI progress in real-time through issue comments
- Team members can jump in anywhere – the context is always visible
- Managers get transparency without interrupting flow

### 🔄 **Seamless Human-AI Handoffs**

- AI can start a task, human can finish it (or vice versa)
- Progress updates are visible to everyone, not trapped in chat logs
- Code reviews happen naturally through PR comments
- No "what did the AI do?" meetings

### 📈 **Scalable Beyond Solo Work**

- Add team members without onboarding friction
- Multiple AI agents working in parallel on different issues
- Distributed teams stay synchronized automatically
- Works with existing GitHub workflows and tools

### 🎯 **Single Source of Truth**

- No separate databases or project management tools
- Issue state is the project state
- Comments are the audit trail
- Labels provide organization

This isn't just a project management system – it's a **collaboration protocol** that lets humans and AI agents work together at scale, using infrastructure your team already trusts.

## Core Principle: No Vibe Coding

> **Every line of code must trace back to a specification.**

We follow a strict 5-phase discipline:

1. **🧠 Brainstorm** - Think deeper than comfortable
2. **📝 Document** - Write specs that leave nothing to interpretation
3. **📐 Plan** - Architect with explicit technical decisions
4. **⚡ Execute** - Build exactly what was specified
5. **📊 Track** - Maintain transparent progress at every step

No shortcuts. No assumptions. No regrets.

## System Architecture

```bash
.claude/
├── CLAUDE.md          # Always-on instructions (copy content to your project's CLAUDE.md file)
├── agents/            # Task-oriented agents (for context preservation)
├── commands/          # Command definitions
│   ├── context/       # Create, update, and prime context
│   ├── pm/            # ← Project management commands (this system)
│   └── testing/       # Prime and execute tests (edit this)
├── context/           # Project-wide context files
├── epics/             # ← PM's local workspace (place in .gitignore)
│   └── [epic-name]/   # Epic and related tasks
│       ├── epic.md    # Implementation plan
│       ├── [#].md     # Individual task files
│       └── updates/   # Work-in-progress updates
├── prds/              # ← PM's PRD files
├── rules/             # Place any rule files you'd like to reference here
└── scripts/           # Place any script files you'd like to use here
```

## Workflow Phases

### 1. Product Planning Phase

```bash
/pm:prd-new feature-name
```

Launches comprehensive brainstorming to create a Product Requirements Document capturing vision, user stories, success criteria, and constraints.

**Output:** `.claude/prds/feature-name.md`

### 2. Implementation Planning Phase

```bash
/pm:prd-parse feature-name
```

Transforms PRD into a technical implementation plan with architectural decisions, technical approach, and dependency mapping.

**Output:** `.claude/epics/feature-name/epic.md`

### 3. Task Decomposition Phase

```bash
/pm:epic-decompose feature-name
```

Breaks epic into concrete, actionable tasks with acceptance criteria, effort estimates, and parallelization flags.

**Output:** `.claude/epics/feature-name/[task].md`

### 4. GitHub Synchronization

```bash
/pm:epic-sync feature-name
# Or for confident workflows:
/pm:epic-oneshot feature-name
```

Pushes epic and tasks to GitHub as issues with appropriate labels and relationships.

### 5. Execution Phase

```bash
/pm:issue-start 1234  # Launch specialized agent
/pm:issue-sync 1234   # Push progress updates
/pm:next             # Get next priority task
```

Specialized agents implement tasks while maintaining progress updates and an audit trail.

## Command Reference

> [!TIP]
> Type `/pm:help` for a concise command summary

### Initial Setup

- `/pm:init` - Install dependencies and configure GitHub

### PRD Commands

- `/pm:prd-new` - Launch brainstorming for new product requirement
- `/pm:prd-parse` - Convert PRD to implementation epic
- `/pm:prd-list` - List all PRDs
- `/pm:prd-edit` - Edit existing PRD
- `/pm:prd-status` - Show PRD implementation status

### Epic Commands

- `/pm:epic-decompose` - Break epic into task files
- `/pm:epic-sync` - Push epic and tasks to GitHub
- `/pm:epic-oneshot` - Decompose and sync in one command
- `/pm:epic-list` - List all epics
- `/pm:epic-show` - Display epic and its tasks
- `/pm:epic-close` - Mark epic as complete
- `/pm:epic-edit` - Edit epic details
- `/pm:epic-refresh` - Update epic progress from tasks

### Issue Commands

- `/pm:issue-show` - Display issue and sub-issues
- `/pm:issue-status` - Check issue status
- `/pm:issue-start` - Begin work with specialized agent
- `/pm:issue-sync` - Push updates to GitHub
- `/pm:issue-close` - Mark issue as complete
- `/pm:issue-reopen` - Reopen closed issue
- `/pm:issue-edit` - Edit issue details

### Workflow Commands

- `/pm:next` - Show next priority issue with epic context
- `/pm:status` - Overall project dashboard
- `/pm:standup` - Daily standup report
- `/pm:blocked` - Show blocked tasks
- `/pm:in-progress` - List work in progress

### Sync Commands

- `/pm:sync` - Full bidirectional sync with GitHub
- `/pm:import` - Import existing GitHub issues

### Maintenance Commands

- `/pm:validate` - Check system integrity
- `/pm:clean` - Archive completed work
- `/pm:search` - Search across all content

## Available Agents

The system includes 13 specialized agents that work together to handle different aspects of development:

### Core Analysis Agents

- **code-analyzer** - Bug hunting, logic tracing, and code analysis
- **file-analyzer** - Summarizing logs, configs, and verbose outputs
- **test-runner** - Running tests and analyzing results
- **parallel-worker** - Coordinating multiple parallel work streams

### Development Agents

- **python-backend-engineer** - FastAPI, SQLAlchemy, async Python development
- **react-frontend-engineer** - React, TypeScript, Next.js applications
- **playwright-test-engineer** - E2E testing with Playwright

### Infrastructure Agents

- **gcp-cloud-architect** - Google Cloud Platform infrastructure
- **azure-cloud-architect** - Microsoft Azure infrastructure
- **aws-cloud-architect** - Amazon Web Services infrastructure
- **kubernetes-orchestrator** - K8s deployments and GitOps

### DevOps Agents

- **github-operations-specialist** - GitHub Actions and CI/CD
- **azure-devops-specialist** - Azure DevOps integration
- **mcp-context-manager** - MCP server and context optimization

> All agent definitions are in `.claude/agents/` and are automatically loaded by ClaudeAutoPM.

## Available Commands

The system provides commands organized by category:

### Project Management (`/pm:*`)

Core workflow commands for PRDs, epics, and issues - see [Command Reference](#command-reference) above.

### Specialized Commands

- **Context**: `/context:create`, `/context:update` - Project documentation
- **Testing**: `/testing:prime`, `/testing:run` - Test framework management
- **React**: `/react:app-scaffold` - React application scaffolding
- **Python**: `/python:api-scaffold` - FastAPI project creation
- **Cloud**: `/cloud:infra-deploy` - Cloud infrastructure deployment
- **Kubernetes**: `/kubernetes:deploy` - K8s application deployment

> All command definitions are in `.claude/commands/` and are extensible.

## The Parallel Execution System

### Issues Aren't Atomic

Traditional thinking: One issue = One developer = One task

## Reality: One issue = Multiple parallel work streams

A single "Implement user authentication" issue isn't one task. It's...

- **Agent 1**: Database tables and migrations
- **Agent 2**: Service layer and business logic
- **Agent 3**: API endpoints and middleware
- **Agent 4**: UI components and forms
- **Agent 5**: Test suites and documentation

All running **simultaneously** in the same worktree.

### The Math of Velocity

**Traditional Approach:**

- Epic with 3 issues
- Sequential execution

**This System:**

- Same epic with 3 issues
- Each issue splits into ~4 parallel streams
- **12 agents working simultaneously**

We're not assigning agents to issues. We're **leveraging multiple agents** to ship faster.

### Context Optimization

**Traditional single-thread approach:**

- Main conversation carries ALL the implementation details
- Context window fills with database schemas, API code, UI components
- Eventually hits context limits and loses coherence

**Parallel agent approach:**

- Main thread stays clean and strategic
- Each agent handles its own context in isolation
- Implementation details never pollute the main conversation
- Main thread maintains oversight without drowning in code

Your main conversation becomes the conductor, not the orchestra.

### GitHub vs Local: Perfect Separation

**What GitHub Sees:**

- Clean, simple issues
- Progress updates
- Completion status

**What Actually Happens Locally:**

- Issue #1234 explodes into 5 parallel agents
- Agents coordinate through Git commits
- Complex orchestration hidden from view

GitHub doesn't need to know HOW the work got done – just that it IS done.

### The Command Flow

```bash
# Analyze what can be parallelized
/pm:issue-analyze 1234

# Launch the swarm
/pm:epic-start memory-system

# Watch the magic
# 12 agents working across 3 issues
# All in: ../epic-memory-system/

# One clean merge when done
/pm:epic-merge memory-system
```

## Key Features & Benefits

### 🧠 **Context Preservation**

Never lose project state again. Each epic maintains its own context, agents read from `.claude/context/`, and updates locally before syncing.

### ⚡ **Parallel Execution**

Ship faster with multiple agents working simultaneously. Tasks marked `parallel: true` enable conflict-free concurrent development.

### 🔗 **GitHub Native**

Works with tools your team already uses. Issues are the source of truth, comments provide history, and there is no dependency on the Projects API.

### 🤖 **Agent Specialization**

Right tool for every job. Different agents for UI, API, and database work. Each reads requirements and posts updates automatically.

### 📊 **Full Traceability**

Every decision is documented. PRD → Epic → Task → Issue → Code → Commit. Complete audit trail from idea to production.

### 🚀 **Developer Productivity**

Focus on building, not managing. Intelligent prioritization, automatic context loading, and incremental sync when ready.

## Proven Results

Teams using this system report:

- **89% less time** lost to context switching – you'll use `/compact` and `/clear` a LOT less
- **5-8 parallel tasks** vs 1 previously – editing/testing multiple files at the same time
- **75% reduction** in bug rates – due to the breaking down features into detailed tasks
- **Up to 3x faster** feature delivery – based on feature size and complexity

## Example Flow

```bash
# Start a new feature
/pm:prd-new memory-system

# Review and refine the PRD...

# Create implementation plan
/pm:prd-parse memory-system

# Review the epic...

# Break into tasks and push to GitHub
/pm:epic-oneshot memory-system
# Creates issues: #1234 (epic), #1235, #1236 (tasks)

# Start development on a task
/pm:issue-start 1235
# Agent begins work, maintains local progress

# Sync progress to GitHub
/pm:issue-sync 1235
# Updates posted as issue comments

# Check overall status
/pm:epic-show memory-system
```

## 📚 Documentation

### 📖 **Complete Wiki Available**
For comprehensive documentation, tutorials, and guides:

**👉 [Visit the ClaudeAutoPM Wiki](https://github.com/rafeekpro/ClaudeAutoPM/wiki)**

### 🎯 **Popular Wiki Pages**
- **[Quick Start Guide](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Quick-Start)** - Get running in 5 minutes
- **[Configuration Options](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Configuration-Options)** - Minimal, Docker-only, Full DevOps
- **[CLI Reference](https://github.com/rafeekpro/ClaudeAutoPM/wiki/CLI-Reference)** - Complete command documentation
- **[Agent Registry](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Agent-Registry)** - 50+ specialized AI agents
- **[Docker-First Development](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Docker-First-Development)** - Container workflows
- **[Kubernetes Integration](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Kubernetes-Integration)** - K8s testing & deployment

---

## Get Started Now

### Quick Setup (30 seconds)

#### Modern Installation (Recommended)

```bash
# Install globally via npm
npm install -g claude-autopm

# Navigate to your project
cd path/to/your/project/

# Install ClaudeAutoPM framework
claude-autopm install
```

#### Legacy Installation Methods

**Unix/Linux/macOS:**

```bash
cd path/to/your/project/
curl -sSL https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | bash
```

**Windows (PowerShell):**

```bash
cd path/to/your/project/
iwr -useb https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | iex
```

> 💡 **TIP**: The npm installation is faster, safer, and includes automatic updates. Legacy methods are provided for compatibility.

1. **Initialize the PM system**:

   ```bash
   /pm:init
   ```

   This command will:

   - Install GitHub CLI (if needed)
   - Authenticate with GitHub
   - Install [gh-sub-issue extension](https://github.com/yahsan2/gh-sub-issue) for proper parent-child relationships
   - Create required directories
   - Update .gitignore

2. **Create `CLAUDE.md`** with your repository information

   ```bash
   /init include rules from .claude/CLAUDE.md
   ```

   > If you already have a `CLAUDE.md` file, run: `/re-init` to update it with important rules from `.claude/CLAUDE.md`.

3. **Prime the system**:

   ```bash
   /context:create
   ```

### Start Your First Feature

```bash
/pm:prd-new your-feature-name
```

Watch as structured planning transforms into shipped code.

## Local vs Remote

| Operation | Local | GitHub |
|-----------|-------|--------|
| PRD Creation | ✅ | — |
| Implementation Planning | ✅ | — |
| Task Breakdown | ✅ | ✅ (sync) |
| Execution | ✅ | — |
| Status Updates | ✅ | ✅ (sync) |
| Final Deliverables | — | ✅ |

## Technical Notes

### GitHub Integration

- Uses **gh-sub-issue extension** for proper parent-child relationships
- Falls back to task lists if extension not installed
- Epic issues track sub-task completion automatically
- Labels provide additional organization (`epic:feature`, `task:feature`)

### File Naming Convention

- Tasks start as `001.md`, `002.md` during decomposition
- After GitHub sync, renamed to `{issue-id}.md` (e.g., `1234.md`)
- Makes it easy to navigate: issue #1234 = file `1234.md`

### Design Decisions

- Intentionally avoids GitHub Projects API complexity
- All commands operate on local files first for speed
- Synchronization with GitHub is explicit and controlled
- Worktrees provide clean git isolation for parallel work
- GitHub Projects can be added separately for visualization

## Contributing

### Development Workflow

ClaudeAutoPM uses a **hybrid development workflow** that supports both direct commits and pull requests:

#### Quick Contributions (Direct Commits)
For trusted contributors making small changes:
```bash
git checkout main
git pull origin main
# Make changes
npm test
git add .
git commit -m "fix: resolve issue"
git push origin main
```

#### Standard Contributions (Pull Requests)
For external contributors or major changes:
```bash
git checkout -b feat/new-feature
# Make changes
npm test
git add .
git commit -m "feat: add new feature"
git push origin feat/new-feature
# Open PR on GitHub
```

#### When to Use Each Method

| Change Type | Direct Commit | Pull Request |
|------------|--------------|--------------|
| Hotfix | ✅ Preferred | If complex |
| Documentation | ✅ Preferred | Optional |
| Minor feature | Allowed | ✅ Recommended |
| Major feature | ❌ | ✅ Required |
| Breaking change | ❌ | ✅ Required |
| External contributor | ❌ | ✅ Required |

See [.claude/rules/no-pr-workflow.md](autopm/.claude/rules/no-pr-workflow.md) for detailed guidelines.

---

## Support This Project

ClaudeAutoPM was developed by **Rafal Lagowski** for developers who ship, by developers who ship.

If ClaudeAutoPM helps your team ship better software:

- ⭐ **[Star this repository](https://github.com/rafeekpro/ClaudeAutoPM)** to show your support
- 📦 **[Try on npm](https://www.npmjs.com/package/claude-autopm)** - `npm install -g claude-autopm`
- 🐦 **[Follow @rafeekpro on X](https://x.com/rafeekpro)** for updates and tips

---

## Star History

## 📦 Package Stats

[![NPM Version](https://img.shields.io/npm/v/claude-autopm?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/claude-autopm)
[![GitHub Release Date](https://img.shields.io/github/release-date/rafeekpro/ClaudeAutoPM?style=for-the-badge&logo=github)](https://github.com/rafeekpro/ClaudeAutoPM/releases)

![Star History Chart](https://api.star-history.com/svg?repos=rafeekpro/ClaudeAutoPM)
