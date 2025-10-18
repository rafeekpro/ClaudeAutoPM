# Context Hygiene Strategy

## Problem

Users forget to run `/clear` between issues, causing:
- Context bleed from previous tasks
- Incorrect assumptions
- Wasted tokens
- Lower response quality

## Solution: Multi-Layer Enforcement

### Layer 1: Git Hook Reminder (Passive)

**File:** `autopm/.claude/hooks/pre-commit-clear-reminder.sh`

**Triggers when:**
- Commit message contains issue closure keywords
- Keywords: "closes #", "fixes #", "resolves #", etc.

**Action:**
- Displays reminder after commit
- Creates `.claude/.clear-reminder` file
- Non-blocking (allows commit to proceed)

**Example:**
```bash
git commit -m "fix: closes #123"

# Output:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧹 CONTEXT HYGIENE REMINDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  This commit closes an issue!

📋 IMPORTANT: After this commit, run /clear before starting
   the next issue to prevent context bleed.

Next steps:
  1. ✅ Complete this commit
  2. 🧹 Type: /clear
  3. 📝 Start next issue with clean context
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Layer 2: Session Start Check (Active)

**File:** `autopm/.claude/scripts/check-clear-reminder.sh`

**Triggers when:**
- New Claude Code session starts
- User runs PM commands
- `.claude/.clear-reminder` file exists

**Action:**
- Displays reminder about pending `/clear`
- Shows reason (which issue was closed)
- Optionally blocks until `/clear` is run

**Example:**
```bash
# User starts new session or runs command
# Script detects .clear-reminder file

╔════════════════════════════════════════════════════════════════╗
║                   🧹 PENDING /clear REMINDER                   ║
╚════════════════════════════════════════════════════════════════╝

⚠️  You have a pending context clear reminder from:

REMINDER: Run /clear before next issue (closed #123)

Action required:
  1. Type: /clear
  2. This reminder will be automatically removed
  3. Then proceed with your new task
```

### Layer 3: Rule Documentation (Educational)

**File:** `autopm/.claude/rules/context-hygiene.md`

**Content:**
- Mandatory `/clear` usage rules
- When to clear context
- Why it matters
- Examples of context bleed
- Best practices
- Workflow integration

**Purpose:**
- Claude reads this rule at session start
- Educational for users
- Reference for team members

### Layer 4: PM Command Integration (Automated)

**Enhancement to PM commands:**

```bash
# After issue completion
/pm:issue-complete 123

# Command output includes:
✅ Issue #123 marked as complete
📊 Time spent: 2h 30m
🔗 Related PR: #456

🧹 REMINDER: Run /clear before starting next issue
   Reason: Prevents context bleed
   Command: /clear

# Optionally auto-creates .clear-reminder file
```

## Implementation Priority

### Phase 1: Immediate (Non-Blocking)
- ✅ Create git hook reminder
- ✅ Create context-hygiene.md rule
- ✅ Create check script

### Phase 2: Integration
- [ ] Add to PM commands output
- [ ] Add to CLAUDE.md template
- [ ] Add to installation process

### Phase 3: Automation
- [ ] Auto-clear option in PM commands
- [ ] Session start integration
- [ ] Optional blocking enforcement

## User Experience

### Scenario 1: Forgot to /clear

```bash
# User closes issue
git commit -m "fix: closes #123"
# Hook shows reminder

# User forgets and starts new session
claude
# Session start shows: "⚠️  PENDING /clear REMINDER"

# User runs /clear
/clear
# Reminder file removed automatically
```

### Scenario 2: Remembered to /clear

```bash
# User closes issue
git commit -m "fix: closes #123"
# Hook shows reminder

# User immediately clears
/clear
# Reminder file created but then removed

# Next session - no warning
claude
# No pending reminders
```

### Scenario 3: PM Command Integration

```bash
# Complete issue via PM command
/pm:issue-complete 123

# Output:
# ✅ Issue #123 complete
# 🧹 Context cleared automatically
# Ready for next task

# OR (if manual clear required):
# ✅ Issue #123 complete
# ⚠️  Run /clear before next issue
```

## Configuration Options

### User Preferences

**In `.claude/config.json`:**

```json
{
  "context_hygiene": {
    "auto_clear_on_issue_close": false,
    "remind_on_session_start": true,
    "remind_on_commit": true,
    "block_until_clear": false,
    "reminder_file": ".claude/.clear-reminder"
  }
}
```

**Options:**
- `auto_clear_on_issue_close`: PM commands auto-clear
- `remind_on_session_start`: Show reminder on new session
- `remind_on_commit`: Git hook displays reminder
- `block_until_clear`: Block until `/clear` is run
- `reminder_file`: Location of reminder file

## Benefits

### For Users:
- ✅ No context bleed between issues
- ✅ Better response quality
- ✅ More efficient token usage
- ✅ Clearer thinking per task
- ✅ Automatic reminders (don't need to remember)

### For Teams:
- ✅ Consistent workflow across team
- ✅ Better collaboration (clean handoffs)
- ✅ Reduced confusion
- ✅ Improved code quality

### For Framework:
- ✅ Built-in best practice
- ✅ Automated enforcement
- ✅ Configurable per project
- ✅ Educational for users

## Testing

### Test Case 1: Hook Triggers on Issue Close

```bash
# Setup
git add .
git commit -m "fix: closes #123"

# Expected:
# - Hook displays reminder
# - .clear-reminder file created
# - Commit succeeds
```

### Test Case 2: Session Start Reminder

```bash
# Setup
touch .claude/.clear-reminder
echo "REMINDER: Run /clear (closed #123)" > .claude/.clear-reminder

# Start new session
./autopm/.claude/scripts/check-clear-reminder.sh

# Expected:
# - Reminder displayed
# - Instructions shown
```

### Test Case 3: Clean Workflow

```bash
# Complete issue
git commit -m "fix: closes #123"
# See reminder

# Clear context
/clear

# Start new issue
/pm:issue-start 124

# Expected:
# - No old context
# - No confusion
# - Fresh start
```

## Future Enhancements

### Option 1: Auto-Clear in PM Commands

```bash
/pm:issue-complete 123 --auto-clear
# Automatically clears context
```

### Option 2: Claude Code Integration

```bash
# Built into Claude Code CLI
claude --clear-on-issue-close
```

### Option 3: VS Code Extension

```javascript
// VS Code command
vscode.commands.executeCommand('claude.clearContext');
```

### Option 4: GitHub Actions Integration

```yaml
# .github/workflows/clear-context.yml
name: Clear Context Reminder
on:
  issues:
    types: [closed]
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Post reminder
        run: echo "Remember to /clear in Claude Code"
```

## Summary

**Multi-layer approach:**
1. 🔔 Git hook - Passive reminder
2. ⚠️  Session check - Active warning
3. 📖 Documentation - Education
4. 🤖 PM integration - Automation

**Result:**
- Hard to forget `/clear`
- Multiple touchpoints
- Configurable enforcement
- Better workflow hygiene
