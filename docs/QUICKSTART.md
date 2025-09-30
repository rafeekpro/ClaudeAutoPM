# ClaudeAutoPM Quick Start Guide

Get up and running with ClaudeAutoPM in 5 minutes!

## Prerequisites

Before you begin:
- ✅ Node.js >= 16.0.0
- ✅ npm >= 8.0.0
- ✅ Git installed
- ✅ Claude Code or AI assistant (optional, for AI features)

## 🚀 Installation (60 seconds)

```bash
# Install globally
npm install -g claude-autopm

# Verify installation
autopm --version
```

## 🎯 Quick Start Options

### Option 1: Interactive Guide (Easiest)

```bash
autopm guide
```

The guide will walk you through everything automatically.

### Option 2: Manual Setup (5 minutes)

#### Step 1: Install Framework

```bash
# Navigate to your project
cd your-project/

# Install ClaudeAutoPM
autopm install
```

**Choose a preset when prompted:**
- **Minimal** - No Docker, simple setup
- **Docker-only** - Requires Docker
- **Full DevOps** 🎯 - Requires Docker + kubectl (RECOMMENDED)
- **Performance** - Requires Docker + kubectl, max speed

#### Step 2: Configure Provider

**For GitHub:**
```bash
autopm config set provider github
autopm config set github.owner your-username
autopm config set github.repo your-repo
export GITHUB_TOKEN=your_github_token
```

**For Azure DevOps:**
```bash
autopm config set provider azure
autopm config set azure.organization your-org
autopm config set azure.project your-project
export AZURE_DEVOPS_PAT=your_azure_token
```

**Skip for now:**
Just press Enter - work locally and configure later.

#### Step 3: Initialize

```bash
# Initialize PM system
/pm:init

# Or via CLI
autopm pm:init
```

## 🎓 Your First Workflow

### Create Your First Feature

```bash
# 1. Create a PRD (Product Requirements Document)
/pm:prd-new user-login

# 2. Parse PRD into actionable epic
/pm:prd-parse user-login

# 3. Break down into tasks
/pm:epic-decompose user-login

# 4. Sync to GitHub/Azure DevOps
/pm:epic-sync user-login

# 5. Start working
/pm:issue-start 1

# 6. Check what's next
/pm:next
```

### Or Use the One-Shot Command

```bash
# Do everything in one command!
/pm:epic-oneshot user-login
```

## 📝 Basic Commands

### Project Management

```bash
# View project status
/pm:status

# Show daily standup
/pm:standup

# List all epics
/pm:epic-list

# Show blocked tasks
/pm:blocked

# Get next priority task
/pm:next
```

### Working on Tasks

```bash
# Start a task
/pm:issue-start 123

# Show task details
/pm:issue-show 123

# Close completed task
/pm:issue-close 123

# Update task progress
/pm:issue-sync 123
```

### Creating Work

```bash
# New PRD
/pm:prd-new feature-name

# New epic directly
/pm:init feature-name

# Quick epic with auto-decompose
/pm:epic-oneshot feature-name
```

## 🤖 Agent Teams (Optional)

Switch between specialized agent teams:

```bash
# List available teams
autopm team list

# Load DevOps team
autopm team load devops

# Load Frontend team
autopm team load frontend

# Load Python Backend team
autopm team load python_backend

# Load Fullstack team
autopm team load fullstack
```

### Automatic Team Switching

Enable automatic team switching based on branch names:

```bash
# Setup (one-time)
bash scripts/setup-githooks.sh

# Now create branches with team names
git checkout -b feature/devops/add-ci        # Loads devops team
git checkout -b fix/frontend/button-style    # Loads frontend team
git checkout -b feat/backend/new-api         # Loads python_backend team
```

## 🔧 Configuration

### View Current Config

```bash
autopm config show
```

### Update Config

```bash
# Change provider
autopm config switch github
autopm config switch azure

# Set specific values
autopm config set github.owner newowner
autopm config set azure.project newproject

# Validate config
autopm config validate
```

## 📚 Common Workflows

### Daily Development

```bash
# Morning
/pm:standup              # What did I do yesterday?
/pm:next                 # What should I work on?
/pm:issue-start 42       # Start the task

# During work
/pm:issue-sync 42        # Push progress updates

# End of day
/pm:issue-close 42       # Mark as complete
```

### Feature Development

```bash
# Plan
/pm:prd-new payment-api
/pm:prd-parse payment-api
/pm:epic-decompose payment-api

# Execute
/pm:epic-sync payment-api    # Create GitHub issues
/pm:issue-start 101          # Start first task
# ... do the work ...
/pm:issue-close 101          # Complete task

# Review
/pm:status                   # Check progress
/pm:epic-show payment-api    # Review epic
```

### Team Collaboration

```bash
# See what's in progress
/pm:in-progress

# See what's blocked
/pm:blocked

# Generate team report
/pm:standup

# Check sprint status (Azure DevOps)
autopm azure:sprint-status
```

## 🎯 Pro Tips

### Use Templates

```bash
# Create PRD from template
autopm pm:prd-new feature --template

# Use decomposition templates
autopm pm:epic-decompose feature --template backend
autopm pm:epic-decompose feature --template frontend
```

### Context Management

```bash
# Create development context
autopm pm:context-create feature-name

# Update context with progress
autopm pm:context-update feature-name

# Prime context for AI
autopm pm:context-prime feature-name
```

### Pull Requests

```bash
# Create PR from current branch
autopm pm:pr-create "feat: add login"

# Create draft PR
autopm pm:pr-create "wip: dashboard" --draft

# List open PRs
autopm pm:pr-list --status open
```

## 🔍 Finding Help

### Command Help

```bash
# General help
autopm --help

# Category help
autopm pm --help
autopm azure --help

# Specific command
autopm pm:epic-sync --help
```

### In Claude Code

```bash
# Use slash commands
/pm:help
/azure:help

# Ask for guidance
What PM commands are available?
How do I create an epic?
Show me the workflow for features
```

## 🚨 Troubleshooting

### Installation Issues

```bash
# Check versions
node --version  # >= 16.0.0
npm --version   # >= 8.0.0

# Reinstall if needed
npm uninstall -g claude-autopm
npm install -g claude-autopm
```

### Configuration Issues

```bash
# Validate configuration
autopm config validate

# Reset configuration
rm .claude/config.json
autopm install
```

### Provider Connection Issues

```bash
# GitHub - check token
echo $GITHUB_TOKEN

# Azure DevOps - check PAT
echo $AZURE_DEVOPS_PAT

# Test connection
autopm config validate
```

## 📖 Next Steps

Now that you're set up:

1. **Learn More**
   - Read the [Full Documentation](https://rafeekpro.github.io/ClaudeAutoPM/)
   - Browse the [Command Reference](../COMMANDS.md)
   - Check the [Configuration Guide](./CONFIG.md)

2. **Try Advanced Features**
   - [Agent Teams](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Agent-Teams)
   - [Parallel Execution](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Parallel-Execution)
   - [Docker & Kubernetes](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Docker-Kubernetes)

3. **Join the Community**
   - ⭐ [Star on GitHub](https://github.com/rafeekpro/ClaudeAutoPM)
   - 🐛 [Report Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
   - 💬 [Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)
   - 🐦 [Follow on X](https://x.com/rafeekpro)

## 📝 Example Project

Here's a complete example from start to finish:

```bash
# 1. Install
npm install -g claude-autopm
cd my-project
autopm install

# 2. Configure
autopm config set provider github
autopm config set github.owner myuser
autopm config set github.repo myrepo
export GITHUB_TOKEN=ghp_xxxxx

# 3. Initialize
/pm:init

# 4. Create feature
/pm:prd-new user-authentication
/pm:prd-parse user-authentication
/pm:epic-decompose user-authentication
/pm:epic-sync user-authentication

# 5. Start working
/pm:next
/pm:issue-start 1

# ... do the work ...

# 6. Complete
/pm:issue-close 1
/pm:pr-create "feat: add user authentication"
```

## 🎉 You're Ready!

You now know enough to:
- ✅ Create and manage features
- ✅ Break down work into tasks
- ✅ Track progress
- ✅ Sync with GitHub/Azure DevOps
- ✅ Work with AI agents

Start building! 🚀