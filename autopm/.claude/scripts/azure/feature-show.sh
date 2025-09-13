#!/bin/bash
# Azure DevOps Feature Show Script
# Shows detailed information about a specific Feature/Epic
# Usage: ./feature-show.sh <feature-id>

set -e

FEATURE_ID=${1:-""}

if [ -z "$FEATURE_ID" ]; then
    echo "Usage: ./feature-show.sh <feature-id>"
    exit 1
fi

echo "📦 Azure DevOps Feature Details"
echo "==============================="
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

# Get feature details
echo "Fetching Feature #$FEATURE_ID..."
echo ""

feature=$(call_azure_api "wit/workitems/$FEATURE_ID")

if echo "$feature" | grep -q '"message":"'; then
    echo -e "${RED}Error: Feature #$FEATURE_ID not found${NC}"
    exit 1
fi

# Parse feature fields
title=$(echo "$feature" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4)
description=$(echo "$feature" | grep -o '"System.Description":"[^"]*' | cut -d'"' -f4)
state=$(echo "$feature" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
assigned=$(echo "$feature" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
           grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
created_date=$(echo "$feature" | grep -o '"System.CreatedDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
changed_date=$(echo "$feature" | grep -o '"System.ChangedDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
business_value=$(echo "$feature" | grep -o '"Microsoft.VSTS.Common.BusinessValue":[0-9]*' | cut -d: -f2)
effort=$(echo "$feature" | grep -o '"Microsoft.VSTS.Scheduling.Effort":[0-9]*' | cut -d: -f2)
target_date=$(echo "$feature" | grep -o '"Microsoft.VSTS.Scheduling.TargetDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
tags=$(echo "$feature" | grep -o '"System.Tags":"[^"]*' | cut -d'"' -f4)

# Display feature header
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Feature #$FEATURE_ID${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "Title: ${GREEN}$title${NC}"
echo "State: $state"
echo "URL: https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_workitems/edit/$FEATURE_ID"
echo ""

# Details section
echo "📝 Details"
echo "----------"
if [ ! -z "$description" ]; then
    echo "Description:"
    echo "$description" | fold -w 70 -s | sed 's/^/  /'
    echo ""
fi

# Metadata section
echo "📊 Metadata"
echo "-----------"
echo "Business Value: ${business_value:-Not set}"
echo "Effort Points: ${effort:-Not set}"
echo "Target Date: ${target_date:-Not set}"
echo "Tags: ${tags:-None}"
echo ""

# Assignment section
echo "👤 Assignment"
echo "-------------"
echo "Assigned To: ${assigned:-Unassigned}"
echo "Created: $created_date"
echo "Last Modified: $changed_date"
echo ""

# Get child User Stories
echo "📋 User Stories"
echo "---------------"

child_query="SELECT [System.Id], [System.Title], [System.State], 
             [Microsoft.VSTS.Scheduling.StoryPoints]
             FROM WorkItemLinks
             WHERE Source.[System.Id] = $FEATURE_ID
             AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
             AND Target.[System.WorkItemType] = 'User Story'
             ORDER BY Target.[System.Id]"

child_response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$child_query\"}")

child_ids=$(echo "$child_response" | grep -o '"target":{[^}]*"id":[0-9]*' | grep -o '[0-9]*$')

if [ -z "$child_ids" ]; then
    echo "No User Stories linked to this feature."
else
    total_stories=0
    completed_stories=0
    total_points=0
    completed_points=0
    
    for story_id in $child_ids; do
        story=$(call_azure_api "wit/workitems/$story_id")
        
        story_title=$(echo "$story" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-50)
        story_state=$(echo "$story" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
        story_points=$(echo "$story" | grep -o '"Microsoft.VSTS.Scheduling.StoryPoints":[0-9]*' | cut -d: -f2)
        
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
        
        printf "  %s Story #%-5s: %-45s [%s pts] %s\n" \
            "$icon" "$story_id" "$story_title" "${story_points:-0}" "$story_state"
        
        total_stories=$((total_stories + 1))
        total_points=$((total_points + ${story_points:-0}))
    done
    
    echo ""
    echo "Summary: $completed_stories/$total_stories stories complete ($completed_points/$total_points points)"
fi

# Progress visualization
echo ""
echo "📈 Progress"
echo "-----------"

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
    printf " %d%%\n" "$story_percent"
fi

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
    printf " %d%%\n" "$points_percent"
fi

# Health Status
echo ""
echo "🏥 Health Status"
echo "----------------"

if [ -z "$assigned" ]; then
    echo -e "${YELLOW}⚠️ No owner assigned${NC}"
fi

if [ -z "$target_date" ]; then
    echo -e "${YELLOW}⚠️ No target date set${NC}"
elif [ $total_stories -gt 0 ]; then
    # Check if on track (simplified)
    if [ $story_percent -ge 50 ]; then
        echo -e "${GREEN}✅ On track for completion${NC}"
    else
        echo -e "${YELLOW}⚠️ May need acceleration${NC}"
    fi
fi

if [ $total_stories -eq 0 ]; then
    echo -e "${RED}❌ No stories created - needs decomposition${NC}"
fi

# Actions
echo ""
echo "🔧 Actions"
echo "----------"
echo "[1] Edit feature (/azure:feature-edit $FEATURE_ID)"
echo "[2] Decompose into stories (/azure:feature-decompose $FEATURE_ID)"
echo "[3] Start work (/azure:feature-start $FEATURE_ID)"
echo "[4] View in browser"
echo "[5] Export to JSON"

echo ""
echo "Enter action number or press Enter to exit: "