# Hybrid Development Workflow

## FLEXIBLE DEVELOPMENT STRATEGY

**This project supports both direct commits and Pull Requests, adapting to different scenarios and team needs.**

## Workflow Options

### 1. Direct to Main (Trunk-Based)
**When to use:**
- ✅ You're a trusted core contributor
- ✅ Making hotfixes or critical patches
- ✅ Small, low-risk changes
- ✅ Documentation updates
- ✅ Working solo or in a small, high-trust team

**Process:**
```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Make changes
# ... edit files ...

# Run tests locally
npm test

# Commit and push directly
git add .
git commit -m "fix: resolve critical issue"
git push origin main
```

### 2. Pull Request Workflow
**When to use:**
- ✅ You're an external contributor
- ✅ Making major features or breaking changes
- ✅ Changes need review or discussion
- ✅ Working in a larger team
- ✅ Updating dependencies

**Process:**
```bash
# Create feature branch
git checkout -b feat/new-feature

# Make changes
# ... edit files ...

# Commit and push to branch
git add .
git commit -m "feat: add new feature"
git push origin feat/new-feature

# Open PR on GitHub
```

## Decision Matrix

| Scenario | Direct Commit | Pull Request |
|----------|--------------|--------------|
| **Hotfix** | ✅ Preferred | Use if complex |
| **Documentation** | ✅ Preferred | Optional |
| **Minor feature** | ✅ Allowed | Recommended |
| **Major feature** | ❌ Discouraged | ✅ Required |
| **Breaking change** | ❌ Not allowed | ✅ Required |
| **External contributor** | ❌ Not allowed | ✅ Required |
| **Dependency update** | ⚠️ Use caution | ✅ Preferred |
| **Experimental work** | ❌ Not allowed | ✅ Required |

## Commit Guidelines

### Commit Message Format
Always use conventional commits regardless of workflow:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Testing
- `chore:` Maintenance

### Before Any Push
1. **Run tests locally**: `npm test`
2. **Check linting**: `npm run lint`
3. **Verify build**: `npm run build`
4. **Pull latest changes**: `git pull origin main`

## Branch Protection Settings

### Main Branch
- ✅ Allow direct commits from administrators
- ✅ Require status checks for PRs
- ✅ Run CI/CD on both direct commits and PRs
- ❌ Do NOT require PRs for all changes

### Feature Branches
- Naming: `feat/*`, `fix/*`, `docs/*`, `chore/*`
- Auto-delete after merge
- Can be force-pushed by creator

## CI/CD Behavior

### On Direct Commits
- Run essential tests quickly
- Deploy if tests pass
- Rollback on failure

### On Pull Requests
- Run comprehensive test suite
- Generate coverage reports
- Preview deployments (if applicable)
- Security scanning

## Safety Measures

Both workflows maintain quality through:
- **Pre-commit hooks** for formatting and linting
- **Automated testing** on every push
- **Rollback capability** via git tags
- **Protected credentials** via secrets management

## Team Evolution Path

Teams can adapt their workflow over time:

1. **Starting Out** → Use PRs for everything
2. **Building Trust** → Allow direct commits for docs
3. **High Trust** → Direct commits for most changes
4. **Optimal** → Hybrid based on change type

## Git Aliases for Efficiency

```bash
# Add to ~/.gitconfig
[alias]
    # Direct commit and push
    dcp = !git add . && git commit -m "$1" && git push origin main

    # Create PR branch
    pr = checkout -b

    # Update main
    update = !git checkout main && git pull origin main

    # Quick status
    st = status -sb
```

## Key Benefits

### Direct Commits
- 🚀 Maximum speed
- 🎯 Minimal overhead
- ⚡ Instant integration

### Pull Requests
- 🔍 Code review
- 💬 Discussion platform
- 📝 Change documentation
- 🛡️ Additional safety

## Important Notes

1. **This is intentional design** - Supporting both workflows provides flexibility
2. **Choose based on context** - Not all changes are equal
3. **Trust is earned** - Start with PRs, earn direct commit access
4. **Quality over speed** - When in doubt, use a PR

## Migration Support

### From PR-Only
- Grant direct access gradually
- Start with documentation commits
- Monitor quality metrics

### From Direct-Only
- Introduce PRs for major changes
- Use branch protection rules
- Educate on PR benefits

This hybrid approach ensures the project can adapt to different team sizes, trust levels, and development phases while maintaining code quality and velocity.