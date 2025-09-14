#!/bin/bash

# Migration script from worktrees to branches
# This script helps users transition from the deprecated worktree strategy

echo "🔄 ClaudeAutoPM Git Strategy Migration"
echo "======================================"
echo ""
echo "This script will help you migrate from worktrees to the unified branch strategy."
echo ""

# Check for existing worktrees
WORKTREES=$(git worktree list | grep -v "bare" | tail -n +2)

if [ -z "$WORKTREES" ]; then
    echo "✅ No worktrees found. You're already using the branch strategy!"
    exit 0
fi

echo "⚠️  Found existing worktrees:"
echo "$WORKTREES"
echo ""
echo "Migration steps:"
echo "1. Stash or commit any uncommitted changes in worktrees"
echo "2. Remove worktrees"
echo "3. Switch to branch-based workflow"
echo ""

read -p "Do you want to proceed with migration? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Process each worktree
while IFS= read -r line; do
    if [ -z "$line" ]; then
        continue
    fi

    WORKTREE_PATH=$(echo "$line" | awk '{print $1}')
    BRANCH_NAME=$(echo "$line" | awk '{print $3}' | tr -d '[]')

    echo ""
    echo "Processing worktree: $WORKTREE_PATH (branch: $BRANCH_NAME)"

    # Check for uncommitted changes
    cd "$WORKTREE_PATH" 2>/dev/null
    if [ $? -eq 0 ]; then
        if [ -n "$(git status --porcelain)" ]; then
            echo "  ⚠️  Uncommitted changes found in $WORKTREE_PATH"
            echo "  Please commit or stash these changes first:"
            git status --short
            echo ""
            read -p "  Press Enter when ready to continue..."
        fi
        cd - > /dev/null
    fi

    # Remove the worktree
    echo "  Removing worktree..."
    git worktree remove "$WORKTREE_PATH" --force

    if [ $? -eq 0 ]; then
        echo "  ✅ Worktree removed successfully"
    else
        echo "  ❌ Failed to remove worktree. You may need to remove it manually."
    fi

done <<< "$WORKTREES"

echo ""
echo "🎉 Migration complete!"
echo ""
echo "Next steps:"
echo "1. Use 'git checkout <branch-name>' to work on existing branches"
echo "2. Use 'git checkout -b <new-branch>' to create new branches"
echo "3. Follow the unified Git strategy in 'autopm/.claude/rules/git-strategy.md'"
echo ""
echo "Remember: NO MORE WORKTREES! Use branches for all development."