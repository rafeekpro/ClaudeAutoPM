# Command Pipeline Specifications

> **CRITICAL**: Follow these exact command sequences for each workflow.

## Command Categories

### Context Management (`/context:*`)

- `/context:create` - Build initial project documentation
- `/context:update` - Refresh context with recent changes  
- `/context:prime` - Load context into conversation

### Testing (`/testing:*`)

- `/testing:prime` - Configure testing framework and detect test runner
- `/testing:run` - Execute tests via test-runner agent

### Project Management (`/pm:*`)

#### System Management

- `/pm:init` - Initialize PM system (REQUIRED FIRST)
- `/pm:status` - Show current PM status
- `/pm:standup` - Daily standup report
- `/pm:validate` - Validate PM structure
- `/pm:sync` - Sync with external systems

#### PRD Management

- `/pm:prd-new` - Create new Product Requirements Document
- `/pm:prd-parse` - Convert PRD to technical epic
- `/pm:prd-edit` - Edit existing PRD
- `/pm:prd-status` - Show PRD status

#### Epic Management

- `/pm:epic-decompose` - Break epic into tasks
- `/pm:epic-start` - Launch parallel agents for epic
- `/pm:epic-status` - Show execution status
- `/pm:epic-merge` - Merge epic branch
- `/pm:epic-close` - Close completed epic

#### Issue Management

- `/pm:issue-analyze` - Identify parallel work streams
- `/pm:issue-start` - Begin work on issue
- `/pm:issue-status` - Show issue status
- `/pm:issue-close` - Mark issue complete
- `/pm:import` - Import GitHub issues

#### Workflow Navigation

- `/pm:next` - Get next task recommendation
- `/pm:in-progress` - Show current work
- `/pm:blocked` - Show blocked tasks
- `/pm:search` - Search PM system

### Utilities

- `/prompt` - Handle complex prompts with @ references
- `/re-init` - Update CLAUDE.md with PM rules
- `/code-rabbit` - Process CodeRabbit review comments

## Mandatory Command Pipelines

### 1. NEW PROJECT INITIALIZATION

```
REQUIRED SEQUENCE:
1. /pm:init           → Initialize PM system
2. /context:create    → Build project documentation
3. /testing:prime     → Configure test framework
4. /context:prime     → Load context for work
```

### 2. FEATURE DEVELOPMENT PIPELINE

```
REQUIRED SEQUENCE:
1. /pm:prd-new <name>        → Create requirements document
2. /pm:prd-parse <name>      → Convert to technical epic
3. /pm:epic-decompose <name> → Break into parallel tasks
4. /pm:epic-sync <name>      → Sync with GitHub
5. /pm:epic-start <name>     → Launch parallel agents:
   - Each agent follows TDD cycle
   - Agents work in shared branch
   - Progress tracked in execution-status.md
6. /pm:epic-status <name>    → Monitor progress
7. /pm:epic-merge <name>     → Merge when complete
```

### 3. ISSUE RESOLUTION PIPELINE

```
REQUIRED SEQUENCE:
1. /pm:import                → Import from GitHub
2. /pm:issue-analyze <id>    → Identify work streams
3. /pm:issue-start <id>      → Begin implementation:
   - Spawns parallel-worker agent
   - Creates sub-agents per stream
   - Follows TDD for each fix
4. /pm:issue-status <id>     → Check progress
5. /pm:issue-close <id>      → Mark complete
```

### 4. DAILY WORKFLOW PIPELINE

```
MORNING SEQUENCE:
1. /context:prime       → Load project context
2. /pm:standup         → Review status & blockers
3. /pm:next            → Get task recommendation

DURING WORK:
- Use agents for all searches/analysis
- Follow TDD cycle for changes
- Run /testing:run after implementations

END OF DAY SEQUENCE:
1. /testing:run        → Verify all tests pass
2. /context:update     → Update project context
3. /pm:status          → Review accomplishments
```

### 5. CODE REVIEW PIPELINE

```
REQUIRED SEQUENCE:
1. /code-rabbit        → Paste review comments
2. code-analyzer       → Analyze each suggestion
3. Implement fixes following TDD
4. test-runner         → Verify all changes
5. Update PR with fixes
```

## Command Prerequisites

### PM Commands

- Require `/pm:init` first
- Must have `.pm/` directory structure

### Epic Commands

- Require PRD to exist
- Must have parsed epic file

### Issue Commands

- Require GitHub integration
- Must have valid issue ID

### Testing Commands

- Require framework detection
- Must have test configuration

### Context Commands

- Require `.claude/` directory
- Must have project structure

## Command Execution Rules

### All Commands MUST

1. Validate prerequisites before execution
2. Use real datetime (`date -u +"%Y-%m-%dT%H:%M:%SZ"`)
3. Ask before overwriting data
4. Provide detailed execution summaries
5. Delegate to specialized agents

### Agent Delegation Rules

- **Always use test-runner** for test execution
- **Always use file-analyzer** for reading logs/outputs
- **Always use code-analyzer** for code search/analysis
- **Always use parallel-worker** for multi-file operations

## Command Anti-Patterns

### NEVER DO

- ❌ Running tests without `/testing:prime`
- ❌ Starting epics without decomposition
- ❌ Closing issues without verification
- ❌ Skipping context updates
- ❌ Direct command execution without agents
- ❌ Manual datetime entry
- ❌ Ignoring command prerequisites

## Success Verification

### Command Success Indicators

- ✅ Prerequisites validated
- ✅ Agents properly delegated
- ✅ Real datetime used
- ✅ Summary provided
- ✅ Next steps clear

### Pipeline Completion

- ✅ All steps executed in order
- ✅ No steps skipped
- ✅ Tests passing
- ✅ Documentation updated
- ✅ Context preserved
