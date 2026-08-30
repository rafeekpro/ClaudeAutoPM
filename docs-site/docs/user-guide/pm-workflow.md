---
title: PM Workflow
description: Complete project management workflow using ClaudeAutoPM v4.0.0 with local, GitHub, and Azure providers.
---

# PM Workflow

This guide walks through the complete project management workflow in ClaudeAutoPM, covering all three providers: local (default), GitHub, and Azure DevOps.

## The Development Lifecycle

```
PRD (Product Requirements Document)
    ↓
Epic (Technical Breakdown)
    ↓
Tasks (Atomic Work Units)
    ↓
Issues (Local / GitHub / Azure)
    ↓
Development & Code
    ↓
Completion & Sync
```

Each stage builds on the previous one, maintaining traceability from requirements to implementation.

## Providers

ClaudeAutoPM supports three issue tracking providers. The active provider is set during installation and stored in `.claude/config.json`.

| Provider | Scenario | Requires | Storage |
|----------|----------|----------|---------|
| **local** | lite | Nothing | `.claude/issues/` |
| **github** | github, docker, full, performance | `gh` CLI | GitHub Issues |
| **azure** | azure, full-azure | `az` CLI | Azure DevOps Work Items |

### Switching Providers

Re-run installation with a different scenario:

```bash
# Switch from local to GitHub
autopm install --scenario=github

# Add Azure alongside GitHub
autopm install --scenario=full-azure
```

## Local Issue Tracking (Default)

The local provider works without any external service. Issues are stored as files.

### Creating Local Issues

```bash
# In Claude Code:
/pm:prd-new user-authentication
/pm:prd-parse user-authentication
/pm:epic-decompose user-authentication    # Breaks epic into tasks (local files)
```

### Local Issue Commands

```bash
/pm:issue-start 1      # Start work on local issue #1
/pm:issue-show 1       # View issue details
/pm:issue-close 1      # Close completed issue
/pm:status              # View all issues and progress
```

Note: `/pm:epic-sync` and `/pm:issue-*` commands that interact with GitHub require the GitHub plugin (scenarios: github, docker, full, performance). The lite scenario uses local-only commands.

Local issues support the full workflow (create, list, show, start, close) without GitHub or Azure credentials. This is ideal for:

- Solo developers who do not need external sync
- Learning ClaudeAutoPM before connecting to a provider
- Offline development
- Quick prototyping

### Upgrading from Local to GitHub

When you are ready to sync with GitHub:

```bash
# Re-install with GitHub scenario
autopm install --scenario=github

# Then sync existing epics
/pm:epic-sync user-authentication
```

Existing local issues are preserved. The sync command creates corresponding GitHub Issues.

## Creating a PRD

```bash
/pm:prd-new user-authentication
```

This launches an interactive session to define:

- Feature overview, user stories, technical requirements
- Success criteria and dependencies

PRDs are stored in `.claude/prds/` with YAML frontmatter:

```markdown
---
name: user-authentication
status: backlog
created: 2024-01-15T10:30:00Z
updated: 2024-01-15T10:30:00Z
---

# User Authentication System
...
```

### Managing PRDs

```bash
/pm:prd-list                          # List all PRDs
/pm:prd-show user-authentication      # Show details
/pm:prd-edit user-authentication      # Edit
/pm:prd-status user-authentication    # Check status
```

## Parsing PRD to Epic

```bash
/pm:prd-parse user-authentication
```

This analyzes the PRD and creates:

1. An epic file in `.claude/epics/`
2. Individual task files in `.claude/epics/user-authentication/`
3. Effort estimates and dependency mapping

## Starting Work on an Epic

```bash
/pm:epic-start user-authentication
```

This command:

1. Changes epic status to `in-progress`
2. Creates a feature branch from main
3. Syncs to the active provider (local, GitHub, or Azure)
4. Loads context for development
5. Suggests the first task

### Syncing with Providers

```bash
# Sync to active provider (auto-detected)
/pm:epic-sync user-authentication

# View sync status
/pm:status
```

**With GitHub provider**: Each task becomes a GitHub Issue with labels, description, and acceptance criteria.

**With Azure provider**: Tasks become Azure DevOps work items with sprint assignment.

**With local provider**: Tasks are stored as local issue files.

## Working on Tasks

### Finding Your Next Task

```bash
/pm:next            # Get recommended next task
/pm:in-progress     # See all in-progress items
/pm:blocked         # View blocked items
```

### Starting a Task

```bash
/pm:issue-start 123
```

This assigns the issue, changes status to `in-progress`, creates a working branch, and loads context.

### Completing a Task

```bash
/pm:issue-close 123 "Implemented JWT tokens with full test coverage"
```

The system automatically updates the local task status, syncs completion to the active provider, and updates epic progress.

## Tracking Progress

### Project Status

```bash
/pm:status
```

Shows current sprint information, open vs completed tasks, in-progress work, blocked items, and epic progress.

### Daily Standup

```bash
/pm:standup
```

Generates a formatted report with yesterday's completions, today's plan, and blockers.

### Epic Progress

```bash
/pm:epic-show user-authentication
/pm:epic-status user-authentication
```

## Epic Lifecycle

```bash
/pm:epic-refresh user-authentication    # Sync state with provider
/pm:epic-split user-authentication --tasks 1,2,3 --new-epic auth-core
/pm:epic-merge small-auth-epic user-authentication
/pm:epic-close user-authentication      # Close when all tasks done
```

## Complete Workflow Example

### With Local Provider (Lite)

```bash
autopm install --scenario=lite

/pm:init
/pm:prd-new payment-integration
/pm:prd-parse payment-integration
/pm:epic-decompose payment-integration
/pm:epic-start payment-integration
/pm:issue-start 1
# ... develop ...
/pm:issue-close 1 "Payment SDK integrated"
/pm:next
# ... continue until done ...
/pm:epic-close payment-integration
```

### With GitHub Provider

```bash
autopm install --scenario=github

/pm:init                                   # Configures GitHub CLI
/pm:prd-new payment-integration
/pm:prd-parse payment-integration
/pm:epic-sync payment-integration          # Creates GitHub Issues
/pm:epic-start payment-integration
/pm:issue-start 201                        # GitHub issue #201
/pm:issue-close 201 "Payment SDK integrated"
/pm:next
/pm:epic-close payment-integration
```

### With Azure Provider

```bash
autopm install --scenario=azure

/pm:init
/pm:prd-new payment-integration
/pm:prd-parse payment-integration
/azure:feature-new payment-integration     # Azure Feature
/azure:sync-all                            # Azure Work Items
/pm:epic-start payment-integration
# ... develop ...
/pm:epic-close payment-integration
```

## Provider-Specific Notes

### Local Provider
- No external service required
- Issues stored in `.claude/issues/`
- Full workflow support (create, list, show, start, close)
- No authentication needed

### GitHub Provider
- Issues created in your repository
- Labels group issues by epic
- Milestones can track releases
- Pull requests link to issues automatically
- Requires `gh` CLI authenticated

### Azure DevOps Provider
- Features map to Azure Features
- User Stories contain task items
- Work items track in sprints
- Boards update automatically
- Requires `az` CLI authenticated
- Decoupled from Docker/Full scenarios (use `azure` or `full-azure` scenario)

## Best Practices

1. **Start with local** - Use lite scenario to learn the workflow before connecting to GitHub/Azure
2. **Write detailed PRDs** - Better requirements produce better generated tasks
3. **Keep tasks atomic** - Each task should be completable in a day or less
4. **Update regularly** - Sync status to keep everything accurate
5. **Use standup reports** - They help you and your team stay aligned
6. **Close when done** - Completed epics help track velocity

## Next Steps

- [Available Commands](./commands-overview) - Full command reference
- [AI Agents](/agents/selection-guide) - Agent selection guide
- [Installation](/getting-started/installation) - Change scenarios
