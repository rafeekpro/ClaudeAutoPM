#!/bin/bash
# Create Epic Issue
# Creates the main GitHub issue for an epic with proper labels and stats

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EPIC_NAME="${1:-}"

if [[ -z "$EPIC_NAME" ]]; then
    echo "❌ Error: Epic name required"
    echo "Usage: $0 <epic_name>"
    exit 1
fi

# Source utilities if they exist
if [[ -f "$SCRIPT_DIR/../../lib/github-utils.sh" ]]; then
    source "$SCRIPT_DIR/../../lib/github-utils.sh"
fi

EPIC_FILE=".claude/epics/$EPIC_NAME/epic.md"

if [[ ! -f "$EPIC_FILE" ]]; then
    echo "❌ Error: Epic file not found: $EPIC_FILE"
    exit 1
fi

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) not installed"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ Error: GitHub CLI not authenticated. Run: gh auth login"
    exit 1
fi

# Strip frontmatter and get content
epic_content=$(awk 'BEGIN{p=0} /^---$/{p++; next} p==2{print}' "$EPIC_FILE")

# Count tasks
task_count=$(find ".claude/epics/$EPIC_NAME" -name "[0-9]*.md" -type f 2>/dev/null | wc -l)

# Detect epic type (bug vs feature)
if echo "$epic_content" | grep -qi "bug\|fix\|error\|issue"; then
    labels="epic,bug"
else
    labels="epic,feature"
fi

# Create issue
echo "📝 Creating epic issue for: $EPIC_NAME"
echo "   Tasks: $task_count"
echo "   Labels: $labels"

# Create the issue
epic_number=$(gh issue create \
    --title "Epic: $EPIC_NAME" \
    --body "$epic_content

---
**Epic Statistics:**
- Tasks: $task_count
- Status: Planning
- Created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
" \
    --label "$labels" \
    2>&1 | grep -o '#[0-9]\+' | head -1 | sed 's/#//')

if [[ -z "$epic_number" ]]; then
    echo "❌ Error: Failed to create epic issue"
    exit 1
fi

echo "$epic_number"
