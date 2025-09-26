#!/bin/bash
# Azure DevOps Next Task Script (Backward Compatible Wrapper)
# AI-powered task recommendation based on priority and context
# Usage: ./next-task.sh [--user=me]
#
# This script now delegates to the Node.js implementation for better performance
# and maintainability while preserving the original interface.

set -e

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Check if Node.js implementation exists
NODE_SCRIPT="$PROJECT_ROOT/bin/node/azure-next-task.js"

if [ -f "$NODE_SCRIPT" ]; then
    # Use Node.js implementation with all arguments passed through
    exec node "$NODE_SCRIPT" "$@"
else
    # Fallback to original bash implementation
    echo "⚠️  Node.js implementation not found, using fallback bash version"
    echo ""
fi

# Original bash implementation follows as fallback
USER_FILTER=${1:-"--user=me"}

echo "🤖 Azure DevOps Next Task Recommendation"
echo "========================================"
echo ""

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

echo "Analyzing available tasks..."
echo ""

# Get current sprint
CURRENT_SPRINT=$(call_azure_api "work/teamsettings/iterations?\$timeframe=current" | 
                grep -o '"path":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$CURRENT_SPRINT" ]; then
    echo "Current Sprint: $CURRENT_SPRINT"
else
    echo "No active sprint found"
fi

# Query for available tasks
QUERY="SELECT [System.Id], [System.Title], [System.State], 
       [Microsoft.VSTS.Common.Priority], [System.Tags],
       [Microsoft.VSTS.Scheduling.RemainingWork], [System.AssignedTo],
       [System.WorkItemType], [System.Description]
FROM workitems 
WHERE [System.WorkItemType] IN ('Task', 'Bug')
AND [System.State] IN ('New', 'To Do', 'Ready')"

# Add user filter
if [[ "$USER_FILTER" == --user=* ]]; then
    USER_EMAIL="${USER_FILTER#*=}"
    if [ "$USER_EMAIL" == "me" ]; then
        QUERY="$QUERY AND ([System.AssignedTo] = @Me OR [System.AssignedTo] = '')"
    fi
fi

# Add sprint filter if available
if [ ! -z "$CURRENT_SPRINT" ]; then
    QUERY="$QUERY AND [System.IterationPath] = '$CURRENT_SPRINT'"
fi

QUERY="$QUERY ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.Id] ASC"

response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\"}")

ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -z "$ids" ]; then
    echo -e "${YELLOW}No available tasks found. Checking for tasks to unblock...${NC}"
    echo ""
    
    # Check for blocked tasks that might be unblocked
    BLOCKED_QUERY="SELECT [System.Id], [System.Title] 
    FROM workitems 
    WHERE [System.Tags] CONTAINS 'blocked' 
    AND [System.State] != 'Closed'"
    
    blocked_response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$BLOCKED_QUERY\"}")
    
    blocked_ids=$(echo "$blocked_response" | grep -o '"id":[0-9]*' | cut -d: -f2)
    
    if [ ! -z "$blocked_ids" ]; then
        echo -e "${RED}Found blocked tasks that need resolution:${NC}"
        for bid in $blocked_ids; do
            echo "  • Task #$bid is blocked"
        done
        echo ""
        echo "Consider running: /azure:blocked-items --resolve"
    fi
    
    exit 0
fi

# Score and rank tasks
declare -A task_scores
declare -A task_info

echo "Evaluating $(echo "$ids" | wc -l) available tasks..."
echo ""

for id in $ids; do
    item=$(call_azure_api "wit/workitems/$id")
    
    # Parse fields
    title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4)
    priority=$(echo "$item" | grep -o '"Microsoft.VSTS.Common.Priority":[0-9]*' | cut -d: -f2)
    tags=$(echo "$item" | grep -o '"System.Tags":"[^"]*' | cut -d'"' -f4)
    remaining=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.RemainingWork":[0-9]*' | cut -d: -f2)
    type=$(echo "$item" | grep -o '"System.WorkItemType":"[^"]*' | cut -d'"' -f4)
    description=$(echo "$item" | grep -o '"System.Description":"[^"]*' | cut -d'"' -f4 | cut -c1-100)
    
    # Calculate score (lower is better)
    score=0
    
    # Priority weight (1=highest priority)
    score=$((score + ${priority:-3} * 100))
    
    # Bug bonus (bugs get priority)
    if [ "$type" == "Bug" ]; then
        score=$((score - 50))
    fi
    
    # Quick win bonus (small tasks)
    if [ ! -z "$remaining" ] && [ $remaining -le 2 ]; then
        score=$((score - 30))
    fi
    
    # Critical tag bonus
    if [[ "$tags" == *"critical"* ]] || [[ "$tags" == *"urgent"* ]]; then
        score=$((score - 75))
    fi
    
    # Dependencies check (tasks with no dependencies)
    deps_query="SELECT [System.Id] FROM WorkItemLinks
                WHERE Target.[System.Id] = $id
                AND [System.Links.LinkType] = 'System.LinkTypes.Dependency-Reverse'"
    
    deps_response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$deps_query\"}" 2>/dev/null || echo "{}")
    
    if ! echo "$deps_response" | grep -q '"id"'; then
        score=$((score - 20))  # No dependencies bonus
    fi
    
    task_scores[$id]=$score
    task_info[$id]="$type|$title|$priority|${remaining:-0}|$tags|$description"
done

# Find best task
best_id=""
best_score=999999

for id in "${!task_scores[@]}"; do
    if [ ${task_scores[$id]} -lt $best_score ]; then
        best_score=${task_scores[$id]}
        best_id=$id
    fi
done

# Display recommendation
echo -e "${GREEN}🎯 Recommended Next Task${NC}"
echo "========================"
echo ""

if [ ! -z "$best_id" ]; then
    IFS='|' read -r type title priority remaining tags description <<< "${task_info[$best_id]}"
    
    echo -e "${BLUE}Task #$best_id${NC}"
    echo "Title: $title"
    echo "Type: $type"
    echo "Priority: P${priority:-3}"
    echo "Estimated: ${remaining}h"
    if [ ! -z "$tags" ]; then
        echo "Tags: $tags"
    fi
    echo ""
    
    if [ ! -z "$description" ]; then
        echo "Description:"
        echo "$description..." | fold -w 70 -s | sed 's/^/  /'
        echo ""
    fi
    
    echo "📊 Why this task?"
    echo "-----------------"
    
    # Explain reasoning
    if [ "$type" == "Bug" ]; then
        echo "• 🐛 Bug - needs immediate attention"
    fi
    
    if [ ${priority:-3} -eq 1 ]; then
        echo "• 🔥 Highest priority (P1)"
    elif [ ${priority:-3} -eq 2 ]; then
        echo "• ⚠️ High priority (P2)"
    fi
    
    if [ $remaining -le 2 ] && [ $remaining -gt 0 ]; then
        echo "• ⚡ Quick win - can be completed in ${remaining}h"
    fi
    
    if [[ "$tags" == *"critical"* ]] || [[ "$tags" == *"urgent"* ]]; then
        echo "• 🚨 Tagged as critical/urgent"
    fi
    
    echo ""
    echo "🚀 Start this task?"
    echo "-------------------"
    echo "Run: /azure:task-start $best_id"
    echo ""
    
    # Show alternatives
    echo "📋 Alternative Tasks:"
    echo "--------------------"
    
    # Sort and show top 3 alternatives
    count=0
    for id in $(for k in "${!task_scores[@]}"; do echo "$k ${task_scores[$k]}"; done | sort -k2 -n | head -4 | awk '{print $1}'); do
        if [ "$id" != "$best_id" ] && [ $count -lt 3 ]; then
            IFS='|' read -r type title priority remaining tags description <<< "${task_info[$id]}"
            printf "  %d. #%-5s: %-40s [%sh, P%s]\n" \
                $((count + 1)) "$id" "${title:0:40}" "$remaining" "${priority:-3}"
            count=$((count + 1))
        fi
    done
else
    echo -e "${RED}No suitable tasks found${NC}"
fi

# Show task distribution
echo ""
echo "📈 Task Pool Analysis"
echo "--------------------"

total_tasks=$(echo "$ids" | wc -l)
total_hours=0
p1_count=0
p2_count=0
bug_count=0

for id in $ids; do
    IFS='|' read -r type title priority remaining tags description <<< "${task_info[$id]}"
    
    total_hours=$((total_hours + ${remaining:-0}))
    
    if [ ${priority:-3} -eq 1 ]; then
        p1_count=$((p1_count + 1))
    elif [ ${priority:-3} -eq 2 ]; then
        p2_count=$((p2_count + 1))
    fi
    
    if [ "$type" == "Bug" ]; then
        bug_count=$((bug_count + 1))
    fi
done

echo "Available Tasks: $total_tasks"
echo "Total Work: ${total_hours}h"
echo "P1 Tasks: $p1_count"
echo "P2 Tasks: $p2_count"
echo "Bugs: $bug_count"

# Quick actions
echo ""
echo "🔧 Other Actions"
echo "----------------"
echo "• View all tasks: /azure:task-list"
echo "• Check active work: /azure:active-work"
echo "• Sprint status: /azure:sprint-status"
echo "• Report blockers: /azure:blocked-items"