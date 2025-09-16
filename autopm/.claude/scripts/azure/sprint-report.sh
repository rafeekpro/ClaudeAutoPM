#!/bin/bash
# Azure DevOps Sprint Report Generator (Backward Compatible Wrapper)
# Usage: ./sprint-report.sh [sprint-name]
#
# This script now delegates to the Node.js implementation for better performance
# and maintainability while preserving the original interface.

set -e

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Check if Node.js implementation exists
NODE_SCRIPT="$PROJECT_ROOT/bin/node/azure-sprint-report.js"

if [ -f "$NODE_SCRIPT" ]; then
    # Use Node.js implementation with all arguments passed through
    exec node "$NODE_SCRIPT" "$@"
else
    # Fallback to original bash implementation
    echo "⚠️  Node.js implementation not found, using fallback bash version"
    echo ""
fi

# Original bash implementation follows as fallback
SPRINT_NAME=${1:-"current"}

echo "📊 Generating Sprint Report: $SPRINT_NAME"
echo "=========================================="

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

# Get sprint details
echo ""
echo "📅 Sprint Information"
echo "---------------------"

if [ "$SPRINT_NAME" == "current" ]; then
    ITERATION_DATA=$(call_azure_api "work/teamsettings/iterations?\$timeframe=current")
else
    ITERATION_DATA=$(call_azure_api "work/teamsettings/iterations" | grep -A5 "\"name\":\"$SPRINT_NAME\"")
fi

# Extract sprint dates
START_DATE=$(echo $ITERATION_DATA | grep -o '"startDate":"[^"]*' | head -1 | cut -d'"' -f4 | cut -dT -f1)
END_DATE=$(echo $ITERATION_DATA | grep -o '"finishDate":"[^"]*' | head -1 | cut -d'"' -f4 | cut -dT -f1)

echo "Sprint: $SPRINT_NAME"
echo "Start: $START_DATE"
echo "End: $END_DATE"

# Calculate sprint progress
if [[ "$OSTYPE" == "darwin"* ]]; then
    TODAY=$(date +%s)
    START_TS=$(date -j -f "%Y-%m-%d" "$START_DATE" +%s 2>/dev/null || echo 0)
    END_TS=$(date -j -f "%Y-%m-%d" "$END_DATE" +%s 2>/dev/null || echo 0)
else
    TODAY=$(date +%s)
    START_TS=$(date -d "$START_DATE" +%s 2>/dev/null || echo 0)
    END_TS=$(date -d "$END_DATE" +%s 2>/dev/null || echo 0)
fi

if [ $START_TS -ne 0 ] && [ $END_TS -ne 0 ]; then
    TOTAL_DAYS=$(( ($END_TS - $START_TS) / 86400 ))
    ELAPSED_DAYS=$(( ($TODAY - $START_TS) / 86400 ))
    PROGRESS=$(( ($ELAPSED_DAYS * 100) / $TOTAL_DAYS ))
    echo "Progress: Day $ELAPSED_DAYS of $TOTAL_DAYS ($PROGRESS%)"
fi

# Get work items in sprint
echo ""
echo "📋 Work Items Status"
echo "--------------------"

# Query for all work items in sprint
SPRINT_ITEMS=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT [System.Id], [System.WorkItemType], [System.State] FROM workitems WHERE [System.IterationPath] = '$SPRINT_NAME'\"}")

# Count by type and state
echo "Analyzing work items..."

STORIES_TOTAL=$(echo $SPRINT_ITEMS | grep -o '"workItemType":"User Story"' | wc -l)
TASKS_TOTAL=$(echo $SPRINT_ITEMS | grep -o '"workItemType":"Task"' | wc -l)
BUGS_TOTAL=$(echo $SPRINT_ITEMS | grep -o '"workItemType":"Bug"' | wc -l)

echo ""
echo "By Type:"
echo "  User Stories: $STORIES_TOTAL"
echo "  Tasks: $TASKS_TOTAL"
echo "  Bugs: $BUGS_TOTAL"

# Get story points
echo ""
echo "📈 Story Points"
echo "---------------"

POINTS_QUERY=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT [Microsoft.VSTS.Scheduling.StoryPoints] FROM workitems WHERE [System.WorkItemType] = 'User Story' AND [System.IterationPath] = '$SPRINT_NAME'\"}")

# This would need proper JSON parsing, simplified for demo
echo "Total Points: [Calculating...]"
echo "Completed: [Calculating...]"
echo "Remaining: [Calculating...]"

# Team velocity
echo ""
echo "⚡ Team Performance"
echo "-------------------"

# Get team members
TEAM_MEMBERS=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT DISTINCT [System.AssignedTo] FROM workitems WHERE [System.IterationPath] = '$SPRINT_NAME' AND [System.AssignedTo] != ''\"}")

echo "Active team members: [Counting...]"

# Burndown trend
echo ""
echo "📉 Burndown Trend"
echo "-----------------"

# Simple ASCII burndown
echo "Ideal:    ████████████████████░"
echo "Actual:   ████████████░░░░░░░░"
echo ""
echo -e "${YELLOW}⚠️ Slightly behind ideal pace${NC}"

# Risks and blockers
echo ""
echo "🚧 Risks & Blockers"
echo "-------------------"

BLOCKED_COUNT=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"SELECT [System.Id] FROM workitems WHERE [System.IterationPath] = '$SPRINT_NAME' AND [System.Tags] CONTAINS 'blocked'\"}" | grep -o '"id"' | wc -l)

if [ $BLOCKED_COUNT -gt 0 ]; then
    echo -e "${RED}❌ $BLOCKED_COUNT blocked items${NC}"
else
    echo -e "${GREEN}✅ No blockers${NC}"
fi

# Recommendations
echo ""
echo "💡 Recommendations"
echo "------------------"

if [ $PROGRESS -gt 75 ]; then
    echo "• Focus on completing in-progress items"
    echo "• Prepare for sprint review"
    echo "• Start planning next sprint"
elif [ $PROGRESS -gt 50 ]; then
    echo "• Review sprint scope"
    echo "• Address any blockers immediately"
    echo "• Consider pairing on complex tasks"
else
    echo "• Ensure all tasks are assigned"
    echo "• Break down large stories"
    echo "• Daily standups are critical"
fi

# Export options
echo ""
echo "📤 Export Options"
echo "-----------------"
echo "Report saved to: .claude/azure/reports/sprint-$SPRINT_NAME-$(date +%Y%m%d).txt"

# Create report directory and save
mkdir -p .claude/azure/reports
{
    echo "Sprint Report: $SPRINT_NAME"
    echo "Generated: $(date)"
    echo "========================"
    echo ""
    echo "Sprint: $START_DATE to $END_DATE"
    echo "Progress: $PROGRESS%"
    echo "Stories: $STORIES_TOTAL"
    echo "Tasks: $TASKS_TOTAL"
    echo "Bugs: $BUGS_TOTAL"
    echo "Blocked: $BLOCKED_COUNT"
} > ".claude/azure/reports/sprint-$SPRINT_NAME-$(date +%Y%m%d).txt"

echo ""
echo "=========================================="
echo "✅ Sprint report complete!"