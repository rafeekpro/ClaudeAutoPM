---
name: github-mcp
command: npx
args: ["@modelcontextprotocol/server-github"]
env:
  GITHUB_PERSONAL_ACCESS_TOKEN: "${GITHUB_TOKEN:-}"
  GITHUB_API_URL: "${GITHUB_API_URL:-https://api.github.com}"
envFile: .claude/.env
description: GitHub MCP server for repository management and collaboration
category: integration
status: active
version: ">=1.0.0"
---

# GitHub MCP Server

## Description

The GitHub MCP Server provides comprehensive GitHub integration through the Model Context Protocol, enabling repository management, issue tracking, pull request workflows, and collaborative development features.

## Features

- **Repository Management**: Create, clone, configure repositories
- **Issue Tracking**: Create, update, search issues
- **Pull Requests**: Create, review, merge PRs
- **Actions/Workflows**: Manage GitHub Actions
- **Code Search**: Search across repositories
- **Release Management**: Create and manage releases
- **Team Collaboration**: Manage teams and permissions

## Configuration

### Required Environment Variables

- `GITHUB_PERSONAL_ACCESS_TOKEN`: Your GitHub PAT (required)

### Optional Environment Variables

- `GITHUB_API_URL`: GitHub API endpoint (for GitHub Enterprise)
- `GITHUB_DEFAULT_OWNER`: Default repository owner
- `GITHUB_DEFAULT_REPO`: Default repository name

### Token Permissions

Required scopes for full functionality:
```
repo          - Full repository access
workflow      - GitHub Actions workflows
write:packages - Package registry
admin:org     - Organization management (optional)
gist          - Gist creation (optional)
```

## Usage Examples

### Basic Setup

```bash
# Enable the server
autopm mcp enable github-mcp

# Configure authentication
echo "GITHUB_TOKEN=ghp_your_token_here" >> .claude/.env

# For a specific repository
echo "GITHUB_DEFAULT_OWNER=your-username" >> .claude/.env
echo "GITHUB_DEFAULT_REPO=your-repo" >> .claude/.env

# Sync configuration
autopm mcp sync
```

### Integration with Agents

Commonly used with:
- `github-operations-specialist` - For DevOps workflows
- `code-analyzer` - For PR reviews
- `test-runner` - For CI/CD integration

## MCP Commands

### Repository Operations

```javascript
// Get repository info
github.getRepository({ owner, repo })

// Create repository
github.createRepository({
  name: "new-repo",
  description: "Repository description",
  private: false,
  auto_init: true
})

// List repositories
github.listRepositories({ type: "owner" })
```

### Issue Management

```javascript
// Create issue
github.createIssue({
  title: "Bug: Application crashes",
  body: "Detailed description...",
  labels: ["bug", "high-priority"],
  assignees: ["username"]
})

// Update issue
github.updateIssue({
  issue_number: 123,
  state: "closed",
  labels: ["resolved"]
})

// Search issues
github.searchIssues({
  query: "is:open label:bug"
})
```

### Pull Request Workflows

```javascript
// Create PR
github.createPullRequest({
  title: "Feature: Add new functionality",
  head: "feature-branch",
  base: "main",
  body: "PR description..."
})

// Review PR
github.createReview({
  pull_number: 456,
  event: "APPROVE",
  body: "LGTM!"
})

// Merge PR
github.mergePullRequest({
  pull_number: 456,
  merge_method: "squash"
})
```

### GitHub Actions

```javascript
// Trigger workflow
github.triggerWorkflow({
  workflow_id: "ci.yml",
  ref: "main",
  inputs: { environment: "production" }
})

// Get workflow runs
github.listWorkflowRuns({
  workflow_id: "ci.yml",
  status: "completed"
})
```

## Advanced Features

### Code Search

```javascript
// Search code
github.searchCode({
  query: "function TODO in:file language:js repo:owner/repo"
})

// Search commits
github.searchCommits({
  query: "fix bug author:username"
})
```

### Release Management

```javascript
// Create release
github.createRelease({
  tag_name: "v1.0.0",
  name: "Version 1.0.0",
  body: "Release notes...",
  draft: false,
  prerelease: false
})

// Upload release asset
github.uploadReleaseAsset({
  release_id: 789,
  name: "app.zip",
  data: fileBuffer
})
```

### Webhooks

```javascript
// Create webhook
github.createWebhook({
  config: {
    url: "https://example.com/webhook",
    content_type: "json"
  },
  events: ["push", "pull_request"]
})
```

## Workflow Integration

### Automated PR Workflow

```yaml
workflow:
  - create_branch: feature/new-feature
  - commit_changes:
      message: "Add new feature"
  - create_pr:
      title: "Feature: New functionality"
      reviewers: ["reviewer1", "reviewer2"]
  - wait_for_checks: true
  - auto_merge:
      method: squash
      delete_branch: true
```

### Issue Triage

```yaml
triage:
  rules:
    - if: "title contains 'bug'"
      then:
        - add_label: bug
        - assign_to: bug-team
    - if: "title contains 'feature'"
      then:
        - add_label: enhancement
        - add_to_project: feature-requests
```

## Best Practices

1. **Authentication**
   - Use fine-grained PATs
   - Rotate tokens regularly
   - Store securely in .env

2. **Rate Limiting**
   - Monitor API usage
   - Implement caching
   - Use conditional requests

3. **Branch Protection**
   - Require PR reviews
   - Enable status checks
   - Protect main branch

4. **Automation**
   - Use GitHub Actions for CI/CD
   - Automate repetitive tasks
   - Implement proper error handling

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify token is valid
   - Check token permissions
   - Ensure token hasn't expired

2. **Rate Limit Exceeded**
   - Check rate limit status
   - Implement exponential backoff
   - Use authenticated requests

3. **Permission Denied**
   - Verify repository access
   - Check organization permissions
   - Ensure proper token scopes

### Debug Mode

```bash
# Enable debug logging
export GITHUB_DEBUG=true
export NODE_DEBUG=github
```

## Security Considerations

1. **Token Security**
   - Never commit tokens
   - Use environment variables
   - Implement token rotation

2. **Repository Access**
   - Use least privilege principle
   - Review collaborator permissions
   - Enable 2FA

3. **Webhook Security**
   - Validate webhook signatures
   - Use HTTPS endpoints
   - Implement IP allowlisting

## GitHub Enterprise

For GitHub Enterprise Server:

```bash
# Configure enterprise URL
export GITHUB_API_URL=https://github.enterprise.com/api/v3
export GITHUB_GRAPHQL_URL=https://github.enterprise.com/api/graphql
```

## Rate Limits

### API Limits
- Authenticated: 5,000 requests/hour
- Search: 30 requests/minute
- GraphQL: 5,000 points/hour

### Checking Rate Limit

```javascript
github.getRateLimit()
// Returns: { limit, remaining, reset }
```

## Version History

- **1.0.0**: Initial MCP integration
- **1.1.0**: Added Actions support
- **1.2.0**: GraphQL API integration
- **1.3.0**: Enterprise support
- **1.4.0**: Advanced search capabilities

## Related Resources

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Operations Specialist](../agents/devops/github-operations-specialist.md)