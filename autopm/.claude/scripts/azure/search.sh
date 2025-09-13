#!/bin/bash
# Azure DevOps Search Script
# Search across all work items with various filters
# Usage: ./search.sh <search-term> [--type=task|story|bug] [--state=active|closed]

set -e

SEARCH_TERM=${1:-""}
shift
TYPE_FILTER=""
STATE_FILTER=""

# Parse additional arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --type=*)
            TYPE_FILTER="${1#*=}"
            shift
            ;;
        --state=*)
            STATE_FILTER="${1#*=}"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

if [ -z "$SEARCH_TERM" ]; then
    echo "Usage: ./search.sh <search-term> [--type=task|story|bug] [--state=active|closed]"
    exit 1
fi

echo "🔍 Azure DevOps Search"
echo "======================"
echo ""
echo "Searching for: \"$SEARCH_TERM\""

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

# Build search query
QUERY="SELECT [System.Id], [System.Title], [System.WorkItemType], 
       [System.State], [System.AssignedTo], [System.Tags],
       [System.CreatedDate], [System.ChangedDate]
FROM workitems 
WHERE ([System.Title] CONTAINS '$SEARCH_TERM' 
       OR [System.Description] CONTAINS '$SEARCH_TERM'
       OR [System.Tags] CONTAINS '$SEARCH_TERM')"

# Add type filter
if [ ! -z "$TYPE_FILTER" ]; then
    case $TYPE_FILTER in
        task)
            QUERY="$QUERY AND [System.WorkItemType] = 'Task'"
            ;;
        story)
            QUERY="$QUERY AND [System.WorkItemType] = 'User Story'"
            ;;
        bug)
            QUERY="$QUERY AND [System.WorkItemType] = 'Bug'"
            ;;
        feature)
            QUERY="$QUERY AND [System.WorkItemType] = 'Feature'"
            ;;
    esac
    echo "Type filter: $TYPE_FILTER"
fi

# Add state filter
if [ ! -z "$STATE_FILTER" ]; then
    case $STATE_FILTER in
        active)
            QUERY="$QUERY AND [System.State] IN ('New', 'Active', 'In Progress')"
            ;;
        closed)
            QUERY="$QUERY AND [System.State] IN ('Done', 'Closed', 'Resolved')"
            ;;
    esac
    echo "State filter: $STATE_FILTER"
fi

QUERY="$QUERY ORDER BY [System.ChangedDate] DESC"

echo ""
echo "Searching..."
echo ""

response=$(call_azure_api "wit/wiql" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\"}")

# Parse work item IDs
ids=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -z "$ids" ]; then
    echo "No results found for \"$SEARCH_TERM\""
    echo ""
    echo "Try:"
    echo "• Different search terms"
    echo "• Removing filters"
    echo "• Checking spelling"
    exit 0
fi

# Count results
result_count=$(echo "$ids" | wc -l)
echo -e "${GREEN}Found $result_count result(s)${NC}"
echo ""

# Group results by type
declare -a tasks=()
declare -a stories=()
declare -a bugs=()
declare -a features=()
declare -a others=()

for id in $ids; do
    item=$(call_azure_api "wit/workitems/$id")
    
    # Parse fields
    title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-50)
    type=$(echo "$item" | grep -o '"System.WorkItemType":"[^"]*' | cut -d'"' -f4)
    state=$(echo "$item" | grep -o '"System.State":"[^"]*' | cut -d'"' -f4)
    assigned=$(echo "$item" | grep -o '"System.AssignedTo":{[^}]*"displayName":"[^"]*' | 
               grep -o '"displayName":"[^"]*' | cut -d'"' -f4 | cut -c1-15)
    changed=$(echo "$item" | grep -o '"System.ChangedDate":"[^"]*' | cut -d'"' -f4 | cut -dT -f1)
    tags=$(echo "$item" | grep -o '"System.Tags":"[^"]*' | cut -d'"' -f4 | cut -c1-20)
    
    # Highlight search term in title
    highlighted_title=$(echo "$title" | sed "s/$SEARCH_TERM/[**$SEARCH_TERM**]/gI")
    
    # Format item info
    item_info="#$id|$highlighted_title|$state|${assigned:-Unassigned}|$changed|$tags"
    
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
        "Feature")
            features+=("$item_info")
            ;;
        *)
            others+=("$item_info")
            ;;
    esac
done

# Display results by type
if [ ${#features[@]} -gt 0 ]; then
    echo -e "${BLUE}📦 Features (${#features[@]})${NC}"
    echo "-------------"
    for feature in "${features[@]}"; do
        IFS='|' read -r id title state assigned changed tags <<< "$feature"
        printf "  %-7s %-45s [%s]\n" "$id" "$title" "$state"
    done
    echo ""
fi

if [ ${#stories[@]} -gt 0 ]; then
    echo -e "${GREEN}📖 User Stories (${#stories[@]})${NC}"
    echo "----------------"
    for story in "${stories[@]}"; do
        IFS='|' read -r id title state assigned changed tags <<< "$story"
        printf "  %-7s %-45s [%s]\n" "$id" "$title" "$state"
    done
    echo ""
fi

if [ ${#tasks[@]} -gt 0 ]; then
    echo -e "${YELLOW}📋 Tasks (${#tasks[@]})${NC}"
    echo "---------"
    for task in "${tasks[@]}"; do
        IFS='|' read -r id title state assigned changed tags <<< "$task"
        printf "  %-7s %-45s [%s]\n" "$id" "$title" "$state"
    done
    echo ""
fi

if [ ${#bugs[@]} -gt 0 ]; then
    echo -e "${YELLOW}🐛 Bugs (${#bugs[@]})${NC}"
    echo "--------"
    for bug in "${bugs[@]}"; do
        IFS='|' read -r id title state assigned changed tags <<< "$bug"
        printf "  %-7s %-45s [%s]\n" "$id" "$title" "$state"
    done
    echo ""
fi

# Search in comments (limited to first 10 results)
echo "💬 Searching in Comments..."
echo "--------------------------"

comment_matches=0
search_count=0

for id in $ids; do
    if [ $search_count -ge 10 ]; then
        break
    fi
    
    comments=$(call_azure_api "wit/workitems/$id/comments" 2>/dev/null || echo "{}")
    
    if echo "$comments" | grep -qi "$SEARCH_TERM"; then
        item=$(call_azure_api "wit/workitems/$id")
        title=$(echo "$item" | grep -o '"System.Title":"[^"]*' | cut -d'"' -f4 | cut -c1-40)
        
        # Find matching comment
        match=$(echo "$comments" | grep -o "\"text\":\"[^\"]*$SEARCH_TERM[^\"]*" | head -1 | cut -d'"' -f4 | cut -c1-60)
        
        if [ ! -z "$match" ]; then
            echo "  #$id: $title"
            echo "    Comment: \"$match...\""
            comment_matches=$((comment_matches + 1))
        fi
    fi
    
    search_count=$((search_count + 1))
done

if [ $comment_matches -eq 0 ]; then
    echo "  No matches found in comments"
fi

# Summary
echo ""
echo "📊 Search Summary"
echo "-----------------"
echo "Total Results: $result_count"
[ ${#features[@]} -gt 0 ] && echo "Features: ${#features[@]}"
[ ${#stories[@]} -gt 0 ] && echo "User Stories: ${#stories[@]}"
[ ${#tasks[@]} -gt 0 ] && echo "Tasks: ${#tasks[@]}"
[ ${#bugs[@]} -gt 0 ] && echo "Bugs: ${#bugs[@]}"
[ $comment_matches -gt 0 ] && echo "Comment Matches: $comment_matches"

# Export option
echo ""
echo "📤 Export Results?"
echo "------------------"
echo "To export results to file:"
echo "./search.sh \"$SEARCH_TERM\" > search_results_$(date +%Y%m%d).txt"

# Quick actions
echo ""
echo "🔧 Quick Actions"
echo "----------------"
echo "• View item details: /azure:task-show <id>"
echo "• Edit item: /azure:task-edit <id>"
echo "• Refine search: ./search.sh \"$SEARCH_TERM\" --type=task --state=active"

# Advanced search tips
echo ""
echo "💡 Search Tips"
echo "--------------"
echo "• Use quotes for exact phrases"
echo "• Search is case-insensitive"
echo "• Searches in: title, description, tags, comments"
echo "• Combine with filters for better results"