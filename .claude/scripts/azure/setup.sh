#!/bin/bash
# Azure DevOps Setup Script
# One-time setup for Azure DevOps integration
# Usage: ./setup.sh

set -e

echo "🔧 Azure DevOps Integration Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env exists
if [ ! -f ".claude/.env" ]; then
    echo "Creating .env file..."
    cp .claude/.env.example .claude/.env 2>/dev/null || touch .claude/.env
fi

# Function to prompt for input
prompt_for_value() {
    local var_name=$1
    local prompt_text=$2
    local is_secret=${3:-false}
    
    echo -n "$prompt_text: "
    
    if [ "$is_secret" = true ]; then
        read -s value
        echo ""
    else
        read value
    fi
    
    echo "$var_name=$value" >> .claude/.env.tmp
}

# Collect Azure DevOps credentials
echo "📋 Azure DevOps Configuration"
echo "-----------------------------"
echo ""
echo "Please provide your Azure DevOps details:"
echo ""

# Check existing values
source .claude/.env 2>/dev/null || true

if [ -z "$AZURE_DEVOPS_PAT" ]; then
    prompt_for_value "AZURE_DEVOPS_PAT" "Personal Access Token (PAT)" true
else
    echo -e "${GREEN}✓${NC} PAT already configured"
fi

if [ -z "$AZURE_DEVOPS_ORG" ]; then
    prompt_for_value "AZURE_DEVOPS_ORG" "Organization name"
else
    echo -e "${GREEN}✓${NC} Organization: $AZURE_DEVOPS_ORG"
fi

if [ -z "$AZURE_DEVOPS_PROJECT" ]; then
    prompt_for_value "AZURE_DEVOPS_PROJECT" "Project name"
else
    echo -e "${GREEN}✓${NC} Project: $AZURE_DEVOPS_PROJECT"
fi

# Update .env if needed
if [ -f ".claude/.env.tmp" ]; then
    cat .claude/.env.tmp >> .claude/.env
    rm .claude/.env.tmp
    echo ""
    echo -e "${GREEN}✓${NC} Configuration saved"
fi

# Load updated environment
source .claude/.env

# Test connection
echo ""
echo "🔌 Testing Azure DevOps Connection"
echo "-----------------------------------"

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -u ":${AZURE_DEVOPS_PAT}" \
    "https://dev.azure.com/${AZURE_DEVOPS_ORG}/_apis/projects/${AZURE_DEVOPS_PROJECT}?api-version=7.0")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ Connection successful!${NC}"
    
    # Extract project info
    project_name=$(echo "$response" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Connected to project: $project_name"
else
    echo -e "${RED}❌ Connection failed (HTTP $http_status)${NC}"
    echo "Please check your credentials and try again"
    exit 1
fi

# Create directory structure
echo ""
echo "📁 Creating Directory Structure"
echo "-------------------------------"

directories=(
    ".claude/azure/cache/features"
    ".claude/azure/cache/stories"
    ".claude/azure/cache/tasks"
    ".claude/azure/user-stories"
    ".claude/azure/tasks"
    ".claude/azure/features"
    ".claude/azure/reports"
    ".claude/azure/imports"
    ".claude/azure/sync"
    ".claude/azure/archive"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "  ✓ Created $dir"
    else
        echo "  • $dir exists"
    fi
done

# Create config file
echo ""
echo "⚙️ Creating Configuration"
echo "-------------------------"

cat > .claude/azure/config.yml << EOF
# Azure DevOps Configuration
# Generated: $(date)

azure_devops:
  organization: ${AZURE_DEVOPS_ORG}
  project: ${AZURE_DEVOPS_PROJECT}
  api_version: "7.0"

defaults:
  area_path: ${AZURE_DEVOPS_PROJECT}
  iteration_path: ${AZURE_DEVOPS_PROJECT}
  work_item_types:
    - Feature
    - User Story
    - Task
    - Bug

sync:
  enabled: true
  interval_minutes: 15
  cache_ttl_days: 30

git:
  auto_branch: true
  branch_prefix: "azure"
  link_commits: true
  pr_template: true

features:
  time_tracking: true
  auto_assign: false
  notifications: true
  burndown_charts: true

team:
  default_capacity_hours: 6
  sprint_days: 10
  
aliases:
  enabled: true
  prefix: "az"
EOF

echo -e "${GREEN}✓${NC} Configuration created"

# Make scripts executable
echo ""
echo "🔐 Setting Script Permissions"
echo "-----------------------------"

chmod +x .claude/scripts/azure/*.sh 2>/dev/null || true
echo -e "${GREEN}✓${NC} Scripts are executable"

# Initial sync
echo ""
echo "🔄 Performing Initial Sync"
echo "--------------------------"

echo "Fetching recent work items..."
./claude/scripts/azure/sync.sh --quick 2>/dev/null || echo "Sync will be available after first command run"

# Create aliases file if not exists
if [ ! -f ".claude/commands/azure/aliases.md" ]; then
    echo ""
    echo "📝 Note: Run /azure:help to see all available commands"
fi

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}✅ Azure DevOps Setup Complete!${NC}"
echo "=================================="
echo ""
echo "📋 Quick Start Guide:"
echo "--------------------"
echo "1. Initialize in Claude: /azure:init"
echo "2. View commands: /azure:help"
echo "3. Start daily workflow: /azure:standup"
echo "4. Get next task: /azure:next-task"
echo ""
echo "📚 Documentation:"
echo "  • Commands: .claude/commands/azure/README.md"
echo "  • Aliases: .claude/commands/azure/aliases.md"
echo "  • Config: .claude/azure/config.yml"
echo ""
echo "🚀 Ready to use Azure DevOps integration!"