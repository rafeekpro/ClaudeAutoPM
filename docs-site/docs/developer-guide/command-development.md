---
title: Command Development
description: Guide to creating commands for ClaudeAutoPM with proper structure, tools, and output formats
---

# Command Development

Commands are user-invokable actions that Claude executes. This guide covers how to create effective commands with proper structure, tool permissions, and output formats.

## Command Fundamentals

### What is a Command?

A command is a markdown file that instructs Claude how to perform a specific task. Commands:
- Define what tools Claude can use
- Provide step-by-step instructions
- Specify input arguments and output formats
- Handle errors and edge cases

### Command Naming

Commands use a namespace pattern:

```
/namespace:action
/namespace:entity-action
```

Examples:
- `/pm:init` - Project management initialization
- `/pm:epic-list` - List epics
- `/testing:run` - Run tests
- `/context:create` - Create context documentation

## Command File Structure

Every command follows this structure:

```markdown
---
allowed-tools: Bash, Read, Write, LS
---

# Command Name

Brief description of what this command does.

## Usage

```
/namespace:command [arguments]
```

## Quick Check

[Prerequisites validation]

## Instructions

[Step-by-step execution]

## Error Handling

[Common issues and solutions]

## Output

[Expected output format]

## Examples

[Usage examples]

$ARGUMENTS
```

## Required Sections

### 1. Frontmatter (MANDATORY)

Define allowed tools:

```yaml
---
allowed-tools: Bash, Read, Write, LS
---
```

**Common Tool Combinations:**

| Use Case | Tools |
|----------|-------|
| Read-only | `Read, LS, Glob` |
| File operations | `Read, Write, LS, Edit` |
| With GitHub | `Bash, Read, Write, LS` |
| Full access | `Bash, Read, Write, Edit, LS, Glob, Grep` |
| Complex analysis | `Read, Write, LS, Task` |

### 2. Title and Description

Clear, concise explanation:

```markdown
# Epic List

List all epics in the current project with their status and progress.
```

### 3. Usage Section

Show the command syntax:

```markdown
## Usage

```
/pm:epic-list [--status STATUS] [--format FORMAT]
```

### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--status` | No | all | Filter by status (backlog, in-progress, completed) |
| `--format` | No | table | Output format (table, json, markdown) |
```

### 4. Quick Check Section

Validate prerequisites (minimal checks only):

```markdown
## Quick Check

```bash
# Verify PM is initialized
test -d .pm || echo "PM not initialized. Run: /pm:init"

# Verify required files exist
test -f .pm/config.json || echo "Missing config. Run: /pm:init"
```

**Principles:**
- Check only critical prerequisites
- Trust the system (do not over-validate)
- Provide exact fix commands
```

### 5. Instructions Section

Step-by-step execution guide:

```markdown
## Instructions

### 1. Load Configuration

Read the PM configuration:
```bash
cat .pm/config.json
```

### 2. Find Epic Files

Locate all epic files:
```bash
ls -la .pm/epics/*.md
```

### 3. Parse Epic Data

For each epic file:
1. Read the frontmatter
2. Extract: name, status, progress, tasks
3. Calculate completion percentage

### 4. Format Output

Format according to requested format:
- **table**: ASCII table with columns
- **json**: JSON array of epic objects
- **markdown**: Markdown list with details
```

### 6. Error Handling Section

Document common issues:

```markdown
## Error Handling

**Common Issues:**

| Error | Solution |
|-------|----------|
| "PM not initialized" | Run `/pm:init` first |
| "No epics found" | Create an epic with `/pm:epic-create` |
| "Permission denied" | Check file permissions on .pm/ |

**Recovery:**
- If file is corrupted, restore from git
- If state is inconsistent, run `/pm:validate`
```

### 7. Output Section

Define expected output:

```markdown
## Output

### Success (table format)

```
Epics (3 found):

| Name           | Status      | Progress | Tasks |
|----------------|-------------|----------|-------|
| authentication | in-progress | 60%      | 5/8   |
| dashboard      | backlog     | 0%       | 0/12  |
| notifications  | completed   | 100%     | 6/6   |

Next: /pm:epic-show authentication
```

### Success (json format)

```json
[
  {
    "name": "authentication",
    "status": "in-progress",
    "progress": 60,
    "tasks": { "completed": 5, "total": 8 }
  }
]
```

### No Results

```
No epics found.
Create one with: /pm:epic-create <name>
```
```

### 8. Examples Section

Show practical usage:

```markdown
## Examples

### List all epics

```
/pm:epic-list
```

### Filter by status

```
/pm:epic-list --status in-progress
```

### JSON output for scripting

```
/pm:epic-list --format json
```

### Combined filters

```
/pm:epic-list --status backlog --format markdown
```
```

### 9. Arguments Marker

End with `$ARGUMENTS` for Claude to parse user input:

```markdown
$ARGUMENTS
```

## Output Format Standards

Follow these patterns for consistent output:

### Success Output

```markdown
[Action] complete
  - [Key result 1]
  - [Key result 2]
Next: [Single suggested action]
```

### Error Output

```markdown
[What failed]: [Exact solution]
```

### List Output

```markdown
[Count] [items] found:
- [item 1]: [key detail]
- [item 2]: [key detail]
```

### Progress Output

```markdown
[Action]... [current]/[total]
```

### Status Indicators

Use sparingly:
- Success: Use only for final success
- Error: Always include solution
- Warning: Only if action needed
- No emoji for normal output

## Command Design Principles

### 1. Fail Fast

Check critical prerequisites, then proceed:

```markdown
## Quick Check

```bash
# Only check what's essential
test -d .pm || exit 1
```

Do NOT:
- Check file permissions preemptively
- Validate every possible input
- Check internet connectivity
- Verify tool installation (assume it works)
```

### 2. Trust the System

Do not over-validate:

```markdown
# Good - trust gh is authenticated
gh issue list

# Bad - unnecessary pre-check
gh auth status && gh issue list
```

### 3. Clear Errors

When something fails, say exactly what and how to fix:

```markdown
# Good
"Epic not found: Run /pm:prd-parse feature-name"

# Bad
"Error: Something went wrong"
```

### 4. Minimal Output

Show what matters, skip decoration:

```markdown
# Good
Done: 3 files created

# Bad
Starting operation...
Validating prerequisites...
Step 1 complete
Step 2 complete
Statistics: ...
Tips: ...
Completed!
```

### 5. Smart Defaults

Proceed with sensible defaults:

```markdown
# Good - use defaults
/pm:epic-list  # Shows all epics, table format

# Bad - require many arguments
/pm:epic-list --status all --format table --sort name --limit 50
```

## Documentation Queries (Required)

Every command MUST include Context7 documentation queries:

```markdown
## Required Documentation Access

**MANDATORY:** Before executing, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/agile/epic-management` - Epic lifecycle
- `mcp://context7/project-management/tracking` - Progress tracking

**Why This is Required:**
- Ensures workflows follow industry best practices
- Applies proven methodologies
- Validates operations against current standards
```

## Tool Usage Patterns

### Reading Files

```markdown
## Instructions

Read the configuration file:
```bash
cat .pm/config.json
```

Or use Read tool for structured access.
```

### Writing Files

```markdown
## Instructions

Write the output file:
```bash
echo '{"status": "complete"}' > .pm/status.json
```

Or use Write tool for new files, Edit tool for modifications.
```

### Shell Operations

```markdown
## Instructions

Execute the deployment:
```bash
npm run deploy
```

Note: Bash tool captures output for analysis.
```

### GitHub Operations

```markdown
## Instructions

Create the issue:
```bash
gh issue create --title "Epic: authentication" --body-file .pm/epics/authentication.md
```

Trust gh CLI is authenticated. Handle failure on error.
```

### Agent Delegation

For complex analysis, delegate to agents:

```markdown
## Instructions

For code analysis, delegate to code-analyzer:

Use Task tool:
- Agent: code-analyzer
- Prompt: "Analyze the epic implementation for issues"

Wait for agent response before proceeding.
```

## Complete Example: epic-show

```markdown
---
allowed-tools: Read, LS, Glob
---

# Epic Show

Display detailed information about a specific epic.

## Usage

```
/pm:epic-show <epic-name>
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `epic-name` | Yes | Name of the epic to display |

## Required Documentation Access

**MANDATORY:** Before executing, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/agile/epics` - Epic management best practices
- `mcp://context7/project-management/status-tracking` - Status tracking

## Quick Check

```bash
test -d .pm/epics || echo "No epics found. Run /pm:prd-parse first"
```

## Instructions

### 1. Locate Epic File

Find the epic file:
```bash
ls .pm/epics/${EPIC_NAME}.md
```

If not found, list available epics:
```bash
ls .pm/epics/
```

### 2. Read Epic Content

Read the epic file:
```bash
cat .pm/epics/${EPIC_NAME}.md
```

### 3. Parse Frontmatter

Extract from YAML frontmatter:
- name
- status
- created
- updated
- progress

### 4. List Tasks

If tasks directory exists:
```bash
ls .pm/epics/${EPIC_NAME}/tasks/
```

Count completed vs total tasks.

### 5. Format Output

Display structured output with:
- Epic name and description
- Status and progress
- Task breakdown
- Related issues (if linked)

## Error Handling

**Common Issues:**

| Error | Solution |
|-------|----------|
| "Epic not found" | Check name spelling, run `/pm:epic-list` |
| "No tasks" | Epic may not be decomposed, run `/pm:epic-decompose` |

## Output

```
Epic: authentication

Status: in-progress
Progress: 60% (5/8 tasks complete)

Description:
User authentication and authorization system with OAuth2 support.

Tasks:
- [x] Setup user model (closed)
- [x] Implement JWT tokens (closed)
- [x] Add login endpoint (closed)
- [x] Add register endpoint (closed)
- [x] Password hashing (closed)
- [ ] OAuth2 integration (in-progress)
- [ ] Session management (open)
- [ ] MFA support (open)

GitHub Issue: #42
Created: 2024-01-15
Updated: 2024-01-20

Next: /pm:issue-start authentication-6
```

## Examples

### Basic usage

```
/pm:epic-show authentication
```

### Show with full task details

```
/pm:epic-show authentication --verbose
```

$ARGUMENTS
```

## Command Categories

Organize commands by namespace:

| Namespace | Purpose | Examples |
|-----------|---------|----------|
| `/pm` | Project management | epic-list, prd-new, issue-start |
| `/context` | Context management | create, update, prime |
| `/testing` | Test operations | run, prime |
| `/config` | Configuration | toggle-features |
| `/mcp` | MCP server management | docs-refresh, context-setup |

## Adding to Plugin

Add commands to your plugin's `plugin.json`:

```json
{
  "commands": [
    {
      "name": "epic-show",
      "file": "commands/pm/epic-show.md",
      "description": "Display epic details",
      "category": "pm",
      "tags": ["epics", "status"]
    }
  ]
}
```

## Testing Commands

### Manual Testing

```bash
# Test with Claude Code
claude

# Then type your command
/pm:epic-show my-epic
```

### Verification Checklist

- [ ] Command file has correct frontmatter
- [ ] Quick Check validates prerequisites
- [ ] Instructions are clear and sequential
- [ ] Error handling covers common issues
- [ ] Output format is consistent
- [ ] Examples are practical
- [ ] Documentation Queries are included

## Best Practices

1. **Keep commands focused** - One action per command
2. **Use minimal tools** - Request only what is needed
3. **Fail fast, fail clear** - Check early, message clearly
4. **Follow output standards** - Consistent formatting
5. **Include Context7 queries** - Document best practices
6. **Provide examples** - Show real usage
7. **Trust the system** - Do not over-validate
8. **Test thoroughly** - Verify all paths work

## Next Steps

- [Plugin Development](./plugin-development.md) - Package commands in plugins
- [Agent Development](./agent-development.md) - Create agents for commands
- [Testing](./testing.md) - Test your commands
