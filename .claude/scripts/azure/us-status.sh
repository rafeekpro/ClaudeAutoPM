#!/bin/bash
# Azure DevOps User Story Status Script
# Shows detailed status of User Stories with progress metrics
# Usage: ./us-status.sh [story-id]

set -e

STORY_ID=${1:-""}

echo "📊 Azure DevOps User Story Status"
echo "================================="
echo ""

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

# Function to show story progress
show_story_progress() {
    local story_id=$1
    
    # Get story details
    story=$(call_azure_api "wit/workitems/$story_id")
    
    # Parse story fields
    title=$(echo "$story" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4)
    state=$(echo "$story" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
    points=$(echo "$story" | grep -o '"Microsoft.VSTS.Scheduling.StoryPoints":[0-9]*' | cut -d: -f2)
    assigned=$(echo "$story" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
               grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
    
    echo "📋 Story #$story_id: $title"
    echo "----------------------------------------"
    echo "State: $state"
    echo "Points: ${points:-Not set}"
    echo "Assigned: ${assigned:-Unassigned}"
    echo ""
    
    # Get child tasks
    tasks_query="SELECT [System.Id], [System.Title], [System.State], 
                 [Microsoft.VSTS.Scheduling.RemainingWork], [Microsoft.VSTS.Scheduling.CompletedWork]
                 FROM WorkItemLinks
                 WHERE Source.[System.Id] = $story_id
                 AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
                 AND Target.[System.WorkItemType] = 'Task'
                 ORDER BY Target.[System.Id]"
    
    tasks_response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$tasks_query\"}")
    
    # Parse task IDs
    task_ids=$(echo "$tasks_response" | grep -o '"target":{[^}]*"id":[0-9]*' | grep -o '[0-9]*$')
    
    if [ -z "$task_ids" ]; then
        echo "No tasks found for this story."
        return
    fi
    
    # Calculate progress
    total_tasks=0
    completed_tasks=0
    total_hours=0
    completed_hours=0
    
    echo "📝 Tasks:"
    echo "--------"
    
    for task_id in $task_ids; do
        task=$(call_azure_api "wit/workitems/$task_id")
        
        task_title=$(echo "$task" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-50)
        task_state=$(echo "$task" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
        remaining=$(echo "$task" | grep -o '"Microsoft.VSTS.Scheduling.RemainingWork":[0-9]*' | cut -d: -f2)
        completed=$(echo "$task" | grep -o '"Microsoft.VSTS.Scheduling.CompletedWork":[0-9]*' | cut -d: -f2)
        
        # Status icon
        if [ "$task_state" == "Done" ] || [ "$task_state" == "Closed" ]; then
            icon="✅"
            completed_tasks=$((completed_tasks + 1))
        elif [ "$task_state" == "In Progress" ] || [ "$task_state" == "Active" ]; then
            icon="🔄"
        else
            icon="⭕"
        fi
        
        # Calculate hours
        task_total=$((${remaining:-0} + ${completed:-0}))
        total_hours=$((total_hours + task_total))
        completed_hours=$((completed_hours + ${completed:-0}))
        
        printf "  %s Task #%-5s: %-50s [%dh/%dh]\n" \
            "$icon" "$task_id" "$task_title" "${completed:-0}" "$task_total"
        
        total_tasks=$((total_tasks + 1))
    done
    
    # Progress bars
    echo ""
    echo "📈 Progress:"
    echo "-----------"
    
    # Task progress
    if [ $total_tasks -gt 0 ]; then
        task_percent=$((completed_tasks * 100 / total_tasks))
        printf "Tasks:  "
        for i in {1..20}; do
            if [ $((i * 5)) -le $task_percent ]; then
                printf "█"
            else
                printf "░"
            fi
        done
        printf " %d%% (%d/%d completed)\n" "$task_percent" "$completed_tasks" "$total_tasks"
    fi
    
    # Hours progress
    if [ $total_hours -gt 0 ]; then
        hours_percent=$((completed_hours * 100 / total_hours))
        printf "Hours:  "
        for i in {1..20}; do
            if [ $((i * 5)) -le $hours_percent ]; then
                printf "█"
            else
                printf "░"
            fi
        done
        printf " %d%% (%dh/%dh completed)\n" "$hours_percent" "$completed_hours" "$total_hours"
    fi
    
    # Health indicator
    echo ""
    echo "🏥 Health Status:"
    echo "-----------------"
    
    if [ $task_percent -ge 80 ]; then
        echo -e "${GREEN}✅ On track - nearing completion${NC}"
    elif [ $task_percent -ge 50 ]; then
        echo -e "${YELLOW}⚠️ In progress - monitor closely${NC}"
    elif [ $task_percent -ge 25 ]; then
        echo -e "${YELLOW}⚠️ Early stage - ensure resources allocated${NC}"
    else
        echo -e "${RED}❌ Just started - needs attention${NC}"
    fi
}

# Main logic
if [ -z "$STORY_ID" ]; then
    # Show all active stories status
    echo "Fetching all active User Stories..."
    echo ""
    
    # Query for active stories
    query="SELECT [System.Id], [System.Title], [Microsoft.VSTS.Scheduling.StoryPoints]
           FROM workitems 
           WHERE [System.WorkItemType] = 'User Story'
           AND [System.State] = 'Active'
           ORDER BY [Microsoft.VSTS.Common.Priority] ASC"
    
    response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}")
    
    ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)
    
    if [ -z "$ids" ]; then
        echo "No active User Stories found."
        exit 0
    fi
    
    for id in $ids; do
        show_story_progress $id
        echo ""
        echo "========================================"
        echo ""
    done
    
    # Overall summary
    total_stories=$(echo "$ids" | wc -l)
    echo "📊 Overall Summary:"
    echo "-------------------"
    echo "Active Stories: $total_stories"
    
else
    # Show specific story status
    show_story_progress $STORY_ID
fi

echo ""
echo "💡 Tips:"
echo "--------"
echo "• To view specific story: ./us-status.sh <story-id>"
echo "• To parse story into tasks: /azure:us-parse <story-id>"
echo "• To update story: /azure:us-edit <story-id>"