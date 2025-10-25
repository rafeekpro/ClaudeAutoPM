# ClaudeAutoPM

[![NPM Version](https://img.shields.io/npm/v/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![MIT License](https://img.shields.io/badge/License-MIT-28a745)](https://github.com/rafeekpro/ClaudeAutoPM/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rafeekpro/ClaudeAutoPM?style=social)](https://github.com/rafeekpro/ClaudeAutoPM)

**AI-Powered Development Framework for Claude Code**

Transform your development workflow with intelligent automation, modular plugin architecture, and scenario-based installation. From minimal setups to enterprise-grade DevOps, ClaudeAutoPM adapts to your needs.

---

## 🎯 What is ClaudeAutoPM?

ClaudeAutoPM is a **modular, plugin-based development framework** designed specifically for [Claude Code](https://claude.ai/code). It provides:

- **🔌 11+ Plugin System** - Modular architecture with scenario-based installation
- **🎭 145+ AI Agents & Commands** - Specialized agents organized by domain
- **🚀 Smart Installation** - 4 installation scenarios from minimal to full DevOps
- **📦 Auto-Plugin Installation** - Automatically installs plugins based on your scenario
- **🔄 Full Provider Integration** - GitHub & Azure DevOps synchronization
- **⚡ TDD-Developed** - 64+ tests with comprehensive coverage

### 🎉 **NEW in v2.8.2: Intelligent Scenario-Based Installation**

**Automatic Plugin Configuration** - Choose your scenario, plugins install automatically

ClaudeAutoPM now automatically installs the right plugins for your development needs:

**Installation Scenarios:**

```bash
1. Minimal (3 plugins)
   • Sequential execution, native tooling
   • Plugins: core, languages, pm
   • Best for: Learning, simple projects, debugging

2. Docker-only (6 plugins)
   • Adaptive execution with Docker
   • Plugins: core, languages, frameworks, testing, devops, pm
   • Best for: Modern web apps with containerization

3. Full DevOps (9 plugins) ⭐ RECOMMENDED
   • Adaptive execution with all cloud features
   • Plugins: core, languages, frameworks, testing, devops, cloud, databases, pm, ai
   • Best for: Production applications, cloud deployments

4. Performance (11 plugins)
   • Hybrid parallel execution with ALL capabilities
   • Plugins: ALL (core, languages, frameworks, testing, devops, cloud, databases, data, pm, ai, ml)
   • Best for: Data pipelines, ML workflows, power users
```

**What Happens During Installation:**

1. **Choose Your Scenario** - Select the installation that matches your needs
2. **Plugins Auto-Install** - System installs all plugins for that scenario
3. **Configuration Saved** - `.claude/config.json` records what was installed
4. **Agents Ready** - All agents from installed plugins are immediately available

**Installation Results:**

```bash
✓ Scenario: Full DevOps selected
✓ Installing 9 plugins...

  ✓ Core Framework (4 agents, 3 commands, 17 rules)
  ✓ Programming Languages (5 agents)
  ✓ Web Frameworks (6 agents, 1 command)
  ✓ Testing Tools (2 agents)
  ✓ DevOps & CI/CD (7 agents)
  ✓ Cloud Platforms (8 agents)
  ✓ Databases (5 agents)
  ✓ Project Management (87 commands)
  ✓ AI Integration (2 agents)

✅ Installation complete!
📋 Config saved to .claude/config.json
🎯 62 agents + 91 commands ready to use
```

**Configuration Persistence:**

The installer creates `.claude/config.json` with full installation details:

```json
{
  "version": "2.8.2",
  "installed": "2025-01-15T10:30:00.000Z",
  "execution_strategy": "adaptive",
  "plugins": [
    "plugin-core",
    "plugin-languages",
    "plugin-frameworks",
    "plugin-testing",
    "plugin-devops",
    "plugin-cloud",
    "plugin-databases",
    "plugin-pm",
    "plugin-ai"
  ],
  "installedPlugins": [
    {
      "name": "plugin-core",
      "displayName": "Core Framework",
      "agents": 4,
      "commands": 3,
      "rules": 17
    }
    // ... full details for all plugins
  ]
}
```

---

## ✨ Key Features

### 🔌 Modular Plugin Architecture

**11 Official Plugins** - Mix and match capabilities:

| Plugin | Agents | Commands | Description |
|--------|--------|----------|-------------|
| **@claudeautopm/plugin-core** | 4 | 3 | Framework essentials (agent-manager, code-analyzer, test-runner) |
| **@claudeautopm/plugin-pm** | 0 | 87 | Complete PM workflow (epics, tasks, Azure DevOps, GitHub) |
| **@claudeautopm/plugin-languages** | 5 | 0 | Programming languages (JavaScript, TypeScript, Python, Node.js, Bash) |
| **@claudeautopm/plugin-frameworks** | 6 | 1 | Web frameworks (React, Vue, Tailwind CSS, UX Design) |
| **@claudeautopm/plugin-testing** | 2 | 0 | Testing tools (E2E, frontend testing, accessibility) |
| **@claudeautopm/plugin-devops** | 7 | 0 | DevOps & CI/CD (Docker, GitHub Actions, SSH, observability) |
| **@claudeautopm/plugin-cloud** | 8 | 0 | Cloud platforms (AWS, Azure, GCP, Kubernetes, Terraform) |
| **@claudeautopm/plugin-databases** | 5 | 0 | Databases (PostgreSQL, MongoDB, Redis, BigQuery, Cosmos DB) |
| **@claudeautopm/plugin-data** | 3 | 0 | Data pipelines (Airflow, Kedro, message queues) |
| **@claudeautopm/plugin-ai** | 2 | 0 | AI integration (OpenAI, Gemini) |
| **@claudeautopm/plugin-ml** | 15 | 0 | Machine Learning (scikit-learn, PyTorch, TensorFlow, MLOps) |

**Total Available:** 62+ specialized agents, 91 commands

### 📦 Scenario-Based Installation (v2.8.2)

**Smart Installation** - Automatically installs plugins based on your development needs:

- **Minimal (3 plugins)** - Core, Languages, PM - Perfect for learning
- **Docker-only (6 plugins)** - Adds Frameworks, Testing, DevOps - Modern web development
- **Full DevOps (9 plugins)** ⭐ - Adds Cloud, Databases, AI - Production-ready (RECOMMENDED)
- **Performance (11 plugins)** - ALL plugins including Data & ML - Maximum capability

### 🤖 Intelligent Agent System

**145+ AI Agents & Commands** organized by domain:

- **Core Framework** (4 agents) - agent-manager, code-analyzer, test-runner, file-analyzer
- **Programming Languages** (5 agents) - JavaScript, TypeScript, Python, Node.js, Bash experts
- **Web Frameworks** (6 agents) - React, Vue, Tailwind, UX design, E2E testing
- **DevOps & CI/CD** (7 agents) - Docker, GitHub Actions, Azure DevOps, SSH, observability
- **Cloud Platforms** (8 agents) - AWS, Azure, GCP, Kubernetes, Terraform specialists
- **Databases** (5 agents) - PostgreSQL, MongoDB, Redis, BigQuery, Cosmos DB
- **Data Engineering** (3 agents) - Airflow, Kedro, LangGraph, message queues
- **AI Integration** (2 agents) - OpenAI, Gemini API experts
- **Machine Learning** (15 agents) - scikit-learn, PyTorch, TensorFlow, MLOps, AutoML
- **Project Management** (87 commands) - Complete PM workflow suite

### 🔄 Complete GitHub Integration

**Full Bidirectional GitHub Sync** - Seamless integration with GitHub Issues:

```bash
# Issue Synchronization
autopm issue sync <number>              # Bidirectional sync
autopm issue sync <number> --push       # Push local → GitHub
autopm issue sync <number> --pull       # Pull GitHub → local
autopm issue sync-status <number>       # Check sync status
autopm issue sync-resolve <number>      # Resolve conflicts
  --strategy newest|local|remote
```

**Features:**
- Smart conflict detection with multiple resolution strategies
- Sync mapping in `.claude/sync-map.json`
- Epic support (epics → GitHub issues with checkboxes)
- Rate limiting with exponential backoff
- Real API testing with 99% test coverage

### 📋 Complete CLI Command Suite (v2.7.0)

**24 PM Commands** - Full project management workflow:

```bash
# Issue Management (6 commands)
autopm issue show <number>            # Display issue details
autopm issue start <number>           # Start working on issue
autopm issue close <number>           # Close completed issue
autopm issue status <number>          # Check issue status
autopm issue edit <number>            # Edit issue in editor
autopm issue sync <number>            # Sync with provider

# Workflow Commands (6 commands)
autopm pm next                        # Get next priority task
autopm pm what-next                   # AI-powered suggestions
autopm pm standup                     # Generate daily standup
autopm pm status                      # Project status overview
autopm pm in-progress                 # Show active tasks
autopm pm blocked                     # List blocked tasks

# Context Management (4 commands)
autopm context create <type>          # Create context from template
autopm context prime                  # Generate project snapshot
autopm context update <type>          # Update existing context
autopm context show [type]            # Show or list contexts

# Project Utilities (6 commands)
autopm pm init                        # Initialize PM structure
autopm pm validate                    # Validate project (--fix for repair)
autopm pm sync                        # Sync with provider
autopm pm clean                       # Clean stale artifacts
autopm pm search <query>              # Search entities (BM25)
autopm pm import <source>             # Import from external sources
```

### ⚡ Execution Strategies

**Adaptive by Default** - Choose your execution model:

- **Sequential** - Safe, one agent at a time (minimal scenario)
- **Adaptive** - Intelligent mode selection (docker-only, full-devops)
- **Hybrid** - Maximum parallelization (performance scenario)

### 📊 Multi-Provider Support

Seamlessly work with:
- **GitHub** - Issues, PRs, Actions, Projects
- **Azure DevOps** - Work Items, Boards, Pipelines, Repos
- **Local** - Git-based workflow without remote provider

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

# 2. Choose your scenario (interactive menu)
#    → Minimal (3 plugins) - Learning
#    → Docker-only (6 plugins) - Modern web
#    → Full DevOps (9 plugins) - Production ⭐ RECOMMENDED
#    → Performance (11 plugins) - Data/ML workflows
#    → Custom - Advanced configuration

# 3. Plugins install automatically based on scenario
#    System installs all agents, commands, rules for your scenario

# 4. Configure your provider (optional)
autopm config set provider github
autopm config set github.owner YOUR_USERNAME
autopm config set github.repo YOUR_REPO

# Add your token to .claude/.env (recommended) or export directly
echo "GITHUB_TOKEN=your_github_token" >> .claude/.env

# 5. Verify configuration
autopm config validate

# 6. Open Claude Code
claude --dangerously-skip-permissions .
```

### What You Get After Installation

**Configuration File** (`.claude/config.json`):
```json
{
  "version": "2.8.2",
  "execution_strategy": "adaptive",
  "plugins": ["plugin-core", "plugin-languages", ...],
  "installedPlugins": [
    {
      "name": "plugin-core",
      "agents": 4,
      "commands": 3,
      "rules": 17
    }
    // ... details for all installed plugins
  ]
}
```

**Installed Resources**:
- `.claude/agents/` - All agents from installed plugins
- `.claude/commands/` - All commands from installed plugins
- `.claude/rules/` - Framework rules and guidelines
- `.claude/hooks/` - Enforcement hooks (TDD, Context7)
- `.claude/scripts/` - Utility scripts

### Your First Workflow

**Option A: Using CLI Commands (v2.7.0+)**

```bash
# 1. Initialize project structure
autopm pm init

# 2. Create PRD (in Claude Code or manually)
/pm:prd-new "Build user authentication system"

# 3. Decompose into epic
/pm:epic-decompose prd-001-authentication.md

# 4. Check what to do next
autopm pm what-next

# 5. Start working on next task
autopm pm next
autopm issue start 123

# 6. Generate daily standup
autopm pm standup

# 7. Complete and close issue
autopm issue close 123

# 8. Sync with provider
autopm pm sync
```

**Option B: Classic Claude Code Workflow**

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

## 🏗️ Architecture

### Plugin-Based Architecture (v2.8.2)

```
┌─────────────────────────────────────────────────────────────┐
│                     ClaudeAutoPM v2.8.2                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Scenario-Based Installer                  │    │
│  │  • Minimal (3 plugins)                              │    │
│  │  • Docker-only (6 plugins)                          │    │
│  │  • Full DevOps (9 plugins) ⭐                       │    │
│  │  • Performance (11 plugins)                         │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────┴────────────────────────────────┐    │
│  │           Plugin System (11 plugins)               │    │
│  │  • Core Framework (agents, commands, rules)        │    │
│  │  • Domain Plugins (specialized agents)             │    │
│  │  • Auto-discovery & installation                   │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────┴────────────────────────────────┐    │
│  │         Agent Teams (145+ agents/commands)         │    │
│  │  • Dynamic team loading                            │    │
│  │  • Context7-driven documentation                   │    │
│  │  • Parallel execution support                      │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────┴────────────────────────────────┐    │
│  │         Execution Engine                           │    │
│  │  • Sequential / Adaptive / Hybrid                  │    │
│  │  • Parallel agent coordination                     │    │
│  │  • Context optimization                            │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────┴────────────────────────────────┐    │
│  │         Provider Integration                       │    │
│  │  • GitHub (Issues, PRs, Actions)                   │    │
│  │  • Azure DevOps (Work Items, Boards)               │    │
│  │  • Local (Git-based)                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Installation Flow

```
User runs: autopm install
         ↓
Choose Scenario (1-4)
         ↓
System determines plugin list
         ↓
For each plugin:
  ├─ Copy agents → .claude/agents/<category>/
  ├─ Copy commands → .claude/commands/
  ├─ Copy rules → .claude/rules/
  ├─ Copy hooks → .claude/hooks/
  └─ Copy scripts → scripts/
         ↓
Create .claude/config.json
  ├─ List installed plugins
  ├─ Record installation details
  └─ Save execution strategy
         ↓
✅ Installation Complete!
```

### Plugin Discovery

**Installation Time** (v2.8.2):
- Direct file system access to `packages/` directory
- Reads `plugin.json` metadata
- Copies resources to `.claude/` directories
- No npm packages required

**Runtime** (future versions):
- PluginManager discovers plugins in `node_modules/@claudeautopm/`
- Supports lazy loading and hot reloading
- Dynamic plugin enable/disable

---

## 📚 Documentation

### Getting Started
- [Installation Guide](docs/getting-started/installation.md) - Detailed installation instructions
- [Scenario Selection Guide](docs/getting-started/scenarios.md) - Choose the right scenario
- [Quick Start Tutorial](docs/getting-started/quick-start.md) - First steps
- [Your First Project](docs/getting-started/first-project.md) - Complete walkthrough

### Core Concepts
- [Plugin Architecture](docs/core-concepts/plugin-architecture.md) - How plugins work
- [Agent System](docs/core-concepts/agent-system.md) - Understanding agents
- [Execution Strategies](docs/core-concepts/execution-strategies.md) - Sequential vs Adaptive vs Hybrid
- [CLI vs Claude Code](docs/CLI-vs-CLAUDE-CODE.md) ⭐ **Essential reading**

### Plugin Guides
- [Plugin System Overview](docs/plugins/overview.md) - Complete plugin documentation
- [Core Framework Plugin](docs/plugins/core.md) - Framework essentials
- [PM Plugin](docs/plugins/pm.md) - Project management commands
- [Cloud Plugins](docs/plugins/cloud.md) - AWS, Azure, GCP
- [Data & ML Plugins](docs/plugins/data-ml.md) - Data pipelines and ML workflows

### Workflows
- [PRD to Production](docs/workflows/prd-to-production.md) - Complete development cycle
- [Epic Management](docs/workflows/epic-management.md) - Managing epics and tasks
- [GitHub Integration](docs/workflows/github-integration.md) - Sync with GitHub

### Reference
- [CLI Commands](docs/cli-reference/overview.md) - Complete command reference
- [Agent Registry](docs/agents/registry.md) - All available agents
- [Configuration](docs/cli-reference/config.md) - Configuration options
- [Migration Guide](docs/migration/v2.8-upgrade.md) - Upgrading from older versions

---

## 🛠️ Use Cases

### For Solo Developers
- 🚀 **Quick Setup** - Minimal scenario gets you started in 5 minutes
- 📝 **Organized Projects** - Clear structure with PRDs, epics, and tasks
- ⚡ **Progressive Enhancement** - Start minimal, add plugins as needed
- 🔄 **GitHub Integration** - Keep issues in sync automatically

### For Development Teams
- 👥 **Team Coordination** - Dynamic agent teams for different roles
- 📊 **Progress Tracking** - Track progress across epics and sprints
- 🔀 **Parallel Development** - Multiple agents work simultaneously
- 📈 **Velocity Metrics** - Maintain velocity with automated workflows

### For DevOps Engineers
- 🐳 **Full DevOps Scenario** - Docker, Kubernetes, cloud platforms
- ☸️ **Infrastructure as Code** - Terraform, CloudFormation, ARM templates
- 🔧 **CI/CD Integration** - GitHub Actions, Azure Pipelines
- 📦 **Multi-Cloud Support** - AWS, Azure, GCP specialists

### For Data Engineers
- 📊 **Performance Scenario** - All data and ML capabilities
- 🔄 **Pipeline Orchestration** - Airflow, Kedro, LangGraph
- 💾 **Data Storage** - PostgreSQL, MongoDB, BigQuery
- 🤖 **ML Workflows** - scikit-learn, PyTorch, TensorFlow, MLOps

---

## 🌟 Why ClaudeAutoPM?

### vs Traditional PM Tools
- ✅ **AI-native** - Built for Claude Code, not adapted
- ✅ **Modular** - Install only what you need
- ✅ **Code-first** - PRDs → Code → Production
- ✅ **Scenario-based** - Automatic plugin installation

### vs Other AI Tools
- ✅ **Full workflow** - Not just code generation
- ✅ **Multi-agent** - 145+ specialized agents, not one generic
- ✅ **Plugin architecture** - Mix and match capabilities
- ✅ **Enterprise-ready** - GitHub & Azure DevOps integration

### vs Building Your Own
- ✅ **Proven patterns** - 2+ years of refinement
- ✅ **TDD-developed** - 64+ tests with comprehensive coverage
- ✅ **Active development** - Regular updates and improvements
- ✅ **Community support** - Growing ecosystem and documentation

---

## 📊 Project Stats

### Plugin System
- **11+ plugins** - Modular architecture
- **62+ agents** - Specialized AI experts
- **91 commands** - Complete PM workflow
- **4 scenarios** - From minimal to full DevOps

### Quality Metrics
- **64+ tests** - Comprehensive test coverage
- **TDD methodology** - Test-driven development
- **Context7 integration** - Up-to-date documentation
- **Production-ready** - Used in real projects

### Development Activity
- **Active maintenance** - Regular updates
- **npm published** - Easy global installation
- **GitHub integration** - Full bidirectional sync
- **Azure DevOps support** - Complete work item management

---

## 🔄 Execution Strategies

### Sequential (Minimal Scenario)
- **Safety First** - One agent at a time
- **Predictable** - Easy to debug
- **Resource Light** - Minimal system resources
- **Best For** - Learning, debugging, simple projects

### Adaptive (Docker-only & Full DevOps)
- **Intelligent** - Automatic mode selection
- **Balanced** - Performance + safety
- **Context-Aware** - Adapts to task complexity
- **Best For** - Most production projects ⭐ RECOMMENDED

### Hybrid (Performance Scenario)
- **Maximum Speed** - Parallel agent execution
- **Resource Intensive** - Uses all available cores
- **Advanced** - Requires understanding of dependencies
- **Best For** - Data pipelines, ML workflows, power users

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/development/contributing.md) for:
- Development setup
- Plugin development guide
- Coding standards
- Testing requirements
- Pull request process

### Building Plugins

Want to create your own plugin? See [Plugin Development Guide](docs/development/plugin-development.md).

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

## 📋 Version History

### v2.8.2 (2025-01-15) - Scenario-Based Installation
- ✨ Automatic plugin installation based on scenarios
- 🎯 4 installation presets (minimal, docker-only, full-devops, performance)
- 📦 Configuration persistence in `.claude/config.json`
- 🔍 Installation results tracking
- 📚 Comprehensive documentation update

### v2.8.1 (2025-01-10) - Plugin Architecture
- 🔌 Modular plugin system with 11 official plugins
- 📦 npm workspaces for plugin organization
- 🏗️ Context7-driven architecture
- 🔍 Smart plugin discovery

### v2.8.0 (2025-01-05) - GitHub Integration
- 🔄 Full bidirectional GitHub sync
- ✅ Issue sync with conflict detection
- 📦 Epic sync with task checkboxes
- 🎯 99% test coverage

### v2.7.0 (2024-12-20) - CLI Commands Complete
- 📋 24 PM commands implemented
- ⚡ 168 tests, 91.4% coverage
- 🎨 Modern UX with progress spinners
- 🧪 TDD methodology throughout

For complete version history, see [CHANGELOG.md](CHANGELOG.md).

---

<p align="center">
  <b>Built with ❤️ for the Claude Code community</b>
  <br>
  <sub>Star ⭐ this repo if ClaudeAutoPM helps your workflow!</sub>
</p>
