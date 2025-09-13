#!/bin/bash
# Azure DevOps Active Work Script
# Shows all work items currently in progress
# Usage: ./active-work.sh [--user=email]

set -e

USER_FILTER=${1:-""}

echo "🔄 Azure DevOps Active Work Items"
echo "=================================="
echo ""

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

# Build query for active items
QUERY="SELECT [System.Id], [System.Title], [System.WorkItemType], 
       [System.State], [System.AssignedTo], [System.ChangedDate],
       [Microsoft.VSTS.Scheduling.RemainingWork], [System.IterationPath]
FROM workitems 
WHERE [System.State] IN ('Active', 'In Progress')
AND [System.WorkItemType] IN ('Task', 'Bug', 'User Story')"

# Add user filter if specified
if [[ "$USER_FILTER" == --user=* ]]; then
    USER_EMAIL="${USER_FILTER#*=}"
    if [ "$USER_EMAIL" == "me" ]; then
        QUERY="$QUERY AND [System.AssignedTo] = @Me"
    else
        QUERY="$QUERY AND [System.AssignedTo] = '$USER_EMAIL'"
    fi
fi

QUERY="$QUERY ORDER BY [System.ChangedDate] DESC"

echo "Fetching active work items..."
echo ""

response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\"}")

# Parse work item IDs
ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -z "$ids" ]; then
    echo "No active work items found."
    exit 0
fi

# Group items by type
declare -a tasks=()
declare -a stories=()
declare -a bugs=()

echo "Processing work items..."
echo ""

for id in $ids; do
    item=$(call_azure_api "wit/workitems/$id")
    
    # Parse fields
    title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-50)
    type=$(echo "$item" | grep -o '"System.WorkItemType":"[^"]*' | cut -d'"' -f4)
    state=$(echo "$item" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
    assigned=$(echo "$item" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
               grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
    changed=$(echo "$item" | grep -o '"System.ChangedDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
    remaining=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.RemainingWork":[0-9]*' | cut -d: -f2)
    sprint=$(echo "$item" | grep -o '"System.IterationPath":"[^"]*' | cut -d'"' -f4 | 
             awk -F'\' '{print $NF}')
    
    # Format item info
    item_info="#$id|$title|$assigned|${remaining:-0}h|$changed|$sprint"
    
    case $type in
        "Task")
            tasks+=("$item_info")
            ;;
        "User Story")
            stories+=("$item_info")
            ;;
        "Bug")
            bugs+=("$item_info")
            ;;
    esac
done

# Display Tasks
if [ ${#tasks[@]} -gt 0 ]; then
    echo -e "${BLUE}📋 Active Tasks${NC}"
    echo "---------------"
    printf "%-7s | %-40s | %-15s | %-8s | %-10s | %-15s\n" \
        "ID" "Title" "Assigned" "Remain" "Modified" "Sprint"
    echo "--------|------------------------------------------|----------------|----------|------------|----------------"
    
    for task in "${tasks[@]}"; do
        IFS='|' read -r id title assigned remaining changed sprint <<< "$task"
        printf "%-7s | %-40s | %-15s | %-8s | %-10s | %-15s\n" \
            "$id" "$title" "${assigned:0:15}" "$remaining" "$changed" "$sprint"
    done
    echo ""
fi

# Display User Stories
if [ ${#stories[@]} -gt 0 ]; then
    echo -e "${GREEN}📖 Active User Stories${NC}"
    echo "----------------------"
    printf "%-7s | %-40s | %-15s | %-10s | %-15s\n" \
        "ID" "Title" "Assigned" "Modified" "Sprint"
    echo "--------|------------------------------------------|----------------|------------|----------------"
    
    for story in "${stories[@]}"; do
        IFS='|' read -r id title assigned remaining changed sprint <<< "$story"
        printf "%-7s | %-40s | %-15s | %-10s | %-15s\n" \
            "$id" "$title" "${assigned:0:15}" "$changed" "$sprint"
    done
    echo ""
fi

# Display Bugs
if [ ${#bugs[@]} -gt 0 ]; then
    echo -e "${YELLOW}🐛 Active Bugs${NC}"
    echo "--------------"
    printf "%-7s | %-40s | %-15s | %-10s | %-15s\n" \
        "ID" "Title" "Assigned" "Modified" "Sprint"
    echo "--------|------------------------------------------|----------------|------------|----------------"
    
    for bug in "${bugs[@]}"; do
        IFS='|' read -r id title assigned remaining changed sprint <<< "$bug"
        printf "%-7s | %-40s | %-15s | %-10s | %-15s\n" \
            "$id" "$title" "${assigned:0:15}" "$changed" "$sprint"
    done
    echo ""
fi

# Summary
echo "📊 Summary"
echo "----------"
echo "Active Tasks: ${#tasks[@]}"
echo "Active Stories: ${#stories[@]}"
echo "Active Bugs: ${#bugs[@]}"
echo "Total Active Items: $((${#tasks[@]} + ${#stories[@]} + ${#bugs[@]}))"

# Calculate total remaining work
total_remaining=0
for id in $ids; do
    item=$(call_azure_api "wit/workitems/$id")
    remaining=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.RemainingWork":[0-9]*' | cut -d: -f2)
    total_remaining=$((total_remaining + ${remaining:-0}))
done

echo "Total Remaining Work: ${total_remaining}h"

# Recent activity
echo ""
echo "📅 Recent Activity (Last 24h)"
echo "-----------------------------"

yesterday=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d "yesterday" +%Y-%m-%d)
recent_count=0

for id in $ids; do
    item=$(call_azure_api "wit/workitems/$id")
    changed=$(echo "$item" | grep -o '"System.ChangedDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
    
    if [[ "$changed" > "$yesterday" ]]; then
        title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-50)
        echo "  • #$id: $title (modified $changed)"
        recent_count=$((recent_count + 1))
    fi
done

if [ $recent_count -eq 0 ]; then
    echo "  No items modified in the last 24 hours"
fi

# Quick actions
echo ""
echo "🔧 Quick Actions"
echo "----------------"
echo "• View specific item: /azure:task-show <id>"
echo "• Update task status: /azure:task-edit <id>"
echo "• Close completed task: /azure:task-close <id>"
echo "• Check sprint status: /azure:sprint-status"
echo "• Get next task: /azure:next-task"

# Filters
echo ""
echo "Available Filters:"
echo "------------------"
echo "• Show only your items: ./active-work.sh --user=me"
echo "• Show specific user: ./active-work.sh --user=email@example.com"