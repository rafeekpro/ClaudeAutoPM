# Hybrid Development Workflow

## Strategy

This project uses a **hybrid workflow** that adapts to different scenarios:

### Direct to Main (Trunk-Based)
Used for:
- 🚀 Hotfixes and critical patches
- ✅ Trusted core contributors
- 📝 Documentation updates
- 🔧 Small, low-risk changes
- 🤖 Automated bot commits

**Requirements:**
- Must pass all pre-commit hooks
- Must run `npm test` locally
- Must include descriptive commit message

### Pull Request Workflow
Required for:
- 👥 External contributors
- 🏗️ Major features or breaking changes
- 🔍 Changes requiring review
- 🧪 Experimental features
- 📦 Dependency updates

**Process:**
1. Fork or create feature branch
2. Make changes with tests
3. Open PR with description
4. Pass CI checks
5. Get approval (if required)
6. Merge

## Branch Protection Rules

### Main Branch
- ✅ Allow direct commits from trusted contributors
- ✅ Require status checks for PRs
- ✅ Dismiss stale reviews on new commits
- ❌ Do NOT require PRs for all changes

### Feature Branches
- Named: `feat/*`, `fix/*`, `docs/*`
- Auto-delete after merge
- Can be force-pushed by owner

## Decision Matrix

| Change Type | Direct Commit | Pull Request |
|------------|---------------|--------------|
| Hotfix | ✅ Preferred | ⚠️ If complex |
| Documentation | ✅ Preferred | Optional |
| Minor feature | ✅ Allowed | Recommended |
| Major feature | ❌ Discouraged | ✅ Required |
| Breaking change | ❌ Not allowed | ✅ Required |
| External contributor | ❌ Not allowed | ✅ Required |
| Dependency update | ⚠️ Caution | ✅ Preferred |

## Guidelines

### When to Commit Directly
```bash
# Small fix with confidence
git add .
git commit -m "fix: resolve navigation issue"
git push origin main
```

### When to Use PR
```bash
# Feature requiring discussion
git checkout -b feat/new-system
git add .
git commit -m "feat: implement new subsystem"
git push origin feat/new-system
# Then open PR on GitHub
```

## Automation

### Dependabot
- Creates PRs for dependency updates
- Auto-merge for patch versions if tests pass

### GitHub Actions
- Runs on both direct commits and PRs
- More extensive checks on PRs
- Quick validation on direct commits

## Best Practices

1. **Use conventional commits** regardless of workflow
2. **Run tests locally** before any push
3. **Keep commits atomic** and focused
4. **Write clear commit messages**
5. **Use PRs for discussion** when uncertain

## Migration Path

Teams can gradually move between workflows:
- Start with PRs for everything (safer)
- Grant direct commit access as trust builds
- Use protection rules to enforce standards

This hybrid approach provides flexibility while maintaining quality.