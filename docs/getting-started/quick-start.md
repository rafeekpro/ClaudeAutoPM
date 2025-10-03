# Quick Start Guide

Get started with ClaudeAutoPM in 5 minutes. This guide will walk you through your first workflow from installation to production.

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js >= 16.0.0
- ✅ npm >= 8.0.0
- ✅ Claude Code installed
- ✅ GitHub account (or Azure DevOps)

---

## Step 1: Install ClaudeAutoPM (1 minute)

```bash
# Install globally
npm install -g claude-autopm

# Verify installation
autopm --version
# Expected: claude-autopm@1.20.1 (or later)
```

---

## Step 2: Create/Open Your Project (30 seconds)

```bash
# Create new project
mkdir my-awesome-app
cd my-awesome-app
git init

# Or use existing project
cd existing-project
```

---

## Step 3: Install Framework (1 minute)

```bash
# Run interactive installation
autopm install

# You'll be asked to choose:
# 1. Preset: Select "fullstack" (recommended for first time)
# 2. Provider: Select "github"
# 3. MCP Servers: Enable "context7" (recommended)
```

**What gets installed:**
- `.claude/` - Framework configuration (agents, commands, rules)
- `.claude-code/` - Claude Code settings
- `CLAUDE.md` - Project instructions for Claude
- `scripts/` - Helper scripts (safe-commit, setup-hooks)

---

## Step 4: Configure GitHub (1 minute)

### Create GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `admin:repo_hook` (Full control of repository hooks)
4. Click "Generate token"
5. **Copy the token** (you won't see it again!)

### Configure ClaudeAutoPM

```bash
# Set your GitHub details
autopm config set provider github
autopm config set github.owner YOUR_GITHUB_USERNAME
autopm config set github.repo YOUR_REPO_NAME

# Set your token
export GITHUB_TOKEN=ghp_your_token_here

# Or add to .env file (recommended)
echo "GITHUB_TOKEN=ghp_your_token_here" >> .claude/.env

# Validate configuration
autopm config validate
```

**Expected output:**
```
✅ Configuration valid
✅ GitHub connection successful
✅ Repository access confirmed
```

---

## Step 5: Load Agent Team (30 seconds)

```bash
# Load fullstack development team
autopm team load fullstack

# Verify loaded agents
autopm team show
```

**Expected output:**
```
Current team: fullstack

Active Agents (30):
  Core Agents (7):
    - agent-manager
    - code-analyzer
    - file-analyzer
    - test-runner
    - parallel-worker
    - mcp-manager

  Language Agents (6):
    - python-backend-engineer
    - nodejs-backend-engineer
    - javascript-frontend-engineer
    - bash-scripting-expert

  Framework Agents (8):
    - react-frontend-engineer
    - react-ui-expert
    - tailwindcss-expert
    - e2e-test-engineer
    - frontend-testing-engineer

  ... (and more)
```

---

## Step 6: Open Claude Code (30 seconds)

```bash
# Open Claude Code in current directory
claude --dangerously-skip-permissions .
```

**Important:** The `--dangerously-skip-permissions` flag is required for ClaudeAutoPM to function properly.

---

## Step 7: Your First Workflow (2 minutes)

Now you're in Claude Code! Let's create your first project workflow.

### Create a PRD (Product Requirements Document)

In Claude Code, type:

```
/pm:prd-new "Build a simple task management API"
```

**What Claude does:**
1. Creates `prds/prd-001-task-management-api.md`
2. Asks you questions about requirements
3. Generates structured PRD with:
   - Problem statement
   - User stories
   - Success criteria
   - Technical requirements

**Example output:**
```markdown
# PRD-001: Task Management API

## Problem Statement
Users need a simple REST API to manage their daily tasks...

## User Stories
- As a user, I want to create tasks
- As a user, I want to list all my tasks
- As a user, I want to mark tasks as complete
- As a user, I want to delete tasks

## Technical Requirements
- Python FastAPI backend
- PostgreSQL database
- RESTful API design
- JWT authentication
```

### Decompose into Epic

```
/pm:epic-decompose prds/prd-001-task-management-api.md
```

**What Claude does:**
1. Analyzes PRD
2. Creates `epics/epic-001-task-management-api.md`
3. Breaks down into implementable tasks:
   - Backend API endpoints
   - Database schema
   - Authentication
   - Testing
   - Documentation

**Example epic structure:**
```markdown
# Epic 001: Task Management API

## Tasks
- [ ] Setup FastAPI project structure
- [ ] Create database models (User, Task)
- [ ] Implement CRUD endpoints
- [ ] Add JWT authentication
- [ ] Write API tests
- [ ] Create API documentation
```

### Sync with GitHub

```
/pm:epic-sync epics/epic-001-task-management-api.md
```

**What Claude does:**
1. Creates GitHub issues for each task
2. Links issues to epic
3. Updates epic file with issue numbers
4. Sets up project board (optional)

**Example:**
```
✅ Created issue #1: Setup FastAPI project structure
✅ Created issue #2: Create database models
✅ Created issue #3: Implement CRUD endpoints
✅ Created issue #4: Add JWT authentication
✅ Created issue #5: Write API tests
✅ Created issue #6: Create API documentation

Epic synced successfully!
View on GitHub: https://github.com/your-user/your-repo/issues/1
```

### Start Working on First Task

```
/pm:next
```

**What Claude does:**
1. Shows available tasks
2. Lets you select which one to work on
3. Creates feature branch
4. Sets up development environment
5. Loads appropriate agents

**Example:**
```
Available tasks:
1. Setup FastAPI project structure (#1)
2. Create database models (#2)
3. Implement CRUD endpoints (#3)

Which task? 1

✅ Created branch: feature/task-1-setup-fastapi
✅ Loaded agents: python-backend-engineer, postgresql-expert
✅ Ready to code!
```

### Let Claude Build It

```
Please implement task #1: Setup FastAPI project structure

Requirements:
- Use FastAPI framework
- Include project structure best practices
- Add basic configuration
- Set up virtual environment
```

**What Claude does:**
1. Analyzes requirements
2. Uses `python-backend-engineer` agent
3. Creates project structure:
```
project/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models/
│   ├── routes/
│   └── config.py
├── tests/
├── requirements.txt
├── .env.example
└── README.md
```
4. Writes code
5. Adds tests
6. Updates documentation

### Complete and Sync

```
/pm:issue-close "Implemented FastAPI project structure"
```

**What Claude does:**
1. Commits changes
2. Pushes to GitHub
3. Updates issue status
4. Creates pull request (optional)
5. Moves to next task

---

## What You've Accomplished

In 5 minutes, you've:

✅ Installed ClaudeAutoPM
✅ Configured GitHub integration
✅ Created a structured PRD
✅ Decomposed into an epic with tasks
✅ Synced with GitHub
✅ Completed your first task

---

## Next Steps

### Continue Development

```bash
# Get next task
/pm:next

# Or show all tasks
/pm:status

# Or work on specific task
/pm:issue-start 2
```

### Monitor Progress

```bash
# See epic status
/pm:epic-status epic-001-task-management-api.md

# Daily standup
/pm:standup

# Sprint status
/pm:sprint-status
```

### Deploy to Production

```bash
# Generate Dockerfile
Use docker-containerization-expert to create production Dockerfile

# Create Kubernetes manifests
Use kubernetes-orchestrator to create K8s deployment

# Set up CI/CD
Use github-operations-specialist to create GitHub Actions workflow
```

---

## Common Commands

### Project Management

```bash
/pm:prd-new "description"           # Create new PRD
/pm:epic-decompose prd-file         # Create epic from PRD
/pm:epic-sync epic-file             # Sync epic with GitHub
/pm:next                       # Get next task to work on
/pm:issue-start <number>            # Start working on issue
/pm:issue-close "message"           # Complete current issue
/pm:status                          # Show project status
/pm:standup                         # Daily standup report
```

### Configuration

```bash
autopm config show                  # Show current config
autopm config validate              # Validate setup
autopm team list                    # List available teams
autopm team load <name>             # Load agent team
autopm mcp status                   # Check MCP servers
```

### Development

```bash
Use python-backend-engineer to...   # Backend development
Use react-frontend-engineer to...   # Frontend development
Use docker-containerization-expert to...  # Docker setup
Use github-operations-specialist to...    # CI/CD setup
```

---

## Tips for Success

### 1. Use the Right Agent

Different agents for different tasks:
- **Planning/Architecture**: Use "expert" agents
- **Implementation**: Use "engineer" agents
- **Infrastructure**: Use "orchestrator" or "architect" agents

Example:
```
# Good
Use python-backend-engineer to implement the API endpoints

# Better
Use python-backend-engineer with framework=fastapi to implement the API endpoints
```

### 2. Break Down Large Tasks

Instead of:
```
/pm:prd-new "Build entire e-commerce platform"
```

Do:
```
/pm:prd-new "Build user authentication system"
/pm:prd-new "Build product catalog"
/pm:prd-new "Build shopping cart"
```

### 3. Sync Regularly

```bash
# Sync after each major change
/pm:epic-sync epic-file
/pm:issue-close "message"

# Daily sync
/pm:sync-all
```

### 4. Use Teams Effectively

Switch teams based on your work:

```bash
# Frontend work
autopm team load frontend

# Backend work
autopm team load backend

# Infrastructure work
autopm team load devops

# Full-stack development
autopm team load fullstack
```

### 5. Leverage MCP Servers

Enable documentation servers for your stack:

```bash
# Enable Context7 for framework docs
autopm mcp enable context7

# Agents can now query latest React, FastAPI, etc. docs
Use react-frontend-engineer to build component with latest React 18 features
```

---

## Troubleshooting

### "Command not found: /pm:*"

**Problem**: Slash commands not available

**Solution**:
```bash
# Verify ClaudeAutoPM is installed
autopm validate

# Reload Claude Code
# Close and reopen Claude Code
```

### "Agent not found"

**Problem**: Agent not loaded

**Solution**:
```bash
# Check loaded team
autopm team show

# Load appropriate team
autopm team load fullstack

# Reload Claude Code
```

### "GitHub sync failed"

**Problem**: Invalid token or permissions

**Solution**:
```bash
# Validate configuration
autopm config validate

# Check token permissions
# Token needs: repo, workflow, admin:repo_hook

# Regenerate token if needed
export GITHUB_TOKEN=new_token
autopm config validate
```

### "MCP server not responding"

**Problem**: MCP server offline or misconfigured

**Solution**:
```bash
# Diagnose MCP servers
autopm mcp diagnose

# Test specific server
autopm mcp test context7

# Restart Claude Code
```

---

## Learn More

### Tutorials

- [Your First Project](first-project.md) - Complete end-to-end tutorial
- [PRD to Production](../workflows/prd-to-production.md) - Full workflow guide
- [Epic Management](../workflows/epic-management.md) - Managing large projects

### Concepts

- [Architecture](../core-concepts/architecture.md) - How ClaudeAutoPM works
- [Agent System](../core-concepts/agent-system.md) - Understanding agents
- [Team Management](../core-concepts/team-management.md) - Agent teams

### Reference

- [CLI Commands](../cli-reference/overview.md) - All CLI commands
- [Slash Commands](../cli-reference/slash-commands.md) - All /pm:* commands
- [Agent Registry](../agents/registry.md) - All available agents

---

## Get Help

- 📚 [Documentation](https://rafeekpro.github.io/ClaudeAutoPM/)
- 💬 [GitHub Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)
- 🐛 [Report Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- 🐦 [Twitter @rafeekpro](https://twitter.com/rafeekpro)

---

**Next:** [Your First Project](first-project.md) - Build a complete application from scratch
