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

# Add documentation comment to issue
echo "📎 Adding local documentation links to issue #$epic_number..."

# Extract PRD name from epic file
prd_name=$(grep -A 5 "^prd:" "$EPIC_FILE" | grep -v "^prd:" | head -1 | tr -d ' ')
if [[ -z "$prd_name" ]]; then
    prd_name="$EPIC_NAME"
fi

# Create comment with documentation links
cat > /tmp/epic-doc-comment.md <<EOF
📁 **Local Documentation**

This epic is tracked locally at:
- **Epic file**: \`.claude/epics/$EPIC_NAME/epic.md\`
- **PRD**: \`.claude/prds/$prd_name.md\`

**For developers**: Clone the repository and review these files for:
- Complete technical specifications
- Acceptance criteria
- Implementation details
- Task breakdown

**File Structure**:
\`\`\`
.claude/epics/$EPIC_NAME/
├── epic.md           # This epic (#$epic_number)
├── 001.md           # Task 1 (will be issue #XX)
├── 002.md           # Task 2 (will be issue #XX)
└── ...              # Additional tasks
\`\`\`

Tasks will be created as sub-issues and linked here.
EOF

# Add comment to issue
if gh issue comment "$epic_number" --body-file /tmp/epic-doc-comment.md &> /dev/null; then
    echo "✅ Documentation links added to issue #$epic_number"
else
    echo "⚠️ Warning: Failed to add documentation comment (issue created successfully)"
fi

# Cleanup
rm -f /tmp/epic-doc-comment.md

echo "$epic_number"
