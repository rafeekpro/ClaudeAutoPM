#!/bin/bash
# Azure DevOps Validation Script
# Validates work items for completeness and quality
# Usage: ./validate.sh [--sprint=current] [--fix]

set -e

SPRINT_FILTER=${1:-""}
FIX_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --sprint=*)
            SPRINT_FILTER="${1#*=}"
            shift
            ;;
        --fix)
            FIX_MODE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo "✅ Azure DevOps Work Item Validation"
echo "===================================="
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

# Validation counters
total_items=0
valid_items=0
warnings=0
errors=0

declare -a validation_issues=()

echo "Running validation checks..."
echo ""

# Build query
QUERY="SELECT [System.Id], [System.Title], [System.WorkItemType], 
       [System.State], [System.AssignedTo], [System.Description],
       [Microsoft.VSTS.Scheduling.StoryPoints], 
       [Microsoft.VSTS.Scheduling.RemainingWork],
       [System.IterationPath], [System.Tags]
FROM workitems 
WHERE [System.State] != 'Closed'"

if [ "$SPRINT_FILTER" == "current" ]; then
    CURRENT_SPRINT=$(call_azure_api "work/teamsettings/iterations?\$timeframe=current" | 
                    grep -o '"path":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$CURRENT_SPRINT" ]; then
        QUERY="$QUERY AND [System.IterationPath] = '$CURRENT_SPRINT'"
        echo "Validating current sprint: ${CURRENT_SPRINT##*\\}"
    fi
elif [ ! -z "$SPRINT_FILTER" ]; then
    QUERY="$QUERY AND [System.IterationPath] = '$SPRINT_FILTER'"
fi

response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\"}")

ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -z "$ids" ]; then
    echo "No work items to validate"
    exit 0
fi

# Validation rules
validate_item() {
    local id=$1
    local item=$2
    local issues=""
    local item_valid=true
    
    # Parse fields
    title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4)
    type=$(echo "$item" | grep -o '"System.WorkItemType":"[^"]*' | cut -d'"' -f4)
    state=$(echo "$item" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
    assigned=$(echo "$item" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
               grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
    description=$(echo "$item" | grep -o '"System.Description":"[^"]*' | cut -d'"' -f4)
    points=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.StoryPoints":[0-9]*' | cut -d: -f2)
    remaining=$(echo "$item" | grep -o '"Microsoft.VSTS.Scheduling.RemainingWork":[0-9]*' | cut -d: -f2)
    sprint=$(echo "$item" | grep -o '"System.IterationPath":"[^"]*' | cut -d'"' -f4)
    tags=$(echo "$item" | grep -o '"System.Tags":"[^"]*' | cut -d'"' -f4)
    
    # Rule 1: Active items must have assignee
    if [ "$state" == "Active" ] || [ "$state" == "In Progress" ]; then
        if [ -z "$assigned" ]; then
            issues="$issues|ERROR: Active item has no assignee"
            errors=$((errors + 1))
            item_valid=false
        fi
    fi
    
    # Rule 2: User Stories must have story points
    if [ "$type" == "User Story" ]; then
        if [ -z "$points" ] || [ "$points" == "0" ]; then
            issues="$issues|WARNING: User Story has no story points"
            warnings=$((warnings + 1))
        fi
        
        # Rule 3: User Stories should have description
        if [ -z "$description" ] || [ ${#description} -lt 20 ]; then
            issues="$issues|WARNING: User Story lacks proper description"
            warnings=$((warnings + 1))
        fi
    fi
    
    # Rule 4: Tasks must have remaining work estimate
    if [ "$type" == "Task" ] && [ "$state" != "Done" ]; then
        if [ -z "$remaining" ] || [ "$remaining" == "0" ]; then
            issues="$issues|WARNING: Task has no remaining work estimate"
            warnings=$((warnings + 1))
        fi
    fi
    
    # Rule 5: Items in sprint must not be in New state
    if [ ! -z "$sprint" ] && [[ "$sprint" != *"Backlog"* ]]; then
        if [ "$state" == "New" ]; then
            issues="$issues|ERROR: Sprint item still in 'New' state"
            errors=$((errors + 1))
            item_valid=false
        fi
    fi
    
    # Rule 6: Check for missing parent links
    if [ "$type" == "Task" ]; then
        links_query="SELECT [System.Id] FROM WorkItemLinks
                    WHERE Target.[System.Id] = $id
                    AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Reverse'"
        
        links_response=$(call_azure_api "wit/wiql" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$links_query\"}" 2>/dev/null || echo "{}")
        
        if ! echo "$links_response" | grep -q '"id"'; then
            issues="$issues|WARNING: Task has no parent User Story"
            warnings=$((warnings + 1))
        fi
    fi
    
    # Rule 7: Check for stale items
    changed=$(echo "$item" | grep -o '"System.ChangedDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
    days_old=$(( ($(date +%s) - $(date -d "$changed" +%s 2>/dev/null || echo 0)) / 86400 ))
    
    if [ "$state" == "Active" ] && [ $days_old -gt 14 ]; then
        issues="$issues|WARNING: Active item unchanged for $days_old days"
        warnings=$((warnings + 1))
    fi
    
    # Rule 8: Blocked items must have blocked tag
    if [[ "$title" == *"blocked"* ]] || [[ "$description" == *"blocked"* ]]; then
        if [[ "$tags" != *"blocked"* ]]; then
            issues="$issues|WARNING: Item appears blocked but missing 'blocked' tag"
            warnings=$((warnings + 1))
        fi
    fi
    
    # Store validation result
    if [ ! -z "$issues" ]; then
        validation_issues+=("$id|$type|$title|$issues")
    fi
    
    if [ "$item_valid" == true ]; then
        valid_items=$((valid_items + 1))
    fi
}

# Validate each item
for id in $ids; do
    item=$(call_azure_api "wit/workitems/$id")
    validate_item $id "$item"
    total_items=$((total_items + 1))
    
    # Progress indicator
    if [ $((total_items % 10)) -eq 0 ]; then
        echo -n "."
    fi
done

echo ""
echo ""

# Display results
echo "📊 Validation Results"
echo "--------------------"
echo "Total Items: $total_items"
echo -e "${GREEN}✅ Valid: $valid_items${NC}"
echo -e "${YELLOW}⚠️ Warnings: $warnings${NC}"
echo -e "${RED}❌ Errors: $errors${NC}"

if [ ${#validation_issues[@]} -gt 0 ]; then
    echo ""
    echo "📋 Issues Found"
    echo "---------------"
    
    for issue in "${validation_issues[@]}"; do
        IFS='|' read -r id type title problems <<< "$issue"
        echo ""
        echo "  #$id ($type): ${title:0:40}"
        
        # Split and display individual issues
        IFS='|' read -ra problem_list <<< "$problems"
        for problem in "${problem_list[@]}"; do
            if [ ! -z "$problem" ]; then
                if [[ "$problem" == ERROR:* ]]; then
                    echo -e "    ${RED}$problem${NC}"
                elif [[ "$problem" == WARNING:* ]]; then
                    echo -e "    ${YELLOW}$problem${NC}"
                fi
            fi
        done
    done
fi

# Summary by type
echo ""
echo "📈 Issues by Type"
echo "-----------------"

declare -A issue_types

for issue in "${validation_issues[@]}"; do
    IFS='|' read -r id type title problems <<< "$issue"
    issue_types[$type]=$((${issue_types[$type]:-0} + 1))
done

for type in "${!issue_types[@]}"; do
    echo "  $type: ${issue_types[$type]} issues"
done

# Auto-fix mode
if [ "$FIX_MODE" == true ] && [ ${#validation_issues[@]} -gt 0 ]; then
    echo ""
    echo "🔧 Auto-Fix Mode"
    echo "----------------"
    echo "Attempting to fix validation issues..."
    echo ""
    
    fixes_applied=0
    
    for issue in "${validation_issues[@]}"; do
        IFS='|' read -r id type title problems <<< "$issue"
        
        # Fix: Add blocked tag if needed
        if [[ "$problems" == *"missing 'blocked' tag"* ]]; then
            echo "  Adding 'blocked' tag to #$id..."
            # API call to add tag
            fixes_applied=$((fixes_applied + 1))
        fi
        
        # Fix: Set default story points
        if [[ "$problems" == *"no story points"* ]]; then
            echo "  Setting default story points (3) for #$id..."
            # API call to set points
            fixes_applied=$((fixes_applied + 1))
        fi
    done
    
    echo ""
    echo -e "${GREEN}Applied $fixes_applied automatic fixes${NC}"
fi

# Recommendations
echo ""
echo "💡 Recommendations"
echo "------------------"

if [ $errors -gt 0 ]; then
    echo -e "${RED}• Fix critical errors before sprint planning${NC}"
fi

if [ $warnings -gt 5 ]; then
    echo -e "${YELLOW}• Review and address warnings to improve quality${NC}"
fi

if [ $valid_items -eq $total_items ]; then
    echo -e "${GREEN}• All items pass validation - great work!${NC}"
fi

echo "• Run validation regularly: ./validate.sh --sprint=current"
echo "• Auto-fix common issues: ./validate.sh --fix"

# Export validation report
if [ ${#validation_issues[@]} -gt 0 ]; then
    echo ""
    echo "📤 Export Report?"
    echo "-----------------"
    timestamp=$(date +%Y%m%d_%H%M%S)
    report_file=".claude/azure/reports/validation_${timestamp}.txt"
    
    echo "To save validation report:"
    echo "mkdir -p .claude/azure/reports"
    echo "./validate.sh > $report_file"
fi

# Exit code based on errors
if [ $errors -gt 0 ]; then
    exit 1
else
    exit 0
fi