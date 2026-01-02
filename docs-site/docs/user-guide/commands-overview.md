---
title: Commands Overview
description: Complete reference of all ClaudeAutoPM command categories and their usage.
---

# Commands Overview

ClaudeAutoPM provides a comprehensive set of commands organized by function. This guide introduces each command category and helps you understand when to use each one.

## Command Structure

All commands follow a consistent pattern:

```
/category:action [parameters]
```

- **category** - The functional area (pm, azure, testing, etc.)
- **action** - The specific operation to perform
- **parameters** - Optional arguments and flags

## Command Categories

### PM Commands (`/pm:*`)

Core project management commands that work across all providers.

| Command | Description |
|---------|-------------|
| `/pm:init` | Initialize project management in current directory |
| `/pm:status` | Show overall project status |
| `/pm:help` | Display all available PM commands |
| `/pm:next` | Get recommended next task |
| `/pm:standup` | Generate daily standup report |
| `/pm:blocked` | Show all blocked items |
| `/pm:clean` | Clean up completed items |
| `/pm:search` | Search across all work items |
| `/pm:validate` | Validate project configuration |

#### PRD Commands

```bash
# Create a new PRD with interactive brainstorming
/pm:prd-new feature-name

# List all PRDs
/pm:prd-list

# Show PRD details
/pm:prd-show feature-name

# Edit existing PRD
/pm:prd-edit feature-name

# Parse PRD into epic and tasks
/pm:prd-parse feature-name

# Check PRD implementation status
/pm:prd-status feature-name
```

#### Epic Commands

```bash
# List all epics
/pm:epic-list

# Show epic details with tasks
/pm:epic-show epic-name

# Edit epic details
/pm:epic-edit epic-name

# Decompose epic into smaller tasks
/pm:epic-decompose epic-name

# Split epic into multiple epics
/pm:epic-split epic-name --tasks 1,2,3 --new-epic new-name

# Check epic status
/pm:epic-status epic-name

# Create quick one-shot epic without PRD
/pm:epic-oneshot "Quick feature description"
```

#### GitHub-Specific PM Commands

These require the GitHub provider:

```bash
# Start work on an epic
/pm:epic-start epic-name

# Sync epic to GitHub Issues
/pm:epic-sync epic-name

# Refresh epic from GitHub
/pm:epic-refresh epic-name

# Merge epics
/pm:epic-merge source-epic target-epic

# Close completed epic
/pm:epic-close epic-name

# Start issue
/pm:issue-start 123

# Show issue details
/pm:issue-show 123

# Edit issue
/pm:issue-edit 123

# Close issue
/pm:issue-close 123 "Completion comment"

# Analyze issue for approach
/pm:issue-analyze 123

# Sync issue status
/pm:issue-sync 123

# Reopen closed issue
/pm:issue-reopen 123

# Full sync with GitHub
/pm:sync

# Import from external source
/pm:import source-file.json
```

### Azure DevOps Commands (`/azure:*`)

Complete Azure DevOps integration for enterprise workflows.

#### Initialization and Setup

```bash
# Initialize Azure DevOps integration
/azure:init

# Validate configuration
/azure:validate

# View help
/azure:help
```

#### Feature Management

```bash
# List features
/azure:feature-list

# Create new feature
/azure:feature-new feature-title

# Show feature details
/azure:feature-show 123

# Start work on feature
/azure:feature-start 123

# Decompose feature into user stories
/azure:feature-decompose 123
```

#### User Story Management

```bash
# List user stories
/azure:us-list

# Create new user story
/azure:us-new "User story title" --parent 123

# Show user story
/azure:us-show 456

# Edit user story
/azure:us-edit 456

# Check user story status
/azure:us-status 456

# Parse requirements into user story
/azure:us-parse requirements.md
```

#### Task Management

```bash
# List tasks
/azure:task-list

# Create new task
/azure:task-new "Task title" --parent 456

# Show task details
/azure:task-show 789

# Edit task
/azure:task-edit 789

# Start task
/azure:task-start 789

# Close task
/azure:task-close 789

# Reopen task
/azure:task-reopen 789

# Sync task status
/azure:task-sync 789

# Check task status
/azure:task-status 789

# Analyze task complexity
/azure:task-analyze 789
```

#### Sprint and Status

```bash
# View sprint status
/azure:sprint-status

# Daily standup
/azure:standup

# View active work
/azure:active-work

# Get next task
/azure:next-task

# View blocked items
/azure:blocked-items

# Search work items
/azure:search "query"
```

#### Synchronization

```bash
# Sync all work items
/azure:sync-all

# Sync specific work item
/azure:work-item-sync 123

# Import user stories
/azure:import-us stories.md

# Query documentation
/azure:docs-query topic
```

#### Cleanup

```bash
# Clean up completed items
/azure:clean
```

### Context Commands (`/context:*`)

Manage AI context for optimal performance.

```bash
# Create initial context
/context:create

# Prime context with project information
/context:prime

# Update context with recent changes
/context:update
```

### Testing Commands (`/testing:*`)

Test execution and management.

```bash
# Run tests
/testing:run [--watch] [--coverage]

# Prime testing environment
/testing:prime
```

### Playwright Commands (`/playwright:*`)

End-to-end testing with Playwright.

```bash
# Scaffold Playwright tests
/playwright:test-scaffold feature-name
```

### MCP Commands (`/mcp:*`)

Model Context Protocol server management.

```bash
# Set up MCP context sharing
/mcp:context-setup --server=context7

# Refresh documentation from Context7
/mcp:docs-refresh --tech=fastapi
```

### GitHub Commands (`/github:*`)

GitHub-specific operations.

```bash
# Create GitHub workflow
/github:workflow-create ci-pipeline
```

### Infrastructure Commands (`/infrastructure:*`)

Infrastructure setup and security.

```bash
# SSH security audit and setup
/infrastructure:ssh-security

# Traefik reverse proxy setup
/infrastructure:traefik-setup
```

### Kubernetes Commands (`/kubernetes:*`)

Kubernetes deployment and management.

```bash
# Deploy to Kubernetes
/kubernetes:deploy app-name --env production
```

### Cloud Commands (`/cloud:*`)

Cloud infrastructure deployment.

```bash
# Deploy cloud infrastructure
/cloud:infra-deploy --provider aws --region us-east-1
```

### AI Commands (`/ai:*`)

AI integrations and workflows.

```bash
# OpenAI chat integration
/ai:openai-chat

# LangGraph workflow creation
/ai:langgraph-workflow workflow-name
```

### Config Commands (`/config:*`)

Configuration management.

```bash
# Toggle feature flags
/config:toggle-features feature-name
```

### Utility Commands

Special-purpose commands:

```bash
# Re-initialize CLAUDE.md
/re-init

# Process CodeRabbit review
/code-rabbit pr-number

# Custom prompt execution
/prompt "Your prompt here"
```

## Command Patterns

### Common Flags

Most commands support these common patterns:

```bash
# Get help for any command
/pm:epic-start --help

# Force operation without confirmation
/pm:clean --force

# Dry run to preview changes
/pm:sync --dry-run

# Verbose output for debugging
/pm:status --verbose
```

### Parameter Patterns

```bash
# Named parameters
/pm:prd-new my-feature --priority high

# Positional parameters
/pm:issue-close 123 "Completion message"

# Multiple values
/pm:epic-split epic-name --tasks 1,2,3,4
```

## Command Discovery

### Finding Commands

```bash
# Show all PM commands
/pm:help

# Show Azure commands
/azure:help

# Search for commands
/pm:search "sync"
```

### Command Aliases

Some commands have short aliases:

| Full Command | Alias |
|--------------|-------|
| `/pm:status` | Status check |
| `/pm:next` | Next task recommendation |
| `/azure:standup` | Daily standup |

## Provider Selection

Commands are organized by provider:

- **Universal** (`/pm:*`) - Work with any provider
- **GitHub** (`/pm:issue-*`, `/pm:epic-sync`) - GitHub-specific
- **Azure** (`/azure:*`) - Azure DevOps-specific

The system detects your configured provider and enables the appropriate commands.

## Command Execution Flow

When you run a command:

1. **Validation** - Parameters and prerequisites are checked
2. **Context Loading** - Relevant context is loaded
3. **Execution** - The operation is performed
4. **Sync** - Changes are synchronized to provider
5. **Output** - Results are displayed

## Error Handling

Commands provide clear error messages:

```bash
/pm:epic-start nonexistent-epic

# Output:
# Error: Epic 'nonexistent-epic' not found
# Available epics: user-auth, payment-system, dashboard
# Run /pm:epic-list to see all epics
```

## Best Practices

1. **Use `/pm:help` often** - Discover new commands and refresh your memory
2. **Check status before starting** - Run `/pm:status` to understand current state
3. **Validate before sync** - Use `/pm:validate` to catch issues early
4. **Use dry-run for risky operations** - Preview before executing
5. **Keep commands atomic** - Do one thing at a time for clarity

## Next Steps

- Explore [AI Agents](./agents-overview) for automated assistance
- Learn about [MCP Servers](./mcp-servers) for extended capabilities
- Review [Best Practices](./best-practices) for optimal workflows
