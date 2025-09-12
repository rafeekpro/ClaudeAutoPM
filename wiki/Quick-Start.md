# 🚀 Quick Start Guide

Get ClaudeAutoPM up and running in your project in just 5 minutes!

## ⚡ 1-Minute Installation

### Global Installation (Recommended)
```bash
# Install ClaudeAutoPM globally
npm install -g claude-autopm

# Install to your project
cd your-project
autopm install

# You're ready! 🎉
```

### No-Install Option
```bash
# Use without installing globally
npx claude-autopm install
```

## 🎯 Choose Your Configuration

During installation, you'll choose your development style:

```
🔧 Choose your development configuration:
  1) 🏃 Minimal     - Traditional development (no Docker/K8s)
  2) 🐳 Docker-only - Docker-first development without Kubernetes  
  3) 🚀 Full DevOps - All features (Docker + Kubernetes + CI/CD)
  4) ⚙️  Custom     - Use existing config.json template

Your choice [1-4]: 
```

### Quick Decision Guide

- **New to containers?** → Choose **Minimal** (1)
- **Team consistency needed?** → Choose **Docker-only** (2)  
- **Enterprise/production app?** → Choose **Full DevOps** (3)

## 📁 What Gets Installed

After installation, your project will have:

```
your-project/
├── .claude/                 # ClaudeAutoPM configuration
│   ├── agents/             # 50+ AI agents
│   ├── rules/              # Development workflows
│   ├── commands/           # PM commands
│   ├── config.json         # Your chosen configuration
│   └── .env                # Environment variables
├── .claude-code/           # Claude Code settings
├── .github/                # GitHub Actions workflows
├── scripts/                # Automation scripts  
├── CLAUDE.md              # AI instructions (auto-generated)
├── PLAYBOOK.md            # Usage guide
└── COMMIT_CHECKLIST.md    # Quality standards
```

## 🛠️ Verify Installation

```bash
# Check your configuration
autopm --version

# View current settings
autopm config

# Test AI agent
# In Claude Code, try: /pm:help
```

## 🎨 Customize Your Setup

### Change Configuration Anytime
```bash
# Interactive configuration tool
autopm config

# Switch from Minimal to Docker-only
# Toggle Docker-first development: OFF → ON
# Your CLAUDE.md automatically updates!
```

### Configure Environment Variables
```bash
# Interactive .env setup
autopm setup-env

# Or copy and edit manually
cp .claude/.env.example .claude/.env
nano .claude/.env
```

## 🚦 Your First ClaudeAutoPM Workflow

### 1. **Create a PRD** (Product Requirements Document)
```bash
# In Claude Code
/pm:prd-new "User Authentication System"
```

### 2. **Break it into an Epic**  
```bash
/pm:epic-decompose
```

### 3. **Generate GitHub Issues**
```bash
/pm:epic-sync
```

### 4. **Start Development**
```bash
/pm:next  # Get AI-recommended next task
```

### 5. **Use AI Agents**
```bash
# For React frontend
Task: Create login form with validation
Agent: react-frontend-engineer

# For Python backend  
Task: Create FastAPI authentication endpoint
Agent: python-backend-engineer

# For testing
Task: Write E2E tests for login flow
Agent: playwright-test-engineer
```

## 📋 Configuration-Specific Workflows

### 🏃 Minimal Configuration
```bash
# Standard development
npm install
npm run dev
npm test

# AI assistance with native tools
Task: Fix authentication bug
Agent: javascript-frontend-engineer
```

### 🐳 Docker-Only Configuration
```bash
# Container-first development
docker compose up -d
docker compose exec app npm install
docker compose exec app npm run dev

# AI assistance with Docker
Task: Optimize Dockerfile for Node.js
Agent: docker-expert
```

### 🚀 Full DevOps Configuration
```bash
# Local development (Docker)
docker compose up -d
docker compose exec app npm run dev

# CI/CD happens automatically via GitHub Actions
# - Kubernetes testing with KIND
# - Security scanning
# - Helm chart validation

# AI assistance with K8s
Task: Create Kubernetes deployment manifests  
Agent: kubernetes-orchestrator
```

## 🔧 Essential Commands

### Project Management
```bash
autopm install              # Install ClaudeAutoPM framework
autopm config               # Configure features interactively
autopm update               # Update to latest version
autopm setup-env            # Configure environment variables
autopm merge                # Merge CLAUDE.md configurations
```

### In Claude Code (PM Commands)
```bash
/pm:init                    # Initialize PM system
/pm:next                    # Get next recommended task  
/pm:status                  # View project status
/pm:epic-start "Epic Name"  # Start new epic
/azure:standup              # Daily standup (if using Azure DevOps)
```

## 🎯 Next Steps by Configuration

### If you chose **Minimal**:
1. Read [PLAYBOOK.md](../PLAYBOOK.md) for basic workflows
2. Learn about [AI Agents](Agent-Registry.md)
3. Try the [PM commands](PM-Commands.md)
4. When ready, consider upgrading to Docker-only

### If you chose **Docker-only**:
1. Learn [Docker-First Development](Docker-First-Development.md)
2. Set up your [docker-compose.yml](Docker-First-Development.md#container-setup)
3. Configure [hot reload](Docker-First-Development.md#development-workflow)
4. Explore [container-aware agents](Agent-Selection-Guide.md#docker-specialists)

### If you chose **Full DevOps**:
1. Understand the [Hybrid Strategy](Hybrid-Strategy.md)
2. Set up [Kubernetes manifests](Kubernetes-Integration.md)
3. Configure [Helm charts](Kubernetes-Integration.md#helm-charts)
4. Review [GitHub Actions workflows](GitHub-Actions.md)

## 🤝 Getting Help

### Documentation
- **[Configuration Options](Configuration-Options.md)** - Detailed config guide
- **[CLI Reference](CLI-Reference.md)** - All commands
- **[Troubleshooting](Troubleshooting.md)** - Common issues

### Community
- 🐛 **Found a bug?** [Report on GitHub](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- 💬 **Have questions?** [GitHub Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)  
- 📖 **Improve docs** [Edit this wiki](https://github.com/rafeekpro/ClaudeAutoPM/wiki)

## 🎉 You're Ready!

Your ClaudeAutoPM installation is complete! Here's what to do next:

1. **Explore your CLAUDE.md** - See how it matches your configuration
2. **Try a PM command** - Start with `/pm:help` in Claude Code
3. **Create your first epic** - Use `/pm:epic-start "Your Epic Name"`
4. **Get familiar with agents** - Check the [Agent Registry](Agent-Registry.md)

**Happy coding with ClaudeAutoPM! 🚀**