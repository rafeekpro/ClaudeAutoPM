---
title: Your First Project
description: A 5-minute hands-on tutorial to create your first project with ClaudeAutoPM
---

# Your First Project

This hands-on tutorial walks you through creating your first project using ClaudeAutoPM's spec-driven development workflow. You'll go from a product idea to GitHub issues ready for development in about 5 minutes.

## Prerequisites

Before starting, ensure you have:
- ClaudeAutoPM installed (`npm install -g claude-autopm`)
- Framework installed in your project (`autopm install`)
- Claude Code or compatible AI assistant open

## The Workflow Overview

ClaudeAutoPM follows a spec-driven workflow:

```
/pm:init → /pm:prd-new → /pm:prd-parse → /pm:epic-decompose → /pm:epic-sync
```

| Step | Command | What It Does |
|------|---------|--------------|
| 1 | `/pm:init` | Initialize project management |
| 2 | `/pm:prd-new` | Create a Product Requirements Document |
| 3 | `/pm:prd-parse` | Convert PRD to technical epic |
| 4 | `/pm:epic-decompose` | Break epic into actionable tasks |
| 5 | `/pm:epic-sync` | Push tasks to GitHub as issues |

## Step 1: Initialize Project Management

Start by initializing ClaudeAutoPM in your project:

```
/pm:init
```

This command will:
- Verify GitHub CLI is installed (installs if needed)
- Authenticate with GitHub
- Create necessary directories (`.claude/prds/`, `.claude/epics/`)
- Update your `.gitignore`

**Expected output:**
```
✅ GitHub CLI configured
✅ Repository connected: your-username/your-repo
✅ Labels created
✅ Directories initialized
```

## Step 2: Create a PRD

Create a Product Requirements Document for your feature. Let's say you want to build a user authentication system:

```
/pm:prd-new user-authentication
```

ClaudeAutoPM will:
1. Analyze your codebase for existing patterns
2. Generate a comprehensive PRD based on the feature name
3. Save it to `.claude/prds/user-authentication.md`

**Example PRD structure:**
```markdown
---
title: User Authentication
status: draft
priority: P2
created: 2025-01-01T10:00:00Z
---

# PRD: user-authentication

## Executive Summary
Implement secure user authentication system...

## Problem Statement
### Background
...

## User Stories
- As a user, I want to register with email...
- As a user, I want to log in securely...

## Key Features
### Must Have (P0)
- [ ] Email/password registration
- [ ] JWT-based authentication
...
```

### Alternative: Create from Existing Content

If you have existing requirements, import them directly:

```
/pm:prd-new payment-gateway --content @docs/drafts/payment-requirements.md
```

### Local Mode (Offline)

For offline work without GitHub sync:

```
/pm:prd-new user-authentication --local
```

## Step 3: Parse PRD to Epic

Convert your PRD into a technical implementation plan:

```
/pm:prd-parse user-authentication
```

This command:
1. Reads the PRD from `.claude/prds/user-authentication.md`
2. Performs technical analysis
3. Creates an epic with architecture decisions
4. Generates a task breakdown preview

**Output location:** `.claude/epics/user-authentication/epic.md`

**Example epic structure:**
```markdown
---
name: user-authentication
prd: user-authentication
status: backlog
created: 2025-01-01T10:05:00Z
---

# Epic: User Authentication

## Technical Analysis
- Architecture: JWT with refresh tokens
- Database: User table with hashed passwords
- Security: bcrypt for password hashing

## Implementation Strategy
### Phase 1: Foundation
- Database schema and models
- Authentication middleware

### Phase 2: Core Features
- Registration endpoint
- Login endpoint
- Token refresh logic

## Task Preview
1. Setup user database schema
2. Implement JWT middleware
3. Create registration endpoint
...
```

## Step 4: Decompose into Tasks

Break the epic into concrete, actionable tasks:

```
/pm:epic-decompose user-authentication
```

This command:
1. Reads the epic and PRD for context
2. Analyzes your technology stack
3. Assigns specialized agents to tasks
4. Creates individual task files with TDD requirements

**Output location:** `.claude/epics/user-authentication/001.md`, `002.md`, etc.

**Example task file:**
```markdown
---
name: Implement JWT authentication middleware
status: open
created: 2025-01-01T10:10:00Z
assigned_agent: .claude/agents/languages/nodejs-backend-engineer.md
depends_on: []
parallel: true
---

# Task: Implement JWT authentication middleware

## Description
Create Express middleware for validating JWT tokens...

## TDD Requirements
1. RED: Write failing test first
2. GREEN: Write minimal code to pass
3. REFACTOR: Clean up while keeping tests green

## Acceptance Criteria
- [ ] Middleware validates JWT signature
- [ ] Extracts user from token payload
- [ ] Returns 401 for invalid tokens

## Effort Estimate
- Size: M
- Hours: 4
```

### Local Mode

For offline task creation:

```
/pm:epic-decompose user-authentication --local
```

## Step 5: Sync to GitHub

Push your epic and tasks to GitHub as issues:

```
/pm:epic-sync user-authentication
```

This command:
1. Creates a main epic issue on GitHub
2. Creates task issues as sub-issues
3. Links all issues to the epic
4. Creates a development branch `epic/user-authentication`
5. Updates local files with GitHub issue numbers

**Expected output:**
```
✅ Epic issue created: #45
✅ Task issues created: #46, #47, #48, #49, #50
✅ Branch created: epic/user-authentication

📊 Summary:
  Epic: #45 - user-authentication
  Tasks: 5 sub-issues created
  Branch: epic/user-authentication

🔗 Links:
  Epic: https://github.com/your-username/your-repo/issues/45
  Branch: https://github.com/your-username/your-repo/tree/epic/user-authentication

📋 Next steps:
  - Start working: /pm:issue-start 46
  - Or start epic: /pm:epic-start user-authentication
```

## Step 6: Start Development

Now you're ready to start coding! Pick a task and begin:

```
/pm:issue-start 46
```

This command:
- Assigns the issue to you
- Updates status to "In Progress"
- Loads context for development
- The assigned specialized agent is ready to help

## Complete Workflow Example

Here's the entire workflow in one sequence:

```bash
# 1. Initialize (one-time setup)
/pm:init

# 2. Create PRD
/pm:prd-new user-authentication

# 3. Review and edit PRD if needed
/pm:prd-show user-authentication
/pm:prd-edit user-authentication

# 4. Parse to epic
/pm:prd-parse user-authentication

# 5. Review epic
/pm:epic-show user-authentication

# 6. Decompose into tasks
/pm:epic-decompose user-authentication

# 7. Sync to GitHub
/pm:epic-sync user-authentication

# 8. Start working on first task
/pm:issue-start 46
```

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `/pm:help` | Show all available commands |
| `/pm:prd-show <name>` | Display PRD contents |
| `/pm:prd-edit <name>` | Edit existing PRD |
| `/pm:prd-list` | List all PRDs |
| `/pm:epic-show <name>` | Display epic and tasks |
| `/pm:status` | Show project status |
| `/pm:next` | Get next recommended task |
| `/pm:standup` | Generate daily standup report |

## Tips for Success

### Start Small

For your first project, choose a small feature with 5-10 tasks. This helps you learn the workflow without being overwhelmed.

### Review Before Syncing

Always review the generated epic and tasks before syncing to GitHub:

```
/pm:epic-show user-authentication
```

Edit if needed before proceeding.

### Use Local Mode for Drafts

Work in local mode while iterating on requirements:

```
/pm:prd-new feature --local
/pm:prd-parse feature
/pm:epic-decompose feature --local
```

Only sync when you're confident in the plan.

### Follow TDD

All tasks include TDD requirements. Follow the Red-Green-Refactor cycle for quality code:
1. Write a failing test
2. Write minimal code to pass
3. Refactor while tests stay green

## Troubleshooting

### "Epic not found" Error

```
❌ Epic not found: user-authentication
```

**Solution:** Run `/pm:prd-parse user-authentication` first to create the epic.

### "No tasks to sync" Error

```
❌ No tasks to sync
```

**Solution:** Run `/pm:epic-decompose user-authentication` first to create tasks.

### GitHub Authentication Issues

```
❌ GitHub CLI not authenticated
```

**Solution:** Run `gh auth login` in your terminal.

## Next Steps

Now that you've completed your first project workflow:

- Learn about [Configuration](./configuration.md) to customize ClaudeAutoPM
- Explore [PM Commands](/commands/pm-commands) for the full command reference
- Check the [Agent Registry](/agents/registry) to understand specialized agents
