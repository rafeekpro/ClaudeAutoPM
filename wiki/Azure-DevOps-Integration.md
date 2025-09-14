# Azure DevOps Integration

ClaudeAutoPM provides comprehensive integration with Azure DevOps, enabling seamless work item management, pull request workflows, and pipeline automation directly from Claude Code.

## Overview

The Azure DevOps integration allows you to:
- Manage work items (User Stories, Tasks, Bugs)
- Create and review pull requests
- Track sprints and iterations
- Run pipelines and view test results
- Synchronize with Azure Boards

## Configuration

### Prerequisites

1. Azure DevOps organization and project
2. Personal Access Token (PAT) with appropriate permissions
3. Node.js azure-devops-node-api package (installed automatically)

### Setting Up Integration

#### 1. Environment Variables

Edit `.claude/.env`:

```bash
# Azure DevOps Configuration
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/yourorg
AZURE_DEVOPS_PROJECT=YourProject
AZURE_DEVOPS_PAT=your_personal_access_token_here

# Optional: Team Configuration
AZURE_TEAM=YourTeam
AZURE_AREA_PATH=YourProject\\TeamArea
AZURE_ITERATION_PATH=YourProject\\Sprint 1

# Board Columns
AZURE_BOARD_COLUMN_TODO=New
AZURE_BOARD_COLUMN_DOING=Active
AZURE_BOARD_COLUMN_DONE=Closed
```

#### 2. Generate Personal Access Token

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Click "New Token"
3. Select scopes:
   - Work Items (Read, Write, Manage)
   - Code (Read, Write)
   - Build (Read, Execute)
   - Release (Read, Write, Execute)
4. Copy token to `.claude/.env`

#### 3. Validate Configuration

```bash
# Test connection
node autopm/.claude/providers/azure/test-connection.js

# Or use PM command
/pm:validate
```

## Command Mapping

Azure DevOps commands follow the unified `/pm:resource:action` pattern:

| Command | Azure DevOps Mapping |
|---------|---------------------|
| `/pm:issue:list` | List work items |
| `/pm:issue:show [id]` | Show work item details |
| `/pm:issue:create` | Create work item |
| `/pm:issue:start [id]` | Move to Active, assign to self |
| `/pm:issue:close [id]` | Close work item |
| `/pm:pr:create` | Create pull request |
| `/pm:pr:list` | List pull requests |
| `/pm:board:show` | Show board status |
| `/pm:sprint:status` | Current sprint overview |

## Work Item Management

### Listing Work Items

```javascript
// Implementation: autopm/.claude/providers/azure/issue-list.js
/pm:issue:list

// Output:
Active Work Items:
- #1234: Implement authentication [Task] @john
- #1235: Fix login bug [Bug] @jane
- #1236: Add user profile [User Story] Unassigned
```

### Viewing Work Item Details

```javascript
// Implementation: autopm/.claude/providers/azure/issue-show.js
/pm:issue:show 1234

// Output:
Work Item #1234
Type: Task
Title: Implement authentication
State: Active
Assigned To: John Doe
Area Path: MyProject\Security
Iteration: Sprint 15
Description: Implement JWT-based authentication...
Acceptance Criteria:
- Users can login
- Tokens expire after 24 hours
```

### Starting Work

```javascript
// Implementation: autopm/.claude/providers/azure/issue-start.js
/pm:issue:start 1234

// Actions:
✓ Assigned to you
✓ State changed to Active
✓ Created branch: feature/1234-authentication
✓ Updated board column
```

### Creating Work Items

```javascript
/pm:issue:create --type Task --title "Add logging" --area Security

// Creates:
Work Item #1237
Type: Task
Title: Add logging
Area: MyProject\Security
State: New
```

## Pull Request Workflow

### Creating Pull Requests

```javascript
// Implementation: autopm/.claude/providers/azure/pr-create.js
/pm:pr:create --target main --title "Add authentication"

// Creates PR with:
- Auto-linked work items
- Generated description
- Assigned reviewers
- Build validation
```

### PR Templates

Azure DevOps PR template (`.azuredevops/pull_request_template.md`):

```markdown
## Description
Brief description of changes

## Related Work Items
- AB#1234

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## Board Management

### Viewing Board Status

```javascript
// Implementation: autopm/.claude/providers/azure/board-show.js
/pm:board:show

// Output:
Sprint 15 Board
─────────────────────────────────
New (3)          Active (5)       Resolved (2)    Closed (8)
├─ #1236        ├─ #1234        ├─ #1230       ├─ #1220
├─ #1237        ├─ #1235        └─ #1231       ├─ #1221
└─ #1238        ├─ #1232                       └─ ...
                ├─ #1233
                └─ #1239
```

## Sprint Management

### Sprint Status

```javascript
/pm:sprint:status

// Output:
Sprint 15 (Jan 15 - Jan 29)
Progress: 65% Complete

Velocity: 32 points
Completed: 21 points
Remaining: 11 points

Burndown:
Day 1:  ████████████████████ 32
Day 5:  ███████████████      28
Day 10: ████████             21
Today:  ██████               11
```

## Epic Management

### Listing Epics

```javascript
// Implementation: autopm/.claude/providers/azure/epic-list.js
/pm:epic:list

// Output:
Active Epics:
- Authentication System (40% complete)
  └─ 5 features, 12 user stories, 28 tasks
- Payment Integration (10% complete)
  └─ 3 features, 8 user stories, 15 tasks
```

## Pipeline Integration

### Running Builds

```javascript
/pm:build:run --pipeline "CI Build"

// Output:
Build #456 Started
Pipeline: CI Build
Branch: feature/1234-authentication
Status: InProgress

Steps:
✓ Checkout
✓ Restore packages
⚡ Build solution
○ Run tests
○ Publish artifacts
```

### Viewing Test Results

```javascript
// Implementation: autopm/.claude/providers/azure/test-summary.js
/pm:test:summary --build 456

// Output:
Test Results for Build #456
Total: 245 tests
Passed: 240 (98%)
Failed: 5 (2%)

Failed Tests:
- AuthenticationTests.TestInvalidToken
- AuthenticationTests.TestExpiredToken
- UserTests.TestDuplicateEmail
```

## Query Examples

### Custom Queries

```javascript
// Get all bugs in current sprint
/pm:query "SELECT [Id], [Title] FROM WorkItems WHERE [Work Item Type] = 'Bug' AND [Iteration Path] = @CurrentIteration"

// Get my active items
/pm:query "@MyWorkItems AND [State] = 'Active'"
```

## Provider Implementation

### Architecture

```
autopm/.claude/providers/azure/
├── issue-list.js       # List work items
├── issue-show.js       # Show work item details
├── issue-start.js      # Start work on item
├── issue-close.js      # Close work item
├── issue-edit.js       # Edit work item
├── pr-create.js        # Create pull request
├── pr-list.js          # List pull requests
├── board-show.js       # Show board
├── epic-list.js        # List epics
├── epic-show.js        # Show epic details
├── test-run.js         # Run tests
├── test-summary.js     # Test results
└── lib/
    ├── client.js       # Azure DevOps API client
    ├── formatter.js    # Output formatting
    └── cache.js        # Request caching
```

### API Client

```javascript
// lib/client.js
const azdev = require('azure-devops-node-api');

class AzureDevOpsClient {
  constructor() {
    const token = process.env.AZURE_DEVOPS_PAT;
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;

    this.connection = azdev.WebApi(orgUrl,
      azdev.getPersonalAccessTokenHandler(token));
  }

  async getWorkItem(id) {
    const witApi = await this.connection.getWorkItemTrackingApi();
    return await witApi.getWorkItem(id, null, null,
      WorkItemExpand.All);
  }
}
```

## Caching Strategy

The Azure provider implements intelligent caching:

```javascript
// lib/cache.js
class AzureCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }
}
```

## Migration from GitHub

### Work Item Mapping

| GitHub | Azure DevOps |
|--------|--------------|
| Issue | Work Item (Bug/Task/User Story) |
| Project | Epic/Feature |
| Milestone | Iteration/Sprint |
| Label | Tag |
| Assignee | Assigned To |

### Command Equivalents

| GitHub Command | Azure DevOps Command |
|---------------|---------------------|
| `gh issue list` | `/pm:issue:list` |
| `gh pr create` | `/pm:pr:create` |
| `gh project view` | `/pm:board:show` |

## Best Practices

### 1. Work Item Hierarchy

```
Epic
└── Feature
    └── User Story
        └── Task
            └── Bug
```

### 2. State Management

```javascript
// Typical workflow
New → Active → Resolved → Closed

// With review
New → Active → Code Review → Testing → Closed
```

### 3. Branch Strategy

```bash
# Feature branches from work items
feature/1234-short-description
bugfix/5678-issue-description
hotfix/9012-critical-fix
```

### 4. Commit Messages

```bash
# Link to work items
git commit -m "AB#1234 Implement authentication

- Added JWT tokens
- Created login endpoint
- Added tests"
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
curl -u :$AZURE_DEVOPS_PAT \
  $AZURE_DEVOPS_ORG_URL/_apis/projects

# Check PAT permissions
# Ensure PAT has required scopes
```

### Work Item Not Found

```javascript
// Check project settings
/pm:validate

// Verify area path
echo $AZURE_AREA_PATH

// Try with full ID
/pm:issue:show YourProject-1234
```

### Permission Errors

1. Verify PAT has correct scopes
2. Check user has project access
3. Ensure area/iteration permissions

## Advanced Features

### Bulk Operations

```javascript
// Close multiple items
/pm:issue:close 1234,1235,1236 "Sprint completed"

// Move items to next sprint
/pm:sprint:move 1237,1238 "Sprint 16"
```

### Automation

```yaml
# Azure Pipeline integration
trigger:
  branches:
    include:
    - main
    - feature/*

steps:
- script: |
    # Auto-link work items
    echo "##vso[build.addbuildtag]AB#$(WorkItemId)"
```

## Related Pages

- [PM Commands](PM-Commands)
- [Configuration Options](Configuration-Options)
- [GitHub Actions](GitHub-Actions)
- [Testing Strategies](Testing-Strategies)