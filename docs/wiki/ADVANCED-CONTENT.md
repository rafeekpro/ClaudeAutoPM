# Advanced ClaudeAutoPM Documentation

> This document contains advanced content moved from the main README to keep it focused on quick starts.

## Table of Contents

- [Unified Provider Architecture](#unified-provider-architecture)
- [Self-Maintaining System](#self-maintaining-system)
- [MCP Server Management](#mcp-server-management)
- [Alternative Installation Methods](#alternative-installation-methods)
- [Detailed Configuration Options](#detailed-configuration-options)
- [Post-Installation Configuration Management](#post-installation-configuration-management)
- [Full Agent Registry](#full-agent-registry)
- [System Architecture](#system-architecture)
- [Workflow Phases](#workflow-phases)
- [Full Command Reference](#full-command-reference)
- [The Parallel Execution System](#the-parallel-execution-system)
- [Git Strategy](#git-strategy)
- [Azure DevOps Integration](#azure-devops-integration)
- [Local vs Remote](#local-vs-remote)
- [Technical Notes](#technical-notes)
- [Contributing Guidelines](#contributing-guidelines)

## Unified Provider Architecture

ClaudeAutoPM implements a **provider-agnostic command interface** that seamlessly works across different project management platforms:

**✅ Supported Providers:**
- **GitHub** - Issues, Projects, Pull Requests, Actions
- **Azure DevOps** - Work Items, Boards, Repos, Pipelines
- **GitLab** *(coming soon)* - Issues, Epics, Merge Requests
- **Jira** *(planned)* - Issues, Epics, Boards

**✨ Key Features:**
- **Unified Commands** - Same `/pm:` commands work across all providers
- **Automatic Routing** - Commands are automatically routed to your configured provider
- **Provider Switching** - Easy switching between platforms without changing workflow
- **Feature Parity** - Core functionality works consistently across providers
- **Provider Extensions** - Access provider-specific features when needed

All commands use the same syntax regardless of provider:
```bash
/pm:issue:show 123      # Works with GitHub Issues or Azure Work Items
/pm:epic:list           # Works with GitHub Milestones or Azure Epics
/pm:pr:create           # Works with GitHub PRs or Azure DevOps PRs
```

## Self-Maintaining System

ClaudeAutoPM uses its own framework capabilities for self-maintenance, now fully implemented in Node.js for cross-platform compatibility:

```bash
# Check system health
npm run pm:health
# or: node scripts/self-maintenance.js health

# Optimize agent ecosystem
npm run pm:optimize
# or: node scripts/self-maintenance.js optimize

# Validate integrity
npm run pm:validate
# or: node scripts/self-maintenance.js validate

# Display metrics
npm run pm:metrics

# Test installation scenarios
npm run pm:test-install

# Prepare release
npm run pm:release
```

**Key improvements:**
- **Cross-platform** - Works on Windows, macOS, and Linux
- **Performance optimized** - Parallel operations and efficient parsing
- **Enhanced testing** - Comprehensive scenario testing
- **Better error handling** - Detailed error messages and recovery

## MCP Server Management

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

## Alternative Installation Methods

### Use without global installation

```bash
npx autopm install
npx autopm merge
```

### Manual installation (legacy)

```bash
# Unix/Linux/macOS
curl -sSL https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | bash

# Windows PowerShell
iwr -useb https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | iex
```

### Non-Interactive Installation

For CI/CD pipelines and automated setups:

```bash
# Minimal setup (sequential execution, no Docker/K8s)
autopm install --yes --config minimal --no-env --no-hooks

# DevOps setup (Docker + Kubernetes enabled)
autopm install -y -c devops

# Performance setup (hybrid parallel execution)
autopm install --yes --config performance

# Docker-only setup
autopm install -y -c docker --no-env
```

**Available Options:**
- `--yes, -y` - Auto-accept all prompts (non-interactive mode)
- `--config, -c` - Preset configuration: `minimal`, `docker`, `performance`
- `--no-env` - Skip .env setup
- `--no-hooks` - Skip git hooks installation

## Detailed Configuration Options

### Platform Selection

```bash
# During installation, you'll be asked:
Choose your project management platform:
  1) 📙 GitHub (Issues, Projects, Pull Requests)
  2) 🔷 Azure DevOps (Work Items, Boards, Repos)
```

You can also switch providers after installation:
```bash
# In your .claude/config.json
"projectManagement": {
  "provider": "azure",  // or "github"
  "settings": {
    "azure": {
      "organization": "your-org",
      "project": "your-project"
    }
  }
}
```

### Execution Strategies

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

## Post-Installation Configuration Management

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

## Full Agent Registry

### Language Experts

- **Python**: `python-backend-engineer` - FastAPI, SQLAlchemy, async development
- **JavaScript/TypeScript**: `javascript-frontend-engineer`, `nodejs-backend-engineer`
- **Bash**: `bash-scripting-expert` - System automation, CI/CD scripts

### Framework Specialists

- **React**: `react-frontend-engineer` - Modern React, TypeScript, Next.js
- **Backend APIs**: `fastapi-backend-engineer`, `flask-backend-engineer`
- **Testing**: `playwright-test-engineer`, `playwright-mcp-frontend-tester`

### UI Framework Agents

- **Material-UI**: `mui-react-expert` - Enterprise DataGrid, theming
- **Chakra UI**: `chakra-ui-expert` - Accessibility-first design systems
- **Ant Design**: `antd-react-expert` - Enterprise admin interfaces
- **Bootstrap**: `bootstrap-ui-expert` - Rapid prototyping
- **Tailwind CSS**: `tailwindcss-expert` - Custom design systems
- **UX Design**: `ux-design-expert` - User experience optimization

### Cloud & Infrastructure

- **AWS**: `aws-cloud-architect` - EKS, Lambda, CloudFormation
- **Azure**: `azure-cloud-architect` - AKS, Functions, ARM templates
- **GCP**: `gcp-cloud-architect` - GKE, Cloud Run, Terraform
- **Kubernetes**: `kubernetes-orchestrator` - Helm charts, GitOps
- **Terraform**: `terraform-infrastructure-expert` - Multi-cloud IaC

### DevOps & Operations

- **GitHub Actions**: `github-operations-specialist`
- **Azure DevOps**: `azure-devops-specialist` - Complete enterprise integration
- **Docker**: `docker-expert`, `docker-compose-expert`, `docker-development-orchestrator`
- **Proxy & Networking**: `traefik-proxy-expert`
- **SSH Management**: `ssh-operations-expert`

### Database Specialists

- **PostgreSQL**: `postgresql-expert` - Query optimization, migrations
- **MongoDB**: `mongodb-expert` - Document modeling, aggregations
- **Redis**: `redis-expert` - Caching, pub/sub, data structures
- **BigQuery**: `bigquery-expert` - Data warehousing, ML
- **Cosmos DB**: `cosmosdb-expert` - Multi-model, global distribution

### AI & Integration

- **OpenAI**: `openai-python-expert` - GPT models, embeddings, fine-tuning
- **Google Gemini**: `gemini-api-expert` - Multimodal AI, function calling
- **LangGraph**: `langgraph-workflow-expert` - AI workflow orchestration

### Data Engineering

- **Apache Airflow**: `airflow-orchestration-expert` - ETL/ELT pipelines
- **Kedro**: `kedro-pipeline-expert` - Reproducible data science
- **NATS**: `nats-messaging-expert` - High-performance messaging

### Core Utilities

- **file-analyzer** - Smart file and log analysis
- **code-analyzer** - Bug detection and logic tracing
- **test-runner** - Comprehensive test execution with analysis
- **parallel-worker** - Multi-stream parallel execution coordinator

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

## Full Command Reference

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

### Issue/Work Item Commands
- `/pm:issue:show <id>` - Display issue details
- `/pm:issue:list` - List all issues with filters
- `/pm:issue:create` - Create new issue
- `/pm:issue:start <id>` - Begin work with branch
- `/pm:issue:close <id>` - Mark issue as complete
- `/pm:issue:edit <id>` - Edit issue details
- `/pm:issue:assign <id> <user>` - Assign to user
- `/pm:issue:comment <id>` - Add comment

### Workflow Commands
- `/pm:next` - Show next priority issue
- `/pm:status` - Overall project dashboard
- `/pm:standup` - Daily standup report
- `/pm:blocked` - Show blocked tasks
- `/pm:in-progress` - List work in progress

### Sync Commands
- `/pm:sync` - Full bidirectional sync
- `/pm:import` - Import existing GitHub issues

### Maintenance Commands
- `/pm:validate` - Check system integrity
- `/pm:clean` - Archive completed work
- `/pm:search` - Search across all content

## The Parallel Execution System

### Issues Aren't Atomic

Traditional thinking: One issue = One developer = One task

Reality: One issue = Multiple parallel work streams

A single "Implement user authentication" issue isn't one task. It's:

- **Agent 1**: Database tables and migrations
- **Agent 2**: Service layer and business logic
- **Agent 3**: API endpoints and middleware
- **Agent 4**: UI components and forms
- **Agent 5**: Test suites and documentation

All running **simultaneously** in the same branch with proper coordination.

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

## Git Strategy

### 🌿 **Unified Branch-Based Workflow**

ClaudeAutoPM uses a **single, consistent Git strategy** based on branches:

- **NO WORKTREES**: Simple branch-based development only
- **One branch per epic**: Clean isolation of work
- **Parallel agent coordination**: Multiple agents work in the same branch
- **Automatic conflict prevention**: Agents coordinate file access
- **Pull before push**: Always sync before committing

See the full Git strategy guide: `autopm/.claude/rules/git-strategy.md`

## Azure DevOps Integration

ClaudeAutoPM fully supports Azure DevOps with its rich work item hierarchy:

- **Work Item Types**: Epic → Feature → User Story → Task → Bug
- **Agile Metrics**: Story points, velocity tracking, sprint burndown
- **Rich Fields**: Acceptance criteria, test plans, effort estimation
- **Sprint Planning**: Iteration paths, capacity planning, velocity charts

### Azure DevOps Setup

```bash
# During installation, choose Azure DevOps:
autopm install

# Set your Personal Access Token:
export AZURE_DEVOPS_TOKEN="your-personal-access-token"

# Your config will include:
{
  "provider": {
    "type": "azure",
    "config": {
      "organization": "your-org",
      "project": "your-project",
      "team": "your-team"
    }
  }
}
```

### Unified Commands Work Everywhere

The same commands work regardless of your chosen platform:

```bash
/issue:show 123        # Shows GitHub Issue OR Azure Work Item
/issue:list --open     # Lists from GitHub OR Azure DevOps
/epic:start auth       # Creates branch and starts work
/project:status        # Dashboard from either platform
```

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
- Branches provide clean git isolation for parallel work
- GitHub Projects can be added separately for visualization

## Contributing Guidelines

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

## Proven Results

Teams using this system report:

- **89% less time** lost to context switching
- **5-8 parallel tasks** vs 1 previously
- **75% reduction** in bug rates
- **Up to 3x faster** feature delivery

## Package Information

- **Package**: `claude-autopm`
- **Current Version**: `1.0.0`
- **Registry**: <https://www.npmjs.com/package/claude-autopm>
- **Repository**: <https://github.com/rafeekpro/ClaudeAutoPM>