# Unified Git Strategy for ClaudeAutoPM

This document defines the **SINGLE, AUTHORITATIVE** Git workflow for ClaudeAutoPM projects.

## Core Principle: Branch-Based Development

ClaudeAutoPM uses a **branch-based strategy** for all development work. This ensures simplicity, compatibility, and consistency across all environments and tools.

## Branch Hierarchy

```
main (or master)
├── epic/authentication
├── epic/dashboard
├── feature/issue-123
└── hotfix/critical-bug
```

## Creating Branches

Always create branches from a clean, updated main branch:

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create branch for epic
git checkout -b epic/{epic-name}
git push -u origin epic/{epic-name}

# Create branch for standalone issue
git checkout -b feature/issue-{number}
git push -u origin feature/issue-{number}
```

## Working in Branches

### Commit Standards

- **Small, focused commits**: Each commit should represent one logical change
- **Format**: `{type}(scope): {description} #{issue}`
- **Examples**:
  - `feat(auth): Add JWT validation #123`
  - `fix(api): Handle null response #456`
  - `docs(readme): Update installation steps #789`

### Daily Workflow

```bash
# Start your day - get latest changes
git pull origin epic/{name}

# Make changes
git add {files}
git commit -m "feat(scope): Description #issue"

# Push changes regularly
git push origin epic/{name}
```

### Parallel Agent Work

When multiple agents work on the same epic:

```bash
# Agent A completes work
git add src/api/*
git commit -m "feat(api): Add user endpoints #123"
git push origin epic/{name}

# Agent B starts work - MUST PULL FIRST
git pull origin epic/{name}
git add src/ui/*
git commit -m "feat(ui): Add dashboard #124"
git push origin epic/{name}
```

## Merging Strategy

### Pull Request Workflow

1. **Create PR when epic is ready**:
   ```bash
   gh pr create --base main --head epic/{name} \
     --title "Epic: {name}" \
     --body "Closes #{epic-issue}"
   ```

2. **Review and merge via GitHub/Azure DevOps UI**

3. **Clean up after merge**:
   ```bash
   git checkout main
   git pull origin main
   git branch -d epic/{name}
   git push origin --delete epic/{name}
   ```

### Direct Merge (for automated workflows)

```bash
# Update main
git checkout main
git pull origin main

# Merge epic
git merge --no-ff epic/{name} -m "Merge epic: {name}"
git push origin main

# Clean up
git branch -d epic/{name}
git push origin --delete epic/{name}
```

## Conflict Resolution

### Prevention is Key

1. **Pull frequently**: Always pull before starting work
2. **Communicate**: Use issue comments to coordinate file changes
3. **Small PRs**: Merge often to reduce conflict surface

### When Conflicts Occur

```bash
# During pull
git pull origin epic/{name}
# If conflicts occur, Git will notify you

# View conflicts
git status

# Resolve conflicts in your editor
# Then mark as resolved
git add {resolved-files}
git commit -m "resolve: Merge conflicts in {files}"
git push origin epic/{name}
```

## Branch Management

### Naming Conventions

- **Epics**: `epic/{epic-name}` (e.g., `epic/authentication`)
- **Features**: `feature/issue-{number}` (e.g., `feature/issue-123`)
- **Bugs**: `bugfix/issue-{number}` (e.g., `bugfix/issue-456`)
- **Hotfixes**: `hotfix/{description}` (e.g., `hotfix/security-patch`)

### Housekeeping

```bash
# List all branches
git branch -a

# Delete merged branches locally
git branch --merged | grep -v main | xargs -n 1 git branch -d

# Prune remote tracking branches
git remote prune origin
```

## Best Practices

1. **One branch per epic**: Keep epics isolated
2. **Update before work**: Always pull latest changes
3. **Commit frequently**: Small commits are easier to review
4. **Push regularly**: Keep remote in sync
5. **Clean up after merge**: Delete branches promptly
6. **Use descriptive names**: Clear branch names help everyone

## Integration with Providers

This Git strategy integrates seamlessly with:

- **GitHub**: Native branch support, PR workflows
- **Azure DevOps**: Branch policies, PR requirements
- **CI/CD**: All pipelines trigger on branch pushes

## Common Issues and Solutions

### Cannot push to branch

```bash
# Ensure you have the latest changes
git pull origin epic/{name} --rebase

# Force push if necessary (use with caution!)
git push origin epic/{name} --force-with-lease
```

### Accidentally committed to main

```bash
# Create a new branch with your changes
git branch epic/{name}

# Reset main to origin
git reset --hard origin/main

# Switch to your new branch
git checkout epic/{name}
```

### Need to switch context quickly

```bash
# Stash current changes
git stash save "WIP: Description"

# Switch branches
git checkout other-branch

# Later, restore changes
git checkout original-branch
git stash pop
```

## Migration Notice

**⚠️ IMPORTANT**: Git worktrees are NO LONGER SUPPORTED in ClaudeAutoPM. All development must use the branch strategy described in this document.

If you have existing worktrees:
1. Complete or stash any uncommitted work
2. Remove worktrees: `git worktree remove {path}`
3. Switch to branch-based workflow

## Summary

The branch-based Git strategy provides:
- ✅ Simplicity and familiarity
- ✅ Full tool compatibility
- ✅ Efficient CI/CD integration
- ✅ Clear, predictable workflows
- ✅ Minimal learning curve

This is the ONLY approved Git workflow for ClaudeAutoPM projects.