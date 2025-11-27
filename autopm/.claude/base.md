# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

<!-- WORKFLOW_SECTION -->

## CRITICAL RULE FILES

All rule files in `.claude/rules/` define mandatory behaviors and must be followed:

### Core Development Rules

- **tdd.enforcement.md** - Test-Driven Development cycle (RED-GREEN-REFACTOR). HIGHEST PRIORITY for all code changes
- **pipeline-mandatory.md** - Required pipelines for errors, features, bugs, code search, and log analysis
- **naming-conventions.md** - Naming standards, code quality requirements, and prohibited patterns
- **context-optimization.md** - Agent usage patterns for context preservation (<20% data return)
- **development-workflow.md** - Development patterns, search-before-create, and best practices
- **command-pipelines.md** - Command sequences, prerequisites, and PM system workflows

### Operational Rules

- **agent-coordination.md** - Multi-agent parallel work with file-level coordination
- **agent-coordination-extended.md** - Extended coordination patterns for complex workflows
- **branch-operations.md** - Git branch management, naming conventions, and merge strategies
- **worktree-operations.md** - Git worktree management for parallel development
- **datetime.md** - Real datetime requirements using ISO 8601 UTC format (no placeholders)
- **frontmatter-operations.md** - YAML frontmatter standards for PRDs, epics, and tasks
- **strip-frontmatter.md** - Metadata removal for GitHub sync and external communication
- **github-operations.md** - GitHub CLI safety and critical template repository protection
- **no-pr-workflow.md** - Direct main branch development without PRs

### Technical Rules

- **test-execution.md** - Testing standards requiring test-runner agent, no mocks, real services only
- **standard-patterns.md** - Command consistency, fail-fast philosophy, and minimal validation
- **use-ast-grep.md** - Structural code search using AST over regex for language-aware patterns
- **database-pipeline.md** - Database migrations, query optimization, and backup procedures
- **infrastructure-pipeline.md** - IaC deployments, container builds, and cloud operations

### Code Formatting & Quality

**MANDATORY**: All code MUST pass autoformatters and linters before commit:

- **Python**: Must pass `black` formatter and `ruff` linter
- **JavaScript/TypeScript**: Must pass `prettier` and `eslint`
- **Markdown**: Must pass `markdownlint`
- **Other languages**: Use language-specific standard tools

Always run formatters and linters BEFORE marking any task as complete.

## DOCUMENTATION REFERENCES

### Agent Documentation (`.claude/agents/`)

Agents are organized by category for better maintainability:

- **Core Agents** (`.claude/agents/core/`) - Essential agents for all projects
- **Language Agents** (`.claude/agents/languages/`) - Language-specific experts
- **Framework Agents** (`.claude/agents/frameworks/`) - Framework and UI specialists
- **Cloud Agents** (`.claude/agents/cloud/`) - Cloud platform architects
- **DevOps Agents** (`.claude/agents/devops/`) - CI/CD and operations
- **Database Agents** (`.claude/agents/databases/`) - Database specialists
- **Data Agents** (`.claude/agents/data/`) - Data engineering

### Command Documentation (`.claude/commands/`)

- Custom commands and patterns documented in `.claude/commands/`
- **Azure DevOps Commands** (`.claude/commands/azure/`) - Complete Azure DevOps integration
- **PM Commands** (`.claude/commands/pm/`) - Project management workflow

## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

### Core Agents (Always Available)

#### file-analyzer - File and log analysis
Always use for reading and summarizing files, especially logs and verbose outputs.

#### code-analyzer - Bug hunting and logic tracing
Use for code analysis, bug detection, and tracing execution paths.

#### test-runner - Test execution and analysis
Use for running tests and analyzing results with structured reports.

#### parallel-worker - Multi-stream parallel execution
Use for coordinating multiple work streams in parallel.

#### context-optimizer - Context management and compaction
Use for managing context window efficiency, creating checkpoints, and session continuity.

<!-- AGENT_SELECTION_SECTION -->

## Azure DevOps Integration

### Complete Azure DevOps command suite for enterprise project management

The system includes full Azure DevOps integration with 38+ commands mapped from PM system:

#### Quick Start
```bash
# Initialize Azure DevOps
/azure:init

# Daily workflow
/azure:standup              # Morning standup
/azure:next-task            # Get AI-recommended task
/azure:sprint-status        # Sprint dashboard
```

## TDD PIPELINE FOR ALL IMPLEMENTATIONS

### Mandatory Test-Driven Development Cycle

Every implementation MUST follow:

1. **RED Phase**: Write failing test first
   - Test must describe desired behavior
   - Test MUST fail initially
   - Test must be meaningful (no trivial assertions)

2. **GREEN Phase**: Make test pass
   - Write MINIMUM code to pass test
   - Don't add features not required by test
   - Focus on making test green, not perfection

3. **REFACTOR Phase**: Improve code
   - Improve structure while tests stay green
   - Remove duplication
   - Enhance readability

## CONTEXT OPTIMIZATION RULES

See **`.claude/rules/context-optimization.md`** for detailed context preservation patterns and agent usage requirements.

### Context Management Tools

- **context-optimizer agent** - Use `@context-optimizer` for managing context window efficiency
- **`.claude/rules/context-compaction.md`** - Automatic compaction rules and triggers
- **`.claude/guides/memory-patterns.md`** - File-based memory patterns for session continuity

### Key Context Strategies

1. **Compaction Triggers**: Auto-compact after 10+ tool results, 30+ messages, or 3+ reads of same file
2. **Checkpoint System**: Create checkpoints with `@context-optimizer checkpoint "name"`
3. **Memory Patterns**: Use `.claude/active-work.json` for cross-session state
4. **Session Transfer**: Generate handoff notes with `@context-optimizer transfer`

## ERROR HANDLING PIPELINE

See **`.claude/rules/development-workflow.md`** for complete error handling and development pipelines.

## WHY THESE RULES EXIST

### Development Quality

- **No partial implementations** → Technical debt compounds exponentially
- **No mock services in tests** → Real bugs hide behind mocks
- **TDD mandatory** → Prevents regression and ensures coverage

### Context Preservation

- **Agent-first search** → Preserves main thread for decisions
- **No verbose outputs** → Maintains conversation clarity
- **10-20% return rule** → Focuses on actionable insights

### Code Integrity

- **No "_fixed" suffixes** → Indicates poor planning
- **No orphan docs** → Documentation should be intentional
- **No mixed concerns** → Maintainability over convenience

## Philosophy

### Error Handling

- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

### Testing

See **`.claude/rules/test-execution.md`** for testing standards and requirements.

## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES

See **`.claude/rules/naming-conventions.md`** for code quality standards and prohibited patterns.

Key principles:

- NO PARTIAL IMPLEMENTATION
- NO CODE DUPLICATION (always search first)
- IMPLEMENT TEST FOR EVERY FUNCTION (see `.claude/rules/tdd.enforcement.md`)
- NO CHEATER TESTS (tests must be meaningful)
- Follow all rules defined in `.claude/rules/` without exception

## 📋 Quick Reference Checklists

### Before Committing

```bash
# Minimum Definition of Done
✓ Tests written and passing (TDD - see .claude/rules/tdd.enforcement.md)
✓ Code formatted (black, prettier, eslint)
✓ No partial implementations
✓ No code duplication
✓ Error handling implemented
✓ Security considered

# Run these checks (automated with git hooks)
npm test          # or pytest
npm run lint      # or ruff check
npm run build     # Ensure production build works
npm run typecheck # TypeScript validation

# Or use safe-commit script for all checks
./scripts/safe-commit.sh "feat: your message"

# Simulate CI locally before push
npm run ci:local  # Full CI pipeline simulation
```

### Before Creating PR

```bash
✓ Branch up to date with main
✓ All tests passing
✓ CI/CD pipeline green
✓ Documentation updated
✓ Breaking changes noted
```

### Code Quality Checklist

```bash
✓ Functions are single-purpose
✓ Variable names are descriptive
✓ No hardcoded values
✓ No debugging code left
✓ Comments explain "why" not "what"
```

For detailed checklists, see `.claude/checklists/`