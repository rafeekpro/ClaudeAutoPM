# /pm: Commands Documentation

Complete list of available /pm: commands in ClaudeAutoPM framework.

## Table of Contents
- [Core Commands](#core-commands)
- [Issue Management](#issue-management)
- [Epic Management](#epic-management)
- [PRD Management](#prd-management)
- [PR Management](#pr-management)
- [Context Management](#context-management)
- [Project Maintenance](#project-maintenance)
- [Agent Team Management](#agent-team-management-team)
- [MCP Management](#mcp-management)
- [Provider-Specific](#provider-specific)

## Core Commands

### `/pm:init`
Initialize project with PM system
```bash
/pm:init
```

### `/pm:status`
Show comprehensive project status dashboard
```bash
/pm:status
```

### `/pm:next`
Show next priority work item with context
```bash
/pm:next
```

### `/pm:standup`
Generate daily standup report
```bash
/pm:standup
```

### `/pm:help`
Display help and available commands
```bash
/pm:help
```

## Issue Management

### `/pm:issue-start <issue-id>`
Start work on an issue
```bash
/pm:issue-start ISSUE-123
```

### `/pm:issue-show <issue-id>`
Display detailed issue information
```bash
/pm:issue-show ISSUE-123
```

### `/pm:issue-close <issue-id>`
Close/complete an issue
```bash
/pm:issue-close ISSUE-123
pm issue-close ISSUE-123 --complete-tasks
```

### `/pm:issue-edit <issue-id>`
Edit issue details interactively
```bash
/pm:issue-edit ISSUE-123
```

### `/pm:issue-sync`
Sync issue updates to GitHub/Azure
```bash
/pm:issue-sync ISSUE-123
```

### `/pm:in-progress`
List all work in progress
```bash
/pm:in-progress
```

### `/pm:blocked`
Show all blocked issues
```bash
/pm:blocked
```

## Epic Management

### `/pm:epic-list`
List all epics with status
```bash
/pm:epic-list
pm epic-list --status=active
```

### `/pm:epic-show <epic-name>`
Display epic details and progress
```bash
/pm:epic-show feature-auth
```

### `/pm:epic-status`
Show status of all epics
```bash
/pm:epic-status
```

### `/pm:epic-close <epic-name>`
Close/complete an epic
```bash
/pm:epic-close feature-auth
pm epic-close feature-auth --force
pm epic-close feature-auth --complete-all
```

### `/pm:epic-edit <epic-name>`
Edit epic details
```bash
/pm:epic-edit feature-auth
```

### `/pm:epic-decompose <epic-name>`
Break epic into task files
```bash
/pm:epic-decompose feature-auth
```

### `/pm:epic-sync <epic-name>`
Push epic and tasks to GitHub
```bash
/pm:epic-sync feature-auth
```

### `/pm:epic-start <epic-name>`
Start work on epic (creates worktree)
```bash
/pm:epic-start feature-auth
```

## PRD Management

### `/pm:prd-new [prd-name]`
Create new PRD with brainstorming wizard
```bash
/pm:prd-new
pm prd-new feature-auth
```

### `/pm:prd-list`
List all PRDs
```bash
/pm:prd-list
```

### `/pm:prd-status`
Show PRD implementation status
```bash
/pm:prd-status
```

### `/pm:prd-parse <prd-name>`
Convert PRD to technical implementation epic
```bash
/pm:prd-parse feature-auth
pm prd-parse feature-auth --overwrite
```

## PR Management

### `/pm:pr-create <title>`
Create pull request with auto-generated description
```bash
/pm:pr-create "Add authentication feature"
pm pr-create "Fix bug" --draft
pm pr-create "Update docs" --base develop --reviewer teammate
```

Options:
- `-b, --base <branch>` - Base branch (default: main)
- `-d, --draft` - Create as draft PR
- `-a, --assignee <user>` - Assign to user
- `-r, --reviewer <user>` - Request review
- `-l, --label <label>` - Add label
- `-m, --description <text>` - PR description

### `/pm:pr-list`
List pull requests with filtering
```bash
/pm:pr-list
pm pr-list --state open
pm pr-list --mine
pm pr-list --author @username
pm pr-list --label bug
```

Options:
- `-s, --state <state>` - Filter by state (open|closed|merged|all)
- `-a, --author <user>` - Filter by author
- `-m, --mine` - Show only your PRs
- `--assignee <user>` - Filter by assignee
- `-l, --label <label>` - Filter by label
- `-n, --limit <number>` - Limit results

## Context Management

### `/pm:context-create <name>`
Create new context file
```bash
/pm:context-create feature-auth
pm context-create feature-auth --type feature --description "Auth context"
```

### `/pm:context-update <name>`
Update existing context
```bash
/pm:context-update feature-auth --file notes.md
pm context-update feature-auth --content "New info"
pm context-update feature-auth --stdin < data.txt
```

Options:
- `--file <path>` - Update from file
- `--content <text>` - Update with text
- `--stdin` - Read from stdin
- `--mode <mode>` - Update mode (append|replace|merge)

### `/pm:context-prime <name>`
Load context for current work session
```bash
/pm:context-prime feature-auth
pm context-prime --list
pm context-prime feature-auth --dry-run
```

## Project Maintenance

### `/pm:validate`
Validate system integrity
```bash
/pm:validate
pm validate registry
```

### `/pm:search <query>`
Search across all project content
```bash
/pm:search "authentication"
pm search TODO
```

### `/pm:sync`
Comprehensive project synchronization
```bash
/pm:sync              # Sync everything
pm sync git          # Sync only git
pm sync issues       # Sync only issues
pm sync epics        # Sync only epics
pm sync --skip-deps  # Skip dependency check
```

Options:
- `--skip-git` - Skip git sync
- `--skip-issues` - Skip issues sync
- `--skip-epics` - Skip epics sync
- `--skip-deps` - Skip dependencies check
- `--provider=NAME` - Use specific provider

### `/pm:optimize`
Analyze and optimize project structure
```bash
/pm:optimize              # Analyze only
pm optimize --apply      # Apply optimizations
pm optimize --skip-duplicates
```

### `/pm:clean`
Archive completed work and clean project
```bash
/pm:clean                 # Clean with defaults
pm clean --days=7        # Archive items older than 7 days
pm clean --skip-logs     # Skip log cleanup
pm clean --dry-run       # Preview cleanup
pm clean --force         # Skip confirmation
```

Options:
- `--days=N` - Archive items older than N days
- `--skip-issues` - Skip archiving issues
- `--skip-epics` - Skip archiving epics
- `--skip-prds` - Skip archiving PRDs
- `--skip-logs` - Skip cleaning logs
- `--dry-run` - Preview without changes
- `--force` - Clean without confirmation

### `/pm:release`
Create and manage releases
```bash
/pm:release                    # Patch release (1.0.0 -> 1.0.1)
pm release minor              # Minor release (1.0.0 -> 1.1.0)
pm release major              # Major release (1.0.0 -> 2.0.0)
pm release --version 2.0.0    # Specific version
pm release --dry-run          # Preview release
pm release --publish          # Also publish to npm
```

Options:
- `-v, --version <ver>` - Use specific version
- `-y, --yes` - Skip confirmation
- `--dry-run` - Preview without changes
- `--no-push` - Don't push to remote
- `--no-github` - Don't create GitHub release
- `--publish` - Publish to npm
- `--allow-dirty` - Allow uncommitted changes

## Agent Team Management (team)

### `autopm team list`
Display all available agent teams
```bash
autopm team list
```

**Example output:**
```
📋 Available Teams:

  ▶️  base:
    Core agents available in all teams.
    Direct agents: 4

  ▶️  devops:
    Team for CI/CD, containerization, and infrastructure tasks.
    ↳ Inherits from: base
    Direct agents: 5

  ▶️  python_backend:
    Team specializing in Python backend development.
    ↳ Inherits from: base
    Direct agents: 5
```

### `autopm team load <name>`
Load selected agent team and update CLAUDE.md
```bash
# Load DevOps team
autopm team load devops

# Load Python Backend team
autopm team load python_backend

# Load Fullstack team (inherits from frontend and python_backend)
autopm team load fullstack
```

**Features:**
- Resolves agents from base teams (inheritance)
- Updates CLAUDE.md file with team agents list
- Saves active team in `.claude/active_team.txt`
- Displays summary of loaded agents

### `autopm team current`
Display currently active agent team
```bash
autopm team current
```

**Example output:**
```
✅ Current active team: devops
```

or when no team is active:
```
⚠️  No team currently active
```

**Available teams:**
- `base` - Core agents (code-analyzer, file-analyzer, test-runner, agent-manager)
- `devops` - CI/CD and infrastructure (Docker, Kubernetes, GitHub Operations, Azure DevOps, Terraform)
- `python_backend` - Python backend (FastAPI, Flask, PostgreSQL, MongoDB)
- `frontend` - JavaScript/TypeScript frontend (React, JavaScript, E2E testing, UX, TailwindCSS)
- `fullstack` - Full stack (inherits from frontend and python_backend)

**Team configuration:**
Teams are defined in `.claude/teams.json` file. You can add custom teams or modify existing ones.

## MCP Management

ClaudeAutoPM provides comprehensive MCP (Model Context Protocol) management commands for configuring agent-to-tool integration. These commands help you discover, configure, and monitor MCP servers used by agents.

### `autopm mcp agents`
List all agents using MCP servers
```bash
# List all agents with their MCP servers
autopm mcp agents

# Group agents by MCP server
autopm mcp agents --by-server
```

**Example output:**
```
🤖 Agents Using MCP

✅ react-frontend-engineer
   └─ context7-docs

✅ python-backend-engineer
   └─ context7-docs
   └─ sqlite-mcp

📊 Summary:
   Total agents: 53
   Using MCP: 39 (74%)
```

### `autopm mcp agent <name>`
Show MCP configuration for specific agent
```bash
# View MCP servers used by an agent
autopm mcp agent react-frontend-engineer

# Check agent's required environment variables
autopm mcp agent python-backend-engineer
```

**Example output:**
```
🤖 Agent: react-frontend-engineer
==================================================

📡 MCP Servers (1):

✅ Active context7-docs
    Category: documentation
    Description: Context7 documentation server
    Environment Variables:
      - CONTEXT7_API_KEY
```

### `autopm mcp usage`
Display MCP usage statistics
```bash
autopm mcp usage
```

Shows which MCP servers are most used and by which agents.

### `autopm mcp tree`
Show agent-MCP dependency tree
```bash
autopm mcp tree
```

**Example output:**
```
🌳 Agent → MCP Dependency Tree

📁 frontend
├─ react-frontend-engineer ✅
│  └─ context7-docs
└─ vue-frontend-engineer ✅
   └─ context7-docs

📁 backend
├─ python-backend-engineer ✅
│  ├─ context7-docs
│  └─ sqlite-mcp
```

### `autopm mcp list`
List all available MCP servers
```bash
autopm mcp list
```

Shows all MCP servers with their status (active/inactive) and metadata.

### `autopm mcp info <server>`
Show detailed information about MCP server
```bash
autopm mcp info context7-docs
```

### `autopm mcp enable <server>`
Enable MCP server in project
```bash
autopm mcp enable context7-docs
```

### `autopm mcp disable <server>`
Disable MCP server in project
```bash
autopm mcp disable context7-docs
```

### `autopm mcp sync`
Sync MCP configuration to `.claude/mcp-servers.json`
```bash
autopm mcp sync
```

This command generates the MCP configuration file that Claude Code reads when starting.

### `autopm mcp setup`
Interactive API key setup wizard
```bash
autopm mcp setup
```

Guides you through configuring required environment variables for enabled MCP servers.

### `autopm mcp check`
Quick MCP configuration check
```bash
autopm mcp check
```

Quickly validates that all MCP servers required by your agents are properly configured. This command:
- Analyzes which agents are using MCP servers
- Checks if required servers are enabled
- Verifies environment variables are configured
- Provides actionable recommendations

**Example output when configuration is missing:**
```
🔍 MCP Configuration Check

📊 Overview:
   Agents using MCP: 39/53
   MCP servers in use: 1

⚠️  Configuration Issues:

⚠️  MCP server 'context7-docs' is used by agents but NOT enabled

🔴 Disabled Servers (used by agents):

   • context7-docs
     Category: documentation
     Description: Context7 documentation server

💡 Recommendations:

   Run: autopm mcp enable context7-docs

🔧 Quick Fix:
   autopm mcp enable context7-docs
   autopm mcp sync
```

**Example output when everything is configured:**
```
🔍 MCP Configuration Check

📊 Overview:
   Agents using MCP: 39/53
   MCP servers in use: 1

✅ All required MCP servers are properly configured!
```

### `autopm mcp diagnose`
Run comprehensive MCP diagnostics
```bash
autopm mcp diagnose
```

**Checks performed:**
- ✅ `.claude` directory structure
- ✅ `config.json` validity
- ✅ MCP server definitions
- ✅ Environment variables
- ✅ `mcp-servers.json` validity
- ✅ Agents directory

**Example output:**
```
🔍 Running MCP Diagnostics...

📋 Diagnostic Results:

✅ .claude directory exists
✅ config.json exists and is valid
✅ environment variables configured
⚠️ Environment variable CONTEXT7_API_KEY not configured

🏥 Overall Health: WARNING
```

### `autopm mcp test <server>`
Test MCP server connection
```bash
autopm mcp test context7-docs
```

Validates server configuration and connectivity.

### `autopm mcp status`
Show status of all MCP servers
```bash
autopm mcp status
```

**Example output:**
```
📊 MCP Servers Status

✅ context7-docs
    Category: documentation
    Status: Enabled
    Used by: 39 agents
    Environment:
      ✅ CONTEXT7_API_KEY

⚪ github-mcp
    Category: integration
    Status: Disabled
    Used by: 0 agents

📈 Summary:
   Total servers: 6
   Enabled: 1
   Disabled: 5
```

### MCP Workflow Example

```bash
# 1. Check which agents use MCP
autopm mcp agents

# 2. Enable required servers
autopm mcp enable context7-docs
autopm mcp enable github-mcp

# 3. Configure API keys
autopm mcp setup

# 4. Sync configuration
autopm mcp sync

# 5. Quick validation check
autopm mcp check

# 6. Comprehensive diagnostics (if needed)
autopm mcp diagnose
autopm mcp status

# 7. Test connections
autopm mcp test context7-docs
```

## Provider-Specific

### Azure DevOps
Commands automatically detect Azure DevOps projects:
- Issue operations integrate with Azure Boards
- Epic sync pushes to Azure Repos
- Work items sync with Azure DevOps

### GitHub
Commands automatically detect GitHub projects:
- Issue operations integrate with GitHub Issues
- Epic sync creates GitHub Issues
- PR commands use GitHub CLI

## Command Patterns

### Naming Convention
- `resource-action` format (e.g., `issue-start`, `epic-close`)
- Transitioning to `resource:action` format in future

### Common Options
Most commands support:
- `--help` - Show command help
- `--dry-run` - Preview without making changes
- `--force` - Skip confirmations
- `--provider=NAME` - Override provider detection

### Exit Codes
- `0` - Success
- `1` - Error
- `2` - User cancelled

## Environment Variables

### Provider Configuration
- `AZURE_DEVOPS_ORG` - Azure DevOps organization
- `GITHUB_TOKEN` - GitHub authentication token
- `EDITOR` - Default editor for edit commands

### PM Configuration
- `PM_PROVIDER` - Override provider detection
- `PM_NO_COLOR` - Disable colored output
- `PM_QUIET` - Reduce output verbosity

## Examples

### Daily Workflow
```bash
# Start your day
pm standup           # See daily summary
pm next              # Get next priority task
pm issue-start TASK-123

# During work
pm status            # Check progress
pm blocked           # See blockers
pm issue-show TASK-123

# End of day
pm issue-close TASK-123
pm sync              # Sync everything
```

### Epic Development
```bash
# Create and develop epic
pm prd-new feature-x         # Create PRD
pm prd-parse feature-x        # Convert to epic
pm epic-decompose feature-x   # Break into tasks
pm epic-sync feature-x        # Push to GitHub
pm epic-start feature-x       # Start work
```

### Release Process
```bash
# Prepare release
pm validate          # Check integrity
pm optimize          # Optimize project
pm test              # Run tests

# Create release
pm release minor     # Bump version
pm pr-create "Release v1.9.0"
```

## Tips

1. **Use tab completion** - Most commands support bash completion
2. **Chain commands** - Many commands work well together
3. **Check status regularly** - `/pm:status` gives full overview
4. **Use dry-run** - Test commands safely with `--dry-run`
5. **Leverage providers** - Commands auto-detect Azure/GitHub

## Troubleshooting

### Command not found
```bash
# Ensure pm is in PATH
which pm

# Or use full path
~/.autopm/bin/pm <command>
```

### Provider not detected
```bash
# Force provider
pm issue-start TASK-123 --provider=github
```

### Authentication issues
```bash
# GitHub
gh auth login

# Azure
az login
```

## Contributing

To add new commands:
1. Create script in `autopm/.claude/scripts/pm/`
2. Add command definition in `autopm/.claude/commands/pm/`
3. Write tests in `test/jest-tests/`
4. Update this documentation

---

*Last updated: 2025-09-27*
*Version: 1.9.2*