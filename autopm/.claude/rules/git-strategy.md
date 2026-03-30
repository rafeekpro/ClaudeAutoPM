# Git Strategy for ClaudeAutoPM

Branch-based development ONLY. No git worktrees.

## Branch Hierarchy

```
main (or master)
├── epic/{epic-name}
├── feature/issue-{number}
├── bugfix/issue-{number}
└── hotfix/{description}
```

## Creating Branches

```bash
git checkout main && git pull origin main
git checkout -b epic/{epic-name}
git push -u origin epic/{epic-name}
```

## Commit Standards

- **Format**: `{type}(scope): {description} #{issue}`
- **Small, focused commits** — one logical change per commit
- Examples: `feat(auth): Add JWT validation #123`, `fix(api): Handle null response #456`

## Parallel Agent Work

```bash
# Agent A completes work and pushes
git push origin epic/{name}

# Agent B MUST PULL FIRST before starting
git pull origin epic/{name}
```

## Merging

### Pull Request Workflow

```bash
gh pr create --base main --head epic/{name} \
  --title "Epic: {name}" --body "Closes #{epic-issue}"
```

### After Merge

```bash
git checkout main && git pull origin main
git branch -d epic/{name}
git push origin --delete epic/{name}
```

## Conflict Resolution

1. Pull frequently — always before starting work
2. Small PRs — merge often to reduce conflict surface
3. When conflicts occur: resolve, `git add`, commit with `resolve:` prefix

## Housekeeping

```bash
git branch --merged | grep -v main | xargs -n 1 git branch -d
git remote prune origin
```

## Best Practices

1. One branch per epic — keep epics isolated
2. Pull before work, push after work
3. Commit frequently, keep commits small
4. Clean up branches after merge
