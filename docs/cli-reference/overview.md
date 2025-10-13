# CLI Reference Overview

Complete reference for all ClaudeAutoPM CLI commands.

---

## Command Categories

ClaudeAutoPM provides **112 CLI commands** organized into logical categories:

| Category | Commands | Purpose |
|----------|----------|---------|
| **Installation & Setup** | 12 | Project initialization and updates |
| **Configuration** | 18 | Config management and validation |
| **Team Management** | 15 | Agent team operations |
| **MCP Management** | 14 | Model Context Protocol servers |
| **Epic Management** | 8 | Epic-level operations |
| **Project Management** | 25 | General PM commands (3 new STANDALONE in v2.1.0) |
| **Azure DevOps** | 20 | Azure-specific operations |

---

## Quick Command Index

### Most Common Commands

```bash
# Installation
autopm install                    # Install framework
autopm update                     # Update framework
autopm validate                   # Validate installation

# Configuration
autopm config show                # Show current config
autopm config set <key> <value>   # Set config value
autopm config validate            # Validate configuration

# Team Management
autopm team list                  # List available teams
autopm team load <name>           # Load agent team
autopm team show                  # Show current team

# MCP Servers
autopm mcp status                 # Check MCP server status
autopm mcp enable <server>        # Enable MCP server
autopm mcp diagnose               # Diagnose MCP issues
```

---

## Installation & Setup Commands

### `autopm install`

Install ClaudeAutoPM framework in current project.

**Usage:**
```bash
autopm install [options]
```

**Options:**
- `--preset <name>` - Installation preset (minimal, docker-only, fullstack, devops, custom)
- `--provider <name>` - Provider (github, azure, local)
- `--force` - Force reinstall (overwrites existing)
- `--no-interactive` - Skip interactive prompts
- `--dry-run` - Show what would be installed

**Examples:**
```bash
# Interactive installation (recommended)
autopm install

# Install with fullstack preset
autopm install --preset fullstack

# Install for GitHub with specific provider
autopm install --preset fullstack --provider github

# Force reinstall
autopm install --force
```

**What it does:**
1. Creates `.claude/` directory structure
2. Copies agents, commands, rules, scripts
3. Generates `CLAUDE.md` project file
4. Sets up `.claude-code/config.json`
5. Installs selected MCP servers
6. Configures execution strategy
7. Loads initial agent team

---

### `autopm update`

Update ClaudeAutoPM framework to latest version.

**Usage:**
```bash
autopm update [options]
```

**Options:**
- `--force` - Force update (overwrites local changes)
- `--agents-only` - Update only agent definitions
- `--commands-only` - Update only slash commands
- `--rules-only` - Update only development rules
- `--preserve-config` - Keep current configuration
- `--dry-run` - Show what would be updated

**Examples:**
```bash
# Standard update (preserves config)
autopm update

# Force update all files
autopm update --force

# Update only agents
autopm update --agents-only
```

**What it does:**
1. Backs up current configuration
2. Downloads latest framework files
3. Updates agents, commands, rules
4. Preserves custom modifications
5. Migrates configuration if needed
6. Validates updated installation

---

### `autopm validate`

Validate ClaudeAutoPM installation and configuration.

**Usage:**
```bash
autopm validate [options]
```

**Options:**
- `--verbose` - Show detailed validation results
- `--fix` - Attempt to fix common issues
- `--registry` - Validate agent registry only
- `--config` - Validate configuration only
- `--provider` - Test provider connection

**Examples:**
```bash
# Full validation
autopm validate

# Verbose output with details
autopm validate --verbose

# Validate and fix issues
autopm validate --fix

# Validate agent registry
autopm validate --registry
```

**Checks:**
- ✅ Framework installation completeness
- ✅ Configuration file validity
- ✅ Provider connection and permissions
- ✅ Agent registry consistency
- ✅ MCP server availability
- ✅ Git repository status
- ✅ Environment variables

---

## Configuration Commands

### `autopm config show`

Display current configuration.

**Usage:**
```bash
autopm config show [options]
```

**Options:**
- `--json` - Output as JSON
- `--verbose` - Show all settings including defaults
- `--secrets` - Include secrets (masked)

**Examples:**
```bash
# Show configuration
autopm config show

# JSON output
autopm config show --json

# Show all settings
autopm config show --verbose
```

---

### `autopm config set`

Set configuration value.

**Usage:**
```bash
autopm config set <key> <value>
```

**Common Keys:**
```bash
# Provider configuration
autopm config set provider github
autopm config set github.owner USERNAME
autopm config set github.repo REPOSITORY
autopm config set azure.organization ORG
autopm config set azure.project PROJECT

# Execution configuration
autopm config set execution.strategy adaptive
autopm config set execution.maxParallel 3
autopm config set execution.timeout 300000

# MCP configuration
autopm config set mcp.enabled true
autopm config set mcp.servers context7,playwright
```

**Examples:**
```bash
# Configure GitHub
autopm config set provider github
autopm config set github.owner rafeekpro
autopm config set github.repo my-project

# Set execution strategy
autopm config set execution.strategy adaptive

# Enable MCP
autopm config set mcp.enabled true
```

---

### `autopm config get`

Get configuration value.

**Usage:**
```bash
autopm config get <key>
```

**Examples:**
```bash
# Get provider
autopm config get provider

# Get execution strategy
autopm config get execution.strategy

# Get GitHub owner
autopm config get github.owner
```

---

### `autopm config validate`

Validate configuration and test provider connection.

**Usage:**
```bash
autopm config validate [options]
```

**Options:**
- `--fix` - Attempt to fix validation errors
- `--provider-only` - Test provider connection only

**Examples:**
```bash
# Validate configuration
autopm config validate

# Validate and fix
autopm config validate --fix
```

**Checks:**
- ✅ Configuration file format
- ✅ Required fields present
- ✅ Provider configuration
- ✅ Provider API connection
- ✅ Token permissions
- ✅ Repository access

---

## Team Management Commands

### `autopm team list`

List available agent teams.

**Usage:**
```bash
autopm team list [options]
```

**Options:**
- `--verbose` - Show agents in each team
- `--json` - Output as JSON

**Examples:**
```bash
# List teams
autopm team list

# List with agent details
autopm team list --verbose
```

**Available Teams:**
- **minimal** - Core agents only (7 agents)
- **frontend** - Frontend development (15 agents)
- **backend** - Backend development (15 agents)
- **fullstack** - Full-stack development (30 agents)
- **devops** - DevOps and infrastructure (25 agents)
- **database** - Database specialists (12 agents)
- **cloud** - Cloud architecture (20 agents)

---

### `autopm team load`

Load agent team configuration.

**Usage:**
```bash
autopm team load <team-name>
```

**Examples:**
```bash
# Load fullstack team
autopm team load fullstack

# Load frontend team
autopm team load frontend

# Load devops team
autopm team load devops
```

**What it does:**
1. Reads team definition from `.claude/teams.json`
2. Activates specified agents
3. Updates `.claude-code/config.json`
4. Reloads Claude Code if running

**Note:** You need to reload Claude Code for changes to take effect.

---

### `autopm team show`

Show currently loaded team and agents.

**Usage:**
```bash
autopm team show [options]
```

**Options:**
- `--agents` - Show only agent list
- `--json` - Output as JSON

**Examples:**
```bash
# Show current team
autopm team show

# Show only agents
autopm team show --agents
```

---

### `autopm team create`

Create custom agent team.

**Usage:**
```bash
autopm team create <name> [options]
```

**Options:**
- `--agents <list>` - Comma-separated agent list
- `--inherits <team>` - Inherit from existing team
- `--description <text>` - Team description

**Examples:**
```bash
# Create custom team
autopm team create my-team --agents "python-backend-engineer,react-frontend-engineer,postgresql-expert"

# Create team inheriting from fullstack
autopm team create my-team --inherits fullstack --agents "additional-agent"
```

---

## MCP Management Commands

### `autopm mcp status`

Check status of MCP servers.

**Usage:**
```bash
autopm mcp status [options]
```

**Options:**
- `--verbose` - Show detailed status
- `--json` - Output as JSON

**Examples:**
```bash
# Check MCP status
autopm mcp status

# Detailed status
autopm mcp status --verbose
```

**Output:**
```
MCP Servers Status:

✅ context7       - Running  (Documentation access)
✅ playwright     - Running  (Browser automation)
⚠️  sqlite        - Stopped  (Database operations)
❌ filesystem     - Error    (Permission denied)

Active Servers: 2/4
```

---

### `autopm mcp enable`

Enable MCP server.

**Usage:**
```bash
autopm mcp enable <server-name>
```

**Available Servers:**
- `context7` - Framework documentation access
- `playwright` - Browser automation
- `filesystem` - File system operations
- `sqlite` - SQLite database access

**Examples:**
```bash
# Enable Context7
autopm mcp enable context7

# Enable multiple servers
autopm mcp enable context7 playwright
```

---

### `autopm mcp disable`

Disable MCP server.

**Usage:**
```bash
autopm mcp disable <server-name>
```

**Examples:**
```bash
# Disable Context7
autopm mcp disable context7
```

---

### `autopm mcp setup`

Configure MCP server settings.

**Usage:**
```bash
autopm mcp setup [server-name]
```

**Examples:**
```bash
# Setup all servers interactively
autopm mcp setup

# Setup specific server
autopm mcp setup context7
```

**What it does:**
1. Prompts for required configuration (API keys, etc.)
2. Validates configuration
3. Tests server connection
4. Saves to `.claude/mcp-servers.json`

---

### `autopm mcp diagnose`

Diagnose MCP server issues.

**Usage:**
```bash
autopm mcp diagnose [options]
```

**Options:**
- `--server <name>` - Diagnose specific server
- `--fix` - Attempt to fix common issues
- `--verbose` - Show detailed diagnostics

**Examples:**
```bash
# Diagnose all servers
autopm mcp diagnose

# Diagnose specific server
autopm mcp diagnose --server context7

# Diagnose and fix
autopm mcp diagnose --fix
```

**Checks:**
- ✅ Server configuration valid
- ✅ Network connectivity
- ✅ Authentication credentials
- ✅ API rate limits
- ✅ Permissions
- ✅ Dependencies installed

---

### `autopm mcp test`

Test MCP server connection.

**Usage:**
```bash
autopm mcp test <server-name>
```

**Examples:**
```bash
# Test Context7
autopm mcp test context7

# Test Playwright
autopm mcp test playwright
```

**What it does:**
1. Connects to MCP server
2. Sends test request
3. Validates response
4. Reports success/failure

---

### `autopm mcp sync`

Sync MCP server configuration to Claude Code.

**Usage:**
```bash
autopm mcp sync
```

**What it does:**
1. Reads `.claude/mcp-servers.json`
2. Updates `.claude-code/config.json`
3. Reloads Claude Code configuration

---

### `autopm mcp list`

List all available MCP servers.

**Usage:**
```bash
autopm mcp list [options]
```

**Options:**
- `--available` - Show only available servers
- `--enabled` - Show only enabled servers
- `--json` - Output as JSON

**Examples:**
```bash
# List all servers
autopm mcp list

# List enabled servers
autopm mcp list --enabled
```

---

### `autopm mcp agents`

Show which agents use MCP servers.

**Usage:**
```bash
autopm mcp agents [server-name]
```

**Examples:**
```bash
# Show all MCP-enabled agents
autopm mcp agents

# Show agents using Context7
autopm mcp agents context7
```

---

### `autopm mcp usage`

Show MCP usage statistics.

**Usage:**
```bash
autopm mcp usage [options]
```

**Options:**
- `--server <name>` - Stats for specific server
- `--period <days>` - Time period (default: 7)

**Examples:**
```bash
# Show usage stats
autopm mcp usage

# Show Context7 usage
autopm mcp usage --server context7

# Show last 30 days
autopm mcp usage --period 30
```

---

## Epic Management Commands

### `autopm epic list`

List all epics in the project.

**Usage:**
```bash
autopm epic list [options]
```

**Options:**
- `--status <status>` - Filter by status (active, completed, archived)
- `--json` - Output as JSON

**Examples:**
```bash
# List all epics
autopm epic list

# List active epics
autopm epic list --status active
```

---

### `autopm epic validate`

Validate epic file structure and content.

**Usage:**
```bash
autopm epic validate <epic-file>
```

**Examples:**
```bash
# Validate epic
autopm epic validate epics/epic-001.md
```

**Checks:**
- ✅ Epic file format valid
- ✅ Required sections present
- ✅ Task format correct
- ✅ Links to issues valid
- ✅ PRD reference exists

---

### `autopm epic status`

Show epic status and progress.

**Usage:**
```bash
autopm epic status <epic-file>
```

**Examples:**
```bash
# Show epic status
autopm epic status epics/epic-001.md
```

**Output:**
```
Epic 001: Task Management API

Status: In Progress
Progress: 6/12 tasks (50%)
Duration: 5 days
Estimate: 10 days remaining

Tasks:
✅ Setup FastAPI project (#1)
✅ Configure PostgreSQL (#2)
✅ User model (#3)
✅ Auth endpoints (#4)
✅ Task CRUD (#5)
✅ Tests (#6)
⏳ Documentation (#7)
⏳ Docker setup (#8)
⏳ K8s deployment (#9)
⏳ CI/CD (#10)
⏳ Monitoring (#11)
⏳ Production deploy (#12)
```

---

## STANDALONE Commands (v2.1.0)

### `autopm prd`

**NEW in v2.1.0** - Direct PRD management without AI overhead.

PRD management commands with direct service layer access for fast, deterministic operations.

**Usage:**
```bash
autopm prd <action> <name> [options]
```

**Actions:**

#### `parse` - Parse PRD content
```bash
autopm prd parse <name> [options]
```

**Options:**
- `--ai` - Use AI for parsing (default: basic parsing)
- `--stream` - Enable streaming output for real-time results
- `--output <file>` - Save parsed output to file

**Examples:**
```bash
# Basic parsing (no AI)
autopm prd parse my-prd

# AI-powered parsing
autopm prd parse my-prd --ai

# Streaming output
autopm prd parse my-prd --ai --stream

# Save to file
autopm prd parse my-prd --ai --output parsed.json
```

#### `extract-epics` - Extract epics from PRD
```bash
autopm prd extract-epics <name> [options]
```

**Options:**
- `--stream` - Enable streaming output
- `--output <file>` - Save epics to file

**Examples:**
```bash
# Extract epics
autopm prd extract-epics my-prd

# With streaming
autopm prd extract-epics my-prd --stream
```

#### `summarize` - Generate PRD summary
```bash
autopm prd summarize <name> [options]
```

**Options:**
- `--stream` - Enable streaming output
- `--length <short|medium|long>` - Summary length

**Examples:**
```bash
# Generate summary
autopm prd summarize my-prd

# Streaming summary
autopm prd summarize my-prd --stream

# Short summary
autopm prd summarize my-prd --length short
```

#### `validate` - Validate PRD structure
```bash
autopm prd validate <name> [options]
```

**Options:**
- `--fix` - Attempt to fix validation issues
- `--verbose` - Show detailed validation results

**Examples:**
```bash
# Validate PRD
autopm prd validate my-prd

# Validate and fix
autopm prd validate my-prd --fix

# Verbose validation
autopm prd validate my-prd --verbose
```

**Features:**
- 🎯 Deterministic operations (no AI for basic parsing)
- 🎨 Color-coded output (green=success, red=error)
- 🔄 Progress spinners for long operations
- 📡 Streaming support for real-time output
- ❌ Comprehensive error handling

---

### `autopm task`

**NEW in v2.1.0** - Direct task management operations.

Task management commands with direct service layer access.

**Usage:**
```bash
autopm task <action> <epic> [options]
```

**Actions:**

#### `list` - List tasks from epic
```bash
autopm task list <epic> [options]
```

**Options:**
- `--status <status>` - Filter by status (pending, in-progress, completed)
- `--json` - Output as JSON
- `--verbose` - Show detailed task information

**Examples:**
```bash
# List all tasks
autopm task list epic-001

# List only pending tasks
autopm task list epic-001 --status pending

# JSON output
autopm task list epic-001 --json
```

#### `prioritize` - AI-powered task prioritization
```bash
autopm task prioritize <epic> [options]
```

**Options:**
- `--criteria <criteria>` - Prioritization criteria (complexity, dependencies, risk)
- `--output <file>` - Save prioritized list to file

**Examples:**
```bash
# Prioritize tasks
autopm task prioritize epic-001

# Prioritize by dependencies
autopm task prioritize epic-001 --criteria dependencies
```

**Features:**
- 🎯 Fast list operations
- 🤖 AI-powered prioritization
- 📊 Status filtering
- 🎨 Color-coded output

---

### `autopm agent`

**NEW in v2.1.0** - Direct agent invocation.

Agent management and invocation commands with streaming support.

**Usage:**
```bash
autopm agent <action> [options]
```

**Actions:**

#### `list` - List available agents
```bash
autopm agent list [options]
```

**Options:**
- `--category <category>` - Filter by category (core, languages, frameworks, cloud, devops, data)
- `--team <team>` - Show agents in specific team
- `--json` - Output as JSON

**Examples:**
```bash
# List all agents
autopm agent list

# List cloud agents
autopm agent list --category cloud

# List fullstack team agents
autopm agent list --team fullstack
```

#### `search` - Search agents by keyword
```bash
autopm agent search <query> [options]
```

**Options:**
- `--category <category>` - Limit search to category
- `--verbose` - Show agent descriptions

**Examples:**
```bash
# Search for Kubernetes agents
autopm agent search kubernetes

# Search in cloud category
autopm agent search aws --category cloud

# Verbose output
autopm agent search react --verbose
```

#### `invoke` - Invoke agent with task
```bash
autopm agent invoke <agent-name> <task> [options]
```

**Options:**
- `--stream` - Enable streaming output
- `--context <file>` - Provide additional context file
- `--output <file>` - Save agent response to file

**Examples:**
```bash
# Invoke agent
autopm agent invoke aws-cloud-architect "Design VPC architecture"

# Streaming invocation
autopm agent invoke python-backend-engineer "Create FastAPI endpoint" --stream

# With context file
autopm agent invoke react-frontend-engineer "Build login form" --context requirements.md
```

**Features:**
- 🤖 Direct agent invocation without Claude Code
- 📡 Streaming support for real-time responses
- 🔍 Powerful search capabilities
- 🎨 Color-coded output
- 📋 Context file support

---

## Command Aliases

Many commands have shorter aliases for convenience:

```bash
# Configuration
autopm cfg show          # Same as: autopm config show
autopm cfg set           # Same as: autopm config set
autopm cfg get           # Same as: autopm config get

# Team Management
autopm t list            # Same as: autopm team list
autopm t load            # Same as: autopm team load
autopm t show            # Same as: autopm team show

# MCP Management
autopm m status          # Same as: autopm mcp status
autopm m enable          # Same as: autopm mcp enable
autopm m diagnose        # Same as: autopm mcp diagnose
```

---

## Global Options

These options work with all commands:

```bash
--help, -h              # Show command help
--version, -v           # Show version
--quiet, -q             # Suppress output
--verbose               # Show detailed output
--json                  # Output as JSON
--no-color              # Disable colored output
--config <file>         # Use custom config file
```

**Examples:**
```bash
# Show help for any command
autopm install --help
autopm config set --help

# Quiet mode
autopm install --quiet

# JSON output
autopm config show --json
```

---

## Exit Codes

ClaudeAutoPM uses standard exit codes:

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Configuration error |
| 4 | Provider error |
| 5 | MCP server error |
| 6 | Validation error |

**Usage in scripts:**
```bash
#!/bin/bash

autopm validate
if [ $? -eq 0 ]; then
  echo "Validation successful"
  autopm install
else
  echo "Validation failed"
  exit 1
fi
```

---

## Environment Variables

Commands respect these environment variables:

```bash
# Provider tokens
GITHUB_TOKEN                # GitHub personal access token
AZURE_DEVOPS_PAT           # Azure DevOps PAT

# MCP configuration
OPENAI_API_KEY             # For Context7 MCP server

# Debugging
AUTOPM_DEBUG=1             # Enable debug output
AUTOPM_LOG_LEVEL=verbose   # Set log level
AUTOPM_CONFIG=/path/config # Custom config file location
```

**Examples:**
```bash
# Run with debug output
AUTOPM_DEBUG=1 autopm install

# Use custom config location
AUTOPM_CONFIG=~/my-config.json autopm config show
```

---

## Configuration Files

Commands read from these files:

```bash
.claude/config.json        # Main configuration
.claude/teams.json         # Agent team definitions
.claude/mcp-servers.json   # MCP server configuration
.claude/.env               # Environment variables
.claude-code/config.json   # Claude Code settings
```

---

## Common Workflows

### Initial Setup
```bash
# 1. Install framework
autopm install --preset fullstack

# 2. Configure provider
autopm config set provider github
autopm config set github.owner USERNAME
autopm config set github.repo REPO
export GITHUB_TOKEN=ghp_xxxxx

# 3. Enable MCP
autopm mcp enable context7
autopm mcp setup

# 4. Load team
autopm team load fullstack

# 5. Validate
autopm validate
```

### Daily Usage
```bash
# Check status
autopm validate --quiet

# Switch teams as needed
autopm team load frontend  # Frontend work
autopm team load backend   # Backend work

# Check MCP servers
autopm mcp status
```

### Updating Framework
```bash
# Check current version
autopm --version

# Update npm package
npm update -g claude-autopm

# Update framework files
autopm update

# Validate update
autopm validate
```

### Troubleshooting
```bash
# Full validation with verbose output
autopm validate --verbose

# Diagnose MCP issues
autopm mcp diagnose --verbose

# Test provider connection
autopm config validate --provider-only

# Fix common issues
autopm validate --fix
```

---

## Getting Help

### Command-Line Help
```bash
# General help
autopm --help

# Command-specific help
autopm install --help
autopm config --help
autopm team --help
autopm mcp --help
```

### Documentation
- [Installation Guide](../getting-started/installation.md)
- [Quick Start](../getting-started/quick-start.md)
- [Configuration Guide](config.md)
- [Team Management Guide](team.md)
- [MCP Guide](mcp.md)

### Support
- GitHub Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues
- Discussions: https://github.com/rafeekpro/ClaudeAutoPM/discussions
- Documentation: https://rafeekpro.github.io/ClaudeAutoPM/

---

## Next: Detailed Command Guides

- [Installation & Update Commands](install-update.md)
- [Configuration Commands](config.md)
- [Team Management Commands](team.md)
- [MCP Management Commands](mcp.md)
- [Epic Management Commands](epic.md)
- [Slash Commands Reference](slash-commands.md)
