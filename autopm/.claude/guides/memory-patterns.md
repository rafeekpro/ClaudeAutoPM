# Memory Patterns Guide

> Strategies for preserving critical information across Claude Code sessions without API-level memory tools.

## Overview

Claude Code sessions are stateless - each `/clear` or new session starts fresh. This guide provides patterns to maintain continuity for long-running work without relying on API-level memory features.

## Core Strategies

### Strategy 1: File-Based Memory

Use project files to persist information between sessions.

#### Work State Files

```bash
# Create work state directory
.claude/
├── active-work.json     # Current task state
├── decisions.md         # Decision log
├── checkpoints/         # Session checkpoints
│   ├── 2024-01-15-auth-feature.md
│   └── 2024-01-16-dashboard.md
└── context/             # Preserved context
    ├── architecture.md
    └── conventions.md
```

#### active-work.json Structure

```json
{
  "current_task": {
    "id": "issue-456",
    "title": "Implement user dashboard",
    "branch": "feature/user-dashboard",
    "started": "2024-01-15T10:00:00Z",
    "status": "in_progress"
  },
  "recent_changes": [
    {
      "file": "src/components/Dashboard.tsx",
      "action": "created",
      "description": "Initial dashboard component"
    }
  ],
  "blockers": [
    "API endpoint returns 500 on edge case"
  ],
  "next_steps": [
    "Fix API error handling",
    "Add mobile responsive styles"
  ],
  "context_notes": "Using Chart.js for graphs, following existing component patterns"
}
```

### Strategy 2: Checkpoint Files

Create snapshots at milestones for session recovery.

#### Checkpoint Template

```markdown
# Checkpoint: [Feature/Task Name]
Date: [ISO timestamp]
Session: [N of estimated total]

## Status Summary
- Overall: [percentage]% complete
- Tests: [passing]/[total]
- Branch: [branch name]
- Last commit: [hash]

## Completed Items
- [x] Item 1 - [brief outcome]
- [x] Item 2 - [brief outcome]

## In Progress
- [ ] Item 3 - [current state, what's left]

## Pending
- [ ] Item 4
- [ ] Item 5

## Key Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth method | JWT | Stateless, scalable |
| UI library | MUI | Team familiarity |

## Critical Context
- [Important information that must not be lost]
- [Constraints or requirements discovered]
- [Dependencies or blockers]

## Files Modified This Session
- `src/auth.js` - Added MFA support
- `src/components/Login.tsx` - Updated UI

## Commands to Resume
```bash
git checkout feature/user-dashboard
npm install
npm run dev
# Then: Start with "Continue dashboard implementation"
```

## Notes for Next Session
- Check PR #789 status before continuing
- Need design review for mobile layout
- Performance testing after completion
```

### Strategy 3: Decision Log

Maintain persistent record of architectural decisions.

#### decisions.md Structure

```markdown
# Decision Log

## Active Decisions

### DEC-001: Authentication Strategy
- **Date**: 2024-01-15
- **Status**: Active
- **Decision**: JWT with refresh tokens
- **Context**: Need stateless auth for microservices
- **Options Considered**:
  - Sessions: Rejected (requires sticky sessions)
  - JWT only: Rejected (no revocation)
  - JWT + refresh: Selected (balance of stateless + security)
- **Consequences**:
  - Must implement token rotation
  - Need secure refresh token storage
- **Related**: DEC-003 (Token storage)

### DEC-002: Database Choice
- **Date**: 2024-01-14
- **Status**: Active
- **Decision**: PostgreSQL with Prisma ORM
...

## Superseded Decisions

### DEC-000: Original Auth Plan
- **Date**: 2024-01-10
- **Status**: Superseded by DEC-001
- **Decision**: Session-based auth
- **Why Changed**: Moved to microservices architecture
```

### Strategy 4: Context Files

Preserve project-specific knowledge.

#### architecture.md

```markdown
# Project Architecture

## Overview
[Brief description of system architecture]

## Key Components
- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Cache**: Redis

## Directory Structure
```
src/
├── components/    # React components
├── hooks/         # Custom hooks
├── services/      # API services
├── utils/         # Helper functions
└── types/         # TypeScript types
```

## Patterns in Use
- Repository pattern for data access
- Custom hooks for state management
- Error boundaries for resilience

## Critical Paths
- Auth flow: Login → JWT → Refresh → Logout
- Data flow: Component → Hook → Service → API

## Known Constraints
- Must support IE11 (legacy users)
- Max response time: 200ms
- Database connections limited to 100
```

#### conventions.md

```markdown
# Project Conventions

## Naming
- Components: PascalCase (UserProfile.tsx)
- Hooks: camelCase with 'use' prefix (useAuth.ts)
- Utils: camelCase (formatDate.ts)
- Constants: SCREAMING_SNAKE (MAX_RETRIES)

## File Organization
- One component per file
- Co-locate tests with source
- Index files for public exports

## Code Style
- Prefer functional components
- Use TypeScript strict mode
- Async/await over promises

## Git Conventions
- Branch: feature/issue-number-short-desc
- Commit: type(scope): message
- PR: Link to issue, include tests
```

## Implementation Workflows

### Workflow 1: Starting a New Task

```bash
# 1. Check for existing work state
cat .claude/active-work.json

# 2. If resuming, load checkpoint
cat .claude/checkpoints/latest.md

# 3. Update work state
# Claude updates active-work.json with new task

# 4. Reference context files as needed
# Claude reads architecture.md, conventions.md
```

### Workflow 2: Mid-Session Checkpoint

```markdown
# When to create checkpoint:
- Before lunch/break
- After completing major milestone
- Before risky operation
- Every 30-45 minutes of active work

# Claude creates:
.claude/checkpoints/YYYY-MM-DD-task-name.md
```

### Workflow 3: Session Handoff

```markdown
# Before /clear or ending session:

1. Update active-work.json with current state
2. Create checkpoint if significant work done
3. Update decisions.md if new decisions made
4. Note any blockers or urgent items

# After /clear or new session:

1. Read active-work.json first
2. Load latest checkpoint
3. Review any new decisions
4. Continue from documented state
```

### Workflow 4: Completing a Task

```markdown
# On task completion:

1. Archive checkpoint to completed/
2. Clear active-work.json current_task
3. Update decisions.md if needed
4. Run /clear for fresh context
```

## File Templates

### Quick Start Template

Create `.claude/templates/session-start.md`:

```markdown
# Session Start Checklist

## Load Context
- [ ] Read .claude/active-work.json
- [ ] Check latest checkpoint in .claude/checkpoints/
- [ ] Review recent decisions in .claude/decisions.md

## Verify State
- [ ] Correct branch checked out
- [ ] Dependencies up to date (npm install)
- [ ] Tests passing (npm test)
- [ ] No uncommitted changes (unless expected)

## Resume Work
Current task: [from active-work.json]
Last checkpoint: [file name]
Next steps: [from checkpoint or active-work]
```

### Issue Memory Template

For tracking work per issue:

```markdown
# Issue #[number]: [title]

## Overview
- **Created**: [date]
- **Priority**: [P0-P3]
- **Estimated**: [hours/points]

## Progress Log
| Date | Action | Notes |
|------|--------|-------|
| MM-DD | Started | Initial analysis |
| MM-DD | Checkpoint | Auth complete |

## Implementation Notes
[Technical details discovered during implementation]

## Blockers Encountered
- [blocker 1]: [how resolved]

## Final Solution
[Brief description of implementation]

## Files Changed
- file1.ts: [what changed]
- file2.ts: [what changed]

## Tests Added
- test1.spec.ts: [what it tests]
```

## Commands Integration

### PM Commands for Memory

```bash
# Save current state
/pm:checkpoint "milestone name"

# Load last checkpoint
/pm:resume

# View work history
/pm:history

# Clear with checkpoint
/pm:clear-safe
```

### Suggested Aliases

Add to `.bashrc` or `.zshrc`:

```bash
alias cc-checkpoint='echo "Creating checkpoint..." && cat > .claude/checkpoints/$(date +%Y-%m-%d-%H%M).md'
alias cc-resume='cat .claude/active-work.json && cat .claude/checkpoints/$(ls -t .claude/checkpoints/ | head -1)'
alias cc-state='cat .claude/active-work.json'
```

## Best Practices

### DO
- Create checkpoints at natural breakpoints
- Keep active-work.json always current
- Document decisions when made
- Reference context files in prompts
- Archive completed work

### DON'T
- Rely on conversation history alone
- Skip checkpoints for "quick" tasks
- Let decisions go undocumented
- Ignore context files after creation
- Delete checkpoints without archiving

## Memory Hierarchy

| Level | Location | Persistence | Use Case |
|-------|----------|-------------|----------|
| 1. Conversation | In-session | Until /clear | Active work |
| 2. Active Work | JSON file | Until task done | Current task state |
| 3. Checkpoints | MD files | Until archived | Session recovery |
| 4. Decisions | Log file | Permanent | Architectural choices |
| 5. Context | Doc files | Permanent | Project knowledge |

## Recovery Procedures

### Lost Session Recovery

```markdown
1. Check active-work.json for last known state
2. Find most recent checkpoint
3. Check git log for recent commits
4. Reconstruct from these sources
5. Create new checkpoint with recovered state
```

### Corrupted State Recovery

```markdown
1. Check git for last known good state of .claude/
2. Restore from git or backup
3. Verify against actual code state
4. Update files to match reality
5. Create fresh checkpoint
```

## Summary

File-based memory patterns provide:
- **Persistence** across sessions
- **Recovery** from interruptions
- **Audit trail** of decisions
- **Context** for future work
- **Continuity** for long tasks

**Key files to maintain:**
1. `.claude/active-work.json` - Current state
2. `.claude/checkpoints/*.md` - Session snapshots
3. `.claude/decisions.md` - Decision log
4. `.claude/context/*.md` - Project knowledge

**Remember**: The goal is not to remember everything, but to remember what matters enough to continue work effectively.
