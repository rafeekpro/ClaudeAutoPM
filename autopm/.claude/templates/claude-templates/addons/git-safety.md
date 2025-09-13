## 🛡️ Git Safety & Commit Verification

### Git Hooks Setup

Configure automatic verification before commits and pushes:

#### Pre-commit Hook
Automatically runs before each commit:
- Unit tests
- Build verification
- Linter checks
- Blocks commit if anything fails

#### Pre-push Hook
Runs before pushing to remote:
- Full test suite (including E2E)
- Production build
- TypeScript type checking
- Checks for merge conflicts
- Warns about large files
- Searches for TODO/FIXME comments

### Safe Commit Script

Use the safe-commit script for comprehensive verification:

```bash
# Run safe commit with automatic checks
./scripts/safe-commit.sh "feat: your commit message"
```

The script automatically:
1. Formats code (prettier, black)
2. Fixes linting issues
3. Runs all tests
4. Builds the project
5. Checks TypeScript
6. Searches for potential secrets
7. Stages and commits changes

### NPM Scripts for Verification

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "precommit": "npm test && npm run build && npm run lint",
    "verify": "npm test && npm run build && npm run lint && npm run typecheck",
    "prepush": "npm run verify && npm run test:e2e",
    "ci:local": "npm ci && npm run verify && npm run test:e2e"
  }
}
```

### CI Simulation

Test exactly what CI/CD will run:

```bash
# Simulate full CI pipeline locally
npm ci
npm run build
npm test
npm run lint
npm run test:e2e
```

### Emergency Bypass

Only use in critical situations:

```bash
# Skip hooks (use sparingly!)
git commit --no-verify -m "emergency: critical fix"
git push --no-verify

# Always verify afterward
npm run ci:local
```

### Quick Verification Commands

```bash
# Before commit
npm test                  # Tests passing?
npm run build            # Build successful?
npm run lint             # Linter clean?
npm run typecheck        # TypeScript OK?

# Before push
npm run test:e2e         # E2E tests passing?
npm run ci:local         # CI simulation passing?
git log -3               # Commits look OK?
gh pr checks             # Previous PR checks green?
```

### Troubleshooting

#### If tests fail locally
```bash
npm test -- --verbose              # See details
npm test -- path/to/test.spec.js   # Run specific test
npm test -- --detectOpenHandles    # Debug mode
```

#### If build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
npx tsc --noEmit  # Check TypeScript errors
```

#### If hooks don't work
```bash
# Reinstall hooks
rm -rf .git/hooks/pre-*
cp scripts/hooks/* .git/hooks/
chmod +x .git/hooks/*
```

### Pro Tips

Add aliases to `.bashrc` or `.zshrc`:
```bash
alias gc="./scripts/safe-commit.sh"
alias verify="npm test && npm run build && npm run lint"
```

Configure VS Code for automatic formatting:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Monitoring

Regular checks:
```bash
ls -la .git/hooks/                                    # Hooks status
gh run list --workflow=ci.yml --status=failure        # Recent CI failures
git log --author="$(git config user.name)" -10        # Your recent commits
```

**Goal: Zero failing tests on GitHub CI/CD**
- Test locally before pushing
- GitHub CI should be a formality, not a debugging tool
- Every "fix CI" commit is wasted time