# Command Reference Overview

ClaudeAutoPM provides 96+ professional CLI commands organized into logical categories. All commands follow a consistent pattern and provide built-in help documentation.

## Command Structure

Commands follow this pattern:

```bash
autopm [category]:[action] [options]
```

Examples:
- `autopm guide` - Launch interactive setup
- `autopm pm:status` - View project status
- `autopm azure:task-new` - Create new Azure task

## Getting Help

Every command supports the `--help` flag:

```bash
# General help
autopm --help

# Command-specific help
autopm guide --help
autopm pm:status --help
```

## Command Categories

### Core Commands

Essential commands for getting started:

| Command | Description |
|---------|------------|
| `guide` | Interactive setup wizard |
| `install` | Install ClaudeAutoPM in project |
| `help` | Display help information |
| `merge` | Merge Claude instructions |
| `setup-env` | Setup environment variables |

### Project Management (pm:)

GitHub-based project management:

| Command | Description |
|---------|------------|
| `pm:init` | Initialize PM system |
| `pm:status` | View project status |
| `pm:sync` | Synchronize all work items |
| `pm:standup` | Generate standup report |
| `pm:next` | Show next task to work on |

### Epic Management

| Command | Description |
|---------|------------|
| `pm:epic-new` | Create new epic |
| `pm:epic-list` | List all epics |
| `pm:epic-show` | Show epic details |
| `pm:epic-start` | Start working on epic |
| `pm:epic-close` | Close completed epic |

### Issue Management

| Command | Description |
|---------|------------|
| `pm:issue-new` | Create new issue |
| `pm:issue-list` | List all issues |
| `pm:issue-show` | Show issue details |
| `pm:issue-start` | Start working on issue |
| `pm:issue-edit` | Edit existing issue |

### PRD Management

| Command | Description |
|---------|------------|
| `pm:prd-new` | Create new PRD |
| `pm:prd-parse` | Parse PRD to epic |
| `pm:prd-list` | List all PRDs |
| `pm:prd-status` | Show PRD status |

### Azure DevOps (azure:)

Azure DevOps integration commands:

| Command | Description |
|---------|------------|
| `azure:init` | Initialize Azure DevOps |
| `azure:status` | View project status |
| `azure:sync-all` | Sync all work items |
| `azure:standup` | Daily standup report |
| `azure:sprint-status` | Sprint overview |

### Task Management

| Command | Description |
|---------|------------|
| `azure:task-new` | Create new task |
| `azure:task-list` | List all tasks |
| `azure:task-show` | Show task details |
| `azure:task-start` | Start working on task |
| `azure:task-close` | Close completed task |

### User Story Management

| Command | Description |
|---------|------------|
| `azure:us-new` | Create user story |
| `azure:us-list` | List user stories |
| `azure:us-show` | Show story details |
| `azure:us-edit` | Edit user story |

### Development Tools

#### Python Commands

| Command | Description |
|---------|------------|
| `python:scaffold` | Scaffold Python API |
| `python:api-scaffold` | Create API structure |
| `python:docs-query` | Query Python docs |

#### React Commands

| Command | Description |
|---------|------------|
| `react:scaffold` | Scaffold React app |
| `react:app-scaffold` | Create app structure |

#### Testing Commands

| Command | Description |
|---------|------------|
| `testing:prime` | Generate test strategy |
| `testing:run` | Run test suites |
| `playwright:test-scaffold` | Create Playwright tests |

### Infrastructure & DevOps

| Command | Description |
|---------|------------|
| `github:workflow` | Manage GitHub Actions |
| `kubernetes:deploy` | Deploy to Kubernetes |
| `cloud:infra-deploy` | Deploy infrastructure |
| `traefik:setup` | Setup Traefik proxy |
| `ssh:security` | SSH security audit |

### AI & Automation

| Command | Description |
|---------|------------|
| `ai:langgraph-workflow` | LangGraph workflows |
| `ai:openai-chat` | OpenAI integration |
| `langgraph:workflow` | Manage workflows |
| `openai:chat` | Chat with GPT models |

### Context & Documentation

| Command | Description |
|---------|------------|
| `context:create` | Create context file |
| `context:prime` | Load AI context |
| `context:update` | Update context |
| `api:documentation` | Generate API docs |
| `user:guide` | Generate user guides |

### Performance & Quality

| Command | Description |
|---------|------------|
| `performance:benchmark` | Run benchmarks |
| `regression:suite` | Run regression tests |
| `codeRabbit` | CodeRabbit review |

## Command Patterns

### Creating Resources

Most creation commands follow this pattern:

```bash
autopm [category]:[resource]-new [name] [description]
```

Examples:
```bash
autopm pm:issue-new "Fix login bug" "Users can't login with email"
autopm azure:task-new "Update API docs" "Add examples to endpoints"
```

### Listing Resources

List commands typically support filters:

```bash
autopm [category]:[resource]-list [--filter=value]
```

Examples:
```bash
autopm pm:issue-list --status=open
autopm azure:task-list --assigned-to=me
```

### Working with Resources

Start/stop/edit patterns:

```bash
autopm [category]:[resource]-start [id]
autopm [category]:[resource]-edit [id] [updates]
autopm [category]:[resource]-close [id]
```

## Global Options

All commands support these global options:

| Option | Description |
|--------|------------|
| `--verbose`, `-v` | Verbose output |
| `--debug` | Debug information |
| `--dry-run` | Preview without changes |
| `--format` | Output format (json, table) |
| `--help`, `-h` | Show help |
| `--version` | Show version |

## Environment Variables

Commands respect these environment variables:

```bash
# Provider tokens
GITHUB_TOKEN
AZURE_DEVOPS_TOKEN

# Project configuration
GITHUB_REPO
AZURE_DEVOPS_ORG
AZURE_DEVOPS_PROJECT

# Behavior
AUTOPM_VERBOSE
AUTOPM_DEBUG
AUTOPM_CONFIG_PATH
```

## Output Formats

Commands support multiple output formats:

### Table Format (Default)

```bash
autopm pm:issue-list
```

```
ID    Title              Status    Assignee
---   ----------------   -------   --------
#12   Fix login bug      Open      @user
#13   Update docs        Closed    @user
```

### JSON Format

```bash
autopm pm:issue-list --format=json
```

```json
[
  {
    "id": 12,
    "title": "Fix login bug",
    "status": "open",
    "assignee": "user"
  }
]
```

### Quiet Format

```bash
autopm pm:issue-list --quiet
```

```
12
13
```

## Command Aliases

Common commands have shorter aliases:

| Alias | Full Command |
|-------|-------------|
| `status` | `pm:status` or `azure:status` |
| `new` | `pm:issue-new` or `azure:task-new` |
| `list` | `pm:issue-list` or `azure:task-list` |
| `sync` | `pm:sync` or `azure:sync-all` |

## Batch Operations

Many commands support batch operations:

```bash
# Close multiple issues
autopm pm:issue-close 12,13,14

# Add label to multiple issues
autopm pm:issue-label bug 12,13,14

# Assign multiple tasks
autopm azure:task-assign @user 45,46,47
```

## Interactive Mode

Some commands offer interactive mode:

```bash
# Interactive issue creation
autopm pm:issue-new --interactive

# Interactive epic planning
autopm pm:epic-new -i
```

## Next Steps

- Learn specific [Core Commands](/commands/guide)
- Explore [Project Management Commands](/commands/pm-init)
- Understand [Azure DevOps Commands](/commands/azure-init)
- Read about [CLI Usage](/commands/cli-usage) patterns