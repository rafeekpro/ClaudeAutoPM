#!/bin/bash
# Azure DevOps User Story List Script
# Lists all User Stories with filtering options
# Usage: ./us-list.sh [--sprint=current] [--status=active] [--assigned-to=me]

set -e

# Parse arguments
SPRINT_FILTER=""
STATUS_FILTER=""
ASSIGNED_FILTER=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --sprint=*)
            SPRINT_FILTER="${1#*=}"
            shift
            ;;
        --status=*)
            STATUS_FILTER="${1#*=}"
            shift
            ;;
        --assigned-to=*)
            ASSIGNED_FILTER="${1#*=}"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo "📋 Azure DevOps User Stories"
echo "============================"
echo ""

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

# Build query
QUERY="SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], 
       [Microsoft.VSTS.Scheduling.StoryPoints], [System.IterationPath], 
       [Microsoft.VSTS.Common.Priority]
FROM workitems 
WHERE [System.WorkItemType] = 'User Story'"

# Add filters
if [ ! -z "$STATUS_FILTER" ]; then
    case $STATUS_FILTER in
        active)
            QUERY="$QUERY AND [System.State] = 'Active'"
            ;;
        new)
            QUERY="$QUERY AND [System.State] = 'New'"
            ;;
        closed)
            QUERY="$QUERY AND [System.State] = 'Closed'"
            ;;
    esac
fi

if [ ! -z "$ASSIGNED_FILTER" ]; then
    if [ "$ASSIGNED_FILTER" == "me" ]; then
        QUERY="$QUERY AND [System.AssignedTo] = @Me"
    else
        QUERY="$QUERY AND [System.AssignedTo] = '$ASSIGNED_FILTER'"
    fi
fi

if [ ! -z "$SPRINT_FILTER" ]; then
    if [ "$SPRINT_FILTER" == "current" ]; then
        # Get current sprint
        CURRENT_SPRINT=$(call_azure_api "work/teamsettings/iterations?\$timeframe=current" | 
                        grep -o '"path":"[^"]*' | head -1 | cut -d'"' -f4)
        QUERY="$QUERY AND [System.IterationPath] = '$CURRENT_SPRINT'"
        echo "Current Sprint: $CURRENT_SPRINT"
    else
        QUERY="$QUERY AND [System.IterationPath] = '$SPRINT_FILTER'"
    fi
fi

QUERY="$QUERY ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.Id] DESC"

# Execute query
echo "Fetching user stories..."
echo ""

response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\"}")

# Parse work item IDs
ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -z "$ids" ]; then
    echo "No user stories found with the specified filters."
    exit 0
fi

# Table header
printf "%-6s | %-40s | %-10s | %-8s | %-20s | %-15s\n" \
    "ID" "Title" "Status" "Points" "Assigned To" "Sprint"
echo "-------|------------------------------------------|------------|----------|----------------------|----------------"

# Display each story
total_points=0
story_count=0

for id in $ids; do
    # Get work item details
    item=$(call_azure_api "wit/workitems/$id")
    
    # Parse fields (simplified)
    title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-40)
    state=$(echo "$item" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
    points=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.StoryPoints":[0-9]*' | cut -d: -f2)
    assigned=$(echo "$item" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
               grep -o '"displayName":"[^"]*' | cut -d'"' -f4 | cut -c1-20)
    sprint=$(echo "$item" | grep -o '"System.IterationPath":"[^"]*' | cut -d'"' -f4 | 
             awk -F'\' '{print $NF}' | cut -c1-15)
    
    # Status emoji
    case $state in
        "New")
            status_icon="🆕"
            ;;
        "Active"|"In Progress")
            status_icon="🔄"
            ;;
        "Resolved"|"Done")
            status_icon="✅"
            ;;
        "Closed")
            status_icon="🔒"
            ;;
        *)
            status_icon="❓"
            ;;
    esac
    
    printf "%-6s | %-40s | %s %-8s | %-8s | %-20s | %-15s\n" \
        "#$id" \
        "$title" \
        "$status_icon" \
        "${state:0:8}" \
        "${points:-0}" \
        "${assigned:-Unassigned}" \
        "$sprint"
    
    # Update totals
    story_count=$((story_count + 1))
    if [ ! -z "$points" ]; then
        total_points=$((total_points + points))
    fi
done

# Summary
echo ""
echo "Summary:"
echo "--------"
echo "Total Stories: $story_count"
echo "Total Points: $total_points"

# Group by status
echo ""
echo "By Status:"
for status in "New" "Active" "Resolved" "Closed"; do
    count=$(echo "$response" | grep -o "\"$status\"" | wc -l)
    if [ $count -gt 0 ]; then
        echo "  $status: $count"
    fi
done

# Quick actions
echo ""
echo "Quick Actions:"
echo "--------------"
echo "• View story details: /azure:us-show <id>"
echo "• Edit story: /azure:us-edit <id>"
echo "• Parse into tasks: /azure:us-parse <id>"
echo "• Check status: /azure:us-status <id>"