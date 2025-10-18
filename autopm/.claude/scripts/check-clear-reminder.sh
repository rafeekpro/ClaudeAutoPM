#!/bin/bash

# Check for /clear reminder
#
# This script checks if there's a pending /clear reminder
# and displays it to the user.
#
# Should be run at session start or before new commands.

REMINDER_FILE=".claude/.clear-reminder"

if [ -f "$REMINDER_FILE" ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                   🧹 PENDING /clear REMINDER                   ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "⚠️  You have a pending context clear reminder from:"
    echo ""
    cat "$REMINDER_FILE"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Why this is important:"
    echo "  • Prevents context bleed from previous issue"
    echo "  • Ensures fresh start for new task"
    echo "  • Improves response quality"
    echo "  • Reduces token waste"
    echo ""
    echo "Action required:"
    echo "  1. Type: /clear"
    echo "  2. This reminder will be automatically removed"
    echo "  3. Then proceed with your new task"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Optional: Block until /clear is run
    # Uncomment to enforce /clear before proceeding:
    # read -p "Press Enter after running /clear to continue..."
    # rm "$REMINDER_FILE"
fi
