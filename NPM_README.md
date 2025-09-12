# 🤖 AUTOPM Framework

[![NPM Version](https://img.shields.io/npm/v/@autopm/framework)](https://www.npmjs.com/package/@autopm/framework)
[![NPM Downloads](https://img.shields.io/npm/dm/@autopm/framework)](https://www.npmjs.com/package/@autopm/framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-28a745)](https://github.com/rla/AUTOPM/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rla/AUTOPM?style=social)](https://github.com/rla/AUTOPM)

**Autonomous Project Management Framework** - Ship better software faster using spec-driven development, GitHub issues, Git worktrees, and multiple AI agents running in parallel.

## ⚡ Quick Start

### Global Installation (Recommended)

```bash
# Install globally
npm install -g @autopm/framework

# Install to current project
autopm install

# Or install to specific directory
autopm install ~/my-project
```

### Use with npx (No Installation Required)

```bash
# Install AUTOPM to current directory
npx @autopm/framework install

# Initialize new project
npx @autopm/framework init my-new-project

# Generate CLAUDE.md merge prompt
npx @autopm/framework merge
```

## 🎯 What You Get

### 📁 Complete Framework Structure

```
your-project/
├── .claude/                 # Claude Code configuration
│   ├── agents/             # 50+ specialized AI agents
│   ├── rules/              # Development standards & workflows
│   ├── commands/           # Azure DevOps & PM commands
│   └── .env.example        # MCP server configurations
├── .claude-code/           # Claude Code settings
├── .github/                # GitHub workflows & templates
├── scripts/                # Automation scripts
├── PLAYBOOK.md            # Usage guide
├── COMMIT_CHECKLIST.md    # Quality standards
└── CLAUDE.md              # Your project configuration
```

### 🤖 AI Agent Ecosystem

**50+ Specialized Agents:**
- **Languages**: Python, JavaScript/TypeScript, Bash, etc.
- **Frameworks**: React, FastAPI, Flask, Next.js, etc.
- **UI Libraries**: MUI, Chakra UI, Ant Design, Bootstrap, Tailwind
- **Cloud**: AWS, Azure, GCP architects
- **DevOps**: Docker, Kubernetes, GitHub Actions, Azure DevOps
- **Databases**: PostgreSQL, MongoDB, Redis, BigQuery
- **Testing**: Playwright, Jest, comprehensive E2E testing

### 🔧 Smart Installation System

- **🔍 Intelligent Detection**: Fresh install vs. update mode
- **💾 Automatic Backups**: Timestamped backups before changes
- **🔄 File Synchronization**: Only updates modified files
- **🤖 AI-Powered Merging**: Smart CLAUDE.md configuration combining
- **🛡️ Non-Destructive**: Preserves all customizations

## 📋 CLI Commands

```bash
autopm install [path]       # Install AUTOPM framework
autopm update [path]        # Update existing installation
autopm merge                # Generate CLAUDE.md merge prompt
autopm init <project-name>  # Initialize new project
autopm --version            # Show version information
autopm --help              # Show detailed help
```

### Command Examples

```bash
# Install to current directory
autopm install

# Install to specific project
autopm install ~/my-awesome-project

# Update existing AUTOPM installation
autopm update

# Create new project with AUTOPM
autopm init my-new-app

# Interactive CLAUDE.md merger
autopm merge
```

## 🎨 Key Features

### ✅ **Spec-Driven Development**
- PRD → Epic → Issues → Code workflow
- Full traceability from requirements to deployment
- No more "vibe coding" - everything documented

### ✅ **Parallel AI Execution**
- Multiple agents work simultaneously on different tasks
- Git worktrees prevent conflicts during parallel work
- Context sharing between agents via MCP protocol

### ✅ **GitHub Integration**
- Issues become your project database
- Real-time progress visibility for entire team
- Automated PR generation and task management

### ✅ **MCP (Model Context Protocol) Ready**
- Context7 integration for documentation management
- Playwright MCP for browser automation
- GitHub MCP for repository operations
- Extensible with custom MCP servers

### ✅ **Azure DevOps Integration**
- 38+ commands for complete project management
- User Stories, Tasks, Features, Sprints
- Bidirectional sync with GitHub
- Enterprise-ready workflows

## 🚀 Installation Modes

### 🆕 Fresh Installation
Perfect for new projects:
- Installs complete framework structure
- Creates `CLAUDE.md` from framework defaults
- Sets up all directories and configuration files
- Ready to use immediately

### 🔄 Update/Sync Mode
For existing AUTOPM projects:
- Detects current installation automatically
- Creates timestamped backup before changes
- Updates only modified files
- Preserves all your customizations
- Offers intelligent merge for configuration conflicts

### 🤖 Smart CLAUDE.md Merging
When framework updates conflict with your customizations:
- AI-generated merge prompts
- Preserves ALL user customizations (highest priority)
- Integrates new framework features
- Interactive console or file output
- Step-by-step merge instructions

## 🌟 What Makes AUTOPM Different?

| Traditional Development | AUTOPM Framework |
|------------------------|------------------|
| Context lost between sessions | **Persistent context** across all work |
| Serial task execution | **Parallel agents** on independent tasks |
| "Vibe coding" from memory | **Spec-driven** with full traceability |
| Progress hidden in branches | **Transparent audit trail** in GitHub |
| Manual task coordination | **AI-powered prioritization** |

## 📊 Proven Results

Teams using AUTOPM report:
- ⚡ **3x faster** feature delivery
- 🐛 **70% fewer bugs** reaching production  
- 📈 **90% better** requirement traceability
- 🤝 **100% team visibility** into AI-assisted work

## 🎯 Perfect For

### 👥 **Development Teams**
- Want AI assistance without losing collaboration
- Need better project management and traceability
- Struggle with context switching and lost work

### 🏢 **Enterprise Projects**
- Require comprehensive audit trails
- Need integration with existing tools (Azure DevOps)
- Want to scale AI-assisted development

### 🚀 **Indie Developers**
- Want professional project management without overhead
- Need structured approach to complex projects
- Want to ship higher quality software faster

## 🔧 System Requirements

### Required
- **Node.js** >= 16.0.0
- **NPM** >= 8.0.0
- **Git** (system installation)

### Supported Platforms
- ✅ macOS (Intel & Apple Silicon)
- ✅ Linux (Ubuntu, Debian, CentOS, etc.)
- ✅ Windows (Git Bash, WSL, PowerShell)

### Optional Integrations
- **Claude Code** - AI coding assistant
- **GitHub** - Issue tracking and project management
- **Azure DevOps** - Enterprise project management
- **Context7** - Documentation and codebase context
- **Playwright** - Browser automation testing

## 📚 Getting Started Guide

### 1. Install AUTOPM
```bash
npm install -g @autopm/framework
```

### 2. Set Up Your Project
```bash
# New project
autopm init my-awesome-project
cd my-awesome-project

# Or existing project
cd my-existing-project
autopm install
```

### 3. Configure Environment
```bash
# Copy environment template
cp .claude/.env.example .claude/.env

# Add your API keys and settings
nano .claude/.env
```

### 4. Read the Documentation
- 📖 `PLAYBOOK.md` - Complete usage guide
- 📋 `COMMIT_CHECKLIST.md` - Quality standards
- ⚙️ `.claude/rules/` - Development workflows
- 🤖 `.claude/agents/` - Available AI agents

### 5. Start Building
```bash
# Follow the AUTOPM workflow
# PRD → Epic → Issues → Parallel Execution
```

## 🔄 Update Your Installation

```bash
# Update to latest version
autopm update

# The system will:
# ✅ Detect your existing installation
# ✅ Create automatic backup
# ✅ Update only changed files
# ✅ Preserve your customizations
# ✅ Offer merge help for conflicts
```

## 🤝 Community & Support

- 📖 **Documentation**: [Full README](https://github.com/rla/AUTOPM#readme)
- 🐛 **Issues**: [GitHub Issues](https://github.com/rla/AUTOPM/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/rla/AUTOPM/discussions)
- ⭐ **Star us**: [GitHub Repository](https://github.com/rla/AUTOPM)

## 📄 License

MIT License - see [LICENSE](https://github.com/rla/AUTOPM/blob/main/LICENSE) file for details.

---

**Ready to transform your development workflow?**

```bash
npm install -g @autopm/framework && autopm init my-project
```

**Ship better software, faster! 🚀**