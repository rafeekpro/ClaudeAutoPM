#!/bin/bash
# Azure DevOps Feature List Script
# Lists all Features/Epics with status and progress
# Usage: ./feature-list.sh [--status=active]

set -e

STATUS_FILTER=${1:-""}

echo "📦 Azure DevOps Features/Epics"
echo "=============================="
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
QUERY="SELECT [System.Id], [System.Title], [System.State], 
       [Microsoft.VSTS.Common.BusinessValue], [Microsoft.VSTS.Scheduling.Effort],
       [Microsoft.VSTS.Scheduling.TargetDate], [System.AssignedTo]
FROM workitems 
WHERE [System.WorkItemType] = 'Feature' OR [System.WorkItemType] = 'Epic'"

if [ "$STATUS_FILTER" == "--status=active" ]; then
    QUERY="$QUERY AND ([System.State] = 'Active' OR [System.State] = 'In Progress')"
fi

QUERY="$QUERY ORDER BY [Microsoft.VSTS.Common.BusinessValue] DESC"

echo "Fetching features..."
echo ""

response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\"}")

# Parse work item IDs
ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -z "$ids" ]; then
    echo "No features found."
    exit 0
fi

# Table header
printf "%-6s | %-35s | %-12s | %-8s | %-8s | %-12s | %-15s\n" \
    "ID" "Title" "Status" "Value" "Effort" "Target" "Owner"
echo "-------|-------------------------------------|--------------|----------|----------|--------------|----------------"

# Display each feature
total_value=0
total_effort=0
feature_count=0

for id in $ids; do
    # Get work item details
    item=$(call_azure_api "wit/workitems/$id")
    
    # Parse fields
    title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-35)
    state=$(echo "$item" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
    value=$(echo "$item" | grep -o '"Microsoft.VSTS.Common.BusinessValue":[0-9]*' | cut -d: -f2)
    effort=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.Effort":[0-9]*' | cut -d: -f2)
    target=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.TargetDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
    assigned=$(echo "$item" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
               grep -o '"displayName":"[^"]*' | cut -d'"' -f4 | cut -c1-15)
    
    # Status indicator
    case $state in
        "New")
            status="🆕 New"
            ;;
        "Active"|"In Progress")
            status="🔄 Active"
            ;;
        "Done"|"Closed")
            status="✅ Done"
            ;;
        *)
            status="❓ $state"
            ;;
    esac
    
    printf "%-6s | %-35s | %-12s | %-8s | %-8s | %-12s | %-15s\n" \
        "#$id" \
        "$title" \
        "$status" \
        "${value:-0}" \
        "${effort:-0}" \
        "${target:-Not set}" \
        "${assigned:-Unassigned}"
    
    # Update totals
    feature_count=$((feature_count + 1))
    total_value=$((total_value + ${value:-0}))
    total_effort=$((total_effort + ${effort:-0}))
done

# Summary
echo ""
echo "📊 Summary:"
echo "-----------"
echo "Total Features: $feature_count"
echo "Total Business Value: $total_value"
echo "Total Effort Points: $total_effort"

# Calculate progress for active features
echo ""
echo "📈 Active Feature Progress:"
echo "--------------------------"

active_query="SELECT [System.Id] FROM workitems 
WHERE ([System.WorkItemType] = 'Feature' OR [System.WorkItemType] = 'Epic')
AND ([System.State] = 'Active' OR [System.State] = 'In Progress')"

active_response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$active_query\"}")

active_ids=$(echo "$active_response" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ ! -z "$active_ids" ]; then
    for feature_id in $active_ids; do
        # Get feature name
        feature=$(call_azure_api "wit/workitems/$feature_id")
        feature_title=$(echo "$feature" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-30)
        
        # Count child stories
        child_query="SELECT [System.Id], [System.State] FROM WorkItemLinks
                    WHERE Source.[System.Id] = $feature_id
                    AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
                    AND Target.[System.WorkItemType] = 'User Story'"
        
        child_response=$(call_azure_api "wit/wiql" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$child_query\"}")
        
        total_stories=$(echo "$child_response" | grep -o '"id"' | wc -l)
        done_stories=$(echo "$child_response" | grep -o '"Done"\|"Closed"' | wc -l)
        
        if [ $total_stories -gt 0 ]; then
            progress=$((done_stories * 100 / total_stories))
            
            printf "  #%-5s %-30s " "$feature_id" "$feature_title:"
            
            # Progress bar
            for i in {1..10}; do
                if [ $((i * 10)) -le $progress ]; then
                    printf "█"
                else
                    printf "░"
                fi
            done
            
            printf " %d%% (%d/%d stories)\n" "$progress" "$done_stories" "$total_stories"
        fi
    done
fi

# Recommendations
echo ""
echo "💡 Recommendations:"
echo "-------------------"
echo "• High value features should be prioritized"
echo "• Features without target dates need planning"
echo "• Unassigned features need owners"

echo ""
echo "Quick Actions:"
echo "--------------"
echo "• Decompose feature: /azure:feature-decompose <id>"
echo "• Start feature: /azure:feature-start <id>"
echo "• View details: /azure:feature-show <id>"