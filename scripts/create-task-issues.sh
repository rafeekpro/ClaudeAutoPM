#!/bin/bash
# Create GitHub issues for all tasks in epic

cd .claude/epics/ccpm-001-features-integration/

echo "Creating GitHub issues for all tasks..."
echo ""

for task_file in task-*.md; do
  if [ "$task_file" != "task-*.md" ]; then
    task_num=$(echo "$task_file" | grep -o '[0-9]\+' | head -1)
    task_title=$(grep "^title:" "$task_file" | head -1 | sed 's/title: //')

    echo "Creating issue for TASK-$task_num: $task_title"

    issue_url=$(gh issue create \
      --title "[TASK-$task_num] $task_title" \
      --body-file "$task_file" \
      --label "task" --label "enhancement")

    echo "  ✅ Created: $issue_url"
    echo ""
  fi
done

echo "✅ All task issues created!"
