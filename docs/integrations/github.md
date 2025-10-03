# GitHub Integration

Complete guide to GitHub integration with ClaudeAutoPM.

## Quick Setup

```bash
# 1. Create token at https://github.com/settings/tokens
# Scopes: repo, workflow, admin:repo_hook

# 2. Configure
autopm config set provider github
autopm config set github.owner YOUR_USERNAME
autopm config set github.repo YOUR_REPO
export GITHUB_TOKEN=ghp_xxxxx

# 3. Validate
autopm config validate
```

## Features

- **Issue Management**: Create/update issues from epics
- **Pull Requests**: Automated PR creation
- **GitHub Actions**: CI/CD integration
- **Projects**: Project board synchronization

## Epic Sync

```bash
/pm:epic-sync epics/epic-001.md
```

Creates GitHub issues for all tasks in the epic.

## Troubleshooting

**Invalid token:**
```bash
# Regenerate token with correct scopes
autopm config validate
```

## Related

- [Epic Management](../cli-reference/epic.md)
- [Azure DevOps Integration](azure-devops.md)
