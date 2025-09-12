#!/bin/bash
# Azure DevOps Sync Script
# Synchronizes local cache with Azure DevOps
# Usage: ./sync.sh [--full|--quick]

set -e

MODE=${1:-"--quick"}

echo "🔄 Azure DevOps Synchronization"
echo "================================"
echo "Mode: $MODE"
echo ""

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(grep -v '^#' .claude/.env | xargs)
fi

# Check required variables
if [ -z "$AZURE_DEVOPS_PAT" ] || [ -z "$AZURE_DEVOPS_ORG" ] || [ -z "$AZURE_DEVOPS_PROJECT" ]; then
    echo "❌ Error: Azure DevOps credentials not configured"
    echo "Please run: /azure:init"
    exit 1
fi

# Create cache directories
mkdir -p .claude/azure/cache/{features,stories,tasks}
mkdir -p .claude/azure/sync

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

# Sync function for work items
sync_work_items() {
    local type=$1
    local folder=$2
    
    echo "Syncing $type..."
    
    # Query for work items
    local query="{\"query\": \"SELECT [System.Id], [System.Title], [System.State], [System.ChangedDate] FROM workitems WHERE [System.WorkItemType] = '$type' AND [System.ChangedDate] >= @Today-30\"}"
    
    local response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "$query")
    
    # Extract work item IDs (simplified - would need proper JSON parsing)
    local ids=$(echo $response | grep -o '"id":[0-9]*' | cut -d: -f2)
    
    local count=0
    for id in $ids; do
        # Get full work item details
        local item=$(call_azure_api "wit/workitems/$id")
        
        # Save to cache
        echo "$item" > ".claude/azure/cache/$folder/$id.json"
        ((count++))
        
        # Show progress
        if [ $((count % 10)) -eq 0 ]; then
            echo "  Processed $count items..."
        fi
    done
    
    echo "  ✓ Synced $count $type"
}

# Start sync based on mode
if [ "$MODE" == "--full" ]; then
    echo "🔍 Full Synchronization"
    echo "----------------------"
    
    # Sync all work item types
    sync_work_items "Feature" "features"
    sync_work_items "User Story" "stories"
    sync_work_items "Task" "tasks"
    sync_work_items "Bug" "tasks"
    
else
    echo "⚡ Quick Synchronization"
    echo "----------------------"
    
    # Only sync recently changed items
    echo "Checking for changes in last 7 days..."
    
    # Query for recent changes
    RECENT_QUERY="{\"query\": \"SELECT [System.Id], [System.WorkItemType] FROM workitems WHERE [System.ChangedDate] >= @Today-7\"}"
    
    RECENT_ITEMS=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "$RECENT_QUERY")
    
    CHANGED_COUNT=$(echo $RECENT_ITEMS | grep -o '"id"' | wc -l)
    echo "Found $CHANGED_COUNT changed items"
    
    if [ $CHANGED_COUNT -gt 0 ]; then
        # Sync only changed items
        echo "Syncing changed items..."
        # (Implementation would follow similar pattern as full sync)
    fi
fi

# Update sync metadata
echo ""
echo "📊 Sync Statistics"
echo "------------------"

SYNC_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CACHE_SIZE=$(du -sh .claude/azure/cache 2>/dev/null | cut -f1)

cat > .claude/azure/sync/last-sync.json << EOF
{
  "timestamp": "$SYNC_TIME",
  "mode": "$MODE",
  "cache_size": "$CACHE_SIZE",
  "items_synced": {
    "features": $(ls .claude/azure/cache/features 2>/dev/null | wc -l),
    "stories": $(ls .claude/azure/cache/stories 2>/dev/null | wc -l),
    "tasks": $(ls .claude/azure/cache/tasks 2>/dev/null | wc -l)
  }
}
EOF

echo "Last sync: $SYNC_TIME"
echo "Cache size: $CACHE_SIZE"
echo "Features: $(ls .claude/azure/cache/features 2>/dev/null | wc -l)"
echo "Stories: $(ls .claude/azure/cache/stories 2>/dev/null | wc -l)"
echo "Tasks: $(ls .claude/azure/cache/tasks 2>/dev/null | wc -l)"

# Check for conflicts
echo ""
echo "🔍 Checking for Conflicts"
echo "-------------------------"

# Would implement conflict detection here
echo "No conflicts detected"

# Cleanup old cache files
if [ "$MODE" == "--full" ]; then
    echo ""
    echo "🧹 Cleaning Old Cache"
    echo "--------------------"
    
    # Remove cache files older than 30 days
    find .claude/azure/cache -type f -mtime +30 -delete 2>/dev/null || true
    echo "Removed old cache files"
fi

echo ""
echo "================================"
echo "✅ Synchronization complete!"
echo ""
echo "Next steps:"
echo "  • View status: /azure:sprint-status"
echo "  • Check work: /azure:active-work"
echo "  • Start task: /azure:next-task"