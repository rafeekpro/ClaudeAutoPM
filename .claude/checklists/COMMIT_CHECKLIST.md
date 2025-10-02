# 🛡️ Commit Safety Checklist

## 🚨 Problem Solved by This Document
**Error: Pushing failing tests to GitHub**
- Tests fail only on CI/CD
- You waste time on "fix CI" commits
- You block the team with broken code

## ✅ Implemented Solutions

### 1. **Git Hooks** (Automatic)
Install automatically and check:

#### 📝 Pre-commit Hook (`.git/hooks/pre-commit`)
- ✓ Runs unit tests
- ✓ Checks build
- ✓ Runs linter
- ✓ Blocks commit if something fails

#### 🚀 Pre-push Hook (`.git/hooks/pre-push`)
- ✓ FULL test suite (including e2e)
- ✓ Production build
- ✓ TypeScript type checking
- ✓ Checks for merge conflicts
- ✓ Warns about large files
- ✓ Searches for leftover TODO/FIXME

### 2. **Safe Commit Script** (`scripts/safe-commit.sh`)
Usage:
```bash
./scripts/safe-commit.sh "feat: add new feature"
```

What it does:
1. Formats code (prettier, black)
2. Fixes linting (eslint --fix)
3. Runs all tests
4. Builds the project
5. Checks TypeScript
6. Searches for potential secrets
7. Automatically stages and commits

### 3. **NPM Scripts** (for Node.js projects)
Add to `package.json`:

```json
{
  "scripts": {
    "precommit": "npm test && npm run build && npm run lint",
    "verify": "npm test && npm run build && npm run lint && npm run typecheck",
    "safe-commit": "./scripts/safe-commit.sh",
    "prepush": "npm run verify && npm run test:e2e",
    "ci:local": "npm ci && npm run verify && npm run test:e2e"
  }
}
```

## 📋 Manual Checklist (if hooks fail)

### Before EVERY commit:
```bash
□ npm test                  # Tests passing?
□ npm run build            # Build successful?
□ npm run lint             # Linter clean?
□ npm run typecheck        # TypeScript OK?
□ git diff                 # Reviewed changes?
```

### Before EVERY push:
```bash
□ npm run test:e2e         # E2E tests passing?
□ npm run ci:local         # CI simulation passing?
□ git log -3               # Commits look OK?
□ gh pr checks             # Previous PR checks green?
```

## 🔥 Quick Fixes

### If tests fail locally

```bash
# See exactly what fails
npm test -- --verbose

# Run specific test
npm test -- path/to/test.spec.js

# Debug mode
npm test -- --detectOpenHandles
```

### If build fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

### If hooks don't work

```bash
# Reinstall hooks
rm -rf .git/hooks/pre-*
cp scripts/hooks/* .git/hooks/
chmod +x .git/hooks/*

# Or use Husky
npx husky install
```

## 💡 Pro Tips

### 1. Alias in .bashrc/.zshrc

```bash
alias gc="./scripts/safe-commit.sh"
alias verify="npm test && npm run build && npm run lint"
```

### 2. VS Code settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 3. Local CI simulation

```bash
# Exactly what GitHub Actions does
npm ci
npm run build
npm test
npm run lint
npm run test:e2e
```

## ⚠️ When you can DISABLE hooks (CAREFULLY!)

```bash
# Only in emergencies!
git commit --no-verify -m "emergency: fix critical bug"
git push --no-verify

# BUT THEN:
npm run ci:local  # Check you didn't break anything
```

## 📊 Monitoring

Check regularly:

```bash
# Hooks status
ls -la .git/hooks/

# Recent CI failures
gh run list --workflow=ci.yml --status=failure

# Your recent commits
git log --author="$(git config user.name)" --oneline -10
```

## 🎯 Goal: ZERO failing tests on GitHub

**Remember:**

- GitHub CI is a formality, not a debugging place
- Every "fix CI" commit is wasted time
- Local = fast, CI = slow
- **ALWAYS test locally before pushing!**

---

*If tests passed locally but fail on CI, check:*

- Node.js/Python version differences
- Environment variables
- File permissions
- Linux/Mac/Windows differences
