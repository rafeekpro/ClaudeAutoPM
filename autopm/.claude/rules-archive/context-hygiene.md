# Context Hygiene - MANDATORY

**🧹 CRITICAL: Run `/clear` between issues to prevent context bleed.**

## Core Requirement

**YOU MUST CLEAR CONTEXT AFTER COMPLETING EACH ISSUE.**

Context from previous issues can:
- ❌ Cause incorrect assumptions
- ❌ Mix concerns from different tasks
- ❌ Waste tokens on irrelevant history
- ❌ Reduce response quality

## When to Run /clear

### ✅ ALWAYS Clear After:

1. **Issue/Task Completion**
   - After merging PR that closes an issue
   - After marking task as complete
   - Before starting new issue

2. **Context Switches**
   - Switching between different features
   - Moving to different part of codebase
   - Changing from bug fix to feature development

3. **Long Conversations**
   - After 20+ messages in one issue
   - When context window getting full
   - When conversation becomes unfocused

4. **Daily Boundaries**
   - At end of work day
   - At start of new work session
   - After long breaks

### 🔴 NEVER Skip /clear When:

- Closing an issue (MOST IMPORTANT)
- Starting a new issue
- Switching work contexts
- After merge conflicts resolved
- After completing refactoring

## How to Use /clear

### Manual Trigger:

```bash
# Type this in Claude Code CLI:
/clear
```

### Expected Behavior:

```
Claude Code: "Context cleared. Ready for next task."
```

## Enforcement

### Git Hook Reminder

Pre-commit hook detects issue closure and reminds:

```
🧹 CONTEXT HYGIENE REMINDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  This commit closes an issue!

📋 IMPORTANT: After this commit, run /clear before starting
   the next issue to prevent context bleed.

Next steps:
  1. ✅ Complete this commit
  2. 🧹 Type: /clear
  3. 📝 Start next issue with clean context
```

### PM Command Integration

PM commands include `/clear` reminders:

```bash
# After completing issue
/pm:issue-complete 123

# Output includes:
# ✅ Issue #123 marked as complete
# 🧹 REMINDER: Run /clear before starting next issue
```

## Workflow Integration

### Standard Issue Workflow:

```bash
# 1. Start issue
/pm:issue-start 123

# 2. Work on issue...
# ... implement, test, commit ...

# 3. Complete issue
git commit -m "fix: resolve issue #123"
git push

# 4. CLEAR CONTEXT (MANDATORY)
/clear

# 5. Start next issue with clean slate
/pm:issue-start 124
```

### Example Violation:

❌ **WRONG - No /clear:**
```bash
# Complete issue 123
git commit -m "fix: issue #123"

# Immediately start issue 124 (BAD!)
/pm:issue-start 124
# Context from #123 still present!
```

✅ **CORRECT - With /clear:**
```bash
# Complete issue 123
git commit -m "fix: issue #123"

# Clear context (REQUIRED)
/clear

# Now start issue 124
/pm:issue-start 124
# Fresh context, no bleed from #123
```

## Why This Matters

### Context Bleed Examples:

**Without /clear:**
```
Issue #123: Add user authentication
Claude remembers: "We're working on auth..."

Issue #124: Fix database query bug
Claude thinks: "This must be related to auth system from #123"
# WRONG ASSUMPTION - wastes time debugging wrong area
```

**With /clear:**
```
Issue #123: Add user authentication
/clear

Issue #124: Fix database query bug
Claude thinks: "Fresh start, what's the actual issue?"
# CORRECT - focuses on actual problem
```

### Token Efficiency:

**Without /clear:**
- Context window: 50k+ tokens from previous issues
- Available for work: 150k tokens
- Efficiency: 75%

**With /clear:**
- Context window: 5k tokens (fresh start)
- Available for work: 195k tokens
- Efficiency: 97.5%

## Best Practices

### 1. Clear After Every PR Merge

```bash
# Merge PR
gh pr merge 123 --squash

# Immediate clear
/clear

# Ready for next task
```

### 2. Clear Before Starting New Feature

```bash
# Check what's next
/pm:backlog

# Pick issue
/pm:issue-start 125

# But first...
/clear

# Now start fresh
/pm:issue-start 125
```

### 3. Clear After Context Gets Large

Check context size with:
```bash
# If conversation has 20+ messages
# Or if responses become slow
# Or if Claude seems confused

# CLEAR IT
/clear
```

## Automation Ideas

### Option 1: Auto-Clear on Issue Close

**PM command auto-clears:**
```bash
/pm:issue-complete 123
# Automatically runs /clear internally
```

### Option 2: Clear Reminder File

**Hook creates reminder:**
```bash
# After commit that closes issue
# Creates: .claude/.clear-reminder

# Next Claude interaction checks:
if [ -f .claude/.clear-reminder ]; then
  echo "⚠️  REMINDER: Run /clear before continuing"
fi
```

### Option 3: Session Start Check

**Check on session start:**
```bash
# In CLAUDE.md:
## Session Start Protocol
1. Check for .clear-reminder file
2. If exists, warn user
3. Remove file after /clear
```

## Summary

**Context hygiene is as important as code hygiene.**

### Remember:
- 🧹 **ALWAYS** `/clear` after issue completion
- 🧹 **ALWAYS** `/clear` before new issue
- 🧹 **ALWAYS** `/clear` on context switch

### Benefits:
- ✅ No context bleed between issues
- ✅ Better response quality
- ✅ More efficient token usage
- ✅ Clearer thinking for each task

**Make `/clear` a habit, not an afterthought.**
