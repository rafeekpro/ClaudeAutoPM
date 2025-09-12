#!/bin/bash
# Azure DevOps Feature Status Script
# Shows status and progress of all Features/Epics
# Usage: ./feature-status.sh [feature-id]

set -e

FEATURE_ID=${1:-""}

echo "📊 Azure DevOps Feature Status"
echo "=============================="
echo ""

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

# Function to show feature progress
show_feature_progress() {
    local feature_id=$1
    
    # Get feature details
    feature=$(call_azure_api "wit/workitems/$feature_id")
    
    # Parse feature fields
    title=$(echo "$feature" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4)
    state=$(echo "$feature" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
    value=$(echo "$feature" | grep -o '"Microsoft.VSTS.Common.BusinessValue":[0-9]*' | cut -d: -f2)
    effort=$(echo "$feature" | grep -o '"Microsoft.VSTS.Scheduling.Effort":[0-9]*' | cut -d: -f2)
    assigned=$(echo "$feature" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
               grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
    target_date=$(echo "$feature" | grep -o '"Microsoft.VSTS.Scheduling.TargetDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
    
    echo -e "${BLUE}📦 Feature #$feature_id: $title${NC}"
    echo "----------------------------------------"
    echo "State: $state"
    echo "Business Value: ${value:-Not set}"
    echo "Effort: ${effort:-Not set}"
    echo "Owner: ${assigned:-Unassigned}"
    echo "Target: ${target_date:-Not set}"
    echo ""
    
    # Get child User Stories
    stories_query="SELECT [System.Id], [System.Title], [System.State], 
                   [Microsoft.VSTS.Scheduling.StoryPoints]
                   FROM WorkItemLinks
                   WHERE Source.[System.Id] = $feature_id
                   AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
                   AND Target.[System.WorkItemType] = 'User Story'
                   ORDER BY Target.[System.Id]"
    
    stories_response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$stories_query\"}")
    
    # Parse story IDs
    story_ids=$(echo "$stories_response" | grep -o '"target":{[^}]*"id":[0-9]*' | grep -o '[0-9]*$')
    
    if [ -z "$story_ids" ]; then
        echo "No User Stories linked to this feature."
        return
    fi
    
    # Calculate progress
    total_stories=0
    completed_stories=0
    total_points=0
    completed_points=0
    total_tasks=0
    completed_tasks=0
    
    echo "📖 User Stories:"
    echo "---------------"
    
    for story_id in $story_ids; do
        story=$(call_azure_api "wit/workitems/$story_id")
        
        story_title=$(echo "$story" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-40)
        story_state=$(echo "$story" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
        story_points=$(echo "$story" | grep -o '"Microsoft.VSTS.Scheduling.StoryPoints":[0-9]*' | cut -d: -f2)
        
        # Count tasks for this story
        tasks_query="SELECT [System.Id], [System.State]
                    FROM WorkItemLinks
                    WHERE Source.[System.Id] = $story_id
                    AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
                    AND Target.[System.WorkItemType] = 'Task'"
        
        tasks_response=$(call_azure_api "wit/wiql" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$tasks_query\"}")
        
        task_count=$(echo "$tasks_response" | grep -o '"id"' | wc -l)
        done_task_count=$(echo "$tasks_response" | grep -o '"Done"\|"Closed"' | wc -l)
        
        # Status icon
        if [ "$story_state" == "Done" ] || [ "$story_state" == "Closed" ]; then
            icon="✅"
            completed_stories=$((completed_stories + 1))
            completed_points=$((completed_points + ${story_points:-0}))
        elif [ "$story_state" == "Active" ] || [ "$story_state" == "In Progress" ]; then
            icon="🔄"
        else
            icon="⭕"
        fi
        
        printf "  %s Story #%-5s: %-40s [%s pts, %d/%d tasks]\n" \
            "$icon" "$story_id" "$story_title" "${story_points:-0}" \
            "$done_task_count" "$task_count"
        
        total_stories=$((total_stories + 1))
        total_points=$((total_points + ${story_points:-0}))
        total_tasks=$((total_tasks + task_count))
        completed_tasks=$((completed_tasks + done_task_count))
    done
    
    # Progress visualization
    echo ""
    echo "📈 Progress:"
    echo "-----------"
    
    # Story progress
    if [ $total_stories -gt 0 ]; then
        story_percent=$((completed_stories * 100 / total_stories))
        printf "Stories: "
        for i in {1..20}; do
            if [ $((i * 5)) -le $story_percent ]; then
                printf "█"
            else
                printf "░"
            fi
        done
        printf " %d%% (%d/%d)\n" "$story_percent" "$completed_stories" "$total_stories"
    fi
    
    # Points progress
    if [ $total_points -gt 0 ]; then
        points_percent=$((completed_points * 100 / total_points))
        printf "Points:  "
        for i in {1..20}; do
            if [ $((i * 5)) -le $points_percent ]; then
                printf "█"
            else
                printf "░"
            fi
        done
        printf " %d%% (%d/%d)\n" "$points_percent" "$completed_points" "$total_points"
    fi
    
    # Task progress
    if [ $total_tasks -gt 0 ]; then
        task_percent=$((completed_tasks * 100 / total_tasks))
        printf "Tasks:   "
        for i in {1..20}; do
            if [ $((i * 5)) -le $task_percent ]; then
                printf "█"
            else
                printf "░"
            fi
        done
        printf " %d%% (%d/%d)\n" "$task_percent" "$completed_tasks" "$total_tasks"
    fi
    
    # Health indicator
    echo ""
    echo "🏥 Health Status:"
    echo "-----------------"
    
    if [ -z "$assigned" ]; then
        echo -e "${YELLOW}⚠️ No owner assigned${NC}"
    fi
    
    if [ -z "$target_date" ]; then
        echo -e "${YELLOW}⚠️ No target date set${NC}"
    elif [ $total_stories -gt 0 ]; then
        days_remaining=$(( ($(date -d "$target_date" +%s 2>/dev/null || echo 0) - $(date +%s)) / 86400 ))
        
        if [ $days_remaining -lt 0 ]; then
            echo -e "${RED}❌ Overdue by ${days_remaining#-} days${NC}"
        elif [ $days_remaining -lt 7 ]; then
            echo -e "${YELLOW}⚠️ Due in $days_remaining days${NC}"
        elif [ $story_percent -ge 50 ]; then
            echo -e "${GREEN}✅ On track for completion${NC}"
        else
            echo -e "${YELLOW}⚠️ May need acceleration${NC}"
        fi
    fi
    
    if [ $total_stories -eq 0 ]; then
        echo -e "${RED}❌ No stories created - needs decomposition${NC}"
    fi
}

# Main logic
if [ -z "$FEATURE_ID" ]; then
    # Show all active features status
    echo "Fetching all active Features/Epics..."
    echo ""
    
    # Query for active features
    query="SELECT [System.Id], [System.Title], 
           [Microsoft.VSTS.Common.BusinessValue],
           [Microsoft.VSTS.Scheduling.TargetDate]
           FROM workitems 
           WHERE ([System.WorkItemType] = 'Feature' OR [System.WorkItemType] = 'Epic')
           AND [System.State] IN ('Active', 'In Progress')
           ORDER BY [Microsoft.VSTS.Common.BusinessValue] DESC"
    
    response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}")
    
    ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)
    
    if [ -z "$ids" ]; then
        echo "No active Features/Epics found."
        exit 0
    fi
    
    for id in $ids; do
        show_feature_progress $id
        echo ""
        echo "========================================"
        echo ""
    done
    
    # Overall summary
    total_features=$(echo "$ids" | wc -l)
    echo "📊 Overall Summary:"
    echo "-------------------"
    echo "Active Features: $total_features"
    
else
    # Show specific feature status
    show_feature_progress $FEATURE_ID
fi

echo ""
echo "💡 Tips:"
echo "--------"
echo "• To view specific feature: ./feature-status.sh <feature-id>"
echo "• To decompose feature: /azure:feature-decompose <feature-id>"
echo "• To update feature: /azure:feature-edit <feature-id>"