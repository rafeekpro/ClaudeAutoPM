#!/bin/bash

# Pre-Commit Clear Reminder Hook
#
# Detects when an issue is being closed and reminds to run /clear
# before starting the next issue.

# Get the commit message
COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE" 2>/dev/null || git log --format=%B -n 1 HEAD 2>/dev/null)

# Patterns that indicate issue closure
CLOSING_PATTERNS=(
    "close #"
    "closes #"
    "closed #"
    "fix #"
    "fixes #"
    "fixed #"
    "resolve #"
    "resolves #"
    "resolved #"
    "complete #"
    "completes #"
    "completed #"
)

# Check if commit message contains issue closing keywords
issue_closed=false
for pattern in "${CLOSING_PATTERNS[@]}"; do
    if echo "$COMMIT_MSG" | grep -qi "$pattern"; then
        issue_closed=true
        break
    fi
done

# If issue is being closed, show reminder
if [ "$issue_closed" = true ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧹 CONTEXT HYGIENE REMINDER"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  This commit closes an issue!"
    echo ""
    echo "📋 IMPORTANT: After this commit, run /clear before starting"
    echo "   the next issue to prevent context bleed."
    echo ""
    echo "Why this matters:"
    echo "  • Prevents mixing context from different issues"
    echo "  • Ensures Claude starts fresh for each task"
    echo "  • Reduces token usage"
    echo "  • Improves response quality"
    echo ""
    echo "Next steps:"
    echo "  1. ✅ Complete this commit"
    echo "  2. 🧹 Type: /clear"
    echo "  3. 📝 Start next issue with clean context"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Optional: Create a reminder file
    echo "REMINDER: Run /clear before next issue" > .claude/.clear-reminder
fi

# Always allow commit to proceed
exit 0
