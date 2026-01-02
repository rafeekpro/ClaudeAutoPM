---
title: PM Workflow
description: Complete project management workflow from PRD creation to production deployment using ClaudeAutoPM.
---

# PM Workflow

This guide walks you through the complete project management workflow in ClaudeAutoPM. You will learn how to take a feature idea from initial concept through to production code, with full traceability at every step.

## The Development Lifecycle

ClaudeAutoPM follows a structured development lifecycle:

```
PRD (Product Requirements Document)
    ↓
Epic (Technical Breakdown)
    ↓
Tasks (Atomic Work Units)
    ↓
GitHub Issues / Azure Work Items
    ↓
Development & Code
    ↓
Completion & Sync
```

Each stage builds on the previous one, maintaining traceability from requirements to implementation.

## Creating a PRD

A PRD (Product Requirements Document) captures what you want to build and why. It serves as the source of truth for a feature.

### Starting a New PRD

Use the interactive brainstorming session to create a comprehensive PRD:

```bash
/pm:prd-new user-authentication
```

This command launches an interactive session that helps you define:

- **Feature overview** - What problem does this solve?
- **User stories** - Who benefits and how?
- **Technical requirements** - What constraints exist?
- **Success criteria** - How do we know it's done?
- **Dependencies** - What does this rely on?

### PRD Structure

PRDs are stored in `.claude/prd/` with the following structure:

```markdown
---
name: user-authentication
status: backlog
created: 2024-01-15T10:30:00Z
updated: 2024-01-15T10:30:00Z
---

# User Authentication System

## Overview
Enable users to securely log in and manage their sessions.

## User Stories
- As a user, I want to log in with email/password
- As a user, I want to reset my forgotten password
- As an admin, I want to view login activity

## Technical Requirements
- JWT-based authentication
- Secure password hashing with bcrypt
- Session management with refresh tokens

## Success Criteria
- Users can register and log in
- Password reset flow works end-to-end
- All auth endpoints have 95%+ test coverage
```

### Managing PRDs

View and manage your PRDs with these commands:

```bash
# List all PRDs
/pm:prd-list

# Show a specific PRD
/pm:prd-show user-authentication

# Edit an existing PRD
/pm:prd-edit user-authentication

# Check PRD implementation status
/pm:prd-status user-authentication
```

## Parsing PRD to Epic

Once your PRD is complete, parse it into an actionable epic with technical tasks:

```bash
/pm:prd-parse user-authentication
```

### What Parsing Does

The parse command:

1. **Analyzes the PRD** - Extracts requirements and constraints
2. **Creates an Epic** - Technical breakdown of the feature
3. **Generates Tasks** - Atomic work units with clear deliverables
4. **Estimates Effort** - Suggests story points or hours
5. **Identifies Dependencies** - Maps task relationships

### Epic Structure

Epics are created in `.claude/epics/` with linked tasks:

```markdown
---
name: user-authentication
prd: user-authentication
status: backlog
progress: 0%
created: 2024-01-15T11:00:00Z
---

# Epic: User Authentication System

## Overview
Implement complete authentication system based on PRD requirements.

## Tasks
1. Setup authentication module structure
2. Implement JWT token generation
3. Create login endpoint
4. Create registration endpoint
5. Implement password reset flow
6. Add session management
7. Write integration tests
8. Security audit and hardening
```

### Task Files

Each task gets its own file in `.claude/epics/user-authentication/`:

```markdown
---
name: implement-jwt-tokens
epic: user-authentication
status: open
priority: high
estimated: 4h
dependencies: []
---

# Task: Implement JWT Token Generation

## Description
Create JWT token generation and validation utilities.

## Acceptance Criteria
- [ ] Token generation with configurable expiry
- [ ] Token validation with signature verification
- [ ] Refresh token implementation
- [ ] Unit tests with 100% coverage

## Technical Notes
- Use jsonwebtoken library
- Store secrets in environment variables
- Implement token rotation for security
```

## Starting Work on an Epic

When ready to begin development, start the epic:

```bash
/pm:epic-start user-authentication
```

### What Epic Start Does

1. **Changes epic status** to `in-progress`
2. **Creates feature branch** from main
3. **Syncs to provider** (GitHub or Azure)
4. **Loads context** for development
5. **Suggests first task** to work on

### Syncing with GitHub

For GitHub users, the epic and tasks sync to Issues:

```bash
# Initial sync creates GitHub issues
/pm:epic-sync user-authentication

# Shows current sync status
/pm:status
```

Each task becomes a GitHub Issue with:
- Labels matching epic name
- Proper description and acceptance criteria
- Links back to local files

### Syncing with Azure DevOps

For Azure DevOps users, use the Azure-specific commands:

```bash
# Create feature in Azure DevOps
/azure:feature-new user-authentication

# Sync tasks as work items
/azure:sync-all

# View sprint status
/azure:sprint-status
```

## Working on Tasks

### Finding Your Next Task

```bash
# Get recommended next task
/pm:next

# See all in-progress items
/pm:in-progress

# View blocked items
/pm:blocked
```

### Starting a Task

```bash
# Start work on a specific issue
/pm:issue-start 123
```

This command:
- Assigns the issue to you
- Changes status to `in-progress`
- Creates a working branch
- Loads relevant context

### During Development

While working, keep your task updated:

```bash
# Update task with progress notes
/pm:issue-edit 123 --add-comment "Completed JWT generation, starting validation"

# Check overall project status
/pm:status

# View current task details
/pm:issue-show 123
```

### Completing a Task

When a task is complete:

```bash
# Close the issue with a comment
/pm:issue-close 123 "Implemented JWT tokens with full test coverage"
```

The system automatically:
- Updates local task status to `closed`
- Syncs completion to GitHub/Azure
- Links any associated PRs
- Updates epic progress

## Tracking Progress

### Project Status

Get a comprehensive view of your project:

```bash
/pm:status
```

Output shows:
- Current sprint information
- Open vs completed tasks
- In-progress work
- Blocked items
- Epic progress percentages

### Daily Standup

Generate a standup report:

```bash
/pm:standup
```

This produces a formatted report:
```
Daily Standup - 2024-01-16

Yesterday:
- Completed JWT token implementation (#123)
- Fixed password hashing issue (#124)

Today:
- Start login endpoint (#125)
- Code review for auth middleware (#126)

Blockers:
- Waiting for security team review on token rotation
```

### Epic Progress

Track progress on specific epics:

```bash
# View epic details and progress
/pm:epic-show user-authentication

# Get detailed status
/pm:epic-status user-authentication
```

## Epic Lifecycle Management

### Refreshing Epic Status

Sync local state with provider:

```bash
/pm:epic-refresh user-authentication
```

### Splitting Large Epics

If an epic becomes too large:

```bash
/pm:epic-split user-authentication --tasks 1,2,3 --new-epic auth-core
```

### Merging Related Epics

Combine epics that should be together:

```bash
/pm:epic-merge small-auth-epic user-authentication
```

### Closing Completed Epics

When all tasks are done:

```bash
/pm:epic-close user-authentication
```

This:
- Validates all tasks are complete
- Updates PRD status
- Archives the epic
- Generates completion report

## Complete Workflow Example

Here is a complete example from start to finish:

```bash
# 1. Create the PRD
/pm:prd-new payment-integration

# 2. Brainstorm and refine (interactive)
# ... answer prompts about requirements ...

# 3. Parse into epic and tasks
/pm:prd-parse payment-integration

# 4. Review generated tasks
/pm:epic-show payment-integration

# 5. Start the epic
/pm:epic-start payment-integration

# 6. Sync to GitHub
/pm:epic-sync payment-integration

# 7. Work on first task
/pm:issue-start 201

# 8. Complete the task
/pm:issue-close 201 "Payment provider SDK integrated"

# 9. Get next task
/pm:next

# 10. Continue until epic complete...

# 11. Close the epic
/pm:epic-close payment-integration

# 12. Verify completion
/pm:prd-status payment-integration
```

## Provider-Specific Notes

### GitHub Workflow

- Issues are created in your repository
- Labels group issues by epic
- Milestones can track releases
- Pull requests link to issues automatically

### Azure DevOps Workflow

- Features map to Azure Features
- User Stories contain task items
- Work items track in sprints
- Boards update automatically

See the [Azure DevOps Integration](/commands/azure-devops) for detailed Azure-specific commands.

## Best Practices

1. **Write detailed PRDs** - The better your requirements, the better the generated tasks
2. **Keep tasks atomic** - Each task should be completable in a day or less
3. **Update regularly** - Sync status to keep everything accurate
4. **Use standup reports** - They help you and your team stay aligned
5. **Close when done** - Completed epics help track velocity

## Next Steps

Now that you understand the workflow:
- Learn about [available commands](./commands-overview)
- Explore [AI agents](./agents-overview) for development assistance
- Review [best practices](./best-practices) for optimal usage
