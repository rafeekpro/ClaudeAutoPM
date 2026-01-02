---
title: Best Practices
description: Tips, tricks, common patterns, and what to avoid when using ClaudeAutoPM for project management and AI-assisted development.
---

# Best Practices

This guide covers proven patterns, common pitfalls, and optimization techniques for getting the most out of ClaudeAutoPM. Whether you are new to the framework or looking to improve your workflow, these practices will help you work more effectively.

## Project Setup

### Start with Good Structure

Initialize your project correctly from the beginning:

```bash
# Initialize in the project root
cd your-project/
autopm install

# Choose the appropriate configuration
# - Lite: Small projects, minimal overhead
# - Standard: Most projects
# - Azure: Enterprise with Azure DevOps
# - Full DevOps: Complete CI/CD pipeline
```

### Configure Your Provider Early

Set up your provider before creating work items:

```bash
# For GitHub
export GITHUB_TOKEN="your_token"
export GITHUB_REPO="owner/repo"

# For Azure DevOps
export AZURE_DEVOPS_TOKEN="your_pat"
export AZURE_DEVOPS_ORG="your_org"
export AZURE_DEVOPS_PROJECT="your_project"
```

### Validate After Setup

```bash
# Verify everything is configured
/pm:validate

# Check status
/pm:status
```

## PRD Writing

### Be Specific and Complete

Good PRDs lead to good task breakdowns:

```markdown
# Good PRD Example
---
name: user-authentication
status: backlog
---

## Problem Statement
Users currently cannot securely access their accounts. We need a complete
authentication system supporting email/password login with session management.

## User Stories
- As a new user, I want to register with my email so I can create an account
- As a returning user, I want to log in so I can access my data
- As a forgetful user, I want to reset my password so I can regain access

## Technical Requirements
- JWT-based authentication with refresh tokens
- Password hashing using bcrypt (min 12 rounds)
- Rate limiting: 5 attempts per minute
- Session timeout: 24 hours

## Success Criteria
- All authentication endpoints pass security review
- 95%+ test coverage on auth module
- Login flow completes in under 500ms
```

### Avoid Vague Requirements

```markdown
# Avoid This
"Make the login better"
"Add security features"
"Improve user experience"

# Write This Instead
"Reduce login time to under 500ms"
"Add rate limiting of 5 attempts per minute"
"Display password strength indicator during registration"
```

### Include Acceptance Criteria

Each PRD should have measurable success criteria:

```markdown
## Success Criteria
- [ ] Users can register in under 60 seconds
- [ ] Login works with email and password
- [ ] Password reset email arrives within 2 minutes
- [ ] All endpoints return proper HTTP status codes
- [ ] Security audit passes with no critical issues
```

## Task Management

### Keep Tasks Atomic

Each task should be completable in a day or less:

```markdown
# Too Large
"Implement entire authentication system"

# Right Size
"Create JWT token generation utility"
"Implement login endpoint"
"Add password reset email sending"
"Write authentication middleware"
```

### Use Clear Naming

Task names should describe the deliverable:

```markdown
# Good Names
"Add user registration form validation"
"Create password strength component"
"Implement JWT refresh token rotation"

# Avoid
"Auth stuff"
"Fix issue #123"
"Work on login"
```

### Track Dependencies

Document what blocks what:

```markdown
---
name: implement-login-endpoint
dependencies:
  - jwt-token-utility
  - user-model-creation
---
```

## Agent Usage

### Choose Specialized Agents

Always pick the most specific agent for your task:

| Task | Best Choice | Avoid |
|------|-------------|-------|
| React component | `@react-ui-expert` | `@code-analyzer` |
| FastAPI endpoint | `@python-backend-expert` | `@nodejs-backend-engineer` |
| Docker setup | `@docker-containerization-expert` | `@code-analyzer` |
| SQL optimization | `@postgresql-expert` | `@code-analyzer` |

### Provide Rich Context

Give agents enough information to succeed:

```bash
# Too Little Context
@postgresql-expert optimize this query

# Good Context
@postgresql-expert optimize this query for our orders table:
- Table has 10 million rows
- Indexed on: id, created_at, customer_id
- Query runs 50,000 times/day
- Currently takes 3 seconds, need under 100ms

SELECT * FROM orders
WHERE customer_id = $1
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 50
```

### Combine Agents for Complex Tasks

Use multiple agents for comprehensive solutions:

```bash
# Design
@postgresql-expert design the schema

# Implement
@python-backend-expert create the API endpoints

# Test
@test-runner write comprehensive tests

# Review
@code-analyzer review for security issues
```

## Command Patterns

### Daily Workflow

```bash
# Morning
/pm:standup              # See yesterday's work, plan today
/pm:status               # Overview of project state
/pm:next                 # Get your first task

# During Work
/pm:issue-start 123      # Start a task
# ... do the work ...
/pm:issue-close 123 "Completed implementation"

# End of Day
/pm:sync                 # Sync everything to provider
/pm:status               # Verify state
```

### Weekly Maintenance

```bash
# Weekly Review
/pm:blocked              # Check what is stuck
/pm:validate             # Ensure configuration is correct
/pm:clean                # Clean up completed items

# Sprint End
/pm:epic-refresh all     # Update all epic progress
/pm:status --verbose     # Detailed status report
```

### Before Commits

```bash
# Pre-commit checklist
@code-analyzer review staged changes
@test-runner run affected tests
/pm:validate             # Ensure PM state is valid
```

## Context7 Best Practices

### Always Query Before Implementing

```bash
# Never rely on training data alone
@python-backend-expert create FastAPI auth endpoint

# Agent will query:
# mcp://context7/fastapi/security
# mcp://context7/fastapi/dependencies
# mcp://context7/jwt/best-practices
```

### Refresh Documentation Regularly

```bash
# Weekly refresh
/mcp:docs-refresh

# Before major implementations
/mcp:docs-refresh --tech=kubernetes --force

# Validate cache integrity
/mcp:docs-refresh --validate
```

## Common Patterns

### Feature Development Flow

```bash
# 1. Create PRD
/pm:prd-new payment-integration

# 2. Review and refine (interactive)
/pm:prd-edit payment-integration

# 3. Parse into epic
/pm:prd-parse payment-integration

# 4. Review tasks
/pm:epic-show payment-integration

# 5. Start the epic
/pm:epic-start payment-integration

# 6. Sync to provider
/pm:epic-sync payment-integration

# 7. Work through tasks
/pm:next
# ... implement ...
/pm:issue-close 123 "Done"
/pm:next
# ... repeat ...

# 8. Close epic
/pm:epic-close payment-integration
```

### Bug Fix Flow

```bash
# 1. Check existing issues
/pm:search "login timeout"

# 2. Start the issue
/pm:issue-start 456

# 3. Analyze the problem
@code-analyzer investigate login timeout issue in src/auth/

# 4. Fix with tests
@test-runner create regression test for login timeout
# ... implement fix ...
@test-runner verify fix

# 5. Close
/pm:issue-close 456 "Fixed: Increased connection pool size"
```

### Code Review Pattern

```bash
# Comprehensive review
@code-analyzer review for bugs and issues
@code-analyzer review for security vulnerabilities
@code-analyzer review for performance problems

# Or use specific agents
@python-backend-expert review this FastAPI code
@postgresql-expert review these queries
```

## What to Avoid

### Anti-Patterns

| Avoid | Instead |
|-------|---------|
| Skipping PRDs for "small" features | Every feature deserves a PRD |
| Huge monolithic tasks | Break into 1-day tasks |
| Ignoring Context7 | Always query documentation |
| Manual status updates | Use commands to update |
| Working without sync | Sync regularly |

### Common Mistakes

**Not Syncing Regularly**:
```bash
# Bad: Work all week, sync once
# Good: Sync after each task
/pm:issue-close 123 "Done"
/pm:sync
```

**Ignoring Blocked Items**:
```bash
# Check blocked items daily
/pm:blocked

# Address or document blockers
/pm:issue-edit 456 --add-comment "Waiting on API team for credentials"
```

**Skipping Validation**:
```bash
# Run validation regularly
/pm:validate

# Fix issues immediately
# Don't let configuration drift
```

**Using Generic Agents**:
```bash
# Avoid
@code-analyzer build me a React component

# Better
@react-ui-expert build a data table component with sorting
```

## Performance Optimization

### Reduce Context Usage

```bash
# For large files, summarize first
@file-analyzer summarize this 5000-line log file

# Then work with the summary
@code-analyzer analyze these error patterns: [summary]
```

### Batch Similar Operations

```bash
# Instead of multiple syncs
/pm:issue-close 1 "Done"
/pm:issue-close 2 "Done"
/pm:issue-close 3 "Done"
/pm:sync

# Close all, then sync once
/pm:issue-close 1 "Done"
/pm:issue-close 2 "Done"
/pm:issue-close 3 "Done"
/pm:sync
```

### Use Appropriate Verbosity

```bash
# For quick status
/pm:status

# For debugging
/pm:status --verbose
```

## Advanced Patterns

### Parallel Agent Execution

When tasks are independent, let agents work in parallel:

```bash
# These can run simultaneously
@code-analyzer review backend/
@test-runner execute frontend tests
@docker-containerization-expert build images
```

### Epic Decomposition Strategy

For large features, use iterative decomposition:

```bash
# First, high-level breakdown
/pm:prd-parse large-feature

# Then decompose individual tasks
/pm:epic-decompose large-feature --task 1 --detail high

# Review and adjust
/pm:epic-show large-feature
```

### Cross-Epic Dependencies

When epics depend on each other:

```markdown
# In epic file
---
name: payment-integration
dependencies:
  - epic: user-authentication
    required_tasks: [jwt-tokens, session-management]
---
```

### Custom Workflows

Create project-specific command sequences:

```bash
# Morning routine
alias pm-morning="/pm:standup && /pm:status && /pm:next"

# Pre-commit
alias pm-pre-commit="@code-analyzer review && @test-runner run"

# End of day
alias pm-eod="/pm:sync && /pm:status"
```

## Team Collaboration

### Consistent Status Updates

Everyone should update status the same way:

```bash
# Starting work
/pm:issue-start 123

# Progress update
/pm:issue-edit 123 --add-comment "50% complete, working on tests"

# Completion
/pm:issue-close 123 "Implemented with full test coverage"
```

### Shared Context

Use context commands for team alignment:

```bash
# Create shared context
/context:create --scope project

# Update before meetings
/context:update

# Prime context for new team members
/context:prime
```

### Code Review Integration

```bash
# Before review
@code-analyzer prepare review summary for PR #45

# During review
@code-analyzer explain the changes in src/auth/

# After review
/pm:issue-edit 123 --add-comment "Review feedback addressed"
```

## Troubleshooting Tips

### When Things Go Wrong

1. **Check validation**: `/pm:validate`
2. **Review status**: `/pm:status --verbose`
3. **Check sync state**: `/pm:sync --dry-run`
4. **Examine blocked items**: `/pm:blocked`

### Recovery Patterns

```bash
# Stale local state
/pm:sync --force

# Corrupted cache
/mcp:docs-refresh --force

# Configuration issues
/pm:validate
# Fix reported issues
/pm:validate
```

## Summary Checklist

Before starting a new feature:
- [ ] PRD created with clear requirements
- [ ] Acceptance criteria defined
- [ ] Epic parsed with atomic tasks
- [ ] Dependencies identified
- [ ] Provider sync working

During development:
- [ ] Using specialized agents
- [ ] Querying Context7 for documentation
- [ ] Updating task status
- [ ] Syncing regularly

Before completion:
- [ ] All tasks closed
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Epic closed
- [ ] Final sync complete
