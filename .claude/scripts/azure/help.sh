#!/bin/bash
# Azure DevOps Help Script
# Shows available commands and usage examples
# Usage: ./help.sh [command]

set -e

COMMAND=${1:-""}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

show_general_help() {
    echo -e "${BLUE}📚 Azure DevOps CLI Help${NC}"
    echo "========================"
    echo ""
    echo "Available commands and scripts for Azure DevOps integration"
    echo ""
    
    echo -e "${CYAN}🚀 Quick Start${NC}"
    echo "--------------"
    echo "  setup.sh              - Initial configuration wizard"
    echo "  dashboard.sh          - Project status overview"
    echo "  daily.sh              - Daily workflow automation"
    echo ""
    
    echo -e "${GREEN}📖 User Story Management${NC}"
    echo "------------------------"
    echo "  us-list.sh            - List all User Stories"
    echo "  us-status.sh [id]     - Show User Story progress"
    echo "  /azure:us-new         - Create new User Story"
    echo "  /azure:us-parse       - Break down into Tasks"
    echo "  /azure:us-edit        - Edit User Story"
    echo ""
    
    echo -e "${YELLOW}📋 Task Management${NC}"
    echo "------------------"
    echo "  next-task.sh          - AI-powered task recommendation"
    echo "  active-work.sh        - Show active work items"
    echo "  /azure:task-start     - Start task with auto-branch"
    echo "  /azure:task-close     - Complete task with PR"
    echo "  /azure:task-list      - View all tasks"
    echo ""
    
    echo -e "${BLUE}📦 Feature Management${NC}"
    echo "---------------------"
    echo "  feature-list.sh       - List all Features/Epics"
    echo "  feature-show.sh <id>  - Show Feature details"
    echo "  /azure:feature-new    - Create new Feature"
    echo "  /azure:feature-start  - Start Feature work"
    echo ""
    
    echo -e "${CYAN}🏃 Sprint Operations${NC}"
    echo "--------------------"
    echo "  sprint-report.sh      - Generate sprint report"
    echo "  /azure:sprint-status  - Sprint dashboard"
    echo "  /azure:standup        - Daily standup helper"
    echo ""
    
    echo -e "${YELLOW}🔍 Search & Analysis${NC}"
    echo "--------------------"
    echo "  search.sh <term>      - Search work items"
    echo "  blocked.sh            - View blocked items"
    echo "  validate.sh           - Validate work items"
    echo ""
    
    echo -e "${GREEN}🔄 Synchronization${NC}"
    echo "------------------"
    echo "  sync.sh               - Sync with Azure DevOps"
    echo "  /azure:sync-all       - Full synchronization"
    echo ""
    
    echo "For detailed help on a specific command:"
    echo "  ./help.sh <command>"
    echo ""
    echo "Examples:"
    echo "  ./help.sh us-list"
    echo "  ./help.sh daily"
}

show_command_help() {
    local cmd=$1
    
    case $cmd in
        "setup"|"setup.sh")
            echo -e "${BLUE}setup.sh - Initial Configuration${NC}"
            echo "---------------------------------"
            echo "Sets up Azure DevOps integration with interactive prompts."
            echo ""
            echo "Usage: ./setup.sh"
            echo ""
            echo "Configures:"
            echo "  • Azure DevOps PAT (Personal Access Token)"
            echo "  • Organization and Project"
            echo "  • Default sprint and team settings"
            echo "  • Git integration preferences"
            echo ""
            echo "First-time setup:"
            echo "  1. Get PAT from Azure DevOps > User Settings > Personal Access Tokens"
            echo "  2. Run: ./setup.sh"
            echo "  3. Follow the prompts"
            ;;
            
        "daily"|"daily.sh")
            echo -e "${BLUE}daily.sh - Daily Workflow${NC}"
            echo "-------------------------"
            echo "Automates your daily Azure DevOps workflow."
            echo ""
            echo "Usage: ./daily.sh [options]"
            echo ""
            echo "Options:"
            echo "  --standup     Show standup report"
            echo "  --next        Get next recommended task"
            echo "  --active      Show active work"
            echo ""
            echo "Default flow:"
            echo "  1. Shows sprint status"
            echo "  2. Lists active work"
            echo "  3. Checks for blockers"
            echo "  4. Recommends next task"
            ;;
            
        "us-list"|"us-list.sh")
            echo -e "${BLUE}us-list.sh - List User Stories${NC}"
            echo "------------------------------"
            echo "Lists User Stories with filtering options."
            echo ""
            echo "Usage: ./us-list.sh [options]"
            echo ""
            echo "Options:"
            echo "  --sprint=current      Show current sprint stories"
            echo "  --sprint=<name>       Show specific sprint"
            echo "  --status=active       Show only active stories"
            echo "  --status=new          Show only new stories"
            echo "  --assigned-to=me      Show your stories"
            echo ""
            echo "Examples:"
            echo "  ./us-list.sh --sprint=current --assigned-to=me"
            echo "  ./us-list.sh --status=active"
            ;;
            
        "next-task"|"next-task.sh")
            echo -e "${BLUE}next-task.sh - Task Recommendation${NC}"
            echo "----------------------------------"
            echo "AI-powered task recommendation based on priority and context."
            echo ""
            echo "Usage: ./next-task.sh [--user=me]"
            echo ""
            echo "Considers:"
            echo "  • Task priority (P1, P2, P3)"
            echo "  • Bug severity"
            echo "  • Quick wins (small tasks)"
            echo "  • Dependencies"
            echo "  • Tags (critical, urgent)"
            echo ""
            echo "Provides:"
            echo "  • Top recommendation with reasoning"
            echo "  • Alternative tasks"
            echo "  • Task pool analysis"
            ;;
            
        "search"|"search.sh")
            echo -e "${BLUE}search.sh - Search Work Items${NC}"
            echo "-----------------------------"
            echo "Search across all work items."
            echo ""
            echo "Usage: ./search.sh <term> [options]"
            echo ""
            echo "Options:"
            echo "  --type=task|story|bug|feature"
            echo "  --state=active|closed"
            echo ""
            echo "Searches in:"
            echo "  • Title"
            echo "  • Description"
            echo "  • Tags"
            echo "  • Comments"
            echo ""
            echo "Examples:"
            echo "  ./search.sh \"authentication\""
            echo "  ./search.sh \"bug\" --type=bug --state=active"
            ;;
            
        "blocked"|"blocked.sh")
            echo -e "${BLUE}blocked.sh - Blocked Items${NC}"
            echo "--------------------------"
            echo "Shows and manages blocked work items."
            echo ""
            echo "Usage: ./blocked.sh [--resolve]"
            echo ""
            echo "Features:"
            echo "  • Lists all blocked items"
            echo "  • Shows blocker reasons"
            echo "  • Groups by type"
            echo "  • Interactive resolution mode"
            echo ""
            echo "Resolution options:"
            echo "  • Remove blocked tag"
            echo "  • Add resolution comment"
            echo "  • Reassign item"
            echo "  • Close as won't fix"
            ;;
            
        "validate"|"validate.sh")
            echo -e "${BLUE}validate.sh - Validation${NC}"
            echo "------------------------"
            echo "Validates work items for completeness."
            echo ""
            echo "Usage: ./validate.sh [options]"
            echo ""
            echo "Options:"
            echo "  --sprint=current      Validate current sprint"
            echo "  --fix                 Auto-fix common issues"
            echo ""
            echo "Validation rules:"
            echo "  • Active items have assignees"
            echo "  • Stories have points"
            echo "  • Tasks have estimates"
            echo "  • Sprint items not in 'New'"
            echo "  • Stale item detection"
            echo ""
            echo "Examples:"
            echo "  ./validate.sh --sprint=current"
            echo "  ./validate.sh --fix"
            ;;
            
        "dashboard"|"dashboard.sh")
            echo -e "${BLUE}dashboard.sh - Project Dashboard${NC}"
            echo "--------------------------------"
            echo "Comprehensive project status overview."
            echo ""
            echo "Usage: ./dashboard.sh"
            echo ""
            echo "Shows:"
            echo "  • Sprint information and progress"
            echo "  • Work items by state"
            echo "  • Sprint burndown"
            echo "  • Team activity"
            echo "  • Alerts (blocked, high priority, stale)"
            echo "  • Recent completions"
            echo ""
            echo "Updates automatically - run anytime for latest status"
            ;;
            
        *)
            echo "Unknown command: $cmd"
            echo ""
            echo "Available commands:"
            echo "  setup, daily, us-list, us-status, next-task,"
            echo "  search, blocked, validate, dashboard, sprint-report,"
            echo "  feature-list, feature-show, active-work, sync"
            echo ""
            echo "Run './help.sh' for general help"
            ;;
    esac
}

# Main logic
if [ -z "$COMMAND" ]; then
    show_general_help
else
    show_command_help "$COMMAND"
fi

echo ""
echo "---"
echo "Azure DevOps CLI v1.0"
echo "For issues: https://github.com/your-org/azure-devops-cli/issues"