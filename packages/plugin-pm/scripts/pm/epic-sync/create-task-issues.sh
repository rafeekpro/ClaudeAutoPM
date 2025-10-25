#!/bin/bash
# Create Task Issues
# Creates GitHub issues for all tasks and generates mapping file

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EPIC_NAME="${1:-}"
EPIC_NUMBER="${2:-}"

if [[ -z "$EPIC_NAME" ]] || [[ -z "$EPIC_NUMBER" ]]; then
    echo "❌ Error: Epic name and epic number required"
    echo "Usage: $0 <epic_name> <epic_number>"
    exit 1
fi

EPIC_DIR=".claude/epics/$EPIC_NAME"

if [[ ! -d "$EPIC_DIR" ]]; then
    echo "❌ Error: Epic directory not found: $EPIC_DIR"
    exit 1
fi

# Mapping file - PERSISTENT location (not in /tmp)
MAPPING_FILE="$EPIC_DIR/.task-mapping.txt"
> "$MAPPING_FILE"  # Clear/create file

echo "📋 Creating task issues for epic #$EPIC_NUMBER"

# Find all task files (sequential numbered files)
task_files=$(find "$EPIC_DIR" -name "[0-9]*.md" -type f | sort)

if [[ -z "$task_files" ]]; then
    echo "❌ Error: No task files found in $EPIC_DIR"
    exit 1
fi

task_count=$(echo "$task_files" | wc -l)
echo "   Found $task_count tasks to create"

current=0

# Create issues for each task
for task_file in $task_files; do
    ((current++))

    task_basename=$(basename "$task_file" .md)

    # Strip frontmatter and get content
    task_content=$(awk 'BEGIN{p=0} /^---$/{p++; next} p==2{print}' "$task_file")

    # Extract title from first heading or use basename
    task_title=$(echo "$task_content" | grep -m1 "^#" | sed 's/^# *//' || echo "Task $task_basename")

    echo -n "   [$current/$task_count] Creating issue for task $task_basename... "

    # Create task issue
    issue_number=$(gh issue create \
        --title "$task_title" \
        --body "$task_content

---
**Task Information:**
- Epic: #$EPIC_NUMBER
- Original ID: $task_basename
- Created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
" \
        --label "task,epic:$EPIC_NAME" \
        2>&1 | grep -o '#[0-9]\+' | head -1 | sed 's/#//')

    if [[ -n "$issue_number" ]]; then
        echo "#$issue_number ✓"
        # Save mapping: old_name -> new_number
        echo "$task_basename $issue_number" >> "$MAPPING_FILE"
    else
        echo "FAILED"
        echo "⚠️  Failed to create issue for $task_basename"
    fi
done

echo ""
echo "✅ Created $current task issues"
echo "   Mapping saved to: $MAPPING_FILE"

# Output the mapping file path for next script
echo "$MAPPING_FILE"
