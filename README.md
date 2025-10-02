# ClaudeAutoPM

[![NPM Version](https://img.shields.io/npm/v/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![MIT License](https://img.shields.io/badge/License-MIT-28a745)](https://github.com/rafeekpro/ClaudeAutoPM/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rafeekpro/ClaudeAutoPM?style=social)](https://github.com/rafeekpro/ClaudeAutoPM)
&nbsp;
[![Follow on 𝕏](https://img.shields.io/badge/𝕏-@rafeekpro-1c9bf0)](http://x.com/intent/follow?screen_name=rafeekpro)

**Automated project management system to ship ~~faster~~ _better_ using spec-driven development and AI agents running in parallel**

Stop losing context. Stop blocking on tasks. Stop shipping bugs. ClaudeAutoPM transforms PRDs into epics, epics into issues, and issues into production code – with full traceability at every step.

## 📖 Documentation

Full documentation is available at: **[https://rafeekpro.github.io/ClaudeAutoPM/](https://rafeekpro.github.io/ClaudeAutoPM/)**

- 📚 [Complete Guide](https://rafeekpro.github.io/ClaudeAutoPM/guide/getting-started)
- 📝 [Command Reference](https://rafeekpro.github.io/ClaudeAutoPM/commands/overview)
- 🤖 [Agent Registry](https://rafeekpro.github.io/ClaudeAutoPM/agents/registry)
- 🔧 [Development Guide](https://rafeekpro.github.io/ClaudeAutoPM/development/docker-first)
- ⚙️ [Configuration](https://rafeekpro.github.io/ClaudeAutoPM/reference/configuration)

## 🎯 Key Features

### Hybrid Command System
ClaudeAutoPM uses a **hybrid approach** combining deterministic operations with AI-powered intelligence:

| Command Type | Implementation | Use Case | Example |
|-------------|---------------|----------|---------|
| **Deterministic** | JavaScript/Templates | Scaffolding, templates, automation | `autopm docker:create`, `autopm scaffold:api` |
| **AI-Powered** | Claude Code + Markdown | Analysis, brainstorming, decomposition | `/pm:prd-new`, `/pm:epic-decompose` |
| **Hybrid** | Both modes available | Flexible workflows | `pm:prd-new --template` or `/pm:prd-new` |

### Core Capabilities
- **96+ Professional CLI Commands** - Full yargs-based CLI with comprehensive PM commands
- **Hybrid Execution** - Choose between templates (deterministic) or AI assistance
- **AI Agent Integration** - Parallel execution with specialized agents (in Claude Code)
- **Dynamic Agent Teams** - Switch between specialized agent teams based on context (DevOps, Frontend, Backend, Fullstack)
- **Azure DevOps & GitHub** - Complete project management integration
- **Smart Context Management** - Never lose track of your work
- **Automated Workflows** - From PRD to production deployment

## 📺 Visual Walkthrough

See ClaudeAutoPM in action - from installation to deployment. **Click to expand each video:**

<details>
<summary><b>1️⃣ Install AutoPM</b> - Complete installation process</summary>
<br>
<img src="docs/assets/video-1.gif" width="100%" alt="Install AutoPM">
</details>

<details>
<summary><b>2️⃣ First Claude Execution</b> - Setting up and running Claude Code</summary>
<br>
<img src="docs/assets/video-2.gif" width="100%" alt="First Claude Execution">
</details>

<details>
<summary><b>3️⃣ Creation of PRD</b> - Product Requirements Document workflow</summary>
<br>
<img src="docs/assets/video-3.gif" width="100%" alt="Create PRD">
</details>

<details>
<summary><b>4️⃣ GitHub Sync and Start Working</b> - Synchronizing with GitHub and beginning tasks</summary>
<br>
<img src="docs/assets/video-4.gif" width="100%" alt="GitHub Sync">
</details>

<details>
<summary><b>5️⃣ Issues Finished</b> - Completing and closing tasks</summary>
<br>
<img src="docs/assets/video-5.gif" width="100%" alt="Issues Complete">
</details>

<details>
<summary><b>6️⃣ Checking the Work Done</b> - Running Web App + FastAPI demo</summary>
<br>
<img src="docs/assets/video-6.gif" width="100%" alt="Web App and FastAPI">
</details>

## 🚀 Get Started in 5 Minutes

### 🎯 Quick Start for New Users

```bash
npm install -g claude-autopm

# Run the interactive guide
autopm guide
```

The interactive guide will walk you through:
- ✅ System requirements verification
- 📦 Installation with preset selection
- ⚙️ Provider configuration (GitHub/Azure DevOps/Local)
- 🤖 Agent team management and automatic switching
- 📝 Creating your first PRD and project workflow
- 🆘 Troubleshooting and diagnostics
- 📚 Complete documentation and resources

### Manual Setup

#### 1. Install (30 seconds)

```bash
npm install -g claude-autopm
```

#### 2. Setup Your Project (2 minutes)

```bash
# Navigate to your project
cd your-project/

# Install ClaudeAutoPM framework
autopm install
```

During installation, you'll be asked to:

**1. Choose a configuration preset:**

| Preset | Requirements | Description | Best For |
|--------|--------------|-------------|----------|
| **Minimal** | None | Traditional development without containers | Small projects, beginners |
| **Docker-only** | Docker | Container-first with adaptive execution | Medium projects, local development |
| **Full DevOps** 🎯 | Docker + kubectl | Docker + Kubernetes with CI/CD | Production projects (RECOMMENDED) |
| **Performance** | Docker + kubectl | Maximum parallelization (8 agents) | Large projects, powerful machines |
| **Custom** | Varies | Configure each option manually | Specific requirements |

> 💡 **Note:** The installer automatically detects available tools (Docker, kubectl) and only shows compatible options. Missing tools? See installation links in the interactive prompt.

**2. Select your project management provider:**

| Provider | Integration | Use Case |
|----------|-------------|----------|
| **GitHub Issues** | Full GitHub API integration | Open source, startups |
| **Azure DevOps** | Azure Boards & Pipelines | Enterprise, Agile teams |
| **Skip for now** | Local files only | Evaluation, offline work |

#### 3. Update Existing Installation

```bash
# Update to latest framework version
autopm update

# Or force update with options
autopm update --force --no-backup
```

**Update features:**
- 🔄 **Smart Updates** - Preserves your configuration and project data
- 📦 **Automatic Backup** - Creates backup before updating (can be disabled)
- ⚙️ **Config Preservation** - Keeps your settings, teams, and provider config
- 📁 **Data Protection** - Preserves epics, PRDs, and all project files
- 🔧 **Version Detection** - Only updates when necessary

**Update options:**
- `--force` - Force update even if versions match
- `--no-backup` - Skip backup creation
- `--no-preserve-config` - Don't preserve configuration files

#### 4. Initialize PM System (1 minute)

```bash
# In Claude Code, run:
/pm:init

# Create your CLAUDE.md with repository info:
/init include rules from .claude/CLAUDE.md
```

#### 4.5 Provider Configuration (NEW)

```bash
# View current configuration
autopm config show

# Switch to Azure DevOps
autopm config set provider azure
autopm config set azure.organization your-org
autopm config set azure.project your-project
export AZURE_DEVOPS_PAT=your-token

# Switch to GitHub
autopm config set provider github
autopm config set github.owner your-username
autopm config set github.repo your-repo
export GITHUB_TOKEN=your-token

# Quick switch between providers
autopm config switch azure
autopm config switch github

# Validate configuration
autopm config validate
```

#### 4.6 Verify Installation & Configuration

After installation, verify that everything is properly configured:

```bash
# Comprehensive configuration check
autopm validate

# Shows:
# ✅ Essential Components (.claude directory, config, provider, git)
# ✅ Optional Components (MCP servers, git hooks, Node.js version)
# 📋 Next steps for incomplete setup
```

**Example Output:**
```
╔════════════════════════════════════════════════════════════════╗
║         🔍 ClaudeAutoPM Configuration Status                  ║
╚════════════════════════════════════════════════════════════════╝

Essential Components:
  ✅ .claude directory - Framework installed
  ✅ Configuration file - Provider: github
  ✅ Provider setup - GitHub (configured)
  ✅ Git repository - Initialized

Optional Components:
  ✅ MCP servers - 2 active (context7, github-mcp)
  ⚠️  Git hooks - Not installed (run: bash scripts/setup-hooks.sh)
  ✅ Node.js version - v20.10.0 (compatible)

Next Steps:
  1. Install git hooks: bash scripts/setup-hooks.sh
  2. Run MCP configuration check: autopm mcp check
```

#### 4. Ship Your First Feature (90 seconds)

##### Option A: Using Templates (Works Everywhere)
```bash
# Create PRD from template
autopm pm:prd-new user-auth --template

# Convert PRD to basic epic structure
autopm pm:prd-parse user-auth --basic

# Generate tasks from template
autopm pm:epic-decompose user-auth --template backend

# Push to GitHub/Azure DevOps
autopm pm:epic-sync user-auth
```

##### Option B: AI-Powered in Claude Code
```bash
# Create PRD through AI brainstorming
/pm:prd-new user-auth

# AI-powered PRD analysis and epic creation
/pm:prd-parse user-auth

# Intelligent task decomposition
/pm:epic-decompose user-auth

# Push to GitHub and start building
/pm:epic-sync user-auth
```

**That's it!** You're now using structured, spec-driven development with AI agents.

## 📋 Complete PM Workflow Guide

### Understanding the Process: PRD → Epic → Tasks

ClaudeAutoPM follows a structured workflow from requirements to implementation:

```
PRD (Product Requirements)
  ↓
Epic Split (Optional - for complex projects)
  ↓
Task Decomposition
  ↓
GitHub/Azure Sync
  ↓
Development & Tracking
```

### Quick Decision Guide

**When to use ONE epic (`/pm:epic-decompose`):**
- ✅ Simple feature (1-2 weeks)
- ✅ Single component (frontend OR backend)
- ✅ One developer
- ✅ Examples: "Add user profile page", "Create REST API endpoint"

**When to use MULTIPLE epics (`/pm:epic-split`):**
- ✅ Complex project (2+ months)
- ✅ Multiple components (frontend + backend + infrastructure)
- ✅ Multiple teams working in parallel
- ✅ Examples: "E-commerce platform", "Social media dashboard"

### Workflow Examples

<details>
<summary><b>Simple Feature Workflow</b> - Single epic, quick delivery</summary>

```bash
# 1. Create PRD
/pm:prd-new user-profile

# 2. Parse and analyze
/pm:prd-parse user-profile

# 3. Decompose into tasks (ONE epic)
/pm:epic-decompose user-profile
# Creates: .claude/epics/user-profile/
#   ├── epic.md
#   ├── 001.md  # Create profile component
#   ├── 002.md  # Add avatar upload
#   ├── 003.md  # Implement edit form
#   └── 004.md  # Add validation

# 4. Sync with GitHub/Azure
/pm:epic-sync user-profile

# 5. Start working
/pm:next                    # Get next task
/pm:issue-start #123        # Begin work
# ... development ...
/pm:issue-close #123        # Complete task
```
</details>

<details>
<summary><b>Complex Project Workflow</b> - Multiple epics, phased delivery</summary>

```bash
# 1. Create PRD
/pm:prd-new ecommerce-platform

# 2. Parse and analyze
/pm:prd-parse ecommerce-platform

# 3. Split into multiple epics (AUTOMATIC)
/pm:epic-split ecommerce-platform
# Automatically creates 6 epics:
#   Epic 1: Infrastructure (Docker, DB, Redis) - P0, 1w
#   Epic 2: Auth Backend (JWT, users, RBAC) - P0, 2w
#   Epic 3: Product API (catalog, orders) - P0, 3w
#   Epic 4: Frontend Foundation (React setup) - P0, 1w
#   Epic 5: E-commerce UI (pages, cart) - P1, 3w
#   Epic 6: Testing & Deployment (CI/CD) - P1, 1w

# 4. Decompose EACH epic into tasks
/pm:epic-decompose ecommerce-platform/01-infrastructure    # 12 tasks
/pm:epic-decompose ecommerce-platform/02-auth-backend      # 15 tasks
/pm:epic-decompose ecommerce-platform/03-product-api       # 20 tasks
/pm:epic-decompose ecommerce-platform/04-frontend          # 10 tasks
/pm:epic-decompose ecommerce-platform/05-ui                # 25 tasks
/pm:epic-decompose ecommerce-platform/06-testing           #  8 tasks
# TOTAL: ~90 tasks across 6 epics

# 5. Sync ALL epics at once
/pm:epic-sync ecommerce-platform

# 6. Parallel team work
/pm:next  # Team 1: Infrastructure (P0)
/pm:next  # Team 2: Auth Backend (P0, parallel)
/pm:next  # Team 3: Frontend Foundation (P0, parallel)
```
</details>

<details>
<summary><b>Multiple PRDs Workflow</b> - Independent features</summary>

```bash
# Create multiple independent features
/pm:prd-new login-page
/pm:prd-new payment-system
/pm:prd-new notifications

# Process each independently
/pm:prd-parse login-page
/pm:epic-decompose login-page      # 5 tasks
/pm:epic-sync login-page

/pm:prd-parse payment-system
/pm:epic-decompose payment-system  # 8 tasks
/pm:epic-sync payment-system

/pm:prd-parse notifications
/pm:epic-decompose notifications   # 4 tasks
/pm:epic-sync notifications

# /pm:next automatically picks highest priority across ALL epics
```
</details>

### Key Commands Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/pm:prd-new <name>` | Create PRD | Always start here |
| `/pm:prd-parse <name>` | Analyze PRD | After writing requirements |
| `/pm:epic-split <name>` | Create multiple epics | Complex, multi-component projects |
| `/pm:epic-decompose <name>` | Break into tasks | Always (once per epic) |
| `/pm:epic-sync <name>` | Sync with GitHub/Azure | After decomposition |
| `/pm:context` | Show current state | Check progress anytime |
| `/pm:next` | Get next task | Ready to work |
| `/pm:issue-start #N` | Start task | Before coding |
| `/pm:issue-close #N` | Complete task | After finishing |

### FAQ

**Q: Can I create multiple PRDs at once?**
A: Yes! Each PRD is independent. Create as many as you need.

**Q: How do I decide between epic-split and epic-decompose?**
A: Use epic-split for multi-component projects (frontend + backend + infra). Use epic-decompose for single-component features.

**Q: Do I need to decompose ALL epics after split?**
A: Yes, before syncing. But you can decompose them one at a time as needed.

**Q: How do I check my progress?**
A: Use `/pm:context` to see current project, epics, and task progress.

📖 **Full Workflow Guide:** See [PM-WORKFLOW-GUIDE.md](PM-WORKFLOW-GUIDE.md) for detailed examples and decision flows.

## 🎯 Core Workflow: Crawl → Walk → Run

### Crawl: Basic Commands
```bash
/pm:prd-new feature        # Create product requirements
/pm:epic-oneshot feature   # Plan, decompose, and sync to GitHub
/pm:issue-start 1234       # Start working on a task
/pm:next                   # Get next priority task
```

### Walk: Team Collaboration
```bash
/pm:status                 # Project dashboard
/pm:standup               # Daily standup report
/pm:issue-sync 1234       # Push progress to GitHub
/pm:blocked               # Show blocked tasks
```

### Run: Advanced Features
- **50+ Specialized AI Agents** - Python, React, K8s, AWS, and more
- **Parallel Execution** - Multiple agents working simultaneously
- **Cross-Platform** - GitHub, Azure DevOps, GitLab (coming soon)
- **MCP Integration** - Model Context Protocol for live documentation, codebase analysis, and tool integration
- **Agent Analysis** - Discover which agents use MCP and their configurations
- **Interactive Diagnostics** - Comprehensive health checks and connection testing

### 🤖 Dynamic Agent Teams

ClaudeAutoPM now supports **dynamic agent teams** that can be switched based on your current context:

```bash
# List available teams
autopm team list

# Load a specialized team
autopm team load devops        # CI/CD and infrastructure agents
autopm team load frontend      # React, JavaScript, UX agents
autopm team load python_backend # Python, FastAPI, Flask agents
autopm team load fullstack     # Combined frontend + backend

# Check current team
autopm team current
```

#### 🚀 Automatic Team Switching

ClaudeAutoPM can automatically switch teams based on your Git branch name!

**Setup (one-time):**
```bash
# Enable automatic team switching
bash scripts/setup-githooks.sh
```

**Branch Naming Convention:**
```bash
# Branch pattern: type/team/description
git checkout -b feature/devops/add-ci      # Auto-loads 'devops' team
git checkout -b fix/frontend/button-style  # Auto-loads 'frontend' team
git checkout -b feat/backend/new-api       # Auto-loads 'python_backend' team
```

**Available Teams:**
- **base** - Core agents for general tasks
- **devops** - Docker, Kubernetes, GitHub Operations, Terraform
- **frontend** - React, JavaScript, E2E testing, UX design
- **python_backend** - FastAPI, Flask, PostgreSQL, MongoDB
- **fullstack** - Inherits from both frontend and python_backend

Teams support inheritance, so specialized teams automatically include base agents. The active team configuration is saved in your project and persists across sessions.

## 🔌 MCP (Model Context Protocol) Management

ClaudeAutoPM provides comprehensive MCP management for agent-to-tool integration. **39 out of 53 agents (74%)** use MCP servers for live documentation and external tool access.

### 🆕 Dynamic Server Discovery & Installation

**NEW!** Discover and install MCP servers directly from npm registry:

```bash
# Search for MCP servers
autopm mcp search filesystem
autopm mcp search @modelcontextprotocol

# Browse official servers
autopm mcp browse --official

# Install directly from npm (auto-configures everything)
autopm mcp install @modelcontextprotocol/server-filesystem --enable

# Uninstall when done
autopm mcp uninstall filesystem
```

**Benefits:**
- 🔍 **Search thousands** of community MCP servers
- 📦 **One-command install** - npm package + auto-configuration
- 🔄 **Always up-to-date** - Install latest versions
- 🗑️ **Clean removal** - Uninstall server + npm package together

**Official MCP Registry**: https://registry.modelcontextprotocol.io

### Quick Start with MCP

```bash
# List all available MCP servers
autopm mcp list

# Check which agents use MCP
autopm mcp agents
🤖 Agents Using MCP

✅ react-frontend-engineer
   └─ context7

✅ python-backend-engineer
   └─ context7
   └─ sqlite-mcp

📊 Summary:
   Total agents: 53
   Using MCP: 39 (74%)

# Enable MCP servers
autopm mcp enable context7
autopm mcp enable github-mcp

# Configure API keys interactively
autopm mcp setup

# Sync configuration
autopm mcp sync
```

### MCP Commands

#### **🔍 Discovery & Installation (NEW!)**
```bash
autopm mcp search <query>         # Search npm registry for MCP servers
autopm mcp browse                 # Browse popular/official servers
autopm mcp browse --category db   # Browse by category
autopm mcp install <package>      # Install from npm + auto-configure
autopm mcp install <pkg> --enable # Install and enable immediately
autopm mcp uninstall <name>       # Remove server + npm package
autopm mcp uninstall <name> --keep-package  # Keep npm package
```

#### **🤖 Agent Analysis**
```bash
autopm mcp agents              # List agents using MCP
autopm mcp agents --by-server  # Group by MCP server
autopm mcp agent <name>        # Show agent MCP config
autopm mcp usage               # Usage statistics
autopm mcp tree                # Dependency tree
```

#### **⚙️ Configuration & Diagnostics**
```bash
autopm mcp check               # Quick configuration check
autopm mcp setup               # Interactive API key setup
autopm mcp diagnose            # Run full diagnostics
autopm mcp test <server>       # Test server connection
autopm mcp status              # Show servers status
```

#### **📦 Server Management**
```bash
autopm mcp list                # List installed servers
autopm mcp list --detailed     # List with full details
autopm mcp info <server>       # Server details
autopm mcp enable <server>     # Enable server
autopm mcp disable <server>    # Disable server
autopm mcp sync                # Sync configuration
autopm mcp validate            # Validate all servers
```

### MCP Server Types

- **Documentation** - `context7` for live framework documentation (React, Python, AWS, etc.)
- **Codebase** - `context7` for project analysis and navigation
- **GitHub** - `github-mcp` for repository operations
- **Databases** - `sqlite-mcp`, `postgresql-mcp`, `mongodb-mcp` for data operations
- **Browser** - `playwright-mcp` for E2E testing and automation

### Example: Setting Up Context7

```bash
# 1. Enable context7 documentation server
autopm mcp enable context7

# 2. Configure API key
cat > .claude/.env << EOF
CONTEXT7_API_KEY=your-api-key-here
CONTEXT7_WORKSPACE=your-workspace-id
EOF

# 3. Sync configuration
autopm mcp sync

# 4. Verify setup
autopm mcp diagnose

# 5. Test connection
autopm mcp test context7
```

### MCP Benefits

- ✅ **Live Documentation** - Agents access latest framework docs automatically
- ✅ **Codebase Context** - Deep understanding of your project structure
- ✅ **Tool Integration** - GitHub, databases, browsers, and more
- ✅ **No Hallucinations** - Real-time data instead of outdated training
- ✅ **Extensible** - Add custom MCP servers for your tools

📖 **Full MCP Setup Guide**: [`MCP_SETUP_GUIDE.md`](./MCP_SETUP_GUIDE.md)

## 📚 Full Documentation

For comprehensive guides, advanced features, and detailed configuration:

**👉 [Visit the ClaudeAutoPM Wiki](https://github.com/rafeekpro/ClaudeAutoPM/wiki)**

### CLI System (96 Commands)

ClaudeAutoPM features a professional CLI powered by **yargs** with 96 commands:

```bash
# View all commands
autopm --help

# Command categories:
# - Azure DevOps (39 commands)
# - Project Management (32 commands)
# - AI & Automation (2 commands)
# - Infrastructure & DevOps (7 commands)
# - Testing & Context (5 commands)
# - UI & Frontend (6 commands)
# - Utilities (5 commands)

# Examples:
autopm pm:init --type web
autopm azure:sprint-status
autopm context:create
```

### Latest Features (v1.12.x)

**v1.12.2 - Smart Installation & Command Fixes**
- **Smart Tool Detection** - Installer automatically detects Docker and kubectl availability
- **Intelligent Defaults** - Installation options filtered based on available tools
- **Command Format Fixes** - All PM scripts now use consistent `/pm:...` format
- **Version Tracking** - Update command now properly detects installed versions

**v1.9.x - Complete PM Command Suite**

17 new PM commands providing comprehensive project management capabilities:

#### **PRD & Epic Management**
```bash
# Create new Product Requirements Document
autopm pm:prd-new user-authentication --description "OAuth 2.0 integration"

# Parse PRD into executable epic with tasks
autopm pm:prd-parse user-authentication --overwrite

# Close completed epic
autopm pm:epic-close user-auth "All authentication features complete"
```

##### **Splitting Large PRDs into Multiple Epics**

For complex features, you can split a single PRD into multiple focused epics:

```bash
# 1. Create a comprehensive PRD
autopm pm:prd-new payment-system --template

# 2. Split into focused epics using AI analysis
/pm:prd-split payment-system

# This creates multiple epics from one PRD:
# ├─ payment-system-backend     (API, database, payment gateway integration)
# ├─ payment-system-frontend    (UI components, checkout flow)
# └─ payment-system-security    (PCI compliance, encryption, audit logging)

# 3. Work on each epic independently
/pm:epic-decompose payment-system-backend
/pm:epic-sync payment-system-backend

# 4. Track overall PRD progress
autopm pm:prd-status payment-system
# Shows:
#   Epic: payment-system-backend  [████████░░] 80% (8/10 tasks)
#   Epic: payment-system-frontend [████░░░░░░] 40% (4/10 tasks)
#   Epic: payment-system-security [░░░░░░░░░░]  0% (0/8 tasks)
#   Overall: 44% complete (12/28 tasks)
```

**When to split PRDs:**
- ✅ Feature requires multiple specialized teams (frontend, backend, DevOps)
- ✅ Different components have separate deployment timelines
- ✅ Epic would exceed 15-20 tasks (becomes hard to manage)
- ✅ Clear architectural boundaries exist (UI, API, infrastructure)

**Best practices:**
- 📝 Keep original PRD as the source of truth
- 🏷️ Use consistent naming: `<prd-name>-<component>`
- 🔗 Link epics back to parent PRD in description
- 📊 Track overall progress across all child epics
- 🎯 Each epic should be independently deployable when possible

#### **Issue Lifecycle**
```bash
# Start working on an issue
autopm pm:issue-start ISSUE-123

# Show issue details and progress
autopm pm:issue-show ISSUE-123

# Edit issue details
autopm pm:issue-edit ISSUE-123 --title "Updated: Fix authentication bug"

# Close completed issue
autopm pm:issue-close ISSUE-123 "Fixed OAuth redirect issue"
```

#### **Pull Request Workflow**
```bash
# Create PR with auto-generated description
autopm pm:pr-create "feat: implement OAuth authentication"

# List all open PRs
autopm pm:pr-list --status open

# Create draft PR for work in progress
autopm pm:pr-create "wip: user dashboard" --draft
```

#### **Context Management**
```bash
# Create development context for feature
autopm pm:context-create user-authentication

# Update context with current progress
autopm pm:context-update user-authentication

# Prime context for AI assistance
autopm pm:context-prime user-authentication
```

#### **Project Maintenance**
```bash
# Optimize project structure and reduce context size
autopm pm:optimize --apply

# Clean archived work and free up space
autopm pm:clean --archive-old

# Sync work state across team
autopm pm:sync --push-remote

# Create versioned release
autopm pm:release minor --tag "v1.2.0"
```

📖 [Full CLI Documentation](docs/wiki/CLI-YARGS-MIGRATION.md)

### Popular Topics
- [Configuration Options](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Configuration-Options)
- [Agent Registry (50+ agents)](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Agent-Registry)
- [Command Reference](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Command-Reference)
- [Docker & Kubernetes](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Docker-Kubernetes)
- [Azure DevOps Integration](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Azure-DevOps)

## 💡 What Makes This Different?

| Traditional Development | ClaudeAutoPM System |
|------------------------|----------------------|
| Context lost between sessions | **Persistent context** across all work |
| Serial task execution | **Parallel agents** on independent tasks |
| "Vibe coding" from memory | **Spec-driven** with full traceability |
| Progress hidden in branches | **Transparent audit trail** in GitHub |
| Manual task coordination | **Intelligent prioritization** with `/pm:next` |

## 🔑 Key Principles

1. **No Vibe Coding** - Every line traces back to a specification
2. **GitHub as Database** - Issues are the single source of truth
3. **Parallel by Default** - Multiple agents, maximum velocity
4. **Context Preservation** - Never lose project state again

## 🛠️ System Requirements

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git** (system installation)
- **Claude Code** or compatible AI assistant

## 🧪 Testing

### Running Tests

```bash
# Run all unit tests (default)
npm test

# Run Azure DevOps integration tests (requires Azure environment)
npm run test:azure:integration
```

### Test Separation

Tests are separated into unit and integration categories:
- **Unit tests** - Run without external dependencies (default)
- **Integration tests** - Require Azure DevOps environment variables:
  - `AZURE_DEVOPS_PAT` - Personal Access Token
  - `AZURE_DEVOPS_ORG` - Organization name
  - `AZURE_DEVOPS_PROJECT` - Project name

To run integration tests, set `AZURE_DEVOPS_INTEGRATION_TESTS=true` along with the required environment variables.

## 📊 Configuration Preset Details

### Feature Comparison

| Feature | Minimal | Docker-only | Full DevOps | Performance |
|---------|---------|-------------|-------------|-------------|
| **Docker Support** | ❌ | ✅ | ✅ | ✅ |
| **Kubernetes** | ❌ | ❌ | ✅ | ✅ |
| **Git Safety Hooks** | ❌ | ✅ | ✅ | ✅ |
| **CI/CD Simulation (TODO)** | ❌ | ✅ | ✅ | ✅ |
| **Max Parallel Agents** | 1 | 3 | 5 | 8 |
| **Execution Strategy** | Sequential | Adaptive | Adaptive | Hybrid |
| **Context Optimization (TODO)** | ❌ | ✅ | ✅ | ✅ |
| **Integration Tests** | ❌ | ❌ | ✅ | ✅ |
| **Learning Mode (TODO)** | ❌ | ❌ | ✅ | ❌ |

### Execution Strategies

- **Sequential**: Safe, one agent at a time, predictable
- **Adaptive**: Intelligent parallelization based on task complexity (learning mode planned)
- **Hybrid**: Maximum parallelization, fastest but requires monitoring

### When to Choose Each Preset

**Minimal**
- New to ClaudeAutoPM
- Small personal projects
- No Docker environment available
- Learning the system

**Docker-only**
- Medium-sized projects
- Local development focus
- Docker available but not Kubernetes
- Team of 2-10 developers

**Full DevOps** (Recommended)
- Production projects
- CI/CD pipelines required
- Enterprise environments
- Teams with DevOps practices
- Best balance of features and safety

**Performance**
- Large codebases (>100k LOC)
- Powerful development machines (16+ cores)
- Experienced teams
- When build speed is critical

### What Gets Installed

All presets install the same core files:
- `.claude/agents/` - AI agent definitions
- `.claude/commands/` - PM command library
- `.claude/rules/` - Development rules
- `.claude/scripts/` - Helper scripts
- `.claude/checklists/` - Development checklists
- `.claude/mcp/` - Model Context Protocol configs

Optional components (based on preset):
- Git hooks → `.git/hooks/` (Docker-only, Full DevOps, Performance)
- Docker configurations → `.claude/docker/` (all except Minimal)
- Kubernetes manifests → `.claude/k8s/` (Full DevOps, Performance)
- CI/CD templates → `.github/workflows/` or `.azure-pipelines/`

### Git Hooks Installation

Git hooks install in two phases:

1. **Automatic enablement** (based on preset):
   - Minimal: No hooks
   - Docker-only, Full DevOps, Performance: Hooks enabled

2. **User confirmation** (if enabled):
   ```
   Would you like to install git hooks for automated commit/push validation? (y/n)
   ```
   - Yes → Installs `pre-commit` and `pre-push` hooks
   - No → Skips, can install later with `.claude/scripts/setup-hooks.sh`

### Provider Integration Details

**GitHub Issues**
- Creates issues and PRs via GitHub API
- Syncs epics as GitHub milestones
- Requires: `GITHUB_TOKEN` with repo scope
- Commands: All `pm:*` plus `github:*` commands

**Azure DevOps** ✨ **NEW: Full 3-Level Hierarchy Support**
- **Epic → User Story → Task** hierarchy (full Azure DevOps model)
- Integrates with Azure Boards work items
- Automatic parent-child linking of work items
- Syncs with Azure Pipelines
- Requires: `AZURE_DEVOPS_PAT` with Work Items scope
- Commands: All `pm:*` plus `azure:*` commands

**Azure DevOps Workflow Example:**
```bash
# Configure for Azure DevOps
autopm config set provider azure
autopm config set azure.organization mycompany
autopm config set azure.project myproject

# Create and decompose PRD (creates Epic → User Stories → Tasks)
autopm pm:prd-new payment-gateway
autopm pm:epic-decompose payment-gateway  # Creates 3-level hierarchy

# Sync to Azure DevOps - creates linked work items
autopm pm:epic-sync payment-gateway
# ✅ Created Epic #1234 "Payment Gateway Integration"
# ✅ Created User Story #1235 "As a user, I want to pay with credit card"
#    ✅ Created Task #1236 "Implement Stripe API integration"
#    ✅ Created Task #1237 "Add payment form validation"
# ✅ Created User Story #1238 "As a user, I want to see payment history"
#    ✅ Created Task #1239 "Create payment history endpoint"
#    ✅ Created Task #1240 "Build payment history UI"

# Work items are automatically linked with parent-child relationships
# View in Azure Boards to see the full hierarchy visualization
```

**Skip for now**
- All data stored locally in `.claude/`
- No external synchronization
- Can migrate to provider later
- Perfect for evaluation or offline work

## 🌟 Support This Project

If ClaudeAutoPM helps your team ship better:

- ⭐ **[Star this repository](https://github.com/rafeekpro/ClaudeAutoPM)**
- 📦 **[Try on npm](https://www.npmjs.com/package/claude-autopm)**
- 🐦 **[Follow @rafeekpro on X](https://x.com/rafeekpro)**

---

**Built by developers who ship, for developers who ship.**

> Inspired by [CCPM](https://github.com/automazeio/ccpm) - Building upon the foundation of AI-powered project management.