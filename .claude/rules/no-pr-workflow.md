# No Pull Request Workflow

## CURRENT DEVELOPMENT WORKFLOW

**All changes are merged directly to main branch without Pull Requests.**

## Key Rules

1. **Direct Main Branch Development**
   - All work happens directly on main branch
   - No feature branches required
   - No pull requests needed

2. **Commit Workflow**
   ```bash
   # Always ensure main is up to date
   git checkout main
   git pull origin main
   
   # Make changes
   # ... edit files ...
   
   # Commit and push directly
   git add .
   git commit -m "feat: Description of changes"
   git push origin main
   ```

3. **Commit Message Format**
   - Use conventional commits: `type: description`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Be descriptive but concise

4. **Before Pushing**
   - Ensure tests pass locally
   - Verify build succeeds
   - Check for conflicts with `git pull`

5. **Conflict Resolution**
   ```bash
   # If push fails due to remote changes
   git pull origin main
   # Resolve any conflicts
   git add .
   git commit -m "merge: Resolve conflicts"
   git push origin main
   ```

## What This Means

- **NO** creating pull requests
- **NO** waiting for PR reviews
- **NO** feature branches (unless explicitly needed)
- **YES** direct commits to main
- **YES** immediate integration
- **YES** rapid iteration

## When to Use Feature Branches

Feature branches should only be used when:
1. Explicitly requested by project owner
2. Working on experimental features
3. Major refactoring that might break main

## Prohibited Actions

- Do not create PRs unless explicitly requested
- Do not suggest PR workflows
- Do not create feature branches by default
- Do not wait for reviews before merging

## Benefits of This Workflow

1. **Speed**: No waiting for PR reviews
2. **Simplicity**: No branch management overhead
3. **Continuous Integration**: Changes immediately available
4. **Reduced Context Switching**: Stay on main branch

## Safety Measures

Even without PRs, maintain quality through:
- Comprehensive test coverage
- Pre-commit hooks for linting/formatting
- CI/CD pipeline validation
- Regular backups/tags for rollback

## Git Aliases for Efficiency

```bash
# Add to ~/.gitconfig
[alias]
    # Quick commit and push to main
    qcp = !git add . && git commit -m "$1" && git push origin main
    # Update and push
    up = !git pull origin main && git push origin main
    # Status and log
    sl = !git status && git log --oneline -5
```

## Important Note

This workflow is intentional and by design. Do not suggest switching to PR-based workflows unless explicitly asked by the project owner.