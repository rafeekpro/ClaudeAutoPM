#!/bin/bash
# Azure DevOps Daily Workflow Script
# Usage: ./daily.sh

set -e

echo "🌅 Starting Azure DevOps Daily Workflow"
echo "========================================"

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# Function to call Azure DevOps API
call_azure_api() {
    local endpoint=$1
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0"
}

# 1. Show standup summary
echo ""
echo "📋 Daily Standup Summary"
echo "------------------------"
echo "Fetching your completed tasks from yesterday..."

# Get yesterday's date
if [[ "$OSTYPE" == "darwin"* ]]; then
    YESTERDAY=$(date -v-1d +"%Y-%m-%d")
else
    YESTERDAY=$(date -d "yesterday" +"%Y-%m-%d")
fi

# Query for completed tasks
COMPLETED_TASKS=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT [System.Id], [System.Title] FROM workitems WHERE [System.WorkItemType] = 'Task' AND [System.ChangedDate] >= '${YESTERDAY}' AND [System.State] = 'Done' AND [System.AssignedTo] = @Me\"}")

echo "✅ Tasks completed yesterday: $(echo $COMPLETED_TASKS | grep -o '"id"' | wc -l)"

# 2. Show active work
echo ""
echo "🔄 Your Active Work"
echo "-------------------"

ACTIVE_TASKS=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT [System.Id], [System.Title], [Microsoft.VSTS.Scheduling.RemainingWork] FROM workitems WHERE [System.WorkItemType] = 'Task' AND [System.State] = 'In Progress' AND [System.AssignedTo] = @Me\"}")

echo "Active tasks: $(echo $ACTIVE_TASKS | grep -o '"id"' | wc -l)"

# 3. Check for blockers
echo ""
echo "🚧 Checking for Blockers"
echo "------------------------"

BLOCKED_ITEMS=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT [System.Id], [System.Title] FROM workitems WHERE [System.Tags] CONTAINS 'blocked' AND [System.State] != 'Closed'\"}")

BLOCKED_COUNT=$(echo $BLOCKED_ITEMS | grep -o '"id"' | wc -l)
if [ $BLOCKED_COUNT -gt 0 ]; then
    echo "⚠️  Found $BLOCKED_COUNT blocked items!"
else
    echo "✅ No blockers found"
fi

# 4. Sprint status
echo ""
echo "📊 Sprint Status"
echo "----------------"

# Get current iteration
CURRENT_ITERATION=$(call_azure_api "work/teamsettings/iterations?`$timeframe=current")
SPRINT_NAME=$(echo $CURRENT_ITERATION | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Current Sprint: $SPRINT_NAME"

# 5. Suggest next task
echo ""
echo "🎯 Suggested Next Task"
echo "----------------------"

echo "Analyzing priorities and dependencies..."

# Query for highest priority unassigned task
NEXT_TASK=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT TOP 1 [System.Id], [System.Title] FROM workitems WHERE [System.WorkItemType] = 'Task' AND [System.State] = 'To Do' AND ([System.AssignedTo] = '' OR [System.AssignedTo] = @Me) ORDER BY [Microsoft.VSTS.Common.Priority] ASC\"}")

if echo $NEXT_TASK | grep -q '"workItems":\[\]'; then
    echo "No tasks available. Check backlog or blocked items."
else
    TASK_ID=$(echo $NEXT_TASK | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    echo "Recommended: Task #$TASK_ID"
    echo ""
    echo "To start this task, run:"
    echo "  /azure:task-start $TASK_ID"
fi

echo ""
echo "========================================"
echo "✅ Daily workflow complete!"
echo ""
echo "Quick actions:"
echo "  1. Start recommended task"
echo "  2. View sprint dashboard (/azure:sprint-status)"
echo "  3. Check blocked items (/azure:blocked-items)"
echo "  4. View all your tasks (/azure:task-list --my-tasks)"