#!/bin/bash

# Epic Status Checker
# Part of ClaudeAutoPM Framework
# Usage: ./scripts/epic-status.sh [epic-name]

EPIC_NAME=${1:-}

if [ -z "$EPIC_NAME" ]; then
    echo "Usage: $0 <epic-name>"
    echo ""
    echo "Available epics:"
    if [ -d ".claude/epics" ]; then
        ls -1 .claude/epics/ 2>/dev/null || echo "No epics found"
    else
        echo "No .claude/epics directory found"
    fi
    exit 1
fi

EPIC_DIR=".claude/epics/$EPIC_NAME"

if [ ! -d "$EPIC_DIR" ]; then
    echo "Error: Epic '$EPIC_NAME' not found"
    echo ""
    echo "Available epics:"
    ls -1 .claude/epics/ 2>/dev/null
    exit 1
fi

echo "Epic: $EPIC_NAME"
echo "===================="
echo ""

# Count total tasks
total_tasks=$(find "$EPIC_DIR" -maxdepth 2 -name "[0-9][0-9][0-9].md" 2>/dev/null | wc -l | tr -d ' ')

# Count completed tasks (looking for status: completed in frontmatter)
completed=0
in_progress=0
pending=0

for task_file in $(find "$EPIC_DIR" -maxdepth 2 -name "[0-9][0-9][0-9].md" 2>/dev/null); do
    if grep -q "^status: completed" "$task_file" 2>/dev/null; then
        completed=$((completed + 1))
    elif grep -q "^status: in-progress\|^status: in_progress" "$task_file" 2>/dev/null; then
        in_progress=$((in_progress + 1))
    else
        pending=$((pending + 1))
    fi
done

# Calculate progress percentage
if [ "$total_tasks" -gt 0 ]; then
    progress=$((completed * 100 / total_tasks))
else
    progress=0
fi

echo "Total tasks:     $total_tasks"
echo "Completed:       $completed ($progress%)"
echo "In Progress:     $in_progress"
echo "Pending:         $pending"
echo ""

# Progress bar
if [ "$total_tasks" -gt 0 ]; then
    bar_length=50
    filled=$((progress * bar_length / 100))
    empty=$((bar_length - filled))

    printf "Progress: ["
    printf "%${filled}s" | tr ' ' '='
    printf "%${empty}s" | tr ' ' '-'
    printf "] %d%%\n" "$progress"
    echo ""
fi

# Show breakdown by sub-epic if they exist
sub_dirs=$(find "$EPIC_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')

if [ "$sub_dirs" -gt 0 ]; then
    echo "Sub-Epic Breakdown:"
    echo "-------------------"

    for sub_dir in "$EPIC_DIR"/*/; do
        if [ -d "$sub_dir" ]; then
            sub_name=$(basename "$sub_dir")
            sub_count=$(find "$sub_dir" -maxdepth 1 -name "[0-9][0-9][0-9].md" 2>/dev/null | wc -l | tr -d ' ')

            if [ "$sub_count" -gt 0 ]; then
                # Count completed in sub-epic
                sub_completed=0
                for task_file in $(find "$sub_dir" -maxdepth 1 -name "[0-9][0-9][0-9].md" 2>/dev/null); do
                    if grep -q "^status: completed" "$task_file" 2>/dev/null; then
                        sub_completed=$((sub_completed + 1))
                    fi
                done

                printf "  %-30s %3d tasks (%d completed)\n" "$sub_name" "$sub_count" "$sub_completed"
            fi
        fi
    done
fi
