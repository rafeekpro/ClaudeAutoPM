# Framework Path Quick Reference

## ⚠️ Critical Rule

**NEVER** hardcode `autopm/` paths in framework files. After installation, only `.claude/` exists.

## ✅ Correct Patterns

```bash
# Shell scripts
bash .claude/scripts/pm/epic-sync/create-epic-issue.sh

# Node.js
node .claude/lib/commands/pm/prdStatus.js

# Source imports
source .claude/scripts/lib/github-utils.sh
```

## ❌ Wrong Patterns

```bash
# DON'T DO THIS
bash autopm/.claude/scripts/pm/epic-sync/create-epic-issue.sh
node autopm/.claude/lib/commands/pm/prdStatus.js
source autopm/.claude/scripts/lib/github-utils.sh
```

## 🛡️ Protection System

### Automatic (Pre-commit Hook)
```bash
# Runs automatically on every commit
git commit -m "your message"
# → Validates paths before allowing commit
```

### Manual Validation
```bash
# Run anytime
npm run validate:paths
```

### One-Time Setup
```bash
# After cloning repository
npm run setup:githooks
```

## 📋 Files That Need This Rule

- ✅ Commands: `autopm/.claude/commands/**/*.md`
- ✅ Scripts: `autopm/.claude/scripts/**/*.sh` and `**/*.js`
- ✅ Agents: `autopm/.claude/agents/**/*.md`
- ✅ Rules: `autopm/.claude/rules/**/*.md`

## 🔍 If You Get Blocked

```bash
# Pre-commit hook blocks you?
# 1. Check what's wrong
npm run validate:paths

# 2. Fix the paths in the reported files
# Replace 'autopm/.claude/' with '.claude/'

# 3. Try committing again
git add .
git commit -m "your message"
```

## 📚 Full Documentation

- **Complete Rules**: `autopm/.claude/rules/framework-path-rules.md`
- **Project Guidelines**: `CLAUDE.md` (Development Guidelines section)

## 🎯 Why This Matters

```
Development:           After Installation:
autopm/                user-project/
├── .claude/    →     ├── .claude/     ← Only this exists!
└── ...               └── ...
```

Paths with `autopm/` will **break** for users after installation!
