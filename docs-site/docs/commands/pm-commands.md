# PM Commands

PM (Project Management) commands provide a unified interface for managing projects, issues, epics, and PRDs within Claude Code. These commands work across different providers (GitHub, Azure DevOps) through the provider abstraction layer.

## Command Structure

All PM commands follow the pattern:
```
/pm:resource:action [parameters]
```

- **pm**: Project Management prefix
- **resource**: The type of resource (issue, epic, prd, etc.)
- **action**: The operation to perform (show, list, create, etc.)

## Quick Reference

| Command | Description |
|---------|-------------|
| `/pm:help` | Show all available commands |
| `/pm:init` | Initialize project management |
| `/pm:status` | Show project status |
| `/pm:standup` | Generate standup report |
| `/pm:next` | Show next task to work on |

## Issue Management

### /pm:issue:show [id]

Display detailed information about an issue.

```markdown
/pm:issue:show 123

# Output:
Issue #123: Implement user authentication
Status: In Progress
Assignee: @developer
Labels: backend, security
Description: Add JWT-based authentication...
```

### /pm:issue:list

List all open issues.

```markdown
/pm:issue:list

# Output:
Open Issues:
- #123: Implement user authentication [In Progress]
- #124: Add password reset [To Do]
- #125: Setup 2FA [Blocked]
```

### /pm:issue:start [id]

Start working on an issue.

```markdown
/pm:issue:start 123

# Actions performed:
✓ Issue assigned to you
✓ Status changed to "In Progress"
✓ Branch created: feature/issue-123
✓ Context loaded for development
```

### /pm:issue:close [id] [comment]

Close an issue with optional comment.

```markdown
/pm:issue:close 123 "Implemented JWT authentication"

# Actions performed:
✓ Issue closed
✓ Comment added
✓ PR linked if exists
```

### /pm:issue:analyze [id]

Analyze issue and suggest implementation approach.

```markdown
/pm:issue:analyze 123

# Output:
Analysis for Issue #123:
- Estimated effort: 8 hours
- Suggested approach: JWT with refresh tokens
- Dependencies: bcrypt, jsonwebtoken
- Test scenarios: 5 identified
```

## Epic Management

### /pm:epic:list

List all epics in the project.

```markdown
/pm:epic:list

# Output:
Active Epics:
- Epic: User Management System [40% complete]
  └─ #123: Authentication [Done]
  └─ #124: Authorization [In Progress]
  └─ #125: User Profile [To Do]
```

### /pm:epic:show [id]

Show epic details with child items.

```markdown
/pm:epic:show user-management

# Output:
Epic: User Management System
Progress: 40% (4/10 issues complete)
Timeline: Sprint 3-5
Child Issues:
- Authentication ✓
- Authorization ⚡
- Profile Management ○
```

### /pm:epic:decompose [title]

Break down epic into manageable issues.

```markdown
/pm:epic:decompose "Payment Integration"

# Creates:
- Setup payment provider
- Implement checkout flow
- Add payment methods
- Handle webhooks
- Add refund capability
```

### /pm:epic:start [id]

Begin work on an epic.

```markdown
/pm:epic:start payment-integration

# Actions:
✓ Epic marked as active
✓ First issue selected
✓ Development branch created
✓ Context prepared
```

## PRD (Product Requirements Document) Management

### /pm:prd:new [title]

Create a new PRD.

```markdown
/pm:prd:new "Mobile App MVP"

# Creates PRD with:
- Overview section
- User stories
- Technical requirements
- Success criteria
- Timeline
```

### /pm:prd:list

List all PRDs.

```markdown
/pm:prd:list

# Output:
Product Requirements:
1. Mobile App MVP [Draft]
2. API v2.0 [Approved]
3. Analytics Dashboard [In Review]
```

### /pm:prd:parse [file]

Parse PRD and create work items.

```markdown
/pm:prd:parse docs/mobile-app-prd.md

# Creates:
✓ Epic: Mobile App MVP
✓ 12 User Stories
✓ 28 Technical Tasks
✓ 5 Test Scenarios
```

### /pm:prd:status [id]

Show PRD implementation status.

```markdown
/pm:prd:status mobile-app

# Output:
PRD: Mobile App MVP
Status: 35% Complete
- ✓ Authentication (100%)
- ⚡ Core Features (60%)
- ○ Push Notifications (0%)
```

## Project Commands

### /pm:init

Initialize project management for the repository.

```markdown
/pm:init

# Actions:
✓ Provider detected: GitHub
✓ Repository connected
✓ Labels created
✓ Milestones setup
✓ Project board initialized
```

### /pm:status

Show overall project status.

```markdown
/pm:status

# Output:
Project Status:
- Sprint: 14 (Week 2)
- Velocity: 23 points/sprint
- Open Issues: 45
- In Progress: 8
- Blocked: 2
- Completed This Sprint: 12
```

### /pm:standup

Generate daily standup report.

```markdown
/pm:standup

# Output:
Daily Standup - 2024-01-15

Yesterday:
- Completed authentication module
- Fixed critical bug in payment flow

Today:
- Implement password reset
- Review PRs #45, #46

Blockers:
- Waiting for API documentation
```

### /pm:next

Get the next recommended task.

```markdown
/pm:next

# Output:
Recommended Next Task:
Issue #124: Add password reset
Priority: High
Estimated: 4 hours
Dependencies: None
Context: Follows authentication work
```

### /pm:blocked

Show all blocked items.

```markdown
/pm:blocked

# Output:
Blocked Items:
- #125: 2FA Setup - Awaiting security review
- #189: Data Migration - Database access needed
- Epic: Reporting - Missing requirements
```

### /pm:clean

Clean up completed items.

```markdown
/pm:clean

# Actions:
✓ Closed 12 completed issues
✓ Archived 3 old epics
✓ Removed stale branches
✓ Updated project board
```

## Search and Navigation

### /pm:search [query]

Search across all work items.

```markdown
/pm:search "authentication"

# Results:
- Issue #123: JWT authentication
- Epic: User Management
- PRD: Security Requirements
- PR #45: Add auth middleware
```

### /pm:validate

Validate project configuration.

```markdown
/pm:validate

# Output:
✓ GitHub connection valid
✓ Labels configured correctly
✓ Workflows active
✓ No orphaned issues
⚠ 2 issues missing estimates
```

## Synchronization Commands

### /pm:sync

Synchronize with remote provider.

```markdown
/pm:sync

# Actions:
✓ Fetched latest issues
✓ Updated local cache
✓ Synced labels
✓ Refreshed milestones
```

### /pm:import [source]

Import issues from external source.

```markdown
/pm:import jira-export.json

# Output:
Imported:
- 45 issues
- 8 epics
- 120 comments
- 15 labels
```

## Advanced Commands

### /pm:epic:merge [source] [target]

Merge one epic into another.

```markdown
/pm:epic:merge old-auth new-auth

# Actions:
✓ Moved 8 issues
✓ Updated descriptions
✓ Archived source epic
```

### /pm:epic:refresh [id]

Refresh epic from child issues.

```markdown
/pm:epic:refresh user-management

# Updates:
✓ Progress: 60% → 75%
✓ Status: Active → Near Completion
✓ Timeline: Updated estimates
```

### /pm:test:reference:update

Update test references in issues.

```markdown
/pm:test:reference:update

# Actions:
✓ Scanned 45 issues
✓ Updated 12 test links
✓ Fixed 3 broken references
```

## Provider-Specific Behavior

### GitHub

- Issues map to GitHub Issues
- Epics use GitHub Projects
- PRDs stored as markdown in repo
- Labels for categorization

### Azure DevOps

- Issues map to Work Items
- Epics use Azure Epics
- PRDs as wiki pages
- Area paths for organization

## Configuration

### Provider Settings

In `.claude/config.json`:

```json
{
  "projectManagement": {
    "provider": "github",
    "repository": "owner/repo",
    "project": "Project Name",
    "features": {
      "auto_assign": true,
      "auto_label": true,
      "epic_tracking": true
    }
  }
}
```

### Command Aliases

Create custom aliases in `.claude/commands/pm/aliases.md`:

```markdown
/pm:todo → /pm:issue:list --assignee=@me --status=todo
/pm:wip → /pm:issue:list --status=in-progress
/pm:issue-close → /pm:issue:list --status=done --sprint=current
```

## Best Practices

1. **Regular Sync**: Run `/pm:sync` daily
2. **Status Updates**: Use `/pm:standup` for daily updates
3. **Epic Decomposition**: Break down epics before starting
4. **Validation**: Run `/pm:validate` weekly
5. **Clean Up**: Use `/pm:clean` at sprint end

## Troubleshooting

### Command Not Found

```markdown
/pm:help
# Shows all available commands

# If still not working:
- Check provider configuration
- Verify authentication
- Run /pm:init
```

### Sync Issues

```markdown
# Force refresh
/pm:sync --force

# Check connection
/pm:validate
```

### Performance

```markdown
# Clear cache
/pm:clean --cache

# Optimize queries
/pm:sync --optimize
```

## Related Pages

- [Azure DevOps Integration](Azure-DevOps-Integration)
- [Configuration Options](Configuration-Options)
- [Agent Selection Guide](Agent-Selection-Guide)
- [Testing Strategies](Testing-Strategies)