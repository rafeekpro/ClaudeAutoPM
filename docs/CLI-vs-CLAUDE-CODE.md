# CLI vs Claude Code Command Separation

## Overview

ClaudeAutoPM provides two distinct interfaces for different types of operations:

1. **`autopm` CLI** - Non-AI utility commands for setup and configuration
2. **Claude Code `/pm:*` commands** - AI-powered project management operations

This separation ensures that simple utility tasks don't require AI, while complex PM operations leverage Claude's intelligence.

---

## 🔧 CLI Commands (Non-AI Utilities)

These commands run **outside Claude Code** and don't require AI processing.

### Installation & Updates
```bash
autopm install                    # Install framework in project
autopm update                     # Update to latest version
autopm validate                   # Validate installation
```

**Purpose:** Framework setup and maintenance
**When to use:** Before opening Claude Code, during updates
**AI Required:** ❌ No

---

### Configuration Management
```bash
autopm config show                # Display current configuration
autopm config set provider github # Set PM provider
autopm config validate            # Check configuration validity
autopm config switch azure        # Quick switch between providers
```

**Purpose:** Configure GitHub/Azure DevOps integration
**When to use:** Initial setup, switching projects
**AI Required:** ❌ No

---

### Team Management
```bash
autopm team list                  # List available agent teams
autopm team load fullstack        # Load agent team
autopm team current               # Show active team
```

**Purpose:** Load specialized agent teams for different tech stacks
**When to use:** Starting new project, switching focus areas
**AI Required:** ❌ No

---

### MCP Server Management
```bash
autopm mcp list                   # List MCP servers
autopm mcp install context7       # Install documentation server
autopm mcp enable context7        # Enable MCP server
autopm mcp setup                  # Interactive API key setup
autopm mcp diagnose               # Run diagnostics
```

**Purpose:** Manage Model Context Protocol integrations
**When to use:** Adding documentation sources, debugging MCP
**AI Required:** ❌ No

---

### Epic Status (Read-Only)
```bash
autopm epic list                  # List all epics
autopm epic status <name>         # Show epic progress
autopm epic breakdown <name>      # Show task breakdown
```

**Purpose:** Quick status checks outside Claude Code
**When to use:** CI/CD pipelines, stand-ups, status reports
**AI Required:** ❌ No
**Note:** ⚠️ **Read-only** - Cannot create/modify epics

---

## 🤖 Claude Code Commands (AI-Powered)

These commands run **inside Claude Code** and leverage AI for intelligent operations.

### PRD Management
```bash
/pm:prd-new <name>                # Create Product Requirements Document
/pm:prd-parse <name>              # Parse PRD structure
/pm:prd-edit <name>               # Edit existing PRD
/pm:prd-list                      # List all PRDs
```

**Purpose:** Create and manage product requirements
**When to use:** Starting new features, defining scope
**AI Required:** ✅ Yes - Generates structured PRDs with AI assistance

---

### Epic Management
```bash
/pm:epic-decompose <name>         # Break PRD into epic + tasks
/pm:epic-split <name>             # Split complex PRD into multiple epics
/pm:epic-sync <name>              # Sync epic with GitHub/Azure DevOps
/pm:epic-edit <name>              # Modify epic structure
```

**Purpose:** Transform PRDs into actionable work items
**When to use:** After PRD creation, before development starts
**AI Required:** ✅ Yes - Intelligent task breakdown and estimation

---

### Issue/Task Management
```bash
/pm:issue-start <id>              # Start working on task
/pm:issue-close <id>              # Complete task
/pm:issue-show <id>               # View task details
/pm:next                          # Get next priority task
```

**Purpose:** Daily development workflow
**When to use:** During active development
**AI Required:** ✅ Yes - Smart task prioritization and context

---

### Workflow Intelligence
```bash
/pm:what-next                     # AI suggests next best action
/pm:status                        # Project health overview
/pm:standup                       # Generate standup summary
/pm:search <keyword>              # Intelligent search across PRDs/epics
```

**Purpose:** AI-powered project insights
**When to use:** Planning sessions, progress reviews
**AI Required:** ✅ Yes - Analyzes project state and suggests actions

---

## 🎯 Decision Matrix

### When to use CLI (`autopm`)

| Scenario | Command | Why CLI? |
|----------|---------|----------|
| First-time setup | `autopm install` | One-time framework installation |
| Configure GitHub | `autopm config set provider github` | Simple JSON config update |
| Load frontend team | `autopm team load frontend` | File operations, no AI needed |
| Check epic status | `autopm epic status auth` | Read-only data display |
| Install MCP server | `autopm mcp install context7` | Package management |

**Rule of thumb:** Use CLI for **setup, configuration, and read-only utilities**

---

### When to use Claude Code (`/pm:*`)

| Scenario | Command | Why Claude Code? |
|----------|---------|------------------|
| Create PRD | `/pm:prd-new user-auth` | Needs AI to generate structure |
| Break down feature | `/pm:epic-decompose user-auth` | Requires intelligent task breakdown |
| Prioritize work | `/pm:next` | AI analyzes context and dependencies |
| Generate standup | `/pm:standup` | AI summarizes progress intelligently |
| Search documentation | `/pm:search authentication` | Semantic search across docs |

**Rule of thumb:** Use Claude Code for **creation, modification, and intelligent analysis**

---

## 🚀 Typical Workflow

### 1. Initial Setup (CLI)
```bash
# Outside Claude Code
autopm install
autopm config set provider github
autopm config set github.owner myusername
autopm config set github.repo myproject
export GITHUB_TOKEN=ghp_xxx
autopm team load fullstack
autopm mcp enable context7
```

### 2. Development (Claude Code)
```bash
# Inside Claude Code
/pm:prd-new user-authentication
/pm:prd-parse user-authentication
/pm:epic-decompose user-authentication
/pm:epic-sync user-authentication
/pm:next
/pm:issue-start AUTH-001
# ... coding ...
/pm:issue-close AUTH-001
/pm:standup
```

### 3. Status Checks (CLI or Claude Code)
```bash
# Quick check from terminal
autopm epic status user-authentication

# Or detailed analysis in Claude Code
/pm:status
```

---

## 📋 Summary

### CLI (`autopm`) - Utility Belt
- ✅ Fast, lightweight operations
- ✅ No AI overhead
- ✅ Scriptable in CI/CD
- ✅ Works without Claude Code
- ❌ Cannot create/modify work items
- ❌ No intelligent analysis

### Claude Code (`/pm:*`) - AI Brain
- ✅ Intelligent work breakdown
- ✅ Context-aware suggestions
- ✅ Natural language processing
- ✅ Deep project analysis
- ❌ Requires Claude Code session
- ❌ Higher latency for complex ops

---

## 🎓 Best Practices

1. **Use CLI for setup** - Configure once, develop many times
2. **Use Claude Code for PM work** - Let AI handle complex decisions
3. **Use CLI in scripts** - Automate status checks in CI/CD
4. **Use Claude Code interactively** - Human + AI collaboration
5. **Don't mix** - CLI can't create epics, Claude Code shouldn't manage config

---

## ⚠️ Common Mistakes

### ❌ Wrong: Trying to create epic via CLI
```bash
autopm epic create user-auth  # This doesn't exist!
```

### ✅ Correct: Use Claude Code for creation
```bash
# Inside Claude Code
/pm:epic-decompose user-auth
```

---

### ❌ Wrong: Configuring provider in Claude Code
```bash
/pm:config set provider github  # Inefficient, uses AI for simple task
```

### ✅ Correct: Use CLI for configuration
```bash
autopm config set provider github
```

---

## 🔄 Migration from Old Approach

If you were using standalone CLI commands for PM operations:

### Before (Deprecated)
```bash
autopm prd new feature          # Used to work
autopm epic decompose feature   # Used to work
autopm issue start 123          # Used to work
```

### After (Current)
```bash
# Simple utilities stay in CLI
autopm config show
autopm team load frontend
autopm epic status feature      # Read-only

# PM operations move to Claude Code
/pm:prd-new feature
/pm:epic-decompose feature
/pm:issue-start 123
```

**Why the change?**
- PM operations need AI intelligence
- Running AI outside Claude Code duplicates context
- Simpler architecture: utilities in CLI, intelligence in Claude
- Better user experience: right tool for the job

---

## 📚 Additional Resources

- **CLI Reference:** `autopm --help`
- **Claude Code Commands:** `/pm:help` inside Claude Code
- **Configuration Guide:** `docs/CONFIGURATION.md`
- **Agent Teams:** `autopm/.claude/agents/AGENT-REGISTRY.md`
