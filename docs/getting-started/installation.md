# Installation Guide

Complete guide to installing ClaudeAutoPM and setting up your development environment.

---

## Prerequisites

### Required

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git** >= 2.0.0
- **Claude Code** (Desktop app from Anthropic)

### Optional (but recommended)

- **Docker** >= 20.10.0 (for Docker-first development)
- **GitHub CLI** (`gh`) or **Azure CLI** (for provider integration)
- **Kubernetes** >= 1.21 (for K8s deployment features)

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be >= v16.0.0

# Check npm version
npm --version   # Should be >= 8.0.0

# Check Git
git --version

# Check Claude Code
claude --version
```

---

## Installation Methods

### Method 1: npm Global Install (Recommended)

```bash
# Install globally
npm install -g claude-autopm

# Verify installation
autopm --version

# Check help
autopm --help
```

**Pros:**
- ✅ Available system-wide
- ✅ Easy to update
- ✅ Works from any directory

**Cons:**
- ⚠️ Requires npm global permissions

### Method 2: npx (No Install)

```bash
# Run without installing
npx claude-autopm install

# Or use with any command
npx claude-autopm --help
```

**Pros:**
- ✅ No installation required
- ✅ Always uses latest version
- ✅ Good for trying it out

**Cons:**
- ⚠️ Slower (downloads each time)
- ⚠️ Requires internet connection

### Method 3: Local Development Install

```bash
# Clone repository
git clone https://github.com/rafeekpro/ClaudeAutoPM.git
cd ClaudeAutoPM

# Install dependencies
npm install

# Link locally
npm link

# Verify
autopm --version
```

**Pros:**
- ✅ Full source code access
- ✅ Can modify and contribute
- ✅ Latest development features

**Cons:**
- ⚠️ More complex setup
- ⚠️ Need to manage updates manually

---

## Project Setup

### Quick Setup (Interactive)

The easiest way to get started:

```bash
# Navigate to your project
cd your-project-directory

# Run installation
autopm install

# Follow the interactive prompts:
# 1. Choose preset (minimal/docker-only/fullstack/devops/custom)
# 2. Configure provider (github/azure/local)
# 3. Set up MCP servers (optional)
# 4. Select agent teams
```

### Manual Setup

If you prefer manual configuration:

```bash
# 1. Install with specific preset
autopm install --preset fullstack

# 2. Configure provider
autopm config set provider github
autopm config set github.owner YOUR_USERNAME
autopm config set github.repo YOUR_REPO

# 3. Set up environment variables
export GITHUB_TOKEN=ghp_your_token_here

# 4. Load agent team
autopm team load fullstack

# 5. Validate setup
autopm validate
```

---

## Installation Presets

Choose a preset based on your project needs:

### 1. Minimal

**Best for:** Small projects, simple workflows, learning ClaudeAutoPM

```bash
autopm install --preset minimal
```

**Includes:**
- ✅ Core agents (4)
- ✅ Basic PM commands
- ✅ Sequential execution
- ✅ Local Git workflow
- ❌ No Docker/K8s
- ❌ No cloud agents

**Agent count:** ~10 agents

### 2. Docker-Only

**Best for:** Docker development, containerized apps

```bash
autopm install --preset docker-only
```

**Includes:**
- ✅ Core agents (4)
- ✅ Docker containerization expert
- ✅ Docker-first development rules
- ✅ Adaptive execution
- ✅ GitHub or Azure DevOps
- ❌ No Kubernetes

**Agent count:** ~15 agents

### 3. Fullstack (Recommended)

**Best for:** Most projects, full-stack development

```bash
autopm install --preset fullstack
```

**Includes:**
- ✅ All language agents (Python, Node.js, JavaScript, Bash)
- ✅ All framework agents (React, FastAPI, etc.)
- ✅ Docker containerization
- ✅ Database agents (PostgreSQL, MongoDB, Redis)
- ✅ Testing agents
- ✅ Adaptive execution
- ✅ Full GitHub/Azure integration

**Agent count:** ~30 agents

### 4. DevOps

**Best for:** Infrastructure teams, DevOps engineers, production deployments

```bash
autopm install --preset devops
```

**Includes:**
- ✅ Everything in Fullstack
- ✅ Kubernetes orchestrator
- ✅ All cloud architects (AWS, Azure, GCP)
- ✅ Terraform infrastructure expert
- ✅ CI/CD specialists
- ✅ Observability engineer
- ✅ Hybrid parallel execution
- ✅ Advanced MCP integration

**Agent count:** 39 agents (all)

### 5. Custom

**Best for:** Advanced users, specific requirements

```bash
autopm install --preset custom
```

**Allows:**
- ✅ Manual agent selection
- ✅ Custom execution strategy
- ✅ Fine-tuned configuration
- ✅ Specific MCP servers

**Requires:** Understanding of ClaudeAutoPM architecture

---

## Provider Configuration

### GitHub Setup

#### 1. Create Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes:
   - ✅ `repo` (all)
   - ✅ `workflow`
   - ✅ `admin:repo_hook`
4. Copy token

#### 2. Configure ClaudeAutoPM

```bash
# Set provider
autopm config set provider github

# Set repository details
autopm config set github.owner YOUR_USERNAME
autopm config set github.repo YOUR_REPOSITORY

# Set token as environment variable
export GITHUB_TOKEN=ghp_your_token_here

# Or add to .env file
echo "GITHUB_TOKEN=ghp_your_token_here" >> .claude/.env

# Validate connection
autopm config validate
```

### Azure DevOps Setup

#### 1. Create Personal Access Token

1. Go to Azure DevOps → User Settings → Personal access tokens
2. Create new token
3. Select scopes:
   - ✅ Work Items (Read & Write)
   - ✅ Code (Read & Write)
   - ✅ Build (Read & Execute)
4. Copy token

#### 2. Configure ClaudeAutoPM

```bash
# Set provider
autopm config set provider azure

# Set organization and project
autopm config set azure.organization YOUR_ORG
autopm config set azure.project YOUR_PROJECT

# Set token as environment variable
export AZURE_DEVOPS_PAT=your_azure_pat

# Or add to .env file
echo "AZURE_DEVOPS_PAT=your_azure_pat" >> .claude/.env

# Validate connection
autopm config validate
```

### Local (Git-only) Setup

```bash
# Set provider
autopm config set provider local

# No additional configuration needed
# Works with local Git repository only
```

---

## MCP (Model Context Protocol) Setup

MCP servers provide Claude with access to external tools and documentation.

### Quick Setup

```bash
# Enable Context7 (documentation for all frameworks)
autopm mcp enable context7

# Set up API key (if required)
autopm mcp setup

# Sync configuration
autopm mcp sync

# Verify
autopm mcp status
```

### Available MCP Servers

```bash
# List all available MCP servers
autopm mcp list

# Common servers:
# - context7: Documentation for React, Python, FastAPI, etc.
# - playwright: Browser automation
# - filesystem: File system access
# - sqlite: Database access
```

### Diagnose MCP Issues

```bash
# Run comprehensive diagnostics
autopm mcp diagnose

# Test specific server
autopm mcp test context7

# Check which agents use MCP
autopm mcp agents

# View MCP usage statistics
autopm mcp usage
```

---

## Agent Team Setup

Load agent teams based on your work:

```bash
# Frontend development
autopm team load frontend

# Backend development
autopm team load backend

# Full-stack development
autopm team load fullstack

# DevOps and infrastructure
autopm team load devops

# List available teams
autopm team list

# Show current team
autopm team show
```

Teams automatically activate the right agents for your context.

---

## Validation

### Check Installation

```bash
# Run validation
autopm validate

# Expected output:
# ✅ ClaudeAutoPM installation: OK
# ✅ Configuration file: OK
# ✅ Provider setup: OK
# ✅ Agent teams: OK
# ✅ MCP servers: OK
```

### Common Validation Errors

**❌ "Configuration file not found"**
```bash
# Solution: Run install
autopm install
```

**❌ "Provider not configured"**
```bash
# Solution: Configure provider
autopm config set provider github
autopm config set github.owner YOUR_USERNAME
autopm config set github.repo YOUR_REPO
```

**❌ "Invalid GitHub token"**
```bash
# Solution: Check token permissions and expiry
# Regenerate token if needed
export GITHUB_TOKEN=new_token
autopm config validate
```

---

## Directory Structure

After installation, your project will have:

```
your-project/
├── .claude/                    # ClaudeAutoPM configuration
│   ├── agents/                # AI agent definitions (39 total)
│   ├── commands/              # Slash commands (109 total)
│   ├── rules/                 # Development rules
│   ├── scripts/               # Automation scripts
│   ├── checklists/            # Development checklists
│   ├── mcp/                   # MCP server documentation
│   ├── templates/             # Code templates
│   ├── strategies/            # Execution strategies
│   ├── config.json            # Main configuration
│   ├── teams.json             # Agent team definitions
│   └── .env                   # Environment variables
│
├── scripts/                   # Project-level scripts
│   ├── safe-commit.sh         # Git commit helper
│   └── setup-hooks.sh         # Git hooks installer
│
├── .claude-code/              # Claude Code settings
│   └── config.json
│
└── CLAUDE.md                  # Project instructions
```

---

## Update ClaudeAutoPM

### Update Framework

```bash
# Update to latest version
autopm update

# Force update (overwrites local changes)
autopm update --force

# Update specific components
autopm update --agents-only
autopm update --commands-only
```

### Update npm Package

```bash
# Check current version
autopm --version

# Update global package
npm update -g claude-autopm

# Verify update
autopm --version
```

---

## Uninstallation

### Remove from Project

```bash
# Remove ClaudeAutoPM files
rm -rf .claude/
rm -rf .claude-code/
rm CLAUDE.md
rm -rf scripts/
```

### Remove Global Package

```bash
# Uninstall global package
npm uninstall -g claude-autopm

# Verify removal
autopm --version  # Should show "command not found"
```

---

## Troubleshooting

### Common Issues

**Issue: "Permission denied" during global install**

```bash
# Solution: Use sudo (not recommended) or fix npm permissions
# Better: Configure npm to install globally without sudo
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g claude-autopm
```

**Issue: "Command not found: autopm"**

```bash
# Solution: Check PATH
echo $PATH

# Add npm global bin to PATH
export PATH=$(npm bin -g):$PATH

# Or reinstall
npm install -g claude-autopm
```

**Issue: "EACCES" errors on install**

```bash
# Solution: Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

### Get Help

```bash
# Show help for all commands
autopm --help

# Show help for specific command
autopm install --help
autopm config --help
autopm team --help

# Run diagnostics
autopm validate --verbose
```

---

## Next Steps

After installation:

1. ✅ [Quick Start Tutorial](quick-start.md) - Learn the basics in 5 minutes
2. ✅ [Your First Project](first-project.md) - Build something real
3. ✅ [Core Concepts](../core-concepts/architecture.md) - Understand how it works
4. ✅ [Workflows](../workflows/prd-to-production.md) - Complete development workflows

---

## Additional Resources

- [CLI Reference](../cli-reference/overview.md)
- [Configuration Guide](../cli-reference/config.md)
- [Agent Registry](../agents/registry.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md)
- [FAQ](../troubleshooting/faq.md)
