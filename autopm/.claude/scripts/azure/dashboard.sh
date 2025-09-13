#!/bin/bash
# Azure DevOps Dashboard Script
# Comprehensive project status overview
# Usage: ./dashboard.sh

set -e

echo "📊 Azure DevOps Project Dashboard"
echo "================================="
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
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
CYAN='\033[0;36m'
NC='\033[0m'

# API call function
call_azure_api() {
    local endpoint=$1
    shift
    curl -s -u ":${AZURE_DEVOPS_PAT}" \
        "https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0" "$@"
}

# Get current sprint info
echo -e "${CYAN}🏃 Sprint Information${NC}"
echo "--------------------"

CURRENT_SPRINT=$(call_azure_api "work/teamsettings/iterations?\$timeframe=current" | 
                grep -o '"path":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$CURRENT_SPRINT" ]; then
    sprint_info=$(call_azure_api "work/teamsettings/iterations?\$timeframe=current")
    start_date=$(echo "$sprint_info" | grep -o '"startDate":"[^"]*' | head -1 | cut -d'"' -f4 | cut -dT -f1)
    end_date=$(echo "$sprint_info" | grep -o '"finishDate":"[^"]*' | head -1 | cut -d'"' -f4 | cut -dT -f1)
    
    echo "Current Sprint: ${CURRENT_SPRINT##*\\}"
    echo "Period: $start_date to $end_date"
    
    # Calculate sprint progress
    current_date=$(date +%s)
    start_timestamp=$(date -j -f "%Y-%m-%d" "$start_date" +%s 2>/dev/null || date -d "$start_date" +%s)
    end_timestamp=$(date -j -f "%Y-%m-%d" "$end_date" +%s 2>/dev/null || date -d "$end_date" +%s)
    
    if [ $current_date -le $end_timestamp ]; then
        sprint_duration=$((end_timestamp - start_timestamp))
        sprint_elapsed=$((current_date - start_timestamp))
        sprint_progress=$((sprint_elapsed * 100 / sprint_duration))
        
        printf "Progress: "
        for i in {1..20}; do
            if [ $((i * 5)) -le $sprint_progress ]; then
                printf "█"
            else
                printf "░"
            fi
        done
        printf " %d%%\n" "$sprint_progress"
    fi
else
    echo "No active sprint"
fi

echo ""

# Work Items Overview
echo -e "${BLUE}📋 Work Items Overview${NC}"
echo "---------------------"

# Query all work items by state
for state in "New" "Active" "In Progress" "Resolved" "Done" "Closed"; do
    query="SELECT [System.Id] FROM workitems WHERE [System.State] = '$state'"
    response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\"}" 2>/dev/null || echo "{}")
    
    count=$(echo "$response" | grep -o '"id"' | wc -l)
    
    if [ $count -gt 0 ]; then
        case $state in
            "New")
                echo -e "  🆕 New: $count"
                ;;
            "Active"|"In Progress")
                echo -e "  ${YELLOW}🔄 $state: $count${NC}"
                ;;
            "Resolved"|"Done")
                echo -e "  ${GREEN}✅ $state: $count${NC}"
                ;;
            "Closed")
                echo -e "  🔒 Closed: $count"
                ;;
        esac
    fi
done

echo ""

# Sprint Burndown
if [ ! -z "$CURRENT_SPRINT" ]; then
    echo -e "${GREEN}📉 Sprint Burndown${NC}"
    echo "-----------------"
    
    # Get sprint stories and tasks
    sprint_query="SELECT [System.Id], [System.WorkItemType], [System.State],
                  [Microsoft.VSTS.Scheduling.StoryPoints],
                  [Microsoft.VSTS.Scheduling.RemainingWork]
                  FROM workitems 
                  WHERE [System.IterationPath] = '$CURRENT_SPRINT'
                  AND [System.WorkItemType] IN ('User Story', 'Task')"
    
    sprint_response=$(call_azure_api "wit/wiql" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$sprint_query\"}")
    
    sprint_ids=$(echo "$sprint_response" | grep -o '"id":[0-9]*' | cut -d: -f2)
    
    total_stories=0
    completed_stories=0
    total_points=0
    completed_points=0
    total_hours=0
    remaining_hours=0
    
    for id in $sprint_ids; do
        item=$(call_azure_api "wit/workitems/$id")
        type=$(echo "$item" | grep -o '"System.WorkItemType":"[^"]*' | cut -d'"' -f4)
        state=$(echo "$item" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
        
        if [ "$type" == "User Story" ]; then
            points=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.StoryPoints":[0-9]*' | cut -d: -f2)
            total_stories=$((total_stories + 1))
            total_points=$((total_points + ${points:-0}))
            
            if [ "$state" == "Done" ] || [ "$state" == "Closed" ]; then
                completed_stories=$((completed_stories + 1))
                completed_points=$((completed_points + ${points:-0}))
            fi
        elif [ "$type" == "Task" ]; then
            remaining=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.RemainingWork":[0-9]*' | cut -d: -f2)
            remaining_hours=$((remaining_hours + ${remaining:-0}))
        fi
    done
    
    echo "Stories: $completed_stories/$total_stories completed"
    echo "Points: $completed_points/$total_points completed"
    echo "Remaining Work: ${remaining_hours}h"
    
    if [ $total_points -gt 0 ]; then
        velocity=$((completed_points * 100 / total_points))
        echo -e "Velocity: ${velocity}%"
    fi
    
    echo ""
fi

# Team Activity
echo -e "${CYAN}👥 Team Activity (Last 7 days)${NC}"
echo "------------------------------"

week_ago=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d)

activity_query="SELECT [System.Id], [System.AssignedTo], [System.ChangedDate]
                FROM workitems 
                WHERE [System.ChangedDate] >= '$week_ago'"

activity_response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$activity_query\"}")

activity_ids=$(echo "$activity_response" | grep -o '"id":[0-9]*' | cut -d: -f2)

declare -A user_activity

for id in $activity_ids; do
    item=$(call_azure_api "wit/workitems/$id")
    assigned=$(echo "$item" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
               grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
    
    if [ ! -z "$assigned" ]; then
        user_activity["$assigned"]=$((${user_activity["$assigned"]:-0} + 1))
    fi
done

# Sort and display top contributors
for user in "${!user_activity[@]}"; do
    echo "${user_activity[$user]} $user"
done | sort -rn | head -5 | while read count user; do
    printf "  %-20s: %d items\n" "${user:0:20}" "$count"
done

echo ""

# Blocked Items Alert
echo -e "${RED}⚠️ Alerts${NC}"
echo "---------"

blocked_query="SELECT [System.Id] FROM workitems 
               WHERE [System.Tags] CONTAINS 'blocked' 
               AND [System.State] != 'Closed'"

blocked_response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$blocked_query\"}")

blocked_count=$(echo "$blocked_response" | grep -o '"id"' | wc -l)

if [ $blocked_count -gt 0 ]; then
    echo -e "${RED}🚧 $blocked_count items blocked${NC}"
else
    echo -e "${GREEN}✅ No blocked items${NC}"
fi

# High priority items
high_pri_query="SELECT [System.Id] FROM workitems 
                WHERE [Microsoft.VSTS.Common.Priority] = 1
                AND [System.State] IN ('New', 'Active')"

high_pri_response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$high_pri_query\"}")

high_pri_count=$(echo "$high_pri_response" | grep -o '"id"' | wc -l)

if [ $high_pri_count -gt 0 ]; then
    echo -e "${YELLOW}🔥 $high_pri_count high priority items${NC}"
fi

# Stale items
stale_date=$(date -v-14d +%Y-%m-%d 2>/dev/null || date -d "14 days ago" +%Y-%m-%d)

stale_query="SELECT [System.Id] FROM workitems 
             WHERE [System.State] = 'Active'
             AND [System.ChangedDate] < '$stale_date'"

stale_response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$stale_query\"}")

stale_count=$(echo "$stale_response" | grep -o '"id"' | wc -l)

if [ $stale_count -gt 0 ]; then
    echo -e "${YELLOW}📅 $stale_count stale items (>14 days)${NC}"
fi

echo ""

# Recent Completions
echo -e "${GREEN}✅ Recent Completions (Last 3 days)${NC}"
echo "-----------------------------------"

recent_date=$(date -v-3d +%Y-%m-%d 2>/dev/null || date -d "3 days ago" +%Y-%m-%d)

completed_query="SELECT [System.Id], [System.Title], [System.WorkItemType]
                 FROM workitems 
                 WHERE [System.State] IN ('Done', 'Closed')
                 AND [System.ChangedDate] >= '$recent_date'
                 ORDER BY [System.ChangedDate] DESC"

completed_response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$completed_query\"}")

completed_ids=$(echo "$completed_response" | grep -o '"id":[0-9]*' | cut -d: -f2 | head -5)

if [ ! -z "$completed_ids" ]; then
    for id in $completed_ids; do
        item=$(call_azure_api "wit/workitems/$id")
        title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-50)
        type=$(echo "$item" | grep -o '"System.WorkItemType":"[^"]*' | cut -d'"' -f4)
        
        case $type in
            "User Story")
                icon="📖"
                ;;
            "Task")
                icon="📋"
                ;;
            "Bug")
                icon="🐛"
                ;;
            *)
                icon="📄"
                ;;
        esac
        
        echo "  $icon #$id: $title"
    done
else
    echo "  No recent completions"
fi

echo ""

# Quick Actions Menu
echo "🚀 Quick Actions"
echo "----------------"
echo "1. Daily standup      → /azure:standup"
echo "2. Get next task      → /azure:next-task"
echo "3. View active work   → /azure:active-work"
echo "4. Check blockers     → /azure:blocked-items"
echo "5. Sprint details     → /azure:sprint-status"
echo "6. Search items       → /azure:search"

echo ""
echo "Dashboard refresh: ./dashboard.sh"