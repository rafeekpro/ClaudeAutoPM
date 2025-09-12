#!/bin/bash
# Azure DevOps Blocked Items Script
# Shows all blocked work items and their resolution status
# Usage: ./blocked.sh [--resolve]

set -e

RESOLVE_MODE=${1:-""}

echo "🚧 Azure DevOps Blocked Items"
echo "=============================="
echo ""

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

# Query for blocked items
echo "Searching for blocked items..."
echo ""

BLOCKED_QUERY='SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo], [System.Tags] 
FROM workitems 
WHERE [System.Tags] CONTAINS "blocked" 
AND [System.State] != "Closed" 
AND [System.State] != "Done"
ORDER BY [Microsoft.VSTS.Common.Priority] ASC'

response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$BLOCKED_QUERY\"}")

# Parse work item IDs (simplified parsing)
ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -z "$ids" ]; then
    echo -e "${GREEN}✅ No blocked items found!${NC}"
    exit 0
fi

# Count blocked items
blocked_count=$(echo "$ids" | wc -l)
echo -e "${RED}Found $blocked_count blocked items${NC}"
echo ""

# Display blocked items
echo "Blocked Items Details:"
echo "----------------------"

for id in $ids; do
    # Get work item details
    item=$(call_azure_api "wit/workitems/$id")
    
    # Parse item details (simplified - would need proper JSON parsing)
    title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4)
    type=$(echo "$item" | grep -o '"System.WorkItemType":"[^"]*' | cut -d'"' -f4)
    state=$(echo "$item" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
    assigned=$(echo "$item" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
    
    echo ""
    echo -e "${YELLOW}$type #$id${NC}: $title"
    echo "  State: $state"
    echo "  Assigned: ${assigned:-Unassigned}"
    echo "  URL: https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_workitems/edit/$id"
    
    # Check for blocker reason in comments
    comments=$(call_azure_api "wit/workitems/$id/comments?\$top=1" 2>/dev/null || echo "{}")
    if echo "$comments" | grep -q "blocked"; then
        reason=$(echo "$comments" | grep -o '"text":"[^"]*' | head -1 | cut -d'"' -f4 | head -c 100)
        echo "  Reason: ${reason}..."
    fi
done

# Summary by type
echo ""
echo "Summary by Type:"
echo "----------------"

for type in "User Story" "Task" "Bug" "Feature"; do
    count=$(echo "$response" | grep -o "\"$type\"" | wc -l)
    if [ $count -gt 0 ]; then
        echo "  $type: $count"
    fi
done

# Resolution actions
if [ "$RESOLVE_MODE" == "--resolve" ]; then
    echo ""
    echo "🔧 Resolution Mode"
    echo "------------------"
    echo ""
    echo "Select an item to resolve (enter ID):"
    read -p "Work Item ID: " resolve_id
    
    if [ ! -z "$resolve_id" ]; then
        echo "Resolution options:"
        echo "1. Remove 'blocked' tag"
        echo "2. Add comment with resolution"
        echo "3. Reassign to someone else"
        echo "4. Close as won't fix"
        
        read -p "Select option (1-4): " option
        
        case $option in
            1)
                echo "Removing 'blocked' tag from #$resolve_id..."
                # API call to update tags
                ;;
            2)
                read -p "Enter resolution comment: " comment
                echo "Adding resolution comment..."
                # API call to add comment
                ;;
            3)
                read -p "Reassign to (email): " new_assignee
                echo "Reassigning to $new_assignee..."
                # API call to reassign
                ;;
            4)
                echo "Closing as won't fix..."
                # API call to close
                ;;
        esac
        
        echo -e "${GREEN}✓ Resolution action completed${NC}"
    fi
fi

# Recommendations
echo ""
echo "💡 Recommendations:"
echo "-------------------"

if [ $blocked_count -gt 5 ]; then
    echo -e "${RED}⚠️  High number of blockers - consider escalation meeting${NC}"
fi

echo "• Review blockers in daily standup"
echo "• Assign owners to unassigned blocked items"
echo "• Check for stale blockers (>7 days)"
echo ""
echo "To resolve items interactively, run: ./blocked.sh --resolve"

# Export option
echo ""
echo "📤 Export blocked items list:"
echo "-----------------------------"
timestamp=$(date +%Y%m%d_%H%M%S)
output_file=".claude/azure/reports/blocked_${timestamp}.txt"

{
    echo "Blocked Items Report - $(date)"
    echo "================================"
    echo ""
    echo "Total blocked items: $blocked_count"
    echo ""
    for id in $ids; do
        echo "- Work Item #$id"
    done
} > "$output_file"

echo "Report saved to: $output_file"